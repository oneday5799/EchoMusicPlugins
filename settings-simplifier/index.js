// ── Constants ──────────────────────────────
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

const STYLES = {
  container: { fontSize: "14px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--color-border, #e5e5e5)"
  },
  buttonGroup: { display: "flex", gap: "8px" },
  sectionList: { display: "flex", flexDirection: "column", gap: "8px" },
  sectionCard: {
    border: "1px solid var(--color-border, rgba(0, 0, 0, 0.1))",
    borderRadius: "8px",
    overflow: "hidden"
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "var(--color-bg-secondary, rgba(0, 0, 0, 0.02))",
    cursor: "pointer",
    userSelect: "none"
  },
  sectionTitleGroup: { display: "flex", alignItems: "center", gap: "8px" },
  expandIcon: {
    display: "inline-block",
    fontSize: "12px",
    color: "var(--color-text-secondary, #666)"
  },
  itemCount: {
    fontSize: "12px",
    color: "var(--color-text-secondary, #999)",
    marginLeft: "4px"
  },
  sectionContent: {
    padding: "8px 12px",
    borderTop: "1px solid var(--color-border, rgba(0, 0, 0, 0.1))"
  },
  itemActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginBottom: "8px"
  },
  itemList: { display: "flex", flexDirection: "column", gap: "4px" },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    borderRadius: "4px",
    background: "var(--color-bg-tertiary, rgba(0, 0, 0, 0.01))"
  },
  itemLabel: {
    fontSize: "13px",
    color: "var(--color-text, inherit)"
  }
};

// ── Module State ───────────────────────────
let allSections = [...BUILTIN_SECTIONS];
let state = null;
let styleDispose = null;
let settingsDispose = null;
let domObserver = null;
let sectionObserver = null;
let scanTimer = null;

// ── Utility Functions ──────────────────────
const normalizeSettings = (rawSettings, sections) => {
  const source = (rawSettings && typeof rawSettings === "object") ? rawSettings : {};
  const currentItems = {};
  sections.forEach(s => {
    (s.items || []).forEach(item => {
      const old = (source.items || {})[item.id];
      currentItems[item.id] = old !== undefined ? old : true;
    });
  });
  return {
    sections: { ...(source.sections || {}) },
    items: currentItems
  };
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
  document.querySelectorAll('.settings-anchor-item').forEach(btn => {
    const text = btn.textContent?.trim();
    const hidden = sections.some(s => settings.sections[s.id] === false && s.label === text);
    btn.style.display = hidden ? 'none' : '';
  });
};

const scanSectionsFromDOM = () => {
  const elements = document.querySelectorAll('[data-section]');
  if (!elements.length) return [];

  const discovered = [];
  elements.forEach(el => {
    const id = el.dataset.section;
    if (!id) return;
    const h2 = el.querySelector('h2');
    const label = h2?.textContent?.trim() || id;

    const items = [];
    const settingsCard = el.querySelector('.settings-card');
    if (settingsCard) {
      const seenIds = {};
      settingsCard.querySelectorAll('.settings-item').forEach((child, index) => {
        const h3 = child.querySelector('h3');
        const itemLabel = h3?.textContent?.trim() || `子项 ${index + 1}`;
        const baseId = `${id}_${itemLabel}`;
        const seenCount = (seenIds[baseId] = (seenIds[baseId] || 0) + 1);
        const itemId = seenCount === 1 ? baseId : `${baseId}_${seenCount}`;
        items.push({ id: itemId, label: itemLabel, sectionId: id });
        child.setAttribute('data-settings-item', itemId);

        const prevSibling = child.previousElementSibling;
        if (prevSibling?.classList.contains('settings-divider')) {
          prevSibling.setAttribute('data-settings-divider-before', itemId);
        }

        const nextSibling = child.nextElementSibling;
        if (nextSibling?.classList.contains('settings-divider')) {
          nextSibling.setAttribute('data-settings-divider-after', itemId);
        }
      });
    }

    discovered.push({ id, label, items });
  });

  return discovered;
};

const mergeSections = (discovered) => {
  const result = BUILTIN_SECTIONS.map(s => ({ ...s, items: [] }));
  if (discovered) {
    discovered.forEach(d => {
      const existing = result.find(s => s.id === d.id);
      if (existing) {
        existing.label = (d.label && d.label !== d.id) ? d.label : existing.label;
        existing.items = (d.items && d.items.length > 0) ? d.items : existing.items;
      } else {
        result.push(d);
      }
    });
  }
  return result;
};

// ── Delayed Scan ───────────────────────────
const delayedScan = (ctx) => {
  if (scanTimer) clearTimeout(scanTimer);
  scanTimer = setTimeout(() => {
    const discovered = scanSectionsFromDOM();
    const merged = mergeSections(discovered);
    const changed = merged.length !== allSections.length ||
      merged.some((s, i) => allSections[i]?.id !== s.id || s.items?.length !== allSections[i]?.items?.length);
    if (changed) {
      allSections = merged;
      ctx.storage.set(STORAGE_KEY_SECTIONS, discovered);
      state.settings = normalizeSettings(state.settings, merged);
      state.sections = merged;
      if (styleDispose) { styleDispose(); styleDispose = null; }
      const css = generateCSS(state.settings, allSections);
      if (css) { styleDispose = ctx.css.inject(css, { id: "settings-simplifier-style" }); }
      updateAnchorBar(state.settings, allSections);
    }
    scanTimer = null;
  }, 300);
};

