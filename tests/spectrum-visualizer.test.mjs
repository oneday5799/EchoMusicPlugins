import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../spectrum-visualizer/index.js", import.meta.url),
  "utf8",
);
const plugin = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("normalizes fog settings while preserving legacy defaults", () => {
  assert.equal(plugin.normalizeSettings({ mode: "mist" }).mode, "mist");
  assert.equal(plugin.normalizeSettings({ mode: "centered" }).mode, "centered");
  assert.equal(plugin.normalizeSettings({}).palette, "theme");
  assert.equal(plugin.normalizeSettings({}).mistIntensity, 78);
  assert.equal(plugin.normalizeSettings({}).mistSoftness, 72);
  assert.equal(plugin.normalizeSettings({}).mistMotion, 42);
  assert.equal(plugin.normalizeSettings({}).centeredBarWidth, 2);
  assert.equal(
    plugin.normalizeSettings({ mistSoftness: 160 }).mistSoftness,
    100,
  );
  assert.equal(plugin.normalizeSettings({ mistMotion: -20 }).mistMotion, 0);
  assert.equal(
    plugin.normalizeSettings({ mistIntensity: 120 }).mistIntensity,
    100,
  );
  assert.equal(
    plugin.normalizeSettings({ mistIntensity: 0 }).mistIntensity,
    35,
  );
  assert.equal(plugin.normalizeSettings({ mode: "unknown" }).mode, "bars");
  assert.equal(
    plugin.normalizeSettings({ centeredBarWidth: 0 }).centeredBarWidth,
    1,
  );
  assert.equal(
    plugin.normalizeSettings({ centeredBarWidth: 20 }).centeredBarWidth,
    8,
  );
});

test("provides a fresh complete settings snapshot for reset", () => {
  const first = plugin.getDefaultSettings();
  const second = plugin.getDefaultSettings();

  assert.deepEqual(first, plugin.DEFAULT_SETTINGS);
  assert.notEqual(first, second);
  first.mode = "mist";
  assert.equal(second.mode, "bars");
});

test("uses a stable theme palette fallback outside the renderer", () => {
  assert.deepEqual(plugin.resolvePaletteColors("theme"), [
    "#0071e3",
    "#5ac8fa",
    "#7c6cff",
  ]);
  assert.deepEqual(plugin.resolvePaletteColors("ember"), [
    "#ffe08a",
    "#ff8f4a",
    "#ff4d7d",
  ]);
});

