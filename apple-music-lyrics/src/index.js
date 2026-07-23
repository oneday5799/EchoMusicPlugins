import {
  LayoutAlignAnchor,
  LyricPlayer,
} from "@applemusic-like-lyrics/core";
import amllCoreCss from "@applemusic-like-lyrics/core/style.css";

const STORAGE_KEY = "apple-music-lyrics-settings";

const DEFAULT_SETTINGS = {
  enabled: false,
  hideNativeLyrics: true,
  followEchoAppearance: true,
  enhanceContrast: true,
  enableBlur: false,
  enableScale: true,
  enableSpring: false,
  frameRate: 30,
  alignPosition: 48,
  fadeWidth: 50,
};

let state = null;
let effectDispose = null;
let settingsDispose = null;
let styleDispose = null;
let settingsStyleDispose = null;
let saveTimer = 0;

const mountedHosts = new Set();

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number(value) || 0));

const isSafeCssValue = (value) => {
  const text = String(value ?? "").trim();
  return Boolean(text && !/[;{}<>]/.test(text));
};

const safeCssValue = (value, fallback) =>
  isSafeCssValue(value) ? String(value).trim() : fallback;

const normalizeSettings = (value) => {
  const source = value && typeof value === "object" ? value : {};
  return {
    ...DEFAULT_SETTINGS,
    ...source,
    enabled: source.enabled ?? DEFAULT_SETTINGS.enabled,
    hideNativeLyrics:
      source.hideNativeLyrics ?? DEFAULT_SETTINGS.hideNativeLyrics,
    followEchoAppearance:
      source.followEchoAppearance ?? DEFAULT_SETTINGS.followEchoAppearance,
    enhanceContrast: source.enhanceContrast ?? DEFAULT_SETTINGS.enhanceContrast,
    enableBlur: source.enableBlur ?? DEFAULT_SETTINGS.enableBlur,
    enableScale: source.enableScale ?? DEFAULT_SETTINGS.enableScale,
    enableSpring: source.enableSpring ?? DEFAULT_SETTINGS.enableSpring,
    frameRate: clamp(source.frameRate ?? DEFAULT_SETTINGS.frameRate, 15, 60),
    alignPosition: clamp(
      source.alignPosition ?? DEFAULT_SETTINGS.alignPosition,
      25,
      70,
    ),
    fadeWidth: clamp(source.fadeWidth ?? DEFAULT_SETTINGS.fadeWidth, 10, 120),
  };
};

const scheduleSave = (ctx) => {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = 0;
    if (!state) return;
    void ctx.storage.set(STORAGE_KEY, normalizeSettings(state.settings));
  }, 240);
};

const getLineStartMs = (line) => {
  const firstChar = line?.characters?.[0];
  if (Number.isFinite(firstChar?.startTime)) return firstChar.startTime;
  return Math.round((Number(line?.time) || 0) * 1000);
};

const getLineEndMs = (line, nextLine) => {
  const chars = Array.isArray(line?.characters) ? line.characters : [];
  const lastChar = chars[chars.length - 1];
  if (Number.isFinite(lastChar?.endTime) && lastChar.endTime > getLineStartMs(line)) {
    return lastChar.endTime;
  }

  const nextStart = getLineStartMs(nextLine);
  if (Number.isFinite(nextStart) && nextStart > getLineStartMs(line)) {
    return Math.max(getLineStartMs(line) + 500, nextStart - 80);
  }

  return getLineStartMs(line) + 4200;
};

const normalizeWordText = (value) => String(value ?? "").replace(/\s+/g, " ");

const createFallbackWords = (text, startTime, endTime) => {
  const content = normalizeWordText(text).trim();
  if (!content) return [];
  return [{ word: content, startTime, endTime }];
};

const shouldShowTranslated = (lyricsMode) =>
  lyricsMode === "translation" || lyricsMode === "both";

const shouldShowRomanized = (lyricsMode) =>
  lyricsMode === "romanization" || lyricsMode === "both";

