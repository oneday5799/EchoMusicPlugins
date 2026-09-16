const STORAGE_KEY = "settings";
const CHANNEL_NAME = "echo-plugin:mouse-gesture:settings";

const GESTURE_ACTIONS = {
  next: "下一曲",
  prev: "上一曲",
  toggle: "暂停/播放",
  forward: "前进",
  back: "后退",
  scrollToTop: "快速到顶",
  scrollToBottom: "快速到底",
  none: "禁用",
};

const DEFAULT_SETTINGS = {
  showTrail: true,
  trailColorMode: "accent",
  trailColor: "#6366f1",
  trailWidth: 3,
  minDistance: 50,
  circleThreshold: 300,
  diagonalThreshold: 0.4,
  gestures: {
    leftDown: "next",
    leftUp: "prev",
    leftRight: "forward",
    leftLeft: "back",
    leftDiagLess: "none",
    leftDiagGreater: "none",
    leftCircle: "toggle",
    leftWheelDown: "scrollToBottom",
    leftWheelUp: "none",
    rightDown: "next",
    rightUp: "prev",
    rightRight: "forward",
    rightLeft: "back",
    rightDiagLess: "none",
    rightDiagGreater: "none",
    rightCircle: "toggle",
    rightWheelDown: "scrollToTop",
    rightWheelUp: "none",
  },
};

const normalizeSettings = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const gestures = { ...DEFAULT_SETTINGS.gestures, ...(source.gestures || {}) };
  return { ...DEFAULT_SETTINGS, ...source, gestures };
};