test("resolves the active host theme colors for canvas rendering", () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    getComputedStyle: () => ({
      getPropertyValue: (name) =>
        ({
          "--color-primary": "rgb(12, 34, 56)",
          "--color-secondary": "rgb(78, 90, 123)",
          "--color-primary-hover": "rgb(23, 45, 67)",
        })[name] || "",
    }),
  };

  try {
    assert.deepEqual(plugin.resolvePaletteColors("theme", {}), [
      "rgb(12, 34, 56)",
      "rgb(78, 90, 123)",
      "rgb(23, 45, 67)",
    ]);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("requests waveform data only for waveform-based modes", () => {
  const mist = plugin.normalizeSettings({ mode: "mist" });
  const bars = plugin.normalizeSettings({ mode: "bars" });
  const wave = plugin.normalizeSettings({ mode: "wave" });
  const hybrid = plugin.normalizeSettings({ mode: "hybrid" });
  const centered = plugin.normalizeSettings({ mode: "centered" });

  assert.equal(plugin.toSubscriptionOptions(mist).includeWaveform, false);
  assert.equal(plugin.toSubscriptionOptions(bars).includeWaveform, false);
  assert.equal(plugin.toSubscriptionOptions(wave).includeWaveform, true);
  assert.equal(plugin.toSubscriptionOptions(hybrid).includeWaveform, true);
  assert.equal(plugin.toSubscriptionOptions(centered).includeWaveform, false);
  assert.equal(plugin.toSubscriptionOptions(centered).binCount, 128);
});

test("builds a symmetric centered profile with responsive attack and soft decay", () => {
  const profile = plugin.buildCenteredProfile([1, 0.6, 0.2, 0], 9);

  assert.equal(profile.length, 9);
  assert.deepEqual(profile, [...profile].reverse());
  assert.equal(profile[4] > profile[0], true);

  const attacked = plugin.updateCenteredDisplay(Array(9).fill(0), profile);
  const decayed = plugin.updateCenteredDisplay(attacked, Array(9).fill(0));
  assert.equal(attacked[4], profile[4] * 0.4);
  assert.equal(decayed[4], attacked[4] * 0.88);

  const interpolated = plugin.buildCenteredProfile([1, 0], 17);
  assert.equal(new Set(interpolated).size > 2, true);
});

test("uses a denser default centered spectrum layout", () => {
  const dense = plugin.getCenteredBarLayout(700);
  const sparse = plugin.getCenteredBarLayout(700, 4);

  assert.equal(dense.barWidth, 2);
  assert.equal(dense.count, 140);
  assert.equal(sparse.count, 100);
  assert.equal(dense.count > sparse.count, true);
});

test("releases canvas backing storage and layer caches", () => {
  const entry = {
    canvas: { width: 1920, height: 180 },
    centeredDisplay: [0.2, 0.4],
    paletteCache: { colors: ["#fff"], at: 1 },
  };

  assert.equal(plugin.releaseLayerResources(entry), true);
  assert.equal(entry.canvas.width, 1);
  assert.equal(entry.canvas.height, 1);
  assert.equal(entry.centeredDisplay, null);
  assert.equal(entry.paletteCache, null);
  assert.equal(plugin.releaseLayerResources(entry), false);
});

test("builds a bounded and smoothed fog profile from spectrum bins", () => {
  const profile = plugin.buildMistProfile(
    new Float32Array([0, 0.1, 0.8, 1, 0.42, 0.08, 0]),
    24,
  );

  assert.equal(profile.length, 24);
  assert.equal(
    profile.every((value) => Number.isFinite(value)),
    true,
  );
  assert.equal(
    profile.every((value) => value >= 0 && value <= 1),
    true,
  );
  assert.equal(Math.max(...profile) > 0.5, true);
  assert.equal(
    profile
      .slice(1)
      .every((value, index) => Math.abs(value - profile[index]) < 0.5),
    true,
  );
  assert.deepEqual(plugin.buildMistProfile([], 12), Array(12).fill(0));
  assert.equal(plugin.buildMistProfile([], 2).length, 8);
  assert.equal(plugin.buildMistProfile([], 200).length, 64);
});

test("keeps the default fog layers visible without excessive blur", () => {
  const settings = plugin.normalizeSettings({ mode: "mist" });
  const layers = plugin.getMistRenderLayers(settings, 0.5);

  assert.equal(layers.length, 3);
  assert.equal(layers[0].alpha > 0.4, true);
  assert.equal(
    layers.every((layer) => layer.blur >= 4 && layer.blur <= 12),
    true,
  );
  assert.equal(layers[2].scale > layers[0].scale, true);
});

test("plugin package exposes the fog mode as a feature release", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../spectrum-visualizer/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const readme = await readFile(
    new URL("../spectrum-visualizer/README.md", import.meta.url),
    "utf8",
  );

  assert.equal(manifest.version, "1.2.0");
  assert.match(manifest.description, /雾状/);
  assert.match(readme, /雾化柔度/);
  assert.match(readme, /中心频谱/);
  assert.match(source, /中心频谱/);
  assert.match(source, /恢复默认/);
  assert.match(source, /当前播放音频的频谱数据/);
  assert.doesNotMatch(source, /系统音频/);
  assert.doesNotMatch(source, /echo-spectrum-mist-note/);
  assert.equal(typeof plugin.activate, "function");
  assert.equal(typeof plugin.deactivate, "function");
});

test("HDR is opt-in across all enabled positions and modes", () => {
  assert.equal(plugin.normalizeSettings({}).hdrHighlights, false);
  assert.equal(
    plugin.normalizeSettings({ hdrIntensity: 900 }).hdrIntensity,
    100,
  );
  assert.equal(plugin.normalizeSettings({ hdrIntensity: -1 }).hdrIntensity, 0);
  const settings = plugin.normalizeSettings({
    mode: "centered",
    hdrHighlights: true,
  });
  assert.equal(plugin.shouldUseHdrLayer("lyric", settings), true);
  for (const kind of ["playerbar", "mini", "lyric"]) {
    for (const mode of ["bars", "wave", "hybrid", "mist", "centered"]) {
      assert.equal(
        plugin.shouldUseHdrLayer(kind, {
          ...settings,
          mode,
          showPlayerBar: true,
          showMiniPlayer: true,
        }),
        true,
      );
    }
  }
  assert.equal(plugin.shouldUseHdrLayer("mini", settings), false);
  assert.equal(plugin.shouldUseHdrLayer("playerbar", settings), false);
  for (const patch of [
    { enabled: false },
    { showLyricControls: false },
    { hdrHighlights: false },
    { hdrIntensity: 0 },
  ]) {
    assert.equal(
      plugin.shouldUseHdrLayer("lyric", { ...settings, ...patch }),
      false,
    );
  }
});

