// src/index.js
var STORAGE_KEY = "apple-music-style-settings";
var playModeOrder = ["sequential", "list", "random", "single"];
var DEFAULT_SETTINGS = {
  followEchoAppearance: false,
  enhanceContrast: false,
  fontScale: 100,
  fontWeight: 850,
  enableBlur: true,
  enableScale: true,
  enableSpring: true,
  fadeWidth: 50,
  alignPosition: 48
};
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function normalizeSettings(value) {
  const s = value && typeof value === "object" ? value : {};
  return {
    followEchoAppearance: Boolean(s.followEchoAppearance ?? DEFAULT_SETTINGS.followEchoAppearance),
    enhanceContrast: Boolean(s.enhanceContrast ?? DEFAULT_SETTINGS.enhanceContrast),
    fontScale: clamp(Number(s.fontScale ?? DEFAULT_SETTINGS.fontScale), 50, 200),
    fontWeight: clamp(Number(s.fontWeight ?? DEFAULT_SETTINGS.fontWeight), 300, 900),
    enableBlur: Boolean(s.enableBlur ?? DEFAULT_SETTINGS.enableBlur),
    enableScale: Boolean(s.enableScale ?? DEFAULT_SETTINGS.enableScale),
    enableSpring: Boolean(s.enableSpring ?? DEFAULT_SETTINGS.enableSpring),
    fadeWidth: clamp(Number(s.fadeWidth ?? DEFAULT_SETTINGS.fadeWidth), 0, 100),
    alignPosition: clamp(Number(s.alignPosition ?? DEFAULT_SETTINGS.alignPosition), 0, 100)
  };
}
function getPluginFilePath(ctx, ...parts) {
  const root = String(ctx?.descriptor?.directory || "").replace(/[\\/]+$/, "");
  return [root, ...parts].filter(Boolean).join("/");
}
function text(value, fallback = "") {
  const resolved = String(value ?? "").trim();
  return resolved || fallback;
}
function trackTitle(track) {
  const raw = text(track?.name || track?.title || track?.songname, "");
  if (!raw) return "\u672A\u77E5\u6B4C\u66F2";
  const dashIndex = raw.indexOf(" - ");
  if (dashIndex > 0) {
    const afterDash = raw.substring(dashIndex + 3).trim();
    if (afterDash) return afterDash;
  }
  return raw;
}
function trackArtist(track) {
  if (typeof track?.artist === "string" && track.artist.trim()) return track.artist;
  if (typeof track?.author === "string" && track.author.trim()) return track.author;
  const names = [
    ...Array.isArray(track?.artists) ? track.artists : [],
    ...Array.isArray(track?.singers) ? track.singers : []
  ].map((item) => item?.name || item).filter(Boolean);
  return names.length ? names.join(" / ") : "\u672A\u77E5\u6B4C\u624B";
}
function trackCover(track) {
  return text(
    track?.coverUrl || track?.cover || track?.picUrl || track?.albumCover || track?.albumImg || track?.img || track?.image || track?.cover_url
  );
}
function trackArtistId(track) {
  if (track?.artistId) return Number(track.artistId);
  if (Array.isArray(track?.ar) && track.ar[0]?.id) return Number(track.ar[0].id);
  if (Array.isArray(track?.artists) && track.artists[0]?.id) return Number(track.artists[0].id);
  return null;
}
function trackAlbumId(track) {
  if (track?.albumId) return Number(track.albumId);
  if (track?.al?.id) return Number(track.al.id);
  if (track?.album?.id) return Number(track.album.id);
  return null;
}
function normalizeSong(song) {
  if (!song) return null;
  return {
    id: String(song.id ?? song.trackId ?? song.hash ?? ""),
    hash: String(song.hash ?? song.id ?? ""),
    name: trackTitle(song),
    title: trackTitle(song),
    artist: trackArtist(song),
    artistId: trackArtistId(song),
    cover: trackCover(song),
    coverUrl: trackCover(song),
    album: text(song.album || song.albumName),
    albumId: trackAlbumId(song),
    duration: Number(song.duration || 0)
  };
}
function lyricSecondary(ctx, line) {
  const lyricStore = ctx.stores.lyric;
  if (!line) return "";
  if (typeof lyricStore.lineSecondaryText === "function") return lyricStore.lineSecondaryText(line);
  if (lyricStore.showTranslation && line.translated) return line.translated;
  if (lyricStore.showRomanization && line.romanized) return line.romanized;
  return "";
}
function lyricCharacters(line) {
  const characters = Array.isArray(line?.characters) ? line.characters : [];
  return characters.map((character) => {
    const startTime = Number(character?.startTime ?? 0);
    const endTime = Number(character?.endTime ?? character?.startTime ?? 0);
    return {
      text: String(character?.text ?? ""),
      startTime: Number.isFinite(startTime) ? startTime : 0,
      endTime: Number.isFinite(endTime) ? endTime : 0
    };
  }).filter((character) => character.text);
}
function normalizeLyricLine(ctx, line, index, lines) {
  const startMs = Math.max(0, Math.round(Number(line?.time || 0) * 1e3));
  const nextStartMs = Math.max(0, Math.round(Number(lines[index + 1]?.time || 0) * 1e3));
  return {
    time_ms: startMs,
    text: text(line?.text),
    secondary: lyricSecondary(ctx, line),
    characters: lyricCharacters(line),
    duration_ms: nextStartMs > startMs ? Math.max(400, nextStartMs - startMs) : 4800
  };
}
function createPlayerFrame(ctx, closeOverlay) {
  const { defineComponent, h, ref, onMounted, onBeforeUnmount } = ctx.vue;
  return defineComponent({
    name: "AppleMusicBridgeFrame",
    setup() {
      const iframeRef = ref(null);
      const iframeSrc = ref("");
      const loadError = ref("");
      let ready = false;
      let disposed = false;
      let lastLyricsKey = "";
      let lyricStoreUnsub = null;
      let lastLyricStoreKey = "";
      let stopTrackWatch = null;
      let stopVolumeWatch = null;
      let stopAppearanceWatch = null;
      let commandQueue = Promise.resolve();
      let positionHeartbeatTimer = null;
      const postToFrame = (payload) => {
        const target = iframeRef.value?.contentWindow;
        if (!target) return;
        target.postMessage({ ...payload, source: "echo-amll-parent" }, "*");
      };
      const ensureLyricLoaded = () => {
        const track = ctx.player.currentTrack.value || ctx.stores.player.currentTrackSnapshot;
        const hash = String(
          track?.hash || track?.id || ctx.stores.player.currentTrackId || ""
        ).trim();
        if (!hash) return;
        if (ctx.stores.lyric.loadedHash === hash && (ctx.stores.lyric.lines.length || ctx.stores.lyric.rawLyric)) {
          return;
        }
        void ctx.stores.lyric.fetchLyrics?.(hash, {
          preserveCurrent: true,
          track,
          duration: ctx.stores.player.duration ? ctx.stores.player.duration * 1e3 : void 0,
          albumAudioId: track?.albumAudioId || track?.mixSongId
        });
      };
      const buildLyricsPayload = () => {
        const player = ctx.stores.player;
        const lyric = ctx.stores.lyric;
        const current = normalizeSong(ctx.player.currentTrack.value || player.currentTrackSnapshot);
        const currentId = String(player.currentTrackId ?? current?.id ?? "");
        const hash = String(current?.hash || currentId || "").trim();
        const loadedHash = String(lyric.loadedHash || "").trim();
        const sourceLines = hash && loadedHash === hash && Array.isArray(lyric.lines) ? lyric.lines : [];
        const lines = sourceLines.map((line, index) => normalizeLyricLine(ctx, line, index, sourceLines)).filter((line) => line.text);
        const key = [
          currentId,
          hash,
          loadedHash,
          lines.map((line) => [line.time_ms, line.text, line.secondary].join(":")).join("|")
        ].join("::");
        return {
          key,
          track_id: currentId,
          hash,
          lines,
          lyricsMode: lyric.showTranslation && lyric.showRomanization ? "both" : lyric.showTranslation ? "translation" : lyric.showRomanization ? "romanization" : "none"
        };
      };
      const buildPositionPayload = (cause) => {
        const player = ctx.stores.player;
        return {
          position_ms: Math.max(0, Math.round(Number(player.currentTime || 0) * 1e3)),
          duration_ms: Math.max(0, Math.round(Number(player.duration || 0) * 1e3)),
          is_playing: Boolean(player.isPlaying),
          cause: cause || "tick"
        };
      };
      const buildSnapshot = () => {
        const player = ctx.stores.player;
        const current = normalizeSong(ctx.player.currentTrack.value || player.currentTrackSnapshot);
        const playlistStore = ctx.stores.playlist;
        const favorites = playlistStore?.favorites || [];
        const isFavorited = favorites.some((s) => String(s.id) === String(current?.id || ""));
        return {
          track: current,
          currentTrackId: String(player.currentTrackId ?? current?.id ?? ""),
          isPlaying: Boolean(player.isPlaying),
          currentTime: Number(player.currentTime || 0),
          duration: Number(player.duration || current?.duration || 0),
          volume: Number(player.volume ?? 0.8),
          playMode: String(player.playMode || "list"),
          isFavorited
        };
      };
      const buildAppearancePayload = () => {
        const settings = ctx.stores.settings || ctx.settings;
        const pluginSettings = normalizeSettings(pluginState?.settings);
        let lyricFontFamily = "";
        try {
          if (typeof settings?.buildLyricFontFamily === "function") {
            lyricFontFamily = settings.buildLyricFontFamily();
          }
        } catch (e) {
          console.warn("[AppleMusicBridge] \u8BFB\u53D6\u6B4C\u8BCD\u5B57\u4F53\u5931\u8D25", e);
        }
        let playedColor = "rgba(255, 255, 255, 0.98)";
        let unplayedColor = "rgba(255, 255, 255, 0.92)";
        let fontScale = pluginSettings.fontScale / 100;
        let fontWeight = pluginSettings.fontWeight;
        let textShadow = pluginSettings.enhanceContrast ? "0 2px 8px rgba(0,0,0,.48), 0 12px 32px rgba(0,0,0,.34)" : "0 2px 8px rgba(0,0,0,.26)";
        try {
          const appearance = ctx.stores.lyric?.appearance || settings?.lyricAppearance || {};
          if (pluginSettings.followEchoAppearance) {
            if (appearance.playedColor || appearance.activeColor) playedColor = appearance.playedColor || appearance.activeColor;
            if (appearance.unplayedColor || appearance.inactiveColor) unplayedColor = appearance.unplayedColor || appearance.inactiveColor;
            if (appearance.fontScale != null) fontScale = clamp(Number(appearance.fontScale) || 1, 0.75, 1.5);
            if (appearance.fontWeight != null) fontWeight = clamp(Number(appearance.fontWeight) || 850, 300, 900);
          }
          if (appearance.fontFamily) lyricFontFamily = String(appearance.fontFamily).trim() || lyricFontFamily;
        } catch (e) {
        }
        return {
          lyricFontFamily: String(lyricFontFamily || "").trim(),
          playedColor,
          unplayedColor,
          fontScale,
          fontWeight,
          textShadow,
          enhanceContrast: pluginSettings.enhanceContrast,
          enableBlur: pluginSettings.enableBlur,
          enableScale: pluginSettings.enableScale,
          enableSpring: pluginSettings.enableSpring,
          fadeWidth: pluginSettings.fadeWidth / 100,
          alignPosition: pluginSettings.alignPosition / 100
        };
      };
      const pushAppearance = () => {
        postToFrame({
          type: "echo-amll:appearance",
          payload: buildAppearancePayload()
        });
      };
      const pushLyricsData = (force = false) => {
        if (!ready && !force) return;
        ensureLyricLoaded();
        const payload = buildLyricsPayload();
        if (!force && payload.key === lastLyricsKey) return;
        lastLyricsKey = payload.key;
        postToFrame({
          type: "echo-amll:lyrics-data",
          payload
        });
      };
      const pushPosition = (cause) => {
        if (!ready) return;
        postToFrame({
          type: "echo-amll:position",
          payload: buildPositionPayload(cause)
        });
      };
      const pushSnapshot = () => {
        ensureLyricLoaded();
        postToFrame({
          type: "echo-amll:snapshot",
          payload: buildSnapshot()
        });
      };
      const initLyricStoreSubscription = () => {
        if (lyricStoreUnsub) return;
        const lyricStore = ctx.stores.lyric;
        const buildStoreKey = (state) => [
          Array.isArray(state?.lines) ? state.lines.length : 0,
          String(state?.loadedHash || ""),
          Boolean(state?.isLoading) ? "1" : "0"
        ].join("::");
        lastLyricStoreKey = buildStoreKey(lyricStore);
        if (typeof lyricStore.$subscribe === "function") {
          lyricStoreUnsub = lyricStore.$subscribe((mutation, state) => {
            const nextKey = buildStoreKey(state);
            if (nextKey === lastLyricStoreKey) return;
            lastLyricStoreKey = nextKey;
            pushLyricsData(false);
          });
        }
      };
      const initTrackWatch = () => {
        const getTrackId = () => {
          const player = ctx.stores.player;
          const current = ctx.player.currentTrack.value || player.currentTrackSnapshot;
          return String(current?.id || current?.hash || player.currentTrackId || "");
        };
        let lastId = getTrackId();
        stopTrackWatch = ctx.vue.watch(
          getTrackId,
          (newId) => {
            if (!newId || newId === lastId) return;
            lastId = newId;
            pushSnapshot();
            pushLyricsData(true);
            pushPosition("track_change");
          }
        );
      };
      const initVolumeWatch = () => {
        stopVolumeWatch = ctx.vue.watch(
          () => Number(ctx.stores.player.volume ?? 0.8),
          () => {
            if (!ready || disposed) return;
            pushSnapshot();
          }
        );
      };
      const initAppearanceWatch = () => {
        const settings = ctx.stores.settings || ctx.settings;
        stopAppearanceWatch = ctx.vue.watch(
          () => [
            String(settings?.lyricFont || ""),
            String(settings?.globalFont || "")
          ].join("::"),
          () => {
            if (!ready || disposed) return;
            pushAppearance();
          }
        );
      };
      const startPositionHeartbeat = () => {
        clearInterval(positionHeartbeatTimer);
        positionHeartbeatTimer = setInterval(() => {
          if (!ready || disposed) return;
          pushPosition("tick");
        }, 500);
      };
      const stopPositionHeartbeat = () => {
        clearInterval(positionHeartbeatTimer);
        positionHeartbeatTimer = null;
      };
      const cyclePlayMode = () => {
        const mode = String(ctx.stores.player.playMode || "list");
        const index = playModeOrder.indexOf(mode);
        ctx.player.setPlayMode(playModeOrder[(index + 1) % playModeOrder.length]);
      };
      const executeCommand = async (data) => {
        if (data.command === "toggle-play") await ctx.player.toggle();
        else if (data.command === "play") {
          if (!ctx.stores.player.isPlaying) await ctx.player.toggle();
        } else if (data.command === "pause") {
          if (ctx.stores.player.isPlaying) await ctx.player.toggle();
        } else if (data.command === "prev") await ctx.player.prev();
        else if (data.command === "next") await ctx.player.next();
        else if (data.command === "seek") ctx.player.seek(Math.max(0, Number(data.value) || 0) / 1e3);
        else if (data.command === "volume") {
          ctx.player.setVolume(Math.max(0, Math.min(1, Number(data.value) || 0)));
        } else if (data.command === "cycle-mode") cyclePlayMode();
        else if (data.command === "set-list-loop") {
          ctx.player.setPlayMode("list");
        } else if (data.command === "set-random") {
          ctx.player.setPlayMode("random");
        } else if (data.command === "close") closeOverlay();
        else if (data.command === "window-control") {
          const action = String(data.action || "");
          if (["minimize", "fullscreen", "maximize", "close"].includes(action)) {
            window.electron?.windowControl?.(action);
          }
        } else if (data.command === "toggle-favorite") {
          try {
            const playlistStore = ctx.stores.playlist;
            const current = ctx.player.currentTrack.value || ctx.stores.player.currentTrackSnapshot;
            if (playlistStore && current) {
              const currentId = String(current.id || current.hash || "");
              const favorites = playlistStore.favorites || [];
              const isFav = favorites.some((s) => String(s.id) === currentId);
              if (isFav) {
                await playlistStore.removeFromFavorites(currentId);
              } else {
                await playlistStore.addToFavorites(current);
              }
            }
          } catch (e) {
            console.warn("[AppleMusicBridge] toggle-favorite failed", e);
          }
        }
      };
      const pushCommandResultState = () => {
        if (disposed) return;
        pushSnapshot();
        pushPosition("command");
      };
      const handleCommand = (data) => {
        commandQueue = commandQueue.catch(() => {
        }).then(async () => {
          await executeCommand(data);
          pushCommandResultState();
        }).catch((error) => {
          console.warn("[AppleMusicBridge] \u547D\u4EE4\u6267\u884C\u5931\u8D25", error);
          pushCommandResultState();
        });
      };
      const handleMessage = (event) => {
        const data = event?.data;
        if (!data || data.source !== "echo-amll-child") return;
        switch (data.type) {
          case "echo-amll:ready":
            ready = true;
            postToFrame({
              type: "echo-amll:init",
              payload: {
                pluginVersion: String(ctx.manifest?.version || "")
              }
            });
            pushSnapshot();
            pushLyricsData(true);
            pushAppearance();
            pushPosition("init");
            break;
          case "echo-amll:command":
            handleCommand(data.payload || data);
            break;
        }
      };
      const handleKeydown = (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        closeOverlay();
      };
      const loadFrame = async () => {
        const result = await ctx.fs.getFileUrl(getPluginFilePath(ctx, "apple-music", "bridge.html"));
        if (disposed) return;
        if (!result?.ok || !result.url) {
          loadError.value = result?.error || "Apple Music \u64AD\u653E\u5668\u9875\u9762\u52A0\u8F7D\u5931\u8D25";
          return;
        }
        iframeSrc.value = result.url;
      };
      onMounted(() => {
        document.body.classList.add("applemusic-overlay-open");
        window.addEventListener("message", handleMessage);
        window.addEventListener("keydown", handleKeydown, true);
        void loadFrame();
        initLyricStoreSubscription();
        initTrackWatch();
        initVolumeWatch();
        initAppearanceWatch();
        startPositionHeartbeat();
      });
      onBeforeUnmount(() => {
        disposed = true;
        ready = false;
        document.body.classList.remove("applemusic-overlay-open");
        window.removeEventListener("message", handleMessage);
        window.removeEventListener("keydown", handleKeydown, true);
        stopPositionHeartbeat();
        if (lyricStoreUnsub) lyricStoreUnsub();
        lyricStoreUnsub = null;
        if (stopTrackWatch) stopTrackWatch();
        stopTrackWatch = null;
        if (stopVolumeWatch) stopVolumeWatch();
        stopVolumeWatch = null;
        if (stopAppearanceWatch) stopAppearanceWatch();
        stopAppearanceWatch = null;
      });
      const renderLoading = () => h("div", { class: "applemusic-bridge-loading" }, [
        h("div", { class: "applemusic-bridge-loading-text" }, loadError.value || "\u6B63\u5728\u52A0\u8F7D Apple Music \u64AD\u653E\u5668..."),
        h(
          "button",
          {
            class: "applemusic-bridge-close",
            type: "button",
            onClick: closeOverlay
          },
          "\u5173\u95ED"
        )
      ]);
      return () => h(
        "div",
        {
          class: "applemusic-bridge-page",
          role: "dialog",
          "aria-modal": "true"
        },
        [
          h("div", { class: "applemusic-bridge-drag-strip" }),
          iframeSrc.value ? h("iframe", {
            ref: iframeRef,
            class: "applemusic-bridge-frame",
            src: iframeSrc.value,
            allow: "autoplay; fullscreen",
            onLoad: () => {
              ready = true;
              pushSnapshot();
            }
          }) : renderLoading()
        ]
      );
    }
  });
}
function createPlayerOverlay(ctx, overlayOpen, closeOverlay) {
  const { defineComponent, h } = ctx.vue;
  const PlayerFrame = createPlayerFrame(ctx, closeOverlay);
  return defineComponent({
    name: "AppleMusicOverlayHost",
    setup() {
      return () => overlayOpen.value ? h(PlayerFrame) : null;
    }
  });
}
var SETTINGS_CSS = `
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
var saveTimer = 0;
var scheduleSave = (ctx) => {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = 0;
    if (!pluginState) return;
    ctx.storage.set(STORAGE_KEY, normalizeSettings(pluginState.settings)).catch(() => {
    });
  }, 240);
};
var updatePluginSettings = (ctx, patch) => {
  if (!pluginState) return;
  pluginState.settings = normalizeSettings({ ...pluginState.settings, ...patch });
  scheduleSave(ctx);
};
function createSettingsComponent(ctx) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue;
  const Button = defineAsyncComponent(ctx.ui.components.Button);
  const Slider = defineAsyncComponent(ctx.ui.components.Slider);
  const Switch = defineAsyncComponent(ctx.ui.components.Switch);
  const slider = (label, key, min, max, hint, formatter = (v) => String(v)) => h("div", { class: "echo-amll-settings-row" }, [
    h("div", { class: "echo-amll-settings-line" }, [
      h("span", { class: "echo-amll-settings-title" }, label),
      h("span", { class: "echo-amll-settings-hint" }, formatter(pluginState.settings[key]))
    ]),
    h(Slider, {
      modelValue: pluginState.settings[key],
      min,
      max,
      step: 1,
      "onUpdate:modelValue": (value) => updatePluginSettings(ctx, { [key]: Number(value) })
    }),
    hint ? h("div", { class: "echo-amll-settings-hint" }, hint) : null
  ]);
  const toggle = (label, key, hint) => h("div", { class: "echo-amll-settings-row" }, [
    h("label", { class: "echo-amll-settings-line" }, [
      h("span", { class: "echo-amll-settings-title" }, label),
      h(Switch, {
        modelValue: Boolean(pluginState.settings[key]),
        "onUpdate:modelValue": (value) => updatePluginSettings(ctx, { [key]: Boolean(value) })
      })
    ]),
    hint ? h("div", { class: "echo-amll-settings-hint" }, hint) : null
  ]);
  return defineComponent({
    name: "AppleMusicStyleSettings",
    setup() {
      return () => h("div", { class: "echo-amll-settings" }, [
        toggle("\u8DDF\u968F EchoMusic \u5916\u89C2", "followEchoAppearance", "\u590D\u7528\u9875\u9762\u6B4C\u8BCD\u7684\u5DF2\u64AD\u653E\u8272\u3001\u672A\u64AD\u653E\u8272\u3001\u5B57\u4F53\u548C\u5B57\u91CD\u3002"),
        toggle("\u589E\u5F3A\u5BF9\u6BD4\u5EA6", "enhanceContrast", "\u4FDD\u7559 AMLL \u5C42\u6B21\u611F\uFF0C\u540C\u65F6\u63D0\u9AD8\u5C01\u9762\u80CC\u666F\u4E0A\u7684\u6587\u5B57\u53EF\u8BFB\u6027\u3002"),
        toggle("\u6B4C\u8BCD\u7F29\u653E", "enableScale", "\u5F00\u542F\u5F53\u524D\u884C\u805A\u7126\u7F29\u653E\u6548\u679C\u3002"),
        toggle("\u5F39\u7C27\u52A8\u753B", "enableSpring", "\u5F00\u542F\u6B4C\u8BCD\u6EDA\u52A8\u65F6\u7684\u5F39\u7C27\u56DE\u5F39\u52A8\u753B\u3002"),
        toggle("\u6B4C\u8BCD\u6A21\u7CCA", "enableBlur", "\u5F00\u542F\u8FDC\u79BB\u7126\u70B9\u884C\u7684\u6A21\u7CCA\u6548\u679C\u3002"),
        slider(
          "\u5B57\u4F53\u7F29\u653E",
          "fontScale",
          50,
          200,
          "\u8C03\u6574\u6B4C\u8BCD\u5B57\u4F53\u5927\u5C0F\u3002",
          (v) => `${v}%`
        ),
        slider(
          "\u5B57\u4F53\u7C97\u7EC6",
          "fontWeight",
          300,
          900,
          "\u8C03\u6574\u6B4C\u8BCD\u5B57\u91CD\u3002",
          (v) => String(v)
        ),
        slider(
          "\u5BF9\u9F50\u4F4D\u7F6E",
          "alignPosition",
          0,
          100,
          "\u5F53\u524D\u6B4C\u8BCD\u884C\u5728\u9875\u9762\u9AD8\u5EA6\u4E2D\u7684\u4F4D\u7F6E\u3002",
          (v) => `${v}%`
        ),
        slider(
          "\u9010\u5B57\u6E10\u53D8",
          "fadeWidth",
          0,
          100,
          "\u63A7\u5236\u9010\u5B57\u9AD8\u4EAE\u8FB9\u7F18\u7684\u67D4\u548C\u5BBD\u5EA6\u3002",
          (v) => `${v}%`
        ),
        h("div", { class: "echo-amll-settings-actions" }, [
          h(
            Button,
            {
              variant: "outline",
              size: "xs",
              onClick: () => updatePluginSettings(ctx, DEFAULT_SETTINGS)
            },
            { default: () => "\u6062\u590D\u9ED8\u8BA4" }
          )
        ])
      ]);
    }
  });
}
var pluginState = null;
var settingsStyleDispose = null;
function activate(ctx) {
  const overlayOpen = ctx.vue.ref(false);
  let settingsDispose = null;
  const initSettings = async () => {
    const stored = await ctx.storage.get(STORAGE_KEY).catch(() => null);
    pluginState = ctx.vue.reactive({ settings: normalizeSettings(stored) });
    settingsStyleDispose = ctx.css.inject(SETTINGS_CSS, { id: "apple-music-style-settings" });
    settingsDispose = ctx.ui.settings.define({
      title: "Apple Music \u98CE\u683C\u64AD\u653E\u9875",
      description: "\u8C03\u6574\u6B4C\u8BCD\u5B57\u4F53\u3001\u52A8\u753B\u6548\u679C\u548C\u5E03\u5C40\u8BBE\u7F6E\u3002",
      component: createSettingsComponent(ctx)
    });
  };
  void initSettings();
  const closeOverlay = () => {
    overlayOpen.value = false;
    if (ctx.stores.player.isLyricViewOpen) ctx.player.toggleLyricView(false);
  };
  const openOverlay = () => {
    overlayOpen.value = true;
    if (ctx.stores.player.isLyricViewOpen) ctx.player.toggleLyricView(false);
  };
  ctx.ui.teleport(createPlayerOverlay(ctx, overlayOpen, closeOverlay), {
    id: "apple-music-style-overlay",
    className: "applemusic-overlay-host"
  });
  const stopLyricWatch = ctx.vue.watch(
    () => ctx.stores.player.isLyricViewOpen,
    (open) => {
      if (!open) return;
      openOverlay();
    },
    { immediate: true, flush: "sync" }
  );
  ctx.dispose(() => {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = 0;
    stopLyricWatch();
    closeOverlay();
    settingsDispose?.();
    settingsStyleDispose?.();
    settingsDispose = null;
    settingsStyleDispose = null;
    pluginState = null;
  });
}
function deactivate() {
}
export {
  activate,
  deactivate
};