// ── Component ──────────────────────────────
const createSettingsComponent = (ctx) =>
  ctx.vue.defineComponent({
    name: "SettingsSimplifierSettings",
    setup() {
      const { h, ref, watch, defineAsyncComponent } = ctx.vue;

      const Switch = defineAsyncComponent(ctx.ui.components.Switch);
      const Button = defineAsyncComponent(ctx.ui.components.Button);

      const sections = ref([...allSections]);
      const settings = ref(normalizeSettings(state?.settings, allSections));
      const expandedSections = ref({});
      const isBusy = ref(false);

      watch(() => state?.settings, (newSettings) => {
        if (newSettings && !isBusy.value) {
          settings.value = normalizeSettings(newSettings, sections.value);
        }
      }, { deep: true });

      watch(() => state?.sections, (newSections) => {
        if (newSections && newSections.length > 0) {
          sections.value = [...newSections];
        }
      }, { deep: true });

      const updateCSS = async () => {
        if (styleDispose) { styleDispose(); styleDispose = null; }
        const css = generateCSS(settings.value, sections.value);
        if (css) { styleDispose = ctx.css.inject(css, { id: "settings-simplifier-style" }); }
        updateAnchorBar(settings.value, sections.value);
      };

      const applySettingsMutation = async (mutator) => {
        mutator();
        isBusy.value = true;
        try {
          await ctx.storage.set(STORAGE_KEY, settings.value);
          state.settings = { ...settings.value };
          await updateCSS();
        } finally {
          isBusy.value = false;
        }
      };

      const patch = async (category, id, value) => {
        await applySettingsMutation(() => {
          settings.value = {
            ...settings.value,
            [category]: { ...settings.value[category], [id]: Boolean(value) }
          };
        });
      };

      const setAllSections = async (visible) => {
        await applySettingsMutation(() => {
          const newSections = { ...settings.value.sections };
          sections.value.forEach(s => { newSections[s.id] = visible; });
          settings.value = { ...settings.value, sections: newSections };
        });
      };

      const setAllItems = async (sectionId, visible) => {
        const section = sections.value.find(s => s.id === sectionId);
        if (!section) return;
        await applySettingsMutation(() => {
          const newItems = { ...settings.value.items };
          section.items.forEach(item => { newItems[item.id] = visible; });
          settings.value = { ...settings.value, items: newItems };
        });
      };

      const resetAll = async () => {
        await applySettingsMutation(() => {
          const newSections = {};
          const newItems = {};
          sections.value.forEach(s => {
            newSections[s.id] = true;
            s.items.forEach(item => { newItems[item.id] = true; });
          });
          settings.value = { sections: newSections, items: newItems };
        });
      };

      const applyRecommended = async () => {
        try {
          const pluginDir = await ctx.electron.plugins.getDirectory();
          const filePath = `${pluginDir}/${ctx.id}/recommended-settings.json`;
          const result = await ctx.fs.readTextFile(filePath);
          if (!result.ok) throw new Error('读取文件失败');
          const raw = result.text ?? result.content ?? result.data ?? result;
          const config = typeof raw === 'string' ? JSON.parse(raw) : raw;
          await applySettingsMutation(() => {
            settings.value = {
              sections: { ...config.sections },
              items: { ...config.items || {} }
            };
          });
        } catch (err) {
          ctx.toast.danger(`加载推荐配置失败：${err?.message || '未知错误'}`);
        }
      };

      const refreshSections = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const discovered = scanSectionsFromDOM();
        if (discovered.length > 0) {
          const merged = mergeSections(discovered);
          sections.value = merged;
          allSections = merged;
          state.sections = merged;
          await ctx.storage.set(STORAGE_KEY_SECTIONS, discovered);
          settings.value = normalizeSettings(state?.settings, merged);
        }
      };

      const toggleExpand = (sectionId) => {
        expandedSections.value = {
          ...expandedSections.value,
          [sectionId]: !expandedSections.value[sectionId]
        };
      };

      const exportSettings = async () => {
        const config = {
          version: '1.0',
          plugin: 'settings-simplifier',
          sections: { ...settings.value.sections },
          items: { ...settings.value.items }
        };
        const text = JSON.stringify(config, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'settings-simplifier.json';
        a.click();
        URL.revokeObjectURL(url);
        ctx.toast.success('配置已导出');
      };

      const importSettings = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.txt';

        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          let config;
          try {
            const text = (await file.text()).replace(/^\uFEFF/, '').trim();
            config = JSON.parse(text);
          } catch (err) {
            ctx.toast.danger(`导入失败：${err?.message || '文件内容不是有效的JSON'}`);
            return;
          }

          if (!config.version) {
            ctx.toast.danger('无效的配置格式：缺少 version 字段');
            return;
          }
          if (!config.sections || typeof config.sections !== 'object') {
            ctx.toast.danger('无效的配置格式：缺少 sections 字段');
            return;
          }
          if (config.items && typeof config.items !== 'object') {
            ctx.toast.danger('无效的配置格式：items 字段必须是对象');
            return;
          }

          const sectionCount = Object.keys(config.sections).length;
          const itemCount = Object.keys(config.items || {}).length;

          try {
            await applySettingsMutation(() => {
              settings.value = {
                sections: { ...config.sections },
                items: { ...config.items || {} }
              };
            });
            ctx.toast.success(`配置已导入：${sectionCount}个分组，${itemCount}个子项`);
          } catch (err) {
            ctx.toast.danger(`导入失败：${err?.message || '应用配置时出错'}`);
          }
        };

        input.click();
      };

      const renderHeader = () =>
        h("div", { style: STYLES.header }, [
          h("div", { style: STYLES.buttonGroup }, [
            h(Button, { size: "xs", onClick: async () => { await refreshSections(); await updateCSS(); }, disabled: isBusy.value }, { default: () => "刷新" }),
            h(Button, { size: "xs", onClick: () => setAllSections(true), disabled: isBusy.value }, { default: () => "全部显示" }),
            h(Button, { size: "xs", onClick: () => setAllSections(false), disabled: isBusy.value }, { default: () => "全部隐藏" }),
            h(Button, { size: "xs", onClick: exportSettings, disabled: isBusy.value }, { default: () => "导出设置" }),
            h(Button, { size: "xs", onClick: importSettings, disabled: isBusy.value }, { default: () => "导入设置" }),
            h(Button, { size: "xs", onClick: applyRecommended, disabled: isBusy.value }, { default: () => "使用推荐设置" }),
            h(Button, { size: "xs", onClick: resetAll, disabled: isBusy.value }, { default: () => "恢复默认" })
          ])
        ]);

      const renderItem = (item) => {
        const itemVisible = settings.value.items[item.id] !== false;
        return h("div", { key: item.id, style: STYLES.itemRow }, [
          h("span", { style: STYLES.itemLabel }, item.label),
          h(Switch, { modelValue: itemVisible, "onUpdate:modelValue": (v) => patch('items', item.id, v), disabled: isBusy.value })
        ]);
      };

      const renderSection = (section) => {
        const isExpanded = expandedSections.value[section.id];
        const sectionVisible = settings.value.sections[section.id] !== false;

        return h("div", { key: section.id, style: STYLES.sectionCard }, [
          h("div", { style: STYLES.sectionHeader, onClick: () => toggleExpand(section.id) }, [
            h("div", { style: STYLES.sectionTitleGroup }, [
              h("span", { style: { ...STYLES.expandIcon, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" } }, "▶"),
              h("span", { style: { fontWeight: "500" } }, section.label),
              h("span", { style: STYLES.itemCount }, `(${section.items.length}项)`)
            ]),
            h(Switch, { modelValue: sectionVisible, "onUpdate:modelValue": (v) => patch('sections', section.id, v), disabled: isBusy.value, onClick: (e) => e.stopPropagation() })
          ]),
          isExpanded ? h("div", { style: STYLES.sectionContent }, [
            h("div", { style: STYLES.itemActions }, [
              h(Button, { size: "xs", onClick: () => setAllItems(section.id, true), disabled: isBusy.value }, { default: () => "全部显示" }),
              h(Button, { size: "xs", onClick: () => setAllItems(section.id, false), disabled: isBusy.value }, { default: () => "全部隐藏" })
            ]),
            h("div", { style: STYLES.itemList }, section.items.map(item => renderItem(item)))
          ]) : null
        ]);
      };

      return () =>
        h("div", { class: "settings-simplifier-plugin", style: STYLES.container }, [
          renderHeader(),
          h("div", { style: STYLES.sectionList }, sections.value.map(section => renderSection(section)))
        ]);
    }
  });

// ── Lifecycle ──────────────────────────────
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

  if (styleDispose) { styleDispose(); styleDispose = null; }
  const css = generateCSS(state.settings, allSections);
  if (css) { styleDispose = ctx.css.inject(css, { id: "settings-simplifier-style" }); }
  updateAnchorBar(state.settings, allSections);

  domObserver = ctx.dom.observe('.settings-anchor-bar', () => {
    updateAnchorBar(state.settings, allSections);
  });

  sectionObserver = ctx.dom.observe('[data-section], .settings-item', () => {
    delayedScan(ctx);
  });

  if (document.querySelector('[data-section]')) {
    delayedScan(ctx);
  }
}

export function deactivate() {
  if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }

  document.querySelectorAll('.settings-anchor-item, [data-settings-item], [data-settings-divider-before], [data-settings-divider-after]').forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-settings-item');
    el.removeAttribute('data-settings-divider-before');
    el.removeAttribute('data-settings-divider-after');
  });

  if (settingsDispose) { settingsDispose(); settingsDispose = null; }
  if (styleDispose) { styleDispose(); styleDispose = null; }
  if (domObserver) { domObserver(); domObserver = null; }
  if (sectionObserver) { sectionObserver(); sectionObserver = null; }
  state = null;
}