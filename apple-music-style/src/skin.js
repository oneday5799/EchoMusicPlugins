// skin.js
// Apple Music 风格歌词页皮肤组件
// 双栏布局：左侧封面+控制，右侧 AMLL 歌词
import { LyricPlayer as CoreLyricPlayer } from '@applemusic-like-lyrics/core'
import '@applemusic-like-lyrics/core/style.css'
import { buildAmllLyricLines } from './convert-lyrics.js'

const PLAY_MODE_ORDER = ['sequential', 'list', 'random', 'single']

const QUALITY_MAP = {
  '128': 'SD',
  '320': 'HQ',
  flac: 'SQ',
  high: 'HR',
  viper_tape: 'VPR',
  cloud: 'CLD',
}

const QUALITY_LABELS = {
  '128': '标准',
  '320': '高品质',
  flac: '无损',
  high: 'Hi-Res',
  viper_tape: '蝰蛇母带',
}

function formatTime(seconds) {
  const s = Math.floor(Math.max(0, seconds))
  const m = Math.floor(s / 60)
  return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60)
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

// AMLL RAF 配置
const TARGET_FPS = 60
const FRAME_INTERVAL = 1000 / TARGET_FPS
const SET_TIME_INTERVAL = 1000 / 30
const OVERSCAN_PX = 200

