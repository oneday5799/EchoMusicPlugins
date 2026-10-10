// 旧版虾米歌词风格 - lyricsPage 皮肤插件
// 通过 ctx.ui.lyricsPage.register() 注册完整歌词页皮肤，插件自行渲染歌词行：
// 当前行高亮放大带辉光、上下行渐隐、弹簧滚动跟随、行指示器、当前行溢出跑马灯。
// 架构参考 apple-music-style：宿主皮肤配置（useSkin）+ 全局设置面板 + 自动选中 + 预览图。

const SKIN_ID = "old-xiami";
const AUTO_SELECT_KEY = "old-xiami-lyric-styles-auto-select";
// 空歌词占位：保持引用稳定，避免 watch([lines]) 因身份变化误触发
const EMPTY_LINES = [];

// 滚动锚点：当前行中心对齐到容器高度 42% 处（与宿主歌词页一致）
const SCROLL_ANCHOR_RATIO = 0.42;
// 用户滚轮浏览后恢复自动跟随的等待时间
const USER_SCROLL_RESUME_MS = 5000;

// ── 配置 ──

const DEFAULT_SETTINGS = {
  pageStyle: "normal",
  fontScale: 150,
  fontWeight: 760,
  currentScale: 1.15,
  currentGlow: 38,
  idleOpacity: 0.45,
  scrollDuration: 420,
  lineHeight: 2.1,
  markerStyle: "bar",
  textAlign: "left",
  lyricPadding: 144,
};

const BOOLEAN_SETTINGS = [];

const ENUM_SETTINGS = {
  pageStyle: ["normal", "simple"],
  markerStyle: ["dot", "bar", "none"],
  textAlign: ["left", "center"],
};

const NUMBER_SETTINGS = {
  fontScale: [50, 200],
  fontWeight: [300, 900],
  currentScale: [1, 1.5],
  currentGlow: [0, 80],
  idleOpacity: [0.2, 0.8],
  scrollDuration: [100, 1200],
  lineHeight: [1.5, 5],
  lyricPadding: [0, 288],
};

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number(value) || 0));

const isAllDefaults = (values) =>
  Object.keys(DEFAULT_SETTINGS).every((key) =>
    Object.is(values[key], DEFAULT_SETTINGS[key]),
  );

const validateSettings = (values) => {
  if (!values || typeof values !== "object" || Array.isArray(values)) return false;
  for (const key of BOOLEAN_SETTINGS) {
    if (values[key] !== undefined && typeof values[key] !== "boolean") return false;
  }
  for (const [key, allowed] of Object.entries(ENUM_SETTINGS)) {
    if (values[key] !== undefined && !allowed.includes(values[key])) return false;
  }
  for (const [key, [min, max]] of Object.entries(NUMBER_SETTINGS)) {
    const value = values[key];
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < min || value > max) return false;
  }
  return true;
};

const normalizeSettings = (value) => {
  const source = value && typeof value === "object" ? value : {};
  return {
    pageStyle: ENUM_SETTINGS.pageStyle.includes(source.pageStyle)
      ? source.pageStyle
      : DEFAULT_SETTINGS.pageStyle,
    fontScale: clamp(
      source.fontScale ?? DEFAULT_SETTINGS.fontScale,
      ...NUMBER_SETTINGS.fontScale,
    ),
    fontWeight: clamp(
      source.fontWeight ?? DEFAULT_SETTINGS.fontWeight,
      ...NUMBER_SETTINGS.fontWeight,
    ),
    currentScale: clamp(
      source.currentScale ?? DEFAULT_SETTINGS.currentScale,
      ...NUMBER_SETTINGS.currentScale,
    ),
    currentGlow: clamp(
      source.currentGlow ?? DEFAULT_SETTINGS.currentGlow,
      ...NUMBER_SETTINGS.currentGlow,
    ),
    idleOpacity: clamp(
      source.idleOpacity ?? DEFAULT_SETTINGS.idleOpacity,
      ...NUMBER_SETTINGS.idleOpacity,
    ),
    scrollDuration: clamp(
      source.scrollDuration ?? DEFAULT_SETTINGS.scrollDuration,
      ...NUMBER_SETTINGS.scrollDuration,
    ),
    lineHeight: clamp(
      source.lineHeight ?? DEFAULT_SETTINGS.lineHeight,
      ...NUMBER_SETTINGS.lineHeight,
    ),
    markerStyle: ENUM_SETTINGS.markerStyle.includes(source.markerStyle)
      ? source.markerStyle
      : DEFAULT_SETTINGS.markerStyle,
    textAlign: ENUM_SETTINGS.textAlign.includes(source.textAlign)
      ? source.textAlign
      : DEFAULT_SETTINGS.textAlign,
    lyricPadding: clamp(
      source.lyricPadding ?? DEFAULT_SETTINGS.lyricPadding,
      ...NUMBER_SETTINGS.lyricPadding,
    ),
  };
};

// ── 预览图（16:9 SVG data URL） ──

