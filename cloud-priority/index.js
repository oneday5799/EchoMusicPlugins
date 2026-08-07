export async function activate(ctx) {
  let lastTrackId = null;

  const off = ctx.events.onTrackChange((track) => {
    if (!track) return;
    if (track.source === "cloud") return;

    const trackId = String(track.id);
    if (trackId === lastTrackId) return;
    lastTrackId = trackId;

    const s = ctx.pinia.state.value.player;
    s.currentCloudSourceOverrideTrackId = trackId;
    s.currentCatalogSourceOverrideTrackId = null;
    s.currentAudioQualityOverride = null;
  });

  const offPhase = ctx.events.onPlaybackStateChange((displayState) => {
    const s = ctx.pinia.state.value.player;
    if (!s.currentTrackId) return;
    if (s.currentCloudSourceOverrideTrackId !== s.currentTrackId) return;
    if (s.currentResolvedSourceKind === "cloud") return;

    if (displayState === "playing" || displayState === "paused") {
      s.pendingSettingRefresh = false;
      void ctx.stores.player.refreshCurrentTrack().catch(() => {});
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