export async function activate(ctx) {
  const { defineAsyncComponent, defineComponent, h, reactive } = ctx.vue;
  const Button = defineAsyncComponent(ctx.ui.components.Button);
  const Switch = defineAsyncComponent(ctx.ui.components.Switch);
  const Slider = defineAsyncComponent(ctx.ui.components.Slider);
  const Select = defineAsyncComponent(ctx.ui.components.Select);

  let settings = { ...DEFAULT_SETTINGS };
  let channel = null;
  let currentAccentColor = "#6366f1";
  let disposeAppearance = null;
  let settingsDispose = null;

  // 轨迹 canvas 相关
  let trailCanvas = null;
  let trailCtx = null;

  const getTrailColor = () => {
    if (settings.trailColorMode === "accent") {
      return currentAccentColor;
    }
    return settings.trailColor;
  };

  const createTrailCanvas = () => {
    if (!settings.showTrail) return;
    trailCanvas = document.createElement("canvas");
    trailCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 99999;
    `;
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
    document.body.appendChild(trailCanvas);
    trailCtx = trailCanvas.getContext("2d");
  };

  const clearTrailCanvas = () => {
    if (trailCanvas) {
      trailCanvas.remove();
      trailCanvas = null;
      trailCtx = null;
    }
  };

  const drawTrail = (points) => {
    if (!trailCtx || points.length < 2) return;

    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    trailCtx.beginPath();
    trailCtx.strokeStyle = getTrailColor();
    trailCtx.lineWidth = settings.trailWidth;
    trailCtx.lineCap = "round";
    trailCtx.lineJoin = "round";

    trailCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      trailCtx.lineTo(points[i].x, points[i].y);
    }
    trailCtx.stroke();
  };

  const applySettings = (newSettings) => {
    settings = normalizeSettings(newSettings);
  };

  const broadcastSettings = (newSettings) => {
    const normalized = normalizeSettings(newSettings);
    channel?.postMessage({ type: "settings", settings: normalized });
  };

  const findScrollableContainer = () => {
    const containers = ctx.scroll?.queryContainers?.({ visible: true });
    return containers?.find((el) => ctx.scroll?.getState?.(el)?.canScroll);
  };

  const executeAction = (action) => {
    if (action === "none") return;

    switch (action) {
      case "next":
        ctx.player.next();
        ctx.toast.info("下一曲");
        break;
      case "prev":
        ctx.player.prev();
        ctx.toast.info("上一曲");
        break;
      case "toggle":
        ctx.player.toggle();
        ctx.toast.info(ctx.player.isPlaying.value ? "暂停" : "播放");
        break;
      case "forward":
        window.history.forward();
        ctx.toast.info("前进");
        break;
      case "back":
        window.history.back();
        ctx.toast.info("后退");
        break;
      case "scrollToTop": {
        const container = findScrollableContainer();
        if (container) ctx.scroll.scrollToTop(container, { behavior: "auto" });
        ctx.toast.info("快速到顶");
        break;
      }
      case "scrollToBottom": {
        const container = findScrollableContainer();
        if (container) ctx.scroll.scrollToBottom(container, { behavior: "auto" });
        ctx.toast.info("快速到底");
        break;
      }
    }
  };

  const gestureState = {
    isMouseDown: false,
    mouseButton: null,
    startX: 0,
    startY: 0,
    points: [],
    wheelHandled: false,
  };

  const getDirection = (startX, startY, endX, endY, minDistance) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < minDistance && absDy < minDistance) return null;

    const ratio = absDx === 0 ? Infinity : absDy / absDx;
    const isDiagonal =
      ratio > 1 - settings.diagonalThreshold &&
      ratio < 1 + settings.diagonalThreshold;

    if (isDiagonal && absDx >= minDistance * 0.7 && absDy >= minDistance * 0.7) {
      if (dx > 0 && dy > 0) return "DiagGreater";
      if (dx < 0 && dy > 0) return "DiagLess";
      if (dx > 0 && dy < 0) return "DiagLess";
      if (dx < 0 && dy < 0) return "DiagGreater";
    }

    if (absDx > absDy) {
      return dx > 0 ? "Right" : "Left";
    } else {
      return dy > 0 ? "Down" : "Up";
    }
  };

  const detectCircle = (points, threshold) => {
    if (points.length < 10) return false;

    let totalAngle = 0;
    for (let i = 2; i < points.length; i++) {
      const p1 = points[i - 2];
      const p2 = points[i - 1];
      const p3 = points[i];

      const v1x = p2.x - p1.x;
      const v1y = p2.y - p1.y;
      const v2x = p3.x - p2.x;
      const v2y = p3.y - p2.y;

      const cross = v1x * v2y - v1y * v2x;
      const dot = v1x * v2x + v1y * v2y;
      const angle = Math.atan2(cross, dot);
      totalAngle += (angle * 180) / Math.PI;
    }

    return Math.abs(totalAngle) > threshold;
  };

  const getGestureKey = (button, direction) => {
    const prefix = button === 0 ? "left" : "right";
    return `${prefix}${direction}`;
  };

  const handleMouseDown = (e) => {
    if (e.target.closest("input, select, textarea, button, a")) return;

    gestureState.isMouseDown = true;
    gestureState.mouseButton = e.button;
    gestureState.startX = e.clientX;
    gestureState.startY = e.clientY;
    gestureState.points = [{ x: e.clientX, y: e.clientY }];
    gestureState.wheelHandled = false;
    
    createTrailCanvas();
  };

  const handleMouseMove = (e) => {
    if (!gestureState.isMouseDown) return;

    gestureState.points.push({ x: e.clientX, y: e.clientY });

    if (gestureState.points.length > 100) {
      gestureState.points = gestureState.points.slice(-50);
    }
    
    drawTrail(gestureState.points);
  };

  const handleMouseUp = (e) => {
    if (!gestureState.isMouseDown) return;

    gestureState.isMouseDown = false;
    clearTrailCanvas();

    if (gestureState.wheelHandled) return;

    const { mouseButton, startX, startY, points } = gestureState;

    if (detectCircle(points, settings.circleThreshold)) {
      const key = getGestureKey(mouseButton, "Circle");
      executeAction(settings.gestures[key]);
      return;
    }

    const direction = getDirection(
      startX,
      startY,
      e.clientX,
      e.clientY,
      settings.minDistance,
    );

    if (direction) {
      const key = getGestureKey(mouseButton, direction);
      executeAction(settings.gestures[key]);
    }
  };

  const handleWheel = (e) => {
    if (!gestureState.isMouseDown) return;

    e.preventDefault();
    e.stopPropagation();

    gestureState.wheelHandled = true;

    const suffix = e.deltaY > 0 ? "Down" : "Up";
    const key = getGestureKey(gestureState.mouseButton, `Wheel${suffix}`);
    executeAction(settings.gestures[key]);
  };

  const handleContextMenu = (e) => {
    if (gestureState.isMouseDown) {
      e.preventDefault();
    }
  };

  document.addEventListener("mousedown", handleMouseDown, true);
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("mouseup", handleMouseUp, true);
  document.addEventListener("wheel", handleWheel, { capture: true, passive: false });
  document.addEventListener("contextmenu", handleContextMenu, true);

  ctx.dispose(() => {
    clearTrailCanvas();
    document.removeEventListener("mousedown", handleMouseDown, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("mouseup", handleMouseUp, true);
    document.removeEventListener("wheel", handleWheel, { capture: true });
    document.removeEventListener("contextmenu", handleContextMenu, true);
    disposeAppearance?.();
    disposeAppearance = null;
    settingsDispose?.();
    settingsDispose = null;
    channel?.close();
    channel = null;
  });

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event) => {
    if (event.data?.type === "settings") {
      applySettings(event.data.settings);
    }
  };

  const saved = await ctx.storage.get(STORAGE_KEY);
  if (saved) applySettings(saved);

  // 订阅主题色变化
  if (ctx.appearance?.onSnapshot) {
    disposeAppearance = ctx.appearance.onSnapshot((snapshot) => {
      if (snapshot?.accentColor) {
        currentAccentColor = snapshot.accentColor;
      }
    });
  }

  const SettingsPanel = defineComponent({
    setup() {
      const SETTINGS_FIELDS = [
        "showTrail", "trailColorMode", "trailColor", "trailWidth",
        "minDistance", "circleThreshold", "diagonalThreshold",
      ];

      const draft = reactive({
        ...DEFAULT_SETTINGS,
        gestures: { ...DEFAULT_SETTINGS.gestures },
      });

      ctx.storage.get(STORAGE_KEY).then((saved) => {
        if (saved) {
          const normalized = normalizeSettings(saved);
          SETTINGS_FIELDS.forEach((k) => {
            draft[k] = normalized[k];
          });
          Object.assign(draft.gestures, normalized.gestures);
        }
      });

      const actionOptions = Object.entries(GESTURE_ACTIONS).map(
        ([value, label]) => ({ label, value }),
      );

      const gestureLabels = {
        leftDown: "左键 ↓",
        leftUp: "左键 ↑",
        leftRight: "左键 →",
        leftLeft: "左键 ←",
        leftDiagLess: "左键 /",
        leftDiagGreater: "左键 \\",
        leftCircle: "左键 ○",
        leftWheelDown: "左键+滚轮↓",
        leftWheelUp: "左键+滚轮↑",
        rightDown: "右键 ↓",
        rightUp: "右键 ↑",
        rightRight: "右键 →",
        rightLeft: "右键 ←",
        rightDiagLess: "右键 /",
        rightDiagGreater: "右键 \\",
        rightCircle: "右键 ○",
        rightWheelDown: "右键+滚轮↓",
        rightWheelUp: "右键+滚轮↑",
      };

      const leftGestureKeys = [
        "leftDown", "leftUp", "leftRight", "leftLeft",
        "leftDiagLess", "leftDiagGreater", "leftCircle",
        "leftWheelDown", "leftWheelUp",
      ];
      const rightGestureKeys = [
        "rightDown", "rightUp", "rightRight", "rightLeft",
        "rightDiagLess", "rightDiagGreater", "rightCircle",
        "rightWheelDown", "rightWheelUp",
      ];

      const renderGestureItem = (key) =>
        h(
          "label",
          {
            key,
            style:
              "display: flex; justify-content: space-between; align-items: center; gap: 4px;",
          },
          [
            h(
              "span",
              { style: "flex-shrink: 0; min-width: 80px;" },
              gestureLabels[key],
            ),
            h(Select, {
              style: "flex: 1;",
              modelValue: draft.gestures[key],
              options: actionOptions,
              "onUpdate:modelValue": (value) => {
                draft.gestures[key] = String(value || "none");
              },
            }),
          ],
        );

      const save = async () => {
        const data = {
          ...Object.fromEntries(SETTINGS_FIELDS.map((k) => [k, draft[k]])),
          gestures: { ...draft.gestures },
        };
        await ctx.storage.set(STORAGE_KEY, data);
        applySettings(data);
        broadcastSettings(data);
        ctx.toast.success("设置已保存");
      };

      const reset = async () => {
        SETTINGS_FIELDS.forEach((k) => {
          draft[k] = DEFAULT_SETTINGS[k];
        });
        Object.assign(draft.gestures, DEFAULT_SETTINGS.gestures);
        await save();
        ctx.toast.info("已恢复默认设置");
      };

      return () =>
        h("div", { style: "display: grid; gap: 16px;" }, [
          h(
            "label",
            {
              style:
                "display: flex; justify-content: space-between; align-items: center;",
            },
            [
              h("span", null, "显示轨迹线"),
              h(Switch, {
                modelValue: draft.showTrail,
                "onUpdate:modelValue": (value) => {
                  draft.showTrail = Boolean(value);
                },
              }),
            ],
          ),

          h(
            "label",
            {
              style:
                "display: flex; justify-content: space-between; align-items: center; gap: 8px;",
            },
            [
              h("span", null, "轨迹颜色"),
              h(Select, {
                style: "flex: 1; max-width: 150px;",
                modelValue: draft.trailColorMode,
                options: [
                  { label: "跟随主题色", value: "accent" },
                  { label: "自定义颜色", value: "custom" },
                ],
                "onUpdate:modelValue": (value) => {
                  draft.trailColorMode = String(value || "accent");
                },
              }),
            ],
          ),
          draft.trailColorMode === "custom"
            ? h("input", {
                type: "color",
                value: draft.trailColor,
                onInput: (e) => {
                  draft.trailColor = e.target.value;
                },
                style: "width: 100%; height: 32px; border: none; cursor: pointer; border-radius: 4px;",
              })
            : null,

          h("div", { style: "display: grid; gap: 8px;" }, [
            h(
              "label",
              {
                style:
                  "display: flex; justify-content: space-between; align-items: center;",
              },
              [
                h("span", null, "轨迹宽度"),
                h(
                  "span",
                  { style: "color: var(--color-text-secondary);" },
                  `${draft.trailWidth}px`,
                ),
              ],
            ),
            h(Slider, {
              modelValue: draft.trailWidth,
              min: 1,
              max: 10,
              step: 1,
              "onUpdate:modelValue": (value) => {
                draft.trailWidth = Number(value);
              },
            }),
          ]),

          h("div", { style: "display: grid; gap: 8px;" }, [
            h(
              "label",
              {
                style:
                  "display: flex; justify-content: space-between; align-items: center;",
              },
              [
                h("span", null, "最小滑动距离"),
                h(
                  "span",
                  { style: "color: var(--color-text-secondary);" },
                  `${draft.minDistance}px`,
                ),
              ],
            ),
            h(Slider, {
              modelValue: draft.minDistance,
              min: 20,
              max: 150,
              step: 5,
              "onUpdate:modelValue": (value) => {
                draft.minDistance = Number(value);
              },
            }),
          ]),

          h("div", { style: "display: grid; gap: 8px;" }, [
            h(
              "label",
              {
                style:
                  "display: flex; justify-content: space-between; align-items: center;",
              },
              [
                h("span", null, "画圈检测阈值"),
                h(
                  "span",
                  { style: "color: var(--color-text-secondary);" },
                  `${draft.circleThreshold}°`,
                ),
              ],
            ),
            h(Slider, {
              modelValue: draft.circleThreshold,
              min: 180,
              max: 500,
              step: 10,
              "onUpdate:modelValue": (value) => {
                draft.circleThreshold = Number(value);
              },
            }),
          ]),

          h("div", { style: "display: grid; gap: 8px;" }, [
            h(
              "label",
              {
                style:
                  "display: flex; justify-content: space-between; align-items: center;",
              },
              [
                h("span", null, "对角线灵敏度"),
                h(
                  "span",
                  { style: "color: var(--color-text-secondary);" },
                  `${(draft.diagonalThreshold * 100).toFixed(0)}%`,
                ),
              ],
            ),
            h(Slider, {
              modelValue: draft.diagonalThreshold,
              min: 0.2,
              max: 0.6,
              step: 0.05,
              "onUpdate:modelValue": (value) => {
                draft.diagonalThreshold = Number(value);
              },
            }),
          ]),

          h(
            "div",
            {
              style:
                "border-top: 1px solid var(--color-border); padding-top: 12px;",
            },
            [
              h(
                "div",
                { style: "display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" },
                [
                  h("div", { style: "display: grid; gap: 6px;" }, [
                    h("div", { style: "font-weight: 500; margin-bottom: 4px;" }, "左键手势"),
                    leftGestureKeys.map(renderGestureItem),
                  ]),
                  h("div", { style: "display: grid; gap: 6px;" }, [
                    h("div", { style: "font-weight: 500; margin-bottom: 4px;" }, "右键手势"),
                    rightGestureKeys.map(renderGestureItem),
                  ]),
                ],
              ),
            ],
          ),

          h("div", { style: "display: flex; gap: 8px; margin-top: 8px;" }, [
            h(Button, { size: "xs", onClick: save }, { default: () => "保存" }),
            h(
              Button,
              { size: "xs", variant: "outline", onClick: reset },
              { default: () => "恢复默认" },
            ),
            h(
              Button,
              {
                size: "xs",
                variant: "outline",
                onClick: async () => {
                  Object.keys(draft.gestures).forEach((key) => {
                    draft.gestures[key] = "none";
                  });
                  await save();
                },
              },
              { default: () => "全部禁用" },
            ),
          ]),
        ]);
    },
  });

  settingsDispose = ctx.ui.settings.define({
    title: "鼠标手势设置",
    component: SettingsPanel,
  });
}
