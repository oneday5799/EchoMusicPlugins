export function activate(ctx) {
  if (!ctx.theme?.register || !ctx.ui.sidebar?.shortcuts?.register) {
    throw new Error("此示例需要支持全局主题与快捷卡片 API 的 EchoMusic");
  }
  const { defineComponent, defineAsyncComponent, h } = ctx.vue;
  const Slider = defineAsyncComponent(ctx.ui.components.Slider);
  const ThemeSettings = defineComponent({
    name: "ExampleThemeSettings",
    setup() {
      const theme = ctx.theme.useTheme();
      return () =>
        h("div", { style: "padding:16px 0;display:grid;gap:12px" }, [
          h("label", `纹理强度 ${theme.settings.value.texture}%`),
          h(Slider, {
            min: 0,
            max: 50,
            step: 5,
            modelValue: theme.settings.value.texture,
            "onUpdate:modelValue": (texture) =>
              theme.updateSettings({ texture }),
          }),
        ]);
    },
  });
  const Texture = defineComponent({
    name: "ExampleThemeTexture",
    setup() {
      const theme = ctx.theme.useTheme();
      return () =>
        h("div", {
          style: {
            position: "absolute",
            inset: 0,
            opacity: theme.settings.value.texture / 100,
            background:
              "radial-gradient(circle at 15% 25%, #8ccfcd, transparent 45%),radial-gradient(circle at 85% 80%, #aa92d4, transparent 50%)",
          },
        });
    },
  });
  const light = {
    tokens: {
      shell: "#e4eeee",
      sidebar: "#eaf2f1",
      main: "#f8fbfa",
      card: "#ffffff",
      elevated: "#ffffff",
      player: "#f8fbfa",
      text: "#172c2e",
      secondary: "#52676a",
      border: "#d6e4e4",
    },
    accent: "#188c87",
    background: { gradient: "linear-gradient(135deg, #d7e9e5, #e4e0f0)" },
  };
  const dark = {
    tokens: {
      shell: "#171d29",
      sidebar: "#222a39",
      main: "#1b2230",
      card: "#2a3446",
      elevated: "#2a3446",
      player: "#222a39",
      text: "#f3f5fb",
      secondary: "#b6c0d5",
      border: "#3b4559",
    },
    accent: "#8d9deb",
    background: { gradient: "linear-gradient(135deg, #162f36, #27223d)" },
  };
  for (const [id, title, defaultMode] of [
    ["mist", "晨雾", "light"],
    ["dusk", "暮色", "dark"],
  ]) {
    ctx.theme.register({
      id,
      title,
      type: "default",
      defaultMode,
      variants: { light, dark },
      settings: {
        defaults: { texture: 20 },
        validate: (values) =>
          Number.isFinite(values.texture) &&
          values.texture >= 0 &&
          values.texture <= 50,
        component: ThemeSettings,
      },
      decorations: { background: Texture },
    });
  }
  // 只加入候选列表，由用户点击侧栏 + 选择；不会自动占据位置。
  ctx.ui.sidebar.shortcuts.register({
    id: "appearance",
    title: "主题工作台",
    icon: "tabler:palette",
    order: 100,
    onClick: () => ctx.theme.openThemes(),
  });
}
