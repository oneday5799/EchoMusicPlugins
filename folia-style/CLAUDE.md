# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

这是 EchoMusic（Electron + Vue 3 + Pinia 桌面音乐播放器）的一个 **插件子目录**：`plugins/folia-style`。仓库根在 `B:\git-workspace\EchoMusic`，本插件是根仓库跟踪的众多插件之一（`plugins/` 下与 `betterlyrics-engine`、`lyric-focus`、`Record-player` 等并列）。

插件的作用是替换宿主内置的歌词页——当宿主 `player.isLyricViewOpen` 变为 true 时，本插件挂载一个全屏覆盖层，在其中用 `<iframe>` 加载 `folia/bridge.html`（独立的可视化前端），通过 `postMessage` 与宿主双向通信。

没有构建、没有测试、没有 lint 配置。所有 JS 都是运行时直接由宿主/浏览器执行的源码——修改后直接由 EchoMusic 加载即可，不需要打包。

## 目录结构（关键的部分）

```
manifest.json          # 插件元数据（id/version/capabilities/requires）
index.js               # 宿主侧 ESM 模块，暴露 activate/deactivate
style.css              # 宿主侧样式（覆盖层容器 + 加载态）
folia/
  bridge.html          # iframe 内的完整前端（HTML + 内联主脚本，~1500 行）
  css/                 # bridge 内页样式（base + 各动画模式的 override）
  fonts/               # Inter-Variable.woff2
  modes/               # 六种动画模式；每个模式暴露 window.ModeXxx 全局
    shared.js          # 全部模式共用的 window.ModeUtils 工具
    yunjie.js liuguang.js xinxiang.js  # 基于 DOM 的散落布局
    qingsu.js          # DOM，独立分句/tilt 算法
    monet.js           # DOM，专用歌词扫过动画
    fume.js            # Canvas 独立渲染器（浮名模式）
```

## 宿主 API（`ctx`）实际使用面

`index.js` 的 `activate(ctx)` 依赖以下宿主注入项，改动前先确认还在使用：

- `ctx.vue`：`defineComponent / h / ref / watch / onMounted / onBeforeUnmount`
- `ctx.ui.teleport(component, { id, className })`：挂载一个组件到宿主 DOM 顶层
- `ctx.router`：Vue Router 实例；`ctx.router.push({ name: 'artist-detail' | 'album-detail' })`
- `ctx.fs.getFileUrl(pluginRelativePath)`：把插件内文件转成 iframe 能加载的 URL
- `ctx.descriptor.directory`：本插件磁盘根，用于拼接 `folia/bridge.html`
- `ctx.manifest.version`
- `ctx.dispose(fn)`：注册卸载回调
- Stores：`ctx.stores.player / lyric / playlist / settings`（Pinia，`$subscribe` 可用）
- 便捷 facade：`ctx.player.{toggle,prev,next,seek,setVolume,setPlayMode,playTrack,playSong,playNext,toggleLyricView}`、`ctx.playlist.{remove,clear,activeQueue,getActiveQueue}`
- `ctx.audio.spectrum.subscribe({ fps, binCount, smoothing, scale, includeWaveform }, cb) → dispose`
- 全局 `window.electron.{platform, windowControl(action), miniPlayer.show()}`

宿主要求写在 `manifest.json` 的 `requires.echoMusicVersion` 与 `capabilities`（当前 `localFiles + audioSpectrum`）里；改动时同步更新。

## 双向消息协议（宿主 ↔ iframe）

所有消息带 `source` 字段区分方向；宿主发 `echo-folia-parent`，iframe 发 `echo-folia-child`。

宿主 → iframe（`index.js` 中 `postToFrame`）：
- `echo-folia:init`：iframe ready 后一次，携带 `pluginVersion / hostControls / settings(动画模式+强度)`
- `echo-folia:snapshot`：完整状态（track / queue / playMode / isFavorited / coverBlur / lyric.currentIndex 等），命令执行后与曲目/音量变化会强制重推
- `echo-folia:lyrics`：归一化后的歌词行（毫秒），带 dedupe key
- `echo-folia:position`：`{position_ms, duration_ms, is_playing, cause}`，5 秒心跳 + 事件驱动
- `echo-folia:spectrum`：`{bins, waveform, rms, peak, state, timePos}`，按订阅回调透传

