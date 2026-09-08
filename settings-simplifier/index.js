const STORAGE_KEY = "settings";
const STORAGE_KEY_SECTIONS = "discoveredSections";

const BUILTIN_SECTIONS = [
  { id: 'appearance', label: '主题与外观' },
  { id: 'interface', label: '界面显示' },
  { id: 'window', label: '窗口与启动' },
  { id: 'font', label: '字体设置' },
  { id: 'playback', label: '播放体验' },
  { id: 'spatialAudio', label: '音效管理' },
  { id: 'player', label: '播放器设置' },
  { id: 'network', label: '网络设置' },
  { id: 'pageLyric', label: '页面歌词' },
  { id: 'desktopLyric', label: '桌面歌词' },
  { id: 'shortcuts', label: '快捷键' },
  { id: 'audioDevice', label: '音频设备' },
  { id: 'experimental', label: '实验性功能' },
  { id: 'plugins', label: '插件' },
  { id: 'data', label: '数据与安全' },
  { id: 'about', label: '关于' }
];

let allSections = [...BUILTIN_SECTIONS];

const normalizeSettings = (value, sections) => {
  const source = value && typeof value === "object" ? value : {};
  const result = { sections: {}, items: {} };
  
  if (source.sections && typeof source.sections === "object") {
    result.sections = source.sections;
  }
  if (source.items && typeof source.items === "object") {
    result.items = source.items;
  }
  
  sections.forEach(s => {
    if (result.sections[s.id] === undefined) {
      result.sections[s.id] = true;
    }
  });
  
  return result;
};

const generateCSS = (settings, sections) => {
  const hiddenSections = sections
    .filter(s => settings.sections[s.id] === false)
    .map(s => s.id);

  const hiddenItems = Object.entries(settings.items || {})
    .filter(([_, visible]) => visible === false)
    .map(([id]) => id);

  if (hiddenSections.length === 0 && hiddenItems.length === 0) return '';

  const rules = [];

  if (hiddenSections.length > 0) {
    const sectionSelector = hiddenSections
      .map(id => `[data-section="${id}"]`)
      .join(', ');
    rules.push(`${sectionSelector} { display: none !important; }`);
  }

  if (hiddenItems.length > 0) {
    const itemSelector = hiddenItems
      .map(id => [
        `[data-settings-item="${id}"]`,
        `[data-settings-divider-before="${id}"]`,
        `[data-settings-divider-after="${id}"]`
      ].join(', '))
      .join(', ');
    rules.push(`${itemSelector} { display: none !important; }`);
  }

  return rules.join('\n');
};

const updateAnchorBar = (settings, sections) => {
  const anchorButtons = document.querySelectorAll('.settings-anchor-item');
  anchorButtons.forEach(btn => {
    const text = btn.textContent?.trim();
    const hidden = sections
      .filter(s => settings.sections[s.id] === false)
      .some(s => s.label === text);
    btn.style.display = hidden ? 'none' : '';
  });
};

const scanSectionsFromDOM = () => {
  const elements = document.querySelectorAll('[data-section]');
  if (!elements.length) return null;

  const discovered = [];
  elements.forEach(el => {
    const id = el.dataset.section;
    if (!id) return;
    const h2 = el.querySelector('h2');
    const label = h2?.textContent?.trim() || id;
    
    const items = [];
    const settingsCard = el.querySelector('.settings-card');
    if (settingsCard) {
      let index = 0;
      const children = settingsCard.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.classList.contains('settings-item')) {
          const h3 = child.querySelector('h3');
          const itemLabel = h3?.textContent?.trim() || `子项 ${index + 1}`;
          const itemId = `${id}_${index}`;
          items.push({ id: itemId, label: itemLabel, sectionId: id });
          child.setAttribute('data-settings-item', itemId);
          
          const prevSibling = child.previousElementSibling;
          if (prevSibling && prevSibling.classList.contains('settings-divider')) {
            prevSibling.setAttribute('data-settings-divider-before', itemId);
          }
          
          const nextSibling = child.nextElementSibling;
          if (nextSibling && nextSibling.classList.contains('settings-divider')) {
            nextSibling.setAttribute('data-settings-divider-after', itemId);
          }
          
          index++;
        }
      }
    }
    
    discovered.push({ id, label, items });
  });

  return discovered.length > 0 ? discovered : null;
};

