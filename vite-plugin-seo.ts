import type { Plugin } from 'vite';
import { tools } from './src/data/tools';
import { SITE_BASE } from './src/config/site';

/** 转义 XML 文本节点中的特殊字符 */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface SitemapEntry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

/** sitemap 页面清单：首页 + 两个内页 + 全部工具页（工具页直接读 tools.ts，永不漏项） */
function buildSitemapEntries(): SitemapEntry[] {
  return [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/tools', changefreq: 'weekly', priority: '0.8' },
    { path: '/about', changefreq: 'monthly', priority: '0.5' },
    ...tools.map((t) => ({ path: t.path, changefreq: 'weekly' as const, priority: '0.7' })),
  ];
}

function renderSitemap(entries: SitemapEntry[], lastmod: string): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${xmlEscape(SITE_BASE + e.path)}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${e.changefreq}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * 构建期 SEO 收口：
 * 1. 把 index.html 里的 canonical 与工具数量占位符替换为真实值；
 * 2. 由 tools.ts 生成 sitemap.xml，不再手工维护。
 */
export function seoPlugin(): Plugin {
  return {
    name: 'guaqi-seo',
    transformIndexHtml(html) {
      return html
        .replaceAll('__SITE_BASE__', SITE_BASE)
        .replaceAll('__TOOL_COUNT__', String(tools.length));
    },
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: renderSitemap(buildSitemapEntries(), lastmod),
      });
    },
  };
}