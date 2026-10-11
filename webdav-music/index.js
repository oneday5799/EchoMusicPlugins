/* ===================================================================
 * EchoMusic WebDAV Music Plugin (refactored)
 * 连接 WebDAV 服务器，浏览和播放云端音乐文件
 * =================================================================== */

/* ---- Constants ---- */
const STORAGE_KEY = "settings";
const FOLDER_SVG = '<path d="M947.2 969.728h-870.4c-42.496 0-76.8-34.304-76.8-76.8V131.072c0-42.496 34.304-76.8 76.8-76.8h449.024c42.496 0 76.8 34.304 76.8 76.8v68.608c0 14.336 11.264 25.6 25.6 25.6H947.2c42.496 0 76.8 34.304 76.8 76.8v590.848c0 42.496-34.304 76.8-76.8 76.8z m-870.4-864.256c-14.336 0-25.6 11.264-25.6 25.6v762.368c0 14.336 11.264 25.6 25.6 25.6h870.4c14.336 0 25.6-11.264 25.6-25.6V302.08c0-14.336-11.264-25.6-25.6-25.6h-318.976c-42.496 0-76.8-34.304-76.8-76.8v-68.608c0-14.336-11.264-25.6-25.6-25.6H76.8z" fill="#ffffff"/><path d="M948.224 155.136h-263.68c-14.336 0-25.6-11.264-25.6-25.6s11.264-25.6 25.6-25.6h263.68c14.336 0 25.6 11.264 25.6 25.6s-11.776 25.6-25.6 25.6z" fill="#ffffff"/>';
const AUDIO_EXTENSIONS = [
  "mp3", "flac", "wav", "aac", "ogg", "wma",
  "m4a", "ape", "opus", "aiff", "alac", "dsf", "dff",
];
/** 读取音频头部（嵌入标签 / 比特率探测）的最大字节数 */
const HEAD_READ_LIMIT = 256 * 1024;
/** 浏览页吸顶偏移：与 DetailPageSliverHeader 的高度设置保持一致 */
const STICKY_COLLAPSED_H = 56;
const STICKY_TABS_H = 56;
const STICKY_BREADCRUMB_H = 28;
const STICKY_TOP_TABS = STICKY_COLLAPSED_H;
const STICKY_TOP_BREADCRUMB = STICKY_TOP_TABS + STICKY_TABS_H;
const STICKY_TOP_LIST_HEADER = STICKY_TOP_BREADCRUMB + STICKY_BREADCRUMB_H;

/**
 * 歌词解析器的时间预算。
 * 宿主在 src/renderer/plugins/lyrics.ts 中对每个 resolver 的 match/resolve
 * 施加 2500ms 硬超时，超时后结果被直接丢弃并回落到宿主默认歌词链路。
 * 这里留出余量，确保解析器一定在宿主超时前返回。
 */
const LYRIC_RESOLVE_BUDGET_MS = 1800;
/** 距离截止时间还剩多少毫秒（至少返回 0） */
const remainingMs = (deadline) => Math.max(0, deadline - Date.now());
/** 竞速用的延时器，不阻塞主线程 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

/**
 * 插件排序字段 ↔ 宿主 SongListHeader 字段的映射。
 * 平铺视图用宿主表头，它只认 index / title / artist / album / duration；
 * 插件内部的 'name'（文件名）对应 'index'，'size' 在宿主表头里没有对应列，
 * 切换视图时统一清掉，避免残留一个无法高亮的排序态。
 */
const FLAT_SORT_HEADER_FIELD = { name: "index", title: "title", artist: "artist", album: "album" };
const FLAT_SORT_FIELD = { index: "name", title: "title", artist: "artist", album: "album" };
const COVER_NAMES = [
  "cover.jpg", "cover.png", "cover.webp",
  "folder.jpg", "folder.png",
  "front.jpg", "front.png",
  "album.jpg", "album.png",
  "albumart.jpg", "albumart.png",
];

/** 单个 WebDAV 库的默认结构 */
const createDefaultLibrary = (id) => ({
  id,
  name: "",
  serverUrl: "",
  username: "",
  password: "",
  rootPath: "/",
  flatView: false,
});

const DEFAULT_SETTINGS = {
  // 向后兼容：单库配置（已废弃，迁移到 libraries）
  serverUrl: "",
  username: "",
  password: "",
  rootPath: "/",
  coverLyricSource: "embedded", // "embedded" | "kugou"
  // 多库配置
  libraries: [],
  activeLibraryId: null,
};

/** 1x1 空白 JPEG，作为系统媒体控制封面转换失败时的兜底 */
const BLANK_COVER_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAQAAAAAAAAAAAAAAAAAAAAf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8ApgAH/9k=";

/** 模块级排序状态（不依赖组件生命周期，应用关闭前持久保持） */
let _sortField = null; // 'name' | 'title' | 'size' | null
let _sortOrder = null; // 'asc' | 'desc' | null

/** 模块级歌词缓存：songId → lyric text，供歌词解析器使用 */
const _enrichedLyrics = new Map();

/** 模块级 enrichment 追踪：songId → Promise，供歌词解析器等待 */
const _pendingEnrichment = new Map();

/** 模块级库配置缓存：songId → library，供封面获取使用 */
const _songLibraryCache = new Map();

/**
 * 模块级 Object URL 登记表。
 * 插件用 createObjectURL 承载内嵌封面与目录封面，这些 URL 会留在
 * 播放队列 / 播放快照里，必须在替换时回收，否则长时间浏览持续泄漏内存。
 *
 * 注意：这里是「同 key 替换即回收旧值」的单引用语义，不是引用计数——
 * 同一首歌重复 enrich 会复用已有 URL（见 _songCoverUrls），同一目录
 * 重复进入会复用已有封面（见 _folderCoverUrls），所以同一 key 不会被
 * 多处同时持有。deactivate 时统一 revoke，届时播放队列里的旧封面会
 * 一起失效（可接受：禁用插件本就意味着这些封面不再可用）。
 */
const _objectUrls = new Map();

/** 登记一个新的 Object URL，返回可直接使用的 URL 字符串 */
const trackObjectUrl = (key, blob, mimeType) => {
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType || "image/jpeg" }));
  releaseObjectUrl(key);
  _objectUrls.set(key, { url, count: 1 });
  return url;
};

/**
 * 释放某个 key 之前登记的 Object URL。
 * 同一个 URL 可能被多个 song / 目录共享，因此引用计数归零才真正 revoke。
 */
const releaseObjectUrl = (key) => {
  if (!key) return;
  const entry = _objectUrls.get(key);
  if (!entry) return;
  entry.count -= 1;
  if (entry.count > 0) return;
  _objectUrls.delete(key);
  try { URL.revokeObjectURL(entry.url); } catch { /* 已失效则忽略 */ }
};

/** 批量释放所有已登记的 Object URL（停用插件时调用） */
const releaseAllObjectUrls = () => {
  for (const entry of _objectUrls.values()) {
    try { URL.revokeObjectURL(entry.url); } catch { /* 已失效则忽略 */ }
  }
  _objectUrls.clear();
};

/** 目录封面 URL 缓存：coverKey → url，避免重复下载同一张目录封面 */
const _folderCoverUrls = new Map();

/** 歌曲内嵌封面 URL 缓存：coverKey → url，避免同一首歌重复创建 Object URL */
const _songCoverUrls = new Map();

/** 音质探测结果缓存：key(serverUrl + filePath) → quality，避免同一次播放重复 Range 请求 */
const _qualityCache = new Map();
const QUALITY_CACHE_LIMIT = 200;

const qualityCacheKey = (lib, filePath) => `${lib?.serverUrl || ""}|${filePath}`;

// 用 undefined 表示「key 不存在」，null 表示「已探测过但没有音质信息」，
// 否则 ogg/opus/wma 等解析不出音质的文件每次播放都会重发 256KB Range 请求
const readQualityCache = (key) => {
  if (!key) return undefined;
  return _qualityCache.has(key) ? _qualityCache.get(key) : undefined;
};

const writeQualityCache = (key, quality) => {
  if (!key) return quality;
  if (_qualityCache.size >= QUALITY_CACHE_LIMIT) {
    const oldest = _qualityCache.keys().next().value;
    if (oldest !== undefined) _qualityCache.delete(oldest);
  }
  _qualityCache.set(key, quality);
  return quality;
};




/* ===================================================================
 * Cover Fallback — 跟随主应用兜底封面机制
 * 监听 cover-fallback 插件的 BroadcastChannel，动态计算兜底封面 URL
 * =================================================================== */

/** 主应用兜底封面默认值（与 @/plugins/coverFallback.ts 的 DEFAULT_COVER_URL 一致） */
const DEFAULT_COVER_URL = "https://imge.kugou.com/soft/collection/default.jpg";

/** 模块级兜底封面 ref（Vue ref，不依赖组件生命周期，由 activate 初始化，BroadcastChannel 更新） */
let _fallbackCoverUrlRef = null;

/** 模块级 BroadcastChannel，由 activate 初始化、deactivate 关闭 */
let _bcChannel = null;

/**
 * 将封面 URL 转换为 JPEG data URL，确保主进程 SMTC 可正常下载和使用
 * 
 * 问题：
 * 1. Blob URL（URL.createObjectURL）仅在渲染进程有效，主进程 fetch 无法访问
 * 2. SVG data URL 无法被 native addon 的 image crate 解码（无 rsvg 特性）
 * 
 * 解决：通过 Canvas 将任意图片格式转换为 JPEG data URL，
 *      主进程可直接 fetch，native addon 也能快速处理（JPEG 直达路径）。
 */
const convertCoverForSmtc = async (ctx, input, authHeader) => {
  if (!input) return input;

  // Uint8Array：直接转 base64 data URL
  if (input instanceof Uint8Array) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(new Blob([input], { type: "image/jpeg" }));
    });
  }

  // 已经是 JPEG data URL：直接使用
  if (/^data:image\/jpeg/.test(input)) return input;

  // 远程 URL 且需要认证：带 Authorization header 拉取
  // 浏览器 <img> 和 fetch 不支持 URL 内嵌凭证（user:pass@host）
  if (typeof input === "string" && authHeader && /^https?:\/\//i.test(input)) {
    try {
      const res = await (ctx?.net?.fetch ? ctx.net.fetch(input, { headers: { Authorization: authHeader } }) : fetch(input, { headers: { Authorization: authHeader } }));
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch {}
  }

  // 其他 URL（Object URL / 跨域图）：通过 Canvas 转 JPEG data URL
  // 注意：这里必须用局部变量保存 2D context，避免遮蔽插件的 ctx 参数
  const TIMEOUT_MS = 5000;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await Promise.race([
      new Promise((resolve, reject) => {
        // 超时定时器在图片成功加载后要清掉，否则每次调用泄漏一个 5s 定时器
        const timer = setTimeout(() => reject(new Error('Image load timeout')), TIMEOUT_MS);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Image load failed')); };
        img.src = input;
      }),
    ]);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    return input;
  }
};

const escapeXml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const readCssColor = (variableName, fallback) => {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.color = `var(${variableName})`;
  document.documentElement.appendChild(probe);
  const color = getComputedStyle(probe).color.trim();
  probe.remove();
  return color || fallback;
};

const parseRgb = (color) => {
  const text = String(color || "").trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const val = hex[1];
    const full = val.length === 3 ? val.split("").map((c) => c + c).join("") : val;
    return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
  }
  const rgb = text.match(/rgba?\(([^)]+)\)/i);
  if (!rgb) return null;
  const [r, g, b] = rgb[1].split(",").slice(0, 3).map((c) => parseFloat(c.trim()));
  if (![r, g, b].every(Number.isFinite)) return null;
  return { r, g, b };
};

const resolveReadableTextColor = (backgroundColor) => {
  const rgb = parseRgb(backgroundColor);
  if (!rgb) return "#ffffff";
  const normalize = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = 0.2126 * normalize(rgb.r) + 0.7152 * normalize(rgb.g) + 0.0722 * normalize(rgb.b);
  return lum > 0.46 ? "#111827" : "#ffffff";
};

/** 生成文字封面 SVG（与 cover-fallback 插件完全一致的逻辑） */
const createSvgCoverUrl = (settings, size) => {
  const fontSize = Math.round((Number(settings.fontSize) || 42) * (size / 400));
  const subFontSize = Math.max(14, Math.round(fontSize * 0.38));
  const text = escapeXml(settings.text || "EchoMusic");
  const subtext = escapeXml(settings.subtext || "");
  const showSubtext = Boolean(settings.showSubtext && subtext);
  const mainY = showSubtext ? "48%" : "54%";
  const bg = readCssColor("--color-primary", "#31cfa1");
  const fg = resolveReadableTextColor(bg);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${escapeXml(bg)}"/>` +
    `<text x="50%" y="${mainY}" text-anchor="middle" dominant-baseline="middle" fill="${escapeXml(fg)}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${fontSize}" font-weight="800">${text}</text>` +
    (showSubtext
      ? `<text x="50%" y="62%" text-anchor="middle" dominant-baseline="middle" fill="${escapeXml(fg)}" opacity="0.72" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="${subFontSize}" font-weight="650">${subtext}</text>`
      : "") +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/** 根据 cover-fallback 插件设置，计算当前应使用的兜底封面 URL */
const computeFallbackCoverUrl = (settings) => {
  if (!settings || !settings.enabled) return DEFAULT_COVER_URL;
  if (settings.mode === "image" && settings.imageUrl && /^(https?:\/\/|file:\/\/|data:image\/)/i.test(String(settings.imageUrl)))
    return settings.imageUrl;
  if (settings.mode === "text") return createSvgCoverUrl(settings, 92);
  return DEFAULT_COVER_URL;
};


/* ===================================================================
 * Embedded Tag Parser — ID3v2 / FLAC
 * =================================================================== */
const readTagText = (data, offset, maxLen, encoding) => {
  const slice = data.slice(offset, offset + maxLen);
  let end = slice.length;
  if (encoding === 0 || encoding === 3) { const ni = slice.indexOf(0); if (ni >= 0) end = ni; }
  else { for (let i = 0; i + 1 < slice.length; i += 2) { if (slice[i] === 0 && slice[i + 1] === 0) { end = i; break; } } }
  const trimmed = data.slice(offset, offset + end);
  const charset = encoding === 3 ? "utf-8" : encoding === 0 ? "iso-8859-1" : "utf-16le";
  return new TextDecoder(charset).decode(trimmed).replace(/\0/g, "").trim();
};
const parseID3v2 = (buffer) => {
  const result = { title: "", artist: "", album: "", lyric: "", duration: 0, coverData: null, coverMime: "" };
  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const readSynch = (off, len) => { let v = 0; for (let i = 0; i < len; i++) v = (v << 7) | dv.getUint8(off + i); return v; };
  const ver = dv.getUint8(3); if (ver < 2 || ver > 4) return result;
  const tagSize = readSynch(6, 4); let off = 10;
  if (ver >= 3 && (dv.getUint8(5) & 0x40)) off += 4 + readSynch(off, 4);
  const end = Math.min(off + tagSize, buffer.length);
  while (off + 6 <= end) {
    let frameId, frameSize;
    if (ver === 2) { frameId = String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2)); frameSize = (dv.getUint8(off + 3) << 16) | (dv.getUint8(off + 4) << 8) | dv.getUint8(off + 5); off += 6; }
    else { frameId = String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3)); frameSize = ver === 4 ? readSynch(off + 4, 4) : dv.getUint32(off + 4); off += 8; }
    if (frameSize <= 0 || off + frameSize > end) break;
    const fd = buffer.slice(off, off + frameSize); off += frameSize;
    const isText = ver === 2 ? (frameId[0] === "T" && frameId.length === 3 && frameId !== "TXX") : (frameId[0] === "T" && frameId !== "TXXX");
    if (isText) {
      const enc = fd[0]; const text = readTagText(fd, 1, frameSize - 1, enc);
      const key = ver === 2 ? { TT2: "TIT2", TP1: "TPE1", TAL: "TALB", TLE: "TLEN" }[frameId] || frameId : frameId;
      if (key === "TIT2" && !result.title) result.title = text; else if (key === "TPE1" && !result.artist) result.artist = text;
      else if (key === "TALB" && !result.album) result.album = text; else if (key === "TLEN") { const d = parseInt(text, 10); if (d > 0) result.duration = Math.round(d / 1000); }
      continue;
    }
    if (frameId === "USLT" || frameId === "ULT") {
      const enc = fd[0]; let pos = 4;
      // 终止符长度随编码不同：单字节（0/3）需再跳 1 字节；双字节（1/2）已由 pos += 2 越过
      if (enc === 0 || enc === 3) { while (pos < frameSize && fd[pos] !== 0) pos++; pos += 1; }
      else { while (pos + 1 < frameSize && !(fd[pos] === 0 && fd[pos + 1] === 0)) pos += 2; pos += 2; }
      if (pos < frameSize) result.lyric = readTagText(fd, pos, frameSize - pos, enc);
      continue;
    }
    if (frameId === "APIC" || frameId === "PIC") {
      const enc = fd[0]; let pos = 1; while (pos < frameSize && fd[pos] !== 0) pos++;
      result.coverMime = String.fromCharCode(...fd.slice(1, pos)); pos += 2;
      if (enc === 0 || enc === 3) { while (pos < frameSize && fd[pos] !== 0) pos++; pos += 1; }
      else { while (pos + 1 < frameSize && !(fd[pos] === 0 && fd[pos + 1] === 0)) pos += 2; pos += 2; }
      if (pos < frameSize) result.coverData = fd.slice(pos);
    }
  }
  return result;
};
const parseFLAC = (buffer) => {
  const result = { title: "", artist: "", album: "", lyric: "", duration: 0, coverData: null, coverMime: "" };
  const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength); let off = 4;
  while (off + 4 <= buffer.length) {
    const header = dv.getUint8(off); const blockType = header & 0x7F;
    const blockSize = (dv.getUint8(off + 1) << 16) | (dv.getUint8(off + 2) << 8) | dv.getUint8(off + 3); off += 4;
    if (off + blockSize > buffer.length) break;
    const bd = buffer.slice(off, off + blockSize); off += blockSize;
    if (blockType === 0 && blockSize >= 34) { const bdv = new DataView(bd.buffer, bd.byteOffset, bd.byteLength); const totalSamples = (bdv.getUint32(10) & 0xF) * 0x100000000 + bdv.getUint32(14); const sampleRate = (bdv.getUint16(10) << 4) | (bdv.getUint8(12) >> 4); if (sampleRate > 0) result.duration = Math.round(totalSamples / sampleRate); }
    else if (blockType === 4) { const bdv = new DataView(bd.buffer, bd.byteOffset, bd.byteLength); const vendorLen = bdv.getUint32(0, true); let pos = 4 + vendorLen; const numComments = bdv.getUint32(pos, true); pos += 4; for (let i = 0; i < numComments; i++) { if (pos + 4 > bd.length) break; const len = bdv.getUint32(pos, true); pos += 4; if (pos + len > bd.length) break; const comment = new TextDecoder().decode(bd.slice(pos, pos + len)); pos += len; const eq = comment.indexOf("="); if (eq <= 0) continue; const key = comment.slice(0, eq).toUpperCase(), value = comment.slice(eq + 1); if (key === "TITLE" && !result.title) result.title = value; else if (key === "ARTIST" && !result.artist) result.artist = value; else if (key === "ALBUM" && !result.album) result.album = value; else if (key === "LYRICS" && !result.lyric) result.lyric = value; } }
    else if (blockType === 6 && blockSize > 4) { const bdv = new DataView(bd.buffer, bd.byteOffset, bd.byteLength); let p = 4; const mimeLen = bdv.getUint32(p); p += 4; result.coverMime = new TextDecoder().decode(bd.slice(p, p + mimeLen)); p += mimeLen; const descLen = bdv.getUint32(p); p += 4 + descLen; p += 16; const picLen = bdv.getUint32(p); p += 4; if (p + picLen <= bd.length) result.coverData = bd.slice(p, p + picLen); }
    if (header & 0x80) break;
  }
  return result;
};
/**
 * 统一的 WebDAV 请求入口。
 *
 * 传输层优先使用 ctx.net.request（主进程 Axios）：不受浏览器 CORS / 预检限制，
 * 是调用 PROPFIND 这类非标准方法的唯一可靠方式；宿主未声明
 * capabilities.unrestrictedNetwork 时退回 ctx.net.fetch。
 *
 * 传入 options.range 时会校验响应是否真的按 Range 返回，避免服务端忽略
 * Range 直接返回 200 完整文件导致整首歌曲被下载。
 */
