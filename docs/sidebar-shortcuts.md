# 侧栏快捷卡片 API

`ctx.ui.sidebar.shortcuts.register(options)` 将插件功能加入侧栏「添加卡片」弹窗的「常用功能」候选列表。注册不会自动把卡片添加到侧栏，由用户点击侧栏上方的 `+` 选择。

## 与菜单、歌单的分工

| 区域                   | 插件接入                                                            | 用户调整方式                                                             |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 上方快捷卡片           | `ctx.ui.sidebar.shortcuts.register(...)`                            | 通过 `+` 添加，卡片右上角移除，直接拖动排序                              |
| 中间音乐菜单及插件菜单 | `ctx.ui.sidebar.addItem(...)` 或 `ctx.ui.addPage({ sidebar: ... })` | 底部编辑入口的「菜单与歌单」中隐藏、显示和排序                           |
| 下方固定歌单入口       | 宿主提供                                                            | 「菜单与歌单」中控制显示，位置固定；普通歌单排序使用歌单区自己的排序入口 |

「为您推荐」和「探索发现」是宿主保留卡片，用户不能移除，插件也不能替换或删除。默认只显示这两张卡片。

「添加卡片」中的「常听艺人」与「最近常听」由宿主根据听歌历史、歌单队列生成。当前快捷卡片 API 只注册功能候选，不提供修改这些资源列表或上传艺人头像、歌单封面的参数。歌单卡片与下方歌单列表共用宿主的封面更新逻辑。

两个区域独立保存配置：「菜单与歌单」中的恢复默认只重置下方菜单和固定歌单入口，保留上方已选卡片、资源卡片及顺序；「添加卡片」中的恢复默认只重置上方卡片。

## 页面卡片示例

先注册同插件页面，再注册候选卡片。省略 `addPage` 的 `sidebar`，页面就不会自动出现在下方菜单中。

```js
export function activate(ctx) {
  if (!ctx.ui?.sidebar?.shortcuts?.register) {
    ctx.toast.warning("当前 EchoMusic 版本不支持侧栏快捷卡片");
    return;
  }

  const Workspace = ctx.vue.defineComponent({
    setup() {
      return () => ctx.vue.h("div", { class: "p-6" }, "插件工作台");
    },
  });

  ctx.ui.addPage({
    id: "workspace",
    title: "插件工作台",
    component: Workspace,
  });

  ctx.ui.sidebar.shortcuts.register({
    id: "workspace-card",
    title: "工作台",
    icon: "tabler:layout-dashboard",
    pageId: "workspace",
    order: 100,
  });
}
```

点击后，宿主打开 `/main/plugin/:pluginId/:pageId`。`pageId` 对应的页面未注册或已注销时，候选和已选卡片均暂时隐藏。

## 动作卡片示例

不需要页面的功能使用 `onClick`，不要同时传入 `pageId`。

```js
export function activate(ctx) {
  if (!ctx.ui?.sidebar?.shortcuts?.register) return;

  const busy = ctx.vue.ref(false);
  const dispose = ctx.ui.sidebar.shortcuts.register({
    id: "quick-action",
    title: "快捷操作",
    icon: "tabler:bolt",
    order: 200,
    disabled: () => busy.value,
    async onClick() {
      busy.value = true;
      try {
        ctx.toast.success("快捷操作已执行");
      } finally {
        busy.value = false;
      }
    },
  });

  // 功能不再提供时可调用 dispose() 提前注销。
  // 正常停用插件时宿主自动清理，无需重复调用。
}
```

## 参数与返回值

| 字段       | 类型                                                      | 说明                                                                                                        |
| ---------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `id`       | `string`，必填                                            | 插件内稳定且唯一的卡片 ID，去除首尾空白后不能为空。升级时保留它才能延续用户选择和顺序。                     |
| `title`    | `string`，必填                                            | 显示名称，去除首尾空白后不能为空。用于候选列表、悬停文字及无障碍名称。                                      |
| `icon`     | Iconify 名称或图标数据，可选                              | 未提供时显示宿主插件图标。不能传图片 URL、Vue 组件或自定义卡片布局。                                        |
| `pageId`   | `string`，与 `onClick` 二选一                             | 同插件已注册页面的 ID。                                                                                     |
| `onClick`  | `() => void` 或 `() => Promise<void>`，与 `pageId` 二选一 | 点击动作。执行期间宿主阻止重复触发；异常进入插件运行错误记录。                                              |
| `order`    | `number`，可选                                            | 默认 `1000`，数值越小候选越靠前。只影响候选列表，不覆盖用户已选卡片顺序。                                   |
| `visible`  | `boolean` 或 `() => boolean`，可选                        | 默认 `true`。为 `false` 时，候选及已选卡片暂时隐藏，保存的选择仍保留。函数中的 Vue 响应式依赖会由宿主跟踪。 |
| `disabled` | `boolean` 或 `() => boolean`，可选                        | 默认 `false`。为 `true` 时不能添加或执行，但用户仍可移除已经选择的卡片。                                    |

返回 `dispose: () => void`，可提前注销本次注册。快捷卡片本身不需要额外的 Manifest capability；动作调用其他受能力控制的 API 时仍需声明对应能力，例如 `ctx.theme.openThemes()` 需要 `theme`。插件应声明支持该 API 的最低宿主版本，并在兼容旧宿主时进行能力探测。

缺少有效 `id`、`title`、没有提供动作、同时提供两种动作，或 `onClick` 不是函数时，注册会抛出异常。此 API 不接收下方菜单的 `section`、`sectionTitle`、`before`、`after`、`path` 等字段。

## 生命周期与交互

- 宿主以插件 ID 和卡片 ID 组合稳定键，不同插件同名 ID 不冲突。插件不能指定这个键或修改其他插件的卡片。
- 同插件重复注册相同 ID 会替换旧注册。旧 `dispose` 不会删除新卡片，旧动作句柄也不会触发新注册。
- 插件停用或注销后，卡片暂时隐藏，用户选择与排序位置保留；相同 ID 再次注册后恢复显示。
- 展开侧栏时默认显示图标，悬停或键盘聚焦后在原位置显示文字；折叠时保持图标并显示 Tooltip。卡片尺寸、颜色、选中状态和移除按钮均由宿主管理。
- 卡片支持直接拖动以及聚焦后的 `Alt + 方向键` 排序；`order` 不控制这些操作。

同一功能如果确实需要两个入口，可以分别注册上方卡片和下方菜单。仅注册 `sidebar.addItem` 或 `addPage.sidebar` 不会生成上方候选卡片，注册快捷卡片也不会生成下方菜单。通常选择一个适合该功能的入口即可。