const mergeSections = (discovered) => {
  const map = new Map();
  BUILTIN_SECTIONS.forEach(s => map.set(s.id, { ...s, items: [] }));
  if (discovered) {
    discovered.forEach(s => {
      if (!map.has(s.id)) {
        map.set(s.id, s);
      } else {
        const existing = map.get(s.id);
        const newLabel = (s.label && s.label !== s.id) ? s.label : existing.label;
        const newItems = (s.items && s.items.length > 0) ? s.items : existing.items;
        map.set(s.id, { ...existing, label: newLabel, items: newItems });
      }
    });
  }
  return Array.from(map.values());
};

let state = null;
let styleDispose = null;
let settingsDispose = null;
let domObserver = null;
let sectionObserver = null;
let scanTimer = null;

const delayedScan = (ctx) => {
  if (scanTimer) clearTimeout(scanTimer);
  scanTimer = setTimeout(() => {
    const discovered = scanSectionsFromDOM();
    if (discovered) {
      const merged = mergeSections(discovered);
      const changed = merged.length !== allSections.length ||
        merged.some((s, i) => allSections[i]?.id !== s.id || s.items?.length !== allSections[i]?.items?.length);
      if (changed) {
        allSections = merged;
        ctx.storage.set(STORAGE_KEY_SECTIONS, discovered);
        state.settings = normalizeSettings(state.settings, merged);
        state.sections = merged;
        const css = generateCSS(state.settings, allSections);
        if (styleDispose) {
          styleDispose();
          styleDispose = null;
        }
        if (css) {
          styleDispose = ctx.css.inject(css, { id: "settings-simplifier-style" });
        }
        updateAnchorBar(state.settings, allSections);
      }
    }
    scanTimer = null;
  }, 300);
};

