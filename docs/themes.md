# 全局主题 API

需要支持此协议的 EchoMusic（本次实现基于 2.3.2-beta.7）。Manifest 声明 `capabilities: { "theme": true }`。主题是用户选择的外观贡献，注册不会自动应用。播放页皮肤仍使用独立的 `ctx.ui.lyricsPage` API。

```js
const dispose = ctx.theme.register({
  id: 'mist', title: '晨雾', type: 'default', defaultMode: 'system',
  variants: {
    light: { tokens: { shell:'#eef3f3', main:'#f8fbfb', text:'#172c2e', secondary:'#52676a' }, accent:'#188c87' },
    dark: { tokens: { shell:'#171d29', main:'#1b2230', text:'#f3f5fb', secondary:'#b6c0d5' }, accent:'#8d9deb' },
  },
});
ctx.theme.openThemes();
```

主题包包含自己的背景、深浅配色及可选装饰/专属设置。`type` 指定主题类型：`default`（静态）、`solid`（纯色）、`dynamic`（动态）；省略时为 `default`，无效值拒绝注册。宿主使用 CustomTabBar 提供“主题”“纯色”“自定义”三个页签。“主题”中按类型标签分组展示内置及插件主题，卡片展示主题名称和描述，不显示插件来源提示，也不设来源分类。动态主题中的动画须遵守 `motionEnabled`，声明类型本身不会启动动画。图片背景属于主题包内容，不单独作为主题分类。自定义背景通过“自定义”页签编辑，是独立个人图片皮肤，不属于主题包目录。

主题 ID 在插件内稳定且唯一。跨插件同名不冲突。同 ID 重复注册替换旧 revision；旧 dispose 不影响新主题。禁用时宿主自动注销。宿主保留用户选择与设置，临时回退 Echo 主题；重新启用恢复。卸载清理所属主题配置。

`variants.light/dark` 均必填，tokens 可部分填写；统一解析器根据实际前景明暗补齐同组颜色，不能假设软件显示偏好就是主题实际配色。所有颜色为 `#RRGGBB`：`shell/sidebar/main/card/elevated/player/text/secondary/border`。`accent` 为强调色；`background` 支持 `color`、`gradient`（CSS gradient）、`image`（插件资源 URL 或 data URL）、`position` 和 `fit: 'cover'|'contain'`。主题包不声明 surfaces 或 atmosphere；面板材质、窗口透明度及背景氛围由宿主全局偏好管理，插件可用自己的背景图片、渐变或装饰组件表达主题视觉。

宿主布局的侧栏与右侧最底部的外层留白共用全局背景，侧栏不再绘制独立表面。使用 `shell` 或 `background` 定义框架背景；图片和渐变同样贯穿侧栏与框架留白。`player` 与 `sidebar` 为解析后的角色值：播放栏固定使用 `main` 配色，插件不再为其指定独立底色。解析后的 `sidebar` 表示框架背景的底色，不再单独应用插件声明的侧栏底色。

显示模式由软件设置管理；皮肤选择、逐皮肤配色、强调色和封面氛围由主题中心统一处理。用户图片仅属于内置自定义皮肤，不覆盖插件皮肤的背景。自定义文字色只属于图片皮肤；软件显示偏好不随其改变。面板材质由宿主统一管理。不要直接修改宿主 store 或 CSS 选择器来激活主题。

## 设置与装饰

注册对象可提供：

```js
settings: {
  defaults: { texture:20 }, // 仅 JSON 数据，不存组件、函数或资源句柄
  validate: values => values.texture >= 0 && values.texture <= 50,
  component: ThemeSettings,
},
resolve: ({ isDark, settings }) => ({ /* 同步返回外观字段 */ }),
decorations: { background: Texture, sidebar: SidebarDecoration, player: PlayerDecoration },
```

`validate` 返回 boolean 或 `{ errors: string[] }`；在写入前校验完整配置，仅保存与默认值的差异。`resolve` 必须同步且无副作用，由宿主在有效配置或模式改变时解析。网络资源等异步工作放在组件中，并在卸载时取消。

设置组件和装饰组件的 `setup()` 内调用 `ctx.theme.useTheme()`：

- `key`：当前主题稳定 key。
- `isDark`、`settings`、`accentColor`、`appearance`：只读 computed；配置不可直接改写。
- `updateSettings(patch)`、`resetSettings()`：通过宿主校验和预览事务更新。
- `motionEnabled`：窗口可见且系统未要求减少动态效果。动画仅在该值为 true 时启动，并在 false 或组件卸载时停止。
- `imageBlur`: deprecated and always 0; native window frosting never blurs theme images or UI.

