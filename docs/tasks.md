# 任务中心 API

插件可以通过 `ctx.tasks` 把长时间运行的工作接入 EchoMusic 任务中心。一次 `register()` 代表一次独立运行，并返回绑定该运行世代的 task handle。

## 快速开始

```js
export function activate(ctx) {
  const task = ctx.tasks.register({
    id: `${ctx.id}:sync-library`,
    name: "同步媒体库",
    status: "running",
    retention: "transient",
    progress: {
      done: 0,
      total: 100,
      percent: 0,
      label: "准备中",
    },
  });

  void runSync(task);
}

async function runSync(task) {
  try {
    for (let done = 0; done < 100; done += 1) {
      if (task.signal.aborted) return;
      await syncOneItem(done, { signal: task.signal });
      task.update({
        progress: {
          done: done + 1,
          total: 100,
          percent: done + 1,
          label: `${done + 1} / 100`,
        },
      });
    }

    task.finish("completed", {
      progress: { label: "同步完成" },
    });
  } catch (error) {
    if (task.signal.aborted) return;
    task.finish("error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
```

## 生命周期

任务状态包括：

- `pending`：等待用户操作，不自动清理；可以提供“开始”“稍后”等按钮。
- `running`：任务正在执行。
- `completed`：任务成功结束。
- `error`：任务失败。
- `aborted`：任务已中止。

生命周期规则：

- `register()` 创建一轮新任务并返回 handle。
- `update()` 只更新当前运行，不允许改变状态。
- `start(patch?)` 将 `pending` 变为 `running`，保留同一个 handle 和 signal。
- `finish()` 是从 `pending` 或 `running` 进入终态的唯一方式。
- 重试或重新运行必须再次调用 `register()`，获得新的 handle。
- 同一插件使用相同 ID 重新注册时，旧 handle 和旧定时器立即失效。
- handle 失效后，`start()`、`update()`、`finish()`、`cancel()` 和 `dismiss()` 返回 `false`。
- 任务被替换、关闭、自动清理或插件停用时，`task.signal` 会触发 abort。
- `finish("aborted")` 会立即触发 abort，并按保留策略展示中止状态。

不要在异步回调中只保存任务 ID，也不要自行维护 `runId`。应直接捕获本次 `register()` 返回的 handle。

## 保留策略

每个任务必须显式声明 `retention`，任务来源和按钮样式不会隐式改变生命周期。

### transient

适用于普通后台工作：

```text
retention: "transient"
```

- `completed`：展示 5 秒后自动清理。
- `aborted`：展示 3 秒后自动清理。
- `error`：保留到用户手动关闭。

### action-required

适用于完成后仍需要安装、确认、查看结果等操作的任务：

```text
retention: "action-required"
```

- `completed`：手动关闭。
- `error`：手动关闭。
- `aborted`：展示 3 秒后自动清理。

任务中心会为手动保留的终态提供统一“关闭”按钮。

### 自定义策略

```text
retention: {
  completed: { mode: "auto", delayMs: 8000 },
  error: { mode: "manual" },
  aborted: { mode: "auto", delayMs: 2000 },
}
```

`delayMs` 必须是 `0` 到 `2147483647` 之间的有限数字。

## Task handle

### active

```js
task.active;
```

表示该 handle 是否仍拥有当前任务条目。终态在保留期间仍为 active；判断业务是否应继续执行时，应同时检查 `task.signal.aborted`。

### signal

```js
task.signal;
```

标准 `AbortSignal`。应传给支持 signal 的 Fetch、读取或业务函数，并在每个不可撤销副作用前检查：

```js
if (!task.active || task.signal.aborted) return;
```

### start(patch?)

将待操作任务开始执行。只有未取消且仍有效的 `pending` handle 返回 `true`；重复开始、终态、已取消或失效的 handle 返回 `false`。业务执行前应检查返回值，防止连点重复启动：

```js
if (!task.start({ actions: [], progress: { label: "执行中" } })) return;
await runWork(task.signal);
```

### update(patch)

更新名称、图标、优先级、进度、错误文本、`items` 明细或 `actions`。普通更新不会延长终态清理时间。

```js
task.update({
  progress: { percent: 60, label: "正在同步" },
});
```

### finish(status, patch?)

结束当前运行。`status` 只能是 `completed`、`error` 或 `aborted`。

```js
task.finish("completed", {
  progress: { label: "处理完成" },
});
```

### cancel()

