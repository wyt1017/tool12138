# Cloudflare Worker 5xx 与缓存优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 降低站点 5xx 错误率、消除 GitHub API 匿名限流产生的 4xx，并提升边缘缓存命中率。

**Architecture:** 改动集中在边缘 Worker（`src/workers/index.ts`）与静态资源头（`public/_headers`）：为 `/api/proxy` 增加失败日志、GitHub 鉴权与分级缓存；删除未使用的 `/api/hf` 端点；可选放宽 HTML 缓存时长。前端 React 代码零改动。

**Tech Stack:** Cloudflare Workers (TypeScript) + Wrangler 4 + Vite/React 18

**验证方式：** 项目无 Worker 单测框架，每步用 `npm run check`（tsc 严格类型检查，`strict` + `noUnusedLocals` + `noUnusedParameters`）验证；最终 `npm run build` + `npx wrangler dev` / `npx wrangler tail` 手动验证日志与鉴权。

---

## 任务 1：定义 Env 接口（类型基础）

**Files:**
- Modify: `src/workers/index.ts`（文件顶部，约 L1-2）

- [ ] **Step 1: 插入 Env 接口并更新 fetch 签名**

将 [index.ts](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/workers/index.ts) 顶部的：

```ts
export default {
  async fetch(request: Request, env: { ASSETS: { fetch: (req: Request) => Promise<Response> } }): Promise<Response> {
```

替换为：

```ts
interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  GITHUB_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 通过，无错误（此步尚未使用 `GITHUB_TOKEN`，仅定义类型，不影响现有逻辑）。

---

## 任务 2：增强 /api/proxy — 日志 + GitHub 鉴权 + 分级缓存

**Files:**
- Modify: `src/workers/index.ts`（`/api/proxy` 分支，原 L98-131）

- [ ] **Step 1: 替换整个 /api/proxy 分支**

将 [index.ts](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/workers/index.ts) 中从注释 `// ── 2b. 公共 API 同源代理` 到该 `if (pathname === '/api/proxy' ...)` 块结束（`}` 后空行之前）的整段，替换为：

```ts
    // ── 2b. 公共 API 同源代理（白名单转发，规避浏览器跨域与地区网络不可达） ──
    if (pathname === '/api/proxy' && request.method === 'GET') {
      const target = url.searchParams.get('url') || '';
      const allowedPrefixes = [
        'https://api.open-meteo.com/',
        'https://geocoding-api.open-meteo.com/',
        'https://api.frankfurter.app/',
        'https://api.github.com/',
      ];
      if (!allowedPrefixes.some((p) => target.startsWith(p))) {
        return new Response('Forbidden', { status: 403, headers: securityHeaders });
      }

      const headers: Record<string, string> = {
        'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)',
        'Accept': 'application/json',
      };
      // GitHub 带 token 可将匿名限流从 60 次/小时提升到 5000 次/小时
      if (target.startsWith('https://api.github.com/') && env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
      }

      try {
        const res = await fetch(target, { headers });
        const body = await res.text();
        // 成功响应分级缓存：GitHub 资料变化慢，缓存更久，减少重复回源
        const maxAge = target.startsWith('https://api.github.com/') ? 3600 : 300;
        return new Response(body, {
          status: res.status,
          headers: {
            'Content-Type': res.headers.get('Content-Type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': res.ok ? `public, max-age=${maxAge}` : 'no-store',
          },
        });
      } catch (e) {
        // 记录失败的源，便于用 wrangler tail 定位是哪个 API 在抛错
        console.error('proxy fetch failed', target, e);
        return new Response('Proxy Error', { status: 502, headers: securityHeaders });
      }
    }
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 通过，无错误。

---

## 任务 3：删除未使用的 /api/hf 端点

**Files:**
- Modify: `src/workers/index.ts`

- [ ] **Step 1: 删除 /api/hf 分支**

已核实 `src/` 下无任何前端代码调用 `/api/hf`（仅 Worker 内定义）。将 [index.ts](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/workers/index.ts) 中从注释 `// ── 2. HuggingFace API 代理（转发请求 + 补 CORS 头） ──` 到该 `if (hfMatch) { ... }` 块结束的整段删除：

```ts
    // ── 2. HuggingFace API 代理（转发请求 + 补 CORS 头） ──
    const hfMatch = pathname.match(/^\/api\/hf\/(.+)$/);
    if (hfMatch) {
      const targetUrl = `https://huggingface.co/api/${hfMatch[1]}`;
      try {
        const res = await fetch(targetUrl, {
          headers: { 'User-Agent': 'same-toolbox/1.0 (https://same-toolbox.pages.dev)' },
        });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            'Content-Type': res.headers.get('Content-Type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      } catch {
        return new Response('HF API Error', { status: 502 });
      }
    }