const convertEchoLinesToAmll = (lines, lyricsMode) =>
  (Array.isArray(lines) ? lines : [])
    .map((line, index, sourceLines) => {
      const startTime = getLineStartMs(line);
      const endTime = Math.max(startTime + 300, getLineEndMs(line, sourceLines[index + 1]));
      const rawChars = Array.isArray(line?.characters) ? line.characters : [];
      const timedChars = rawChars
        .map((char) => ({
          word: normalizeWordText(char?.text),
          startTime: Number(char?.startTime),
          endTime: Number(char?.endTime),
        }))
        .filter(
          (word) =>
            word.word &&
            Number.isFinite(word.startTime) &&
            Number.isFinite(word.endTime) &&
            word.endTime > word.startTime,
        );

      return {
        words: timedChars.length
          ? timedChars
          : createFallbackWords(line?.text, startTime, endTime),
        translatedLyric: shouldShowTranslated(lyricsMode)
          ? String(line?.translated || "")
          : "",
        romanLyric: shouldShowRomanized(lyricsMode)
          ? String(line?.romanized || "")
          : "",
        startTime,
        endTime,
        isBG: false,
        isDuet: false,
      };
    })
    .filter((line) => line.words.length > 0);

const createLinesSignature = (lines) =>
  (Array.isArray(lines) ? lines : [])
    .map((line) => {
      const chars = Array.isArray(line?.characters) ? line.characters : [];
      const first = chars[0];
      const last = chars[chars.length - 1];
      return [
        getLineStartMs(line),
        Number(first?.startTime) || 0,
        Number(last?.endTime) || 0,
        String(line?.text || ""),
        String(line?.translated || ""),
        String(line?.romanized || ""),
        chars.length,
      ].join(":");
    })
    .join("\n");

const getTimelineMs = (snapshot) =>
  Math.max(0, Number(snapshot?.timelineMs) || 0);

const isEffectActive = (snapshot) =>
  Boolean(state?.settings?.enabled && snapshot?.hasLyrics);

const shouldRunAnimation = (snapshot) =>
  Boolean(isEffectActive(snapshot) && snapshot?.isPlaying);

const getTargetFrameMs = () => {
  const frameRate = clamp(state?.settings?.frameRate ?? DEFAULT_SETTINGS.frameRate, 15, 60);
  return 1000 / frameRate;
};

const updatePlayerRenderState = (entry) => {
  const playerElement = entry.playerElement;
  const childCount = playerElement?.childElementCount || 0;
  const className = playerElement?.className || "";
  const hasCoreClass = Boolean(playerElement?.classList.contains("amll-lyric-player"));

  entry.amllReady = Boolean(entry.player && hasCoreClass && childCount > 2);
  entry.container.dataset.echoAmllClass = className;
  entry.container.dataset.echoAmllChildren = String(childCount);
  entry.container.dataset.echoAmllReady = entry.amllReady ? "true" : "false";
  return entry.amllReady;
};

const syncHostState = (entry, snapshot) => {
  if (!state) return;
  const settings = state.settings;
  const enabled = isEffectActive(snapshot) ? "true" : "false";
  const hideNative =
    isEffectActive(snapshot) && settings.hideNativeLyrics && entry.amllReady
      ? "true"
      : "false";

  if (entry.host.root.dataset.echoAmllEnabled !== enabled) {
    entry.host.root.dataset.echoAmllEnabled = enabled;
  }
  if (entry.host.root.dataset.echoAmllHideNative !== hideNative) {
    entry.host.root.dataset.echoAmllHideNative = hideNative;
  }
};

const ensurePlayer = (entry) => {
  if (entry.player) return true;
  if (!entry.container.isConnected) {
    entry.host.overlay.appendChild(entry.container);
  }
  const player = new LyricPlayer();
  const playerElement = player.getElement();
  playerElement.classList.add("echo-amll-player");
  entry.container.replaceChildren(playerElement);
  entry.player = player;
  entry.playerElement = playerElement;
  entry.optionsKey = "";
  entry.optionValues = {};
  entry.appearanceKey = "";
  entry.linesSignature = "";
  entry.linesRef = null;
  entry.linesLength = 0;
  return true;
};

