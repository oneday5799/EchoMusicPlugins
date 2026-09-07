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
      getState: () => ({ canScroll: true, distanceToBottom: 1000 }),
      observeContainers: () => () => {},
      scrollToBottom: (el) => scrollCalls.push(el),
    },
    ui: {
      components: { Switch: {} },
      settings: { define: () => () => {} },
      teleport: (component) => {
        render = component.setup();
        return () => unmounted.forEach((cb) => cb());
      },
    },
  };
  return {
    Element,
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
    button: () => render().children.default(),
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
