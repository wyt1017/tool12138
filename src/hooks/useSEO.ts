import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getToolByPath, tools, type Tool } from '@/data/tools';
import { SITE_BASE } from '@/config/site';

const TOOL_COUNT = tools.length + '+';
const DEFAULT_TITLE = '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线工具箱';
const DEFAULT_DESC = '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线工具箱，涵盖文本处理、开发工具、设计工具、密码生成、图片压缩、二维码生成等。数据本地处理，无需注册，保护隐私安全。';
// 社交平台（Facebook / Twitter / 微信 / 知乎）不认 SVG 做 og:image，必须用 PNG
const DEFAULT_IMAGE = `${SITE_BASE}/icon-512x512.png`;
const DEFAULT_IMAGE_SIZE = '512';

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setHtmlAttr(attr: string, value: string) {
  document.documentElement.setAttribute(attr, value);
}

/** 写入/替换 JSON-LD 结构化数据节点 */
function setJsonLd(data: Record<string, unknown>) {
  let el = document.querySelector('script[data-guaqi-jsonld]') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-guaqi-jsonld', '');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function buildToolJsonLd(tool: Tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${tool.name} - 瓜崎工具`,
    description: tool.description,
    url: `${SITE_BASE}${tool.path}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  };
}

function buildHomeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '瓜崎工具',
    alternateName: DEFAULT_TITLE,
    url: SITE_BASE,
    description: DEFAULT_DESC,
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_BASE}/tools?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

function buildToolsListJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '全部工具 - 瓜崎工具',
    url: `${SITE_BASE}/tools`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `${SITE_BASE}${t.path}`,
    })),
  };
}

export default function useSEO() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const tool = getToolByPath(location.pathname);

    if (tool) {
      const title = `${tool.name} - 瓜崎工具`;
      document.title = title;
      setMeta('description', tool.description);
      setProperty('og:title', title);
      setProperty('og:description', tool.description);
      setProperty('og:url', `${SITE_BASE}${location.pathname}`);
      setProperty('og:image', DEFAULT_IMAGE);
      setProperty('og:type', 'website');
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:title', title);
      setMeta('twitter:description', tool.description);
      setJsonLd(buildToolJsonLd(tool));
    } else if (location.pathname === '/tools') {
      const title = '全部工具 - 瓜崎工具';
      document.title = title;
      setMeta('description', '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线开发工具合集，JSON格式化、Base64编解码、二维码生成、密码生成等全部免费使用。');
      setProperty('og:title', title);
      setProperty('og:description', '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线开发工具合集。');
      setProperty('og:url', SITE_BASE + '/tools');
      setProperty('og:image', DEFAULT_IMAGE);
      setProperty('og:type', 'website');
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:title', title);
      setMeta('twitter:description', '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线开发工具合集。');
      setJsonLd(buildToolsListJsonLd());
    } else if (location.pathname === '/about') {
      const title = '关于瓜崎工具';
      document.title = title;
      setMeta('description', '瓜崎工具是一个开源的免费在线工具箱，提供' + TOOL_COUNT + '款常用工具，所有数据在浏览器本地处理，不上传服务器。');
      setProperty('og:title', title);
      setProperty('og:description', '瓜崎工具是一个开源的免费在线工具箱。');
      setProperty('og:url', SITE_BASE + '/about');
      setProperty('og:image', DEFAULT_IMAGE);
      setProperty('og:type', 'website');
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:title', title);
      setMeta('twitter:description', '瓜崎工具是一个开源的免费在线工具箱。');
      setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: title,
        url: `${SITE_BASE}/about`,
        description: '瓜崎工具是一个开源的免费在线工具箱，所有数据在浏览器本地处理，不上传服务器。',
        inLanguage: 'zh-CN',
      });
    } else {
      document.title = DEFAULT_TITLE;
      setMeta('description', DEFAULT_DESC);
      setProperty('og:title', DEFAULT_TITLE);
      setProperty('og:description', DEFAULT_DESC);
      setProperty('og:url', SITE_BASE);
      setProperty('og:image', DEFAULT_IMAGE);
      setProperty('og:type', 'website');
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:title', DEFAULT_TITLE);
      setMeta('twitter:description', DEFAULT_DESC);
      setJsonLd(buildHomeJsonLd());
    }

    setProperty('og:image:width', DEFAULT_IMAGE_SIZE);
    setProperty('og:image:height', DEFAULT_IMAGE_SIZE);
    setProperty('og:image:alt', '瓜崎工具');

    const canonical = tool
      ? `${SITE_BASE}${location.pathname}`
      : location.pathname === '/'
        ? SITE_BASE
        : `${SITE_BASE}${location.pathname}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);

    setHtmlAttr('lang', 'zh-CN');
  }, [location.pathname]);
}