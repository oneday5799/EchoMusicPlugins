import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createHash } from "node:crypto";
async function fixture(themeId = "prism") {
  const source = readFileSync(
    new URL("../theme-dynamic/index.js", import.meta.url),
    "utf8",
  );
  const timers = new Map(),
    entries = [],
    watchers = [],
    mounted = [],
    unmounted = [];
  let timerId = 0,
    rejects = 0,
    plays = 0;
  const video = {
    paused: true,
    error: null,
    loads: 0,
    play() {
      plays++;
      if (this.error) return Promise.reject({ name: "NotSupportedError" });
      if (rejects-- > 0) return Promise.reject({ name: "NotAllowedError" });
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
    load() {
      this.loads++;
      this.error = null;
      this.paused = true;
    },
    removeAttribute() {},
  };
  const theme = { motionEnabled: { value: true }, imageBlur: { value: 0 } };
  const activate = new Function(
    "setTimeout",
    "clearTimeout",
    source.replace(
      "export async function activate",
      "return async function activate",
    ),
  )(
    (fn) => {
      timers.set(++timerId, fn);
      return timerId;
    },
    (id) => timers.delete(id),
  );
  await activate({
    vue: {
      defineComponent: (value) => value,
      ref: (value) => ({ value }),
      h: (tag, props, children) => {
        if (tag === "video") props.ref.value = video;
        return { tag, props, children };
      },
      watch: (_ref, fn) => watchers.push(fn),
      onMounted: (fn) => mounted.push(fn),
      onBeforeUnmount: (fn) => unmounted.push(fn),
    },
    descriptor: { directory: "/fixture" },
    fs: { getFileUrl: async (path) => ({ ok: true, url: path }) },
    theme: { useTheme: () => theme, register: (entry) => entries.push(entry) },
  });
  const render = entries
    .find((entry) => entry.id === themeId)
    .decorations.background.setup();
  const node = () => render().children.find((child) => child.tag === "video");
  node();
  const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };
  return {
    video,
    timers,
    node,
    flush,
    reject: (count) => {
      rejects = count;
    },
    get plays() {
      return plays;
    },
    mount: () => mounted.forEach((fn) => fn()),
    motion: (enabled) => {
      theme.motionEnabled.value = enabled;
      watchers.forEach((fn) => fn());
    },
    tick: async () => {
      const jobs = [...timers.values()];
      timers.clear();
      jobs.forEach((fn) => fn());
      await flush();
    },
    unmount: () => unmounted.forEach((fn) => fn()),
  };
}
test("transient play failure retries and restores visible animation", async () => {
  const f = await fixture();
  f.reject(1);
  f.mount();
  await f.flush();
  assert.equal(f.node().props.style.opacity, 0);
  assert.equal(f.timers.size, 1);
  await f.tick();
  assert.equal(f.video.paused, false);
  assert.equal(f.node().props.style.opacity, 1);
  assert.equal(f.video.muted, true);
  assert.equal(f.video.playbackRate, 1);
  f.unmount();
});
test("hidden or reduced-motion pauses immediately and resumes without losing readiness", async () => {
  const f = await fixture();
  f.mount();
  await f.flush();
  f.motion(false);
  f.node().props.onPause();
  assert.equal(f.video.paused, true);
  assert.equal(f.timers.size, 0);
  f.motion(true);
  await f.flush();
  assert.equal(f.video.paused, false);
  assert.equal(f.node().props.style.opacity, 1);
  f.unmount();
});
test("media errors reload with bounded retries and a visibility change allows recovery", async () => {
  const f = await fixture();
  f.reject(10);
  f.mount();
  await f.flush();
  for (let i = 0; i < 3; i++) await f.tick();
  assert.equal(f.plays, 4);
  assert.equal(f.timers.size, 0);
  f.motion(false);
  f.reject(0);
  f.video.error = { code: 2 };
  f.motion(true);
  await f.flush();
  f.node().props.onError();
  await f.tick();
  assert.ok(f.video.loads > 0);
  assert.equal(f.node().props.style.opacity, 1);
  f.unmount();
});
test("unmount cancels pending retries and releases the media element", async () => {
  const f = await fixture();
  f.reject(1);
  f.mount();
  await f.flush();
  f.unmount();
  assert.equal(f.timers.size, 0);
  assert.equal(f.video.paused, true);
  assert.equal(f.video.loads, 1);
  const plays = f.plays;
  await f.tick();
  assert.equal(f.plays, plays);
});

test("prism and golden ribbon use normal speed after resume", async () => {
  for (const [id, rate] of [
    ["prism", 1],
    ["golden-ribbon", 1],
  ]) {
    const f = await fixture(id);
    f.mount();
    await f.flush();
    assert.equal(f.video.playbackRate, rate);
    f.motion(false);
    f.motion(true);
    await f.flush();
    assert.equal(f.video.playbackRate, rate);
    assert.equal(f.video.defaultPlaybackRate, rate);
    f.unmount();
  }
});