const createXiamiPreviewSvg = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
  <defs>
    <linearGradient id="oxls-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#13262b"/>
      <stop offset="1" stop-color="#0a1418"/>
    </linearGradient>
    <linearGradient id="oxls-cover" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b565c"/>
      <stop offset="1" stop-color="#16333a"/>
    </linearGradient>
    <filter id="oxls-glow" x="-40%" y="-80%" width="180%" height="260%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="320" height="180" fill="url(#oxls-bg)"/>
  <g font-family="system-ui, sans-serif">
    <rect x="24" y="34" width="104" height="104" rx="10" fill="url(#oxls-cover)"/>
    <text x="76" y="94" font-size="30" fill="#ffffff" opacity="0.3" text-anchor="middle">♫</text>
    <text x="76" y="156" font-size="10" font-weight="700" fill="#ffffff" opacity="0.8" text-anchor="middle">歌曲名称</text>
    <text x="76" y="170" font-size="8" fill="#ffffff" opacity="0.4" text-anchor="middle">歌手名称</text>
    <text x="150" y="46" font-size="10" fill="#ffffff" opacity="0.3">上一句歌词渐隐</text>
    <rect x="140" y="72" width="3" height="20" rx="1.5" fill="#31cfa1"/>
    <text x="152" y="87" font-size="13" font-weight="700" fill="#31cfa1" filter="url(#oxls-glow)">当前行高亮放大</text>
    <text x="150" y="118" font-size="10" fill="#ffffff" opacity="0.45">下一句歌词渐隐</text>
    <text x="150" y="144" font-size="9" fill="#ffffff" opacity="0.22">更远的行逐渐模糊</text>
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// ── 弹簧滚动物理 ──

const derivative = (fn) => {
  const h = 0.001;
  return (x) => (fn(x + h) - fn(x - h)) / (2 * h);
};

const solveSpring = (from, velocity, to, params) => {
  const soft = params?.soft ?? false;
  const stiffness = params?.stiffness ?? 100;
  const damping = params?.damping ?? 10;
  const mass = params?.mass ?? 1;
  const delta = to - from;

  if (soft || 1 <= damping / (2 * Math.sqrt(stiffness * mass))) {
    const angularFrequency = -Math.sqrt(stiffness / mass);
    const leftover = -angularFrequency * delta - velocity;
    return (time) =>
      to - (delta + time * leftover) * Math.E ** (time * angularFrequency);
  }

  const dampingFrequency = Math.sqrt(4 * mass * stiffness - damping ** 2);
  const leftover = (damping * delta - 2 * mass * velocity) / dampingFrequency;
  const dfm = (0.5 * dampingFrequency) / mass;
  const dm = -0.5 * damping / mass;
  return (time) =>
    to -
    (Math.cos(time * dfm) * delta + Math.sin(time * dfm) * leftover) *
      Math.E ** (time * dm);
};

class SpringValue {
  constructor(value = 0) {
    this.value = value;
    this.target = value;
    this.time = 0;
    this.params = {};
    this.solver = () => this.target;
    this.getVelocity = () => 0;
    this.getAcceleration = () => 0;
  }

  setParams(params) {
    const nextParams = {
      ...this.params,
      ...params,
      mass: Math.max(0.1, Number(params?.mass ?? this.params.mass ?? 1) || 1),
      stiffness: Math.max(1, Number(params?.stiffness ?? this.params.stiffness ?? 100) || 100),
      damping: Math.max(0, Number(params?.damping ?? this.params.damping ?? 10) || 0),
    };
    const unchanged =
      this.params.mass === nextParams.mass &&
      this.params.stiffness === nextParams.stiffness &&
      this.params.damping === nextParams.damping &&
      this.params.soft === nextParams.soft;
    this.params = nextParams;
    if (!unchanged) this.resetSolver();
  }

  resetSolver() {
    const velocity = this.getVelocity(this.time);
    this.time = 0;
    this.solver = solveSpring(this.value, velocity, this.target, this.params);
    this.getVelocity = derivative(this.solver);
    this.getAcceleration = derivative(this.getVelocity);
  }

  setValue(value) {
    this.value = Number(value) || 0;
    this.target = this.value;
    this.time = 0;
    this.solver = () => this.target;
    this.getVelocity = () => 0;
    this.getAcceleration = () => 0;
  }

  setTarget(value) {
    const nextTarget = Number(value) || 0;
    if (Math.abs(nextTarget - this.target) < 0.0001) return;
    this.target = nextTarget;
    this.resetSolver();
  }

  update(deltaSeconds) {
    this.time += deltaSeconds;
    this.value = this.solver(this.time);
    if (this.settled()) this.setValue(this.target);
  }

  settled() {
    return (
      Math.abs(this.value - this.target) < 0.01 &&
      Math.abs(this.getVelocity(this.time)) < 0.01 &&
      Math.abs(this.getAcceleration(this.time)) < 0.01
    );
  }
}

// 由滚动过渡时长推导弹簧参数：时长越长越"软"
const getSpringParams = (scrollDuration) => {
  const t = clamp((scrollDuration - 100) / 1100, 0, 1);
  const mass = 0.8 + t * 0.4;
  const stiffness = 140 - t * 50;
  return {
    mass,
    stiffness,
    damping: 2 * Math.sqrt(stiffness * mass) + 0.5,
  };
};

const formatTime = (seconds) => {
  const s = Math.floor(Math.max(0, seconds));
  const m = Math.floor(s / 60);
  return `${m}:${s % 60 < 10 ? "0" : ""}${s % 60}`;
};

// ── 皮肤组件 ──

const createSkinComponent = (ctx) => {
  const {
    defineComponent,
    h,
    ref,
    computed,
    watch,
    nextTick,
    onMounted,
    onUnmounted,
    defineAsyncComponent,
  } = ctx.vue;
  const LyricPlayerControls = defineAsyncComponent(ctx.ui.components.LyricPlayerControls);
  const BarrageControls = defineAsyncComponent(ctx.ui.components.BarrageControls);

  return defineComponent({
    name: "OldXiamiLyricSkin",
    props: {
      page: { type: Object, required: true },
    },
    setup(props) {
      const skin = ctx.ui.lyricsPage.useSkin();
      const settings = computed(() => normalizeSettings(skin.settings.value));

      // ── 宿主状态 ──
      const state = computed(() => props.page.state.value);
      const lyrics = computed(() => state.value.lyrics);
      const track = computed(() => state.value.track);
      const lines = computed(() => lyrics.value.lines || EMPTY_LINES);
      const currentIndex = computed(() => lyrics.value.currentIndex);
      const isPlaying = computed(() => Boolean(state.value.isPlaying));
      const isLoading = computed(() => Boolean(state.value.isLoading));
      // 模糊背景用较小尺寸节省内存；左侧封面展示用 800 保障高分屏
      const coverUrl = computed(() =>
        String(track.value?.coverUrl || track.value?.cover || "").replace(/\{size\}/g, "480"),
      );
      const coverDisplayUrl = computed(() =>
        String(track.value?.coverUrl || track.value?.cover || "").replace(/\{size\}/g, "800"),
      );

      // ── 复用宿主歌词颜色 / 字体设置 ──
      const safeStoreText = (read, fallback) => {
        try {
          const value = read();
          const text = value == null ? "" : String(value);
          return text || fallback;
        } catch {
          return fallback;
        }
      };
      const playedColor = computed(() =>
        safeStoreText(
          () => ctx.lyric?.effectivePlayedColor,
          "var(--color-text-main, #ffffff)",
        ),
      );
      const unplayedColor = computed(() =>
        safeStoreText(
          () => ctx.lyric?.effectiveUnplayedColor,
          "var(--color-text-secondary, rgba(255, 255, 255, 0.6))",
        ),
      );
      const lyricFontFamily = computed(() =>
        safeStoreText(() => ctx.stores.settings?.buildLyricFontFamily?.(), ""),
      );
      const fontScaleMultiplier = computed(() => settings.value.fontScale / 100);
      const primaryFontSize = computed(
        () => `${(1.5 * fontScaleMultiplier.value).toFixed(3)}rem`,
      );
      const secondaryFontSize = computed(
        () => `${(1.2 * fontScaleMultiplier.value).toFixed(3)}rem`,
      );

      // 逐字（YRC）渐变背景：已播色 → 未播色（与宿主 activeYrcBgStyle 一致）
      const yrcBgStyle = computed(
        () => `linear-gradient(to right, ${playedColor.value} 50%, ${unplayedColor.value} 50%)`,
      );

      // ── 副歌词（翻译/音译）显示模式 ──
      const secondaryMode = computed(() => {
        const l = lyrics.value;
        const wantTrans = Boolean(l.wantTranslation) && Boolean(l.hasTranslation);
        const wantRoman = Boolean(l.wantRomanization) && Boolean(l.hasRomanization);
        if (wantTrans && wantRoman) return "both";
        if (wantTrans) return "translation";
        if (wantRoman) return "romanization";
        return "none";
      });

      // ── 减少动态效果偏好 ──
      const reducedMotion = ref(false);
      let reducedMotionQuery = null;
      const updateReducedMotion = () => {
        reducedMotion.value = Boolean(reducedMotionQuery?.matches);
      };

      // ── DOM 引用 ──
      const scrollerRef = ref(null);

      // ── 滚轮浏览状态 ──
      const isUserScrolling = ref(false);
      const scrollHighlightIndex = ref(-1);

      // ── 每行样式（虾米风格：距离衰减的放大 / 透明度 / 模糊） ──
      const rows = computed(() => {
        const s = settings.value;
        const idx = currentIndex.value;
        const mode = secondaryMode.value;
        const browse = scrollHighlightIndex.value;
        return lines.value.map((line, index) => {
          const distance = idx >= 0 ? index - idx : 0;
          const abs = Math.abs(distance);
          const isCurrent = index === idx;
          const isBrowse = browse >= 0 && index === browse;
          const effectsOn = !reducedMotion.value;
          const scale = effectsOn
            ? isCurrent
              ? s.currentScale
              : Math.max(0.88, 1 - abs * 0.04)
            : 1;
          const opacity = isCurrent || isBrowse ? 1 : Math.max(s.idleOpacity, 1 - abs * 0.22);
          const blur = effectsOn && !isCurrent ? Math.min(abs * 0.6, 2.4) : 0;
          const isYrc = (line.characters?.length ?? 0) > 1;
          const showRoman =
            (mode === "both" || mode === "romanization") &&
            Boolean(line.romanized?.trim());
          const showTrans =
            (mode === "both" || mode === "translation") &&
            Boolean(line.translated?.trim());
          return { line, index, isCurrent, isYrc, scale, opacity, blur, showRoman, showTrans };
        });
      });

      const hasLyrics = computed(() => rows.value.length > 0);
      const rowPadding = computed(() => `${(settings.value.lineHeight * 3).toFixed(1)}px`);

      // ── 当前行溢出跑马灯 ──
      const marquee = ref({ active: false, distance: 0, duration: 0 });

      const syncMarquee = () => {
        const scroller = scrollerRef.value;
        const s = settings.value;
        const idx = currentIndex.value;
        const row =
          scroller && idx >= 0
            ? scroller.querySelector(`[data-oxls-index="${idx}"]`)
            : null;
        const line = row ? row.querySelector("[data-oxls-line]") : null;
        const primary = row ? row.querySelector("[data-oxls-primary]") : null;
        if (reducedMotion.value || !line || !primary) {
          if (marquee.value.active) marquee.value = { active: false, distance: 0, duration: 0 };
          return;
        }
        // offsetWidth 为布局宽度，不受行放大 transform 影响（与旧版 scrollWidth 语义一致）
        const overflow = primary.offsetWidth - line.clientWidth;
        if (overflow > 2) {
          const distance = overflow + 40;
          const duration = Math.max(3, distance / 100 + 1.5);
          const m = marquee.value;
          if (
            !m.active ||
            Math.abs(m.distance - distance) > 0.5 ||
            Math.abs(m.duration - duration) > 0.05
          ) {
            marquee.value = { active: true, distance, duration };
          }
        } else if (marquee.value.active) {
          marquee.value = { active: false, distance: 0, duration: 0 };
        }
      };

      // ── 弹簧滚动 ──
      const springScroll = new SpringValue(0);
      let scrollActive = false;
      let scrollFrame = 0;
      let rafId = 0;
      let lastFrameTime = 0;

      const animationTick = (time) => {
        rafId = 0;
        if (!lastFrameTime) lastFrameTime = time;
        const deltaSeconds = Math.min(0.05, Math.max(0.001, (time - lastFrameTime) / 1000));
        lastFrameTime = time;
        const scroller = scrollerRef.value;
        if (!scroller || !scrollActive) {
          lastFrameTime = 0;
          return;
        }
        springScroll.update(deltaSeconds);
        if (Math.abs(scroller.scrollTop - springScroll.value) > 0.1) {
          scroller.scrollTop = springScroll.value;
        }
        if (springScroll.settled()) {
          scroller.scrollTop = springScroll.target;
          scrollActive = false;
          lastFrameTime = 0;
        } else {
          rafId = window.requestAnimationFrame(animationTick);
        }
      };

      const startSpringLoop = () => {
        if (rafId) return;
        lastFrameTime = 0;
        rafId = window.requestAnimationFrame(animationTick);
      };

      const scrollToLineNow = (index, smooth) => {
        const scroller = scrollerRef.value;
        if (!scroller || index < 0) return;
        const target = scroller.querySelector(`[data-oxls-index="${index}"]`);
        if (!target) return;
        const containerRect = scroller.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const offset =
          targetRect.top -
          containerRect.top +
          scroller.scrollTop -
          scroller.clientHeight * SCROLL_ANCHOR_RATIO +
          targetRect.height / 2;
        const targetTop = Math.max(0, offset);
        if (reducedMotion.value || !smooth || Math.abs(targetTop - scroller.scrollTop) < 1) {
          scrollActive = false;
          scroller.scrollTop = targetTop;
          return;
        }
        springScroll.setParams(getSpringParams(settings.value.scrollDuration));
        springScroll.setValue(scroller.scrollTop);
        springScroll.setTarget(targetTop);
        scrollActive = true;
        startSpringLoop();
      };

      const scrollToLine = (index, smooth) => {
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = 0;
          scrollToLineNow(index, smooth);
        });
      };

      // ── 滚轮浏览（暂停跟随，一段时间后恢复） ──
      let userScrollResumeTimer = 0;
      let wheelRafId = 0;

      const findLineAtScrollPosition = () => {
        const scroller = scrollerRef.value;
        if (!scroller) return -1;
        const containerRect = scroller.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * SCROLL_ANCHOR_RATIO;
        const rowEls = Array.from(scroller.querySelectorAll("[data-oxls-index]"));
        let closestIndex = -1;
        let closestDistance = Infinity;
        for (const row of rowEls) {
          const rect = row.getBoundingClientRect();
          const lineCenter = rect.top + rect.height / 2;
          const distance = Math.abs(lineCenter - centerY);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = Number(row.getAttribute("data-oxls-index")) || -1;
          }
        }
        return closestIndex;
      };

      const clearUserScrollResume = () => {
        if (userScrollResumeTimer) {
          window.clearTimeout(userScrollResumeTimer);
          userScrollResumeTimer = 0;
        }
      };

      const resumeFollowing = (smooth = false) => {
        isUserScrolling.value = false;
        scrollHighlightIndex.value = -1;
        clearUserScrollResume();
        if (wheelRafId) {
          window.cancelAnimationFrame(wheelRafId);
          wheelRafId = 0;
        }
        void nextTick(() => scrollToLine(currentIndex.value, smooth));
      };

      const handleWheel = () => {
        if (!hasLyrics.value) return;
        isUserScrolling.value = true;
        // 滚轮接管：停掉进行中的弹簧滚动
        scrollActive = false;
        if (scrollFrame) {
          window.cancelAnimationFrame(scrollFrame);
          scrollFrame = 0;
        }
        springScroll.setValue(scrollerRef.value?.scrollTop ?? 0);
        clearUserScrollResume();
        if (wheelRafId === 0) {
          wheelRafId = window.requestAnimationFrame(() => {
            wheelRafId = 0;
            if (!isUserScrolling.value) return;
            const index = findLineAtScrollPosition();
            if (index >= 0) scrollHighlightIndex.value = index;
          });
        }
        userScrollResumeTimer = window.setTimeout(
          () => resumeFollowing(true),
          USER_SCROLL_RESUME_MS,
        );
      };

      // ── 操作 ──
      const runGuarded = (label, fn) => {
        try {
          const result = fn();
          if (result && typeof result.catch === "function") {
            result.catch((error) => console.warn(`[OldXiamiLyricStyles] ${label}`, error));
          }
        } catch (error) {
          console.warn(`[OldXiamiLyricStyles] ${label}`, error);
        }
      };

      const handleLineClick = (line) => {
        const time = Number(line?.time) || 0;
        runGuarded("跳转播放位置失败", () => {
          props.page.playback.seek(time);
          if (!props.page.state.value.isPlaying) props.page.playback.toggle();
        });
      };

      const openQueue = () =>
        runGuarded("打开播放队列失败", () => props.page.panels.open("queue"));
      const openComment = () =>
        runGuarded("打开评论面板失败", () => props.page.panels.open("comments"));
      const openAddToPlaylist = () =>
        runGuarded("打开添加到歌单失败", () => props.page.panels.open("add-to-playlist"));

      const barrageResource = computed(() => ({
        type: "song-barrage",
        hash: track.value?.hash || "",
        name: track.value?.name || "",
      }));
      const barrageEnabled = computed({
        get: () => Boolean(props.page.barrage.enabled),
        set: (value) => {
          runGuarded("切换弹幕失败", () => {
            props.page.barrage.enabled = Boolean(value);
          });
        },
      });
      const handleBarrageSent = (content) =>
        runGuarded("发送弹幕失败", () => props.page.barrage.send(content));

      // ── 逐字（YRC）进度动画 ──
      // 字符元素由模板 ref 回调注册，RAF 按歌词时间轴直接更新进度，
      // 绕过 Vue 响应式以保证性能（与宿主 useYrcAnimation 同一机制）。
      const mainCharEls = new Map();
      const subCharEls = new Map();
      let lastYrcLineIndex = -1;

      const registerMainChar = (lineIndex, charIndex, el) => {
        if (el) {
          if (lineIndex !== currentIndex.value) el.style.backgroundPositionX = "100%";
          let arr = mainCharEls.get(lineIndex);
          if (!arr) {
            arr = [];
            mainCharEls.set(lineIndex, arr);
          }
          arr[charIndex] = el;
        } else {
          const arr = mainCharEls.get(lineIndex);
          if (arr) {
            arr[charIndex] = null;
            if (arr.every((item) => !item)) mainCharEls.delete(lineIndex);
          }
        }
      };

      const registerSubChar = (lineIndex, kind, charIndex, el) => {
        const key = `${lineIndex}:${kind}`;
        if (el) {
          if (lineIndex !== currentIndex.value) el.style.backgroundPositionX = "100%";
          let arr = subCharEls.get(key);
          if (!arr) {
            arr = [];
            subCharEls.set(key, arr);
          }
          arr[charIndex] = el;
        } else {
          const arr = subCharEls.get(key);
          if (arr) {
            arr[charIndex] = null;
            if (arr.every((item) => !item)) subCharEls.delete(key);
          }
        }
      };

      const resetCharsProgress = (elements) => {
        if (!elements) return;
        for (const el of elements) {
          if (el) el.style.backgroundPositionX = "100%";
        }
      };

      // 逐字进度：0=未播放（background-position-x 100%），1=已播放（0%）
      const charBackgroundPosition = (charStartMs, charEndMs, timelineMs) => {
        let progress;
        if (timelineMs >= charEndMs) progress = 1;
        else if (timelineMs <= charStartMs) progress = 0;
        else {
          const duration = charEndMs - charStartMs;
          progress =
            duration <= 0
              ? 1
              : Math.min(1, Math.max(0, (timelineMs - charStartMs) / duration));
        }
        return `${100 - progress * 100}%`;
      };

      const applyCharsProgress = (elements, chars, seekMs) => {
        const count = Math.min(elements.length, chars.length);
        for (let i = 0; i < count; i++) {
          const el = elements[i];
          const char = chars[i];
          if (!el || !char) continue;
          el.style.backgroundPositionX = charBackgroundPosition(
            char.startTime || 0,
            char.endTime || 0,
            seekMs,
          );
        }
      };

      const resetYrcLineDom = (lineIndex) => {
        if (lineIndex < 0) return;
        resetCharsProgress(mainCharEls.get(lineIndex));
        resetCharsProgress(subCharEls.get(`${lineIndex}:romanized`));
        resetCharsProgress(subCharEls.get(`${lineIndex}:translated`));
      };

      const readTimelineMs = () => {
        try {
          const timelineMs = Number(props.page.lyrics.getTimelineMs());
          return Number.isFinite(timelineMs) ? timelineMs : null;
        } catch {
          return null;
        }
      };

      const updateYrcDom = () => {
        const idx = currentIndex.value;
        const line = lines.value[idx];
        if (!line?.characters?.length) {
          resetYrcLineDom(lastYrcLineIndex);
          lastYrcLineIndex = -1;
          return;
        }
        const seekMs = readTimelineMs();
        if (seekMs === null) return;
        if (idx !== lastYrcLineIndex) {
          resetYrcLineDom(lastYrcLineIndex);
          lastYrcLineIndex = idx;
        }
        // 主歌词逐字
        const mainEls = mainCharEls.get(idx);
        if (mainEls) applyCharsProgress(mainEls, line.characters, seekMs);
        // 副歌词逐字（音译/翻译，仅逐字行且字符数 > 1 时）
        const mode = secondaryMode.value;
        if (mode === "both" || mode === "romanization") {
          const els = subCharEls.get(`${idx}:romanized`);
          const chars = line.romanizedCharacters;
          if (els && chars && chars.length > 1) applyCharsProgress(els, chars, seekMs);
        }
        if (mode === "both" || mode === "translation") {
          const els = subCharEls.get(`${idx}:translated`);
          const chars = line.translatedCharacters;
          if (els && chars && chars.length > 1) applyCharsProgress(els, chars, seekMs);
        }
      };

      const resetCharRegistry = () => {
        mainCharEls.clear();
        subCharEls.clear();
        lastYrcLineIndex = -1;
      };

      // 逐字进度 RAF：仅「正在播放且窗口可见」时逐帧刷新（与宿主一致）
      let progressRafId = 0;
      let progressLastTime = 0;

      const progressLoop = () => {
        progressRafId = window.requestAnimationFrame((timestamp) => {
          progressRafId = 0;
          if (document.hidden) {
            progressLastTime = 0;
            return;
          }
          if (timestamp - progressLastTime >= 33) {
            progressLastTime = timestamp;
            updateYrcDom();
          }
          progressLoop();
        });
      };

      const startProgressLoop = () => {
        if (progressRafId) return;
        progressLastTime = performance.now();
        progressLoop();
      };

      const stopProgressLoop = () => {
        if (progressRafId) {
          window.cancelAnimationFrame(progressRafId);
          progressRafId = 0;
        }
        progressLastTime = 0;
      };

      const syncProgressRaf = () => {
        if (isPlaying.value && !document.hidden) startProgressLoop();
        else stopProgressLoop();
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopProgressLoop();
          return;
        }
        // 回到前台：立即补一次全量刷新，避免看到错位的逐字进度
        updateYrcDom();
        syncProgressRaf();
      };

      // ── 跟随与重定位 ──
      watch(currentIndex, (index, previous) => {
        if (index === previous) return;
        // 同步逐字进度（重置上一行、应用当前行），用户浏览时也保持正确
        updateYrcDom();
        // 用户正在浏览时不自动跟随
        if (isUserScrolling.value) return;
        void nextTick(() => {
          syncMarquee();
          scrollToLine(index, previous !== -1);
        });
      });

      // 歌词整体变化（切歌 / 换歌词源 / 副歌词模式）→ 瞬间重定位
      watch([lines, secondaryMode], () => {
        resetCharRegistry();
        isUserScrolling.value = false;
        scrollHighlightIndex.value = -1;
        clearUserScrollResume();
        void nextTick(() => {
          syncMarquee();
          scrollToLine(currentIndex.value, false);
        });
      });

      // 逐字进度：播放时钟 / 播放状态变化时立即同步一次并启停 RAF
      watch(
        () => state.value.playbackClock,
        () => {
          updateYrcDom();
          syncProgressRaf();
        },
      );
      watch(isPlaying, () => {
        updateYrcDom();
        syncProgressRaf();
      });

      // 布局相关设置或减少动效偏好变化 → 重定位
      watch(
        [
          () => settings.value.pageStyle,
          () => settings.value.fontScale,
          () => settings.value.fontWeight,
          () => settings.value.lineHeight,
          () => settings.value.textAlign,
          () => settings.value.lyricPadding,
          reducedMotion,
        ],
        () => {
          void nextTick(() => {
            syncMarquee();
            scrollToLine(currentIndex.value, false);
          });
        },
      );

      // ── 生命周期 ──
      let resizeObserver = null;

      // 页面样式切换会重建滚动容器：重新挂载 ResizeObserver
      watch(scrollerRef, (el, previous) => {
        if (previous) resizeObserver?.unobserve(previous);
        if (el && resizeObserver) resizeObserver.observe(el);
      });

      onMounted(() => {
        reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
        updateReducedMotion();
        reducedMotionQuery?.addEventListener?.("change", updateReducedMotion);
        resizeObserver = new ResizeObserver(() => syncMarquee());
        if (scrollerRef.value) resizeObserver.observe(scrollerRef.value);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        updateYrcDom();
        syncProgressRaf();
        // 初始定位到当前行（不动画）
        void nextTick(() => {
          syncMarquee();
          scrollToLine(currentIndex.value, false);
        });
      });

      onUnmounted(() => {
        reducedMotionQuery?.removeEventListener?.("change", updateReducedMotion);
        reducedMotionQuery = null;
        resizeObserver?.disconnect();
        resizeObserver = null;
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        stopProgressLoop();
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
        if (rafId) window.cancelAnimationFrame(rafId);
        if (wheelRafId) window.cancelAnimationFrame(wheelRafId);
        clearUserScrollResume();
        scrollFrame = 0;
        rafId = 0;
        wheelRafId = 0;
        lastFrameTime = 0;
        scrollActive = false;
      });

      // ── 渲染 ──
      const rootStyle = computed(() => {
        const s = settings.value;
        return {
          "--oxls-glow-size": `${(s.currentGlow * 0.24).toFixed(1)}px`,
          "--oxls-scroll-duration": `${s.scrollDuration}ms`,
          "--oxls-scroller-padding-x":
            s.textAlign === "left" ? `${s.lyricPadding}px` : "0px",
        };
      });

      const MASK_IMAGE =
        "linear-gradient(90deg, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)";

      const renderRow = (entry) => {
        const s = settings.value;
        const marqueeActive = entry.isCurrent && marquee.value.active;

        const rowStyle = {
          "padding-top": rowPadding.value,
          "padding-bottom": rowPadding.value,
          opacity: String(entry.opacity),
        };

        const lineStyle = {
          "text-align": s.textAlign,
          "transform-origin":
            s.textAlign === "left" ? "left center" : "center center",
          transform: `scale(${entry.scale.toFixed(3)})`,
          filter: entry.blur > 0 ? `blur(${entry.blur.toFixed(1)}px)` : "none",
        };
        if (marqueeActive) {
          lineStyle.overflow = "hidden";
          lineStyle["mask-image"] = MASK_IMAGE;
          lineStyle["-webkit-mask-image"] = MASK_IMAGE;
        }

        const primaryStyle = {
          "font-size": primaryFontSize.value,
          "font-weight": String(Math.round(s.fontWeight)),
          color: entry.isCurrent ? playedColor.value : unplayedColor.value,
        };
        if (entry.isCurrent && s.currentGlow > 0) {
          primaryStyle["text-shadow"] =
            "0 0 var(--oxls-glow-size) var(--color-primary, #31cfa1)," +
            " 0 0 calc(var(--oxls-glow-size) * 2) var(--color-primary, #31cfa1)";
        }
        if (marqueeActive) {
          primaryStyle["--oxls-marquee-distance"] = `${marquee.value.distance.toFixed(1)}px`;
          primaryStyle["animation"] = `oxls-marquee ${marquee.value.duration}s ease-out forwards`;
          primaryStyle["animation-delay"] = "0.3s";
        }

        const secondaryStyle = () => ({
          "font-size": secondaryFontSize.value,
          "font-weight": String(Math.max(400, Math.round(s.fontWeight) - 260)),
          color: entry.isCurrent ? playedColor.value : unplayedColor.value,
          opacity: entry.isCurrent ? "0.85" : String(entry.opacity),
        });

        return h(
          "div",
          {
            key: `${entry.index}-${entry.line.time}`,
            class: "oxls-row",
            "data-oxls-index": String(entry.index),
            "data-current": entry.isCurrent ? "true" : "false",
            style: rowStyle,
            onDblclick: (event) => {
              event.preventDefault();
              event.stopPropagation();
              handleLineClick(entry.line);
            },
          },
          [
            h(
              "div",
              {
                class: "oxls-line",
                "data-oxls-line": "",
                "data-current": entry.isCurrent ? "true" : "false",
                style: lineStyle,
              },
              [
                h(
                  "span",
                  { class: "oxls-primary", "data-oxls-primary": "", style: primaryStyle },
                  entry.isYrc
                    ? entry.line.characters.map((char, charIndex) =>
                        h(
                          "span",
                          {
                            class: "oxls-char",
                            ref: (el) => registerMainChar(entry.index, charIndex, el),
                            style: { backgroundImage: yrcBgStyle.value },
                          },
                          char.text,
                        ),
                      )
                    : (entry.line.text || " "),
                ),
                entry.showRoman
                  ? h(
                      "span",
                      { class: "oxls-secondary", style: secondaryStyle() },
                      entry.isYrc &&
                        (entry.line.romanizedCharacters?.length ?? 0) > 1
                        ? entry.line.romanizedCharacters.map((char, charIndex) =>
                            h(
                              "span",
                              {
                                class: "oxls-char",
                                ref: (el) =>
                                  registerSubChar(entry.index, "romanized", charIndex, el),
                                style: { backgroundImage: yrcBgStyle.value },
                              },
                              char.text,
                            ),
                          )
                        : entry.line.romanized,
                    )
                  : null,
                entry.showTrans
                  ? h(
                      "span",
                      { class: "oxls-secondary", style: secondaryStyle() },
                      entry.isYrc &&
                        (entry.line.translatedCharacters?.length ?? 0) > 1
                        ? entry.line.translatedCharacters.map((char, charIndex) =>
                            h(
                              "span",
                              {
                                class: "oxls-char",
                                ref: (el) =>
                                  registerSubChar(entry.index, "translated", charIndex, el),
                                style: { backgroundImage: yrcBgStyle.value },
                              },
                              char.text,
                            ),
                          )
                        : entry.line.translated,
                    )
                  : null,
              ],
            ),
          ],
        );
      };

      const renderCoverSide = () =>
        h("div", { class: "oxls-cover-side" }, [
          h("div", { class: "oxls-cover-wrap" }, [
            coverDisplayUrl.value
              ? h("img", {
                  class: "oxls-cover-img",
                  src: coverDisplayUrl.value,
                  alt: track.value?.albumName || track.value?.name || "专辑封面",
                  draggable: "false",
                })
              : h("div", { class: "oxls-cover-placeholder" }, "♫"),
          ]),
          h("div", { class: "oxls-song-info" }, [
            h("h1", { class: "oxls-song-title" }, track.value?.name || "未在播放"),
            h("p", { class: "oxls-song-artist" }, track.value?.artist || ""),
          ]),
        ]);

      return () => {
        const s = settings.value;
        const renderScrollArea = () =>
          h("div", { class: "oxls-scroll-wrap" }, [
            h(
              "div",
              {
                ref: scrollerRef,
                class: "oxls-scroller",
                style: lyricFontFamily.value
                  ? { "font-family": lyricFontFamily.value }
                  : undefined,
                onWheelPassive: handleWheel,
              },
              hasLyrics.value
                ? [
                    h(
                      "div",
                      {
                        class: "oxls-list",
                        style: { "padding-top": "40vh", "padding-bottom": "40vh" },
                      },
                      rows.value.map((entry) => renderRow(entry)),
                    ),
                  ]
                : [
                    h(
                      "div",
                      { class: "oxls-empty" },
                      isLoading.value ? "歌词加载中…" : "暂无歌词",
                    ),
                  ],
            ),
            scrollHighlightIndex.value >= 0 && hasLyrics.value
              ? h(
                  "button",
                  {
                    class: "oxls-time-tag",
                    onClick: (event) => {
                      event.stopPropagation();
                      handleLineClick(lines.value[scrollHighlightIndex.value]);
                    },
                  },
                  [
                    h(
                      "svg",
                      {
                        viewBox: "0 0 24 24",
                        fill: "currentColor",
                        class: "oxls-time-tag-icon",
                      },
                      h("path", { d: "M8 5v14l11-7z" }),
                    ),
                    formatTime(lines.value[scrollHighlightIndex.value]?.time ?? 0),
                  ],
                )
              : null,
          ]);
        return h(
          "div",
          {
            class: "oxls-root",
            "data-marker": s.markerStyle,
            "data-align": s.textAlign,
            style: rootStyle.value,
          },
          [
            coverUrl.value
              ? h("div", {
                  class: "oxls-blur-bg",
                  style: { backgroundImage: `url(${coverUrl.value})` },
                })
              : null,
            h("div", { class: "oxls-body" }, [
              s.pageStyle === "normal"
                ? h("div", { class: "oxls-layout is-normal" }, [
                    renderCoverSide(),
                    h("div", { class: "oxls-lyric-side" }, [renderScrollArea()]),
                  ])
                : h("div", { class: "oxls-layout is-simple" }, [renderScrollArea()]),
            ]),
            h(
              LyricPlayerControls,
              {
                class: "oxls-controls",
                onOpenQueue: openQueue,
                onOpenComment: openComment,
                onOpenAddToPlaylist: openAddToPlaylist,
                onOpenSkins: () => ctx.ui.lyricsPage.openSkins(),
              },
              {
                "song-actions": () =>
                  h(BarrageControls, {
                    modelValue: barrageEnabled.value,
                    "onUpdate:modelValue": (value) => (barrageEnabled.value = value),
                    resource: barrageResource.value,
                    variant: "lyric",
                    onSent: handleBarrageSent,
                  }),
              },
            ),
          ],
        );
      };
    },
  });
};