test("HDR peak smoothing ignores quiet bins and remains stable across frame rates", () => {
  assert.deepEqual(plugin.updateHdrLevels(null, [0, 0.1, 0.35]), [0, 0, 0]);
  const a = plugin.updateHdrLevels(null, [1], 100);
  const b = plugin.updateHdrLevels(
    plugin.updateHdrLevels(null, [1], 50),
    [1],
    50,
  );
  assert.ok(Math.abs(a[0] - b[0]) < 1e-8);
  const falling = plugin.updateHdrLevels(a, [0], 100)[0];
  assert.ok(falling > 0 && falling < a[0]);
});

const hdrSettings = plugin.normalizeSettings({
  mode: "centered",
  hdrHighlights: true,
});
const entryForHdr = () => ({
  kind: "lyric",
  layer: { isConnected: true, dataset: {}, appendChild() {} },
});
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

function mockSurface(pipelinePromise) {
  let status = { status: "ready", dynamicRange: "hdr" };
  let listener;
  const buffers = [];
  const surface = {
    canvas: {},
    disposed: 0,
    unsubscribed: 0,
    device: {
      createShaderModule: () => ({}),
      createRenderPipelineAsync: () =>
        pipelinePromise || Promise.resolve({ getBindGroupLayout: () => ({}) }),
      createBuffer: () => {
        const buffer = {
          destroyed: 0,
          destroy() {
            this.destroyed++;
          },
        };
        buffers.push(buffer);
        return buffer;
      },
      createBindGroup: () => ({}),
    },
    getState: () => status,
    onStateChanged(cb) {
      listener = cb;
      cb(status);
      return () => surface.unsubscribed++;
    },
    change(next) {
      status = next;
      listener?.(next);
    },
    dispose() {
      this.disposed++;
    },
    buffers,
  };
  return surface;
}

test("late HDR initialization cannot resurrect a disabled or removed layer", async () => {
  for (const duringPipeline of [false, true]) {
    const pending = deferred();
    const entry = entryForHdr();
    const surface = mockSurface(duringPipeline ? pending.promise : undefined);
    const task = plugin.syncHdrLayer(
      entry,
      hdrSettings,
      {
        createCanvas: () =>
          duringPipeline ? Promise.resolve(surface) : pending.promise,
      },
      () => {},
    );
    await Promise.resolve();
    plugin.releaseHdrLayer(entry);
    pending.resolve(duringPipeline ? {} : surface);
    await task;
    assert.equal(surface.disposed, 1);
    assert.equal(entry.hdrSurface, null);
    assert.equal(entry.layer.dataset.hdr, undefined);
  }
});

test("HDR surface changes and device loss restore SDR and release resources", async () => {
  const oldUsage = globalThis.GPUBufferUsage;
  globalThis.GPUBufferUsage = { UNIFORM: 1, COPY_DST: 2, STORAGE: 4 };
  try {
    const entry = entryForHdr();
    const surface = mockSurface();
    await plugin.syncHdrLayer(
      entry,
      hdrSettings,
      { createCanvas: async () => surface },
      () => {},
    );
    assert.equal(entry.layer.dataset.hdr, "true");
    surface.change({ status: "ready", dynamicRange: "sdr" });
    assert.equal(entry.layer.dataset.hdr, undefined);
    assert.equal(surface.canvas.hidden, true);
    surface.change({ status: "lost", dynamicRange: "sdr" });
    assert.equal(entry.hdrSurface, null);
    assert.equal(entry.hdrUnavailable, true);
    assert.equal(surface.disposed, 1);
    assert.ok(surface.buffers.every((b) => b.destroyed === 1));
    plugin.releaseHdrLayer(entry);
    assert.equal(surface.disposed, 1);
  } finally {
    if (oldUsage === undefined) delete globalThis.GPUBufferUsage;
    else globalThis.GPUBufferUsage = oldUsage;
  }
});

test("idle audio clears previous highlights without rendering another GPU frame", () => {
  const entry = entryForHdr();
  entry.hdrSurface = mockSurface();
  entry.hdrSurface.render = () => assert.fail("idle should not render");
  entry.hdrFrame = { active: true };
  entry.hdrLevels = [1];
  plugin.drawHdrHighlights(
    entry,
    100,
    80,
    { state: "idle" },
    hdrSettings,
    ["white"],
    100,
  );
  assert.equal(entry.hdrFrame.active, false);
  assert.equal(entry.hdrSurface.canvas.hidden, true);
  assert.equal(entry.hdrLevels, null);
});