const disposePlayer = (entry) => {
  if (entry.layoutFrameId) {
    window.cancelAnimationFrame(entry.layoutFrameId);
    entry.layoutFrameId = 0;
  }
  if (!entry.player) return;
  entry.player.dispose?.();
  entry.player = null;
  entry.playerElement = null;
  entry.amllReady = false;
  entry.container.dataset.echoAmllPlayer = "false";
  entry.container.dataset.echoAmllReady = "false";
  entry.optionsKey = "";
  entry.optionValues = {};
  entry.appearanceKey = "";
  entry.linesSignature = "";
  entry.linesRef = null;
  entry.linesLength = 0;
  entry.lastTimelineMs = Number.NaN;
  entry.lastPlaying = undefined;
  entry.container.replaceChildren();
};

const forcePlayerLayout = (entry, snapshot) => {
  if (!entry.player) return;
  const player = entry.player;
  const timelineMs = getTimelineMs(snapshot);
  player.setCurrentTime(timelineMs, true);
  if (typeof player.calcLayout === "function") {
    void Promise.resolve(player.calcLayout(true, true))
      .then(() => {
        if (entry.player !== player) return;
        player.update(0);
        updatePlayerRenderState(entry);
        syncHostState(entry, snapshot);
      })
      .catch(() => undefined);
  }
  player.update(0);
  updatePlayerRenderState(entry);
  syncHostState(entry, snapshot);
  entry.lastTimelineMs = timelineMs;
};

const schedulePlayerLayout = (entry, snapshot) => {
  if (entry.layoutFrameId) {
    window.cancelAnimationFrame(entry.layoutFrameId);
  }
  entry.layoutFrameId = window.requestAnimationFrame(() => {
    entry.layoutFrameId = 0;
    forcePlayerLayout(entry, snapshot);
  });
};

const applyPlayerAppearance = (entry, snapshot) => {
  if (!state || !entry.playerElement) return;
  const settings = state.settings;
  const appearance = snapshot?.appearance || {};
  const playedColor = settings.followEchoAppearance
    ? safeCssValue(appearance.playedColor, "rgba(255, 255, 255, 0.98)")
    : "rgba(255, 255, 255, 0.98)";
  const unplayedColor = settings.followEchoAppearance
    ? safeCssValue(appearance.unplayedColor, "rgba(255, 255, 255, 0.92)")
    : "rgba(255, 255, 255, 0.92)";
  const fontFamily = settings.followEchoAppearance
    ? safeCssValue(appearance.fontFamily, "")
    : "";
  const fontScale = settings.followEchoAppearance
    ? clamp(appearance.fontScale ?? 1, 0.75, 1.5)
    : 1;
  const fontWeight = settings.followEchoAppearance
    ? clamp(appearance.fontWeight ?? 850, 300, 900)
    : 850;
  const textShadow = settings.enhanceContrast
    ? "0 2px 8px rgba(0,0,0,.48), 0 12px 32px rgba(0,0,0,.34)"
    : safeCssValue(appearance.textShadow, "0 2px 8px rgba(0,0,0,.26)");

  const appearanceKey = [
    playedColor,
    unplayedColor,
    fontFamily,
    fontScale,
    fontWeight,
    textShadow,
    settings.enhanceContrast,
  ].join("|");
  if (entry.appearanceKey === appearanceKey) return;
  entry.appearanceKey = appearanceKey;

  const style = entry.playerElement.style;
  style.setProperty("--echo-amll-played-color", playedColor);
  style.setProperty("--echo-amll-unplayed-color", unplayedColor);
  style.setProperty("--echo-amll-font-scale", String(fontScale));
  style.setProperty("--echo-amll-font-weight", String(fontWeight));
  style.setProperty("--echo-amll-text-shadow", textShadow);
  style.setProperty("--echo-amll-sub-opacity", settings.enhanceContrast ? "0.66" : "0.56");
  style.setProperty("--echo-amll-bg-opacity", settings.enhanceContrast ? "0.58" : "0.46");
  style.fontFamily = fontFamily;
};

