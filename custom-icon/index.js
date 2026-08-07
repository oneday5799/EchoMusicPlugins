const SETTINGS_KEY = "settings";
const PM_KEY = "playlistManager";

const DEFAULT_PM_SETTINGS = { enabled: true, hiddenPlaylistIds: [], customCovers: {} };

const PM_HIDE_CSS = '[data-echo-hidden-playlist="true"],[data-echo-hidden-divider="true"]{display:none!important}';

const IMAGE_FILTERS = [{ name: "Images", extensions: ["jpg", "jpeg", "png", "ico", "webp", "bmp", "gif"] }];
const ICO_FILTERS = [{ name: "Icons", extensions: ["ico"] }];
const AUDIO_FILTERS = [{ name: "Audio", extensions: ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"] }];

const ICON_TYPES = ["tray", "taskbar", "desktop"];
const SHORTCUT_TYPES = new Set(["taskbar", "desktop"]);

const DEFAULT_SETTINGS = (() => {
  const base = {
    enabled: true, splashEnabled: true, splashImagePath: "", splashRelativePath: "", splashPreviewUrl: "",
    splashDuration: 3, splashScale: "cover", splashOverlayOpacity: 0.5, splashOverlayColor: "#ffffff",
    splashBlurAmount: 0, splashBgColor: "#ffffff", splashShowLogo: true,
    splashStatusText: "引擎就绪，正在开启音乐世界...", splashFooterText: "ECHOMUSIC·音为你而生",
    splashAudioEnabled: true, splashAudioPath: "", splashAudioRelativePath: "", splashAudioPreviewUrl: "",
    splashAudioVolume: 0.5, splashAudioDuration: 3,
  };
  for (const type of ICON_TYPES) {
    base[`${type}IconPath`] = "";
    base[`${type}RelativePath`] = "";
    base[`${type}PreviewUrl`] = "";
  }
  return base;
})();

const SETTINGS_PANEL_CSS = `
.custom-icon-settings {
  display: grid;
  gap: 20px;
  color: var(--color-text-main, var(--text-main, #f8fafc));
}
.custom-icon-settings.with-preview {
  grid-template-columns: minmax(172px, 220px) minmax(0, 1fr);
}
.custom-icon-settings.with-preview .custom-icon-tabs {
  grid-column: 1 / -1;
}
.custom-icon-preview-panel {
  display: grid;
  gap: 12px;
  align-content: start;
}
.custom-icon-preview-heading,
.custom-icon-section-heading,
.custom-icon-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.custom-icon-preview-heading span:first-child,
.custom-icon-section-heading h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 760;
}
.custom-icon-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  border-radius: 999px;
  padding: 0 8px;
  background: color-mix(in srgb, var(--color-text-main, #f8fafc) 8%, transparent);
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  font-size: 11px;
  font-weight: 750;
}
.custom-icon-pill.is-active {
  background: color-mix(in srgb, var(--color-primary, #31cfa1) 16%, transparent);
  color: var(--color-primary, #31cfa1);
}
.custom-icon-preview-box {
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 13%, transparent);
  border-radius: 8px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-primary, #31cfa1) 10%, transparent), transparent),
    var(--color-bg-elevated, var(--bg-secondary, rgba(148, 163, 184, 0.08)));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, white 5%, transparent);
  display: grid;
  place-items: center;
}
.custom-icon-preview-box.wide {
  aspect-ratio: 16/9;
}
.custom-icon-preview-box img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}
.custom-icon-preview-empty {
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  text-align: center;
  font-size: 12px;
  line-height: 1.45;
  padding: 16px;
}
.custom-icon-preview-meta {
  display: grid;
  gap: 3px;
}
.custom-icon-preview-meta span {
  font-size: 12px;
  font-weight: 750;
}
.custom-icon-preview-meta small,
.custom-icon-section-description,
.custom-icon-field-hint {
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  font-size: 12px;
  line-height: 1.5;
}
.custom-icon-settings-fields {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.custom-icon-section {
  display: grid;
  gap: 12px;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 12%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-elevated-base, #111827) 72%, transparent);
  padding: 14px;
}
.custom-icon-section-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.custom-icon-field {
  display: grid;
  gap: 7px;
}
.custom-icon-field-label {
  color: var(--text-secondary, rgba(148, 163, 184, 0.9));
  font-size: 12px;
  font-weight: 600;
}
.custom-icon-path-value {
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 12%, transparent);
  border-radius: 8px;
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  padding: 8px 10px;
  font-size: 12px;
}
.custom-icon-path-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}
.custom-icon-path-row > * {
  white-space: nowrap;
  flex-shrink: 0;
}
.custom-icon-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 12%, transparent);
  margin-bottom: 14px;
}
.custom-icon-tab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(148, 163, 184, 0.9));
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color .15s, border-color .15s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}
.custom-icon-tab:hover {
  color: var(--color-text-main, var(--text-main, #f8fafc));
}
.custom-icon-tab.is-active {
  color: var(--color-primary, #31cfa1);
  border-bottom-color: var(--color-primary, #31cfa1);
}
.custom-icon-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
  padding-top: 2px;
}
.custom-icon-switch-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  color: var(--color-text-main, var(--text-main, #f8fafc));
  font-size: 13px;
}
.custom-icon-switch-copy {
  display: grid;
  gap: 3px;
}
.custom-icon-switch-copy small {
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  font-size: 12px;
  line-height: 1.45;
}
.custom-icon-message {
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  font-size: 12px;
}
.custom-icon-applied-result {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
}
.custom-icon-applied-result.success {
  background: color-mix(in srgb, #22c55e 15%, transparent);
  color: #22c55e;
}
.custom-icon-applied-result.warning {
  background: color-mix(in srgb, #f59e0b 15%, transparent);
  color: #f59e0b;
}
.custom-icon-applied-result.error {
  background: color-mix(in srgb, #ef4444 15%, transparent);
  color: #ef4444;
}
.custom-icon-settings input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--color-text-secondary, rgba(148, 163, 184, 0.9));
  outline: none;
  opacity: 0.7;
  transition: opacity .2s;
}
.custom-icon-settings input[type=range]:hover {
  opacity: 1;
}
.custom-icon-settings input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary, #31cfa1);
  cursor: pointer;
  border: 2px solid var(--color-bg-elevated, rgba(255, 255, 255, 0.8));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
.custom-icon-inline-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 12%, transparent);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-main, var(--text-main, #f8fafc));
  font-size: 12px;
  outline: none;
}
.custom-icon-inline-number {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 12%, transparent);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-main, var(--text-main, #f8fafc));
  font-size: 12px;
  outline: none;
}
.custom-icon-hint {
  color: var(--color-text-secondary, rgba(148, 163, 184, 0.9));
  font-size: 11px;
  line-height: 1.5;
}
.custom-icon-color-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.custom-icon-color-picker {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}
.custom-icon-color-label {
  color: var(--color-text-secondary, rgba(148, 163, 184, 0.9));
  font-family: monospace;
}
.pm-playlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background .15s;
}
.pm-playlist-item:hover {
  background: color-mix(in srgb, var(--color-text-main, #f8fafc) 5%, transparent);
}
.pm-playlist-cover {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--color-text-main, #f8fafc) 8%, transparent);
}
.pm-playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pm-playlist-cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  font-size: 11px;
}
.pm-playlist-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-main, var(--text-main, #f8fafc));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pm-playlist-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.pm-group {
  border: 1px solid color-mix(in srgb, var(--color-text-main, #f8fafc) 12%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-elevated-base, #111827) 72%, transparent);
  overflow: hidden;
}
.pm-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: background .15s;
}
.pm-group-header:hover {
  background: color-mix(in srgb, var(--color-text-main, #f8fafc) 5%, transparent);
}
.pm-group-header-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-main, var(--text-main, #f8fafc));
}
.pm-group-header-count {
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  font-weight: 500;
}
.pm-group-arrow {
  transition: transform .2s;
  color: var(--color-text-secondary, var(--text-secondary, rgba(148, 163, 184, 0.9)));
  font-size: 10px;
}
.pm-group-arrow.is-collapsed {
  transform: rotate(-90deg);
}
.pm-group-body {
  max-height: 500px;
  overflow-y: auto;
  transition: max-height .25s ease-out;
}
.pm-group-body.is-collapsed {
  max-height: 0;
}
.pm-empty-hint {
  color: var(--color-text-secondary, rgba(148, 163, 184, 0.9));
  font-size: 12px;
  text-align: center;
  padding: 16px 0;
}
@media (max-width: 640px) {
  .custom-icon-settings {
    grid-template-columns: 1fr;
  }
  .custom-icon-preview-panel {
    grid-template-columns: 104px minmax(0, 1fr);
    align-items: center;
  }
  .custom-icon-preview-heading {
    grid-column: 1 / -1;
  }
  .custom-icon-section {
    padding: 12px;
  }
  .custom-icon-switch-row {
    align-items: flex-start;
  }
}
`;

let state = null;
let settingsDispose = null;
let settingsStyleDispose = null;

let pmState = null;
let pmCssDispose = null;
let pmObserverDispose = null;
let pmWatchDispose = null;
let originalPics = new Map();
let pmCtx = null;
let detailCoverInterval = null;
let routeWatchDispose = null;

const removeDetailCoverObserver = () => {
  if (detailCoverInterval) { clearInterval(detailCoverInterval); detailCoverInterval = null; }
  if (routeWatchDispose) { routeWatchDispose(); routeWatchDispose = null; }
};

const normalizePmSettings = (stored) => {
  const src = (stored && typeof stored === "object") || Array.isArray(stored) ? stored : {};
  return {
    enabled: src.enabled !== undefined ? Boolean(src.enabled) : true,
    hiddenPlaylistIds: Array.isArray(src.hiddenPlaylistIds)
      ? src.hiddenPlaylistIds.filter((id) => typeof id === "string" || typeof id === "number").map(String)
      : [],
    customCovers: src.customCovers && typeof src.customCovers === "object"
      ? Object.fromEntries(Object.entries(src.customCovers).filter(([, v]) => v && typeof v === "object"))
      : {},
  };
};

const getCurrentPlaylistIdFromUrl = () => {
  const hash = window.location.hash || "";
  const match = hash.match(/playlist\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

const findPlaylistIdByUrl = (urlId) => {
  if (!urlId || !pmCtx) return "";
  const store = pmCtx.stores.playlist;
  const playlists = store?.userPlaylists || [];
  for (const p of playlists) {
    const ids = [p.id, p.listid, p.listCreateGid, p.globalCollectionId, p.listCreateListid]
      .filter((v) => v !== undefined && v !== null && String(v) !== "")
      .map(String);
    if (ids.includes(urlId)) {
      return String(p.listid || p.id || "");
    }
  }
  return "";
};

const applyCoverToContainer = (container, covers) => {
  const urlId = getCurrentPlaylistIdFromUrl();
  if (!urlId) return;
  const playlistId = findPlaylistIdByUrl(urlId);
  if (!playlistId) return;
  const cover = covers[playlistId];
  if (!cover?.previewUrl) return;
  const url = cover.previewUrl;
  container.style.setProperty("background-image", `url("${url}")`, "important");
  container.style.setProperty("background-size", "cover", "important");
  container.style.setProperty("background-position", "center", "important");
  container.style.setProperty("background-repeat", "no-repeat", "important");
  const img = container.querySelector("img.cover-img");
  if (img && img.getAttribute("src") !== url) {
    img.setAttribute("src", url);
  }
};

const patchDetailCoverDom = (covers) => {
  const detailPage = pmCtx?.dom?.query(".playlist-detail-page");
  if (!detailPage) return;
  const firstContainer = detailPage.querySelector(".cover-container");
  if (firstContainer) applyCoverToContainer(firstContainer, covers);
};

const setupDetailCoverObserver = (ctx, pmSettings) => {
  removeDetailCoverObserver();
  if (!pmSettings.enabled) return;
  const covers = pmSettings.customCovers || {};
  patchDetailCoverDom(covers);
  detailCoverInterval = setInterval(() => { patchDetailCoverDom(covers); }, 200);
  routeWatchDispose = ctx.router.afterEach(() => {
    setTimeout(() => { patchDetailCoverDom(covers); }, 300);
  });
};

const getPlaylistId = (playlist) => String(playlist.listid || playlist.id || "");

const getPlaylistIdentityList = (p) =>
  [p.id, p.listid, p.listCreateGid, p.globalCollectionId, p.listCreateListid]
    .filter((v) => v !== undefined && v !== null && String(v) !== "")
    .map(String);

const applyHiddenPlaylists = (ctx, pmSettings) => {
  removeHiddenPlaylists();
  if (!pmSettings.enabled || pmSettings.hiddenPlaylistIds.length === 0) return;
  pmCssDispose = ctx.css.inject(PM_HIDE_CSS, { id: "custom-icon-pm-hide" });
  const likedId = String(ctx.stores.playlist?.likedPlaylistQueryId ?? "");
  const markHiddenItems = () => {
    const store = ctx.stores.playlist;
    const playlists = store?.userPlaylists || [];
    const hiddenSet = new Set(pmSettings.hiddenPlaylistIds);
    const pinnedIds = playlists.filter((p) => isPlaylistDefault(p) || isPlaylistLiked(p, likedId)).map(getPlaylistId);
    const allPinnedHidden = pinnedIds.length > 0 && pinnedIds.every((id) => hiddenSet.has(id));
    (pmCtx?.dom?.queryAll(".sidebar-library-item, .sidebar-rail-cover-btn") || []).forEach((el) => {
      const span = el.querySelector("span");
      const name = span ? span.textContent.trim() : "";
      const matched = playlists.find((p) => hiddenSet.has(getPlaylistId(p)) && name === (p.name || ""));
      if (matched) {
        el.setAttribute("data-echo-hidden-playlist", "true");
        el.setAttribute("data-playlist-id", getPlaylistId(matched));
      }
    });
    (pmCtx?.dom?.queryAll(".sidebar-playlist-divider") || []).forEach((el) => {
      if (allPinnedHidden) {
        el.setAttribute("data-echo-hidden-divider", "true");
      } else {
        el.removeAttribute("data-echo-hidden-divider");
      }
    });
  };
  markHiddenItems();
  pmObserverDispose = ctx.dom.observe(
    ".sidebar-library-item, .sidebar-rail-cover-btn, .sidebar-playlist-divider",
    markHiddenItems,
  );
};

const removeHiddenPlaylists = () => {
  if (pmCssDispose) { pmCssDispose(); pmCssDispose = null; }
  if (pmObserverDispose) { pmObserverDispose(); pmObserverDispose = null; }
  (pmCtx?.dom?.queryAll('[data-echo-hidden-playlist="true"]') || []).forEach((el) => {
    el.removeAttribute("data-echo-hidden-playlist");
    el.removeAttribute("data-playlist-id");
  });
  (pmCtx?.dom?.queryAll('[data-echo-hidden-divider="true"]') || []).forEach((el) => {
    el.removeAttribute("data-echo-hidden-divider");
  });
};

const removeCustomCovers = () => {
  if (originalPics.size === 0) return;
  const store = pmCtx?.stores?.playlist || null;
  if (store) {
    const playlists = store.userPlaylists || [];
    for (const [id, originalPic] of originalPics) {
      const playlist = playlists.find((p) => getPlaylistId(p) === id);
      if (playlist) playlist.pic = originalPic;
    }
  }
  originalPics.clear();
};

const applyCustomCovers = async (ctx, pmSettings) => {
  removeCustomCovers();
  removeDetailCoverObserver();
  if (!pmSettings.enabled) return;
  const store = ctx.stores.playlist;
  const playlists = store?.userPlaylists || [];
  const covers = pmSettings.customCovers || {};
  for (const playlist of playlists) {
    const id = getPlaylistId(playlist);
    const cover = covers[id];
    if (cover?.previewUrl) {
      if (!originalPics.has(id)) originalPics.set(id, playlist.pic);
      playlist.pic = cover.previewUrl;
    }
  }
  setupDetailCoverObserver(ctx, pmSettings);
};

const buildSettingsFromDraft = (draft, overrides = {}) => ({
  ...DEFAULT_SETTINGS,
  ...draft,
  ...overrides,
});

const getExt = (name) => {
  const parts = String(name || "").split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

const MIME_MAP = {
  jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", ico: "image/x-icon",
  webp: "image/webp", bmp: "image/bmp", png: "image/png",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  m4a: "audio/mp4", aac: "audio/mp4", flac: "audio/flac", wma: "audio/x-ms-wma",
};

const getMime = (ext, fallback = "image/png") => MIME_MAP[String(ext || "").toLowerCase().replace(/^\./, "")] || fallback;

const getMimeForFile = (ext, isAudio = false) => getMime(ext, isAudio ? "audio/mpeg" : "image/png");

const bufferToDataUrl = (buf, mime) => {
  if (!buf) return "";
  try {
    let bytes;
    if (buf instanceof Uint8Array) bytes = buf;
    else if (buf instanceof ArrayBuffer) bytes = new Uint8Array(buf);
    else if (ArrayBuffer.isView?.(buf)) bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    else if (buf?.buffer instanceof ArrayBuffer) bytes = new Uint8Array(buf.buffer, buf.byteOffset || 0, buf.byteLength || buf.buffer.byteLength);
    else if (typeof buf === "string") { bytes = new Uint8Array(buf.length); for (let i = 0; i < buf.length; i++) bytes[i] = buf.charCodeAt(i) & 0xff; }
    else return "";
    if (!bytes?.length) return "";
    let bin = ""; const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return `data:${mime};base64,${btoa(bin)}`;
  } catch { return ""; }
};

const isGifPath = (p) => /\.gif$/i.test(p || "");
const getFileName = (p) => {
  if (!p) return "";
  const n = String(p).replace(/\\/g, "/");
  const i = n.lastIndexOf("/");
  return i >= 0 ? n.substring(i + 1) : n;
};

const isPlaylistLiked = (p, likedId) => likedId ? getPlaylistIdentityList(p).includes(likedId) : false;
const isPlaylistDefault = (p) => p.source !== 2 && p.type === 0 && p.isDefault === true;
const resolveGifUrl = async (ctx, path, fallback) => isGifPath(path) ? (await resolveImageUrl(ctx, path)) || fallback : fallback;

const normalizeSettings = (stored) => {
  const src = (stored && typeof stored === "object") || Array.isArray(stored) ? stored : {};
  const str = (k, def = "") => typeof src[k] === "string" ? src[k] : def;
  const bool = (k, def = true) => src[k] !== undefined ? Boolean(src[k]) : def;
  const num = (k, def, min, max) => {
    const v = typeof src[k] === "number" ? src[k] : def;
    return max !== undefined ? Math.max(min, Math.min(max, v)) : v;
  };
  const s = {
    enabled: bool("enabled"),
    splashEnabled: bool("splashEnabled"),
    splashImagePath: str("splashImagePath"),
    splashRelativePath: str("splashRelativePath"),
    splashPreviewUrl: str("splashPreviewUrl"),
    splashDuration: num("splashDuration", 3, 0.5, 30),
    splashScale: ["cover", "contain", "fill"].includes(src.splashScale) ? src.splashScale : "cover",
    splashOverlayOpacity: num("splashOverlayOpacity", 0.5, 0, 1),
    splashOverlayColor: str("splashOverlayColor", "#ffffff"),
    splashBlurAmount: num("splashBlurAmount", 0, 0, 20),
    splashBgColor: str("splashBgColor", "#ffffff"),
    splashShowLogo: bool("splashShowLogo"),
    splashStatusText: str("splashStatusText", "引擎就绪，正在开启音乐世界..."),
    splashFooterText: str("splashFooterText", "ECHOMUSIC·音为你而生"),
    splashAudioEnabled: bool("splashAudioEnabled"),
    splashAudioPath: str("splashAudioPath"),
    splashAudioRelativePath: str("splashAudioRelativePath"),
    splashAudioPreviewUrl: str("splashAudioPreviewUrl"),
    splashAudioVolume: num("splashAudioVolume", 0.5, 0, 1),
    splashAudioDuration: num("splashAudioDuration", 3, 0.5, 30),
  };
  for (const type of ICON_TYPES) {
    s[`${type}IconPath`] = str(`${type}IconPath`);
    s[`${type}RelativePath`] = str(`${type}RelativePath`);
    s[`${type}PreviewUrl`] = str(`${type}PreviewUrl`);
  }
  return s;
};

let splashOverlay = null;
let splashTimer = null;
let splashCssDispose = null;
let splashObserverDispose = null;
let splashAudio = null;
let splashAudioTimer = null;

const removeSplash = () => {
  if (splashTimer) { clearTimeout(splashTimer); splashTimer = null; }
  if (splashOverlay) {
    splashOverlay.style.transition = "opacity 0.2s ease-out";
    splashOverlay.style.opacity = "0";
    const el = splashOverlay;
    setTimeout(() => el.remove(), 250);
    splashOverlay = null;
  }
};

const removeSplashCss = () => {
  if (splashCssDispose) { splashCssDispose(); splashCssDispose = null; }
};

const stopSplashAudio = () => {
  if (splashAudioTimer) { clearTimeout(splashAudioTimer); splashAudioTimer = null; }
  if (splashAudio) {
    try { splashAudio.pause(); splashAudio.currentTime = 0; } catch {}
    splashAudio = null;
  }
};

const getLoadingView = () => (pmCtx?.dom?.query(".loading-view") || document.querySelector(".loading-view"));

const playSplashAudio = async (ctx, settings) => {
  stopSplashAudio();
  if (!settings.splashAudioEnabled || !settings.splashAudioPath) return;
  try {
    const ext = getExt(settings.splashAudioPath);
    let url = "";
    for (const p of [settings.splashAudioPath, settings.splashAudioRelativePath]) {
      if (url || !p) continue;
      try {
        const r = await ctx.fs.getFileUrl(p);
        if (r.ok && r.url) url = r.url;
      } catch {}
    }
    if (!url) {
      const result = await ctx.fs.readFileBytes(settings.splashAudioPath, { maxBytes: 4 * 1024 * 1024 });
      if (!result?.ok) return;
      url = bufferToDataUrl(result.data, getMimeForFile(ext, true));
    }
    if (!url) return;
    splashAudio = new Audio(url);
    splashAudio.volume = settings.splashAudioVolume;
    splashAudio.play().catch(() => {});
    splashAudioTimer = setTimeout(stopSplashAudio, Math.max(0.5, Number(settings.splashAudioDuration) || 3) * 1000);
  } catch {}
};

const cloneLogoToOverlay = (settings) => {
  if (!splashOverlay) return;
  splashOverlay.querySelectorAll(".splash-logo-clone").forEach((el) => el.remove());
  const lv = getLoadingView();
  if (!lv) return;
  const main = lv.querySelector("main");
  if (main) {
    const clone = main.cloneNode(true);
    clone.classList.add("splash-logo-clone");
    clone.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;z-index:1;";
    if (!settings.splashShowLogo) {
      clone.querySelectorAll(":scope > *").forEach((child) => { child.style.display = "none"; });
    } else if (settings.splashStatusText) {
      const statusEl = clone.querySelector("p") || clone.querySelector("span");
      if (statusEl) statusEl.textContent = settings.splashStatusText;
    }
    splashOverlay.appendChild(clone);
  }
  const footer = lv.querySelector("footer");
  if (footer && settings.splashShowLogo) {
    const clone = footer.cloneNode(true);
    clone.classList.add("splash-logo-clone");
    clone.style.cssText = "position:absolute;bottom:40px;left:0;right:0;pointer-events:none;z-index:1;";
    if (settings.splashFooterText) {
      const footerTextEl = clone.querySelector("span") || clone.querySelector("p");
      if (footerTextEl) footerTextEl.textContent = settings.splashFooterText;
    }
    splashOverlay.appendChild(clone);
  }
};

const resolveImageUrl = async (ctx, filePath) => {
  if (!filePath || !/\.gif$/i.test(filePath)) return "";
  try {
    const r = await ctx.fs.getFileUrl(filePath);
    if (r.ok && r.url) return r.url;
  } catch {}
  return `file:///${filePath.replace(/\\/g, "/")}`;
};

const applySplashCss = async (ctx, settings) => {
  removeSplashCss();
  if (!settings.splashEnabled || !settings.splashImagePath || !settings.splashPreviewUrl) return;
  const url = await resolveGifUrl(ctx, settings.splashImagePath, settings.splashPreviewUrl);
  const sizeRule = settings.splashScale === "contain" ? "contain" : settings.splashScale === "fill" ? "100% 100%" : "cover";
  const blurRule = settings.splashBlurAmount > 0 ? `.custom-splash-img{filter:blur(${settings.splashBlurAmount}px)!important}` : "";
  const overlayRule = settings.splashOverlayOpacity > 0
    ? `.loading-view::after{content:''!important;position:absolute!important;inset:0!important;background:${settings.splashOverlayColor}!important;opacity:${settings.splashOverlayOpacity}!important;z-index:1!important;pointer-events:none!important}`
    : "";
  const bgRule = `background-image:url("${url}")!important;background-size:${sizeRule}!important;background-position:center center!important;background-repeat:no-repeat!important;`;
  const logoRule = ".loading-view main>div{opacity:0!important}";
  const css = `.loading-view{${bgRule}${settings.splashBgColor ? `background-color:${settings.splashBgColor}!important;` : ""}}${logoRule}${blurRule}${overlayRule}`;
  splashCssDispose = ctx.css.inject(css, { id: "custom-splash-css" });
};

const createSplashImg = (url, target) => {
  const img = document.createElement("img");
  img.className = "custom-splash-img";
  img.src = url;
  img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;";
  target.prepend(img);
  target.style.setProperty("background-image", `url("${url}")`, "important");
};

const showSplash = async (ctx, settings) => {
  removeSplash();
  if (!settings.splashImagePath || !settings.splashPreviewUrl) return;
  const url = await resolveGifUrl(ctx, settings.splashImagePath, settings.splashPreviewUrl);
  const lv = getLoadingView();
  if (lv && !lv.querySelector(".custom-splash-img")) createSplashImg(url, lv);
  const overlay = document.createElement("div");
  overlay.setAttribute("data-custom-splash", "true");
  const blurRule = settings.splashBlurAmount > 0 ? `filter:blur(${settings.splashBlurAmount}px);` : "";
  Object.assign(overlay.style, {
    position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
    zIndex: "2147483647", background: `url("${url}") center/cover no-repeat`,
    backgroundColor: settings.splashBgColor || "#000", opacity: "0", transition: "opacity 0.2s ease-out", pointerEvents: "none",
    ...(blurRule ? { filter: blurRule } : {}),
  });
  if (settings.splashOverlayOpacity > 0) {
    const ol = document.createElement("div");
    Object.assign(ol.style, { position: "absolute", inset: "0", background: settings.splashOverlayColor, opacity: String(settings.splashOverlayOpacity), pointerEvents: "none" });
    overlay.appendChild(ol);
  }
  document.body.appendChild(overlay);
  splashOverlay = overlay;
  cloneLogoToOverlay(settings);
  setTimeout(() => { if (splashOverlay) splashOverlay.style.opacity = "1"; }, 50);
  splashTimer = setTimeout(removeSplash, Math.max(0.5, Number(settings.splashDuration) || 3) * 1000);
};

const createSplashObserver = (ctx) => {
  return ctx.dom.observe(".loading-view", async (element) => {
    const s = state?.settings;
    if (!s?.splashEnabled || !s?.splashImagePath || !s?.splashPreviewUrl || element.querySelector(".custom-splash-img")) return;
    const url = await resolveGifUrl(ctx, s.splashImagePath, s.splashPreviewUrl);
    createSplashImg(url, element);
    const main = element.querySelector("main");
    if (main) {
      const logoBox = main.querySelector("div");
      if (logoBox?.querySelector("span")) {
        const desktopPath = s.desktopIconPath || s.trayIconPath || "";
        if (desktopPath) {
          logoBox.innerHTML = "";
          const logoImg = document.createElement("img");
          logoImg.src = `file:///${desktopPath.replace(/\\/g, "/")}`;
          logoImg.style.cssText = "width:100%;height:100%;object-fit:contain;border-radius:inherit;";
          logoImg.onerror = () => { logoBox.innerHTML = '<span style="font-size:24px;font-weight:700">Echo</span><span style="font-size:16px;font-weight:700;color:var(--color-primary)">MUSIC</span>'; };
          logoBox.appendChild(logoImg);
          logoBox.style.background = "none";
          logoBox.style.border = "none";
        }
      }
      cloneLogoToOverlay(s);
    }
  });
};

const deleteFile = async (ctx, relativePath) => {
  if (!relativePath) return;
  try { await ctx.fs.deleteFile(relativePath); } catch {}
};

const readMediaFile = async (ctx, { key, title, filters, maxBytes, folder, defaultExt = "png", isAudio = false }) => {
  const errorPrefix = isAudio ? "音效" : "图片";
  const buttonLabel = isAudio ? "使用此音效" : "使用此图片";
  try {
    const result = await ctx.dialog.selectFiles({ title, buttonLabel, filters });
    const path = result?.paths?.[0] || "";
    if (result?.canceled || !path) return null;
    const source = await ctx.fs.readFileBytes(path, { maxBytes });
    if (!source?.ok) { ctx.toast.warning(`无法读取选择的${errorPrefix}（超过 ${Math.round(maxBytes / 1024 / 1024)}MB 或文件不可访问）`); return null; }
    const ext = getExt(path.split(/[\\/]/).pop() || "") || defaultExt;
    const destFolder = folder || (isAudio ? "assets/audio" : key === "splash" ? "assets/images" : "assets/icons");
    const destPath = `${destFolder}/${getFileName(path)}`;
    const writeResult = await ctx.fs.writeFile(destPath, source.data, { overwrite: true });
    if (!writeResult?.ok) { ctx.toast.warning(`${errorPrefix}保存失败: ${writeResult?.error || "未知错误"}`); return null; }
    return { relativePath: destPath, absolutePath: writeResult.path || "", previewUrl: bufferToDataUrl(source.data, getMimeForFile(ext, isAudio)), ext };
  } catch (e) { ctx.toast.warning(e instanceof Error ? e.message : `${errorPrefix}选择失败`); return null; }
};

const saveIconStorage = async (ctx, settings) => {
  await ctx.storage.set("appIcons", {
    trayIconPath: settings.trayIconPath || "",
    taskbarIconPath: settings.taskbarIconPath || "",
    desktopIconPath: settings.desktopIconPath || "",
  });
};

const clearAllIconStorage = async (ctx) => {
  await ctx.storage.set("appIcons", "");
};

const createShortcutsUpdater = (ctx) => async (mode, iconPath, taskbarIconPath) => {
  try {
    if (mode === "reset") {
      const desktopResult = await ctx.appIcons.restoreDefaultDesktopIcon();
      if (!ctx.process?.launch) return { ok: desktopResult?.ok !== false };
      await ctx.process.launch({ executable: "Tool.exe", args: ["shortcuts", "--mode", "reset", "--appName", "EchoMusic"] });
      return { ok: desktopResult?.ok !== false };
    }
    if (!ctx.process?.launch) return { ok: false, error: "插件进程能力不可用" };
    const args = ["shortcuts", "--mode", "custom", "--appName", "EchoMusic"];
    if (iconPath) args.push("--iconPath", iconPath);
    if (taskbarIconPath) args.push("--taskbarIconPath", taskbarIconPath);
    return await ctx.process.launch({ executable: "Tool.exe", args });
  } catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
};

const PREVIEW_LABELS = { tray: "托盘图标预览", taskbar: "任务栏图标预览", desktop: "桌面快捷方式图标预览" };
const ICON_FILE_NAMES = { tray: "选择托盘图标图片", taskbar: "选择任务栏图标（推荐 .ico 格式）", desktop: "选择桌面快捷方式图标（推荐 .ico 格式）" };

const cleanup = () => {
  settingsDispose?.(); settingsDispose = null;
  settingsStyleDispose?.(); settingsStyleDispose = null;
  removeSplash();
  removeSplashCss();
  stopSplashAudio();
  const lv = getLoadingView();
  if (lv) { const img = lv.querySelector(".custom-splash-img"); if (img) img.remove(); lv.style.removeProperty("background-image"); }
  splashObserverDispose?.(); splashObserverDispose = null;
  removeHiddenPlaylists();
  removeCustomCovers();
  removeDetailCoverObserver();
  pmWatchDispose?.(); pmWatchDispose = null;
  pmCtx = null;
  state = null;
  pmState = null;
};

const createSettingsComponent = (ctx) =>
  ctx.vue.defineComponent({
    name: "CustomIconSettings",
    setup() {
      const { h, reactive, ref, watch, onBeforeUnmount, defineAsyncComponent } = ctx.vue;
      const Button = defineAsyncComponent(ctx.ui.components.Button);
      const Switch = defineAsyncComponent(ctx.ui.components.Switch);
      const Select = defineAsyncComponent(ctx.ui.components.Select);
      const draft = reactive(normalizeSettings(state?.settings));
      const initialSettings = { ...normalizeSettings(state?.settings) };
      const saving = ref(false);
      const message = ref("");
      const statusText = ref("");
      const statusType = ref("");
      const lastSelectedKey = ref("");
      const activeTab = ref("icons");
      const resolvedSplashUrl = ref("");

      const pmDraft = reactive(normalizePmSettings(pmState?.settings));
      const pmInitial = { ...normalizePmSettings(pmState?.settings) };
      const pmSaving = ref(false);
      const playlists = ref([]);
      const favoritedPlaylists = ref([]);
      const pmCreatedCollapsed = ref(false);
      const pmFavoritedCollapsed = ref(false);

      const refreshSplashUrl = async () => {
        resolvedSplashUrl.value = draft.splashImagePath
          ? await resolveImageUrl(ctx, draft.splashImagePath) || draft.splashPreviewUrl
          : "";
      };
      watch(() => draft.splashImagePath, refreshSplashUrl);
      refreshSplashUrl();

      let previewAudioPlayer = null;
      const isPreviewPlaying = ref(false);

      const stopPreviewAudio = () => {
        if (previewAudioPlayer) {
          try { previewAudioPlayer.pause(); previewAudioPlayer.currentTime = 0; } catch {}
          previewAudioPlayer = null;
        }
        isPreviewPlaying.value = false;
      };
      watch(() => activeTab.value, (tab) => { if (tab !== "audio") stopPreviewAudio(); });

      onBeforeUnmount(() => {
        stopPreviewAudio();
        for (const [pathKey, relKey] of [
          ["trayIconPath", "trayRelativePath"], ["taskbarIconPath", "taskbarRelativePath"],
          ["desktopIconPath", "desktopRelativePath"], ["splashImagePath", "splashRelativePath"],
          ["splashAudioPath", "splashAudioRelativePath"],
        ]) {
          const initial = initialSettings[relKey] || "";
          const current = draft[relKey] || "";
          if (current && current !== initial) deleteFile(ctx, current);
        }
      });

      watch(() => state?.settings, (s) => {
        if (!s) return;
        const u = normalizeSettings(s);
        Object.assign(draft, u);
        if (!lastSelectedKey.value) {
          if (u.taskbarPreviewUrl) lastSelectedKey.value = "taskbar";
          else if (u.trayPreviewUrl) lastSelectedKey.value = "tray";
          else if (u.desktopPreviewUrl) lastSelectedKey.value = "desktop";
        }
      }, { deep: true });

      const setVal = (k, v) => { draft[k] = v; message.value = ""; statusText.value = ""; statusType.value = ""; };

      const handleSelectIcon = async (key) => {
        const oldPath = draft[`${key}RelativePath`] || "";
        const r = await readMediaFile(ctx, { key, title: ICON_FILE_NAMES[key], filters: SHORTCUT_TYPES.has(key) ? ICO_FILTERS : IMAGE_FILTERS, maxBytes: 2 * 1024 * 1024 });
        if (r) {
          if (oldPath) await deleteFile(ctx, oldPath);
          setVal(`${key}IconPath`, r.absolutePath || r.relativePath);
          setVal(`${key}RelativePath`, r.relativePath);
          setVal(`${key}PreviewUrl`, r.previewUrl);
          lastSelectedKey.value = key;
        }
      };

      const handleClearIcon = async (key) => {
        const p = draft[`${key}RelativePath`] || "";
        setVal(`${key}IconPath`, "");
        setVal(`${key}RelativePath`, "");
        setVal(`${key}PreviewUrl`, "");
        if (p) await deleteFile(ctx, p);
      };

      const handleSelectSplash = async () => {
        const oldPath = draft.splashRelativePath || "";
        const r = await readMediaFile(ctx, { key: "splash", title: "选择启动画面图片", filters: IMAGE_FILTERS, maxBytes: 10 * 1024 * 1024 });
        if (r) {
          if (oldPath) await deleteFile(ctx, oldPath);
          setVal("splashImagePath", r.absolutePath || r.relativePath);
          setVal("splashRelativePath", r.relativePath);
          setVal("splashPreviewUrl", r.previewUrl);
        }
      };

      const handleClearSplash = async () => {
        const p = draft.splashRelativePath || "";
        setVal("splashImagePath", "");
        setVal("splashRelativePath", "");
        setVal("splashPreviewUrl", "");
        setVal("splashShowLogo", true);
        if (p) await deleteFile(ctx, p);
      };

      const updateShortcuts = createShortcutsUpdater(ctx);

      const updateInitialSettings = () => {
        for (const key of ["tray", "taskbar", "desktop", "splash", "splashAudio"]) {
          const pathKey = key === "splashAudio" ? "splashAudioPath" : `${key}IconPath`;
          const relKey = key === "splashAudio" ? "splashAudioRelativePath" : `${key}RelativePath`;
          initialSettings[pathKey] = draft[pathKey];
          initialSettings[relKey] = draft[relKey];
        }
      };

      const saveIconSettings = async () => {
        if (saving.value) return;
        saving.value = true; message.value = ""; statusText.value = ""; statusType.value = "";
        try {
          const s = normalizeSettings(draft);
          const oldTray = state?.settings?.trayIconPath || "";
          Object.assign(draft, s);
          await ctx.storage.set(SETTINGS_KEY, s);
          if (state) state.settings = s;
          const hasIcon = s.enabled && (s.trayIconPath || s.taskbarIconPath || s.desktopIconPath);
          if (hasIcon) await saveIconStorage(ctx, s); else await clearAllIconStorage(ctx);
          const trayChanged = s.trayIconPath !== oldTray;
          if (trayChanged) await ctx.appIcons.refresh();
          const scMode = (!s.desktopIconPath && !s.taskbarIconPath) ? "reset" : "custom";
          const scResult = await updateShortcuts(scMode, scMode === "custom" ? s.desktopIconPath : null, scMode === "custom" ? s.taskbarIconPath : null);
          const parts = [];
          if (trayChanged) parts.push(s.trayIconPath ? "托盘: 已应用" : "托盘: 已恢复");
          if (s.taskbarIconPath) parts.push("窗口标题栏: 已应用");
          if (s.desktopIconPath) { if (scResult?.ok) parts.push("桌面快捷方式: 已更新"); else parts.push("桌面快捷方式: 未生效"); }
          if (scResult?.ok) parts.push("任务栏快捷方式: 已更新");
          statusText.value = parts.join(" | ");
          message.value = "图标设置已保存";
          statusType.value = "success";
          lastSelectedKey.value = "";
          ctx.toast.success("图标设置已保存");
          updateInitialSettings();
        } catch (e) { const t = e instanceof Error ? e.message : "保存失败"; message.value = t; statusType.value = "error"; statusText.value = t; ctx.toast.warning(t); }
        finally { saving.value = false; }
      };

      const resetIconSettings = async () => {
        if (saving.value) return;
        saving.value = true; message.value = ""; statusText.value = ""; statusType.value = "";
        try {
          const oldTray = state?.settings?.trayIconPath || "";
          for (const key of ICON_TYPES) { const p = draft[`${key}RelativePath`] || ""; if (p) await deleteFile(ctx, p); }
          const s = buildSettingsFromDraft(draft, {
            enabled: true,
            trayIconPath: "", trayRelativePath: "", trayPreviewUrl: "",
            taskbarIconPath: "", taskbarRelativePath: "", taskbarPreviewUrl: "",
            desktopIconPath: "", desktopRelativePath: "", desktopPreviewUrl: "",
          });
          Object.assign(draft, s);
          await ctx.storage.set(SETTINGS_KEY, s);
          if (state) state.settings = s;
          await clearAllIconStorage(ctx);
          if (oldTray) await ctx.appIcons.refresh();
          await updateShortcuts("reset", null, null);
          statusText.value = "托盘: 已恢复 | 窗口标题栏: 已恢复";
          message.value = "已恢复默认图标";
          statusType.value = "success";
          lastSelectedKey.value = "";
          ctx.toast.success("已恢复默认图标");
          updateInitialSettings();
        } catch (e) { const t = e instanceof Error ? e.message : "恢复失败"; message.value = t; statusType.value = "error"; statusText.value = t; ctx.toast.warning(t); }
        finally { saving.value = false; }
      };

      const saveSplashSettings = async () => {
        if (saving.value) return;
        saving.value = true;
        try {
          const s = normalizeSettings(draft);
          Object.assign(draft, s);
          await ctx.storage.set(SETTINGS_KEY, s);
          if (state) state.settings = s;
          if (s.splashEnabled) applySplashCss(ctx, s); else removeSplashCss();
          ctx.toast.success("启动画面设置已保存");
          updateInitialSettings();
        } catch (e) { ctx.toast.warning(e instanceof Error ? e.message : "保存失败"); }
        finally { saving.value = false; }
      };

      const resetSplashSettings = async () => {
        if (saving.value) return;
        saving.value = true;
        try {
          const p = draft.splashRelativePath || "";
          const s = buildSettingsFromDraft(draft, {
            splashImagePath: "", splashRelativePath: "", splashPreviewUrl: "",
            splashShowLogo: true, splashStatusText: "引擎就绪，正在开启音乐世界...", splashFooterText: "ECHOMUSIC·音为你而生",
          });
          Object.assign(draft, s);
          await ctx.storage.set(SETTINGS_KEY, s);
          if (state) state.settings = s;
          if (p) await deleteFile(ctx, p);
          removeSplashCss();
          resolvedSplashUrl.value = "";
          ctx.toast.success("已恢复默认启动画面");
          updateInitialSettings();
        } catch (e) { ctx.toast.warning(e instanceof Error ? e.message : "恢复失败"); }
        finally { saving.value = false; }
      };

      const handleSelectAudio = async () => {
        const oldPath = draft.splashAudioRelativePath || "";
        const r = await readMediaFile(ctx, { key: "splash-audio", title: "选择启动音效", filters: AUDIO_FILTERS, maxBytes: 10 * 1024 * 1024, isAudio: true });
        if (r) {
          if (oldPath) await deleteFile(ctx, oldPath);
          setVal("splashAudioPath", r.absolutePath || r.relativePath);
          setVal("splashAudioRelativePath", r.relativePath);
          setVal("splashAudioPreviewUrl", r.previewUrl);
        }
      };

      const handleClearAudio = async () => {
        const p = draft.splashAudioRelativePath || "";
        setVal("splashAudioPath", "");
        setVal("splashAudioRelativePath", "");
        setVal("splashAudioPreviewUrl", "");
        if (p) await deleteFile(ctx, p);
      };

      const previewAudio = async () => {
        if (isPreviewPlaying.value) { stopPreviewAudio(); return; }
        if (!draft.splashAudioPath) return;
        try {
          let url = draft.splashAudioPreviewUrl;
          if (!url) {
            const result = await ctx.fs.readFileBytes(draft.splashAudioPath, { maxBytes: 4 * 1024 * 1024 });
            if (result?.ok) url = bufferToDataUrl(result.data, getMimeForFile(getExt(draft.splashAudioPath), true));
          }
          if (!url) return;
          previewAudioPlayer = new Audio(url);
          previewAudioPlayer.volume = draft.splashAudioVolume;
          previewAudioPlayer.onended = () => { isPreviewPlaying.value = false; previewAudioPlayer = null; };
          previewAudioPlayer.play().catch(() => {});
          isPreviewPlaying.value = true;
        } catch {}
      };

      const saveAudioSettings = async () => {
        if (saving.value) return;
        saving.value = true;
        stopPreviewAudio();
        try {
          const s = normalizeSettings(draft);
          Object.assign(draft, s);
          await ctx.storage.set(SETTINGS_KEY, s);
          if (state) state.settings = s;
          ctx.toast.success("启动音效设置已保存");
          updateInitialSettings();
        } catch (e) { ctx.toast.warning(e instanceof Error ? e.message : "保存失败"); }
        finally { saving.value = false; }
      };

      const resetAudioSettings = async () => {
        if (saving.value) return;
        saving.value = true;
        stopPreviewAudio();
        try {
          const p = draft.splashAudioRelativePath || "";
          const s = buildSettingsFromDraft(draft, { splashAudioPath: "", splashAudioRelativePath: "", splashAudioPreviewUrl: "" });
          Object.assign(draft, s);
          await ctx.storage.set(SETTINGS_KEY, s);
          if (state) state.settings = s;
          if (p) await deleteFile(ctx, p);
          ctx.toast.success("已恢复默认启动音效");
          updateInitialSettings();
        } catch (e) { ctx.toast.warning(e instanceof Error ? e.message : "恢复失败"); }
        finally { saving.value = false; }
      };

      const renderBtn = (label, props = {}) => h(Button, props, { default: () => label });

      const renderIconRow = (key, label, desc) => {
        const fp = draft[`${key}IconPath`] || "";
        return h("div", { class: "custom-icon-section" }, [
          h("div", { class: "custom-icon-section-heading" }, [
            h("div", { class: "custom-icon-section-copy" }, [h("h3", label), h("small", desc)]),
          ]),
          h("div", { class: "custom-icon-path-row" }, [
            h("div", { class: "custom-icon-path-value", title: fp || "未选择图标" }, fp ? getFileName(fp) : "未选择图标"),
            renderBtn("选择", { variant: "outline", size: "xs", onClick: () => handleSelectIcon(key) }),
            fp ? renderBtn("清除", { variant: "ghost", size: "xs", onClick: () => handleClearIcon(key) }) : null,
          ]),
        ]);
      };

      const renderStatus = () => statusText.value
        ? h("div", { class: `custom-icon-applied-result ${statusType.value || "warning"}` }, statusText.value)
        : null;

      const getActivePreview = () => {
        const key = lastSelectedKey.value && draft[`${lastSelectedKey.value}PreviewUrl`]
          ? lastSelectedKey.value
          : ICON_TYPES.find((t) => draft[`${t}PreviewUrl`]) || "";
        return { url: key ? draft[`${key}PreviewUrl`] : "", label: key ? PREVIEW_LABELS[key] : "自定义图标" };
      };

      const clearTabState = () => { message.value = ""; statusText.value = ""; statusType.value = ""; };

      const renderTabBar = () => h("div", { class: "custom-icon-tabs" }, [
        h("button", { class: ["custom-icon-tab", activeTab.value === "icons" ? "is-active" : ""], onClick: () => { stopPreviewAudio(); activeTab.value = "icons"; clearTabState(); } }, "图标"),
        h("button", { class: ["custom-icon-tab", activeTab.value === "splash" ? "is-active" : ""], onClick: () => { stopPreviewAudio(); activeTab.value = "splash"; clearTabState(); } }, "启动画面"),
        h("button", { class: ["custom-icon-tab", activeTab.value === "audio" ? "is-active" : ""], onClick: () => { activeTab.value = "audio"; clearTabState(); } }, "启动音效"),
        h("button", { class: ["custom-icon-tab", activeTab.value === "pm" ? "is-active" : ""], onClick: () => { stopPreviewAudio(); activeTab.value = "pm"; clearTabState(); } }, "歌单管理"),
      ]);

      const renderIconPreview = () => {
        const preview = getActivePreview();
        return h("aside", { class: "custom-icon-preview-panel" }, [
          h("div", { class: "custom-icon-preview-box" }, [
            preview.url ? h("img", { src: preview.url, alt: "自定义图标预览" }) : h("div", { class: "custom-icon-preview-empty" }, "选择图标后在此预览"),
          ]),
          h("div", { class: "custom-icon-preview-meta" }, [
            h("small", "支持 .png/.ico/.jpg/.webp/.bmp"),
            h("small", { style: "color:var(--color-text-secondary,rgba(148,163,184,0.9));margin-top:2px" }, "桌面/任务栏快捷方式推荐使用 .ico"),
          ]),
          renderStatus(),
        ]);
      };

      const renderSplashPreview = () => h("div", { style: "margin-bottom:14px" }, [
        h("div", { class: "custom-icon-preview-box wide" }, [
          resolvedSplashUrl.value
            ? h("img", { src: resolvedSplashUrl.value, alt: "启动画面预览" })
            : h("div", { class: "custom-icon-preview-empty", innerHTML: "选择图片后在此预览<br>支持 .png/.jpg/.webp/.gif/.bmp<br>启动画面中的部分功能来自群友@小栀（rinnki）" }),
        ]),
        h("small", { class: "custom-icon-hint", style: "margin-top:4px;display:block" }, "图片大小限制 4MB，超过可能导致显示不全"),
      ]);

      const renderSwitchRow = (label, hint, modelValue, disabled, onUpdate) =>
        h("div", { class: "custom-icon-switch-row" }, [
          h("div", { class: "custom-icon-switch-copy" }, [h("span", label), h("small", hint)]),
          h(Switch, { modelValue, loading: saving.value, disabled: disabled || saving.value, "onUpdate:modelValue": onUpdate }),
        ]);

      const renderTextInput = (value, placeholder, disabled, onInput) =>
        h("input", { type: "text", value, placeholder, disabled, onInput, class: "custom-icon-inline-input" });

      const renderNumberInput = (value, min, max, step, disabled, onInput) =>
        h("input", { type: "number", min, max, step, value, disabled, onInput, class: "custom-icon-inline-number" });

      const renderRangeInput = (value, min, max, onInput) =>
        h("input", { type: "range", min, max, value: String(value), onInput, style: "width:100%;accent-color:var(--color-primary,#31cfa1)" });

      const renderColorPicker = (value, onInput) =>
        h("div", { class: "custom-icon-color-row" }, [
          h("input", { type: "color", value, onInput, class: "custom-icon-color-picker" }),
          h("small", { class: "custom-icon-color-label" }, value),
        ]);

      const renderIconTab = () => [
        h("div", { class: "custom-icon-section" }, [
          renderSwitchRow("开启自定义图标", "关闭后恢复应用默认图标", draft.enabled, false, (v) => {
            if (Boolean(v) !== draft.enabled) {
              if (!v) { draft.enabled = false; saveIconSettings(); } else setVal("enabled", true);
            }
          }),
        ]),
        renderIconRow("tray", "托盘图标", "系统托盘区域显示的图标（.png/.ico 均可）"),
        renderIconRow("taskbar", "任务栏图标以及标题栏图标", "任务栏图标以及窗口左上角显示的图标（.ico格式效果最佳。任务栏图标必须固定，否则会失效）"),
        renderIconRow("desktop", "桌面快捷方式图标", "桌面快捷方式 .lnk 指向的图标（必须使用 .ico 格式）"),
        h("div", { class: "custom-icon-footer" }, [
          renderBtn("恢复默认", { variant: "ghost", size: "xs", disabled: saving.value, onClick: resetIconSettings }),
          renderBtn(saving.value ? "保存中..." : "保存", { variant: "primary", size: "xs", loading: saving.value, disabled: saving.value, onClick: saveIconSettings }),
          message.value ? h("span", { class: "custom-icon-message" }, message.value) : null,
        ]),
      ];

      const renderSplashTab = () => [
        renderSplashPreview(),
        h("div", { class: "custom-icon-section" }, [
          renderSwitchRow("开启自定义启动画面", "关闭后恢复应用默认启动画面", draft.splashEnabled, false, (v) => {
            if (Boolean(v) !== draft.splashEnabled) {
              if (!v) { draft.splashEnabled = false; saveSplashSettings(); } else setVal("splashEnabled", true);
            }
          }),
        ]),
        h("div", { class: "custom-icon-section" }, [
          h("div", { class: "custom-icon-section-heading" }, [
            h("div", { class: "custom-icon-section-copy" }, [h("h3", "启动画面"), h("small", "替换应用启动画面为自定义图片")]),
          ]),
          h("div", { class: "custom-icon-path-row" }, [
            h("div", { class: "custom-icon-path-value", title: draft.splashImagePath || "未选择图片" }, draft.splashImagePath ? getFileName(draft.splashImagePath) : "未选择图片"),
            renderBtn("选择", { variant: "outline", size: "xs", onClick: handleSelectSplash }),
            draft.splashImagePath ? renderBtn("清除", { variant: "ghost", size: "xs", onClick: handleClearSplash }) : null,
          ]),
          isGifPath(draft.splashImagePath)
            ? h("div", { class: "custom-icon-field" }, [
                h("small", { class: "custom-icon-hint" }, "由于软件限制，启动画面 GIF 只能显示约1秒，无法完整播放动画。"),
              ])
            : h("div", { class: "custom-icon-field" }, [
                h("div", { class: "custom-icon-field-label" }, "显示时长（秒）"),
                renderNumberInput(draft.splashDuration, "0.5", "30", "0.5", false, (e) => {
                  const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setVal("splashDuration", v);
                }),
                h("small", { class: "custom-icon-hint" }, "0.5~30秒，默认3秒"),
              ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-switch-row" }, [
              h("div", { class: "custom-icon-switch-copy" }, [
                h("span", "纯净画面"),
                h("small", !draft.splashEnabled ? "请先开启自定义启动画面" : draft.splashImagePath ? "开启后隐藏加载页面的其他元素，仅保留图片" : "请先选择启动画面"),
              ]),
              h(Switch, { modelValue: !draft.splashShowLogo, loading: saving.value, disabled: saving.value || !draft.splashEnabled || !draft.splashImagePath, "onUpdate:modelValue": (v) => setVal("splashShowLogo", !Boolean(v)) }),
            ]),
          ]),
          h("div", { class: "custom-icon-field", style: draft.splashEnabled && draft.splashShowLogo && draft.splashImagePath ? "" : "opacity:0.5;pointer-events:none" }, [
            h("div", { class: "custom-icon-field-label" }, "状态文字"),
            renderTextInput(draft.splashStatusText, "引擎就绪，正在开启音乐世界...", !draft.splashEnabled || !draft.splashShowLogo || !draft.splashImagePath, (e) => setVal("splashStatusText", e.target.value)),
          ]),
          h("div", { class: "custom-icon-field", style: draft.splashEnabled && draft.splashShowLogo && draft.splashImagePath ? "" : "opacity:0.5;pointer-events:none" }, [
            h("div", { class: "custom-icon-field-label" }, "底部文字"),
            renderTextInput(draft.splashFooterText, "ECHOMUSIC·音为你而生", !draft.splashEnabled || !draft.splashShowLogo || !draft.splashImagePath, (e) => setVal("splashFooterText", e.target.value)),
          ]),
        ]),
        h("div", { class: "custom-icon-section" }, [
          h("div", { class: "custom-icon-section-heading" }, [
            h("div", { class: "custom-icon-section-copy" }, [h("h3", "外观设置"), h("small", "调整启动画面的缩放、叠加层和模糊效果")]),
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-field-label" }, "图片适配方式"),
            h(Select, {
              modelValue: draft.splashScale,
              options: [
                { value: "cover", label: "裁剪铺满 (cover)" },
                { value: "contain", label: "完整显示 (contain)" },
                { value: "fill", label: "拉伸填充 (fill)" },
              ],
              "onUpdate:modelValue": (v) => setVal("splashScale", v),
            }),
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-field-label" }, `暗化叠加层 (${Math.round(draft.splashOverlayOpacity * 100)}%)`),
            renderRangeInput(Math.round(draft.splashOverlayOpacity * 100), "0", "100", (e) => setVal("splashOverlayOpacity", Number(e.target.value) / 100)),
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-field-label" }, "叠加层颜色"),
            renderColorPicker(draft.splashOverlayColor, (e) => setVal("splashOverlayColor", e.target.value)),
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-field-label" }, `图片模糊 (${draft.splashBlurAmount}px)`),
            renderRangeInput(draft.splashBlurAmount, "0", "20", (e) => setVal("splashBlurAmount", Number(e.target.value))),
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-field-label" }, "兜底背景色"),
            h("div", { class: "custom-icon-color-row" }, [
              h("input", { type: "color", value: draft.splashBgColor || "#ffffff", onInput: (e) => setVal("splashBgColor", e.target.value), class: "custom-icon-color-picker" }),
              h("small", { class: "custom-icon-color-label" }, draft.splashBgColor || "未设置"),
              draft.splashBgColor ? renderBtn("清除", { variant: "ghost", size: "xs", onClick: () => setVal("splashBgColor", "") }) : null,
            ]),
          ]),
        ]),
        h("div", { class: "custom-icon-footer" }, [
          renderBtn("恢复默认", { variant: "ghost", size: "xs", disabled: saving.value, onClick: resetSplashSettings }),
          renderBtn(saving.value ? "保存中..." : "保存", { variant: "primary", size: "xs", loading: saving.value, disabled: saving.value, onClick: saveSplashSettings }),
          message.value ? h("span", { class: "custom-icon-message" }, message.value) : null,
        ]),
      ];

      const renderAudioTab = () => [
        h("div", { class: "custom-icon-section" }, [
          renderSwitchRow("开启自定义启动音效", "关闭后不播放自定义音效", draft.splashAudioEnabled, false, (v) => {
            if (Boolean(v) !== draft.splashAudioEnabled) {
              if (!v) { draft.splashAudioEnabled = false; saveAudioSettings(); } else setVal("splashAudioEnabled", true);
            }
          }),
        ]),
        h("div", { class: "custom-icon-section" }, [
          h("div", { class: "custom-icon-section-heading" }, [
            h("div", { class: "custom-icon-section-copy" }, [h("h3", "启动音效"), h("small", "应用启动时播放自定义音效")]),
          ]),
          h("div", { class: "custom-icon-path-row" }, [
            h("div", { class: "custom-icon-path-value", title: draft.splashAudioPath || "未选择音效" }, draft.splashAudioPath ? getFileName(draft.splashAudioPath) : "未选择音效"),
            renderBtn("选择", { variant: "outline", size: "xs", onClick: handleSelectAudio }),
            draft.splashAudioPath ? renderBtn("清除", { variant: "ghost", size: "xs", onClick: handleClearAudio }) : null,
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-field-label" }, "播放音量"),
            h("div", { class: "custom-icon-color-row" }, [
              renderRangeInput(Math.round(draft.splashAudioVolume * 100), "0", "100", (e) => setVal("splashAudioVolume", Number(e.target.value) / 100)),
              h("small", { class: "custom-icon-color-label", style: "min-width:36px;text-align:right" }, `${Math.round(draft.splashAudioVolume * 100)}%`),
            ]),
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("div", { class: "custom-icon-field-label" }, "播放时长（秒）"),
            h("div", { class: "custom-icon-color-row" }, [
              renderNumberInput(draft.splashAudioDuration, "0.5", "30", "0.5", false, (e) => {
                const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setVal("splashAudioDuration", v);
              }),
              h("small", { class: "custom-icon-hint" }, "0.5~30秒，默认3秒"),
            ]),
            h("small", { class: "custom-icon-hint" }, "如果启动音效播放不全请在此处增加播放时长"),
          ]),
          h("div", { class: "custom-icon-field" }, [
            h("small", { class: "custom-icon-hint" }, "支持 .mp3/.wav/.ogg/.m4a/.flac/.aac/.wma 格式"),
          ]),
        ]),
        h("div", { class: "custom-icon-footer" }, [
          renderBtn("恢复默认", { variant: "ghost", size: "xs", disabled: saving.value, onClick: resetAudioSettings }),
          renderBtn(isPreviewPlaying.value ? "停止" : "试听", { variant: isPreviewPlaying.value ? "primary" : "outline", size: "xs", disabled: !draft.splashAudioPath, onClick: previewAudio }),
          renderBtn(saving.value ? "保存中..." : "保存", { variant: "primary", size: "xs", loading: saving.value, disabled: saving.value, onClick: saveAudioSettings }),
          message.value ? h("span", { class: "custom-icon-message" }, message.value) : null,
        ]),
      ];

      const refreshPlaylists = () => {
        const store = ctx.stores.playlist;
        const all = store?.userPlaylists || [];
        const likedId = String(store?.likedPlaylistQueryId ?? "");
        const currentUserId = (() => {
          for (const p of all) {
            if (isPlaylistDefault(p) || isPlaylistLiked(p, likedId)) {
              const uid = String(p.listCreateUserid ?? "");
              if (uid) return uid;
            }
          }
          return "";
        })();
        const isOwner = (p) => {
          const ownerId = String(p.listCreateUserid ?? "");
          return ownerId !== "" && currentUserId !== "" && ownerId === currentUserId;
        };
        const created = [];
        const favorited = [];
        for (const p of all) {
          if (p.source === 2) continue;
          const item = { ...p, _id: getPlaylistId(p) };
          (isOwner(p) || isPlaylistDefault(p) || isPlaylistLiked(p, likedId) ? created : favorited).push(item);
        }
        playlists.value = created;
        favoritedPlaylists.value = favorited;
      };

      const getPlaylistDisplayCover = (playlist) => pmDraft.customCovers[playlist._id]?.previewUrl || playlist.pic || "";

      const handleTogglePlaylistHidden = (playlistId) => {
        const idx = pmDraft.hiddenPlaylistIds.indexOf(playlistId);
        if (idx >= 0) pmDraft.hiddenPlaylistIds.splice(idx, 1);
        else pmDraft.hiddenPlaylistIds.push(playlistId);
      };

      const handleSelectPlaylistCover = async (playlistId) => {
        const r = await readMediaFile(ctx, { key: "cover", title: "选择歌单封面图片", filters: IMAGE_FILTERS, maxBytes: 4 * 1024 * 1024, folder: "assets/covers" });
        if (!r) return;
        const old = pmDraft.customCovers[playlistId];
        if (old?.relativePath) await deleteFile(ctx, old.relativePath);
        pmDraft.customCovers[playlistId] = { relativePath: r.relativePath, absolutePath: r.absolutePath || "", previewUrl: r.previewUrl };
      };

      const handleClearPlaylistCover = async (playlistId) => {
        const old = pmDraft.customCovers[playlistId];
        if (old?.relativePath) await deleteFile(ctx, old.relativePath);
        delete pmDraft.customCovers[playlistId];
      };

      const savePmSettings = async () => {
        if (pmSaving.value) return;
        pmSaving.value = true;
        try {
          const s = normalizePmSettings(pmDraft);
          Object.assign(pmDraft, s);
          await ctx.storage.set(PM_KEY, s);
          if (pmState) pmState.settings = s;
          if (s.enabled) { applyHiddenPlaylists(ctx, s); await applyCustomCovers(ctx, s); }
          else { removeHiddenPlaylists(); removeCustomCovers(); }
          ctx.toast.success("歌单管理设置已保存");
          pmInitial.hiddenPlaylistIds = [...s.hiddenPlaylistIds];
          pmInitial.customCovers = { ...s.customCovers };
        } catch (e) { ctx.toast.warning(e instanceof Error ? e.message : "保存失败"); }
        finally { pmSaving.value = false; }
      };

      const resetPmSettings = async () => {
        if (pmSaving.value) return;
        pmSaving.value = true;
        try {
          for (const cover of Object.values(pmDraft.customCovers)) { if (cover?.relativePath) await deleteFile(ctx, cover.relativePath); }
          Object.assign(pmDraft, DEFAULT_PM_SETTINGS);
          await ctx.storage.set(PM_KEY, DEFAULT_PM_SETTINGS);
          if (pmState) pmState.settings = { ...DEFAULT_PM_SETTINGS };
          removeHiddenPlaylists();
          removeCustomCovers();
          ctx.toast.success("已恢复默认歌单管理");
          pmInitial.hiddenPlaylistIds = [];
          pmInitial.customCovers = {};
        } catch (e) { ctx.toast.warning(e instanceof Error ? e.message : "恢复失败"); }
        finally { pmSaving.value = false; }
      };

      const renderPlaylistItem = (playlist) => {
        const pid = playlist._id;
        const isHidden = pmDraft.hiddenPlaylistIds.includes(pid);
        const cover = getPlaylistDisplayCover(playlist);
        return h("div", { class: "pm-playlist-item" }, [
          h("div", { class: "pm-playlist-cover" }, [
            cover ? h("img", { src: cover, alt: playlist.name || "歌单" }) : h("div", { class: "pm-playlist-cover-placeholder" }, "♪"),
          ]),
          h("div", { class: "pm-playlist-name", title: playlist.name || "歌单" }, playlist.name || "未命名歌单"),
          h("div", { class: "pm-playlist-actions" }, [
            h(Switch, { modelValue: !isHidden, disabled: pmSaving.value || !pmDraft.enabled, "onUpdate:modelValue": () => handleTogglePlaylistHidden(pid) }),
            h("button", {
              type: "button", class: "custom-icon-tab",
              style: "padding:4px 8px;font-size:11px;border:1px solid color-mix(in srgb,var(--color-text-main,#f8fafc) 12%,transparent);border-radius:6px;background:transparent;color:var(--color-text-main,var(--text-main,#f8fafc));cursor:pointer;white-space:nowrap",
              disabled: pmSaving.value || !pmDraft.enabled, onClick: () => handleSelectPlaylistCover(pid),
            }, pmDraft.customCovers[pid] ? "更换" : "换封面"),
            pmDraft.customCovers[pid] ? h("button", {
              type: "button", class: "custom-icon-tab",
              style: "padding:4px 8px;font-size:11px;border:1px solid color-mix(in srgb,#ef4444 30%,transparent);border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;white-space:nowrap",
              disabled: pmSaving.value || !pmDraft.enabled, onClick: () => handleClearPlaylistCover(pid),
            }, "清除") : null,
          ]),
        ]);
      };

      const renderPlaylistManagerTab = () => {
        refreshPlaylists();
        const created = playlists.value;
        const favorited = favoritedPlaylists.value;
        const totalCount = created.length + favorited.length;
        const renderGroup = (title, items, collapsed, toggleFn) => {
          if (items.length === 0) return null;
          return h("div", { class: "pm-group" }, [
            h("div", { class: "pm-group-header", onClick: toggleFn }, [
              h("div", { class: "pm-group-header-title" }, [
                h("span", { class: ["pm-group-arrow", collapsed.value ? "is-collapsed" : ""], innerHTML: "▼" }),
                h("span", null, title),
                h("span", { class: "pm-group-header-count" }, `(${items.length})`),
              ]),
            ]),
            h("div", { class: ["pm-group-body", collapsed.value ? "is-collapsed" : ""] }, items.map((p) => renderPlaylistItem(p))),
          ]);
        };
        return [
          h("div", { class: "custom-icon-section" }, [
            renderSwitchRow("开启歌单管理", "关闭后恢复所有歌单的默认显示和封面", pmDraft.enabled, pmSaving.value, (v) => { pmDraft.enabled = Boolean(v); }),
          ]),
          totalCount === 0
            ? h("div", { class: "custom-icon-section" }, [h("div", { class: "pm-empty-hint" }, "请先登录并加载歌单数据")])
            : h("div", { style: "display:grid;gap:12px" }, [
                renderGroup("自建歌单", created, pmCreatedCollapsed, () => { pmCreatedCollapsed.value = !pmCreatedCollapsed.value; }),
                renderGroup("收藏歌单", favorited, pmFavoritedCollapsed, () => { pmFavoritedCollapsed.value = !pmFavoritedCollapsed.value; }),
              ]),
          h("div", { class: "custom-icon-footer" }, [
            renderBtn("恢复默认", { variant: "ghost", size: "xs", disabled: pmSaving.value, onClick: resetPmSettings }),
            renderBtn(pmSaving.value ? "保存中..." : "保存", { variant: "primary", size: "xs", loading: pmSaving.value, disabled: pmSaving.value, onClick: savePmSettings }),
          ]),
        ];
      };

      return () =>
        h("div", { class: ["custom-icon-settings", activeTab.value === "icons" ? "with-preview" : ""] }, [
          renderTabBar(),
          activeTab.value === "icons"
            ? [renderIconPreview(), h("div", { class: "custom-icon-settings-fields" }, [...renderIconTab()])]
            : h("div", { class: "custom-icon-settings-fields" }, [
                ...(activeTab.value === "splash" ? renderSplashTab() : []),
                ...(activeTab.value === "audio" ? renderAudioTab() : []),
                ...(activeTab.value === "pm" ? renderPlaylistManagerTab() : []),
              ]),
        ]);
    },
  });

const registerSettings = (ctx) => {
  settingsDispose?.();
  settingsStyleDispose?.();
  settingsStyleDispose = ctx.css.inject(SETTINGS_PANEL_CSS, { id: "custom-icon-settings" });
  settingsDispose = ctx.ui.settings.define({
    title: "自定义图标和封面",
    description: "自定义托盘图标、任务栏图标、桌面快捷方式图标、启动画面、启动音效以及管理歌单封面。",
    component: createSettingsComponent(ctx),
  });
};

export async function activate(ctx) {
  const loaded = await ctx.storage.get(SETTINGS_KEY);
  const normalized = normalizeSettings(loaded);

  if (!state) state = ctx.vue.reactive({ settings: normalized });
  else Object.assign(state.settings, normalized);

  const pmLoaded = await ctx.storage.get(PM_KEY);
  const pmNormalized = normalizePmSettings(pmLoaded);
  if (!pmState) pmState = ctx.vue.reactive({ settings: pmNormalized });
  else Object.assign(pmState.settings, pmNormalized);

  if (normalized.enabled) {
    if (normalized.splashEnabled) {
      try {
        if (isGifPath(normalized.splashImagePath) && normalized.splashPreviewUrl && !normalized.splashPreviewUrl.startsWith("file://") && !normalized.splashPreviewUrl.startsWith("blob:")) {
          const resolved = await resolveImageUrl(ctx, normalized.splashImagePath);
          if (resolved) {
            state.settings.splashPreviewUrl = resolved;
            await ctx.storage.set(SETTINGS_KEY, { ...normalized, splashPreviewUrl: resolved });
          }
        }
        applySplashCss(ctx, state.settings);
        splashObserverDispose = createSplashObserver(ctx);
      } catch (e) { console.log("[custom-icon] splash setup error:", e); }
      if (getLoadingView() && state.settings.splashImagePath && state.settings.splashPreviewUrl) {
        showSplash(ctx, state.settings);
      }
    }
    if (state.settings.splashAudioEnabled && state.settings.splashAudioPath && getLoadingView()) {
      playSplashAudio(ctx, state.settings);
    }
  }

  pmCtx = ctx;
  if (pmNormalized.enabled) {
    try {
      applyHiddenPlaylists(ctx, pmNormalized);
      await applyCustomCovers(ctx, pmNormalized);
      const playlistStore = ctx.stores.playlist;
      if (playlistStore) {
        pmWatchDispose = ctx.vue.watch(
          () => playlistStore.userPlaylists,
          () => {
            const ps = pmState?.settings;
            if (ps?.enabled) {
              applyCustomCovers(ctx, ps);
              if (ps.hiddenPlaylistIds.length > 0) applyHiddenPlaylists(ctx, ps);
            }
          },
          { deep: false },
        );
      }
    } catch (e) { console.log("[custom-icon] playlist manager setup error:", e); }
  }

  registerSettings(ctx);

  if (state.settings.enabled) {
    const hasIcon = state.settings.trayIconPath || state.settings.taskbarIconPath || state.settings.desktopIconPath;
    if (hasIcon) await saveIconStorage(ctx, state.settings);
  } else {
    await clearAllIconStorage(ctx);
  }

  try { await ctx.appIcons.refresh(); } catch {}

  ctx.dispose(cleanup);
}