const packs = {
  static: ["sky-of-love", "honey-pink"],
  dynamic: ["autumn", "prism", "golden-ribbon", "willow", "ferris-wheel"],
};
for (const [kind, ids] of Object.entries(packs)) {
  test(`${kind} pack registers all themes with isolated local assets`, async () => {
    const directory = new URL(`../theme-${kind}/`, import.meta.url);
    const manifest = JSON.parse(
      readFileSync(new URL("manifest.json", directory), "utf8"),
    );
    const configs = JSON.parse(
      readFileSync(new URL("themes.json", directory), "utf8"),
    );
    const provenance = JSON.parse(
      readFileSync(new URL("provenance.json", directory), "utf8"),
    );
    const source = readFileSync(new URL("index.js", directory), "utf8");
    const { activate } = await import(
      "data:text/javascript;base64," + Buffer.from(source).toString("base64")
    );
    const entries = [],
      files = [];
    const ctx = {
      vue: { defineComponent: (x) => x },
      descriptor: { directory: "/isolated" },
      fs: {
        getFileUrl: async (p) => {
          const file = p.replace("/isolated/", "");
          assert.ok(readFileSync(new URL(file, directory)).length > 0);
          files.push(file);
          return { ok: true, url: "file://" + p };
        },
      },
      theme: { register: (entry) => entries.push(entry) },
    };
    await activate(ctx);
    assert.equal(manifest.id, `theme-${kind}`);
    assert.deepEqual(manifest.tags, [kind === "static" ? "静态" : "动态"]);
    assert.deepEqual(
      entries.map((entry) => entry.id),
      ids,
    );
    assert.deepEqual(
      files.sort(),
      configs.flatMap((c) => c.files.map((f) => `assets/${c.id}/${f}`)).sort(),
    );
    for (const config of configs) {
      const entry = entries.find((entry) => entry.id === config.id);
      assert.equal(entry.title, config.title);
      assert.equal(entry.type, kind === "static" ? "default" : "dynamic");
      assert.equal(Boolean(entry.decorations), kind === "dynamic");
      assert.equal(entry.variants.light.accent, config.accent);
      assert.equal(entry.variants.dark.tokens.shell, config.shell);
      assert.doesNotMatch(
        manifest.name + manifest.description + entry.description,
        /QQ|本机|适配|插件提供/,
      );
      assert.ok(entry.preview.includes(`/assets/${config.id}/`));
      for (const asset of provenance[config.id].assets) {
        assert.equal(
          createHash("sha256")
            .update(readFileSync(new URL(asset.file, directory)))
            .digest("hex"),
          asset.sha256,
        );
      }
    }
    let registrations = 0;
    await assert.rejects(
      activate({
        ...ctx,
        fs: { getFileUrl: async () => ({ ok: false }) },
        theme: { register: () => registrations++ },
      }),
    );
    assert.equal(registrations, 0);
  });
}

test("catalog contains two theme packs and no per-theme plugins", () => {
  const catalog = JSON.parse(
    readFileSync(new URL("../echo-plugins.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(
    catalog.plugins
      .filter((p) => p.id.startsWith("theme-"))
      .map((p) => p.id)
      .sort(),
    ["theme-dynamic", "theme-static"],
  );
});

for (const id of ["willow", "ferris-wheel"]) {
  test(`${id} pauses, resumes, resizes without restarting, and releases sprite animations`, async () => {
    const source = readFileSync(
      new URL("../theme-dynamic/index.js", import.meta.url),
      "utf8",
    );
    const config = JSON.parse(
      readFileSync(
        new URL("../theme-dynamic/themes.json", import.meta.url),
        "utf8",
      ),
    ).find((config) => config.id === id);
    const mounted = [],
      unmounted = [],
      watchers = [],
      animations = [];
    let render,
      resize,
      disconnected = false;
    const theme = { motionEnabled: { value: false }, imageBlur: { value: 0 } };
    const root = { clientWidth: 1380, clientHeight: 780 };
    const canvas = {
      style: {},
      querySelectorAll: () =>
        config.layers.map(() => ({
          animate: () => {
            const animation = {
              state: "running",
              play() {
                this.state = "running";
              },
              pause() {
                this.state = "paused";
              },
              cancel() {
                this.state = "cancelled";
              },
            };
            animations.push(animation);
            return animation;
          },
        })),
    };
    const activate = new Function(
      "ResizeObserver",
      source.replace(
        "export async function activate",
        "return async function activate",
      ),
    )(
      class {
        constructor(fn) {
          resize = fn;
        }
        observe() {}
        disconnect() {
          disconnected = true;
        }
      },
    );
    await activate({
      vue: {
        defineComponent: (x) => x,
        ref: (value) => ({ value }),
        watch: (_ref, fn) => watchers.push(fn),
        onMounted: (fn) => mounted.push(fn),
        onBeforeUnmount: (fn) => unmounted.push(fn),
        h: (tag, props, children) => {
          if (props?.ref)
            props.ref.value = props.style.width === "1380px" ? canvas : root;
          return { tag, props, children };
        },
      },
      descriptor: { directory: "/isolated" },
      fs: { getFileUrl: async (p) => ({ ok: true, url: p }) },
      theme: {
        useTheme: () => theme,
        register: (entry) => {
          if (entry.id === id) render = entry.decorations.background.setup();
        },
      },
    });
    render();
    mounted.forEach((fn) => fn());
    assert.ok(animations.length >= 5);
    assert.ok(animations.every((a) => a.state === "paused"));
    theme.motionEnabled.value = true;
    watchers.forEach((fn) => fn());
    assert.ok(animations.every((a) => a.state === "running"));
    const count = animations.length;
    root.clientHeight = 1560;
    resize();
    assert.match(canvas.style.transform, /scale\(2\)/);
    assert.equal(animations.length, count);
    unmounted.forEach((fn) => fn());
    assert.equal(disconnected, true);
    assert.ok(animations.every((a) => a.state === "cancelled"));
  });
}

test("plugin index links both packs to their installation directories", () => {
  const index = JSON.parse(
    readFileSync(new URL("../echo-plugins.json", import.meta.url), "utf8"),
  );
  for (const id of Object.keys(packs)) {
    const entries = index.plugins.filter((entry) => entry.id === `theme-${id}`);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].path, `theme-${id}`);
  }
  assert.ok(!index.plugins.some((entry) => entry.id === "qq-local-themes"));
});