只触发当前运行的 `AbortSignal`，不删除条目，也不自动改变显示状态。调用方应在业务停止后执行 `finish("aborted")` 或 `dismiss()`。

```js
if (task.cancel()) {
  task.finish("aborted", { progress: { label: "已取消" } });
}
```

### dismiss()

立即移除当前任务并触发 `AbortSignal`。

```js
task.dismiss();
```

## Actions

```js
const task = ctx.tasks.register({
  id: `${ctx.id}:download-model`,
  name: "下载模型",
  status: "running",
  retention: "action-required",
  actions: [
    {
      id: "cancel",
      label: "取消",
      variant: "ghost",
      onClick() {
        if (task.cancel()) {
          task.finish("aborted", { progress: { label: "已取消" } });
        }
      },
    },
  ],
});
```

Action 字段：

- `id`：同一任务内唯一，用作按钮标识。
- `label`：按钮文字。
- `variant`：`ghost`、`primary` 或 `danger`，只控制视觉层级。
- `closePanel`：触发后是否关闭任务中心面板。
- `disabled`：禁用按钮；宿主也会阻止禁用操作的回调执行。
- `onClick`：同步或异步回调。

`variant` 不影响保留策略，Action 失败也不会自动改变任务状态。

## ID 和插件停用

- `echo:` 是主程序保留前缀，插件不能注册。
- 任务 ID 在当前任务中心全局唯一，推荐使用 `${ctx.id}:用途` 命名。
- 插件不能覆盖或操作其他插件的任务。
- 插件开始停用时，任务会话会先失效，所有任务被移除，迟到的异步回调无法重新创建或更新旧任务。

这是破坏性的新任务 API，不提供旧版按 ID `ctx.tasks.update(id, patch)` / `ctx.tasks.dismiss(id)` 兼容层。


## 待操作任务与明细行（EchoMusic 2.3.2-beta.1 起）

新增能力兼容现有 `running` 任务。使用 `pending`、`start()`、`items` 或 `disabled` 的插件应将 manifest 的 `requires.echoMusicVersion` 最低版本设为 `>=2.3.2-beta.1`。`pending` 不是终态，`retention` 只控制结束后的保留时间。宿主不会自动给待操作任务增加“关闭”按钮，可用自定义操作调用 `dismiss()`。

```js
export function activate(ctx) {
  const task = ctx.tasks.register({
    id: `${ctx.id}:apply-changes`,
    name: "发现可同步内容",
    status: "pending",
    retention: "transient",
    items: [
      {
        id: "library",
        name: "媒体库",
        description: "发现 12 条变更",
        statusLabel: "待同步",
        actions: [{ id: "sync", label: "同步", onClick: run }],
      },
    ],
    actions: [
      { id: "later", label: "稍后", onClick: () => task.dismiss() },
      { id: "all", label: "立即同步", variant: "primary", onClick: run },
    ],
  });

  async function run() {
    if (!task.start({
      actions: [],
      items: [{ id: "library", name: "媒体库", statusLabel: "同步中…" }],
    })) return;
    try {
      // 在这里调用插件自己的同步实现，并传入 task.signal。
      await syncLibrary({ signal: task.signal });
      if (task.signal.aborted) return;
      task.finish("completed", {
        items: [{ id: "library", name: "媒体库", statusLabel: "已同步" }],
        progress: { label: "同步完成" },
      });
    } catch (error) {
      if (task.signal.aborted) return;
      task.finish("error", { error: String(error) });
    }
  }
}
```

`items` 是可选的 `TaskItem[]`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 同一任务内稳定且唯一的明细 ID |
| `name` | `string` | 明细名称 |
| `description` | `string?` | 辅助说明，例如版本变化 |
| `statusLabel` | `string?` | 该行的状态文字 |
| `error` | `string?` | 该行的错误原因 |
| `actions` | `TaskAction[]?` | 该行的操作按钮，与任务级按钮遵守相同规则 |

- `task.update({ items })` 替换整份明细数组；传入 `[]` 清空。
- 明细只负责展示，不拥有独立 handle、signal 或保留策略；整张任务统一结束和清理。
- 行内回调同样通过插件运行时执行，受到插件回调错误处理机制管理。
- `disabled` 仅阻止该按钮触发，不会取消已经开始的工作。异步操作还应使用 `start()` 或业务锁防止重复执行。
- 关闭任务中心面板不会取消任务；删除任务条目、停用插件才会中止其 signal。需要“稍后不再提醒”时，插件应自行记住已忽略的内容。