```

删除后保留其后的空行，使 `/api/proxy` 分支注释紧接静态资源分支之后。

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 通过，无错误（`pathname` 与 `url` 仍被后续分支使用，不会触发 `noUnusedLocals`）。

---

## 任务 4：配置 GitHub token secret（一次性，部署环境）

**Files:**
- 无代码改动（secret 存于 Cloudflare，不进入仓库）

- [ ] **Step 1: 创建 GitHub PAT**

在 GitHub → Settings → Developer settings → Fine-grained tokens 创建一个 token。公开资料无需任何权限 scope，token 本身即可将限流从 60 提升到 5000 次/小时。

- [ ] **Step 2: 写入 Cloudflare secret**

Run: `npx wrangler secret put GITHUB_TOKEN`
在提示符粘贴 PAT。secret 持久化在 Worker 配置中，`deploy.yml` 无需改动。

> 注：未配置 secret 时 Worker 仍正常工作，仅退化为匿名限流（现状）。因此本任务可延后，不阻塞任务 1-3 上线。

- [ ] **Step 3: 验证 secret 已生效**

Run: `npx wrangler secret list`
Expected: 列表中出现 `GITHUB_TOKEN`。

---

## 任务 5（可选）：放宽 HTML 缓存提升命中率

> 此任务可接受「部署后最长 5 分钟才看到新页面」的代价。若不可接受，跳过。

**Files:**
- Modify: `src/workers/index.ts`（SPA fallback 的 Cache-Control）
- Modify: `public/_headers`（`/*` 默认规则）

- [ ] **Step 1: 修改 SPA fallback 缓存头**

将 [index.ts](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/workers/index.ts) SPA fallback 中的：

```ts
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=86400',
```

替换为：

```ts
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
```

- [ ] **Step 2: 修改 _headers 默认规则**

将 [_headers](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/public/_headers) 第 4 行的：

```
  Cache-Control: public, max-age=60, stale-while-revalidate=604800
```

替换为：

```
  Cache-Control: public, max-age=300, stale-while-revalidate=604800
```

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: 通过，无错误。

---

## 任务 6：构建与手动验收

- [ ] **Step 1: 生产构建**

Run: `npm run build`
Expected: 构建成功，无 TS 错误。

- [ ] **Step 2: 本地验证代理行为**

Run: `npx wrangler dev`，另开终端执行：

```bash
# 正常：GitHub 用户（若已配 secret，响应头会带缓存 max-age=3600）
curl -i "http://localhost:8787/api/proxy?url=https%3A%2F%2Fapi.github.com%2Fusers%2Foctocat"

# 正常：汇率（max-age=300）
curl -i "http://localhost:8787/api/proxy?url=https%3A%2F%2Fapi.frankfurter.app%2Flatest%3Ffrom%3DUSD"

# 白名单外：应返回 403 Forbidden
curl -i "http://localhost:8787/api/proxy?url=https%3A%2F%2Fevil.example.com%2Fx"

# SPA 路由：应返回 200 的 index.html，不应 500
curl -i "http://localhost:8787/tools/json-formatter"
```

Expected: 前两个返回 200 JSON；第三个返回 403；第四个返回 200 HTML。

- [ ] **Step 3: 手动验收清单**

1. 本地 `npm run dev` 打开首页与任意工具页，页面正常，无 500。
2. 打开「GitHub 卡片」工具输入一个用户名，能正常出卡片；连续快速生成时不再因匿名限流频繁报 403。
3. 打开「汇率转换」与「天气」工具，数据正常返回。
4. 部署后运行 `npx wrangler tail`，若出现 `proxy fetch failed <url> ...` 日志，能直接看到是哪个上游 API 抛错（此前无法定位）。
5. Cloudflare 仪表盘观察：5xx 数量逐步下降；若执行了任务 5，缓存命中率应上升。

---

## Self-Review 记录

- **Spec 覆盖**：分析报告中的 5 项行动（日志、GitHub token、区分/透传状态码、删 `/api/hf`、HTML 缓存）分别对应任务 2、4、2、3、5；任务 6 覆盖验证。
- **占位符扫描**：无 TBD/TODO，所有代码步骤均为完整代码。
- **类型一致性**：`Env` 接口在任务 1 定义，任务 2 使用 `env.GITHUB_TOKEN`；`GITHUB_TOKEN?: string` 与 `env.GITHUB_TOKEN` 用法一致。任务 3 删除 `/api/hf` 后 `pathname` 仍被 `/api/proxy` 与静态资源、SPA fallback 使用，无未使用变量。