// ── 设置面板 ──

const SETTINGS_FORMATTERS = {
  fontScale: (v) => `${Math.round(v)}%`,
  fontWeight: (v) => `${Math.round(v)}`,
  currentScale: (v) => `${Math.round(v * 100)}%`,
  currentGlow: (v) => `${Math.round(v)}`,
  idleOpacity: (v) => `${Math.round(v * 100)}%`,
  scrollDuration: (v) => `${Math.round(v)}ms`,
  lineHeight: (v) => v.toFixed(1),
  lyricPadding: (v) => `${Math.round(v)}px`,
};

// 滑杆为整数刻度：显示时乘 scale，写回时除 scale
const SLIDER_SCALES = {
  fontScale: 1,
  fontWeight: 1,
  currentScale: 100,
  currentGlow: 1,
  idleOpacity: 100,
  scrollDuration: 1,
  lineHeight: 10,
  lyricPadding: 1,
};

const SLIDER_RANGES = {
  fontScale: [50, 200],
  fontWeight: [300, 900],
  currentScale: [100, 150],
  currentGlow: [0, 80],
  idleOpacity: [20, 80],
  scrollDuration: [100, 1200],
  lineHeight: [15, 50],
  lyricPadding: [0, 288],
};

// 滑杆步进，未列出的默认 1
const SLIDER_STEPS = {
  fontScale: 5,
  fontWeight: 10,
};

