import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  description,
  wire,
  u32,
  FakeSocket,
  sdkServer,
  nodeTcp,
} from "./openrgb-fixtures.mjs";
const source = await readFile(
  new URL("../openrgb/index.js", import.meta.url),
  "utf8",
);
const api = await import(
  "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);
const {
  packet,
  PacketReader,
  parseController,
  modePayload,
  colorsPayload,
  OpenRgbClient,
  OpenRgbRuntime,
  renderColors,
  normalizeSettings,
  deviceKey,
} = api;
const flush = () => new Promise((resolve) => setImmediate(resolve));
const playing = {
  state: "playing",
  rms: 0.6,
  bins: [0.1, 0.2, 0.9, 0.4],
  minFrequency: 20,
  maxFrequency: 20000,
};

function runtimeFixture(t, options = {}) {
  let time = 0,
    id = 0,
    subscriber = null,
    subscriptions = 0,
    off = 0;
  const timers = new Map(),
    sockets = [];
  const clock = {
    now: () => time,
    random: () => 0,
    setTimeout: (f, delay) => {
      timers.set(++id, { f, at: time + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  const state = {
    settings: normalizeSettings({ enabled: true, ...options.settings }),
    devices: [],
    error: "",
  };
  const ctx = {
    net: {
      tcp: {
        connect: async (config) => {
          const socket = new FakeSocket(options);
          sockets.push(socket);
          config.signal.addEventListener("abort", () => void socket.close(), {
            once: true,
          });
          return socket;
        },
      },
    },
    audio: {
      spectrum: {
        subscribe: (_options, fn) => {
          subscriber = fn;
          subscriptions++;
          return () => {
            off++;
            subscriber = null;
          };
        },
      },
    },
  };
  const runtime = new OpenRgbRuntime(ctx, state, clock);
  t.after(() => runtime.dispose());
  return {
    runtime,
    state,
    sockets,
    timers,
    frame: (frame) => subscriber?.(frame),
    counts: () => ({ subscriptions, off }),
    async advance(ms = 100) {
      time += ms;
      const due = [...timers].filter(([, t]) => t.at <= time);
      for (const [id, t] of due) {
        timers.delete(id);
        t.f();
      }
      await flush();
    },
    async select() {
      runtime.apply({
        ...state.settings,
        selected: state.devices.filter((d) => d.supported).map((d) => d.key),
      });
      await this.advance();
    },
  };
}

test("wire encoding matches fixed little-endian vectors and RGB byte order", () => {
  assert.equal(
    Buffer.from(packet(40, 0, new Uint8Array(u32(3)))).toString("hex"),
    "4f52474200000000280000000400000003000000",
  );
  assert.equal(
    Buffer.from(colorsPayload(new Uint8Array([255, 128, 1, 2, 3, 4]))).toString(
      "hex",
    ),
    "0e0000000200ff80010002030400",
  );
});

test("packet reader handles every split point, one-byte fragmentation and coalesced empty packets", () => {
  const bytes = Buffer.concat([
    wire(40, 0, u32(3)),
    wire(100),
    wire(1, 2, [1, 2, 3]),
  ]);
  for (let split = 0; split <= bytes.length; split++) {
    const reader = new PacketReader(),
      received = [];
    reader.push(bytes.subarray(0, split), (p) => received.push(p));
    reader.push(bytes.subarray(split), (p) => received.push(p));
    assert.deepEqual(
      received.map((p) => [p.command, p.device, [...p.body]]),
      [
        [40, 0, [3, 0, 0, 0]],
        [100, 0, []],
        [1, 2, [1, 2, 3]],
      ],
    );
  }
  const r = new PacketReader(),
    frames = [];
  for (const b of bytes) r.push(new Uint8Array([b]), (p) => frames.push(p));
  assert.equal(frames.length, 3);
});

test("invalid magic, oversized messages and truncated device descriptions are rejected", () => {
  assert.throws(
    () => new PacketReader().push(new Uint8Array(16), () => {}),
    /标识/,
  );
  const large = wire(1);
  new DataView(large.buffer).setUint32(12, 1048577, true);
  assert.throws(() => new PacketReader().push(large, () => {}), /1 MiB/);
  const full = description();
  for (let n = 0; n < full.length; n++)
    assert.throws(() => parseController(full.subarray(0, n), 3, 0));
  const invalid = full.slice();
  new DataView(invalid.buffer).setUint32(0, 12345, true);
  assert.throws(() => parseController(invalid, 3, 0), /长度/);
});

for (const version of [1, 2, 3])
  test(`parses protocol ${version} modes, zones and LED counts`, () => {
    const d = parseController(description(version), version, 7);
    assert.equal(d.name, "Test LEDs");
    assert.equal(d.index, 7);
    assert.equal(d.ledCount, 3);
    assert.equal(d.zones[0].count, 3);
    assert.equal(d.supported, true);
    const payload = modePayload(d.direct),
      view = new DataView(payload.buffer);
    assert.equal(view.getUint32(0, true), payload.length);
    assert.equal(view.getUint32(4, true), 0);
    assert.equal(view.getUint32(8 + d.direct.colorModeOffset, true), 1);
  });

test("non-Direct, automatic-save and non-per-LED modes cannot be selected", () => {
  for (const options of [
    { modeName: "Static" },
    { modeName: "Custom" },
    { flags: 32 | 512 },
    { flags: 64 },
    { leds: 0 },
  ])
    assert.equal(
      parseController(description(3, options), 3, 0).supported,
      false,
    );
});

test("device identities survive reordering and remain scoped to server and physical identity", () => {
  const d = parseController(description(), 3, 0),
    settings = normalizeSettings();
  assert.equal(
    deviceKey(d, settings),
    deviceKey({ ...d, index: 99 }, settings),
  );
  assert.notEqual(
    deviceKey(d, settings),
    deviceKey({ ...d, serial: "other" }, settings),
  );
  assert.notEqual(
    deviceKey(d, settings),
    deviceKey(d, { ...settings, host: "192.168.1.2" }),
  );
});

test(
  "real TCP SDK handshake negotiates down, enumerates and sends per-device colors",
  { timeout: 5000 },
  async (t) => {
    const server = await sdkServer(t);
    const socket = await nodeTcp.connect({
      host: "127.0.0.1",
      port: server.port,
      keepAlive: true,
      keepAliveInitialDelayMs: 1000,
    });
    const client = new OpenRgbClient(socket);
    t.after(() => client.close());
    const devices = await client.initialize();
    assert.equal(client.protocol, 3);
    assert.equal(devices[0].ledCount, 3);
    await client.send(1101, 0, modePayload(devices[0].direct));
    await client.send(
      1050,
      0,
      colorsPayload(new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255])),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(
      server.messages.map((p) => p.command),
      [40, 50, 0, 1, 1101, 1050],
    );
    assert.equal(server.messages[1].body.at(-1), 0);
    assert.deepEqual([...server.messages[3].body], [3, 0, 0, 0]);
  },
);

test("missing response times out and closes the stream without leaving a pending request", async () => {
  const socket = new FakeSocket({ ignore: 40 }),
    failures = [];
  const client = new OpenRgbClient(socket, (e) => failures.push(e), 20);
  await assert.rejects(client.initialize(), /超时/);
  assert.equal(socket.closed, true);
  assert.equal(client.pending, null);
  assert.equal(failures.length, 1);
});

test("device list change cancels pending discovery instead of publishing stale indices", async () => {
  const socket = new FakeSocket({ ignore: 1 }),
    client = new OpenRgbClient(socket);
  const pending = assert.rejects(client.initialize(), /设备列表/);
  await flush();
  socket.emit(wire(100));
  await pending;
  assert.equal(socket.closed, true);
});

test("silence, pause, stale audio and brightness zero produce black; hold preserves the output", () => {
  const d = { ledCount: 8 },
    settings = normalizeSettings();
  for (const frame of [
    null,
    { ...playing, state: "paused" },
    { ...playing, bins: [0, 0], rms: 0 },
  ])
    assert(renderColors(d, frame, settings).rgb.every((n) => n === 0));
  assert(
    renderColors(d, playing, { ...settings, brightness: 0 }).rgb.every(
      (n) => n === 0,
    ),
  );
  assert(
    renderColors(d, playing, settings, [1, 1], 50, true).rgb.every(
      (n) => n === 0,
    ),
  );
  assert.equal(renderColors(d, null, { ...settings, pause: "hold" }), null);
});

test("light output stays bounded, uses actual bin count and supports all effects and palettes", () => {
  for (const effect of ["spectrum", "pulse", "bass"])
    for (const palette of ["aurora", "ember", "ice"]) {
      const settings = normalizeSettings({
        effect,
        palette,
        gain: 5,
        brightness: 70,
      });
      const frame = {
        ...playing,
        bins: Array.from({ length: 257 }, (_, i) => (i % 9) / 8),
      };
      const result = renderColors({ ledCount: 127 }, frame, settings, [], 100);
      assert.equal(result.rgb.length, 381);
      assert(result.rgb.some((v) => v > 0));
      assert(result.rgb.every((v) => v <= Math.ceil(255 * 0.7)));
      assert(result.levels.every((v) => v >= 0 && v <= 1));
    }
});

test("runtime discovery never claims unselected devices or starts an audio subscription", async (t) => {
  const f = runtimeFixture(t);
  await f.runtime.connect();
  await flush();
  assert.equal(f.state.connected, true);
  assert.equal(f.counts().subscriptions, 0);
  assert.equal(f.sockets[0].calls.filter((p) => p.command >= 1000).length, 0);
});

test("runtime selects devices, sends current frames and unsubscribes after deselection", async (t) => {
  const f = runtimeFixture(t);
  await f.runtime.connect();
  await f.select();
  assert.equal(f.counts().subscriptions, 1);
  f.frame(playing);
  await f.advance(100);
  const calls = f.sockets[0].calls;
  assert.equal(calls.filter((p) => p.command === 1101).length, 1);
  assert(
    calls
      .filter((p) => p.command === 1050)
      .at(-1)
      .body.slice(6)
      .some((v) => v > 0),
  );
  const before = calls.length;
  f.runtime.apply({ ...f.state.settings, selected: [] });
  await f.advance(100);
  assert.equal(calls.length, before);
  assert.equal(f.counts().off, 1);
});

test("slow writes keep one batch in flight and consume the newest audio frame", async (t) => {
  let stall = true;
  const f = runtimeFixture(t, {
    stall: (p) => p.command === 1050 && stall,
    settings: { effect: "pulse", smoothing: 0 },
  });
  await f.runtime.connect();
  await f.select();
  const socket = f.sockets[0];
  assert(socket.stalled);
  for (let i = 0; i < 100; i++) f.frame({ ...playing, rms: i / 100 });
  await f.advance(1000);
  assert.equal(socket.calls.filter((p) => p.command === 1050).length, 1);
  stall = false;
  socket.stalled.resolve();
  await flush();
  f.frame({ ...playing, rms: 1 });
  await f.advance(100);
  assert.equal(socket.calls.filter((p) => p.command === 1050).length, 2);
  assert(
    socket.calls
      .filter((p) => p.command === 1050)[1]
      .body.slice(6)
      .some((v) => v > 80),
  );
});

test("list changes invalidate old handles, rediscover and reconnect using stable identity", async (t) => {
  const options = {
    devices: [{ serial: "a" }, { serial: "b", location: "usb:2" }],
  };
  const f = runtimeFixture(t, options);
  await f.runtime.connect();
  f.runtime.apply({ ...f.state.settings, selected: [f.state.devices[0].key] });
  await f.advance();
  const old = f.sockets[0];
  old.emit(wire(100));
  await flush();
  assert.equal(old.closed, true);
  assert.equal(f.state.connected, false);
  assert.equal(f.counts().off, 1);
  options.devices.reverse();
  await f.advance(1000);
  await flush();
  const next = f.sockets[1];
  assert(next);
  assert.equal(next.calls.find((p) => p.command === 1101).device, 1);
});

test("disposal cancels pending writes and every timer without late reconnect", async (t) => {
  const f = runtimeFixture(t, { stall: (p) => p.command === 1050 });
  await f.runtime.connect();
  await f.select();
  f.runtime.dispose();
  await flush();
  await f.advance(60000);
  assert.equal(f.sockets.length, 1);
  assert.equal(f.sockets[0].closed, true);
  assert.equal(f.timers.size, 0);
  assert.equal(f.counts().off, 1);
});

test("failed connects back off and manual stop cancels retry", async (t) => {
  const f = runtimeFixture(t);
  let count = 0;
  f.runtime.ctx.net.tcp.connect = async () => {
    count++;
    throw new Error("server offline");
  };
  await f.runtime.connect();
  assert.match(f.state.status, /1 秒/);
  await f.advance(1000);
  assert.match(f.state.status, /2 秒/);
  f.runtime.apply({ ...f.state.settings, enabled: false });
  await f.advance(60000);
  assert.equal(count, 2);
  assert.equal(f.timers.size, 0);
});

test("ambiguous identities cannot be claimed and background operation does not depend on DOM", async (t) => {
  const f = runtimeFixture(t, { devices: [{}, {}] });
  await f.runtime.connect();
  assert(f.state.devices.every((d) => !d.supported && /重复/.test(d.reason)));
  assert.doesNotMatch(
    source,
    /document\.|requestAnimationFrame|visibilitychange|BroadcastChannel/,
  );
  const manifest = JSON.parse(
    await readFile(
      new URL("../openrgb/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(manifest.capabilities, { audioSpectrum: true, tcp: true });
  assert.notEqual(manifest.runtime?.miniPlayer, true);
  assert.notEqual(manifest.runtime?.desktopLyric, true);
});

test("reselecting a device reclaims Direct mode and resends its colors", async (t) => {
  const f = runtimeFixture(t);
  await f.runtime.connect();
  await f.select();
  const selected = f.state.settings.selected;
  f.runtime.apply({ ...f.state.settings, selected: [] });
  f.runtime.apply({ ...f.state.settings, selected });
  await f.advance();
  assert.equal(f.sockets[0].calls.filter((p) => p.command === 1101).length, 2);
  assert.equal(f.sockets[0].calls.filter((p) => p.command === 1050).length, 2);
});

test("deselection during mode write prevents late colors and keeps the scheduler alive", async (t) => {
  let stall = true;
  const f = runtimeFixture(t, { stall: (p) => p.command === 1101 && stall });
  await f.runtime.connect();
  await f.select();
  const selected = f.state.settings.selected;
  f.runtime.apply({ ...f.state.settings, selected: [] });
  stall = false;
  f.sockets[0].stalled.resolve();
  await flush();
  assert.equal(f.sockets[0].calls.filter((p) => p.command === 1050).length, 0);
  f.runtime.apply({ ...f.state.settings, selected });
  await f.advance();
  assert.equal(f.sockets[0].calls.filter((p) => p.command === 1101).length, 2);
  assert.equal(f.sockets[0].calls.filter((p) => p.command === 1050).length, 1);
});

test("stopping during handshake closes a late connection without starting discovery", async (t) => {
  const f = runtimeFixture(t);
  let resolve;
  f.runtime.ctx.net.tcp.connect = () =>
    new Promise((r) => {
      resolve = r;
    });
  const connect = f.runtime.connect();
  f.runtime.apply({ ...f.state.settings, enabled: false });
  const late = new FakeSocket();
  resolve(late);
  await connect;
  assert.equal(late.closed, true);
  assert.equal(late.calls.length, 0);
  assert.equal(f.timers.size, 0);
});
