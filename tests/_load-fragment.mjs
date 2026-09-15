// 从插件/Worker 源码中抽取一段"无外部依赖"的片段并作为模块加载，供单元测试使用。
//
// 为什么不用行号：源码行号会随每次改动漂移，`sed -n 'A,Bp'` 式的抽取会让测试在无关改动后
// 静默抽错范围（甚至抽到半截函数而报语法错）。这里改用**稳定标记字符串**定位：
//   - from：片段起始处必然出现的字面量（如 `const TARGET_MEMBERS = 3;`）
//   - to：  片段结束后的第一条分节注释（如 `// ---------- Dialog ----------`）
// 标记在重构中基本不会变，变了也会立刻抛错而不是静默抽错。
//
// 用法：
//   const core = await loadFragment(fileUrl, {
//     from: "const TARGET_MEMBERS = 3;",
//     to: "// ---------- Dialog ----------",
//     exports: ["classifyJoinError", "runFullFlow", "sleep"],
//   });
//   const { classifyJoinError } = core;

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export async function loadFragment(file, { from, to, exports = [], extra = "" }) {
  const src = readFileSync(file, "utf8");
  const i = src.indexOf(from);
  const j = src.indexOf(to);
  if (i < 0) throw new Error(`抽取失败：未找到起始标记 ${JSON.stringify(from)}（文件 ${file}）`);
  if (j < 0) throw new Error(`抽取失败：未找到结束标记 ${JSON.stringify(to)}（文件 ${file}）`);
  if (j <= i) throw new Error(`抽取失败：结束标记出现在起始标记之前（文件 ${file}）`);

  const code = src.slice(i, j) + "\n" + extra + "\n" + `export { ${exports.join(", ")} };\n`;
  const dir = mkdtempSync(join(tmpdir(), "echo-plugin-test-"));
  const path = join(dir, "fragment.mjs");
  writeFileSync(path, code);
  return import(pathToFileURL(path).href);
}

// 断言脚手架（各测试文件共用；保持与 tests/ 既有 *.test.mjs 一致的输出风格）
export function makeAssert() {
  let pass = 0;
  let fail = 0;
  const failures = [];
  const eq = (name, actual, expected) => {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) pass++;
    else { fail++; failures.push(name + "\n      实际: " + a + "\n      期望: " + e); }
  };
  const ok = (name, cond, extra) => {
    if (cond) pass++;
    else { fail++; failures.push(name + (extra ? "  " + extra : "")); }
  };
  const show = (title) => console.log("\n== " + title + " ==");
  const report = () => {
    console.log("\n================ 结果 ================");
    console.log("通过 " + pass + " / 失败 " + fail);
    if (failures.length) {
      console.log("\n失败明细:");
      failures.forEach((f) => console.log("  x " + f));
    }
    process.exitCode = fail ? 1 : 0;
  };
  return { eq, ok, show, report };
}