const MARKER_OPTIONS = [
  { label: "圆点", value: "dot" },
  { label: "竖线", value: "bar" },
  { label: "无", value: "none" },
];

const PAGE_STYLE_OPTIONS = [
  { label: "普通模式", value: "normal" },
  { label: "简洁模式", value: "simple" },
];

const ALIGN_OPTIONS = [
  { label: "左对齐", value: "left" },
  { label: "居中对齐", value: "center" },
];

function buildSettingsUI(h, Button, Slider, Select, getCurrent, onPatch) {
  const slider = (label, key) => {
    const [min, max] = SLIDER_RANGES[key];
    const scale = SLIDER_SCALES[key];
    const current = getCurrent()[key];
    return h("div", { class: "oxls-settings-row" }, [
      h("div", { class: "oxls-settings-line" }, [
        h("span", { class: "oxls-settings-title" }, label),
        h("span", { class: "oxls-settings-hint" }, SETTINGS_FORMATTERS[key](current)),
      ]),
      h(Slider, {
        modelValue: Math.round(current * scale),
        min,
        max,
        step: SLIDER_STEPS[key] ?? 1,
        "aria-label": label,
        "onUpdate:modelValue": (value) => onPatch({ [key]: Number(value) / scale }),
      }),
    ]);
  };

  const select = (label, key, options) =>
    h("div", { class: "oxls-settings-row" }, [
      h("div", { class: "oxls-settings-line" }, [
        h("span", { class: "oxls-settings-title" }, label),
        h(Select, {
          modelValue: getCurrent()[key],
          options,
          "aria-label": label,
          style: { width: "150px" },
          "onUpdate:modelValue": (value) => onPatch({ [key]: String(value) }),
        }),
      ]),
    ]);

  const current = getCurrent();
  return h("div", { class: "oxls-settings" }, [
    select("页面样式", "pageStyle", PAGE_STYLE_OPTIONS),
    select("标记样式", "markerStyle", MARKER_OPTIONS),
    select("对齐方式", "textAlign", ALIGN_OPTIONS),
    slider("字号", "fontScale"),
    slider("字重", "fontWeight"),
    slider("当前行放大", "currentScale"),
    slider("辉光强度", "currentGlow"),
    slider("其他行透明度", "idleOpacity"),
    slider("滚动过渡", "scrollDuration"),
    slider("行间距", "lineHeight"),
    current.textAlign === "left" ? slider("歌词边距", "lyricPadding") : null,
    h("div", { class: "oxls-settings-actions" }, [
      h(
        Button,
        { variant: "outline", size: "xs", onClick: () => onPatch({ ...DEFAULT_SETTINGS }) },
        { default: () => "恢复默认" },
      ),
    ]),
  ]);
}