export function createSkinComponent(ctx) {
  const { defineComponent, h, ref, shallowRef, computed, watch, onMounted, onUnmounted } = ctx.vue

  return defineComponent({
    name: 'AppleMusicSkin',
    props: {
      page: { type: Object, required: true },
    },
    setup(props) {
      const skin = ctx.ui.lyricsPage.useSkin()
      const settings = computed(() => {
        const s = skin.settings.value || {}
        return {
          enhanceContrast: Boolean(s.enhanceContrast),
          fontScale: clamp(Number(s.fontScale ?? 100), 50, 200),
          fontWeight: clamp(Number(s.fontWeight ?? 850), 300, 900),
          enableBlur: Boolean(s.enableBlur ?? true),
          enableScale: Boolean(s.enableScale ?? true),
          enableSpring: Boolean(s.enableSpring ?? true),
          fadeWidth: clamp(Number(s.fadeWidth ?? 50), 0, 100),
          alignPosition: clamp(Number(s.alignPosition ?? 48), 0, 100),
          showTranslation: Boolean(s.showTranslation),
          showRomanization: Boolean(s.showRomanization),
        }
      })

      // DOM refs
      const playerAreaRef = ref(null)
      const coverImgRef = ref(null)
      const progressTrackRef = ref(null)

      // AMLL
      const amllPlayer = shallowRef(null)

      // RAF state
      let rafId = null
      let lastFrameTime = 0
      let lastSetTimeAt = 0
      let settleUntil = 0
      let lastAppliedTimeMs = Number.NaN
      let disposed = false

      // Progress bar state
      const seeking = ref(false)
      const hoverStartTime = ref(0)

      // --- Computed state from page ---
      const state = computed(() => props.page.state.value)
      const track = computed(() => state.value.track || {})
      const isPlaying = computed(() => state.value.isPlaying)
      const currentTime = computed(() => state.value.currentTime || 0)
      const duration = computed(() => state.value.duration || 0)
      const volume = computed(() => state.value.volume ?? 80)
      const playMode = computed(() => state.value.playMode || 'list')
      const isFavorite = computed(() => state.value.isFavorite)
      const audioQuality = computed(() => state.value.audioQuality || '')
      const qualityOptions = computed(() => state.value.qualityOptions || [])
      const hasCloudSource = computed(() => state.value.hasCloudSource)
      const lyrics = computed(() => state.value.lyrics)

      const readTimelineMs = () => {
        if (disposed) return null
        try {
          const timelineMs = Number(props.page.lyrics.getTimelineMs())
          return Number.isFinite(timelineMs) ? timelineMs : null
        } catch {
          return null
        }
      }

      const trackTitle = computed(() => {
        const raw = track.value.name || track.value.title || ''
        if (!raw) return '未知歌曲'
        const dashIndex = raw.indexOf(' - ')
        if (dashIndex > 0) {
          const after = raw.substring(dashIndex + 3).trim()
          if (after) return after
        }
        return raw
      })

      const trackArtist = computed(() => track.value.artist || '未知歌手')
      const coverUrl = computed(() => track.value.coverUrl || track.value.cover || '')

      const progressPct = computed(() => {
        const d = duration.value
        return d > 0 ? clamp((currentTime.value / d) * 100, 0, 100) : 0
      })

      const currentTimeStr = computed(() => formatTime(currentTime.value))
      const remainTimeStr = computed(() => '-' + formatTime(Math.max(0, duration.value - currentTime.value)))

      const qualityLabel = computed(() => QUALITY_MAP[audioQuality.value] || '')

      // --- Lyrics mode for AMLL ---
      const lyricsMode = computed(() => {
        if (settings.value.showTranslation && settings.value.showRomanization) return 'both'
        if (settings.value.showTranslation) return 'translation'
        if (settings.value.showRomanization) return 'romanization'
        return 'none'
      })

      const amllLines = computed(() =>
        buildAmllLyricLines(lyrics.value.lines, lyricsMode.value, false),
      )

      let lastSetLinesKey = ''
      const getLinesKey = (lines) => {
        if (!lines || !lines.length) return ''
        return lines.length + ':' + lines[0].startTime + ':' + lines[lines.length - 1].startTime
      }

      // --- AMLL lifecycle ---
      const rafLoop = (timestamp) => {
        rafId = null
        if (disposed || document.hidden) {
          lastFrameTime = 0
          return
        }
        const elapsed = lastFrameTime > 0 ? timestamp - lastFrameTime : FRAME_INTERVAL
        if (elapsed < FRAME_INTERVAL) {
          rafId = requestAnimationFrame(rafLoop)
          return
        }
        const dt = Math.min(elapsed, 50)
        lastFrameTime = timestamp
        const player = amllPlayer.value
        if (player) {
          const timelineMs = readTimelineMs()
          if (
            timelineMs !== null &&
            lastAppliedTimeMs !== timelineMs &&
            timestamp - lastSetTimeAt >= SET_TIME_INTERVAL
          ) {
            player.setCurrentTime(timelineMs)
            lastAppliedTimeMs = timelineMs
            lastSetTimeAt = timestamp
          }
          player.update(dt)
        }
        if (isPlaying.value || timestamp < settleUntil) {
          rafId = requestAnimationFrame(rafLoop)
        } else {
          lastFrameTime = 0
        }
      }

      const requestFrame = () => {
        if (disposed || !amllPlayer.value || document.hidden) return
        settleUntil = performance.now() + 1000
        if (rafId !== null) return
        lastFrameTime = 0
        rafId = requestAnimationFrame(rafLoop)
      }

      const handleVisibilityChange = () => {
        if (disposed) return
        if (document.hidden) {
          if (rafId !== null) cancelAnimationFrame(rafId)
          rafId = null
          lastFrameTime = 0
          amllPlayer.value?.pause()
        } else {
          if (isPlaying.value) amllPlayer.value?.resume()
          lastAppliedTimeMs = Number.NaN
          lastSetTimeAt = 0
          requestFrame()
        }
      }

      const initAmll = () => {
        const host = playerAreaRef.value
        const timelineMs = readTimelineMs()
        if (!host || amllPlayer.value || timelineMs === null) return
        const player = new CoreLyricPlayer()
        host.appendChild(player.getElement())
        player.setOverscanPx(OVERSCAN_PX)
        player.setLyricLines(amllLines.value, timelineMs)
        lastAppliedTimeMs = Number.NaN
        lastSetTimeAt = 0
        if (isPlaying.value && !document.hidden) player.resume()
        else player.pause()
        amllPlayer.value = player
        document.addEventListener('visibilitychange', handleVisibilityChange)
        lastFrameTime = performance.now()
        requestFrame()
      }

      const disposeAmll = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        if (rafId !== null) cancelAnimationFrame(rafId)
        rafId = null
        const player = amllPlayer.value
        if (player) {
          player.dispose()
          const ro = player.resizeObserver
          ro?.disconnect()
        }
        amllPlayer.value = null
        const host = playerAreaRef.value
        if (host) host.replaceChildren()
      }

      // --- Watchers ---
      watch(amllLines, (lines) => {
        const key = getLinesKey(lines)
        if (key === lastSetLinesKey) return
        const player = amllPlayer.value
        const timelineMs = readTimelineMs()
        if (!player || timelineMs === null) return
        player.setLyricLines(lines, timelineMs)
        lastSetLinesKey = key
        lastAppliedTimeMs = Number.NaN
        lastSetTimeAt = 0
        if (!isPlaying.value || document.hidden) player.pause()
        requestFrame()
      })

      // Cover animation tracking
      let coverAnim = null

      watch(isPlaying, (playing) => {
        const player = amllPlayer.value
        if (playing && !document.hidden) player?.resume()
        else player?.pause()
        requestFrame()

        // Cover scale animation (matching reference)
        const img = coverImgRef.value
        if (img) {
          if (coverAnim) { coverAnim.cancel(); coverAnim = null }
          coverAnim = playing
            ? img.animate(
                [
                  { transform: 'scale(0.75)', offset: 0 },
                  { transform: 'scale(1.1)', offset: 0.6 },
                  { transform: 'scale(1)', offset: 1 },
                ],
                { duration: 500, easing: 'ease', fill: 'forwards' },
              )
            : img.animate(
                [
                  { transform: 'scale(1)', offset: 0 },
                  { transform: 'scale(0.75)', offset: 1 },
                ],
                { duration: 500, easing: 'ease', fill: 'forwards' },
              )
          coverAnim.finished.then(() => { if (!disposed) coverAnim = null }).catch(() => {})
        }
      })

      watch(
        () => [currentTime.value, lyrics.value.timeOffset],
        () => requestFrame(),
      )

      // AMLL settings
      watch(
        [
          amllPlayer,
          () => settings.value.alignPosition,
          () => settings.value.enableSpring,
          () => settings.value.enableBlur,
          () => settings.value.enableScale,
          () => settings.value.fadeWidth,
        ],
        ([player, position, spring, blur, scale, fade], prev) => {
          if (!player) return
          const initial = player !== prev?.[0]
          if (initial) player.setAlignAnchor('center')
          if (initial || position !== prev?.[1]) player.setAlignPosition(position / 100)
          if (initial || spring !== prev?.[2]) player.setEnableSpring(spring)
          if (initial || blur !== prev?.[3]) player.setEnableBlur(blur)
          if (initial || scale !== prev?.[4]) player.setEnableScale(scale)
          if (initial || fade !== prev?.[5]) player.setWordFadeWidth(fade / 100)
          requestFrame()
        },
      )

      // --- Actions ---
      const togglePlay = () => props.page.playback.toggle()
      const playPrev = () => props.page.playback.prev()
      const playNext = () => props.page.playback.next()
      const cycleMode = () => props.page.playback.cycleMode()
      const toggleFavorite = () => props.page.favorite.toggle()

      const seekTo = (seconds) => {
        props.page.playback.seek(Math.max(0, Math.min(seconds, duration.value || 0)))
      }

      const handleProgressClick = (e) => {
        const rect = progressTrackRef.value?.getBoundingClientRect()
        if (!rect) return
        const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1)
        seekTo(pct * duration.value)
      }

      const handleProgressMouseDown = (e) => {
        seeking.value = true
        handleProgressClick(e)
      }

      const handleMouseMove = (e) => {
        if (seeking.value) handleProgressClick(e)
      }

      const handleMouseUp = () => {
        seeking.value = false
      }

      const handleQualitySelect = (quality) => {
        try {
          props.page.audio.setQuality(quality)
        } catch (e) {
          console.warn('[AppleMusicStyle] 音质切换失败', e)
        }
      }

      // Quality popup state
      const showQualityPopup = ref(false)
      const qualityPopupRef = ref(null)

      const QUALITY_MAP = { '128': 'SD', '320': 'HQ', flac: 'SQ', high: 'HR', viper_tape: 'VPR', cloud: 'CLD' }
      const QUALITY_NAMES = { '128': '标准', '320': '高品质', flac: '无损', high: 'Hi-Res', viper_tape: '蝰蛇母带' }

      const toggleQualityPopup = (e) => {
        e.stopPropagation()
        showQualityPopup.value = !showQualityPopup.value
      }

      const selectQuality = (q) => {
        handleQualitySelect(q)
        showQualityPopup.value = false
      }

      const closeQualityPopup = () => {
        showQualityPopup.value = false
      }

      // Button press animation handlers
      const btnPressTimers = new Map()
      const btnReleasing = new Set()

      const handleBtnMouseDown = (e) => {
        const btn = e.currentTarget
        if (btnReleasing.has(btn)) return
        btn.classList.remove('pressing', 'holding', 'releasing')
        void btn.offsetWidth
        btn.classList.add('pressing')
        const timer = setTimeout(() => {
          btn.classList.remove('pressing')
          void btn.offsetWidth
          btn.classList.add('holding')
        }, 200)
        btnPressTimers.set(btn, timer)
      }

      const handleBtnMouseUp = (e) => {
        const btn = e.currentTarget
        clearTimeout(btnPressTimers.get(btn))
        btnPressTimers.delete(btn)
        if (btn.classList.contains('pressing') || btn.classList.contains('holding')) {
          btn.classList.remove('pressing', 'holding')
          void btn.offsetWidth
          btnReleasing.add(btn)
          btn.classList.add('releasing')
          setTimeout(() => {
            btn.classList.remove('releasing')
            btnReleasing.delete(btn)
          }, 300)
        }
      }

      const handleBtnMouseLeave = (e) => {
        const btn = e.currentTarget
        clearTimeout(btnPressTimers.get(btn))
        btnPressTimers.delete(btn)
        if (btn.classList.contains('pressing') || btn.classList.contains('holding')) {
          btn.classList.remove('pressing', 'holding')
          void btn.offsetWidth
          btnReleasing.add(btn)
          btn.classList.add('releasing')
          setTimeout(() => {
            btn.classList.remove('releasing')
            btnReleasing.delete(btn)
          }, 300)
        }
      }

      // --- Lifecycle ---
      onMounted(() => {
        disposed = false
        initAmll()
        // Restore cover scale based on current play state
        const img = coverImgRef.value
        if (img) {
          img.style.transform = isPlaying.value ? 'scale(1)' : 'scale(0.75)'
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('click', closeQualityPopup)
      })

      onUnmounted(() => {
        disposed = true
        if (coverAnim) { coverAnim.cancel(); coverAnim = null }
        disposeAmll()
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('click', closeQualityPopup)
        btnPressTimers.forEach((t) => clearTimeout(t))
        btnPressTimers.clear()
        btnReleasing.clear()
      })

      // --- Render ---
      const renderCover = () =>
        h('div', { class: 'amms-cover-wrap' }, [
          coverUrl.value
            ? h('img', {
                ref: coverImgRef,
                class: 'amms-cover-img',
                src: coverUrl.value,
                draggable: 'false',
                alt: track.value.name || '专辑封面',
              })
            : h('div', { class: 'amms-cover-placeholder' }, '♫'),
        ])

      const renderTrackInfo = () =>
        h('div', { class: 'amms-track-info' }, [
          h('div', { class: 'amms-track-text' }, [
            h('div', { class: 'amms-track-title' }, trackTitle.value),
            h('div', { class: 'amms-track-artist' }, trackArtist.value),
          ]),
          h('div', { class: 'amms-track-actions' }, [
            h(
              'button',
              {
                class: ['amms-action-btn', isFavorite.value ? 'active' : ''],
                title: '收藏',
                onClick: toggleFavorite,
              },
              h(
                'svg',
                { viewBox: '0 0 24 24', fill: isFavorite.value ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
                h('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' }),
              ),
            ),
            h(
              'button',
              {
                class: 'amms-action-btn',
                title: '更多',
                onClick: () => ctx.ui.lyricsPage.openSkins(),
              },
              h(
                'svg',
                { viewBox: '0 0 24 24', fill: 'currentColor' },
                [
                  h('circle', { cx: '5', cy: '12', r: '2' }),
                  h('circle', { cx: '12', cy: '12', r: '2' }),
                  h('circle', { cx: '19', cy: '12', r: '2' }),
                ],
              ),
            ),
          ]),
        ])

      const renderProgress = () =>
        h('div', { class: 'amms-progress-section' }, [
          h(
            'div',
            {
              ref: progressTrackRef,
              class: 'amms-progress-track',
              onMousedown: handleProgressMouseDown,
            },
            [
              h('div', {
                class: 'amms-progress-fill',
                style: { width: progressPct.value + '%' },
              }, [
                h('div', { class: 'amms-progress-thumb' }),
              ]),
            ],
          ),
          h('div', { class: 'amms-progress-times' }, [
            h('span', { class: 'amms-progress-time' }, currentTimeStr.value),
            qualityLabel.value
              ? h(
                  'button',
                  {
                    ref: qualityPopupRef,
                    class: ['amms-quality-btn', 'has-quality'],
                    title: '音质切换',
                    onClick: toggleQualityPopup,
                  },
                  [
                    qualityLabel.value,
                    showQualityPopup.value
                      ? h('div', { class: 'amms-quality-popup', onClick: (e) => e.stopPropagation() }, [
                          hasCloudSource.value
                            ? h(
                                'div',
                                {
                                  class: ['amms-quality-popup-item', audioQuality.value === 'cloud' ? 'active' : ''],
                                  onClick: () => selectQuality('cloud'),
                                },
                                'CLD 云盘',
                              )
                            : null,
                          ...(qualityOptions.value || []).map((q) =>
                            h(
                              'div',
                              {
                                class: ['amms-quality-popup-item', q.value === audioQuality.value ? 'active' : ''],
                                onClick: () => selectQuality(q.value),
                              },
                              (QUALITY_MAP[q.value] || q.value) + ' ' + (QUALITY_NAMES[q.value] || ''),
                            ),
                          ),
                        ])
                      : null,
                  ],
                )
              : null,
            h('span', { class: 'amms-progress-time right' }, remainTimeStr.value),
          ]),
        ])

      const renderControls = () =>
        h('div', { class: 'amms-playback-controls' }, [
          h(
            'button',
            {
              class: ['amms-ctrl-btn', 'small', playMode.value === 'random' ? 'active' : ''],
              title: '随机播放',
              onClick: () => {
                const idx = PLAY_MODE_ORDER.indexOf(playMode.value)
                const next = PLAY_MODE_ORDER[(idx + 1) % PLAY_MODE_ORDER.length]
                props.page.playback.setMode(next)
              },
              onMousedown: handleBtnMouseDown,
              onMouseup: handleBtnMouseUp,
              onMouseleave: handleBtnMouseLeave,
            },
            h(
              'svg',
              { viewBox: '0 0 1024 1024', fill: 'currentColor' },
              h('path', { d: 'M914.2 705L796.4 596.8c-8.7-8-22.7-1.8-22.7 10V688c-69.5-1.8-134-39.7-169.3-99.8l-45.1-77 47-80.2c34.9-59.6 98.6-97.4 167.4-99.8v60.1c0 11.8 14 17.9 22.7 10l117.8-108.1c5.8-5.4 5.8-14.6 0-19.9L796.4 165c-8.7-8-22.7-1.8-22.7 10v76H758c-4.7 0-9.3 0.8-13.5 2.3-36.5 4.7-72 16.6-104.1 35-42.6 24.4-78.3 59.8-103.1 102.2L513 432l-24.3-41.5c-24.8-42.4-60.5-77.7-103.1-102.2C343 263.9 294.5 251 245.3 251H105c-22.1 0-40 17.9-40 40s17.9 40 40 40h140.3c71.4 0 138.3 38.3 174.4 99.9l47 80.2-45.1 77c-36.2 61.7-103 99.9-174.4 99.9H105c-22.1 0-40 17.9-40 40s17.9 40 40 40l142 0.1h0.2c49.1 0 97.6-12.9 140.2-37.3 42.7-24.4 78.3-59.8 103.2-102.2l22.4-38.3 22.4 38.3c24.8 42.4 60.5 77.8 103.2 102.2 33.1 18.9 69.6 30.9 107.3 35.4 3.8 1.2 7.8 1.8 11.9 1.8l15.9 0.1v55c0 11.8 14 17.9 22.7 10L914.2 725c5.9-5.5 5.9-14.7 0-20z' }),
            ),
          ),
          h('div', { class: 'amms-center-btns' }, [
            h(
              'button',
              {
                class: 'amms-ctrl-btn prev-next',
                title: '上一首',
                onClick: playPrev,
                onMousedown: handleBtnMouseDown,
                onMouseup: handleBtnMouseUp,
                onMouseleave: handleBtnMouseLeave,
              },
              h(
                'svg',
                { viewBox: '0 0 1760 1024', fill: 'currentColor' },
                [
                  h('path', { d: 'M1583.875213 61.297893L979.727337 410.384197a115.842628 115.842628 0 0 0-58.700524 103.894734 117.401049 117.401049 0 0 0 58.700524 103.894734l604.147876 348.566831a117.401049 117.401049 0 0 0 176.101573-103.894734V163.114732a117.401049 117.401049 0 0 0-176.101573-101.816839z' }),
                  h('path', { d: 'M727.263135 17.662105L64.414735 400.514198a129.348943 129.348943 0 0 0 0 223.373677L727.263135 1006.739968a128.82947 128.82947 0 0 0 193.244204-111.686839V129.348943A128.82947 128.82947 0 0 0 727.263135 17.662105z' }),
                ],
              ),
            ),
            h(
              'button',
              {
                class: 'amms-ctrl-btn play-btn',
                title: '播放/暂停',
                onClick: togglePlay,
                onMousedown: handleBtnMouseDown,
                onMouseup: handleBtnMouseUp,
                onMouseleave: handleBtnMouseLeave,
              },
              isPlaying.value
                ? h(
                    'svg',
                    { viewBox: '0 0 1024 1024', fill: 'currentColor' },
                    [
                      h('path', { d: 'M383 95H255c-35.35 0-64 28.65-64 64v704c0 35.35 28.65 64 64 64h128c35.35 0 64-28.65 64-64V159c0-35.35-28.65-64-64-64z' }),
                      h('path', { d: 'M767 95H639c-35.35 0-64 28.65-64 64v704c0 35.35 28.65 64 64 64h128c35.35 0 64-28.65 64-64V159c0-35.35-28.65-64-64-64z' }),
                    ],
                  )
                : h(
                    'svg',
                    { viewBox: '0 0 1024 1024', fill: 'currentColor' },
                    h('path', { d: 'M852.2496 392.448c104.6848 66.0288 104.6272 173.1136 0 239.104l-573.1008 361.472C174.464 1059.04 89.6 1016.0448 89.6 897.1328V126.8608C89.6 7.8848 174.5216-35.0144 279.1488 30.976l573.1008 361.472z' }),
                  ),
            ),
            h(
              'button',
              {
                class: 'amms-ctrl-btn prev-next',
                title: '下一首',
                onClick: playNext,
                onMousedown: handleBtnMouseDown,
                onMouseup: handleBtnMouseUp,
                onMouseleave: handleBtnMouseLeave,
              },
              h(
                'svg',
                { viewBox: '0 0 1760 1024', fill: 'currentColor' },
                h('g', { transform: 'translate(1760, 0) scale(-1, 1)' }, [
                  h('path', { d: 'M1583.875213 61.297893L979.727337 410.384197a115.842628 115.842628 0 0 0-58.700524 103.894734 117.401049 117.401049 0 0 0 58.700524 103.894734l604.147876 348.566831a117.401049 117.401049 0 0 0 176.101573-103.894734V163.114732a117.401049 117.401049 0 0 0-176.101573-101.816839z' }),
                  h('path', { d: 'M727.263135 17.662105L64.414735 400.514198a129.348943 129.348943 0 0 0 0 223.373677L727.263135 1006.739968a128.82947 128.82947 0 0 0 193.244204-111.686839V129.348943A128.82947 128.82947 0 0 0 727.263135 17.662105z' }),
                ]),
              ),
            ),
          ]),
          h(
            'button',
            {
              class: ['amms-ctrl-btn', 'small', playMode.value === 'list' ? 'active' : ''],
              title: '列表循环',
              onClick: cycleMode,
              onMousedown: handleBtnMouseDown,
              onMouseup: handleBtnMouseUp,
              onMouseleave: handleBtnMouseLeave,
            },
            h(
              'svg',
              { viewBox: '0 0 1167 1024', fill: 'currentColor' },
              [
                h('path', { d: 'M146.45833314 644.4249998c21.62499961-6.00000029 34.27499971-28.4000001 28.27500029-50.00000009-6.72500039-24.2499999-10.14999961-49.42500029-10.14999961-74.87499991 0-153.8499999 125.17499971-279.02499961 279.02499961-279.02499961l378.0749997 1e-8L821.68333313 312.49999971c0 23.10000029 16.07500019 32.0500002 35.7000003 19.8749997l173.22500039-107.30000039c19.6250001-12.17499961 19.82499961-32.37500039 0.42500039-44.8999998L856.95833304 67.7499998c-19.4000001-12.52500029-35.2749999-3.8750001-35.27499991 19.19999971l0 72.3250002L443.58333294 159.27499971c-96.22500029 0-186.6999999 37.4749998-254.7500001 105.525C120.80833314 332.8499999 83.33333333 423.32500039 83.33333333 519.5499998c0 32.7999999 4.42500029 65.3000001 13.12499971 96.6250002 5.0000001 17.97500039 21.3249999 29.7500001 39.12500039 29.7500001C139.15833294 645.9250001 142.83333353 645.44999961 146.45833314 644.4249998z' }),
                h('path', { d: 'M1082.33333333 391.74999981C1077.33333323 373.77500029 1061.00833343 361.99999971 1043.20833294 361.99999971c-3.6 0-7.2500001 0.47499961-10.90000019 1.50000029-21.62499961 6.00000029-34.27499971 28.4000001-28.2750003 50.0000001 6.72500039 24.2499999 10.14999961 49.42500029 10.14999961 74.8749999 0 153.8499999-125.17499971 279.02499961-279.02499961 279.02499961L357.10833323 767.39999961l0-71.97500039c0-23.10000029-16.07500019-32.0500002-35.70000029-19.87499971l-173.22500039 107.30000039c-19.6250001 12.17499961-19.82499961 32.37500039-0.42500039 44.89999981l174.04999981 112.42500029c19.40000029 3.8750001 35.2749999-19.19999971 0-72.32500019 0-72.32500019 378.07499971 0c96.22500029 0 186.6999999-37.4749998 254.75000009-105.525 68.05000019-68.05000019 105.525-158.5249998 105.525-254.7500001C1095.43333343 455.59999971 1091.03333362 423.0749999 1082.33333333 391.74999981z' }),
              ],
            ),
          ),
        ])

      return () =>
        h('div', { class: 'amms-root' }, [
          // Blur background
          h('div', {
            class: 'amms-blur-bg',
            style: coverUrl.value
              ? { backgroundImage: `url(${coverUrl.value})` }
              : undefined,
          }),
          // Left panel
          h('div', { class: 'amms-left-panel' }, [
            h('div', { class: 'amms-left-content' }, [
              renderCover(),
              renderTrackInfo(),
              renderProgress(),
              renderControls(),
            ]),
          ]),
          // Right panel - AMLL lyrics
          h('div', {
            class: 'amms-right-panel',
            style: {
              '--amll-font-scale': settings.value.fontScale / 100,
              '--amll-font-weight': settings.value.fontWeight,
            },
          }, [
            h('div', {
              class: 'amms-lyrics-container',
            }, [
              h('div', { ref: playerAreaRef, class: 'amms-amll-area' }),
            ]),
          ]),
        ])
    },
  })
}
