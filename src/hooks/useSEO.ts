import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getToolByPath, tools } from '@/data/tools';

const SITE_BASE = 'https://same-toolbox.pages.dev';
const TOOL_COUNT = tools.length + '+';
const DEFAULT_TITLE = '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线工具箱';
const DEFAULT_DESC = '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线工具箱，涵盖文本处理、开发工具、设计工具、密码生成、图片压缩、二维码生成等。数据本地处理，无需注册，保护隐私安全。';
const DEFAULT_IMAGE = `${SITE_BASE}/favicon.svg`;

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
      setMeta('twitter:card', 'summary');
      setMeta('twitter:title', title);
      setMeta('twitter:description', tool.description);
    } else if (location.pathname === '/tools') {
      const title = '全部工具 - 瓜崎工具';
      document.title = title;
      setMeta('description', '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线开发工具合集，JSON格式化、Base64编解码、二维码生成、密码生成等全部免费使用。');
      setProperty('og:title', title);
      setProperty('og:description', '瓜崎工具 - ' + TOOL_COUNT + ' 款免费在线开发工具合集。');
      setProperty('og:url', SITE_BASE + '/tools');
      setProperty('og:image', DEFAULT_IMAGE);
      setProperty('og:type', 'website');
    } else if (location.pathname === '/about') {
      const title = '关于瓜崎工具';
      document.title = title;
      setMeta('description', '瓜崎工具是一个开源的免费在线工具箱，提供' + TOOL_COUNT + '款常用工具，所有数据在浏览器本地处理，不上传服务器。');
      setProperty('og:title', title);
      setProperty('og:description', '瓜崎工具是一个开源的免费在线工具箱。');
      setProperty('og:url', SITE_BASE + '/about');
      setProperty('og:image', DEFAULT_IMAGE);
      setProperty('og:type', 'website');
    } else {
      document.title = DEFAULT_TITLE;
      setMeta('description', DEFAULT_DESC);
      setProperty('og:title', DEFAULT_TITLE);
      setProperty('og:description', DEFAULT_DESC);
      setProperty('og:url', SITE_BASE);
      setProperty('og:image', DEFAULT_IMAGE);
      setProperty('og:type', 'website');
    }

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