// ── 宿主皮肤配置读写（参考 apple-music-style） ──

function patchStoredSkinConfig(store, skinKey, patchData) {
  const current = {
    ...DEFAULT_SETTINGS,
    ...(store.lyricsPageSkinConfigs[skinKey] ?? {}),
  };
  const next = { ...current, ...patchData };
  if (!validateSettings(next)) return false;
  if (isAllDefaults(next)) {
    store.resetLyricSkinConfig(skinKey);
    return true;
  }
  const overrides = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (!Object.is(next[key], DEFAULT_SETTINGS[key])) overrides[key] = next[key];
  }
  store.patchLyricSkinConfig(skinKey, overrides);
  return true;
}

function createGlobalSettingsComponent(ctx, skinKey) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue;
  const Button = defineAsyncComponent(ctx.ui.components.Button);
  const Slider = defineAsyncComponent(ctx.ui.components.Slider);
  const Select = defineAsyncComponent(ctx.ui.components.Select);

  return defineComponent({
    name: "OldXiamiLyricStylesGlobalSettings",
    setup() {
      const store = ctx.stores.settings;
      const getCurrent = () =>
        normalizeSettings({
          ...DEFAULT_SETTINGS,
          ...(store.lyricsPageSkinConfigs[skinKey] ?? {}),
        });
      const onPatch = (data) => patchStoredSkinConfig(store, skinKey, data);
      return () => buildSettingsUI(h, Button, Slider, Select, getCurrent, onPatch);
    },
  });
}