const createSettingsComponent = (ctx) =>
  ctx.vue.defineComponent({
    name: "SettingsSimplifierSettings",
    setup() {
      const { h, ref, watch, defineAsyncComponent, computed } = ctx.vue;

      const Switch = defineAsyncComponent(ctx.ui.components.Switch);
      const Button = defineAsyncComponent(ctx.ui.components.Button);

      const sections = ref([...allSections]);
      const settings = ref(normalizeSettings(state?.settings, allSections));
      const expandedSections = ref({});
      const busy = ref(false);

      watch(() => state?.settings, (s) => {
        if (s && !busy.value) {
          settings.value = normalizeSettings(s, sections.value);
        }
      }, { deep: true });

      watch(() => state?.sections, (s) => {
        if (s && s.length > 0) {
          sections.value = [...s];
        }
      }, { deep: true });

      const refreshSections = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const discovered = scanSectionsFromDOM();
        if (discovered && discovered.length > 0) {
          const merged = mergeSections(discovered);
          sections.value = merged;
          allSections = merged;
          state.sections = merged;
          await ctx.storage.set(STORAGE_KEY_SECTIONS, discovered);
          settings.value = normalizeSettings(state?.settings, merged);
        }
      };

      const updateCSS = async () => {
        if (styleDispose) {
          styleDispose();
          styleDispose = null;
        }
        const css = generateCSS(settings.value, sections.value);
        if (css) {
          styleDispose = ctx.css.inject(css, { id: "settings-simplifier-style" });
        }
        updateAnchorBar(settings.value, sections.value);
      };

      const patchSection = async (sectionId, value) => {
        settings.value = {
          ...settings.value,
          sections: { ...settings.value.sections, [sectionId]: Boolean(value) }
        };
        busy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          busy.value = false;
        }
      };

      const patchItem = async (itemId, value) => {
        settings.value = {
          ...settings.value,
          items: { ...settings.value.items, [itemId]: Boolean(value) }
        };
        busy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          busy.value = false;
        }
      };

      const selectAllSections = async () => {
        const newSections = { ...settings.value.sections };
        sections.value.forEach(s => { newSections[s.id] = true; });
        settings.value = { ...settings.value, sections: newSections };
        busy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          busy.value = false;
        }
      };

      const deselectAllSections = async () => {
        const newSections = { ...settings.value.sections };
        sections.value.forEach(s => { newSections[s.id] = false; });
        settings.value = { ...settings.value, sections: newSections };
        busy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          busy.value = false;
        }
      };

      const selectAllItems = async (sectionId) => {
        const section = sections.value.find(s => s.id === sectionId);
        if (!section) return;
        const newItems = { ...settings.value.items };
        section.items.forEach(item => { newItems[item.id] = true; });
        settings.value = { ...settings.value, items: newItems };
        busy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          busy.value = false;
        }
      };

      const deselectAllItems = async (sectionId) => {
        const section = sections.value.find(s => s.id === sectionId);
        if (!section) return;
        const newItems = { ...settings.value.items };
        section.items.forEach(item => { newItems[item.id] = false; });
        settings.value = { ...settings.value, items: newItems };
        busy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          busy.value = false;
        }
      };

      const resetAll = async () => {
        const newSections = {};
        const newItems = {};
        sections.value.forEach(s => {
          newSections[s.id] = true;
          s.items.forEach(item => { newItems[item.id] = true; });
        });
        settings.value = { sections: newSections, items: newItems };
        busy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          busy.value = false;
        }
      };

      const toggleExpand = (sectionId) => {
        expandedSections.value = {
          ...expandedSections.value,
          [sectionId]: !expandedSections.value[sectionId]
        };
      };

      return () =>
        h("div", { class: "settings-simplifier-plugin", style: { fontSize: "14px" } }, [
          h("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--color-border, #e5e5e5)"
            }
          }, [
            h("div", { style: { display: "flex", gap: "8px" } }, [
              h(Button, {
                size: "xs",
                onClick: async () => {
                  await refreshSections();
                  await updateCSS();
                },
                disabled: busy.value
              }, { default: () => "刷新" }),
              h(Button, {
                size: "xs",
                onClick: selectAllSections,
                disabled: busy.value
              }, { default: () => "全部显示" }),
              h(Button, {
                size: "xs",
                onClick: deselectAllSections,
                disabled: busy.value
              }, { default: () => "全部隐藏" }),
              h(Button, {
                size: "xs",
                onClick: resetAll,
                disabled: busy.value
              }, { default: () => "恢复默认" })
            ])
          ]),
          h("div", {
            style: { display: "flex", flexDirection: "column", gap: "8px" }
          }, sections.value.map((section) => {
            const isExpanded = expandedSections.value[section.id];
            const sectionVisible = settings.value.sections[section.id] !== false;
            
            return h("div", {
              key: section.id,
              style: {
                border: "1px solid var(--color-border, rgba(0, 0, 0, 0.1))",
                borderRadius: "8px",
                overflow: "hidden"
              }
            }, [
              h("div", {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--color-bg-secondary, rgba(0, 0, 0, 0.02))",
                  cursor: "pointer",
                  userSelect: "none"
                },
                onClick: () => toggleExpand(section.id)
              }, [
                h("div", {
                  style: { display: "flex", alignItems: "center", gap: "8px" }
                }, [
                  h("span", {
                    style: {
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      display: "inline-block",
                      fontSize: "12px",
                      color: "var(--color-text-secondary, #666)"
                    }
                  }, "▶"),
                  h("span", {
                    style: { fontWeight: "500" }
                  }, section.label),
                  h("span", {
                    style: {
                      fontSize: "12px",
                      color: "var(--color-text-secondary, #999)",
                      marginLeft: "4px"
                    }
                  }, `(${section.items.length}项)`)
                ]),
                h(Switch, {
                  modelValue: sectionVisible,
                  "onUpdate:modelValue": (v) => patchSection(section.id, v),
                  disabled: busy.value,
                  onClick: (e) => e.stopPropagation()
                })
              ]),
              isExpanded ? h("div", {
                style: {
                  padding: "8px 12px",
                  borderTop: "1px solid var(--color-border, rgba(0, 0, 0, 0.1))"
                }
              }, [
                h("div", {
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    marginBottom: "8px"
                  }
                }, [
                  h(Button, {
                    size: "xs",
                    onClick: () => selectAllItems(section.id),
                    disabled: busy.value
                  }, { default: () => "全部显示" }),
                  h(Button, {
                    size: "xs",
                    onClick: () => deselectAllItems(section.id),
                    disabled: busy.value
                  }, { default: () => "全部隐藏" })
                ]),
                h("div", {
                  style: { display: "flex", flexDirection: "column", gap: "4px" }
                }, section.items.map((item) => {
                  const itemVisible = settings.value.items[item.id] !== false;
                  return h("div", {
                    key: item.id,
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: "var(--color-bg-tertiary, rgba(0, 0, 0, 0.01))"
                    }
                  }, [
                    h("span", {
                      style: {
                        fontSize: "13px",
                        color: "var(--color-text, inherit)"
                      }
                    }, item.label),
                    h(Switch, {
                      modelValue: itemVisible,
                      "onUpdate:modelValue": (v) => patchItem(item.id, v),
                      disabled: busy.value
                    })
                  ]);
                }))
              ]) : null
            ]);
          }))
        ]);
    }
  });