装饰只能位于宿主指定的背景、侧栏底图、播放器底图，不能替换业务结构。装饰不接收指针事件，使用 `position:absolute;inset:0` 等局部样式；组件使用 Vue 生命周期清理监听、计时器和绘图资源。用户选择自定义图片皮肤时会离开插件皮肤，原皮肤的背景、侧栏及播放器装饰一同卸载；切回后恢复。注册、resolve、校验和组件异常进入插件错误记录，失败 revision 回退宿主主题，用户点击原主题显式重试。

## 现有主题接口

`ctx.theme.surface.set/clear` 与 `accentGradient.set/clear` 仍可用，作为 Echo 内置主题下的默认外观贡献进入统一解析器。主内容和播放栏统一采用宿主固定面板材质，旧 surface 贡献不能改变这两个表面的固定透明度。明确选择关闭氛围或封面氛围时优先于旧 gradient 贡献。`pageTransition` 保持独立的页面动效语义。

其他窗口通过 `ctx.appearance.getSnapshot/onSnapshot` 取得普通 JSON 快照：`isDark/accentColor/fontFamily/colors/floatingSurfaceFrosted`，其中 colors 是语义 CSS 变量键值。快照不携带主题组件或主窗口背景图。播放栏和迷你播放器统一使用界面的有效强调色。

可运行示例：[app-theme-example](../app-theme-example)。

## 主题中心中的入口

- **默认与纯色**是内置配色方案，明暗不是两张独立主题。`host:solid` 按用户选择的颜色生成整套语义配色，并提供深浅变体；选择和修改颜色即时保存。
- **自定义**是独立图片皮肤。位置、填充和遮罩属于图片；毛玻璃属于全局偏好。新图片默认无遮罩。
- **皮肤透明度**控制合成后背景的 alpha A=1-T；皮肤、氛围与面板先合成，再统一淡出。面板在合成前保持 50% 材质比例，侧栏和右侧透出的原生窗口材质比例一致。窗口毛玻璃模糊窗口后方的桌面，不模糊皮肤图片、文字或内容容器；透明度为 0 时看不到后方材质。
- **插件专属设置**仅在选中提供设置组件的主题时出现，可展开编辑，更新即时保存；“重置专属参数”只清除该主题的 settings 覆盖。背景图片在“自定义”页签中保留保存／取消，未保存内容不覆盖已保存配置。

软件设置负责显示模式、动态封面及推荐词。主题页管理配色、背景、皮肤透明度及毛玻璃。
深浅色模式使用下拉选择。侧栏折叠入口默认显示，并保留快捷键；不再提供独立的折叠功能启用开关。

主题页提供主题、纯色、自定义页签。外观抽屉的皮肤透明度范围 0..100%，步长 1%；窗口毛玻璃开关联动原生窗口材质，即时生效并保存为全局偏好，不支持的桌面禁用此开关。透明度只作用于主窗口的背景装饰容器 `.layout-skin`，不作用于包含文字、按钮、歌曲封面或弹出层的内容容器。

公共偏好 transparency、windowFrosted、floatingSurfaceFrosted、accent、atmosphere 在切换主题和取消图片草稿时保持，恢复外观默认重置公共偏好，不改变图片或主题选择。windowFrosted 默认 false。插件主题的 accent 在跟随主题时保留原色，不再做提取色归一化。

## 颜色解析规则

统一路径：软件模式选择 variant → 合并主题专属参数与用户皮肤覆盖 → 解析完整颜色组 → 生成 CSS 与跨窗口快照。

- `tokens.shell` / `background.color`：全局背景底色，后者优先；侧栏与外层留白共用它。
- `tokens.main`：主内容与播放栏共用底色。缺省使用 shell。
- `tokens.text/secondary`：内容文字。自定义背景文字保留用户指定 HEX 色值。
- `tokens.card`：语义实色卡片基色；普通内容卡片、悬停与选中使用宿主统一的轻量材质，不铺设此实色。
- `tokens.elevated`：旧的浮层背景输入；新主题建议使用 `floating` 明确表达配对。
- `floating?: { background, card, text, secondary, border }`：弹窗、抽屉、菜单、提示的独立颜色组，字段均为可选 HEX 色值。未声明时按主题实际前景明暗生成中性浮层。已声明背景时，缺省文字会与该背景配对；不足 4.5:1 的浮层文字对比会被纠正，内容文字原色保持不变。
- CSS 控件、边框、行悬停和内容卡片在内容区及浮层各自作用域内统一派生；插件不要写 CSS 覆盖它们。浮层可以与内容区采用相反的深浅配色。主题强调色原值保留，封面强调色沿用既有归一化和过渡流程；浮层强调文字根据自身表面校正可读性，滚动条随局部前景明暗派生。
- 软件模式用于选择 variant；实际控件明暗根据解析后的前景色确定。同样的深色配色即使被插件放在 light variant，也不会混入浅色控件。
- 透明度、图片毛玻璃、浮层毛玻璃和封面氛围独立于颜色解析，不参与改写颜色组；图片或视频无法保证任意像素处的文字对比，可通过图片遮罩调整。
