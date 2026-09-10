# 标题栏更多菜单 API

标题栏的更多菜单收纳“一起听”和完整任务中心，插件入口显示在内置功能下方。任务中心快捷入口常驻在听歌识曲右侧。Mini 和平台支持的全屏按钮保持独立，不属于插件菜单。

宿主新增 `ctx.ui.moreMenu.addItem()` 扩展点：

```ts
const dispose = ctx.ui.moreMenu.addItem({
  id: 'open-tools',
  title: '打开插件工具',
  icon: 'tabler:tools', // Iconify 图标名称，也可传入图标数据对象
  order: 100,
  visible: () => true,
  disabled: () => false,
  onClick: async () => {
    // 打开插件页面或执行插件操作。
  },
});
```

`id`、`title` 和 `onClick` 必填；`icon` 为可选项，接受 Iconify 图标名称字符串（如 `tabler:tools`）或 Iconify 图标数据对象，与侧边栏使用相同格式；省略时显示默认插件图标。`order` 默认 1000，数值越小越靠前，仅影响插件入口之间的顺序。`visible` 和 `disabled` 接受布尔值或同步函数，默认显示且可用，函数可以读取 Vue 响应式状态。

入口按插件 ID 和入口 ID 隔离，同一插件重复注册同一 ID 时替换旧入口。返回的函数可主动移除该次注册；插件停用、卸载时宿主自动清理。状态函数异常时入口隐藏或禁用，异步操作异常交给现有插件运行时错误处理。菜单统一提供键盘导航、Escape 关闭和焦点恢复，插件只注册菜单项数据，不直接挂载标题栏 DOM。