test("HDR geometry follows SDR bar baselines at every position", () => {
  for (const kind of ["lyric", "playerbar", "mini"]) {
    const entry = { kind, centeredDisplay: [1, 0.5] };
    const bottom = 80 - (kind === "lyric" ? 4 : 8);
    const settings = plugin.normalizeSettings({ fill: 50 });
    const bars = plugin.buildHdrGeometry(
      entry,
      100,
      80,
      { bins: [1, 0] },
      settings,
      0,
    );
    assert.equal(bars.ys[0], bottom - 40);
    assert.equal(bars.ys[1], bottom - 2);
    assert.equal(bars.mode, 0);
    const centered = plugin.buildHdrGeometry(
      entry,
      100,
      80,
      {},
      { ...settings, mode: "centered" },
      0,
    );
    assert.equal(centered.ys[0], bottom - 40);
    assert.equal(centered.ys[1], bottom - 20);
    const hybrid = plugin.buildHdrGeometry(
      entry,
      100,
      80,
      { bins: [1, 0] },
      { ...settings, mode: "hybrid" },
      0,
    );
    assert.deepEqual(hybrid, bars);
  }
});

test("wave highlighter follows waveform sign, amplitude and empty-data state", () => {
  const settings = plugin.normalizeSettings({ mode: "wave", fill: 50 });
  const geometry = plugin.buildHdrGeometry(
    { kind: "lyric" },
    100,
    80,
    { waveform: [0, 1, -1, 0] },
    settings,
    0,
  );
  assert.deepEqual(geometry.ys, [40, 50, 30, 40]);
  assert.deepEqual(geometry.levels, [1, 1, 1]);
  assert.equal(geometry.mode, 1);
  assert.equal(
    plugin.buildHdrGeometry({ kind: "mini" }, 100, 80, {}, settings, 0).count,
    0,
  );
});

test("fog highlighter has finite bounded geometry and tracks original drift", () => {
  const settings = plugin.normalizeSettings({ mode: "mist" });
  for (const kind of ["lyric", "playerbar", "mini"]) {
    const build = (time) =>
      plugin.buildHdrGeometry(
        { kind },
        600,
        80,
        { bins: [0.1, 0.8, 1, 0.6, 0.2], rms: 0.5 },
        settings,
        time,
      );
    const first = build(0),
      later = build(1000);
    assert.equal(first.mode, 2);
    assert.ok(first.count <= 256);
    assert.equal(first.ys.length, first.count + 1);
    assert.ok(first.ys.every(Number.isFinite));
    assert.ok(first.levels.every((value) => value >= 0 && value <= 1));
    assert.notDeepEqual(first.ys, later.ys);
  }
});

test("all HDR modes upload matching geometry and use the host render submission", () => {
  for (const mode of ["centered", "bars", "hybrid", "wave", "mist"]) {
    const entry = entryForHdr();
    const settings = plugin.normalizeSettings({ mode, hdrHighlights: true });
    const writes = [];
    let draws = 0;
    entry.hdrSurface = mockSurface();
    entry.hdrUniform = {};
    entry.hdrBuffer = {};
    entry.hdrPipeline = {};
    entry.hdrBindGroup = {};
    entry.centeredDisplay = Array(20).fill(0.9);
    entry.hdrColorCache = { cssColor: "white", color: [1, 1, 1] };
    entry.hdrSurface.render = (draw) =>
      draw({
        device: {
          queue: {
            writeBuffer: (_buffer, _offset, data) => writes.push(data.slice()),
          },
        },
        encoder: {
          beginRenderPass: () => ({
            setPipeline() {},
            setBindGroup() {},
            draw() {
              draws++;
            },
            end() {},
          }),
        },
        view: {},
        width: 200,
        height: 160,
      });
    plugin.drawHdrHighlights(
      entry,
      100,
      80,
      { state: "playing", bins: [0.9, 1, 0.8], waveform: [0, 1, -1, 0] },
      settings,
      ["white"],
      100,
    );
    assert.equal(draws, 1);
    assert.equal(entry.hdrSurface.canvas.hidden, false);
    const [params, geometry] = writes;
    assert.equal(params.byteLength, 48);
    assert.equal(new Uint32Array(params.buffer)[9] * 4, geometry.length);
    assert.equal(params[11], mode === "wave" ? 1 : mode === "mist" ? 2 : 0);
    assert.ok(geometry.every(Number.isFinite));
  }
});
