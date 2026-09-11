import { createServer, Socket } from "node:net";
import { once } from "node:events";
const encoder = new TextEncoder();
export const u16 = (n) => [n & 255, (n >> 8) & 255];
export const u32 = (n) => [
  n & 255,
  (n >> 8) & 255,
  (n >> 16) & 255,
  (n >>> 24) & 255,
];
const str = (text) => {
  const bytes = [...encoder.encode(text), 0];
  return [...u16(bytes.length), ...bytes];
};
export function description(
  protocol = 3,
  {
    name = "Test LEDs",
    serial = "serial-a",
    location = "usb:1",
    leds = 3,
    flags = 32,
    modeName = "Direct",
  } = {},
) {
  const mode = [
    ...str(modeName),
    ...u32(7),
    ...u32(flags),
    ...u32(0),
    ...u32(100),
    ...(protocol >= 3 ? [...u32(0), ...u32(100)] : []),
    ...u32(0),
    ...u32(0),
    ...u32(50),
    ...(protocol >= 3 ? u32(100) : []),
    ...u32(0),
    ...u32(1),
    ...u16(0),
  ];
  const body = [
    ...u32(1),
    ...str(name),
    ...str("Test Vendor"),
    ...str("Virtual SDK test fixture"),
    ...str("1.0"),
    ...str(serial),
    ...str(location),
    ...u16(1),
    ...u32(0),
    ...mode,
    ...u16(1),
    ...str("Main"),
    ...u32(1),
    ...u32(0),
    ...u32(leds),
    ...u32(leds),
    ...u16(0),
    ...u16(leds),
  ];
  for (let i = 0; i < leds; i++) body.push(...str("LED " + i), ...u32(i));
  body.push(...u16(leds));
  for (let i = 0; i < leds; i++) body.push(0, 0, 0, 0);
  return new Uint8Array([...u32(body.length + 4), ...body]);
}
export function wire(command, device = 0, body = []) {
  return new Uint8Array([
    79,
    82,
    71,
    66,
    ...u32(device),
    ...u32(command),
    ...u32(body.length),
    ...body,
  ]);
}
export function inspect(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    command: v.getUint32(8, true),
    device: v.getUint32(4, true),
    body: data.slice(16),
  };
}
export class FakeSocket {
  constructor(options = {}) {
    this.options = options;
    this.queue = [];
    this.calls = [];
    this.closed = false;
    this.protocol = options.protocol ?? 3;
  }
  emit(bytes) {
    if (this.closed) return;
    if (this.waiter) {
      const { resolve } = this.waiter;
      this.waiter = null;
      resolve(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
      );
    } else this.queue.push(bytes);
  }
  async read() {
    if (this.closed) throw new Error("closed");
    if (this.queue.length) {
      const bytes = this.queue.shift();
      return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
    }
    if (this.waiter) throw new Error("concurrent read");
    return new Promise(
      (resolve, reject) => (this.waiter = { resolve, reject }),
    );
  }
  async write(bytes) {
    if (this.closed) throw new Error("closed");
    const message = inspect(bytes);
    this.calls.push(message);
    if (this.options.stall?.(message))
      await new Promise(
        (resolve, reject) => (this.stalled = { resolve, reject }),
      );
    if (this.closed) throw new Error("closed");
    if (this.options.ignore === message.command) return;
    const devices = this.options.devices ?? [{}];
    if (message.command === 40) this.emit(wire(40, 0, u32(this.protocol)));
    if (message.command === 0) this.emit(wire(0, 0, u32(devices.length)));
    if (message.command === 1) {
      const protocol = new DataView(message.body.buffer).getUint32(0, true);
      this.emit(
        wire(1, message.device, description(protocol, devices[message.device])),
      );
    }
  }
  async end() {}
  async close() {
    if (this.closed) return;
    this.closed = true;
    this.waiter?.reject(new Error("closed"));
    this.waiter = null;
    this.stalled?.reject(new Error("closed"));
    this.stalled = null;
  }
}
export async function sdkServer(t, options = {}) {
  const peers = new Set(),
    messages = [];
  const server = createServer((socket) => {
    peers.add(socket);
    socket.on("close", () => peers.delete(socket));
    socket.on("error", () => {});
    let pending = Buffer.alloc(0);
    socket.on("data", (bytes) => {
      pending = Buffer.concat([pending, bytes]);
      while (
        pending.length >= 16 &&
        pending.length >= 16 + pending.readUInt32LE(12)
      ) {
        const size = 16 + pending.readUInt32LE(12),
          message = inspect(pending.subarray(0, size));
        pending = pending.subarray(size);
        messages.push(message);
        let response;
        if (message.command === 40)
          response = wire(40, 0, u32(options.protocol ?? 5));
        if (message.command === 0) response = wire(0, 0, u32(1));
        if (message.command === 1)
          response = wire(
            1,
            message.device,
            description(new DataView(message.body.buffer).getUint32(0, true)),
          );
        if (response) {
          socket.write(response.subarray(0, 7));
          socket.write(response.subarray(7));
        }
      }
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    peers.forEach((s) => s.destroy());
    await new Promise((resolve) => server.close(resolve));
  });
  const address = server.address();
  return { port: address.port, messages, peers };
}
export const nodeTcp = {
  async connect({ host, port, signal, keepAlive, keepAliveInitialDelayMs }) {
    signal?.throwIfAborted();
    const socket = new Socket();
    socket.on("error", () => {});
    const abort = () => socket.destroy(signal.reason);
    signal?.addEventListener("abort", abort, { once: true });
    socket.once("close", () => signal?.removeEventListener("abort", abort));
    socket.setNoDelay(true);
    socket.setKeepAlive(keepAlive, keepAliveInitialDelayMs);
    socket.connect(port, host);
    await once(socket, "connect");
    const iterator = socket[Symbol.asyncIterator]();
    return {
      read: async () => {
        const next = await iterator.next();
        return next.done ? null : Uint8Array.from(next.value).buffer;
      },
      write: (data) =>
        new Promise((resolve, reject) =>
          socket.write(data, (e) => (e ? reject(e) : resolve())),
        ),
      end: () =>
        new Promise((resolve, reject) =>
          socket.end((e) => (e ? reject(e) : resolve())),
        ),
      close: async () => {
        socket.destroy();
      },
    };
  },
};
