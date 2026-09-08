# Graphics 插件绘图 API

`ctx.graphics` 为插件提供通用绘图基础能力：独立画布、WebGPU 渲染、动画调度、尺寸适配、显示能力通知及生命周期清理。可用于频谱、图形动画和自定义着色器效果；HDR 高光是其中一种可选输出能力，普通 SDR 绘图也可以使用。

宿主管理画布和输出流程，插件负责具体图形、着色器及 GPU 资源的创建。这是底层绘图 API，不包含现成的场景、粒子、滤镜或图形组件。WebGPU 不可用时提供 Canvas2D 接口，具体回退内容由插件绘制。

本接口不需要额外的 manifest capability。依赖它的插件应检测 `ctx.graphics?.createCanvas`，并在发布时用 `requires.echoMusicVersion` 限定到实际包含该接口的宿主版本。不要仅根据 Electron 的版本号推断 GPU 可用。

## 快速开始：普通 SDR 绘图

下面的函数创建一个 SDR 画布并绘制纯色色块。实际插件可在同一渲染回调中绑定自己的 pipeline、buffer 和 texture，绘制图形或动画。

```js
async function mountGraphic(ctx, container) {
  if (!ctx.graphics?.createCanvas) throw new Error('当前 EchoMusic 不支持 Graphics API');
  const surface = await ctx.graphics.createCanvas({ dynamicRange: 'sdr' });
  // container 由插件组件提供，需设置明确尺寸。
  container.appendChild(surface.canvas);
  if (surface.context2d) {
    surface.resize();
    const context = surface.context2d;
    context.fillStyle = ctx.graphics.toSdrColor({ r: 0.1, g: 0.3, b: 0.6 });
    context.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
    // Canvas2D 模式下，尺寸变化后的重绘由插件负责。
  } else {
    surface.render(({ encoder, view }) => {
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view,
          clearValue: { r: 0.1, g: 0.3, b: 0.6, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.end();
    });
  }
  return () => surface.dispose();
}
```

组件卸载时调用返回的清理函数；异步挂载的取消处理见下文生命周期说明。需要动画时使用 `surface.start(draw)`，已有渲染循环则调用 `surface.render(draw)`。设置 `dynamicRange: 'auto'` 后，宿主会按显示能力选择 HDR 或 SDR 输出。

## 能力检测

```js
const capabilities = await ctx.graphics.getCapabilities();
const off = ctx.graphics.onCapabilitiesChanged((capabilities) => {
  console.log(capabilities);
});
// 可主动重试 GPU 探测，例如设备恢复后：
await ctx.graphics.getCapabilities({ refresh: true });
```

| 字段 | 含义 |
| --- | --- |
| `webgpu` | GPU adapter 和 device 能成功创建 |
| `hdrCanvas` | 临时画布实际接受 `rgba16float` + `extended`，且没有配置验证错误 |
| `displayHighDynamicRange` | 浏览器 `(dynamic-range: high)` 查询结果 |
| `colorGamut` | 浏览器报告的 `srgb` / `p3` / `rec2020` 能力；不是本接口的输出色域承诺 |
| `hdrEligible` | HDR 画布配置和显示能力都满足，具备尝试 HDR 输出的条件 |
| `outputVerification` | 固定为 `unverified`；宿主不能测量实际屏幕亮度 |
| `reason` | `null` 或回退原因字符串 |

**`hdrEligible: true` 不表示系统 HDR 一定已开启，也不表示当前窗口已经输出某个尼特亮度。** 媒体查询报告的是能力，不是亮度测量。窗口类型、驱动、系统设置和合成路径都可能影响结果。

首次订阅会异步推送状态，之后在 HDR/色域媒体查询变化、窗口 resize/focus/pageshow 或文档可见性变化时重新读取并推送变化。GPU 探测按插件运行上下文缓存，临时探测设备随即销毁；`refresh: true` 可以重新探测。`off()` 取消订阅，插件卸载也会自动取消。

