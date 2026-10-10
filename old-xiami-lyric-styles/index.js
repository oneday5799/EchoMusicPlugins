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

// 当前播放行的双色方案：已播放部分用主题色（字色 + 辉光），未播放部分保持纯白。
// 两者都走 --oxls-played-color / --oxls-unplayed-color，由「歌词颜色」设置在根节点下发，
// 因此样式表与内联渐变共用同一份配置
const THEME_COLOR = "var(--oxls-played-color, var(--color-primary, #00cc65))";
const UNPLAYED_COLOR = "var(--oxls-unplayed-color, #ffffff)";
const PLAYED_GLOW_SHADOW =
  "0 0 var(--oxls-glow-size) var(--oxls-played-color, var(--color-primary, #00cc65))," +
  " 0 0 calc(var(--oxls-glow-size) * 2) var(--oxls-played-color, var(--color-primary, #00cc65))";

// 行两端渐隐遮罩的宽度，需与 style.css 中 .oxls-line 的 mask 保持一致
const MARQUEE_FADE_PADDING = 16;
// 歌词过滤默认正则（与宿主 lyric store 的 DEFAULT_LYRIC_FILTER_PATTERN 保持一致）
const DEFAULT_LYRIC_FILTER_PATTERN =
  "^(作词|作曲|编曲|制作人|录音|混音|母带|出品|发行|企划|监制|和声|吉他|贝斯|鼓|键盘|弦乐|词|曲|编|唱片|OP|SP|原唱|翻唱|许可|音乐人|纯音乐|宣推|协作推广|策划|统筹|营销|推广|制作|配唱|和音|弦乐编写|人声录音|人声编辑)[：:]|^(Lyrics|Composed|Produced|Written|Arranged|Mixed|Mastered|Recorded|Performed) by[：:]|^[『「【].*[』」】]$|未经著作权人许可|不得翻唱|翻录或使用|听歌就在";

// ── 配置 ──

const DEFAULT_SETTINGS = {
  pageStyle: "normal",
  fontScale: 150,
  fontWeight: 760,
  currentScale: 1.15,
  currentGlow: 9,
  idleOpacity: 0.45,
  scrollDuration: 420,
  lineHeight: 2.1,
  markerStyle: "bar",
  textAlign: "left",
  lyricPadding: 144,
  // 歌词颜色：空字符串表示跟随默认（已播=宿主主题色，未播=纯白）
  playedColor: "",
  unplayedColor: "",
};

// 歌词颜色可选取值：空串=跟随默认，__cover__=跟随封面取色，其余为 #rgb / #rrggbb
const COVER_COLOR_VALUE = "__cover__";
const isValidColor = (value) =>
  value === COVER_COLOR_VALUE ||
  value === "" ||
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

// ── 跟随封面取色 ──
// 宿主 lyric store 用 __cover__ 表示跟随封面，并按深色背景归一化；歌词页固定深色底，
// 这里复刻同一套换算，保证插件取到的颜色与内置歌词页一致
const FALLBACK_ACCENT = "#0071e3";