export async function activate(ctx) {
  const discovered = await ctx.storage.get(STORAGE_KEY_SECTIONS);
  allSections = mergeSections(discovered);

  state = ctx.vue.reactive({
    settings: normalizeSettings(await ctx.storage.get(STORAGE_KEY), allSections),
    sections: [...allSections]
  });

  settingsDispose = ctx.ui.settings.define({
    title: "设置简化器",
    description: "控制主应用设置页中各分组和子项的显示与隐藏，如果出现空白请先打开一次主应用的设置页",
    component: createSettingsComponent(ctx)
  });

  const applyStyles = () => {
    if (styleDispose) {
      styleDispose();
      styleDispose = null;
    }
    const css = generateCSS(state.settings, allSections);
    if (css) {
      styleDispose = ctx.css.inject(css, { id: "settings-simplifier-style" });
    }
    updateAnchorBar(state.settings, allSections);
  };

  applyStyles();

  domObserver = ctx.dom.observe('.settings-anchor-bar', () => {
    updateAnchorBar(state.settings, allSections);
  });

  sectionObserver = ctx.dom.observe('[data-section]', () => {
    delayedScan(ctx);
  });
}

export function deactivate() {
  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }
  
  const anchorButtons = document.querySelectorAll('.settings-anchor-item');
  anchorButtons.forEach(btn => { btn.style.display = ''; });

  const items = document.querySelectorAll('[data-settings-item]');
  items.forEach(item => { item.style.display = ''; });

  const dividers = document.querySelectorAll('[data-settings-divider-before], [data-settings-divider-after]');
  dividers.forEach(divider => {
    divider.removeAttribute('data-settings-divider-before');
    divider.removeAttribute('data-settings-divider-after');
    divider.style.display = '';
  });

  if (settingsDispose) {
    settingsDispose();
    settingsDispose = null;
  }
  if (styleDispose) {
    styleDispose();
    styleDispose = null;
  }
  if (domObserver) {
    domObserver();
    domObserver = null;
  }
  if (sectionObserver) {
    sectionObserver();
    sectionObserver = null;
  }
  state = null;
}