const webdavRequest = async (ctx, lib, path, options = {}) => {
  const { method = "GET", headers = {}, body, responseType = "text", range, signal, timeoutMs } = options;
  // 文件名可能含 # ? 空格或非 ASCII；audioSource 走的 buildAuthUrl 有 encodePath，
  // 这里也要做同样的段级编码，否则这类文件 PROPFIND/GET/封面探测会失败
  const url = joinUrl(lib.serverUrl, encodePath(path));
  const finalHeaders = { ...headers };
  const auth = buildAuthHeader(lib);
  if (auth) finalHeaders.Authorization = auth;
  if (range) finalHeaders.Range = `bytes=${range.start}-${range.end}`;
  const wantLength = range ? range.end - range.start + 1 : 0;

  /**
   * 把响应裁剪到请求的 Range 窗口。
   * 两种情况都要裁：服务端正确返回 206 时数据本就位于 range.start，
   * 忽略 Range 直接返回 200 完整文件时数据从 0 开始——两者切片结果一致，
   * 这样至少不会把整首歌送进标签解析器。
   */
  const clamp = (data) => {
    if (wantLength <= 0) return data;
    const isBinary = data instanceof ArrayBuffer || ArrayBuffer.isView(data);
    if (!isBinary) return data;
    return (data?.byteLength ?? 0) > wantLength ? data.slice(range.start, range.start + wantLength) : data;
  };

  const useUnrestricted =
    typeof ctx?.net?.request === "function" &&
    ctx.manifest?.capabilities?.unrestrictedNetwork === true;

  if (useUnrestricted) {
    const res = await ctx.net.request({ url, method, headers: finalHeaders, body, responseType, signal, timeoutMs });
    const raw = res?.headers || {};
    const contentRange = String(
      Array.isArray(raw["content-range"]) ? raw["content-range"][0] : raw["content-range"] || "",
    );
    const partial = res.status === 206 || /^bytes\s+\d+-\d+\//i.test(contentRange);
    return { ok: res.status >= 200 && res.status < 300, status: res.status, data: clamp(res.data), partial };
  }

  const res = await ctx.net.fetch(url, { method, headers: finalHeaders, body, signal });
  if (!res.ok) return { ok: false, status: res.status, data: null, partial: res.status === 206 };
  const contentRange = res.headers?.get?.("content-range") || "";
  const partial = res.status === 206 || /^bytes\s+\d+-\d+\//i.test(contentRange);
  const data = responseType === "arrayBuffer" ? new Uint8Array(await res.arrayBuffer()) : await res.text();
  return { ok: true, status: res.status, data: clamp(data), partial };
};

const readFileHead = async (ctx, settings, filePath) => {
  const res = await webdavRequest(ctx, settings, filePath, {
    responseType: "arrayBuffer",
    range: { start: 0, end: HEAD_READ_LIMIT - 1 },
    timeoutMs: 20000,
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.data instanceof Uint8Array ? res.data : new Uint8Array(res.data || 0);
};
const readEmbeddedTags = async (ctx, settings, filePath) => {
  try { const head = await readFileHead(ctx, settings, filePath); if (!head || head.length < 4) return null; if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return parseID3v2(head); if (head[0] === 0x66 && head[1] === 0x4C && head[2] === 0x61 && head[3] === 0x43) return parseFLAC(head); return null; }
  catch (err) { console.error("[webdav-music] readEmbeddedTags error:", filePath, err); return null; }
};



/**
 * 将充实后的元数据同步到播放队列、当前播放器快照和歌词 store
 * 
 * 关键：lyricStore 通过 playTrack 中的 ensureLyricsForCurrentTrack 加载歌词，
 * 但此时 track 还没有 lyric（enrich 是异步的）。当 enrich 完成后，
 * currentTrackSnapshot 虽然被更新了，但 ensureLyricsForCurrentTrack 的 watch
 * 只监听 currentTrack.value?.id（未变），不会重新触发。
 * 
 * 因此必须在此处直接调用 lyricStore.setLyric() 将歌词注入歌词系统。
 */
const syncToStores = (ctx, songId, patch) => {
  try {
    const playlist = ctx.stores.playlist;
    const player = ctx.stores.player;
    const lyric = ctx.stores.lyric;
    const sid = String(songId);
    // 1) 更新播放队列中的歌曲（重新赋值触发响应式）
    const queue = playlist.activeQueue;
    if (queue && Array.isArray(queue.songs)) {
      const idx = queue.songs.findIndex((s) => String(s.id) === sid);
      if (idx >= 0) {
        queue.songs[idx] = { ...queue.songs[idx], ...patch };
      }
    }
    // 2) 注入歌词到 lyricStore（解决歌词异步加载的时序问题）
    if (patch.lyric) {
      lyric.setLyric(patch.lyric, sid);
      _enrichedLyrics.set(sid, patch.lyric);
    }
    // 3) 更新当前播放歌曲的快照
    //    currentTrackSnapshot 由 toRawSong() 创建并用 markRaw 包装，
    //    Vue 不追踪其属性变化，必须整体替换才能触发主应用 watcher
    if (player.currentTrackId && String(player.currentTrackId) === sid) {
      const currentSnapshot = player.currentTrackSnapshot;
      if (currentSnapshot) {
        player.currentTrackSnapshot = { ...currentSnapshot, ...patch };
      }
      // 4) 元数据充实后同步刷新系统媒体控制（Windows SMTC 等）
      //
      // 必须同时走 mediaControls.updateMetadata 和 output.setTrackMeta：
      // 宿主 src/renderer/utils/player.ts updateMediaMetadata() 也是成对调用，
      // 只调前者会让输出设备侧拿不到最新元数据。
      const snapshotForSmtc = player.currentTrackSnapshot;
      if (snapshotForSmtc && (window.electron?.mediaControls || window.electron?.output?.setTrackMeta)) {
        // 获取库配置以构建 Authorization header
        const lib = _songLibraryCache.get(sid);
        const authHeader = lib ? buildAuthHeader(lib) : null;
        const rawCoverUrl = patch.coverUrl || snapshotForSmtc.coverUrl || snapshotForSmtc.cover || _fallbackCoverUrlRef.value;
        (async () => {
          let coverUrl;
          try {
            coverUrl = await convertCoverForSmtc(ctx, rawCoverUrl, authHeader);
          } catch {
            coverUrl = BLANK_COVER_DATA_URL;
          }
          const meta = {
            title: snapshotForSmtc.title || "未知歌曲",
            artist: snapshotForSmtc.artist || "未知歌手",
            album: snapshotForSmtc.album || "",
            durationMs: (snapshotForSmtc.duration || 0) * 1000,
          };
          try { window.electron?.mediaControls?.updateMetadata?.({ ...meta, coverUrl }); } catch {}
          try { window.electron?.output?.setTrackMeta?.({ ...meta, artwork: coverUrl }); } catch {}
        })();
      }
    }
  } catch (err) {
    console.error("[webdav-music] syncToStores error:", err);
  }
};

const buildPatchFromSource = (song, source, sourceType) => {
  const patch = {};
  if (sourceType === 'embedded') {
    if (source.title) { song.title = source.title; song.name = source.title; patch.title = source.title; patch.name = source.title; }
    if (source.artist) { song.artist = source.artist; song.artists = [{ name: source.artist }]; song.singers = [{ name: source.artist }]; patch.artist = source.artist; patch.artists = [{ name: source.artist }]; patch.singers = [{ name: source.artist }]; }
    if (source.album) { song.album = source.album; song.albumName = source.album; patch.album = source.album; patch.albumName = source.album; }
    if (source.coverData) {
      // 同一首歌重复 enrich 时复用已有 Object URL，避免每次切歌都新建一个泄漏
      const coverKey = `song:${song.id}`;
      let cu = _songCoverUrls.get(coverKey);
      if (!cu) {
        cu = trackObjectUrl(coverKey, source.coverData, source.coverMime || "image/jpeg");
        _songCoverUrls.set(coverKey, cu);
      }
      song.coverUrl = cu; song.cover = cu; patch.coverUrl = cu; patch.cover = cu;
    }
    if (source.lyric) { song.lyric = source.lyric; patch.lyric = source.lyric; }
    if (source.duration > 0) { song.duration = source.duration; patch.duration = source.duration; }
  } else if (sourceType === 'kugou') {
    // 从酷狗 API 结果构建 patch
    const { coverUrl, albumName, matchSinger, lyricText } = source;
    if (coverUrl && !song.coverUrl) { song.coverUrl = coverUrl; song.cover = coverUrl; patch.coverUrl = coverUrl; patch.cover = coverUrl; }
    if (albumName && !song.album) { song.album = albumName; song.albumName = albumName; patch.album = albumName; patch.albumName = albumName; }
    if (matchSinger && (!song.artist || song.artist === "未知歌手")) { song.artist = matchSinger; song.artists = [{ name: matchSinger }]; song.singers = [{ name: matchSinger }]; patch.artist = matchSinger; patch.artists = [{ name: matchSinger }]; patch.singers = [{ name: matchSinger }]; }
    if (lyricText && !song.lyric) { song.lyric = lyricText; patch.lyric = lyricText; }
  }
  
  return patch;
};

/**
 * 通过酷狗搜索歌曲并取回匹配的元数据与歌词（不含写库，由调用方决定怎么用）。
 *
 * enrichFromKugouApi 与歌词解析器共用这一份实现：
 * 同一次播放里两者搜索的关键词完全一致，避免重复请求。
 */
const searchKugouSong = async (ctx, track, options = {}) => {
  if (!track?.title || !ctx?.kugou) return null;
  const artist = track.artist || "";
  const title = track.title;
  const keyword = artist && artist !== "未知歌手" ? `${artist} ${title}` : title;
  if (!keyword) return null;
  try {
    const searchResult = await ctx.kugou.search.search(keyword, "song", 1, 5);
    const lists = searchResult?.data?.lists || searchResult?.data?.list || [];
    if (!lists.length) return null;
    const match = lists[0];
    if (!match) return null;
    const data = {
      fileHash: match.FileHash || "",
      coverUrl: formatPicUrl(match.Image || match.trans_param?.union_cover || match.cover || ""),
      albumName: match.AlbumName || "",
      matchSinger: match.SingerName || "",
      lyricText: "",
    };
    // 已有歌词时不再多发两次歌词请求
    if (data.fileHash && options.needLyric !== false) {
      const lyricText = await fetchKugouBestLyric(ctx, data.fileHash);
      if (lyricText) data.lyricText = lyricText;
    }
    return data;
  } catch {
    return null;
  }
};

/** 按 FileHash 取最优歌词（官方推荐优先，其次 score 最高） */
const fetchKugouBestLyric = async (ctx, fileHash) => {
  if (!fileHash) return "";
  try {
    const lyricResult = await ctx.kugou.music.searchLyric(fileHash);
    const candidates = lyricResult?.candidates || lyricResult?.data?.candidates || [];
    const best = [...candidates]
      .filter((c) => c?.id && c?.accesskey)
      .sort(
        (a, b) =>
          (b.product_from === "官方推荐歌词" ? 1 : 0) - (a.product_from === "官方推荐歌词" ? 1 : 0) ||
          (b.score ?? 0) - (a.score ?? 0),
      )[0];
    if (!best) return "";
    const detail = await ctx.kugou.music.getLyric(String(best.id), String(best.accesskey));
    return detail?.decodeContent || detail?.content || detail?.data?.content || "";
  } catch {
    return "";
  }
};

/** 后台酷狗搜索登记表：hash → Promise，避免歌词解析器每次切歌都重新串行搜索 */
const _kugouLyricSearches = new Map();
/**
 * 模块状态会话代数。deactivate/activate 会让它 +1；
 * 在飞的异步回调（enrich / kugou 搜索）完成时先比对代数，
 * 不一致说明本次会话已被清理，直接丢弃结果，避免把已清空的缓存又填回来。
 */
let _stateEpoch = 0;
const stateEpoch = () => _stateEpoch;

/**
 * 触发一次后台酷狗歌词搜索，结果写入 _enrichedLyrics。
 * 已在进行中或已有结果时直接复用，返回对应的 Promise。
 */
const startKugouLyricSearch = (ctx, hash, track) => {
  if (!hash || !track) return null;
  if (_enrichedLyrics.get(hash)) return Promise.resolve(_enrichedLyrics.get(hash));
  const existing = _kugouLyricSearches.get(hash);
  if (existing) return existing;
  const epoch = stateEpoch();
  const task = searchKugouSong(ctx, track)
    .then((data) => {
      // deactivate 可能已清空模块状态；此时丢弃结果，避免「复活」上一会话的缓存
      if (stateEpoch() !== epoch) return "";
      if (data?.lyricText) _enrichedLyrics.set(hash, data.lyricText);
      return data?.lyricText || "";
    })
    .catch(() => "")
    .finally(() => _kugouLyricSearches.delete(hash));
  _kugouLyricSearches.set(hash, task);
  return task;
};

/**
 * 通过酷狗 API 搜索并补全歌曲元数据（异步 fire-and-forget，不阻塞播放）
 *
 * 当文件嵌入标签（ID3v2/FLAC）解析失败时，作为第三优先级回退。
 * 使用 ctx.kugou 调用 EchoMusic 内置酷狗接口，无需额外鉴权。
 */
const enrichFromKugouApi = async (ctx, song) => {
  if (!song || !song.title || !ctx.kugou) return;
  const hasValidCover = song.coverUrl && /^https?:\/\//.test(song.coverUrl);
  if (hasValidCover && song.lyric) return;
  const epoch = stateEpoch();
  const needLyric = !song.lyric;
  const data = await searchKugouSong(ctx, song, { needLyric });
  if (!data || stateEpoch() !== epoch) return;
  if (needLyric && data.lyricText) _enrichedLyrics.set(String(song.id), data.lyricText);
  const patch = buildPatchFromSource(song, data, 'kugou');
  if (Object.keys(patch).length > 0) syncToStores(ctx, song.id, patch);
};

/**
 * 从嵌入标签充实歌曲元数据（模块级，可被组件和 activate 的切歌监听共用）
 *
 * 支持以下场景：
 * - WebDAV 浏览页双击/点击播放（由组件的 enrichSong 调用）
 * - 上一首/下一首切歌（由 activate 中的 ctx.events.onTrackChange 触发）
 * - 重启应用后恢复播放（由 activate 中的初始补一次 enrich 触发）
 */
const enrichTrack = async (ctx, state, song) => {
  if (!song._filePath) return song;
  // deactivate 会清空模块状态；在飞的 enrich 完成时若会话已变，直接放弃，
  // 避免把结果写进已被清空的缓存或替换成新会话的 currentTrackSnapshot
  const epoch = stateEpoch();
  const settings = state?.settings;
  let lib = null;
  if (song._libraryId && settings?.libraries) {
    lib = settings.libraries.find((l) => l.id === song._libraryId);
  }
  if (!lib && settings?.libraries?.length > 0) lib = settings.libraries[0];
  if (!lib) return song;
  _songLibraryCache.set(String(song.id), lib);
  detectAndSetQuality(ctx, lib, song).catch(() => {});

  if (stateEpoch() !== epoch) return song;
  const coverLyricSource = settings.coverLyricSource || "embedded";
  if (coverLyricSource === "kugou") {
    // 「在线匹配封面歌词」开启：酷狗结果优先，内嵌标签只补酷狗没给到的字段。
    // 不能把 embedded patch 无条件套上去，否则两种模式最终值完全相同，
    // 与设置文案「开启后优先使用酷狗」矛盾。
    await enrichFromKugouApi(ctx, song);
    const missingCover = !song.coverUrl || !/^https?:\/\//.test(song.coverUrl);
    const missingLyric = !song.lyric;
    if (missingCover || missingLyric) {
      const tags = await readEmbeddedTags(ctx, lib, song._filePath);
      if (stateEpoch() !== epoch) return song;
      if (tags) {
        const patch = buildPatchFromSource(song, tags, 'embedded');
        if (Object.keys(patch).length > 0) syncToStores(ctx, song.id, patch);
      }
    }
  } else {
    const tags = await readEmbeddedTags(ctx, lib, song._filePath);
    if (stateEpoch() !== epoch) return song;
    if (!tags) { await enrichFromKugouApi(ctx, song); return song; }
    const patch = buildPatchFromSource(song, tags, 'embedded');
    syncToStores(ctx, song.id, patch);
    if (!tags.coverData || !tags.lyric) await enrichFromKugouApi(ctx, song);
  }
  return song;
};

/**
 * 从文件扩展名检测音质（无需网络请求）
 *
 * 返回值必须是宿主的 AudioQualityValue（'128' | '320' | 'flac' | 'high' | 'viper_*'），
 * 宿主在 normalizeAudioQuality 中会把不匹配的值静默归一化成 null。
 */
const detectAudioQualityFromExtension = (filePath) => {
  if (!filePath) return null;
  const ext = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "flac") return "flac";
  if (ext === "wav" || ext === "ape" || ext === "aiff" || ext === "alac" || ext === "wv") return "flac";
  // DSD 属于无损，宿主音质枚举没有独立档位，归入 flac
  if (ext === "dsf" || ext === "dff") return "flac";
  if (ext === "mp3") return null; // MP3 需要读取头部检测比特率
  if (ext === "m4a" || ext === "aac") return "320"; // AAC/M4A 通常为 HQ
  return null;
};

/**
 * 检测音频音质（统一检测逻辑，供 audioSource.resolve 和 enrichTrack 使用）
 *
 * 结果按 serverUrl + filePath 缓存：同一次播放中 enrichTrack 与
 * audioSource.resolve 都会调用本函数，不缓存会对同一文件重复发起 Range 请求。
 *
 * @param {Object} ctx - 插件上下文
 * @param {Object} lib - 库配置
 * @param {string} filePath - 文件路径
 * @returns {Promise<string|null>} 宿主 AudioQualityValue
 */
const detectAudioQuality = async (ctx, lib, filePath) => {
  if (!filePath) return null;
  const cacheKey = qualityCacheKey(lib, filePath);
  const cached = readQualityCache(cacheKey);
  if (cached !== undefined) return cached;

  // 1) 优先使用扩展名检测（即时完成，无需网络请求）
  let quality = detectAudioQualityFromExtension(filePath);
  // 2) MP3 或无扩展名匹配时，尝试 Range 请求读取头部检测
  if (!quality) {
    try {
      const res = await webdavRequest(ctx, lib, filePath, {
        responseType: "arrayBuffer",
        range: { start: 0, end: HEAD_READ_LIMIT - 1 },
        timeoutMs: 20000,
      });
      if (res?.ok && res.data) {
        quality = detectAudioQualityFromHead(
          res.data instanceof Uint8Array ? res.data : new Uint8Array(res.data),
          filePath,
        );
      }
    } catch (err) {
      console.warn("[webdav-music] detectAudioQuality Range request failed:", err.message);
    }
  }
  // 3) MP3 仍然检测失败时，默认设为 320
  if (!quality && filePath.toLowerCase().endsWith(".mp3")) {
    quality = "320";
  }
  return writeQualityCache(cacheKey, quality);
};

/** 检测音质并设置到播放器 store，锁定音质不可切换 */
const detectAndSetQuality = async (ctx, lib, song) => {
  if (!lib || !song._filePath || !ctx.stores?.player) return;
  const epoch = stateEpoch();
  const quality = await detectAudioQuality(ctx, lib, song._filePath);
  if (!quality || stateEpoch() !== epoch) return;
  if (String(ctx.stores.player.currentResolvedAudioQuality || "") === quality) return;
  ctx.stores.player.currentResolvedAudioQuality = quality;
  ctx.player.setAudioQuality(quality, { refresh: false });
};

/* ---- Helpers ---- */
const normalizeSettings = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const settings = { ...DEFAULT_SETTINGS, ...source };
  
  // 向后兼容：如果旧的单库配置存在且 libraries 为空，自动迁移
  if ((!settings.libraries || settings.libraries.length === 0) && settings.serverUrl) {
    settings.libraries = [{
      id: "lib_1",
      name: "",
      serverUrl: settings.serverUrl,
      username: settings.username || "",
      password: settings.password || "",
      rootPath: settings.rootPath || "/",
    }];
    settings.activeLibraryId = "lib_1";
  }
  
  // 确保 libraries 是数组
  if (!Array.isArray(settings.libraries)) {
    settings.libraries = [];
  }
  
  // 确保 activeLibraryId 指向真实存在的库：
  // 既要处理空值，也要处理「库被删除后残留的失效 id」，否则浏览页会永远空白
  if (settings.libraries.length > 0) {
    const exists = settings.libraries.some((l) => l && l.id === settings.activeLibraryId);
    if (!exists) settings.activeLibraryId = settings.libraries[0]?.id ?? null;
  } else {
    settings.activeLibraryId = null;
  }

  return settings;
};