const parseHexColor = (hex) => {
  const raw = String(hex ?? "").trim().replace(/^#/, "");
  const expand = (v) => parseInt(v + v, 16);
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return { r: expand(raw[0]), g: expand(raw[1]), b: expand(raw[2]) };
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  return null;
};

const rgbToHsl = (r, g, b) => {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (delta !== 0) {
    if (max === nr) h = ((ng - nb) / delta) % 6;
    else if (max === ng) h = (nb - nr) / delta + 2;
    else h = (nr - ng) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: Math.min(1, Math.max(0, s)), l: Math.min(1, Math.max(0, l)) };
};

const hslToRgb = (h, s, l) => {
  const sat = Math.min(1, Math.max(0, s));
  const lit = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const hue = ((h % 360) + 360) % 360;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lit - c / 2;
  const seg = Math.floor(hue / 60) % 6;
  const table = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = table[seg];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
};

const normalizeLyricAccent = (hex) => {
  const rgb = parseHexColor(hex);
  if (!rgb) return FALLBACK_ACCENT;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  // 近乎灰度的颜色回落到默认主题色
  if (s < 0.08) return FALLBACK_ACCENT;
  const nextS = Math.min(0.85, Math.max(0.45, s));
  const nextL = Math.min(0.72, Math.max(0.55, l));
  const out = hslToRgb(h, nextS, nextL);
  return `#${[out.r, out.g, out.b]
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
    .join("")}`;
};

// 读取宿主当前封面色（pinia state，读取即建立响应依赖）
const createCoverAccent = (ctx) => () =>
  normalizeLyricAccent(ctx.stores.theme?.coverColor || FALLBACK_ACCENT);

const BOOLEAN_SETTINGS = [];

// 字符串型设置中需要按颜色格式校验的键
const COLOR_SETTINGS = ["playedColor", "unplayedColor"];

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
  for (const key of COLOR_SETTINGS) {
    const value = values[key];
    if (value === undefined) continue;
    if (typeof value !== "string" || !isValidColor(value)) return false;
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
    playedColor: isValidColor(source.playedColor) ? source.playedColor : "",
    unplayedColor: isValidColor(source.unplayedColor) ? source.unplayedColor : "",
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

// ── 逐字（YRC）进度引擎 ──
// 字符元素由模板 ref 回调注册，RAF 按歌词时间轴直接写入进度，绕过 Vue
// 响应式以保证性能（与宿主 useYrcAnimation 同一机制）。历次「已播色与辉光不同步」
// 的问题都集中在这块，单独成模块便于维护。
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
      const coverAccent = createCoverAccent(ctx);

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
      // 当前播放行的逐字渐变：已播用主题色、未播用纯白（非当前行仍沿用宿主配色）
      const currentYrcBgStyle = computed(
        () => `linear-gradient(to right, ${THEME_COLOR} 50%, ${UNPLAYED_COLOR} 50%)`,
      );
      // 辉光层单独用极淡的未播色：已播侧是满强度主题色，未播侧若还留有可观的白，
      // 两层模糊叠加后白色会主导视觉，表现为「有白色辉光、没有主题色辉光」。
      // 宽层扩散最远因此更淡，近层贴近字形可稍亮；调这两处即可微调干扰强度
      const currentYrcGlowBg = (alpha) =>
        `linear-gradient(to right, ${THEME_COLOR} 50%, rgba(255, 255, 255, ${alpha}) 50%)`;
      const UNPLAYED_GLOW_ALPHA_WIDE = 0.06;
      const UNPLAYED_GLOW_ALPHA_NEAR = 0.14;
      // 辉光进度的前倾曲线指数（<1）与起唱下限：字刚起唱时字色仍接近白色，若辉光同速跟进
      // 就会看起来"没有已播辉光"，等这个字唱完才突然出现。
      // 下限让字一起唱就有七成主题色辉光，等同卡拉OK的"点亮"手感
      const GLOW_PROGRESS_GAMMA = 0.15;
      const MIN_PLAYING_GLOW = 0.7;

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

      // ── 注音模式：音译标注显示在每个字上方（复用宿主歌词 store 偏好） ──
      const rubyMode = computed(() => {
        try {
          return Boolean(ctx.lyric?.showRomanization) && Boolean(ctx.lyric?.showRomanizationAsRuby);
        } catch {
          return false;
        }
      });
      const rubyFontSize = computed(
        () => `${(0.62 * 1.5 * fontScaleMultiplier.value).toFixed(3)}rem`,
      );

      // ── 歌词过滤（复用宿主通用歌词设置） ──
      const filterRegex = computed(() => {
        try {
          const settingsStore = ctx.stores.settings;
          if (!settingsStore?.lyricFilterEnabled) return null;
          const pattern = String(settingsStore.lyricFilterPattern ?? "").trim();
          return new RegExp(pattern || DEFAULT_LYRIC_FILTER_PATTERN);
        } catch {
          return null;
        }
      });
      const isLineFiltered = (line) => {
        const regex = filterRegex.value;
        if (!regex) return false;
        const text = line?.text ?? "";
        return text ? regex.test(text) : false;
      };
      // 当前行命中过滤时回退到最近一条可见行（与宿主 resolveVisibleLyricIndex 一致）
      const visibleIndex = computed(() => {
        const idx = currentIndex.value;
        const list = lines.value;
        if (idx < 0) return idx;
        if (idx < list.length && !isLineFiltered(list[idx])) return idx;
        for (let i = Math.min(idx, list.length - 1); i >= 0; i--) {
          if (!isLineFiltered(list[i])) return i;
        }
        return -1;
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
      // 被过滤的歌词行整体不渲染（宿主是 hidden 占位，这里直接不产生 DOM）
      const rows = computed(() => {
        const s = settings.value;
        const idx = visibleIndex.value;
        const mode = secondaryMode.value;
        const browse = scrollHighlightIndex.value;
        const ruby = rubyMode.value;
        const list = lines.value;
        const result = [];
        for (let index = 0; index < list.length; index++) {
          const line = list[index];
          if (isLineFiltered(line)) continue;
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
          const isRuby = ruby && (line.rubyUnits?.length ?? 0) > 0;
          const showRoman =
            !isRuby &&
            (mode === "both" || mode === "romanization") &&
            Boolean(line.romanized?.trim());
          const showTrans =
            (mode === "both" || mode === "translation") &&
            Boolean(line.translated?.trim());
          result.push({
            line,
            index,
            distance,
            isCurrent,
            isYrc,
            isRuby,
            scale,
            opacity,
            blur,
            showRoman,
            showTrans,
          });
        }
        return result;
      });

      const hasLyrics = computed(() => rows.value.length > 0);
      const rowPadding = computed(() => `${(settings.value.lineHeight * 3).toFixed(1)}px`);

      // ── 当前行溢出跑马灯 ──
      const marquee = ref({ active: false, distance: 0, duration: 0 });

      const syncMarquee = () => {
        const scroller = scrollerRef.value;
        const s = settings.value;
        const idx = visibleIndex.value;
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
        // 内容层已按放大的倒数收缩宽度，缩放后的渲染宽度正好等于行内容宽，
        // 因此文本盒盒宽就是真实可用宽度，溢出量即 scrollWidth 与盒宽之差
        const overflow = primary.scrollWidth - primary.clientWidth;
        if (overflow > 2) {
          // 滚动距离还要补上行两端渐隐遮罩占掉的留白：遮罩宽度在未缩放的行坐标系里，
          // 折算回内容坐标需除以放大倍数（取稳定的过渡目标值，行切换过渡中实测会偏小）
          const scale = reducedMotion.value ? 1 : s.currentScale || 1;
          const distance = overflow + MARQUEE_FADE_PADDING / scale + 24;
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
        void nextTick(() => scrollToLine(visibleIndex.value, smooth));
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

  // 逐字（YRC）进度引擎：字符注册、进度写入与 RAF 驱动都收在引擎内部
    // 绕过 Vue 响应式以保证性能（与宿主 useYrcAnimation 同一机制）。
    const mainCharEls = new Map();
    const subCharEls = new Map();
    let lastYrcLineIndex = -1;

    // 逐字进度写入渲染单元的所有层：当前行字符是「宽辉光 + 近辉光 + 清晰文字」
    // 三层（见 .oxls-char-cell）。文字层用线性进度，辉光层用前倾曲线，
    // 使字刚起唱时辉光就已明显偏主题色。
    // position 可为单个值（两层一致）或 [文字位置, 辉光位置]
    const applyCharLayers = (el, position, glowPosition) => {
      const isPair = Array.isArray(position);
      el.style.backgroundPositionX = isPair ? position[0] : position;
      const cell = el.parentElement;
      if (!cell || !cell.classList.contains("oxls-char-cell")) return;
      const glowPos = isPair ? position[1] : (glowPosition ?? position);
      for (const layer of cell.children) {
        if (layer !== el) layer.style.backgroundPositionX = glowPos;
      }
    };

    // 字符辉光由 ref 回调 + RAF 独占管理：Vue 每次 patch 都会重写 style 对象里的
    // 所有键，若把辉光放进 style 会覆盖 RAF 写入的结果
    const registerMainChar = (lineIndex, charIndex, el) => {
      if (el) {
        // 非当前行固定停在未播放态；当前行立即按时间轴落色，不等下一帧
        applyCharLayers(
          el,
          lineIndex === visibleIndex.value
            ? charProgressNow(lineIndex, charIndex)
            : "100%",
        );
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
        const line = lines.value[lineIndex];
        const rubyUnits = line?.rubyUnits;
        // 注音模式下音译按 rubyUnits 时间轴，与 updateYrcDom 保持一致
        const chars =
          kind === "romanized"
            ? rubyMode.value && rubyUnits?.length
              ? rubyUnits
              : line?.romanizedCharacters
            : line?.translatedCharacters;
        applyCharLayers(
          el,
          lineIndex === visibleIndex.value
            ? charProgressNow(lineIndex, charIndex, chars)
            : "100%",
        );
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
        if (el) applyCharLayers(el, "100%");
      }
    };

    // 逐字进度：0=未播放（background-position-x 100%），1=已播放（0%）
    // 辉光层（gamma < 1）用两条措施保证"刚起唱就能看到"：
    // 1) 曲线前倾，让辉光进度远快于字色；
    // 2) 起唱下限，字一旦开始唱就给一个可见的主题色辉光，
    //    否则行首第一个字在小半秒内 progress≈0，辉光与白色几乎无异。
    const charBackgroundPosition = (charStartMs, charEndMs, timelineMs, gamma = 1) => {
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
      if (gamma !== 1 && progress > 0 && progress < 1) {
        progress = Math.max(Math.pow(progress, gamma), MIN_PLAYING_GLOW);
      }
      return `${100 - progress * 100}%`;
    };

    const applyCharsProgress = (elements, chars, seekMs) => {
      const count = Math.min(elements.length, chars.length);
      for (let i = 0; i < count; i++) {
        const el = elements[i];
        const char = chars[i];
        if (!el || !char) continue;
        const start = char.startTime || 0;
        const end = char.endTime || 0;
        applyCharLayers(
          el,
          charBackgroundPosition(start, end, seekMs),
          charBackgroundPosition(start, end, seekMs, GLOW_PROGRESS_GAMMA),
        );
      }
    };

    // 字符注册那一刻就按当前时间轴落色：短歌词的当前行往往在下一帧的
    // updateYrcDom 之前就被看到，若只依赖那一帧，时轴暂不可用或注册
    // 时序错位时字符会停在 CSS 默认的未播放态（整行白色，缺少已播主题色）
    const charProgressNow = (lineIndex, charIndex, chars) => {
      const char = (chars ?? lines.value[lineIndex]?.characters)?.[charIndex];
      if (!char) return "100%";
      const timelineMs = readTimelineMs();
      if (timelineMs === null) return "100%";
      const start = char.startTime || 0;
      const end = char.endTime || 0;
      return [
        charBackgroundPosition(start, end, timelineMs),
        charBackgroundPosition(start, end, timelineMs, GLOW_PROGRESS_GAMMA),
      ];
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
      const idx = visibleIndex.value;
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
      // 副歌词逐字（音译/翻译；注音模式下音译按 rubyUnits 时间轴）
      const mode = secondaryMode.value;
      if (mode === "both" || mode === "romanization") {
        const els = subCharEls.get(`${idx}:romanized`);
        const rubyUnits = line.rubyUnits;
        const chars = rubyMode.value && rubyUnits?.length ? rubyUnits : line.romanizedCharacters;
        if (els && chars && chars.length > 0) applyCharsProgress(els, chars, seekMs);
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
        // 同步逐字进度（重置上一行、应用当前行）；nextTick 等 ref 注册完成后再应用
        void nextTick(() => updateYrcDom());
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
          // 暂停时 RAF 停转，需主动应用一次当前行逐字进度
          updateYrcDom();
          syncMarquee();
          scrollToLine(visibleIndex.value, false);
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

      // 显式跳转（进度条/歌词行 seek）→ 立即恢复跟随（与宿主 useLyricScroll 一致），
      // 避免浏览中 seek 后还要等 5 秒定时器
      watch(
        () => state.value.playbackClock?.seekTimestamp,
        () => {
          if (isUserScrolling.value) resumeFollowing(false);
        },
      );

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
            scrollToLine(visibleIndex.value, false);
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
          scrollToLine(visibleIndex.value, false);
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
        // 歌词颜色：留空跟随默认（已播=宿主主题色，未播=纯白），
        // __cover__ 跟随封面取色（与宿主 lyric store 同一套换算）
        const resolveColor = (value, fallback) => {
          if (value === COVER_COLOR_VALUE) return coverAccent();
          return value || fallback;
        };
        return {
          "--oxls-glow-size": `${(s.currentGlow * 0.24).toFixed(1)}px`,
          "--oxls-scroll-duration": `${s.scrollDuration}ms`,
          "--oxls-scroller-padding-x":
            s.textAlign === "left" ? `${s.lyricPadding}px` : "0px",
          "--oxls-played-color": resolveColor(
            s.playedColor,
            "var(--color-primary, #00cc65)",
          ),
          "--oxls-unplayed-color": resolveColor(s.unplayedColor, "#ffffff"),
        };
      });

      const renderRow = (entry) => {
        const s = settings.value;
        const marqueeActive = entry.isCurrent && marquee.value.active;

        const rowStyle = {
          "padding-top": rowPadding.value,
          "padding-bottom": rowPadding.value,
          opacity: String(entry.opacity),
        };

        // 裁剪容器：只负责统一宽度的裁剪与渐隐，不参与缩放
        const lineStyle = {
          "text-align": s.textAlign,
        };

        // 内容层：放大与模糊作用于此层，裁剪边界不随每行缩放而变化。
        // 布局宽度按放大的倒数收缩，使缩放后的渲染宽度正好等于行内容宽——
        // 否则放大 1.15 的当前行可用文字宽度会被压到 87%，误触发跑马灯
        const contentStyle = {
          width: `${(100 / Math.max(entry.scale, 0.01)).toFixed(3)}%`,
          "transform-origin":
            s.textAlign === "left" ? "left center" : "center center",
          transform: `scale(${entry.scale.toFixed(3)})`,
          filter: entry.blur > 0 ? `blur(${entry.blur.toFixed(1)}px)` : "none",
        };

        const primaryStyle = {
          "font-size": primaryFontSize.value,
          "font-weight": String(Math.round(s.fontWeight)),
          // 当前行整体视作已播放：用主题色；非当前行沿用宿主未播色
          color: entry.isCurrent ? THEME_COLOR : unplayedColor.value,
        };
        // 逐字行的辉光由字符的三层模糊层承担，这里不再加整行 text-shadow，
        // 否则会被字符层继承成整片主题色硬切辉光
        if (entry.isCurrent && !entry.isYrc && s.currentGlow > 0) {
          primaryStyle["text-shadow"] = PLAYED_GLOW_SHADOW;
        }
        if (marqueeActive) {
          primaryStyle["--oxls-marquee-distance"] = `${marquee.value.distance.toFixed(1)}px`;
          primaryStyle["animation"] = `oxls-marquee ${marquee.value.duration}s ease-out forwards`;
          primaryStyle["animation-delay"] = "0.3s";
        }

        const secondaryStyle = () => ({
          "font-size": secondaryFontSize.value,
          "font-weight": String(Math.max(400, Math.round(s.fontWeight) - 260)),
          color: entry.isCurrent ? THEME_COLOR : unplayedColor.value,
          opacity: entry.isCurrent ? "0.85" : String(entry.opacity),
        });

        // 逐字字符样式：当前行走「主题色 → 纯白」渐变；辉光层的未播色另用半透明白
        const charStyle = (layer) => {
          if (!entry.isCurrent) return { backgroundImage: yrcBgStyle.value };
          return {
            backgroundImage:
              layer === "ink"
                ? currentYrcBgStyle.value
                : currentYrcGlowBg(
                    layer === "wide" ? UNPLAYED_GLOW_ALPHA_WIDE : UNPLAYED_GLOW_ALPHA_NEAR,
                  ),
          };
        };

        // 逐字字符：当前行主歌词用三层（宽辉光 + 近辉光 + 清晰文字），
        // 三层共用同一进度，辉光因此与字色连续同步；其余情况单层即可
        const renderChar = (charText, withLayers, ref) => {
          const style = charStyle("ink");
          if (!withLayers || !entry.isCurrent) {
            return h("span", { class: "oxls-char", style, ref }, charText);
          }
          return h("span", { class: "oxls-char-cell" }, [
            h(
              "span",
              {
                class: "oxls-char oxls-char-glow oxls-char-glow-wide",
                style: charStyle("wide"),
                "aria-hidden": "true",
              },
              charText,
            ),
            h(
              "span",
              {
                class: "oxls-char oxls-char-glow oxls-char-glow-near",
                style: charStyle("near"),
                "aria-hidden": "true",
              },
              charText,
            ),
            h("span", { class: "oxls-char oxls-char-ink", style, ref }, charText),
          ]);
        };

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
                h("div", { class: "oxls-content", style: contentStyle }, [
                  h(
                    "span",
                    { class: "oxls-primary", "data-oxls-primary": "", style: primaryStyle },
                    // 注音模式：音译逐单元标注在对应字上方
                    entry.isRuby
                    ? entry.line.rubyUnits.map((unit, unitIndex) =>
                        h("span", { class: "oxls-ruby-unit" }, [
                          h(
                            "span",
                            {
                              class: "oxls-ruby-text",
                              style: {
                                "font-size": rubyFontSize.value,
                                "font-weight": "500",
                              },
                            },
                            unit.ruby
                              ? renderChar(
                                  unit.ruby,
                                  // 注音读音字号小，不叠加字符级辉光以保持清晰
                                  false,
                                  (el) =>
                                    registerSubChar(entry.index, "romanized", unitIndex, el),
                                )
                              : null,
                          ),
                          h(
                            "span",
                            { class: "oxls-ruby-base" },
                            (unit.chars ?? []).map((char, charIndex) =>
                              renderChar(char.text, true, (el) =>
                                registerMainChar(
                                  entry.index,
                                  (unit.charStart ?? 0) + charIndex,
                                  el,
                                ),
                              ),
                            ),
                          ),
                        ]),
                      )
                    : // 逐字歌词
                      entry.isYrc
                      ? entry.line.characters.map((char, charIndex) =>
                          renderChar(char.text, true, (el) =>
                            registerMainChar(entry.index, charIndex, el),
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
                            renderChar(char.text, false, (el) =>
                              registerSubChar(entry.index, "romanized", charIndex, el),
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
                            renderChar(char.text, false, (el) =>
                              registerSubChar(entry.index, "translated", charIndex, el),
                            ),
                          )
                        : entry.line.translated,
                    )
                  : null,
                ],
              ),
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

// 与宿主「歌词颜色」一致的预设色板
const LYRIC_COLOR_PRESETS = [
  "#31cfa1",
  "#0071e3",
  "#8b5cf6",
  "#ef476f",
  "#f59e0b",
  "#22c55e",
  "#60a5fa",
  "#f97316",
  "#e11d48",
  "#14b8a6",
  "#a855f7",
  "#ffffff",
];

  // 「歌词颜色」设置：两个色块分别设置已播与未播字色，留空表示跟随默认
// （已播=宿主主题色，未播=纯白）。复用宿主 ColorPickerDialog 保持交互一致。
function createLyricColorSettings(ctx, getCurrent, onPatch) {
  const { defineComponent, h, ref, computed, defineAsyncComponent } = ctx.vue;
  const ColorPickerDialog = defineAsyncComponent(ctx.ui.components.ColorPickerDialog);
  const coverAccent = createCoverAccent(ctx);
  const FALLBACK = { playedColor: "#31cfa1", unplayedColor: "#ffffff" };

  return defineComponent({
    name: "OldXiamiLyricColorSettings",
    setup() {
      const open = ref(false);
      const field = ref("playedColor");
      const draft = ref(FALLBACK.playedColor);
      const title = computed(() =>
        field.value === "unplayedColor" ? "选择未播字色" : "选择已播字色",
      );
      // 与宿主一致：颜色对话框提供「跟随封面取色」动态项
      const dynamicOption = computed(() => ({
        label: "跟随封面取色",
        value: COVER_COLOR_VALUE,
        color: coverAccent(),
      }));
      // 色块展示：封面取色显示当前封面色，其余未设置时显示默认色
      const displayOf = (key) => {
        const custom = getCurrent()[key];
        if (custom === COVER_COLOR_VALUE) return coverAccent();
        return custom || FALLBACK[key];
      };

      const swatch = (label, key) => {
        const custom = getCurrent()[key];
        const isDynamic = custom === COVER_COLOR_VALUE;
        const isFollow = !custom;
        return h("div", { class: "oxls-settings-color" }, [
          h("span", { class: "oxls-settings-color-label" }, label),
          h("button", {
            type: "button",
            class: ["oxls-settings-swatch", isFollow || isDynamic ? "is-follow" : ""],
            style: { backgroundColor: displayOf(key) },
            title: isDynamic
              ? `${label}：跟随封面取色`
              : custom
                ? `${label}：${custom}`
                : `${label}：跟随默认`,
            "aria-label": `设置${label}`,
            onClick: () => {
              field.value = key;
              draft.value = custom && custom !== COVER_COLOR_VALUE ? custom : coverAccent();
              open.value = true;
            },
          }),
        ]);
      };

      return () =>
        h("div", { class: "oxls-settings-row" }, [
          h("div", { class: "oxls-settings-line" }, [
            h("span", { class: "oxls-settings-title" }, "歌词颜色"),
            h("div", { class: "oxls-settings-colors" }, [
              swatch("已播", "playedColor"),
              swatch("未播", "unplayedColor"),
            ]),
          ]),
          h(ColorPickerDialog, {
            open: open.value,
            title: title.value,
            value: draft.value,
            presets: LYRIC_COLOR_PRESETS,
            dynamicOption: dynamicOption.value,
            "onUpdate:value": (value) => {
              draft.value = String(value);
            },
            "onUpdate:open": (value) => {
              open.value = Boolean(value);
            },
            onConfirm: (value) => {
              onPatch({ [field.value]: String(value).toLowerCase() });
              open.value = false;
            },
          }),
        ]);
    },
  });
}

function buildSettingsUI(h, Button, Slider, Select, colorSettings, getCurrent, onPatch) {
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
    h(colorSettings),
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
      const colorSettings = createLyricColorSettings(ctx, getCurrent, onPatch);
      return () => buildSettingsUI(h, Button, Slider, Select, colorSettings, getCurrent, onPatch);
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
      const colorSettings = createLyricColorSettings(ctx, getCurrent, onPatch);
      return () => buildSettingsUI(h, Button, Slider, Select, colorSettings, getCurrent, onPatch);
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

