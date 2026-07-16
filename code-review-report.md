# 瓜崎工具 · 前端静态代码审查报告

- **项目**：纯前端工具箱（React 18 + TypeScript + Vite 6 + Tailwind 3 + framer-motion + zustand）
- **范围**：`src/` 下 91 个源文件，按「致命错误 / 逻辑缺陷 / 安全 / 性能 / 兼容与交互」五维全量静态扫描（全局 Grep 风险模式 + 高危模块精读 + `tsc -b --noEmit` 真实类型检查）
- **日期**：2026-07-16
- **审查结论**：整体代码质量中等偏上，编译期零类型错误；问题集中在 **XSS 注入（第三方数据）、事件监听未清理、Blob URL 内存泄漏、移动端视口与键盘可访问性** 五类。无会导致整页白屏的必现致命错误（隐私模式下 `useTheme` 有潜在白屏风险，但当前为死代码）。

---

## 一、致命错误（Runtime Errors）

| 等级 | 位置 | 说明 |
|---|---|---|
| ✅ 通过 | 全局 | `tsc -b --noEmit` 退出码 0、0 报错 → 编译期无未定义变量 / 类型错误 |
| ✅ 通过 | `index.html:30` | 存在 `<div id="root">`，`main.tsx` 挂载点有效，白屏根因排除 |
| ⚠️ 中（潜在） | `src/hooks/useTheme.ts:7,17` | `localStorage.getItem/setItem` 未包裹 try/catch。在隐私模式 / 存储被禁用的浏览器中 `localStorage` 访问会抛 `SecurityError`，若在渲染期调用将**整页白屏** |
| ℹ️ 低 | `src/main.tsx:6` | `document.getElementById('root')!` 非空断言，若 root 缺失会抛错（标准模板已含，风险低） |

> **关键事实**：`useTheme` 目前**未被任何组件引用（死代码）**，故上述白屏风险当前不会触发；一旦接入 Header 即变为高优先级隐患。

---

## 二、逻辑缺陷（Logic Bugs）

### 🔴 高 · 媒体查询监听器永不移除（stale listener + 泄漏）
**`src/pages/tools/MediaQueryTester.tsx:40-41`**
```ts
mql.addEventListener('change', (e) => setQueryMatches(e.matches));
return () => mql.removeEventListener('change', () => {}); // ❌ 新匿名函数，引用不匹配
```
- 移除时传入的是**全新箭头函数**，与添加时的处理函数引用不同 → 旧监听器**永不移除**。
- 每次 `customQuery` 变化都新建 `mql` 并叠加一个泄漏的监听器；多个旧监听器会各自用自己 `mql.matches` 调 `setQueryMatches`，造成**状态回退/错乱**。
- 在 React `StrictMode`（开发态双挂载）下问题翻倍。
- **修复**：用同名函数引用。
  ```ts
  const onChange = (e: MediaQueryListEvent) => setQueryMatches(e.matches);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
  ```

### 🟡 中 · 异步竞态（无 AbortController）
**`src/pages/tools/ExchangeRate.tsx:40-61`**、**`src/pages/tools/WeatherWidget.tsx`**
- 用户快速切换基准币种 / 搜索城市时，多个 `fetch` 并发；先发的慢请求后返回会**覆盖**后发快请求的结果，显示过期数据。
- **修复**：用 `AbortController` 在下次请求前 `abort()` 旧请求，或在 `setState` 前校验请求标识。

### 🟡 低-中 · ScientificCalculator 表达式处理缺陷
**`src/pages/tools/ScientificCalculator.tsx:18-37`**
- `!`（阶乘）按钮无对应处理逻辑，`5!` 会触发语法错误 → 仅显示"表达式错误"，按钮形同虚设。
- 正则 `e(?![xp])` 会把字面量科学计数法 `1e10` 误替换为 `1Math.E10` → 计算失败。
- **说明**：`Function('return ('+expr+')')()` 本身已包 try/catch，仅自 XSS，风险低；但建议改用数学表达式解析器（如 `mathjs`）替代 `Function` 构造器。

### ✅ 已确认无问题的维度
- **状态管理**：全部为 `useState` 不可变更新，无数组/对象引用未深拷贝问题；`zustand` 已安装但**未被使用**，无全局 store 误用。
- **事件解绑**：`CodeRunner`、`MediaQueryTester`（resize）的 add/remove 配对正确，仅 `mql.change` 一处异常。

---

## 三、安全问题（Security）

### 🔴 高 · GithubCard 第三方数据 XSS（dangerouslySetInnerHTML）
**`src/pages/tools/GithubCard.tsx:83-104, 199`**
```ts
<text ...>${displayName}</text>            // user.name 未转义
<text ...>${bio}</text>                      // user.bio 未转义
<image href="${user.avatar_url}" .../>       // 未转义
<div ... dangerouslySetInnerHTML={{ __html: buildSvg() }} />
```
- `user.name` / `bio` / `avatar_url` 来自 GitHub 公开 API，属**攻击者可控制数据**（任意用户可把昵称设为 `<image onload=...>` 或 `</text><script>` 变体）。
- 经 `dangerouslySetInnerHTML` 注入 SVG 后，内联事件处理器会执行 → **存储/反射型 XSS**。
- **修复**：对所有插值做 HTML 转义（提供 `escapeXml` 工具，转义 `& < > " '`）。