function createSkinDrawerSettingsComponent(ctx) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue;
  const Button = defineAsyncComponent(ctx.ui.components.Button);
  const Slider = defineAsyncComponent(ctx.ui.components.Slider);
  const Select = defineAsyncComponent(ctx.ui.components.Select);

  return defineComponent({
    name: "OldXiamiLyricStylesSkinSettings",
    setup() {
      const skin = ctx.ui.lyricsPage.useSkin();
      const getCurrent = () => normalizeSettings(skin.settings.value || {});
      const onPatch = (data) => {
        const next = { ...getCurrent(), ...data };
        if (isAllDefaults(next)) skin.reset();
        else skin.patch(data);
      };
      return () => buildSettingsUI(h, Button, Slider, Select, getCurrent, onPatch);
    },
  });
}

// ── 首次打开歌词页时自动选中皮肤 ──

function createAutoSelectSkinTask(ctx, skinKey) {
  let disposed = false;
  let running = false;
  let timer = 0;

  const selectOnce = async () => {
    if (disposed || running) return;
    running = true;
    try {
      const selected = await ctx.storage.get(AUTO_SELECT_KEY);
      if (disposed || selected) return;
      const provider = String(ctx.stores.settings.lyricsPageProvider || "").trim();
      // 覆盖旧版叠加方式的目标皮肤：简洁歌词 / 封面等宿主默认皮肤
      if (
        !provider ||
        provider === "host" ||
        provider === "host:cover" ||
        provider === "host:lyric"
      ) {
        ctx.stores.settings.lyricsPageProvider = skinKey;
      }
      await ctx.storage.set(AUTO_SELECT_KEY, true);
    } catch (error) {
      console.warn("[OldXiamiLyricStyles] 自动选中皮肤失败", error);
    } finally {
      running = false;
    }
  };

  const schedule = () => {
    if (disposed) return;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      void selectOnce();
    }, 0);
  };

  const dispose = () => {
    disposed = true;
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };

  return { schedule, dispose };
}

