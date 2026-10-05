import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL("../scroll-assistant/index.js", import.meta.url),
  "utf8",
);

function harness() {
  const mounted = [],
    unmounted = [],
    watches = [],
    routeHooks = [];
  let metrics = { canScroll: true, distanceToBottom: 1000 };
  const frames = new Map();
  let frameId = 0;
  let containers = [],
    overlay = false,
    render;
  class Element {
    constructor(name) {
      this.name = name;
      this.visible = true;
      this.connected = true;
      this.listeners = new Set();
      this.descendants = new Set();
    }
    getBoundingClientRect() {
      return { width: 600, height: 400, right: 900, bottom: 600 };
    }
    checkVisibility() {
      return this.visible;
    }
    addEventListener(_, handler) {
      this.listeners.add(handler);
    }
    removeEventListener(_, handler) {
      this.listeners.delete(handler);
    }
    contains(node) {
      return node === this || this.descendants.has(node);
    }
    matches() {
      return false;
    }
    querySelector() {
      return null;
    }
  }
  const player = { isLyricViewOpen: false };
  const scrollCalls = [];
  const observers = [];
  const document = {
    body: {},
    contains: (el) => el.connected,
    querySelector: (selector) =>
      selector === ".lyric-page" && overlay ? {} : null,
  };
  const window = {
    innerWidth: 1000,
    innerHeight: 800,
    getComputedStyle: (el) => ({
      display: "block",
      visibility: el.visible ? "visible" : "hidden",
    }),
    requestAnimationFrame: (cb) => {
      frames.set(++frameId, cb);
      return frameId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    addEventListener() {},
    removeEventListener() {},
  };
  const context = vm.createContext({
    window,
    document,
    Element,
    HTMLElement: Element,
    MutationObserver: class {
      constructor(fn) {
        this.fn = fn;
        this.connected = true;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.connected = false;
      }
    },
  });
  vm.runInContext(source.replaceAll("export ", ""), context);
  const ctx = {
    stores: { player },
    icons: {},
    storage: { get: async () => null },
    css: { inject: () => () => {} },
    vue: {
      reactive: (value) => value,
      ref: (value) => ({ value }),
      computed: (getter) => ({
        get value() {
          return getter();
        },
      }),
      defineComponent: (value) => value,
      defineAsyncComponent: (value) => value,
      resolveComponent: () => "Icon",
      h: (type, props, children) => ({ type, props, children }),
      onMounted: (cb) => mounted.push(cb),
      onBeforeUnmount: (cb) => unmounted.push(cb),
      nextTick: (cb) => Promise.resolve().then(cb),
      watch: (_, cb) => {
        watches.push(cb);
        return () => watches.splice(watches.indexOf(cb), 1);
      },
    },
    router: {
      afterEach: (cb) => {
        routeHooks.push(cb);
        return () => routeHooks.splice(routeHooks.indexOf(cb), 1);
      },
    },
    scroll: {
      queryContainers: () => containers,
      getState: () => metrics,
      observeContainers: () => () => {},
      scrollToBottom: (el) => scrollCalls.push(el),
    },
    ui: {
      components: { Switch: {}, Tooltip: "Tooltip" },
      settings: { define: () => () => {} },
      teleport: (component) => {
        render = component.setup();
        return () => unmounted.forEach((cb) => cb());
      },
    },
  };
  return {
    Element,
    setMetrics: (value) => {
      metrics = value;
    },
    player,
    scrollCalls,
    observers,
    routeHooks,
    frames,
    setContainers: (value) => {
      containers = value;
    },
    async start() {
      await context.activate(ctx);
      mounted.forEach((cb) => cb());
      await this.flush();
    },
    async flush() {
      await Promise.resolve();
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((cb) => cb());
    },
    control: () => render().children.default(),
    button: () =>
      render().children.default()?.children[0].children.trigger() ?? null,
    route() {
      routeHooks.forEach((cb) => cb());
    },
    lyric(open) {
      player.isLyricViewOpen = open;
      overlay = open;
      watches.forEach((cb) => cb());
    },
    stop() {
      context.deactivate();
    },
  };
}

test("lyric overlay hides the old page button and restores it on return", async () => {
  const app = harness();
  const page = new app.Element("page");
  app.setContainers([page]);
  await app.start();
  assert.ok(app.button());
  app.lyric(true);
  assert.equal(app.button(), null);
  await app.flush();
  assert.equal(page.listeners.size, 0);
  app.lyric(false);
  await app.flush();
  assert.ok(app.button());
  assert.equal(page.listeners.size, 1);
  app.stop();
});

test("route changes reject a cached hidden page and bind clicks and scroll events to the new page", async () => {
  const app = harness();
  const oldPage = new app.Element("old"),
    nextPage = new app.Element("next");
  app.setContainers([oldPage]);
  await app.start();
  oldPage.visible = false;
  app.setContainers([oldPage, nextPage]);
  app.route();
  assert.equal(app.button(), null);
  await app.flush();
  app.button().props.onClick();
  assert.deepEqual(app.scrollCalls, [nextPage]);
  assert.equal(oldPage.listeners.size, 0);
  assert.equal(nextPage.listeners.size, 1);
  app.setContainers([]);
  app.route();
  await app.flush();
  assert.equal(app.button(), null);
  assert.equal(nextPage.listeners.size, 0);
  app.stop();
});

test("deactivation cancels a pending route rebind and disposes observers and listeners", async () => {
  const app = harness(),
    page = new app.Element("page");
  app.setContainers([page]);
  await app.start();
  app.route();
  app.stop();
  await app.flush();
  assert.equal(page.listeners.size, 0);
  assert.equal(app.frames.size, 0);
  assert.equal(app.routeHooks.length, 0);
  assert.ok(app.observers.every((observer) => !observer.connected));
});

test("floating control uses the host Tooltip and keeps an accessible native button", async () => {
  const app = harness();
  app.setContainers([new app.Element("page")]);
  await app.start();
  const control = app.control();
  assert.equal(control.type, "div");
  assert.equal(control.props.class, "echo-scroll-assistant-position");
  const tooltip = control.children[0];
  assert.equal(tooltip.type, "Tooltip");
  assert.equal(tooltip.props.content, "回到底部");
  assert.equal(app.button().type, "button");
  assert.equal(app.button().props["aria-label"], "回到底部");
  assert.equal(app.button().props.title, undefined);
  app.stop();
});

test("content appended inside the current scroll container refreshes bottom visibility", async () => {
  const app = harness(),
    page = new app.Element("page"),
    content = new app.Element("content");
  page.descendants.add(content);
  app.setContainers([page]);
  app.setMetrics({ canScroll: true, distanceToBottom: 0 });
  await app.start();
  assert.equal(app.button(), null);
  app.setMetrics({ canScroll: true, distanceToBottom: 800 });
  app.observers[0].fn([
    {
      type: "childList",
      target: content,
      addedNodes: [new app.Element("row")],
      removedNodes: [],
    },
  ]);
  await app.flush();
  assert.ok(app.button());
  app.stop();
});

test("unrelated body children do not rescan an existing page", async () => {
  const app = harness(),
    page = new app.Element("page"),
    body = new app.Element("body");
  body.querySelector = () => page;
  app.setContainers([page]);
  await app.start();
  app.observers[0].fn([
    {
      type: "childList",
      target: body,
      addedNodes: [new app.Element("tooltip")],
      removedNodes: [],
    },
  ]);
  assert.equal(app.frames.size, 0);
  app.stop();
});

test("scroll bursts share the already queued animation frame", async () => {
  const app = harness(),
    page = new app.Element("page");
  app.setContainers([page]);
  await app.start();
  const scroll = [...page.listeners][0];
  scroll();
  const firstFrame = [...app.frames.keys()][0];
  scroll();
  scroll();
  assert.deepEqual([...app.frames.keys()], [firstFrame]);
  app.stop();
});

test("a retained click callback cannot scroll after plugin deactivation", async () => {
  const app = harness();
  app.setContainers([new app.Element("page")]);
  await app.start();
  const click = app.button().props.onClick;
  app.stop();
  click();
  assert.equal(app.scrollCalls.length, 0);
});
