export async function activate(ctx) {
  let lastTrackId = null;
  let currentTrack = null;
  let retryTimer = null;

  function trySwitchToCloud() {
    const s = ctx.pinia.state.value.player;
    if (!s.currentTrackId) return;
    if (!currentTrack) return;
    if (String(currentTrack.id) !== String(s.currentTrackId)) return;
    if (s.currentResolvedSourceKind === "cloud") return;
    if (s.currentCloudSourceOverrideTrackId === s.currentTrackId) return;

    if (currentTrack.cloudAudioSource?.hash) {
      s.currentCloudSourceOverrideTrackId = String(s.currentTrackId);
      s.currentCatalogSourceOverrideTrackId = null;
      s.currentAudioQualityOverride = null;
      s.pendingSettingRefresh = false;
      void ctx.stores.player.refreshCurrentTrack().catch(() => {});
      return true;
    }
    return false;
  }

  const off = ctx.events.onTrackChange((track) => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    if (!track) return;
    if (track.source === "cloud") return;

    currentTrack = track;
    const trackId = String(track.id);
    if (trackId === lastTrackId) return;
    lastTrackId = trackId;
  });

  const offPhase = ctx.events.onPlaybackStateChange((displayState) => {
    if (displayState !== "playing" && displayState !== "paused") return;
    if (trySwitchToCloud()) return;

    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        trySwitchToCloud();
      }, 300);
    }
  });

  ctx.dispose(off);
  ctx.dispose(offPhase);

  ctx.commands.register(
    "toggle",
    () => {
      ctx.toast.info("云盘优先插件已启用");
    },
    { title: "云盘优先" },
  );
}

export async function deactivate(ctx) {
  const s = ctx.pinia.state.value.player;
  s.currentCloudSourceOverrideTrackId = null;
  s.currentCatalogSourceOverrideTrackId = null;
  s.currentAudioQualityOverride = null;
  s.pendingSettingRefresh = false;
}