// ── 插件入口 ──

export async function activate(ctx) {
  const skinKey = JSON.stringify([ctx.id, SKIN_ID]);
  const skinComponent = createSkinComponent(ctx);

  const settingsDispose = ctx.ui.settings.define({
    title: "旧版虾米歌词风格",
    description: "调整当前行高亮、辉光、滚动等歌词页皮肤效果。",
    component: createGlobalSettingsComponent(ctx, skinKey),
  });

  const skinDispose = ctx.ui.lyricsPage.register({
    id: SKIN_ID,
    title: "旧版虾米歌词风格",
    preview: createXiamiPreviewSvg(),
    component: skinComponent,
    titlebar: "host",
    tools: "host",
    settings: {
      defaults: { ...DEFAULT_SETTINGS },
      component: createSkinDrawerSettingsComponent(ctx),
      validate: validateSettings,
    },
  });

  const autoSelectSkinTask = createAutoSelectSkinTask(ctx, skinKey);
  const stopLyricWatch = ctx.vue.watch(
    () => ctx.stores.player.isLyricViewOpen,
    (open) => {
      if (open) autoSelectSkinTask.schedule();
    },
    { immediate: true },
  );

  ctx.dispose(() => {
    autoSelectSkinTask.dispose();
    stopLyricWatch();
    skinDispose();
    settingsDispose();
  });
}

export function deactivate() {}
