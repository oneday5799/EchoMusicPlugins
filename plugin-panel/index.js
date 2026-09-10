// ============================================================
//  plugin-panel — 插件面板
//  侧边栏快捷入口 + 顶部导航栏按钮，一键跳转 EchoMusic 插件管理
// ============================================================

const STORAGE_KEY = "settings";
const DEFAULT_SETTINGS = {
  sidebar: true,
  titlebar: true,
};

let ctx = null;
let state = null;
let disposeSidebar = null;
let settingsDispose = null;
let settingsStyleDispose = null;

// --- 标题栏入口 ---
let titlebarDispose = null;

const applyTitlebar = (enabled) => {
  if (enabled) {
    if (titlebarDispose) return;
    titlebarDispose = ctx.ui.titlebar.register({
      id: "plugin-panel",
      title: "插件管理",
      icon: "tabler:apps",
      tooltip: "插件管理",
      defaultPlacement: "toolbar",
      order: 100,
      onClick: () => {
        ctx.router.push("/main/settings/plugins");
      },
    });
  } else {
    titlebarDispose?.();
    titlebarDispose = null;
  }
};

// --- 设置持久化 ---

const normalizeSettings = (value) => {
  const source = value && typeof value === "object" ? value : {};
  return {
    sidebar: source.sidebar ?? DEFAULT_SETTINGS.sidebar,
    titlebar: source.titlebar ?? DEFAULT_SETTINGS.titlebar,
  };
};

const saveSettings = async (values) => {
  const next = normalizeSettings(values);
  state.settings = next;
  await ctx.storage.set(STORAGE_KEY, next);
  applySidebar(next.sidebar);
  applyTitlebar(next.titlebar);
  return next;
};

const applySidebar = (enabled) => {
  if (enabled) {
    if (disposeSidebar) return;
    disposeSidebar = ctx.ui.sidebar.addItem({
      id: "plugin-panel",
      title: "插件面板",
      icon: "tabler:apps",
      section: "plugins",
      onClick: () => {
        ctx.router.push("/main/settings/plugins");
      },
    });
  } else {
    disposeSidebar?.();
    disposeSidebar = null;
  }
};

// --- 设置页 CSS ---

const SETTINGS_CSS = `
.pp-settings {
  display: grid;
  gap: 14px;
  color: var(--color-text-main, #f8fafc);
}

.pp-settings-panel {
  display: grid;
  gap: 11px;
  border: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 12%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-elevated-base, #111827) 72%, transparent);
  padding: 14px;
}

.pp-settings-panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 760;
}

.pp-settings-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.pp-settings-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.pp-settings-copy span {
  font-size: 13px;
  font-weight: 650;
}

.pp-settings-copy small {
  color: var(--color-text-secondary, rgba(148, 163, 184, 0.9));
  font-size: 12px;
  line-height: 1.45;
}

.pp-settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
`;

// --- Settings Component ---

const createSettingsComponent = (ctx) =>
  ctx.vue.defineComponent({
    name: "PluginPanelSettings",
    setup() {
      const { computed, defineAsyncComponent, h } = ctx.vue;
      const Button = defineAsyncComponent(ctx.ui.components.Button);
      const Switch = defineAsyncComponent(ctx.ui.components.Switch);

      const settings = computed(() => normalizeSettings(state?.settings));

      const patch = (value) => {
        void saveSettings({ ...settings.value, ...value }).catch((error) => {
          const message =
            error instanceof Error ? error.message : "插件面板设置保存失败";
          ctx.toast.warning(message);
        });
      };

      const row = (label, key, hint = "") =>
        h("div", { class: "pp-settings-row" }, [
          h("div", { class: "pp-settings-copy" }, [
            h("span", label),
            hint ? h("small", hint) : null,
          ]),
          h(Switch, {
            modelValue: Boolean(settings.value[key]),
            "onUpdate:modelValue": (value) =>
              patch({ [key]: Boolean(value) }),
          }),
        ]);

      const panel = (title, children) =>
        h("section", { class: "pp-settings-panel" }, [
          h("h3", title),
          ...children,
        ]);

      return () =>
        h("div", { class: "pp-settings" }, [
          panel("入口", [
            row(
              "侧边栏入口",
              "sidebar",
              "在侧边栏底部插件区域添加快捷入口。"
            ),
            row(
              "标题栏入口",
              "titlebar",
              "在顶部标题栏添加插件管理快捷入口。"
            ),
          ]),
          h("div", { class: "pp-settings-actions" }, [
            h(
              Button,
              {
                variant: "ghost",
                size: "xs",
                onClick: () => patch(DEFAULT_SETTINGS),
              },
              { default: () => "恢复默认" }
            ),
          ]),
        ]);
    },
  });

const registerSettings = (ctx) => {
  settingsDispose?.();
  settingsDispose = ctx.ui.settings.define({
    title: "插件面板",
    description: "控制插件面板入口在侧边栏和标题栏的显示。",
    component: createSettingsComponent(ctx),
  });
};

// --- activate / deactivate ---

export async function activate(_ctx) {
  ctx = _ctx;

  state = ctx.vue.reactive({
    settings: normalizeSettings(await ctx.storage.get(STORAGE_KEY)),
  });

  settingsStyleDispose = ctx.css.inject(SETTINGS_CSS, {
    id: "plugin-panel-settings",
  });
  registerSettings(ctx);

  applySidebar(state.settings.sidebar);
  applyTitlebar(state.settings.titlebar);
}

export function deactivate() {
  settingsDispose?.();
  settingsDispose = null;
  settingsStyleDispose?.();
  settingsStyleDispose = null;

  disposeSidebar?.();
  disposeSidebar = null;

  titlebarDispose?.();
  titlebarDispose = null;

  state = null;
  ctx = null;
}