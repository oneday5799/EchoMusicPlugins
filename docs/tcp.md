# TCP 网络 API

`ctx.net.tcp` 通过 Electron 主进程的 Node.js Socket 连接 TCP 服务，适合 OpenRGB SDK 和其他二进制设备协议。该 API 随 EchoMusic `2.3.2-beta.4` 引入（当前待发布），包含 `AbortSignal`、`end()` 和 keepalive 支持。依赖此接口的插件应声明 `requires.echoMusicVersion: ">=2.3.2-beta.4"` 并保留运行时能力检测；`2.3.2-beta.3` 发布版不包含 TCP API。

## 能力与连接

在 manifest 中声明独立能力：

```json
{ "capabilities": { "tcp": true } }
```

不需要额外声明 `unrestrictedNetwork` 或 `process`。TCP 允许连接本机、内网和公网，直接连接指定地址，不使用应用的 HTTP 代理，不提供 TLS 或 TCP 监听服务。能力声明不是安全沙箱，应只安装可信插件。

```js
const socket = await ctx.net.tcp.connect({
  host: "127.0.0.1",
  port: 6742,
  connectTimeoutMs: 5000,
  writeTimeoutMs: 10000,
  noDelay: true,
  keepAlive: true,
  keepAliveInitialDelayMs: 30000,
});
```

`host` 是主机名或 IP，IPv6 使用不带方括号的地址；`port` 是 1..65535 整数。两个超时均允许 1..120000 毫秒，省略时使用上述默认值。`noDelay` 默认开启。`keepAlive` 默认关闭，启用后由操作系统发送 TCP 探测包；`keepAliveInitialDelayMs` 默认 30000，允许 0..2147483647 毫秒整数，0 保留系统默认值，底层按整秒向下取整。keepalive 不是协议心跳，也不能代替请求超时。连接失败或超时会 reject，宿主不会自动重连。

## 字节流收发

- `await socket.write(data)`：接受 `ArrayBuffer` 或 `Uint8Array`，保留视图的 offset/length。完成表示此写入已交给底层发送，不表示对端应用已处理。建议逐次 await，保证生产速率跟随传输能力。
- `await socket.read()`：返回最多 64 KiB 的 `ArrayBuffer`，或者在远端正常结束且缓存读完后返回 `null`。同一连接只能有一个待完成的 read；不同连接可并行读取。
- `await socket.end({ signal }?)`：排空已提交的写入后发送 FIN，只结束本地写入，仍可 read 对端响应。调用后立即拒绝新 write；连接仍存在时重复调用共享同一次结束操作。沿用 `writeTimeoutMs`，从第一次 end 调用开始计时，超时会销毁连接；完成不代表对端已处理数据。
- `await socket.close()`：立即中止整条连接，未完成的读写、end 和连接操作会 reject。可重复调用；需要优雅结束写入时使用 end，读完响应后再 close。

TCP 是有序字节流，不保留消息边界。一次 read 可能是半个协议包，也可能包含多个包，插件应按协议长度自行拆包，并限制协议包的最大长度。read 没有默认空闲超时；可传入 `AbortSignal.timeout(ms)` 设置本次读取期限。单纯 Promise.race 不会取消旧 read。

正常 EOF 和读写传输错误会使运行时包装器关闭连接；如果 EOF 与待完成的 end 同时发生，会等待发送队列排空后再释放连接。手动 close、插件停用时，读取中的 reject 应被插件捕获；不要启动未处理 rejection 的后台循环。

以下示例适用于发送完请求后由服务端主动断开连接的协议；OpenRGB 是长连接，需要在读取循环中解析协议包并发送对应命令：

```js
export async function activate(ctx) {
  if (!ctx.net.tcp) throw new Error("请升级 EchoMusic 以使用 TCP 插件");
  let stopped = false;
  ctx.dispose(() => { stopped = true; });
  const socket = await ctx.net.tcp.connect({ host: "127.0.0.1", port: 9000 });
  void (async () => {
    try {
      await socket.write(new TextEncoder().encode("status\n"));
      while (!stopped) {
        const bytes = await socket.read();
        if (bytes === null) break;
        // 将 bytes 追加到插件的协议解析器，不能假设它恰好是一条消息。
        console.log(new Uint8Array(bytes));
      }
    } catch (error) {
      if (!stopped) console.error("TCP 连接失败", error);
    } finally {
      await socket.close().catch(() => {});
    }
  })();
}
```

## 取消与优雅结束

`connect({ ..., signal })` 的 signal 管理整条连接的生命周期：既能取消握手，也能在连接成功后关闭连接。`read({ signal })`、`write(data, { signal })` 和 `end({ signal })` 的 signal 仅在该次操作进行中生效，完成后移除监听。

传入已经取消的 signal 时，不启动操作，也不关闭现有连接。进行中取消任何操作则会中止整条连接和其他待完成操作，因为已经传输的字节无法撤回，继续复用可能造成协议错位。取消以原始 `signal.reason` reject；普通 `AbortController.abort()` 为 `AbortError`，`AbortSignal.timeout()` 为 `TimeoutError`。signal 留在插件运行时，不跨 IPC 传递，取消由宿主关闭连接执行。

```js
const controller = new AbortController();
ctx.dispose(() => controller.abort());
const socket = await ctx.net.tcp.connect({
  host: "127.0.0.1",
  port: 9000,
  signal: controller.signal,
  keepAlive: true,
  keepAliveInitialDelayMs: 30000,
});
try {
  await socket.write(new TextEncoder().encode("request\n"));
  // 仅用于以 FIN 标识请求结束的协议；OpenRGB 长连接不要每帧 end。
  await socket.end();
  for (;;) {
    const bytes = await socket.read({ signal: AbortSignal.timeout(5000) });
    if (bytes === null) break;
    // 每次读取最多等待 5 秒，将 bytes 交给协议解析器。
  }
} finally {
  await socket.close().catch(() => {});
}
```

end 的语义对应 Node.js 的写入半关闭，keepalive 使用兼容的 `setKeepAlive(enable, initialDelay)` 接口；参见 [Node.js net 文档](https://nodejs.org/api/net.html#socketenddata-encoding-callback) 和 [keepalive 文档](https://nodejs.org/api/net.html#socketsetkeepaliveenable-initialdelay)。

## 背压与生命周期

每个插件跨窗口最多持有 16 个连接，宿主总计最多 128 个，正在连接的句柄也计入限制。单次 write 最大 1 MiB；每条连接最多积压 4 MiB 或 64 个未完成写入，超限请求会 reject。连接与写入超时会销毁 Socket。

接收采用按需读取，主进程不会主动向渲染进程推送无限数据。插件暂停 read 时，Node Socket 和操作系统缓冲会施加背压；插件自己的解析缓存仍需自行限制。

连接属于创建它的插件和窗口。关闭一个插件或窗口不会影响其他连接。插件上下文释放、禁用、安全模式、卸载、更新、窗口完整导航/重载、渲染进程退出和应用退出会中止相关连接。插件不使用的连接应主动 close；不要把待完成的永久 read 作为 activate 的返回 Promise，否则插件激活流程无法完成。

对于 OpenRGB，保持一个读取循环处理握手、设备列表与控制消息；发送灯效前完成协议版本协商。按设备批量编码颜色并限制帧率；发送忙时在插件尚未提交的灯效帧中只保留最新帧。通用 TCP 层不会丢弃或重排已经提交的字节，也不会解释 OpenRGB 协议。