const applyPlayerOptions = (entry, snapshot, forceRelayout = false) => {
  if (!state) return;
  syncHostState(entry, snapshot);
  if (!isEffectActive(snapshot) || !entry.player) return;
  applyPlayerAppearance(entry, snapshot);

  const settings = state.settings;
  const reducedMotion = Boolean(snapshot?.reducedMotion);
  const options = {
    blur: Boolean(settings.enableBlur && !reducedMotion),
    scale: Boolean(settings.enableScale && !reducedMotion),
    spring: Boolean(settings.enableSpring && !reducedMotion),
    fadeWidth: Math.max(0.1, settings.fadeWidth / 100),
    alignPosition: settings.alignPosition / 100,
  };
  const optionsKey = [
    options.blur,
    options.scale,
    options.spring,
    options.fadeWidth,
    options.alignPosition,
  ].join("|");

  if (!forceRelayout && entry.optionsKey === optionsKey) return;
  entry.optionsKey = optionsKey;

  if (entry.optionValues.blur !== options.blur) {
    entry.optionValues.blur = options.blur;
    entry.player.setEnableBlur(options.blur);
  }
  if (entry.optionValues.scale !== options.scale) {
    entry.optionValues.scale = options.scale;
    entry.player.setEnableScale(options.scale);
  }
  if (entry.optionValues.spring !== options.spring) {
    entry.optionValues.spring = options.spring;
    entry.player.setEnableSpring(options.spring);
  }
  if (entry.optionValues.fadeWidth !== options.fadeWidth) {
    entry.optionValues.fadeWidth = options.fadeWidth;
    entry.player.setWordFadeWidth(options.fadeWidth);
  }
  if (entry.optionValues.alignAnchor !== LayoutAlignAnchor.Center) {
    entry.optionValues.alignAnchor = LayoutAlignAnchor.Center;
    entry.player.setAlignAnchor(LayoutAlignAnchor.Center);
  }
  if (entry.optionValues.alignPosition !== options.alignPosition) {
    entry.optionValues.alignPosition = options.alignPosition;
    entry.player.setAlignPosition(options.alignPosition);
  }

  if (forceRelayout && typeof entry.player.calcLayout === "function") {
    void entry.player.calcLayout(false, true);
  }
};

const syncLines = (entry, snapshot, force = false) => {
  if (!isEffectActive(snapshot) || !ensurePlayer(entry)) return;

  const lines = Array.isArray(snapshot?.lines) ? snapshot.lines : [];
  const lyricsMode = snapshot?.lyricsMode || "none";
  const modeChanged = entry.lyricsMode !== lyricsMode;
  if (
    !force &&
    entry.linesRef === lines &&
    entry.linesLength === lines.length &&
    !modeChanged
  ) {
    return;
  }

  entry.linesRef = lines;
  entry.linesLength = lines.length;
  const signature = createLinesSignature(snapshot?.lines);
  if (!force && !modeChanged && signature === entry.linesSignature) return;

  entry.linesSignature = signature;
  entry.lyricsMode = lyricsMode;
  const amllLines = convertEchoLinesToAmll(snapshot?.lines, lyricsMode);
  entry.amllReady = false;
  entry.container.dataset.echoAmllLines = String(amllLines.length);
  entry.container.dataset.echoAmllPlayer = entry.player ? "true" : "false";
  entry.player.setLyricLines(amllLines, getTimelineMs(snapshot));
  updatePlayerRenderState(entry);
  syncHostState(entry, snapshot);
  entry.lastTimelineMs = Number.NaN;
  applyPlayerOptions(entry, snapshot, true);
  schedulePlayerLayout(entry, snapshot);
};

const stopFrameLoop = (entry) => {
  if (!entry.frameId) return;
  window.cancelAnimationFrame(entry.frameId);
  entry.frameId = 0;
  entry.lastFrameTime = 0;
};