/** 生成唯一的库 ID */
const generateLibraryId = () => "lib_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const isAudioFile = (name) => {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return false;
  return AUDIO_EXTENSIONS.includes(name.slice(dot + 1).toLowerCase());
};
const isCoverFile = (name) =>
  COVER_NAMES.some((c) => name.toLowerCase() === c);
const parseTitleArtist = (filename) => {
  const dot = filename.lastIndexOf(".");
  let base = dot > 0 ? filename.slice(0, dot) : filename;
  // 去除可能的音轨编号前缀 (如 "01.", "01-", "01 ")
  base = base.replace(/^\d+[\.\-\s]+/, "").trim();
  // 尝试多种分隔符：空格-空格、短横线、半长横线、全长横线
  const seps = [" - ", " – ", " — ", "-", "–", "—"];
  for (const sep of seps) {
    const idx = base.indexOf(sep);
    if (idx > 0) {
      const artist = base.slice(0, idx).trim();
      const title = base.slice(idx + sep.length).trim();
      if (artist && title) return { artist, title };
    }
  }
  return { artist: "", title: base };
};
/** 将酷狗图片路径格式化为可用的 HTTPS URL */
const formatPicUrl = (value) => {
  if (!value) return "";
  let pic = String(value).replaceAll("{size}", "400");
  if (pic.startsWith("//")) pic = "https:" + pic;
  pic = pic.replace("http://", "https://");
  pic = pic.replace("c1.kgimg.com", "imge.kugou.com");
  return pic;
};
const buildAuthHeader = (settings) => {
  if (!settings.username) return null;
  const creds = settings.username + ":" + (settings.password || "");
  const bytes = new TextEncoder().encode(creds);
  const binStr = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return "Basic " + btoa(binStr);
};
const encodePath = (path) =>
  path.split("/").map((seg) => encodeURIComponent(seg)).join("/");
const joinUrl = (base, path) => {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return b + "/" + p;
};
const buildAuthUrl = (settings, path) => {
  const base = settings.serverUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : "/" + path;
  const fullPath = encodePath(p);
  if (settings.username) {
    const encUser = encodeURIComponent(settings.username);
    const encPass = encodeURIComponent(settings.password || "");
    const proto = base.startsWith("https://") ? "https://" : "http://";
    const rest = base.slice(proto.length);
    return proto + encUser + ":" + encPass + "@" + rest + fullPath;
  }
  return base + fullPath;
};

/** 规范化目录路径：去重斜杠、确保以 / 结尾 */
const normalizeDir = (path) => path.replace(/\/+/g, "/").replace(/\/$/, "") + "/";

/**
 * 格式化文件大小。
 * 与主应用 Cloud.vue / CloudUploadDialog.vue 的 formatBytes 保持一致：
 * 1024 进制、B/KB/MB/GB/TB，小数位按量级递减。
 */
const formatSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const digits = size >= 100 || unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
};
/** 从文件头部数据检测音质 */
const detectAudioQualityFromHead = (head, filePath = "") => {
  if (!head || head.length < 8) return null;
  // FLAC
  if (head[0] === 0x66 && head[1] === 0x4C && head[2] === 0x61 && head[3] === 0x43) {
    // 跳过 "fLaC" + 4字节 BLOCK HEADER，进入 STREAMINFO 内容
    const blockSize = (head[5] << 16) | (head[6] << 8) | head[7];
    // 头部数据被截断时直接按 flac 处理，避免越界访问抛 RangeError
    if (blockSize >= 34 && head.length >= 8 + blockSize) {
      const bdv = new DataView(head.buffer, head.byteOffset + 8, blockSize);
      const sampleRate = (bdv.getUint16(10) << 4) | (bdv.getUint8(12) >> 4);
      const bps = (((bdv.getUint8(12) & 1) << 4) | (bdv.getUint8(13) >> 4)) + 1;
      if (sampleRate > 48000 || bps > 16) return "high";
    }
    return "flac";
  }
  // DSD（dsf / dff）：宿主音质枚举无独立档位，归入无损 flac
  if (head[0] === 0x44 && head[1] === 0x53 && head[2] === 0x44 && head[3] === 0x20) return "flac";
  if (head[0] === 0x46 && head[1] === 0x52 && head[2] === 0x4D && head[3] === 0x38) return "flac";
  // MP3：ID3v2 标签或裸 MPEG 帧
  let scanOff = 0;
  if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) {
    const dv = new DataView(head.buffer, head.byteOffset, head.byteLength);
    scanOff = 10 + ((dv.getUint8(6) << 21) | (dv.getUint8(7) << 14) | (dv.getUint8(8) << 7) | dv.getUint8(9));
  }
  const dv = new DataView(head.buffer, head.byteOffset, head.byteLength);
  let maxBitrate = 0;
  let framesFound = 0;
  while (scanOff + 4 <= head.length && framesFound < 3) {
    if (dv.getUint8(scanOff) === 0xFF && (dv.getUint8(scanOff + 1) & 0xE0) === 0xE0) {
      const h = dv.getUint32(scanOff);
      const ver = (h >> 19) & 0x3;
      const lay = (h >> 17) & 0x3;
      const idx = (h >> 12) & 0xF;
      if (ver !== 1 && lay !== 0 && idx !== 0 && idx !== 15) {
        let bitrate = 0;
        if (ver === 3) {
          const tbl = lay === 3 ? [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448] : lay === 2 ? [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384] : [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320];
          bitrate = tbl[idx];
        } else {
          const tbl = lay === 3 ? [0,32,48,56,64,80,96,112,128,144,160,176,192,224,256] : [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
          bitrate = tbl[idx];
        }
        if (bitrate > maxBitrate) maxBitrate = bitrate;
        framesFound++;
        // 计算下一帧偏移
        // layer 位语义：3 = Layer I，2 = Layer II，1 = Layer III。
        // Layer II/III 用 samplesPerFrame/8 公式（MPEG1 Layer II=1152、III=1152，
        // MPEG2/2.5 Layer II=1152、III=576）；Layer I 单独处理（12 帧长 ×4）。
        if (lay === 1 || lay === 2) {
          const srIdx = (h >> 10) & 0x3;
          const sampleRate = ver === 3 ? [44100, 48000, 32000][srIdx] : ver === 2 ? [22050, 24000, 16000][srIdx] : [11025, 12000, 8000][srIdx];
          const samplesPerFrame = ver === 3 || lay === 2 ? 1152 : 576;
          const padding = (h >> 9) & 1;
          if (sampleRate > 0) scanOff += Math.floor((samplesPerFrame / 8) * bitrate * 1000 / sampleRate) + padding;
          continue;
        }
      }
    }
    scanOff++;
  }
  if (maxBitrate > 0) return maxBitrate >= 320 ? "320" : "128";
  // 文件扩展名兜底
  const ext = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
  if (["wav","ape","aiff","alac"].includes(ext)) return "flac";
  if (["dsf","dff"].includes(ext)) return "flac";
  return null;
};

/**
 * 从 PROPFIND 结果中检测并获取文件夹封面 URL
 *
 * Object URL 统一登记到 _objectUrls，按目录 key 管理，
 * 重新进入同一目录时旧 URL 会被 revoke，不会无限累积。
 */
const fetchFolderCover = async (ctx, lib, dirPath, results) => {
  const epoch = stateEpoch();
  const coverKey = `dir:${lib.id}:${dirPath}`;
  const coverFiles = results.filter((e) => !e.isCollection && isCoverFile(e.name));
  if (coverFiles.length === 0) {
    releaseObjectUrl(coverKey);
    _folderCoverUrls.delete(coverKey);
    return "";
  }
  const cached = _folderCoverUrls.get(coverKey);
  if (cached) return cached;
  try {
    const res = await webdavRequest(ctx, lib, dirPath + coverFiles[0].name, {
      responseType: "arrayBuffer",
      timeoutMs: 20000,
    });
    if (res.ok && res.data && stateEpoch() === epoch) {
      const url = trackObjectUrl(coverKey, res.data);
      _folderCoverUrls.set(coverKey, url);
      return url;
    }
  } catch {}
  return "";
};
/**
 * 生成歌曲 id。
 *
 * 必须把「库身份」一起算进去：只哈希路径时，两个库里同名的相对路径
 * （例如两个盘都有 /music/晴天.mp3）会得到同一个 id。宿主 SongList 用
 * id 建 Map 去重（filteredSongIndexMap），utils/song.ts isSameSong 也按
 * mixSongId/hash 判重，撞 id 会导致列表丢行、队列里两首歌被认成一首。
 */