## 创建画布

```js
const surface = await ctx.graphics.createCanvas({
  dynamicRange: 'auto',      // 默认 auto；sdr 强制这个画布使用 SDR
  alphaMode: 'opaque',      // 默认 opaque；premultiplied 允许画布透明
  maxDimension: 4096,       // 默认 4096，限制实际像素宽高，也受设备上限约束
});
container.appendChild(surface.canvas);
```

容器必须有明确的布局尺寸，例如 `width: 320px; height: 180px`。返回的 canvas 默认宽高为容器的 100%，不自动挂载到 DOM。

- `ctx.graphics.toSdrColor({ r, g, b, a? })`：把线性 sRGB 颜色转换为采用同一 SDR 映射的 CSS `rgba(...)`，供 2D 回退使用。
- `surface.device`：WebGPU 分支的 `GPUDevice`，2D 分支为 `null`。可以用来创建插件自身的 shader、pipeline 和 buffer。
- `surface.context2d`：无法创建 WebGPU 绘制路径时提供的 SDR `CanvasRenderingContext2D`，正常 GPU 分支为 `null`。
- `surface.getState()`：`backend: webgpu | canvas2d`、`status: ready | lost | disposed`、`dynamicRange: hdr | sdr`、`reason`、`outputVerification`。
- `surface.onStateChanged(callback)`：立即推送当前状态，之后通知 HDR/SDR 切换和设备丢失；返回取消函数。
- `surface.resize(width?, height?, pixelRatio?)`：立即调整 backing store。参数为 CSS 尺寸，像素比默认使用 `devicePixelRatio`；不传尺寸则读取布局。之后仍跟随 DOM 布局自动调整，并保持比例限制最大尺寸。
- `surface.dispose()`：停止管理的动画、释放 texture/buffer/device、断开 observer、移除画布。可以重复调用。插件卸载时自动执行。

`reason` 目前包括 `webgpu-unavailable`、`adapter-unavailable`、`gpu-initialization-failed`、`hdr-canvas-unavailable`、`display-reports-sdr`、`sdr-requested`、`device-lost`。用 `backend` 和 `status` 决定分支，原因字符串主要用于诊断。

## 颜色与绘制约定

插件向宿主提供的 **`rgba16float`、线性 sRGB、直通 alpha（straight alpha）** 渲染目标绘制：

- RGB `1.0` 表示 SDR 参考白，`2.0`、`4.0` 等表示相对于参考白的高光，不是物理尼特值。
- 输入不要再执行 sRGB gamma 编码、SDR tone mapping 或 alpha 预乘，宿主负责最终输出转换。
- HDR 分支使用浮点画布与 extended tone mapping，保留超出 SDR 范围的值，由浏览器/系统适配实际显示范围。
- SDR 分支在插件画布内应用平滑高光压缩：线性 RGB 峰值不超过 `0.75` 时不改变；超过后使用连续的 shoulder 曲线，并按同一比例缩放 RGB 保持颜色比例，再编码为 sRGB。**这是有意的 SDR 回退，接近白色的像素也会受压缩；不修改画布外的普通 DOM 内容。**
- 两种模式的插件渲染目标始终是 `rgba16float`，跨屏切换不需要重建插件 pipeline。
- 当前接口不提供 PQ/HLG 解码、HDR 视频播放器、P3 输出或固定尼特亮度控制。将现有 HDR 图片/视频接入自定义 shader 时，插件仍负责正确解码和转换到上述线性输入约定。

```js
surface.render(({ encoder, view, width, height, time, device, format }) => {
  // 同步编码命令。format 固定为 rgba16float。
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view,
      clearValue: { r: 4, g: 1, b: 0.25, a: 1 },
      loadOp: 'clear',
      storeOp: 'store',
    }],
  });
  // pass.setPipeline(pluginPipeline); ...
  pass.end();
  // 不要调用 encoder.finish() / queue.submit()，宿主会完成合成并提交。
});
```