const updatePlayerTime = (entry, snapshot, deltaMs, forceSeek = false) => {
  if (!isEffectActive(snapshot)) {
    entry.player?.pause?.();
    entry.lastTimelineMs = Number.NaN;
    return;
  }
  if (!entry.player) return;

  const timelineMs = getTimelineMs(snapshot);
  const expectedTimeline =
    Number.isFinite(entry.lastTimelineMs)
      ? entry.lastTimelineMs + deltaMs * Math.max(0.1, Number(snapshot?.playbackRate) || 1)
      : timelineMs;
  const isSeek = forceSeek || Math.abs(timelineMs - expectedTimeline) > 700;

  if (entry.lastPlaying !== snapshot?.isPlaying) {
    entry.lastPlaying = snapshot?.isPlaying;
    if (snapshot?.isPlaying) entry.player.resume?.();
    else entry.player.pause?.();
  }

  entry.player.setCurrentTime(timelineMs, isSeek);
  entry.player.update(deltaMs);
  entry.lastTimelineMs = timelineMs;
};

const runFrame = (entry, time) => {
  if (!mountedHosts.has(entry)) return;
  entry.frameId = 0;

  if (entry.lastFrameTime && time - entry.lastFrameTime < getTargetFrameMs()) {
    entry.frameId = window.requestAnimationFrame((nextTime) =>
      runFrame(entry, nextTime),
    );
    return;
  }

  const deltaMs = Math.min(80, Math.max(0, time - entry.lastFrameTime));
  entry.lastFrameTime = time;

  const snapshot = entry.host.getSnapshot();
  entry.snapshot = snapshot;
  syncHostState(entry, snapshot);
  updatePlayerTime(entry, snapshot, deltaMs);

  if (shouldRunAnimation(snapshot)) {
    entry.frameId = window.requestAnimationFrame((nextTime) =>
      runFrame(entry, nextTime),
    );
  } else {
    entry.lastFrameTime = 0;
  }
};

const startFrameLoop = (entry) => {
  if (entry.frameId || !shouldRunAnimation(entry.snapshot)) return;
  entry.lastFrameTime = 0;
  entry.frameId = window.requestAnimationFrame((time) => runFrame(entry, time));
};

const syncSnapshot = (entry, snapshot, force = false) => {
  entry.snapshot = snapshot;
  syncHostState(entry, snapshot);

  if (!isEffectActive(snapshot)) {
    stopFrameLoop(entry);
    disposePlayer(entry);
    return;
  }

  ensurePlayer(entry);
  syncLines(entry, snapshot, force);
  applyPlayerOptions(entry, snapshot, force);

  if (shouldRunAnimation(snapshot)) {
    startFrameLoop(entry);
  } else {
    stopFrameLoop(entry);
    updatePlayerTime(entry, snapshot, 0, force);
  }
};

const mountAmllPageLyrics = (host) => {
  const container = document.createElement("div");
  container.className = "echo-amll-player-shell";
  container.setAttribute("aria-hidden", "true");
  host.overlay.appendChild(container);

  const entry = {
    host,
    player: null,
    playerElement: null,
    container,
    snapshot: host.getSnapshot(),
    linesSignature: "",
    linesRef: null,
    linesLength: 0,
    lyricsMode: "none",
    frameId: 0,
    layoutFrameId: 0,
    amllReady: false,
    lastFrameTime: 0,
    lastTimelineMs: Number.NaN,
    lastPlaying: undefined,
    optionsKey: "",
    optionValues: {},
    appearanceKey: "",
    unsubscribe: null,
  };

  mountedHosts.add(entry);
  syncSnapshot(entry, entry.snapshot, true);

  entry.unsubscribe = host.subscribe((snapshot) => {
    syncSnapshot(entry, snapshot);
  });

  return () => {
    mountedHosts.delete(entry);
    entry.unsubscribe?.();
    stopFrameLoop(entry);
    if (entry.layoutFrameId) window.cancelAnimationFrame(entry.layoutFrameId);
    entry.host.root.removeAttribute("data-echo-amll-enabled");
    entry.host.root.removeAttribute("data-echo-amll-hide-native");
    disposePlayer(entry);
    entry.container.remove();
  };
};

