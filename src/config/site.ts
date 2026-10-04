/**
 * 站点域名的运行时唯一来源。
 *
 * canonical、og:url、JSON-LD 等运行时 SEO 字段全部读这里；
 * 构建期的 index.html canonical 与 sitemap.xml 由根目录 vite-plugin-seo.ts 注入，
 * 改域名时只需改本文件这一处。
 */
export const SITE_BASE = 'https://tool12138.3383.workers.dev';