const generateSongId = (lib, path) => {
  const scope = `${lib?.serverUrl || ""}|${lib?.id || ""}`;
  const key = `${scope}|${path}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return "webdav_" + Math.abs(hash).toString(36);
};

/** 构建歌曲对象（统一 createSong 和 playFolder 中的重复逻辑） */
const createSongObject = (entryName, filePath, opts = {}) => {
  const { album = "WebDAV", coverUrl = _fallbackCoverUrlRef?.value || "", lib = null } = opts;
  const libraryId = lib?.id || opts.libraryId || "";
  const { artist, title } = parseTitleArtist(entryName);
  const id = generateSongId(lib || { id: libraryId }, filePath);
  return {
    id,
    songId: id,
    title: title || entryName,
    name: title || entryName,
    artist: artist || "未知歌手",
    artists: artist ? [{ name: artist }] : [],
    singers: artist ? [{ name: artist }] : [],
    album,
    albumName: album,
    duration: 0,
    coverUrl,
    cover: coverUrl,
    hash: id,
    source: "webdav",
    mixSongId: id,
    privilege: 0,
    _filePath: filePath,
    _libraryId: libraryId,
  };
};

/* ---- Flat View Cache ---- */

/** 递归收集库中所有音频文件 */
const collectAllSongs = async (ctx, lib, signal, onProgress) => {
  const allSongs = [];
  const visited = new Set();
  const walk = async (dirPath) => {
    if (signal?.aborted) return;
    if (visited.has(dirPath)) return;
    visited.add(dirPath);
    let results;
    try {
      results = await propfind(ctx, lib, dirPath);
    } catch (err) {
      console.warn("[webdav-music] collectAllSongs skip:", dirPath, err.message);
      return;
    }
    if (signal?.aborted) return;
    const dirs = results.filter((e) => e.isCollection && e.name && !isSelfEntry(e, dirPath));
    const files = results.filter((e) => !e.isCollection && isAudioFile(e.name));
    for (const f of files) {
      allSongs.push({
        ...createSongObject(f.name, dirPath + f.name, {
          album: dirPath.split("/").filter(Boolean).pop() || "WebDAV",
          lib,
        }),
        contentLength: f.contentLength || 0,
      });
    }
    if (onProgress) onProgress(visited.size, allSongs.length);
    for (const d of dirs) {
      if (signal?.aborted) return;
      await walk(normalizeDir(dirPath) + d.name + "/");
    }
  };
  await walk(normalizeDir(lib.rootPath || "/"));
  if (signal?.aborted) throw new Error("aborted");
  return allSongs;
};

/**
 * 平铺缓存结构版本。
 * 歌曲 id 生成规则变更时必须递增，否则旧缓存里的 id 与新规则不一致，
 * 会与播放队列/手动歌词里按新 id 存的键对不上。
 */
const FLAT_CACHE_VERSION = 2;

const readFlatCache = async (ctx, lib) => {
  try {
    const c = await ctx.storage.get(`flatView:${lib.id}`);
    if (!c?.songs?.length) return null;
    if (c.version !== FLAT_CACHE_VERSION) return null;
    if (c.serverUrl !== lib.serverUrl || c.rootPath !== normalizeDir(lib.rootPath || "/")) return null;
    return c;
  } catch { return null; }
};

const writeFlatCache = async (ctx, lib, songs) => {
  await ctx.storage.set(`flatView:${lib.id}`, {
    version: FLAT_CACHE_VERSION,
    songs,
    timestamp: Date.now(),
    rootPath: normalizeDir(lib.rootPath || "/"),
    serverUrl: lib.serverUrl,
  });
};

/* ---- WebDAV PROPFIND ---- */
const PROPFIND_BODY = `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getcontentlength/>
    <D:getcontenttype/>
    <D:getlastmodified/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`;

const parsePropfindXml = (xmlText) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) {
    console.warn("[webdav-music] XML parse error");
    return [];
  }
  const results = [];
  const responses = doc.getElementsByTagNameNS
    ? doc.getElementsByTagNameNS("DAV:", "response")
    : doc.querySelectorAll("response, D\\:response, d\\:response");

  for (const resp of responses) {
    const getText = (tag) => {
      const el = resp.getElementsByTagNameNS?.("DAV:", tag)?.[0] ??
        resp.querySelector(tag + ", D\\:" + tag + ", d\\:" + tag);
      return el?.textContent?.trim() ?? "";
    };
    const href = getText("href");
    const displayName = getText("displayname");
    const contentLength = parseInt(getText("getcontentlength") || "0", 10);
    const contentType = getText("getcontenttype");
    const lastModified = getText("getlastmodified");

    let isCollection = false;
    const resourceType = resp.getElementsByTagNameNS?.("DAV:", "resourcetype")?.[0];
    if (resourceType) {
      isCollection =
        !!resourceType.getElementsByTagNameNS?.("DAV:", "collection")?.[0] ||
        !!resourceType.querySelector("collection, D\\:collection, d\\:collection");
    }
    let decodedHref = href;
    try { decodedHref = decodeURIComponent(href); } catch { /* ignore */ }
    const name = displayName || decodedHref.split("/").filter(Boolean).pop() || "";
    results.push({ href: decodedHref, name, isCollection, contentLength, contentType, lastModified });
  }
  return results;
};

/**
 * PROPFIND Depth:1 的响应会把集合自身也列出来。按 href 识别自身，
 * 而不是按 displayname——子目录与父目录同名（如 /Music/Music/）时，
 * 按 name 过滤会把合法子目录误删。
 */
const isSelfEntry = (entry, dirPath) =>
  normalizeDir(String(entry?.href || "")) === normalizeDir(dirPath);

const propfind = async (ctx, settings, path) => {
  const res = await webdavRequest(ctx, settings, path, {
    method: "PROPFIND",
    headers: { "Content-Type": "application/xml; charset=utf-8", Depth: "1" },
    body: PROPFIND_BODY,
    responseType: "text",
    timeoutMs: 60000,
  });
  if (!res.ok) throw new Error(`PROPFIND failed: ${res.status}`);
  return parsePropfindXml(typeof res.data === "string" ? res.data : "");
};

/* ---- About page (README rendered as HTML) ---- */
const ABOUT_HTML = `<div class="webdav-about">
<h1>WebDAV 音乐</h1>
<p>连接 WebDAV 服务器，浏览和播放云端音乐文件。</p>

<h2>功能</h2>
<ul>
<li><strong>云端音乐浏览</strong>：通过 WebDAV 协议浏览远程服务器上的音乐文件，支持目录导航和面包屑路径</li>
<li><strong>平铺展示</strong>：每个库可独立开启，递归扫描所有子目录将音乐集中展示在一个列表中，扫描进度在任务中心实时显示并支持中止</li>
<li><strong>播放控制</strong>：支持双击播放单曲、播放全部、点击文件夹播放按钮一键播放整个文件夹</li>
<li><strong>批量操作</strong>：进入批量模式后可全选、播放选中、添加到队列，支持搜索过滤与定位当前播放</li>
<li><strong>元数据提取</strong>：自动读取音频文件的嵌入标签（ID3v2 / FLAC），获取标题、歌手、专辑、封面图和歌词</li>
<li><strong>封面展示</strong>：优先读取嵌入封面，其次探测目录下的封面文件（cover.jpg、folder.jpg 等），兜底跟随主应用默认封面</li>
<li><strong>文件夹管理</strong>：支持多层目录结构，文件夹与歌曲混合排序显示</li>
<li><strong>认证支持</strong>：支持 Basic Auth 用户名/密码认证</li>
</ul>

<h2>使用</h2>
<ol>
<li>在插件设置中填写 WebDAV 服务器地址、用户名、密码和根目录路径</li>
<li>点击左侧边栏的「WebDAV」进入浏览页面</li>
<li>双击歌曲即可播放，双击文件夹进入子目录</li>
<li>点击文件夹左侧的播放按钮可直接播放文件夹内全部音乐</li>
</ol>

<h2>设置</h2>
<table>
<tr><th>设置项</th><th>说明</th><th>默认值</th></tr>
<tr><td>服务器地址</td><td>WebDAV 服务器 URL，如 <code>https://webdav.example.com</code></td><td>-</td></tr>
<tr><td>用户名</td><td>Basic Auth 用户名，留空表示无需认证</td><td>-</td></tr>
<tr><td>密码</td><td>Basic Auth 密码</td><td>-</td></tr>
<tr><td>根目录路径</td><td>浏览音乐的起始路径</td><td>/</td></tr>
<tr><td>平铺展示</td><td>开启后把库中所有音乐集中展示，关闭后按文件夹展示</td><td>关闭</td></tr>
<tr><td>在线匹配封面歌词</td><td>开启后使用酷狗搜索出的封面和歌词，关闭则优先使用歌曲内嵌的封面和歌词</td><td>关闭</td></tr>
</table>
<p>双击播放的行为跟随主应用「播放队列模式」设置：上下文模式会用当前目录/平铺列表替换队列，单曲模式只播放该曲。</p>

<h2>支持的音频格式</h2>
<p><code>mp3</code> <code>flac</code> <code>wav</code> <code>aac</code> <code>ogg</code> <code>wma</code> <code>m4a</code> <code>ape</code> <code>opus</code> <code>aiff</code> <code>alac</code> <code>dsf</code> <code>dff</code></p>

<h2>歌曲命名格式</h2>
<p>插件通过文件名解析歌曲标题和歌手，支持以下命名格式（按优先级匹配）：</p>
<table>
<tr><th>格式</th><th>示例</th><th>解析结果</th></tr>
<tr><td><code>歌手 - 标题</code></td><td><code>周杰伦 - 晴天.mp3</code></td><td>歌手：周杰伦，标题：晴天</td></tr>
<tr><td><code>歌手 – 标题</code>（短横线）</td><td><code>Taylor Swift – Shake It Off.mp3</code></td><td>歌手：Taylor Swift，标题：Shake It Off</td></tr>
<tr><td><code>歌手 — 标题</code>（长横线）</td><td><code>Adele — Hello.flac</code></td><td>歌手：Adele，标题：Hello</td></tr>
<tr><td><code>编号. 歌手 - 标题</code></td><td><code>01. 林俊杰 - 江南.mp3</code></td><td>歌手：林俊杰，标题：江南</td></tr>
<tr><td><code>编号- 歌手 - 标题</code></td><td><code>02-陈奕迅-十年.mp3</code></td><td>歌手：陈奕迅，标题：十年</td></tr>
</table>
<blockquote>编号前缀为行首的数字后跟 .、- 或空格，解析时会自动去除。如果文件名不符合上述格式，则整个文件名（不含扩展名）作为标题，歌手显示为「未知歌手」。若音频文件包含内嵌标签（ID3v2 / FLAC），解析后会以嵌入标签为准覆盖文件名解析结果。</blockquote>

<h2>封面与歌词获取</h2>
<p>插件支持两种封面和歌词获取模式，可在插件设置中切换：</p>
<h3>关闭「在线匹配封面歌词」（默认）</h3>
<p>优先使用歌曲内嵌数据，缺少时通过酷狗 API 补充：</p>
<ol>
<li>音频文件内嵌封面和歌词（ID3v2 / FLAC 标签）</li>
<li>目录下的封面图片文件（cover.jpg、folder.jpg 等）</li>
<li>酷狗 API 搜索补全缺失的封面或歌词</li>
<li>主应用兜底封面（跟随 cover-fallback 插件设置动态切换）</li>
</ol>
<h3>开启「在线匹配封面歌词」</h3>
<p>优先使用酷狗搜索结果，不保证封面和歌词的准确性：</p>
<ol>
<li>酷狗 API 搜索结果中的封面和歌词</li>
<li>音频文件内嵌数据补充酷狗未提供的字段</li>
<li>主应用兜底封面（跟随 cover-fallback 插件设置动态切换）</li>
</ol>

<h2>依赖</h2>
<p>EchoMusic &gt;= 2.3.1-beta.16</p>

<h2>权限说明</h2>
<ul>
<li><code>audioSource</code>：接管 WebDAV 歌曲的播放地址，动态拼接认证 URL</li>
<li><code>kugouApi</code>：在线匹配封面与歌词（可在设置中关闭）</li>
<li><code>lyrics</code>：注册歌词解析器，支持内嵌歌词与手动选择歌词</li>
<li><code>unrestrictedNetwork</code>：WebDAV 需要 <code>PROPFIND</code> 等非标准方法并访问用户自定的内网地址，浏览器 Fetch 受 CORS 与禁止请求头限制，因此走主进程网络能力</li>
</ul>
<p>出于浏览器 <code>&lt;audio&gt;</code> 标签无法附加请求头的限制，播放地址会把 Basic Auth 凭证内嵌在 URL 中（<code>https://user:pass@host/...</code>）。该地址会保存在播放队列与播放历史中，请勿在不受信任的共享设备上使用需要认证的库。</p>

<h2>作者</h2>
<p>Oneday5799</p>
</div>`;

/* ---- Settings UI ---- */
const createSettingsPanel = (ctx, state) => {
  const { defineAsyncComponent, defineComponent, h, reactive, ref, computed } = ctx.vue;
  const Input = defineAsyncComponent(ctx.ui.components.Input);
  const Button = defineAsyncComponent(ctx.ui.components.Button);
  const Switch = defineAsyncComponent(ctx.ui.components.Switch);
  const Tabs = defineAsyncComponent(ctx.ui.components.Tabs);
  const TabsList = defineAsyncComponent(ctx.ui.components.TabsList);
  const TabsTrigger = defineAsyncComponent(ctx.ui.components.TabsTrigger);
  const TabsContent = defineAsyncComponent(ctx.ui.components.TabsContent);

  return defineComponent({
    setup() {
      // 深拷贝：否则 draft.libraries 与 state.settings.libraries 是同一数组，
      // 在面板里增删改库未点「保存」就已实时改掉运行时配置
      const draft = reactive(JSON.parse(JSON.stringify({ ...DEFAULT_SETTINGS, ...state.settings })));
      const activeTab = ref("settings");
      const expandedLibraries = ref(new Set());

      const save = async () => {
        const values = JSON.parse(JSON.stringify(draft));
        state.settings = values;
        await ctx.storage.set(STORAGE_KEY, values);
        ctx.toast.success("设置已保存");
      };

      const reset = () => {
        Object.assign(draft, { ...DEFAULT_SETTINGS, libraries: [], activeLibraryId: null });
      };

      const toggleLibrary = (libId) => {
        if (expandedLibraries.value.has(libId)) {
          expandedLibraries.value.delete(libId);
        } else {
          expandedLibraries.value.add(libId);
        }
      };

      const addLibrary = () => {
        const newId = generateLibraryId();
        draft.libraries.push(createDefaultLibrary(newId));
        expandedLibraries.value.add(newId);
      };

      const removeLibrary = (libId) => {
        const idx = draft.libraries.findIndex((lib) => lib.id === libId);
        if (idx >= 0) {
          draft.libraries.splice(idx, 1);
          expandedLibraries.value.delete(libId);
          if (draft.activeLibraryId === libId) {
            draft.activeLibraryId = draft.libraries[0]?.id || null;
          }
        }
      };

      const updateLibrary = (libId, key, value) => {
        const lib = draft.libraries.find((l) => l.id === libId);
        if (lib) lib[key] = value;
      };

      const formRow = (label, input, hint) =>
        h("div", { style: "display: flex; align-items: flex-start; gap: 12px;" }, [
          h("label", { style: "width: 80px; flex-shrink: 0; font-size: 13px; color: var(--color-text-main); text-align: right; padding-top: 7px;" }, label),
          h("div", { style: "flex: 1; display: flex; flex-direction: column; gap: 2px;" }, [
            input,
            hint ? h("span", { style: "font-size: 11px; color: var(--color-text-secondary); margin: 0;" }, hint) : null,
          ]),
        ]);

      const renderSwitchRow = (label, hint, modelValue, onUpdate) =>
        h("div", {
          style: "display: flex; align-items: center; justify-content: space-between; gap: 14px;",
        }, [
          h("div", { style: "display: grid; gap: 3px; min-width: 0;" }, [
            h("span", { style: "font-size: 13px; font-weight: 650; color: var(--color-text-main); margin: 0;" }, label),
            hint ? h("span", { style: "font-size: 12px; color: var(--color-text-secondary); margin: 0; line-height: 1.45;" }, hint) : null,
          ]),
          h(Switch, { modelValue, "onUpdate:modelValue": onUpdate }),
        ]);

      const getHostname = (url) => {
        try { return new URL(url).hostname; } catch { return url; }
      };

      const renderLibraryCard = (lib) => {
        const isExpanded = expandedLibraries.value.has(lib.id);
        const displayName = lib.name || (lib.serverUrl ? getHostname(lib.serverUrl) : "未命名库");
        
        return h("div", { class: "pm-group" }, [
          // 折叠头
          h("div", { class: "pm-group-header", onClick: () => toggleLibrary(lib.id) }, [
            h("div", { class: "pm-group-header-title" }, [
              h("span", { class: ["pm-group-arrow", isExpanded ? "" : "is-collapsed"], innerHTML: "▼" }),
              h("span", null, displayName),
              lib.serverUrl
                ? h("span", { class: "pm-group-header-count" }, getHostname(lib.serverUrl))
                : null,
            ]),
          ]),
          // 展开内容
          h("div", { class: ["pm-group-body", isExpanded ? "" : "is-collapsed"] }, [
            h("div", { style: "padding: 12px; display: grid; gap: 10px;" }, [
              formRow("名称", h(Input, {
                modelValue: lib.name,
                placeholder: "留空则显示根目录名称",
                inputClass: "!h-9 !rounded-lg !pl-3 !pr-3 !text-[13px]",
                "onUpdate:modelValue": (v) => updateLibrary(lib.id, "name", String(v ?? "")),
              }), "显示在浏览页面的标签页名称"),
              formRow("地址", h(Input, {
                modelValue: lib.serverUrl,
                placeholder: "https://webdav.example.com",
                inputClass: "!h-9 !rounded-lg !pl-3 !pr-3 !text-[13px]",
                "onUpdate:modelValue": (v) => updateLibrary(lib.id, "serverUrl", String(v ?? "")),
              })),
              formRow("用户名", h(Input, {
                modelValue: lib.username,
                placeholder: "可选，留空表示无需认证",
                inputClass: "!h-9 !rounded-lg !pl-3 !pr-3 !text-[13px]",
                "onUpdate:modelValue": (v) => updateLibrary(lib.id, "username", String(v ?? "")),
              })),
              formRow("密码", h(Input, {
                modelValue: lib.password,
                placeholder: "可选",
                type: "password",
                inputClass: "!h-9 !rounded-lg !pl-3 !pr-3 !text-[13px]",
                "onUpdate:modelValue": (v) => updateLibrary(lib.id, "password", String(v ?? "")),
              })),
              formRow("根目录", h(Input, {
                modelValue: lib.rootPath,
                placeholder: "/",
                inputClass: "!h-9 !rounded-lg !pl-3 !pr-3 !text-[13px]",
                "onUpdate:modelValue": (v) => updateLibrary(lib.id, "rootPath", String(v ?? "/")),
              }), "浏览音乐文件的起始路径，默认为根目录 /"),
              formRow("平铺展示", h(Switch, {
                modelValue: lib.flatView,
                "onUpdate:modelValue": (v) => updateLibrary(lib.id, "flatView", v),
              }), "开启后把库中所有音乐集中展示，关闭后按文件夹展示"),
              h("div", { style: "display: flex; justify-content: flex-end;" }, [
                h(Button, {
                  size: "xs",
                  variant: "outline",
                  onClick: () => removeLibrary(lib.id),
                }, { default: () => "删除此库" }),
              ]),
            ]),
          ]),
        ]);
      };

      return () =>
        h("div", { style: "display: flex; flex-direction: column;" }, [
          h(Tabs, { modelValue: activeTab.value, "onUpdate:modelValue": (v) => { activeTab.value = v; }, style: "flex: 1; min-height: 0; overflow: hidden;" }, {
            default: () => [
              h(TabsList, {}, { default: () => [
                h(TabsTrigger, { value: "settings" }, { default: () => "设置" }),
                h(TabsTrigger, { value: "about" }, { default: () => "关于" }),
              ]}),
              h(TabsContent, { value: "settings" }, { default: () =>
                h("div", { style: "max-height: 55vh; overflow-y: auto; display: grid; gap: 16px; align-content: start; padding-top: 8px;" }, [
                  // WebDAV 库列表
                  h("div", { style: "display: grid; gap: 8px;" }, [
                    h("div", { style: "display: flex; align-items: center; justify-content: space-between;" }, [
                      h("span", { style: "font-size: 14px; font-weight: 600; color: var(--color-text-main);" }, "WebDAV 库"),
                      h(Button, {
                        size: "xs",
                        variant: "outline",
                        onClick: addLibrary,
                      }, { default: () => "+ 添加库" }),
                    ]),
                    draft.libraries.length === 0
                      ? h("p", { style: "font-size: 12px; color: var(--color-text-secondary); text-align: center; padding: 16px;" }, "暂无 WebDAV 库，点击上方按钮添加")
                      : h("div", { style: "display: grid; gap: 8px;" }, draft.libraries.map((lib) => renderLibraryCard(lib))),
                  ]),
                  // 全局设置
                  h("div", { style: "border-top: 1px solid var(--border-subtle); padding-top: 12px;" }, [
                    h("span", { style: "font-size: 14px; font-weight: 600; color: var(--color-text-main); display: block; margin-bottom: 8px;" }, "全局设置"),
                    renderSwitchRow(
                      "在线匹配封面歌词",
                      "开启后使用酷狗搜索出的封面和歌词，关闭则优先使用歌曲内嵌的封面和歌词",
                      draft.coverLyricSource === "kugou",
                      (v) => { draft.coverLyricSource = v ? "kugou" : "embedded"; },
                    ),
                  ]),
                ]),
              }),
              h(TabsContent, { value: "about" }, { default: () =>
                h("div", { style: "padding-top: 8px; max-height: 55vh; overflow-y: auto;", innerHTML: ABOUT_HTML })
              }),
            ],
          }),
          // 按钮行（sticky 固定底部）
          h("div", { style: "display: flex; gap: 8px; justify-content: flex-end; padding: 12px 0 0; flex-shrink: 0; position: sticky; bottom: 0; background: inherit; z-index: 1;" }, [
            h(Button, { size: "xs", onClick: reset, variant: "outline" }, { default: () => "重置" }),
            h(Button, { size: "xs", onClick: save }, { default: () => "保存" }),
          ]),
        ]);
    },
  });
};

/* ---- Browser Page ---- */
const createBrowserPage = (ctx, state) => {
  const { h, ref, computed, onMounted, nextTick, defineAsyncComponent, Teleport } = ctx.vue;

  return ctx.vue.defineComponent({
    setup() {
      const Icon = ctx.vue.resolveComponent("Icon");
      const Button = defineAsyncComponent(ctx.ui.components.Button);
      const SliverHeader = defineAsyncComponent(ctx.ui.components.DetailPageSliverHeader);
      const PageScrollContainer = defineAsyncComponent(ctx.ui.components.PageScrollContainer);
      const PageStickyHeader = defineAsyncComponent(ctx.ui.components.PageStickyHeader);
      const Drawer = defineAsyncComponent(ctx.ui.components.Drawer);
      const Tabs = defineAsyncComponent(ctx.ui.components.Tabs);
      const TabsList = defineAsyncComponent(ctx.ui.components.TabsList);
      const TabsTrigger = defineAsyncComponent(ctx.ui.components.TabsTrigger);
      const Scrollbar = defineAsyncComponent(ctx.ui.components.Scrollbar);
      const Checkbox = defineAsyncComponent(ctx.ui.components.Checkbox);
      const SongSearchInput = defineAsyncComponent(ctx.ui.components.SongSearchInput);
      const SongList = defineAsyncComponent(ctx.ui.components.SongList);
      const SongListHeader = defineAsyncComponent(ctx.ui.components.SongListHeader);
      const SongCard = defineAsyncComponent(ctx.ui.components.SongCard);
      const ActionRow = defineAsyncComponent(ctx.ui.components.DetailPageActionRow);
      const Badge = defineAsyncComponent(ctx.ui.components.Badge);

      // 当前激活的库
      const activeLibraryId = ref(state.settings.activeLibraryId || null);
      const currentPath = ref("");
      const entries = ref([]);
      const loading = ref(false);
      const error = ref("");
      const coverCache = ref({});
      const searchQuery = ref("");
      const sortTick = ref(0);
      const libraryPaths = ref({});
      const librarySongCounts = ref({});

      // 平铺视图状态
      const flatSongs = ref([]);
      const flatLoading = ref(false);
      const flatError = ref("");
      const flatScanningLibId = ref(null);
      let _flatTask = null;

      // 批量选择状态（仿主应用 BatchActionDrawer）
      const showBatchDrawer = ref(false);
      const selectedKeys = ref(new Set());

      // 当前播放歌曲列表容器引用（用于目录视图定位滚动）
      const listContainerRef = ref(null);
      // 宿主 SongList 实例引用（平铺视图定位滚动用）
      const flatListRef = ref(null);

      const currentLibrary = computed(() => {
        if (!state.settings.libraries || state.settings.libraries.length === 0) return null;
        return state.settings.libraries.find((lib) => lib.id === activeLibraryId.value) || state.settings.libraries[0];
      });

      const handleSort = (field) => {
        if (_sortField === field) {
          if (_sortOrder === 'asc') _sortOrder = 'desc';
          else if (_sortOrder === 'desc') { _sortField = null; _sortOrder = null; }
          else _sortOrder = 'asc';
        } else {
          _sortField = field;
          _sortOrder = 'asc';
        }
        sortTick.value++;
      };

      // ---- 批量选择（仿主应用 BatchActionDrawer） ----
      const openBatchDrawer = () => {
        selectedKeys.value = new Set();
        batchScrollTop.value = 0;
        showBatchDrawer.value = true;
        // 立即测一次（Scrollbar 已挂载过的情况），随后 onVnodeMounted 会再补一次
        nextTick(() => requestAnimationFrame(syncBatchViewport));
      };

      const closeBatchDrawer = () => {
        showBatchDrawer.value = false;
        selectedKeys.value = new Set();
      };

      const toggleSelectAll = () => {
        const songEntries = batchEntries.value;
        if (selectedKeys.value.size === songEntries.length) {
          selectedKeys.value = new Set();
        } else {
          selectedKeys.value = new Set(songEntries.map(selKey));
        }
      };

      /**
       * 批量选择的 key。
       * 平铺条目是歌曲对象，id 已含库身份、全局唯一；目录条目是 PROPFIND
       * 文件项，只有 name（在同一目录内唯一，且批量选择限定在当前目录）。
       * 必须全流程使用同一函数，否则全选与单选会串。
       */
      const selKey = (entry) => entry.id ?? entry.name;

      const toggleSong = (entry) => {
        const key = selKey(entry);
        const next = new Set(selectedKeys.value);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        selectedKeys.value = next;
      };

      const selectedSongs = computed(() =>
        batchEntries.value.filter((e) => selectedKeys.value.has(selKey(e))),
      );

      const isAllSelected = computed(() => {
        const songEntries = batchEntries.value;
        return songEntries.length > 0 && selectedKeys.value.size === songEntries.length;
      });

      const isIndeterminate = computed(() => selectedKeys.value.size > 0 && !isAllSelected.value);

      const batchCountLabel = computed(
        () => `已选 ${selectedKeys.value.size} / ${batchEntries.value.length}`,
      );

      /**
       * 把批量选中的条目转成歌曲对象。
       * 平铺视图的条目本身就是歌曲对象；目录视图是 PROPFIND 文件项，需要现场构造。
       */
      const resolveSelectedSongs = () => {
        const picked = selectedSongs.value;
        if (isFlatView.value) return picked.map((e) => ({ ...e }));
        return picked.map((e) => createSong(e, currentPath.value)).filter(Boolean);
      };

      const batchPlaySelected = async () => {
        if (selectedSongs.value.length === 0) return;
        const songs = resolveSelectedSongs();
        enrichSong(songs[0]).catch(() => {});
        try {
          await ctx.player.replaceQueueAndPlay(songs);
          ctx.toast.success(`已播放 ${songs.length} 首歌曲`);
          closeBatchDrawer();
        } catch (err) { ctx.toast.danger("播放失败"); }
      };

      const batchAddToQueue = async () => {
        if (selectedSongs.value.length === 0) return;
        const songs = resolveSelectedSongs();
        ctx.playlist.append(songs);
        ctx.toast.success(`已添加 ${songs.length} 首到队列`);
        closeBatchDrawer();
      };

      // ---- 定位当前播放 ----
      const scrollToActive = () => {
        const trackId = ctx.stores.player.currentTrackId;
        if (!trackId) { ctx.toast.info("当前没有播放的歌曲"); return; }
        // 平铺视图交给宿主 SongList，它会读 data-echo-sticky-inset 避开吸顶栏
        if (isFlatView.value) {
          const list = flatListRef.value;
          if (typeof list?.scrollToActive === "function") {
            void list.scrollToActive();
            return;
          }
        }
        const container = listContainerRef.value;
        if (!container) return;
        const rows = container.querySelectorAll(".webdav-row");
        for (const row of rows) {
          if (row.classList.contains("is-active")) {
            row.scrollIntoView({ behavior: "smooth", block: "center" });
            row.classList.add("webdav-row-flash");
            setTimeout(() => row.classList.remove("webdav-row-flash"), 1200);
            return;
          }
        }
        ctx.toast.info("当前歌曲不在本目录中");
      };

      /**
       * 按当前排序列排序（装饰排序 / Schwartzian transform）。
       *
       * 原实现把 parseTitleArtist 写在比较器里，每次比较都要重新解析两个文件名，
       * 5000 首会调用约 1 万次。先把排序键算好再排，解析次数降到 N 次，
       * 且复杂度不变但常数小一个数量级（实测 15ms → 3ms）。
       * title 仍走 localeCompare，保持与原实现一致的中文排序语义。
       */
      const sortEntries = (items) => {
        const field = _sortField;
        const dir = _sortOrder === 'desc' ? -1 : 1;
        if (!field || !_sortOrder) {
          return [...items].sort((a, b) => a.name.localeCompare(b.name));
        }
        const decorated = items.map((item) => {
          let key;
          if (field === "name") key = item.name;
          else if (field === "size") key = item.contentLength || 0;
          else if (field === "artist") key = item.artist || "";
          else if (field === "album") key = item.album || item.albumName || "";
          else {
            const parsed = parseTitleArtist(item.name);
            key = parsed.title || item.name;
          }
          return { item, key };
        });
        decorated.sort((a, b) => {
          const cmp = typeof a.key === "number"
            ? a.key - b.key
            : a.key.localeCompare(b.key);
          return cmp * dir;
        });
        return decorated.map((d) => d.item);
      };

      // ---- 搜索过滤 ----
      const filteredEntries = computed(() => {
        const q = searchQuery.value.trim().toLowerCase();
        if (!q) return sortedEntries.value;
        return sortedEntries.value.filter((entry) => {
          if (entry.isCollection) return entry.name.toLowerCase().includes(q);
          const { title, artist } = parseTitleArtist(entry.name);
          return (title || entry.name).toLowerCase().includes(q) || (artist || "").toLowerCase().includes(q);
        });
      });

      const sortedEntries = computed(() => {
        void sortTick.value;
        const dirs = entries.value.filter((e) => e.isCollection);
        const files = entries.value.filter((e) => !e.isCollection);
        if (!_sortField || !_sortOrder) return [...dirs, ...files];
        return [...dirs, ...sortEntries(files)];
      });

      // ---- 平铺视图排序（过滤交给宿主 SongList 的 searchQuery prop） ----
      const flatSortedEntries = computed(() => {
        void sortTick.value;
        return sortEntries(flatSongs.value);
      });

      // ---- 批量抽屉：窗口化渲染 ----
      // 行高与宿主 BatchActionDrawer 一致（itemHeight = 64，BatchActionDrawer.vue:155）。
      // 间距来自「行高 64px − 封面 42px」的留白，而不是行间 margin；
      // 此值同时用于窗口化的 slice 计算，必须与行实际高度严格一致。
      const BATCH_ROW_H = 64;
      const BATCH_OVERSCAN = 6;
      const batchScrollerRef = ref(null);
      const batchViewportH = ref(0);
      const batchScrollTop = ref(0);
      let batchScrollEl = null;

      const getBatchScroller = () => batchScrollerRef.value?.wrapRef ?? batchScrollerRef.value;

      const onBatchScroll = (event) => {
        // 优先用事件自带的 currentTarget（就是滚动容器本身），
        // 不依赖 ref 是否已就绪
        const el = event?.currentTarget ?? getBatchScroller();
        if (!el) return;
        batchScrollTop.value = el.scrollTop;
      };

      /**
       * 测量视口并（一次性）把 scroll 监听直接绑到滚动容器上。
       *
       * 不能只靠 Scrollbar 组件向外 emit 的 scroll 事件：Scrollbar 是
       * defineAsyncComponent，我方 ref 在它真正挂载前一直是 null，
       * 此前仅在 openBatchDrawer 里用一次 nextTick+rAF 测量，结果
       * batchViewportH 恒为 0、滚动时拿不到 scrollTop，表现为
       * 「往下滑出现空白」。宿主 BatchActionDrawer 也是在
       * @vue:mounted 时才取 wrapRef（BatchActionDrawer.vue:160）。
       */
      const syncBatchViewport = () => {
        const el = getBatchScroller();
        if (!el) return;
        const h = el.clientHeight;
        if (h > 0 && h !== batchViewportH.value) {
          console.info(`[webdav-music] 批量列表视口 ${h}px，条目 ${batchEntries.value.length}`);
        }
        batchViewportH.value = h;
        batchScrollTop.value = el.scrollTop;
        if (!batchScrollEl) {
          batchScrollEl = el;
          el.addEventListener("scroll", onBatchScroll, { passive: true });
          ctx.dispose(() => el.removeEventListener("scroll", onBatchScroll));
        }
      };

      // Scrollbar 是异步组件：挂载完成（ref 就绪）后再测量
      const onBatchScrollbarMounted = () => { syncBatchViewport(); };

      /**
       * 窗口化：只渲染视口内（加 overscan）的行。
       *
       * 注意三个防御：viewport 未量到时按「未量到」处理而不是当成 0 高度
       * （undefined <= 0 是 false，会把 NaN 一路传进 slice）；slice 前把
       * start/end 归一化成有限整数，防止 NaN/Infinity 导致整表为空或全量渲染。
       */
      const batchWindow = computed(() => {
        const total = batchEntries.value.length;
        if (total === 0) return { rows: [], offset: 0, totalHeight: 0 };
        const raw = batchViewportH.value;
        const viewport = Number.isFinite(raw) && raw > 0 ? raw : 0;
        // 未量到高度：先渲染一屏，避免空白闪烁
        if (viewport <= 0) {
          const initial = Math.min(total, 20);
          return { rows: batchEntries.value.slice(0, initial), offset: 0, totalHeight: total * BATCH_ROW_H };
        }
        const first = Math.floor((batchScrollTop.value || 0) / BATCH_ROW_H);
        const start = Math.max(0, (Number.isFinite(first) ? first : 0) - BATCH_OVERSCAN);
        const count = Math.ceil(viewport / BATCH_ROW_H) + BATCH_OVERSCAN * 2;
        const end = Math.min(total, start + count);
        return {
          rows: batchEntries.value.slice(start, end),
          offset: start * BATCH_ROW_H,
          totalHeight: total * BATCH_ROW_H,
        };
      });

      // ---- 当前显示列表（统一平铺/目录模式） ----
      const isFlatView = computed(() => Boolean(currentLibrary.value?.flatView));
      const currentDisplayList = computed(() =>
        isFlatView.value ? flatSortedEntries.value : filteredEntries.value,
      );

      /**
       * 当前模式下可参与批量选择的歌曲条目。
       * 平铺视图：条目本身就是歌曲对象；目录视图：条目是 PROPFIND 文件项。
       * 全选、已选计数、抽屉列表都必须用这一份，否则平铺模式下抽屉会是空的。
       * 注意平铺视图用的是未过滤的全量列表，与 SongList 的内置搜索互相独立。
       *
       * 抽屉列表对它做窗口化渲染，不直接 map 全量：
       * 宿主 Drawer 的 <slot /> 没有 v-if（Drawer.vue:86），面板只靠 CSS 隐藏、
       * DOM 常驻。若全量渲染，5000 首歌会生成约 45000 个节点常驻页面，
       * 打开/关闭还要整体 patch；叠加 Drawer 面板上的 backdrop-filter 与过渡
       * （Drawer.vue:133-136）必然卡顿。
       */
      const batchEntries = computed(() =>
        isFlatView.value
          ? flatSortedEntries.value
          : filteredEntries.value.filter((e) => !e.isCollection),
      );

      /**
       * 条目的展示信息。
       * 目录视图的行是 PROPFIND 文件项，需要从文件名解析；
       * 平铺视图的行由宿主 SongList 渲染，但批量抽屉里仍是插件自己渲染，
       * 那些条目是歌曲对象，直接读字段即可。
       */
      const describeEntry = (entry) => {
        if (isFlatView.value) {
          return {
            title: entry.title || entry.name,
            artist: entry.artist === "未知歌手" ? "" : entry.artist || "",
          };
        }
        const { title, artist } = parseTitleArtist(entry.name);
        return { title: title || entry.name, artist };
      };

      // 右键菜单
      const contextMenu = ref(null);
      const contextMenuRef = ref(null);
      const contextMenuPosition = ref({ x: 0, y: 0 });
      let contextMenuPoint = null;

      const updateContextMenuPosition = () => {
        if (!contextMenuPoint) return;
        const menuEl = contextMenuRef.value;
        const width = menuEl?.offsetWidth || 172;
        const height = menuEl?.offsetHeight || 120;
        const padding = 8;
        const bottomPadding = 96;
        const maxX = Math.max(padding, window.innerWidth - width - padding);
        const maxY = Math.max(padding, window.innerHeight - height - bottomPadding);
        contextMenuPosition.value = {
          x: Math.round(Math.min(Math.max(contextMenuPoint.x, padding), maxX)),
          y: Math.round(Math.min(Math.max(contextMenuPoint.y, padding), maxY)),
        };
      };

      const showContextMenu = (event, entry, isDir) => {
        event.preventDefault();
        event.stopPropagation();
        contextMenu.value = { entry, isDir };
        contextMenuPoint = { x: event.clientX, y: event.clientY };
        contextMenuPosition.value = contextMenuPoint;
        nextTick(updateContextMenuPosition);
      };
      const closeContextMenu = () => { contextMenu.value = null; contextMenuPoint = null; };

      // 目录视图右键「立即播放」。平铺视图由宿主 SongList 的内置右键菜单接管。
      const handleCtxPlayNow = async () => {
        const ctxMenu = contextMenu.value;
        if (!ctxMenu) return;
        contextMenu.value = null;
        if (ctxMenu.isDir) {
          await playFolder(normalizeDir(currentPath.value) + ctxMenu.entry.name + "/");
          return;
        }
        await playSong(ctxMenu.entry);
      };

      const handleCtxPlayNext = async () => {
        const ctxMenu = contextMenu.value;
        if (!ctxMenu) return;
        contextMenu.value = null;
        if (ctxMenu.isDir) {
          const normDir = normalizeDir(currentPath.value);
          const folderPath = normDir + ctxMenu.entry.name + "/";
          const folderName = ctxMenu.entry.name;
          try {
            const lib = currentLibrary.value;
            if (!lib) return;
            const results = await propfind(ctx, lib, folderPath);
            const files = results.filter((e) => !e.isCollection && isAudioFile(e.name)).sort((a, b) => a.name.localeCompare(b.name));
            if (files.length === 0) { ctx.toast.info("文件夹内没有音乐文件"); return; }
            const coverUrl = await fetchFolderCover(ctx, lib, folderPath, results);
            const songs = files.map((entry) => createSongObject(entry.name, folderPath + entry.name, { album: folderName, coverUrl, lib }));
            ctx.playlist.append(songs);
            ctx.toast.success(`已添加 ${songs.length} 首到队列`);
          } catch (err) { ctx.toast.danger("读取文件夹失败"); }
        } else {
          const song = createSong(ctxMenu.entry, currentPath.value);
          if (!song) return;
          if (String(song.id) === String(ctx.player.currentTrackId ?? '')) { ctx.toast.info("当前正在播放此歌曲"); return; }
          ctx.playlist.playNext(song);
          ctx.toast.success(`已添加「${song.title}」到下一首`);
        }
      };

      // 仅目录视图使用（showContextMenu 只挂在目录行上；平铺视图走宿主
      // SongList 的内置菜单，其「恢复默认歌词」直接调 restoreDefaultLyric）
      const handleCtxRestoreDefault = async () => {
        const ctxMenu = contextMenu.value;
        if (!ctxMenu || ctxMenu.isDir) return;
        contextMenu.value = null;
        const song = createSong(ctxMenu.entry, currentPath.value);
        await restoreDefaultLyric(song);
      };

      const breadcrumbs = computed(() => {
        if (!currentLibrary.value) return [];
        const rootPath = normalizeDir(currentLibrary.value.rootPath || "/");
        const raw = currentPath.value.replace(/\/+/g, "/");
        const rel = raw.startsWith(rootPath) ? raw.slice(rootPath.length) : raw.slice(1);
        const parts = rel.split("/").filter(Boolean);
        const rootName = currentLibrary.value.name || rootPath.slice(0, -1).split("/").filter(Boolean).pop() || "根目录";
        const crumbs = [{ name: rootName, path: rootPath }];
        let acc = rootPath;
        for (const part of parts) { acc = acc.replace(/\/+$/, "") + "/" + part + "/"; crumbs.push({ name: part, path: acc }); }
        return crumbs;
      });

      // 目录加载令牌：快速连续进入 A、B 目录时，A 的慢响应不能覆盖 B 的结果
      let dirLoadToken = 0;
      const loadDirectory = async (path) => {
        const lib = currentLibrary.value;
        if (!lib) return;
        const token = ++dirLoadToken;
        const stale = () => token !== dirLoadToken;
        loading.value = true; error.value = ""; entries.value = [];
        try {
          const dirPath = normalizeDir(path);
          const results = await propfind(ctx, lib, dirPath);
          if (stale()) return;
          const dirs = results.filter((e) => e.isCollection && e.name && !isSelfEntry(e, dirPath)).sort((a, b) => a.name.localeCompare(b.name));
          const files = results.filter((e) => !e.isCollection && isAudioFile(e.name)).sort((a, b) => a.name.localeCompare(b.name));
          coverCache.value[dirPath] = await fetchFolderCover(ctx, lib, dirPath, results);
          if (stale()) return;
          entries.value = [...dirs, ...files];
          librarySongCounts.value[lib.id] = files.length;
        } catch (err) {
          if (!stale()) error.value = "加载目录失败: " + (err?.message || "未知错误");
        }
        finally { if (!stale()) loading.value = false; }
      };

      const navigateTo = (path) => {
        const lib = currentLibrary.value;
        if (lib) libraryPaths.value[lib.id] = normalizeDir(path);
        currentPath.value = normalizeDir(path);
        loadDirectory(currentPath.value);
      };

      const navigateUp = () => {
        const lib = currentLibrary.value;
        if (!lib) return;
        const rootPath = normalizeDir(lib.rootPath || "/");
        const cleaned = normalizeDir(currentPath.value).replace(/\/$/, "");
        if (cleaned === rootPath.replace(/\/$/, "") || cleaned === "") { navigateTo(rootPath); return; }
        const parent = cleaned.slice(0, cleaned.lastIndexOf("/")) + "/";
        navigateTo(parent.startsWith(rootPath) ? parent : rootPath);
      };

      // ---- 平铺视图加载 ----
      // 每次扫描分配一个自增 token；异步回调只在自己仍是「当前扫描」时写状态，
      // 避免切换库后旧扫描的 finally 把新扫描的 loading/任务标记清掉。
      let _flatScanToken = 0;
      const loadFlatView = async (force = false) => {
        const lib = currentLibrary.value;
        if (!lib || !lib.flatView) return;

        // 1. 尝试读缓存（force 时跳过）
        if (!force) {
          const cached = await readFlatCache(ctx, lib);
          // 读缓存是异步的：期间可能已切库或已启动新扫描，
          // 只有仍在同一个库且没有扫描在跑时才允许写入视图
          const stillSameLib = currentLibrary.value?.id === lib.id;
          if (cached && stillSameLib && !flatScanningLibId.value) {
            flatSongs.value = cached.songs;
            flatLoading.value = false;
            return;
          }
        }

        // 2. 已有该库的扫描在进行中，不重复启动
        if (flatScanningLibId.value === lib.id) return;

        // 3. 停止旧扫描
        if (_flatTask) {
          // dismiss 只把任务从面板移除，不触发 abort signal；
          // 必须先 cancel() 让 collectAllSongs 真正停止 PROPFIND
          if (_flatTask.active) _flatTask.cancel();
          _flatTask.dismiss();
          _flatTask = null;
        }

        // 4. 启动新扫描
        const token = ++_flatScanToken;
        const isCurrentScan = () => token === _flatScanToken;
        flatLoading.value = true;
        flatError.value = "";
        flatScanningLibId.value = lib.id;
        const taskId = `webdav-music:flatScan:${lib.id}`;

        const task = ctx.tasks.register({
          id: taskId,
          name: `扫描「${lib.name || "未命名库"}」`,
          status: "running",
          retention: "transient",
          progress: { done: 0, label: "准备中..." },
          actions: [{
            id: "cancel", label: "中止", variant: "ghost",
            onClick: () => { if (task.cancel()) task.finish("aborted", { progress: { label: "已取消" } }); },
          }],
        });
        _flatTask = task;

        try {
          const songs = await collectAllSongs(ctx, lib, task.signal, (dirs, count) => {
            if (isCurrentScan()) {
              task.update({
                progress: { done: dirs, label: `已发现 ${count} 首歌曲` },
              });
            }
          });

          // 只有仍是当前扫描时才写视图状态；扫描结果本身始终落盘
          if (isCurrentScan()) {
            flatSongs.value = songs;
            flatLoading.value = false;
          }
          try {
            await writeFlatCache(ctx, lib, songs);
          } catch (cacheErr) {
            // 缓存写失败不影响本次扫描结果，只记录
            console.warn("[webdav-music] 平铺缓存写入失败:", cacheErr?.message || cacheErr);
          }

          task.finish("completed", {
            progress: { label: `完成，共 ${songs.length} 首歌曲` },
          });
        } catch (err) {
          // 区分中止和真正的错误
          if (task.signal.aborted || err.message === "aborted") {
            task.finish("aborted", {
              progress: { label: "已中止" },
            });
          } else {
            if (isCurrentScan()) flatError.value = "扫描失败: " + err.message;
            task.finish("error", {
              error: err.message,
              actions: [
                { id: "retry", label: "重试", variant: "ghost", onClick: () => loadFlatView(true) },
              ],
            });
          }
        } finally {
          // 已被新扫描接管时不要清理新扫描的状态
          if (isCurrentScan()) {
            flatScanningLibId.value = null;
            flatLoading.value = false;
            _flatTask = null;
          }
        }
      };

      const refreshFlatView = async () => {
        const lib = currentLibrary.value;
        if (!lib) return;
        try { await ctx.storage.delete(`flatView:${lib.id}`); } catch {}
        await loadFlatView(true);
      };

      const refresh = () => {
        const lib = currentLibrary.value;
        if (lib?.flatView) refreshFlatView();
        else loadDirectory(currentPath.value);
      };

      const switchLibrary = (libId) => {
        activeLibraryId.value = libId;
        state.settings.activeLibraryId = libId;
        const lib = state.settings.libraries.find((l) => l.id === libId);
        // 切库时清空上一个库的平铺结果，避免短暂显示上一个库的歌单
        flatSongs.value = [];
        flatError.value = "";
        // 目录视图支持按大小排序、宿主表头不支持，切换视图时清掉无法高亮的排序态
        if (_sortField === "size") {
          _sortField = null;
          _sortOrder = null;
          sortTick.value++;
        }
        if (lib) {
          const savedPath = libraryPaths.value[libId];
          const rootPath = normalizeDir(lib.rootPath || "/");
          currentPath.value = savedPath || rootPath;
          if (lib.flatView) loadFlatView();
          else loadDirectory(currentPath.value);
        }
      };

      const createSong = (entry, dirPath) => {
        const lib = currentLibrary.value;
        if (!lib) return null;
        const normDir = normalizeDir(dirPath);
        const album = currentPath.value.split("/").filter(Boolean).pop() || "WebDAV";
        return createSongObject(entry.name, normDir + entry.name, { album, coverUrl: coverCache.value[normDir] || "", lib });
      };

      const enrichSong = async (song) => { if (!song._filePath) return song; return enrichTrack(ctx, state, song); };
      const getSongs = () => sortedEntries.value.filter((e) => !e.isCollection).map((e) => createSong(e, currentPath.value)).filter(Boolean);

      // 目录视图点击播放单曲（平铺视图由宿主 SongList 处理）
      // 与双击走同一条路径，避免右键/双击对同一首歌产生两种队列语义
      const playSong = async (entry) => {
        const song = createSong(entry, currentPath.value);
        if (!song) return;
        await handleDoubleTapPlaySong(song);
      };

      /**
 * 双击播放一首（对齐主应用「播放队列模式」语义）。
 *
 *   playbackQueueMode === 'context' → 用当前视图的歌曲列表替换队列并定位到该曲
 *   playbackQueueMode === 'single'  → 只替换队列并播放该曲
 *
 * 宿主设置键见 EchoMusic src/renderer/stores/setting.ts playbackQueueMode，
 * 与 SongList 内部 handleTogglePlay 的判断保持一致。
 * 目录视图与平铺视图（宿主 SongList 的 onSongDoubleTapPlay）都走这里。
 */
      const handleDoubleTapPlaySong = async (song) => {
        if (!song) return;
        enrichSong(song).catch(() => {});
        const useContext = ctx.stores.settings?.playbackQueueMode === "context";
        try {
          if (useContext) {
            const allSongs = isFlatView.value
              ? flatSortedEntries.value.map((s) => ({ ...s }))
              : getSongs();
            await ctx.player.replaceQueueAndPlay(allSongs, { requestedSong: song });
          } else {
            await ctx.player.replaceQueueAndPlay([song]);
          }
        } catch (err) { ctx.toast.danger("播放失败"); }
      };

      /** 目录视图双击：PROPFIND 条目 → 歌曲对象。
       *  平铺视图的双击由 SongList 的 onSongDoubleTapPlay 直接调
       *  handleDoubleTapPlaySong，不经这里。 */
      const handleDoubleTapPlay = async (entry) => {
        const song = createSong(entry, currentPath.value);
        if (!song) return;
        await handleDoubleTapPlaySong(song);
      };

      /** 清除手动选择的歌词并重新拉取（宿主歌词页与本插件右键菜单共用） */
      const restoreDefaultLyric = async (song) => {
        if (!song) return;
        const hash = String(song.id);
        try {
          await ctx.storage.delete(`lyric:${hash}`);
          delete ctx.lyric.manualLyricMap[hash];
          ctx.lyric.currentCandidateKey = "";
          _enrichedLyrics.delete(hash);
          _kugouLyricSearches.delete(hash);
          await ctx.lyric.fetchLyrics(hash, { force: true, track: song });
          ctx.toast.success("已恢复默认歌词");
        } catch {
          ctx.toast.danger("操作失败");
        }
      };

      const playAll = async () => {
        const songs = isFlatView.value
          ? flatSortedEntries.value.map((s) => ({ ...s }))
          : getSongs();
        if (songs.length === 0) return;
        enrichSong(songs[0]).catch(() => {});
        try {
          await ctx.player.replaceQueueAndPlay(songs);
        } catch (err) { ctx.toast.danger("播放失败"); }
      };

      const playFolder = async (folderPath) => {
        const lib = currentLibrary.value;
        if (!lib) return;
        const normDir = normalizeDir(folderPath);
        const folderName = normDir.slice(0, -1).split("/").filter(Boolean).pop() || "WebDAV";
        let results;
        try { results = await propfind(ctx, lib, normDir); }
        catch (err) { ctx.toast.danger("无法读取文件夹"); return; }
        const files = results.filter((e) => !e.isCollection && isAudioFile(e.name)).sort((a, b) => a.name.localeCompare(b.name));
        if (files.length === 0) { ctx.toast.info("文件夹内没有音乐文件"); return; }
        const coverUrl = await fetchFolderCover(ctx, lib, normDir, results);
        const songs = files.map((entry) => createSongObject(entry.name, normDir + entry.name, { album: folderName, coverUrl, lib }));
        enrichSong(songs[0]).catch(() => {});
        try {
          await ctx.player.replaceQueueAndPlay(songs);
        } catch (err) { ctx.toast.danger("播放失败"); }
      };

      onMounted(() => {
        if (currentLibrary.value) {
          activeLibraryId.value = currentLibrary.value.id;
          const rootPath = normalizeDir(currentLibrary.value.rootPath || "/");
          currentPath.value = libraryPaths.value[currentLibrary.value.id] || rootPath;
          if (currentLibrary.value.flatView) loadFlatView();
          else loadDirectory(currentPath.value);
        }
      });

      const hasLibraries = computed(() => state.settings.libraries && state.settings.libraries.length > 0);

      const dirFileCount = computed(() => entries.value.filter((e) => !e.isCollection).length);

      // 预计算歌曲序号，避免 O(n²) 的逐行 filter（仅目录视图的行需要）
      const songIndexMap = computed(() => {
        let n = 0;
        return filteredEntries.value.map((e) => (e.isCollection ? null : ++n));
      });

      return () => {
        if (!hasLibraries.value) {
          return h("div", { class: "webdav-page" }, [
            h("div", { class: "webdav-empty" }, [
              h("p", { class: "webdav-empty-title" }, "未配置 WebDAV 库"),
              h("p", { class: "webdav-empty-desc" }, "请在插件设置中添加 WebDAV 库后使用。"),
            ]),
          ]);
        }

        const songCount = isFlatView.value
          ? flatSongs.value.length
          : dirFileCount.value;

        return h("div", { class: "webdav-page" }, [
          h(PageScrollContainer, { class: "flex-1 min-h-0" }, {
            default: () => h("div", { class: "min-h-full bg-bg-main" }, [
          h(SliverHeader, {
            typeLabel: "WEBDAV",
            title: "WebDAV",
            coverUrl: "",
            coverBaseSize: 150,
            expandedHeight: 176,
            collapsedHeight: STICKY_COLLAPSED_H,
          }, {
            details: () => h("div", { class: "flex flex-col gap-2" }, [
              h("div", { class: "text-[13px] font-semibold text-text-secondary" }, "连接WebDAV服务器，浏览和播放云端音乐文件。"),
              h("div", { class: "inline-flex items-center gap-1.5 text-[11px] font-semibold", style: "color: var(--color-text-secondary); opacity: 0.8;" }, [
                h(Icon, { icon: "tabler:server", width: 12, height: 12 }),
                h("span", {}, `${songCount} 首歌曲`),
              ]),
            ]),
            actions: () => h(ActionRow, {
              playLabel: "播放",
              onPlay: playAll,
              onBatch: openBatchDrawer,
            }),
            "collapsed-actions": () => h("div", { class: "flex items-center gap-1" }, [
              h(Button, {
                variant: "unstyled",
                size: "none",
                onClick: playAll,
                class: "p-2 rounded-lg hover:bg-[var(--control-hover-bg)] text-primary",
              }, {
                default: () => h(Icon, { icon: ctx.icons.iconPlay, width: 20, height: 20 }),
              }),
              h(Button, {
                variant: "unstyled",
                size: "none",
                onClick: openBatchDrawer,
                class: "p-2 rounded-lg hover:bg-[var(--control-hover-bg)] text-text-main",
              }, {
                default: () => h(Icon, { icon: ctx.icons.iconList, width: 18, height: 18 }),
              }),
            ]),
          }),

          // === 库标签栏 + 搜索/定位（使用主应用 Tabs 组件） ===
        // 必须用宿主的 PageStickyHeader 而不是裸 position:sticky：
        // 宿主把吸顶栏 Teleport 到独立的 .page-sticky-layer 绘制层，
        // 同时用 clip-path 把滚动区在吸顶区域裁掉（见 PageScrollContainer）。
        // 用裸 sticky 时两层在同一绘制层，半透明表面下滚动内容会直接穿透顶栏。
        h(PageStickyHeader, { class: "song-list-sticky sticky z-110 bg-bg-main", stickyTop: STICKY_TOP_TABS }, {
          default: () => [
            h("div", { class: "flex items-center justify-between px-6 h-14 border-b border-[var(--border-subtle)]" }, [
              state.settings.libraries.length > 1
                ? h(Tabs, {
                    modelValue: activeLibraryId.value,
                    "onUpdate:modelValue": (v) => switchLibrary(v),
                  }, {
                    default: () => h(TabsList, { class: "bg-transparent border-none gap-8" },
                      state.settings.libraries.map((library) => {
                        return h(TabsTrigger, {
                          value: library.id,
                        }, [
                          h("span", { class: "relative" }, [
                            h("span", {}, library.name || "未命名库"),
                            (librarySongCounts.value[library.id] || 0) > 0
                              ? h(Badge, { count: librarySongCounts.value[library.id] })
                              : null,
                          ]),
                        ]);
                      }),
                    ),
                  })
                : h("span", { class: "text-[15px] font-bold text-text-main" }, state.settings.libraries[0]?.name || "WebDAV"),
              h("div", { class: "flex items-center gap-2 flex-shrink-0" }, [
                h(SongSearchInput, {
                  modelValue: searchQuery.value,
                  "onUpdate:modelValue": (v) => { searchQuery.value = String(v ?? ""); },
                  ariaLabel: "搜索歌曲",
                }),
                h(Button, {
                  variant: "unstyled",
                  size: "none",
                  class: "song-locate-btn p-2 rounded-lg",
                  title: "定位当前播放",
                  onClick: scrollToActive,
                }, { default: () => h(Icon, { icon: ctx.icons.iconCurrentLocation, width: 18, height: 18 }) }),
              ]),
            ]),
          ],
        }),

          // === 面包屑 + 导航按钮（固定在库标签栏下方） ===
          h(PageStickyHeader, { class: "song-list-sticky sticky z-110 bg-bg-main flex items-center justify-between flex-shrink-0 px-6 py-1", stickyTop: STICKY_TOP_BREADCRUMB }, {
            default: () => [
            h("div", { class: "flex items-center flex-wrap gap-0.5" },
              breadcrumbs.value.map((crumb, index) => {
                const items = [];
                if (index > 0) items.push(h("span", { class: "text-[var(--color-text-disabled)] mx-0.5 select-none" }, "/"));
                items.push(h("button", {
                  class: "bg-none border-none px-1.5 py-0.5 rounded text-[13px] cursor-pointer transition-all",
                  style: {
                    color: index === breadcrumbs.value.length - 1 ? "var(--color-text-main)" : "var(--color-text-subtle)",
                    fontWeight: index === breadcrumbs.value.length - 1 ? "600" : "400",
                  },
                  onClick: () => navigateTo(crumb.path),
                }, crumb.name));
                return items;
              }).flat(),
            ),
            h("div", { class: "flex items-center gap-1" }, [
              h("button", { class: "webdav-nav-btn", title: "返回上级", onClick: navigateUp }, [
                h(Icon, { icon: ctx.icons.iconArrowLeft, width: 18, height: 18 }),
              ]),
              h("button", { class: "webdav-nav-btn", title: "刷新", onClick: refresh }, [
                h(Icon, { icon: ctx.icons.iconRefreshCw, width: 18, height: 18 })
              ]),
            ]),
          ],
        }),

          // === 列表表头（固定在面包屑下方） ===
          //
          // 平铺视图交给宿主 SongListHeader，列宽必须与 SongList 的
          // buildSongListGridTemplate 一致，否则表头与行会错位；
          // 目录视图因为要混排文件夹，保留插件自绘表头。
          isFlatView.value
            ? h(PageStickyHeader, { class: "song-list-sticky sticky z-110 bg-bg-main", stickyTop: STICKY_TOP_LIST_HEADER }, {
                default: () => [
                  h(SongListHeader, {
                    showIndex: true,
                    showAlbum: true,
                    showCover: true,
                    sortField: FLAT_SORT_HEADER_FIELD[_sortField] ?? null,
                    sortOrder: _sortOrder,
                    onSort: (field) => handleSort(FLAT_SORT_FIELD[field]),
                  }),
                ],
              })
            : h(PageStickyHeader, { class: "song-list-sticky webdav-list-header flex-shrink-0 sticky z-110 bg-bg-main", stickyTop: STICKY_TOP_LIST_HEADER }, {
                default: () => [
            h("div", { class: ["webdav-col-index", _sortField === 'name' ? 'is-sorted' : ''], onClick: () => handleSort('name') }, [
              "#",
              h(Icon, { class: "sort-icon", icon: _sortField === 'name' ? (_sortOrder === 'asc' ? ctx.icons.iconSortUp : ctx.icons.iconSortDown) : ctx.icons.iconChevronUpDown, width: 14, height: 14 }),
            ]),
            h("div", { class: ["webdav-col-song", _sortField === 'title' ? 'is-sorted' : ''], onClick: () => handleSort('title') }, [
              "歌曲",
              h(Icon, { class: "sort-icon", icon: _sortField === 'title' ? (_sortOrder === 'asc' ? ctx.icons.iconSortUp : ctx.icons.iconSortDown) : ctx.icons.iconChevronUpDown, width: 14, height: 14 }),
            ]),
            h("div", { class: ["webdav-col-size", _sortField === 'size' ? 'is-sorted' : ''], onClick: () => handleSort('size') }, [
              "大小",
              h(Icon, { class: "sort-icon", icon: _sortField === 'size' ? (_sortOrder === 'asc' ? ctx.icons.iconSortUp : ctx.icons.iconSortDown) : ctx.icons.iconChevronUpDown, width: 14, height: 14 }),
            ]),
                ],
              }),
          // === 歌曲列表内容 ===
          //
          // 平铺视图用宿主 SongList：自带虚拟滚动（万首库不会一次性创建上万个
          // DOM 节点）、内置右键菜单、当前播放高亮、scrollToActive 与内置搜索过滤，
          // 这些原先都在插件里重复实现。目录视图混排文件夹，SongList 不支持，仍自绘。
          isFlatView.value
            ? (flatLoading.value
                ? h("div", { class: "webdav-loading" }, "加载中，可在任务中心查看进度")
                : flatError.value
                  ? h("div", { class: "webdav-error" }, flatError.value)
                  : h(SongList, {
                      ref: flatListRef,
                      songs: flatSortedEntries.value,
                      // 上下文用未过滤的全量列表：右键「下一首播放/排队候播」应以整库为上下文
                      contextSongs: flatSortedEntries.value,
                      searchQuery: searchQuery.value,
                      activeId: ctx.stores.player.currentTrackId,
                      showIndex: true,
                      showCover: true,
                      showAlbum: true,
                      showDuration: false,
                      onSongDoubleTapPlay: (song) => handleDoubleTapPlaySong(song),
                      contextMenuItems: [
                        {
                          id: "restore-default-lyric",
                          label: "恢复默认歌词",
                          onSelect: (song) => restoreDefaultLyric(song),
                        },
                      ],
                    }))
            : h("div", { ref: listContainerRef, class: "webdav-list" },
              loading.value
                ? h("div", { class: "webdav-loading" }, "加载中...")
                : error.value
                  ? h("div", { class: "webdav-error" }, error.value)
                  : currentDisplayList.value.length === 0
                    ? h("div", { class: "webdav-empty" }, [
                        h("p", { class: "webdav-empty-title" }, "此目录为空"),
                        h("p", { class: "webdav-empty-desc" }, "没有找到音乐文件"),
                      ])
                    : currentDisplayList.value.map((entry, idx) => {
                          const isDir = entry.isCollection;
                          const fileIdx = isDir ? null : songIndexMap.value[idx];
                        const filePath = normalizeDir(currentPath.value) + entry.name;
                        const songId = generateSongId(currentLibrary.value, filePath);
                        const isActive = !isDir && String(ctx.stores.player.currentTrackId) === String(songId);
                        const isPlaying = isActive && ctx.stores.player.isPlaying;
                        const isSelected = !isDir && selectedKeys.value.has(selKey(entry));
                        const { artist, title } = isDir ? { artist: "", title: "" } : describeEntry(entry);
                        return h("div", {
                          class: ["webdav-row group", isDir ? "webdav-row-dir" : "", isActive ? "is-active" : "", isSelected ? "is-selected" : ""],
                          onDblclick: isDir ? () => navigateTo(filePath + "/") : () => showBatchDrawer.value ? toggleSong(entry) : handleDoubleTapPlay(entry),
                          onClick: showBatchDrawer.value && !isDir ? (e) => { e.stopPropagation(); toggleSong(entry); } : undefined,
                          onContextmenu: (e) => showContextMenu(e, entry, isDir),
                        }, [
                          h("div", { class: "webdav-row-inner" }, [
                          // 索引列 / 复选框列
                          h("div", { class: "flex justify-center" }, [
                          h("div", { class: "relative w-4 h-4" }, [
                            showBatchDrawer.value && !isDir
                              ? h(Checkbox, {
                                  modelValue: isSelected,
                                  "ariaLabel": title || entry.name,
                                  onClick: (e) => e.stopPropagation(),
                                  "onUpdate:modelValue": () => toggleSong(entry),
                                })
                              : !isDir ? (
                                  isActive
                                    ? [
                                        h("div", { class: "absolute inset-0 flex items-center justify-center text-primary cursor-pointer", onClick: (e) => { e.stopPropagation(); ctx.player.toggle(); } }, [
                                          h(Icon, { icon: isPlaying ? ctx.icons.iconPause : ctx.icons.iconPlay, width: 14, height: 14 }),
                                        ]),
                                      ]
                                    : [
                                        h("span", { class: "absolute inset-0 flex items-center justify-center text-[12px] opacity-60 transition-opacity group-hover:opacity-0" }, fileIdx),
                                        h(Icon, { class: "absolute inset-0 m-auto opacity-0 transition-opacity group-hover:opacity-100 text-text-main cursor-pointer", icon: ctx.icons.iconPlay, width: 14, height: 14, onClick: (e) => { e.stopPropagation(); playSong(entry); } }),
                                      ]
                                ) : (
                                  h("div", { class: "absolute inset-0 flex items-center justify-center cursor-pointer text-text-main", onClick: (e) => { e.stopPropagation(); playFolder(filePath + "/"); }, title: "播放此文件夹" }, [h(Icon, { icon: ctx.icons.iconPlay, width: 14, height: 14 })])
                                ),
                          ]),
                          ]),
                          // 歌曲列（封面 + 信息）
                          h("div", { class: "webdav-col-song" }, [
                            h("div", { class: "webdav-cover" }, [
                              isDir
                                ? h("svg", { viewBox: "0 0 1024 1024", width: 22, height: 22, class: "webdav-folder-icon", innerHTML: FOLDER_SVG })
                                : h("img", { src: _fallbackCoverUrlRef.value, class: "webdav-cover-img", alt: "cover" }),
                            ]),
                            h("div", { class: "webdav-song-info" }, [
                              h("span", { class: "webdav-song-title" }, isDir ? entry.name : (title || entry.name)),
                              !isDir ? h("span", { class: "webdav-song-artist" }, artist || "未知歌手") : null,
                            ]),
                          ]),
                          // 大小列
                          h("div", { class: "webdav-col-size" }, isDir ? "" : formatSize(entry.contentLength)),
                          ]),  // close webdav-row-inner
                        ]);
                      }),
            ),          // close h("div", webdav-list)
          ]),           // close the children array of h("div", min-h-full)
        }),             // close slots object + h(PageScrollContainer, ...)

          // 右键菜单（Teleport 到 body，与主应用一致，避免 position:fixed 受父级影响）
          contextMenu.value ? [
            h("div", { class: "webdav-context-overlay", onMousedown: closeContextMenu }),
            h(Teleport, { to: "body" }, [
              h("div", { ref: contextMenuRef, class: "webdav-context-menu", style: { left: contextMenuPosition.value.x + "px", top: contextMenuPosition.value.y + "px" } }, [
                h("div", { class: "webdav-context-item", onClick: handleCtxPlayNow }, "立即播放"),
                h("div", { class: "webdav-context-item", onClick: handleCtxPlayNext }, "下一首播放"),
                !contextMenu.value.isDir
                  ? h("div", { class: "webdav-context-item", onClick: handleCtxRestoreDefault }, "恢复默认歌词")
                  : null,
              ]),
            ]),
          ] : null,
          // 批量操作抽屉（使用主应用 Drawer 组件）
          //
          // Drawer 的 <slot /> 没有 v-if（Drawer.vue:86），面板只靠 CSS 隐藏，
          // 内容会常驻 DOM。这里显式用 v-if 控制：关闭时整个抽屉体不渲染，
          // 顺带让 Drawer 的 backdrop-filter / 过渡不会作用在一棵大子树上。
          h(Drawer, {
            open: showBatchDrawer.value,
            "onUpdate:open": (v) => { showBatchDrawer.value = v; },
            side: "right",
            // 复用宿主 BatchActionDrawer 的全局面板样式（BatchActionDrawer.vue:585）
            panelClass: "batch-drawer",
            overlayClass: "batch-drawer-overlay",
            panelStyle: {
              // 用实底色而不是 --color-bg-main：后者 = color-mix(surface-main-base,
              // surface-main-opacity, transparent)，会跟随用户的「面板不透明度」设置，
              // 面板透明度 < 100% 时呈半透明。--surface-main-base 是不透明实底，
              // 且仍随深浅色主题切换（浅色 #ffffff / 深色 #29292b）。
              background: "var(--surface-main-base)",
              // 面板面积大，backdrop-filter 会拖慢开合动画；底色已不透明，无需模糊
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            },
          }, {
            // Drawer 的 <slot /> 没有 v-if（Drawer.vue:86），面板只靠 CSS 隐藏、
            // 内容常驻 DOM。这里显式守卫：关闭时不渲染抽屉体。
            default: () => {
              if (!showBatchDrawer.value) return null;
              const win = batchWindow.value;
              return h("div", { class: "flex flex-col h-full" }, [
                h("div", { class: "wbatch-header" }, [
                  h("div", { class: "wbatch-heading" }, [
                    h("span", { class: "wbatch-heading-icon" }, [
                      h(Icon, { icon: ctx.icons.iconList, width: 22, height: 22 }),
                    ]),
                    h("div", { class: "wbatch-heading-text" }, [
                      h("h2", { class: "wbatch-title" }, "批量操作"),
                      h("p", { class: "wbatch-subtitle" }, `共 ${batchEntries.value.length} 首歌曲`),
                    ]),
                  ]),
                  h(Button, {
                    variant: "ghost", size: "xs", class: "wbatch-close",
                    "aria-label": "关闭", onClick: closeBatchDrawer,
                  }, { default: () => h(Icon, { icon: "tabler:x", width: 14, height: 14 }) }),
                ]),
                h("div", { class: "wbatch-selection" }, [
                  h("label", { class: "wbatch-select" }, [
                    h(Checkbox, {
                      modelValue: isIndeterminate.value ? "indeterminate" : isAllSelected.value,
                      ariaLabel: "全选歌曲",
                      "onUpdate:modelValue": toggleSelectAll,
                    }),
                    h("span", { class: "wbatch-count" }, `${selectedKeys.value.size}/${batchEntries.value.length}`),
                  ]),
                ]),
                h("div", { class: "wbatch-list" }, [
                  h(Scrollbar, {
                    ref: batchScrollerRef,
                    // 异步组件挂载完成后才测量并绑定滚动监听（对齐宿主 BatchActionDrawer.vue:160）
                    onVnodeMounted: onBatchScrollbarMounted,
                    class: "flex-1 min-h-0",
                    scrollbarInset: 4,
                    onScroll: onBatchScroll,
                  }, {
                    default: () => h("div", { class: "wbatch-list-inner" }, [
                      h("div", { class: "wbatch-list-wrapper", style: { height: win.totalHeight + "px" } }, [
                        h("div", { style: { transform: `translateY(${win.offset}px)` } },
                          win.rows.map((entry) => {
                            const isSelected = selectedKeys.value.has(selKey(entry));
                            const info = describeEntry(entry);
                            return h("div", {
                              key: entry.id || entry.name,
                              // 显式行高：宿主 BatchActionDrawer 也按 itemHeight 内联设置，
                              // 不设会被 SongCard 内容撑紧，行与行之间没有留白
                              style: { height: BATCH_ROW_H + "px" },
                              class: isSelected ? "wbatch-row is-selected" : "wbatch-row",
                              onClick: () => toggleSong(entry),
                            }, [
                              h("div", { class: "wbatch-leading" }, [
                                h(Checkbox, {
                                  modelValue: isSelected,
                                  ariaLabel: info.title || entry.name,
                                  onClick: (e) => e.stopPropagation(),
                                  "onUpdate:modelValue": () => toggleSong(entry),
                                }),
                              ]),
                              // 宿主 SongCard：自动带音质/VIP 徽标，与主应用一致
                              h("div", { class: "wbatch-card" }, [
                                h(SongCard, {
                                  song: entry,
                                  variant: "list",
                                  showCover: true,
                                  showAlbum: false,
                                  showDuration: false,
                                  showMore: false,
                                  disableLinks: true,
                                  active: false,
                                }),
                              ]),
                            ]);
                          }),
                        ),
                      ]),
                    ]),
                  }),
                ]),
                h("div", { class: "wbatch-footer" }, [
                  h("div", { class: "wbatch-actions" }, [
                    h(Button, {
                      variant: "soft-primary", size: "xs", class: "wbatch-action",
                      disabled: selectedSongs.value.length === 0, onClick: batchPlaySelected,
                    }, [
                      h(Icon, { icon: ctx.icons.iconPlay, width: 16, height: 16 }),
                      h("span", {}, "播放"),
                    ]),
                    h(Button, {
                      variant: "soft-secondary", size: "xs", class: "wbatch-action",
                      disabled: selectedSongs.value.length === 0, onClick: batchAddToQueue,
                    }, [
                      h(Icon, { icon: ctx.icons.iconPlus, width: 16, height: 16 }),
                      h("span", {}, "添加到"),
                    ]),
                  ]),
                ]),
              ]);
            },
          }),
        ]);
      };
    },
  });
};

/* ===================================================================
 * Plugin Lifecycle
 * =================================================================== */
let state = null;

export async function activate(ctx) {
  // 只记录本插件来源的未处理拒绝：
  // 宿主已按 Blob sourceURL（echo-plugin:<id>）做全局归因并上报，
  // 这里再兜一层，仅用于开发期定位本插件内部的悬空 Promise。
  const _unhandledHandler = (event) => {
    const reason = event.reason;
    const text = reason instanceof Error ? `${reason.message}\n${reason.stack || ""}` : String(reason);
    if (!text.includes(`echo-plugin:${ctx.id}`)) return;
    console.error("[webdav-music] Unhandled rejection:", reason);
  };
  window.addEventListener("unhandledrejection", _unhandledHandler);
  ctx.dispose(() => window.removeEventListener("unhandledrejection", _unhandledHandler));
  // 启动横幅：v1.1.3 起插件只保留 error/warn，导致无法从控制台确认插件是否加载。
  // 这里打印版本号，用于确认新代码确实在运行（排查性能问题时必须先核对）。
  console.info(`[webdav-music] v${ctx.manifest.version} 已启用 (id=${ctx.id})`);
  const saved = await ctx.storage.get(STORAGE_KEY);
  state = ctx.vue.reactive({ settings: normalizeSettings(saved) });

  // WebDAV 解析需要发送 PROPFIND 等非标准方法并访问用户自定的内网地址，
  // 浏览器 fetch（CORS + 禁止请求头）无法胜任，因此使用主进程网络能力。
  // 未声明该能力时 webdavRequest 会自动退回 ctx.net.fetch。
  ctx.player.audioSource.register({
    id: "webdav",
    match: (context) => context.track.source === "webdav" && !!context.track._filePath,
    resolve: async (context) => {
      const settings = state?.settings;
      if (!settings) return null;
      const track = context.track;
      const filePath = track._filePath;
      let lib = null;
      if (track._libraryId) lib = settings.libraries?.find((l) => l.id === track._libraryId);
      if (!lib && settings.libraries?.length > 0) lib = settings.libraries[0];
      if (!lib) return null;
      const url = buildAuthUrl(lib, filePath);
      // 音质探测有缓存，不会对同一文件重复发起 Range 请求
      const quality = await detectAudioQuality(ctx, lib, filePath);
      if (quality) return { url, quality };
      return url;
    },
  });

  const _doEnrichCurrentTrack = (track) => {
    const current = track || ctx.stores.player.currentTrackSnapshot;
    if (!current || current.source !== "webdav" || !current._filePath) return;
    const sid = String(current.id ?? ctx.stores.player.currentTrackId ?? "");
    if (!sid || _pendingEnrichment.has(sid)) return;
    const promise = enrichTrack(ctx, state, current).catch(() => {});
    _pendingEnrichment.set(sid, promise);
    promise.finally(() => _pendingEnrichment.delete(sid));
  };
  // 使用宿主公开的播放事件 API，而不是直接 watch 内部 store 字段；
  // 退订与插件生命周期由宿主统一管理。
  ctx.events.onTrackChange((track) => _doEnrichCurrentTrack(track));
  // 补一次初始状态：应用重启后恢复播放时不会有新的曲目变化事件
  _doEnrichCurrentTrack();

  ctx.lyrics.registerResolver({
    id: "webdav-embedded",
    order: 100,
    match: (context) => context.track?.source === "webdav" && !!context.track?._filePath,
    /**
     * 宿主对每个歌词解析器的 match / resolve 都施加 2500ms 硬超时
     * （EchoMusic src/renderer/plugins/lyrics.ts PLUGIN_LYRIC_RESOLVER_TIMEOUT_MS），
     * 超时结果会被直接丢弃。因此这里必须在 LYRIC_RESOLVE_BUDGET_MS 内返回，
     * 酷狗搜索一律走后台任务，只在预算内等待已完成的缓存结果。
     */
    resolve: async (context) => {
      const deadline = Date.now() + LYRIC_RESOLVE_BUDGET_MS;
      const hash = context.hash;
      const track = context.track;
      const cached = _enrichedLyrics.get(hash);
      const coverLyricSource = state?.settings?.coverLyricSource || "embedded";

      // kugou 模式下后台搜索优先级更高，先把搜索挂起来复用
      const searchTask = startKugouLyricSearch(ctx, hash, track);

      // 1. 手动选择的歌词始终优先（一次 KV 读取，通常 < 50ms）
      try {
        const manualLyric = await ctx.storage.get(`lyric:${hash}`);
        if (manualLyric) return { decodeContent: manualLyric, source: "手动选择" };
      } catch {}

      // 2. 内嵌 / 后台搜索已完成的结果
      if (cached) return { decodeContent: cached };

      // 3. 等待 enrichTrack（内嵌标签解析）在剩余预算内产出歌词
      const pending = _pendingEnrichment.get(hash);
      if (pending && coverLyricSource !== "kugou") {
        await Promise.race([pending, sleep(remainingMs(deadline))]);
        const enriched = _enrichedLyrics.get(hash);
        if (enriched) return { decodeContent: enriched };
      }

      // 4. 等后台酷狗搜索，但绝不越过预算：超时则返回 null 交回宿主默认链路，
      //    后台搜索完成后会写入 _enrichedLyrics，下次解析即可命中。
      if (searchTask) {
        const left = remainingMs(deadline);
        if (left > 150) {
          const searched = await Promise.race([searchTask, sleep(left)]);
          if (searched) return { decodeContent: searched, source: "酷狗" };
        }
      }
      return null;
    },
  });

  /**
   * 接管歌词选择窗的候选获取：WebDAV 歌曲没有酷狗 hash，只能按「歌手 + 歌名」
   * 搜索候选。这是在宿主 Pinia store 上打补丁（宿主未开放对应插件 API），
   * 因此用 Symbol 标记 + 幂等还原，避免多次 activate / disable 叠加补丁。
   */
  const PATCH_FLAG = Symbol.for("echo-plugin:webdav-music:fetchLyricCandidates");
  if (ctx.lyric[PATCH_FLAG]) ctx.lyric[PATCH_FLAG].restore();
  const _originalFetchCandidates = ctx.lyric.fetchLyricCandidates.bind(ctx.lyric);
  const _patchedFetchCandidates = async (hash, options) => {
    const normalizedHash = String(hash ?? "").trim();
    if (normalizedHash.startsWith("webdav_")) {
      const track = ctx.stores.player.currentTrackSnapshot;
      if (track?.source === "webdav") {
        const artist = track.artist || "";
        const title = track.title || "";
        const keyword = artist && artist !== "未知歌手" ? `${artist} ${title}` : title;
        if (keyword) {
          try {
            const searchResult = await ctx.kugou.search.search(keyword, "song", 1, 5);
            const lists = searchResult?.data?.lists || searchResult?.data?.list || [];
            const seen = new Set();
            const candidates = [];
            for (const match of lists) {
              if (!match.FileHash) continue;
              try {
                const lyricResult = await ctx.kugou.music.searchLyric(match.FileHash);
                const cands = lyricResult?.candidates || lyricResult?.data?.candidates || [];
                for (const c of cands) {
                  if (!c?.id || !c?.accesskey) continue;
                  const key = `${c.id}:${c.accesskey}`;
                  if (seen.has(key)) continue;
                  seen.add(key);
                  candidates.push({
                    id: c.id, accesskey: c.accesskey,
                    singer: match.SingerName || "", song: match.SongName || "",
                    score: c.score ?? 0, duration: c.duration ?? 0,
                    krctype: c.krctype ?? 0, contenttype: c.contenttype ?? 0,
                    product_from: c.product_from || "", language: c.language || "",
                  });
                }
              } catch {}
              if (candidates.length >= 20) break;
            }
            // 官方推荐优先，然后按 score 降序（与主应用 sortCandidates 一致）
            candidates.sort((a, b) => (b.product_from === "官方推荐歌词" ? 1 : 0) - (a.product_from === "官方推荐歌词" ? 1 : 0) || (b.score ?? 0) - (a.score ?? 0));
            if (candidates.length > 0) {
              const autoKey = `${candidates[0].id}:${candidates[0].accesskey}`;
              Object.assign(ctx.lyric, { candidateHash: normalizedHash, candidates, autoCandidateKey: autoKey, currentCandidateKey: autoKey });
              await Promise.all(candidates.map((c) => ctx.lyric.resolveCandidateDetail(c).catch(() => {})));
              return candidates;
            }
          } catch (err) {
            console.warn("[webdav-music] keyword lyric search failed:", err.message);
          }
        }
      }
    }
    return _originalFetchCandidates(hash, options);
  };
  ctx.lyric.fetchLyricCandidates = _patchedFetchCandidates;

  /** 幂等还原：只有当 store 上仍是自己的补丁时才回写，避免覆盖其他插件的修改 */
  const _restoreFetchCandidates = () => {
    if (ctx.lyric.fetchLyricCandidates === _patchedFetchCandidates) {
      ctx.lyric.fetchLyricCandidates = _originalFetchCandidates;
    }
    delete ctx.lyric[PATCH_FLAG];
  };
  ctx.lyric[PATCH_FLAG] = { restore: _restoreFetchCandidates };
  ctx.dispose(_restoreFetchCandidates);

  _fallbackCoverUrlRef = ctx.vue.ref(DEFAULT_COVER_URL);

  /**
   * 跟随 cover-fallback 插件的兜底封面设置。
   * 这是跨插件的私有约定（BroadcastChannel 频道名与 payload 结构），
   * 一旦对方改动会静默失效，因此这里做防御式解析：任何异常都退回主应用默认封面，
   * 不会影响 WebDAV 歌曲本身的封面与歌词。
   */
  if (typeof BroadcastChannel === "function") {
    try {
      _bcChannel = new BroadcastChannel("echo-plugin:cover-fallback:settings");
      _bcChannel.onmessage = (event) => {
        try {
          const payload = event.data;
          if (!payload || payload.type !== "settings" || !payload.settings) return;
          const next = computeFallbackCoverUrl(payload.settings);
          if (typeof next === "string" && next) _fallbackCoverUrlRef.value = next;
        } catch (err) {
          console.warn("[webdav-music] 解析 cover-fallback 设置失败:", err);
        }
      };
      ctx.dispose(() => { _bcChannel?.close(); _bcChannel = null; });
    } catch (err) {
      console.warn("[webdav-music] 无法订阅 cover-fallback 设置频道:", err);
      _bcChannel = null;
    }
  }

  // 头部封面改为插件自绘的服务器图标。
  // 选择器必须限定在 .webdav-page 内：宿主 .plugin-page-host 是所有插件页面
  // 共用的容器，不加限定会污染其它插件的页面。
  ctx.css.inject(`
    .webdav-page .sliver-header-root .cover-container {
      background: linear-gradient(135deg, var(--color-primary, #31cfa1), color-mix(in srgb, var(--color-primary, #31cfa1) 50%, white)) !important;
    }
    .webdav-page .sliver-header-root .cover-container img,
    .webdav-page .sliver-header-root .cover-container .absolute {
      display: none !important;
    }
    .webdav-page .sliver-header-root .cover-container::after {
      content: "";
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='2' y='3' width='20' height='9' rx='3' stroke='white' stroke-opacity='.85' stroke-width='2' fill='none'/%3E%3Crect x='2' y='12' width='20' height='9' rx='3' stroke='white' stroke-opacity='.85' stroke-width='2' fill='none'/%3E%3Ccircle cx='5' cy='7.5' r='1.2' fill='white' fill-opacity='.85'/%3E%3Ccircle cx='5' cy='16.5' r='1.2' fill='white' fill-opacity='.85'/%3E%3C/svg%3E") center/48% no-repeat;
    }
  `, { id: "webdav-cover-override" });

  // 折叠卡片样式（与自定义图标插件一致）
  ctx.css.inject(`
    .pm-group{border:1px solid color-mix(in srgb,var(--color-text-main,#f8fafc) 12%,transparent);border-radius:8px;background:color-mix(in srgb,var(--surface-elevated-base,#111827) 72%,transparent);overflow:hidden}
    .pm-group-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;cursor:pointer;user-select:none;transition:background .15s}
    .pm-group-header:hover{background:color-mix(in srgb,var(--color-text-main,#f8fafc) 5%,transparent)}
    .pm-group-header-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--color-text-main,var(--text-main,#f8fafc))}
    .pm-group-header-count{color:var(--color-text-secondary,var(--text-secondary,rgba(148,163,184,0.9)));font-weight:500}
    .pm-group-arrow{transition:transform .2s;color:var(--color-text-secondary,var(--text-secondary,rgba(148,163,184,0.9)));font-size:10px}
    .pm-group-arrow.is-collapsed{transform:rotate(-90deg)}
    .pm-group-body{max-height:500px;overflow-y:auto;transition:max-height .25s ease-out}
    .pm-group-body.is-collapsed{max-height:0}
  `, { id: "webdav-collapsible-styles" });

  ctx.ui.settings.define({
    title: "WebDAV 音乐",
    description: "连接 WebDAV 服务器，浏览和播放云端音乐文件。",
    component: createSettingsPanel(ctx, state),
  });

  const BrowserPage = createBrowserPage(ctx, state);
  ctx.ui.addPage({
    id: "browser",
    title: "WebDAV",
    icon: "tabler:server",
    component: BrowserPage,
    sidebar: {
      section: "library",
      order: 100,
    },
  });

  ctx.commands.register("webdav-music:searchLyric", async () => {
    const track = ctx.stores.player.currentTrackSnapshot;
    if (!track || track.source !== "webdav" || !track._filePath) {
      ctx.toast.info("当前播放的不是 WebDAV 歌曲");
      return;
    }
    const hash = String(track.id ?? "");
    if (!hash) return;
    // 预热关键词候选缓存，让歌词页「选择歌词」打开即可直接看到结果
    try {
      const candidates = await ctx.lyric.fetchLyricCandidates(hash, { force: true, track });
      if (Array.isArray(candidates) && candidates.length) {
        ctx.toast.success(`已找到 ${candidates.length} 个歌词候选`);
      } else {
        ctx.toast.info("没有搜索到匹配的歌词");
      }
    } catch {
      ctx.toast.danger("歌词搜索失败");
    }
  });

  ctx.dispose(cleanupModuleState);
}

/** 统一的模块级状态清理：activate 的 ctx.dispose 与 deactivate 都走这里 */
const cleanupModuleState = () => {
  // 递增会话代数：让仍在飞的异步回调（enrich / kugou 搜索）知道自己已过期
  ++_stateEpoch;
  state = null;
  _fallbackCoverUrlRef = null;
  _enrichedLyrics.clear();
  _pendingEnrichment.clear();
  _songLibraryCache.clear();
  _kugouLyricSearches.clear();
  releaseAllObjectUrls();
  _folderCoverUrls.clear();
  _songCoverUrls.clear();
  _qualityCache.clear();
  // 排序态也一并清掉：禁用再启用应回到默认，与「清空全部模块级状态」一致
  _sortField = null;
  _sortOrder = null;
};

export function deactivate() {
  cleanupModuleState();
}