const AMLL_PLUGIN_CSS = `
.echo-amll-page[data-echo-amll-hide-native="true"] [data-echo-lyric-scroller="page"] {
  opacity: 0;
}

.echo-amll-page [data-echo-lyric-effect-overlay] {
  pointer-events: none;
}

.echo-amll-player-shell {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 240px;
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: none;
}

.echo-amll-player {
  width: 100%;
  height: 100%;
  min-height: 240px;
}

.echo-amll-page[data-echo-amll-enabled="true"] .echo-amll-player-shell {
  opacity: 1;
}

.echo-amll-player-shell .amll-lyric-player {
  --amll-lp-color: var(--echo-amll-played-color, rgba(255, 255, 255, 0.98));
  --amll-lp-bg-color: transparent;
  --amll-lp-hover-bg-color: rgba(255, 255, 255, 0.08);
  --amll-lp-font-size: clamp(28px, calc(4.8vh * var(--echo-amll-font-scale, 1)), 58px);
  --amll-lp-line-width-aspect: 0.86;
  --amll-lp-line-padding-x: 0.35em;
  --amll-lp-bg-line-scale: 0.74;
  color: var(--echo-amll-unplayed-color, rgba(255, 255, 255, 0.92));
  mix-blend-mode: normal;
  text-shadow: var(--echo-amll-text-shadow, 0 2px 8px rgba(0,0,0,.48), 0 12px 32px rgba(0,0,0,.34));
}

.echo-amll-player-shell .amll-lyric-player [class*="_lyricMainLine"] {
  color: var(--echo-amll-unplayed-color, rgba(255, 255, 255, 0.92));
  font-weight: var(--echo-amll-font-weight, 850);
}

.echo-amll-player-shell .amll-lyric-player [class*="_lyricSubLine"] {
  color: var(--echo-amll-unplayed-color, rgba(255, 255, 255, 0.9));
  opacity: var(--echo-amll-sub-opacity, 0.66) !important;
}

.echo-amll-player-shell .amll-lyric-player [class*="_lyricBgLine"] {
  color: var(--echo-amll-unplayed-color, rgba(255, 255, 255, 0.86));
  opacity: var(--echo-amll-bg-opacity, 0.58) !important;
}

.lyric-mode .echo-amll-player-shell .amll-lyric-player,
.portrait-mode .echo-amll-player-shell .amll-lyric-player {
  --lyric-line-padding-x: clamp(42px, 8vw, 132px);
}

.echo-amll-player-shell .amll-lyric-player [class*="_lyricLine"][class*="_active"] [class*="_lyricMainLine"],
.echo-amll-player-shell .amll-lyric-player [class*="_lyricMainLine"][class*="_active"] {
  color: var(--echo-amll-played-color, #fff);
}

.echo-amll-player-shell .amll-lyric-player [class*="_lyricLine"][class*="_active"] [class*="_lyricSubLine"] {
  color: var(--echo-amll-played-color, rgba(255, 255, 255, 0.94));
}
`;

const SETTINGS_CSS = `
.echo-amll-settings {
  display: grid;
  gap: 14px;
  color: var(--color-text-main);
}

.echo-amll-settings-row {
  display: grid;
  gap: 7px;
}

.echo-amll-settings-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.echo-amll-settings-title {
  font-size: 13px;
  font-weight: 760;
}

.echo-amll-settings-hint {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.echo-amll-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
`;

const refreshMountedHosts = () => {
  for (const entry of mountedHosts) {
    const snapshot = entry.host.getSnapshot();
    entry.snapshot = snapshot;
    syncLines(entry, snapshot, true);
    applyPlayerOptions(entry, snapshot, true);
  }
};

const updateSettings = (ctx, patch) => {
  if (!state) return;
  state.settings = normalizeSettings({ ...state.settings, ...patch });
  refreshMountedHosts();
  scheduleSave(ctx);
};