iframe → 宿主（`bridge.html` 内 `parent.postMessage`）：
- `echo-folia:ready`：iframe 完成初始化
- `echo-folia:request-snapshot`：请求重推快照+歌词+位置
- `echo-folia:command`：受支持的 `command` 值在 `index.js` 的 `executeCommand` 里，包括
  `toggle-play/play/pause/prev/next/seek/volume/cycle-mode/set-mode/play-index/play-song/queue-play-next-song/queue-play-next-index/queue-remove-index/queue-clear/close/mini-player/window-control/open-artist/open-album/toggle-favorite/toggle-cover-blur/set-anim-mode/set-intensity`

**改协议时两边都要改**：宿主 `index.js` + `folia/bridge.html`（搜 `echo-folia:` 就能找齐所有分支）。命令在宿主端通过 `commandQueue` 串行执行，命令完成后自动补发一次 snapshot + position。

## iframe 内部架构（`folia/bridge.html` + `folia/modes/`）

- `bridge.html` 前半是模板 DOM（设置菜单、按钮、图层容器），后半是内联主脚本：状态机 `S`、几何背景动画、歌词进入/退出调度、`updateWordStates` 逐字状态、消息路由、UI 事件绑定。
- 时间轴：宿主 `position` 事件只在事件/心跳时发；iframe 用 `getLocalTimeMs()` 做本地外推，加上用户 `folia-timeOffset`（localStorage 存的歌词矫正秒数）得到 `effectiveLyricTimeMs()`——只影响歌词显示，绝不改真实播放进度。
- 模式插槽：`window.ModeYunjie / ModeLiuguang / ModeXinxiang / ModeQingsu / ModeMonet` 都暴露 `createLine(line, lyricsLayer)`；`FumeMode`（浮名）不走 DOM，而是 `init/setLyrics/destroy/resize` 的 canvas 生命周期，进入时会隐藏 `lyricsLayer` 与几何背景层。
- 共享逻辑集中在 `modes/shared.js`（`window.ModeUtils`）：字符分组、种子随机、CJK/英文判定、爱心曲线用的英雄词与碰撞回避、散落布局工厂 `createScatteredLine`（yunjie/liuguang 都是薄封装）。qingsu.js 有自己一份 `seededRandom(seed, offset)`，**注意**它和 `ModeUtils.seededRandom` 签名不同，不要互相替换。

新增模式时的最小路径：`modes/xxx.js` 里挂 `window.ModeXxx.createLine`（或独立生命周期），在 `bridge.html` 顶部 `<script src="modes/xxx.js">`、`modeMap` 里注册、设置菜单弹层加一个选项。若涉及独占背景（像 fume/monet），在 `renderLyricLine` 里补上进入/退出时对 `lyricsLayer / geo-layer / center-glow / monet-container` 的显隐处理。

## 兼容与遗留

- `LEGACY_PAGE_PATH = '/main/plugin/folia-style/player'`：旧版本插件曾以路由页承载，现在检测到就 replace 到 `/main/home` 并弹覆盖层。删/改这个字符串前搜一下 EchoMusic 主仓有没有链接进来。
- 覆盖层通过监听 `stores.player.isLyricViewOpen` 触发；`closeOverlay` 会把它设回 false，两个方向都要保持同步，否则宿主播放器抽屉状态会漂移。

## 开发流程与本地约定

- 无 npm 脚本、无 lockfile：本插件是纯运行时源码。修改后由 EchoMusic 主程序热加载或重启拾取。
- 依赖 EchoMusic 主仓与 `native/*` 原生模块能正常构建才有得测；那些属于主仓，别在插件目录里操作它们。
- Git 由用户手动管理；不要自动 `git add / commit / push`。
- 使用 Node 时默认 ESM、无分号、Windows 环境；本插件的宿主入口 `index.js` 已经是 ESM（`export function activate`）。iframe 内脚本走 IIFE，是浏览器脚本环境。
