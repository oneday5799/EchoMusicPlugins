// ============================================================
//  plugin-panel — 插件面板
//  侧边栏快捷入口 + 顶部导航栏按钮，一键跳转 EchoMusic 插件管理
// ============================================================

const STORAGE_KEY = "settings";
const DEFAULT_SETTINGS = {
  sidebar: true,
  topBar: true,
};

let ctx = null;
let state = null;
let disposeSidebar = null;
let settingsDispose = null;
let settingsStyleDispose = null;

// --- 顶部导航栏按钮 ---
let topBtn = null;
let topBtnStyle = null;
let topBtnCheckLoop = null;

function startTopButton() {
  if (topBtnCheckLoop) return;

  if (!document.getElementById("pp-top-btn-style")) {
    const s = document.createElement("style");
    s.id = "pp-top-btn-style";
    s.textContent = [
      ".pp-plugin-btn {",
      "  width: 34px; height: 34px;",
      "  display: flex; align-items: center; justify-content: center;",
      "  border-radius: 50%;",
      "  transition: all 0.2s;",
      "  background: transparent; border: none;",
      "  color: var(--color-text-main); opacity: 0.6;",
      "  cursor: pointer; flex-shrink: 0;",
      "  margin-left: 2px;",
      "}",
      ".pp-plugin-btn:hover {",
      "  opacity: 1;",
      "  background-color: var(--control-hover-bg);",
      "}",
      ".pp-plugin-btn svg {",
      "  width: 17px; height: 17px;",
      "}",
    ].join("\n");
    document.head.appendChild(s);
    topBtnStyle = s;
  }

  topBtnCheckLoop = setInterval(() => {
    const nav = document.querySelector(".titlebar-nav");
    if (!nav) return;
    const searchBox = nav.querySelector(".tb-search");
    if (!searchBox) return;
    if (document.getElementById("pp-top-btn")) return;

    const btn = document.createElement("button");
    btn.id = "pp-top-btn";
    btn.className = "pp-plugin-btn nav-btn";
    btn.title = "插件管理";
    btn.innerHTML = [
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="20" height="20" viewBox="0 0 24 24">',
      '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h3a1 1 0 0 0 1-1V5a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1a2 2 0 0 0-4 0v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a2 2 0 0 0 0-4H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1"></path>',
      "</svg>"
    ].join("");
    btn.addEventListener("click", () => {
      ctx.router.push("/main/settings/plugins");
    });
    searchBox.parentNode.insertBefore(btn, searchBox.nextSibling);
    topBtn = btn;
    clearInterval(topBtnCheckLoop);
    topBtnCheckLoop = null;
  }, 800);
}

function stopTopButton() {
  if (topBtnCheckLoop) {
    clearInterval(topBtnCheckLoop);
    topBtnCheckLoop = null;
  }
  if (topBtn) {
    topBtn.remove();
    topBtn = null;
  }
  if (topBtnStyle) {
    topBtnStyle.remove();
    topBtnStyle = null;
  }
  const s = document.getElementById("pp-top-btn-style");
  if (s) s.remove();
}

// --- 设置持久化 ---

const normalizeSettings = (value) => {
  const source = value && typeof value === "object" ? value : {};
  return {
    sidebar: source.sidebar ?? DEFAULT_SETTINGS.sidebar,
    topBar: source.topBar ?? DEFAULT_SETTINGS.topBar,
  };
};

const saveSettings = async (values) => {
  const next = normalizeSettings(values);
  state.settings = next;
  await ctx.storage.set(STORAGE_KEY, next);
  applySidebar(next.sidebar);
  applyTopBar(next.topBar);
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

const applyTopBar = (enabled) => {
  if (enabled) {
    startTopButton();
  } else {
    stopTopButton();
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
              "顶部入口",
              "topBar",
              "在主窗口顶部导航栏搜索框旁添加按钮。"
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
    description: "控制插件面板入口在侧边栏和顶部导航栏的显示。",
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
  applyTopBar(state.settings.topBar);
}

export function deactivate() {
  settingsDispose?.();
  settingsDispose = null;
  settingsStyleDispose?.();
  settingsStyleDispose = null;

  disposeSidebar?.();
  disposeSidebar = null;

  stopTopButton();

  state = null;
  ctx = null;
}