const createSettingsComponent = (ctx) =>
  ctx.vue.defineComponent({
    name: "AppleMusicLikeLyricsSettings",
    setup() {
      const { defineAsyncComponent, h } = ctx.vue;
      const Button = defineAsyncComponent(ctx.ui.components.Button);
      const Slider = defineAsyncComponent(ctx.ui.components.Slider);
      const Switch = defineAsyncComponent(ctx.ui.components.Switch);

      const slider = (label, key, min, max, hint, formatter = (value) => String(value)) =>
        h("div", { class: "echo-amll-settings-row" }, [
          h("div", { class: "echo-amll-settings-line" }, [
            h("span", { class: "echo-amll-settings-title" }, label),
            h("span", { class: "echo-amll-settings-hint" }, formatter(state.settings[key])),
          ]),
          h(Slider, {
            modelValue: state.settings[key],
            min,
            max,
            step: 1,
            "onUpdate:modelValue": (value) =>
              updateSettings(ctx, { [key]: Number(value) }),
          }),
          hint ? h("div", { class: "echo-amll-settings-hint" }, hint) : null,
        ]);

      const toggle = (label, key, hint) =>
        h("div", { class: "echo-amll-settings-row" }, [
          h("label", { class: "echo-amll-settings-line" }, [
            h("span", { class: "echo-amll-settings-title" }, label),
            h(Switch, {
              modelValue: Boolean(state.settings[key]),
              "onUpdate:modelValue": (value) =>
                updateSettings(ctx, { [key]: Boolean(value) }),
            }),
          ]),
          hint ? h("div", { class: "echo-amll-settings-hint" }, hint) : null,
        ]);

      return () =>
        h("div", { class: "echo-amll-settings" }, [
          toggle("启用 AMLL", "enabled", "只替换页面歌词的视觉渲染，关闭后回到原生歌词。"),
          toggle("隐藏原生歌词", "hideNativeLyrics", "保留原生歌词作为兜底，但视觉上显示 AMLL。"),
          toggle("跟随 EchoMusic 外观", "followEchoAppearance", "复用页面歌词的已播放色、未播放色、字体和字重。"),
          toggle("增强对比度", "enhanceContrast", "保留 AMLL 层次感，同时提高封面背景上的文字可读性。"),
          toggle("歌词模糊", "enableBlur", "开启 AMLL 的远离焦点行模糊效果。"),
          toggle("歌词缩放", "enableScale", "开启当前行聚焦缩放。"),
          toggle("弹簧动画", "enableSpring", "开启 AMLL 的弹簧滚动和行切换动画。"),
          slider(
            "帧率限制",
            "frameRate",
            15,
            60,
            "降低帧率可以减少 CPU 占用，默认 30fps。",
            (value) => `${value}fps`,
          ),
          slider(
            "对齐位置",
            "alignPosition",
            25,
            70,
            "当前歌词行在页面高度中的位置。",
            (value) => `${value}%`,
          ),
          slider(
            "逐字渐变",
            "fadeWidth",
            10,
            120,
            "控制逐字高亮边缘的柔和宽度。",
            (value) => `${(value / 100).toFixed(2)}x`,
          ),
          h("div", { class: "echo-amll-settings-actions" }, [
            h(
              Button,
              {
                variant: "outline",
                size: "xs",
                onClick: () => updateSettings(ctx, DEFAULT_SETTINGS),
              },
              { default: () => "恢复默认" },
            ),
          ]),
        ]);
    },
  });

export async function activate(ctx) {
  state = ctx.vue.reactive({
    settings: normalizeSettings(await ctx.storage.get(STORAGE_KEY)),
  });

  styleDispose = ctx.css.inject(`${amllCoreCss}\n${AMLL_PLUGIN_CSS}`, {
    id: "apple-music-lyrics-amll",
  });
  settingsStyleDispose = ctx.css.inject(SETTINGS_CSS, {
    id: "apple-music-lyrics-settings",
  });

  settingsDispose = ctx.ui.settings.define({
    title: "Apple Music-like 歌词",
    description: "使用 AMLL core 渲染页面歌词。",
    component: createSettingsComponent(ctx),
  });

  effectDispose = ctx.lyricEffects.register({
    id: "apple-music-like-lyrics-page",
    title: "Apple Music-like 页面歌词",
    scope: "page",
    layer: "decorator",
    order: 80,
    className: "echo-amll-page",
    mount: mountAmllPageLyrics,
  });
}

export function deactivate() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = 0;
  effectDispose?.();
  settingsDispose?.();
  settingsStyleDispose?.();
  styleDispose?.();
  effectDispose = null;
  settingsDispose = null;
  settingsStyleDispose = null;
  styleDispose = null;
  state = null;
  mountedHosts.clear();
}