`render()` 返回是否提交了绘制。回调必须同步，不可使用 `async`；shader/pipeline/资源应提前准备。每帧宿主先清空输入纹理，不依赖上一帧残留。画布尺寸或 HDR 状态变化时会重新调用最近一次绘制回调，所以回调应可重复执行，动画计算使用 `time`（毫秒）而不是隐式计数。

动画可以使用 `const stop = surface.start(draw)`。宿主管理 RAF，隐藏文档、未挂载或不可见的画布跳过 GPU 工作。开始新动画会停止旧动画，旧的 `stop()` 不会停止新动画。插件绘制异常会停止该动画并进入已有插件错误报告流程。

## 可选 HDR：亮度对照示例

在插件自己的组件挂载后调用下面的函数。它创建三个不同线性亮度的色块，用于比较 SDR 与 HDR 输出。

```js
async function mountHdrSwatches(ctx, container) {
  if (!ctx.graphics?.createCanvas) throw new Error('当前 EchoMusic 不支持插件图形 API');
  const surfaces = [];
  const cards = [];
  try {
    for (const level of [0.25, 1, 4]) {
      const card = document.createElement('div');
      cards.push(card);
      const label = document.createElement('div');
      label.textContent = `线性亮度 ${level}（相对 SDR 白）`;
      const holder = document.createElement('div');
      holder.style.cssText = 'width:160px;height:80px;margin:8px 0';
      card.append(label, holder);
      container.append(card);
      const surface = await ctx.graphics.createCanvas();
      surfaces.push(surface);
      holder.append(surface.canvas);
      if (surface.context2d) {
        // 无 WebGPU：插件负责提供普通 2D 视觉内容，宿主不能执行 GPU shader。
        surface.resize();
        surface.context2d.fillStyle = ctx.graphics.toSdrColor({ r: level, g: level, b: level });
        surface.context2d.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
        label.textContent += ' · 2D/SDR 回退';
      } else {
        surface.render(({ encoder, view }) => {
          encoder.beginRenderPass({ colorAttachments: [{
            view, clearValue: { r: level, g: level, b: level, a: 1 },
            loadOp: 'clear', storeOp: 'store',
          }] }).end();
        });
      }
    }
  } catch (error) {
    for (const surface of surfaces) surface.dispose();
    for (const card of cards) card.remove();
    throw error;
  }
  return () => {
    for (const surface of surfaces) surface.dispose();
    for (const card of cards) card.remove();
  };
}
```

Vue 组件在异步创建期间可能已卸载：应在 `onUnmounted` 标记取消，异步结果返回后立即 `dispose()`，避免把已失效的组件画布挂到页面。插件整个运行上下文销毁时，宿主会处理仍在等待 GPU 初始化的资源；页面组件自己的挂载/卸载仍由插件管理。

设备丢失会停止动画并发出 `status: lost`。销毁原 surface 后重新 `createCanvas()`，并重建插件自己的 GPU pipeline/buffer；宿主不会尝试把已有 WebGPU context 原地改成 2D context。2D 回退的内容绘制、布局重绘和动画由插件负责。

## 验证边界

建议分别测试 HDR 内置屏幕、SDR 外屏、跨屏拖动、系统 HDR 变化，以及禁用硬件加速的情况。用真实屏幕判断高光；普通截图不能证明 HDR 亮度输出正确。当前状态 API 不把配置成功表述为实际高光已验证。

参考：[Chrome WebGPU HDR](https://developer.chrome.com/blog/new-in-webgpu-129?hl=en)、[WebGPU 配置回读](https://developer.chrome.com/blog/new-in-webgpu-131)、[W3C dynamic-range 能力定义](https://www.w3.org/TR/mediaqueries-5/#dynamic-range)。
