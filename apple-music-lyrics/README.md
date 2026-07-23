# Apple Music-like 歌词

使用 `@applemusic-like-lyrics/core` 渲染 EchoMusic 页面歌词，只影响主窗口页面歌词，不接管桌面歌词或 mini 歌词。

## 功能

- 使用 `ctx.lyricEffects.register()` 的页面歌词 decorator 扩展点挂载 AMLL 渲染器。
- 通过宿主快照里的 `timelineMs` 驱动 `setCurrentTime()`，跟随 EchoMusic 统一歌词时间轴。
- 将 EchoMusic 的逐字歌词、翻译和音译转换成 AMLL 的 `LyricLine[]`。
- 默认不自动启用 AMLL 渲染，开启设置项后会隐藏原生页面歌词并显示 AMLL 渲染层；关闭后回到原生歌词。
- 设置面板可开关 AMLL、原生歌词隐藏、模糊、缩放、弹簧动画，并可调整帧率限制、对齐位置和逐字渐变宽度。
- 默认复用 EchoMusic 页面歌词的已播放色、未播放色、字体和字重，同时保留增强对比度选项确保封面背景上可读。
- 出于性能考虑，AMLL 实例只在启用且有歌词时创建；默认关闭 AMLL 模糊和弹簧效果，动画帧率默认限制在 30fps。
- AMLL 根节点按 `getElement()` 挂在插件 shell 内，切歌或无歌词时销毁播放器不会移除宿主挂载点。
- 加载歌词后会在下一帧强制执行一次 AMLL 布局，避免首次挂载或切换页面歌词时出现空白。
- 遵守系统“减少动态效果”偏好，会自动关闭 AMLL 的部分动态效果。

## 开发

插件运行时只加载打包后的 `index.js`，不会在 EchoMusic 插件系统里解析 npm bare import。修改源码后需要重新构建：

```bash
pnpm install
pnpm build
```

## 兼容性

需要 EchoMusic `>=2.2.9-beta.6 <3`，因为插件依赖页面歌词 decorator 扩展点和统一歌词时间轴。

## 许可证

本插件目录与打包产物按 `AGPL-3.0-only` 分发，是仓库默认 MIT License 的例外。

原因：本插件打包了 `@applemusic-like-lyrics/core`，其许可证为 `AGPL-3.0-only`。分发插件或打包后的 `index.js` 时，需要遵守对应开源许可证要求。详见 [LICENSE](LICENSE) 和 [NOTICE.md](NOTICE.md)。