### 🟡 低-中 · MarkdownEditor URL 属性注入（self-XSS）
**`src/pages/tools/MarkdownEditor.tsx:51-69`**
- 全局转义仅处理 `& < >`，链接/图片的 `safeUrl` 以**未转义**方式拼入 `href`/`src`。相对路径如 `"/><img src=x onerror=alert(1)>"` 可跳出属性。
- 仅影响用户自身浏览器输入（本地工具，self-XSS），严重性低，但属典型注入缺陷。
- **修复**：对写入属性的 URL 做引号/空白转义（`escapeAttr`）。

### 🟢 低 · CodeRunner 消息监听器未校验来源
**`src/pages/tools/CodeRunner.tsx:73-82`**
- `window.addEventListener('message', handler)` 仅判断 `e.data.type === 'error'`，未校验 `e.source` / `e.origin`。
- iframe 已用 `sandbox="allow-scripts"`（**无 allow-same-origin**，隔离良好，无法直接访问父页 DOM/cookie），故实际影响极低。
- **修复**：`if (e.source !== iframeRef.current?.contentWindow) return;`

### ✅ 安全项确认
- **localStorage**：仅存 `theme`（死代码）与 `pomodoro_todos`（用户自己的待办）→ **无敏感信息**。
- **API 密钥**：Frankfurter / Open-Meteo / GitHub 均为**免密钥公开 API**，客户端无任何密钥硬编码。
- **JSON.parse**：`JsonFormatter` / `JwtParser` / `CodeFormatter` 等均已 try/catch 保护。

---

## 四、性能问题（Performance）

### 🟡 中 · Blob URL 内存泄漏
**`src/pages/tools/ImageToBase64.tsx:16`**
- `setPreviewUrl(URL.createObjectURL(file))` 创建 Blob URL，但全文件**无任何 `revokeObjectURL`**（含 `clearAll` 仅置空字符串）→ 每次换图泄漏一个 Blob，旧 URL 永不释放。
- **修复**：用 ref 记录当前 URL，创建新 URL 前 `revokeObjectURL(prev)`，`clearAll` 与组件卸载时释放。

**`src/pages/tools/ImageCompress.tsx:103,114,128`**
- 切换文件时 `setOriginalPreview(URL.createObjectURL(...))` 未先释放上一个 `originalPreview`；`handleCompress` 中 `origImg.src = URL.createObjectURL(file)`（行 128）为临时读取尺寸用，**从不释放**。

### 🟡 低-中 · 无节流的 resize 监听 & 逐键重载 iframe
- `MediaQueryTester.tsx:14-26`：resize 回调每次事件直接 `setState`，拖拽窗口时高频重渲染 → 建议 `requestAnimationFrame`/节流。
- `CodeRunner.tsx:92-94`：`run()` 依赖 `html/css/js`，每次按键都重建 `srcdoc` 并重载 iframe → 建议防抖（debounce 300ms）。

### 🟢 低 · 常量重建 & 未清理定时器
- 多个页面在组件体内重建常量数组（`presetQueries` / `tabs` / `buttons` / `color`）→ 可提至模块作用域或 `useMemo`。
- 约 25 个文件用 `setTimeout(() => setCopied(false), 2000)` 做"已复制"反馈，卸载后未 `clearTimeout`。React 18 下为 no-op，无害，但属未清理项。

---

## 五、兼容性与交互（a11y / 移动端）

### 🟡 中 · 移动端视口高度（`100vh`）
**`src/index.css:34`** `body { min-height: 100vh }`
- 移动端浏览器地址栏会占用 `100vh` 空间，导致 Footer 被裁切 / 出现底部空白。
- **修复**：`min-height: 100vh; min-height: 100dvh;`（dvh 覆盖动态视口，旧浏览器回退 vh）。

### 🟡 中 · 下拉导航键盘不可访问
**`src/components/layout/Header.tsx:75-107`**
- 分类下拉菜单仅 `onMouseEnter/onMouseLeave` 触发，**键盘 / 触屏用户无法打开**；无 `aria-haspopup` / `aria-expanded` / 焦点管理。
- **修复**：改为 `onClick` 切换 + 焦点进入、`role="menu"`/`menuitem`、支持 `Esc` 关闭。

### 🟢 低 · 其他
- 缺少 `-webkit-tap-highlight-color: transparent` → iOS 点击按钮/链接时出现灰色闪块。
- 全站大量 `framer-motion` 动画未适配 `prefers-reduced-motion`，前庭功能障碍用户可能不适。

---

## 六、优先级修复清单

| 优先级 | 问题 | 文件 |
|---|---|---|
| **P1** | GitHub 数据未转义 XSS | `GithubCard.tsx` |
| **P1** | MediaQuery 监听器引用不匹配（泄漏+状态错乱） | `MediaQueryTester.tsx` |
| **P1** | Blob URL 泄漏（换图/压缩） | `ImageToBase64.tsx`、`ImageCompress.tsx` |
| **P2** | 异步竞态无 AbortController | `ExchangeRate.tsx`、`WeatherWidget.tsx` |
| **P2** | 移动端 `100vh` / 下拉键盘 a11y | `index.css`、`Header.tsx` |
| **P2** | `useTheme` localStorage 无 try/catch（潜在白屏） | `useTheme.ts` |
| **P3** | Markdown URL 属性注入、CodeRunner 来源校验 | `MarkdownEditor.tsx`、`CodeRunner.tsx` |
| **P3** | 计算器 `!`/科学计数法、逐键重载 iframe、`resize` 节流、常量外提 | 见上文 |

**总体评价**：无必现白屏；修复 3 个 P1 即可消除主要安全与内存隐患，建议随后处理 P2 的兼容性与竞态问题。
