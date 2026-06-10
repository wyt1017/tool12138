import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Copy, Eye, Code } from 'lucide-react';

// 安全的 URL 过滤，防止 XSS
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // 只允许 http, https, mailto 协议
  if (/^(https?:|mailto:)/i.test(trimmed)) {
    return trimmed;
  }
  // 相对路径也允许
  if (/^[/#]/.test(trimmed) || !/^[\w]+:/i.test(trimmed)) {
    return trimmed;
  }
  // 其他协议（如 javascript:）返回空
  return '';
}

// HTML 转义，防止 XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Simple markdown parser -> HTML (basic support)
function markdownToHtml(md: string): string {
  // 首先转义所有 HTML 特殊字符
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Code blocks - 注意 code 内容已经被转义了
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="bg-black/40 rounded-lg p-4 my-3 overflow-x-auto"><code class="text-[#00d9ff] text-sm">${code.trim()}</code></pre>`
  );
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[#ffd369] text-sm">$1</code>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-white mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-extrabold gradient-text mt-8 mb-4">$1</h1>');
  // Bold & Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links - 使用安全的 URL 过滤
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, (_m, text, url) => {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return escapeHtml(text);
    return `<a href="${safeUrl}" class="text-[#00d9ff] underline hover:text-[#6bcb77]" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
  });
  // Unordered list
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-[#a8b2c1] my-1">$1</li>');
  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-[#a8b2c1] my-1">$1</li>');
  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-3 border-[#00d9ff] pl-4 text-[#a8b2c1] italic my-3">$1</blockquote>');
  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="border-white/10 my-6"/>');
  // Images - 使用安全的 URL 过滤，alt 属性需要转义
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return escapeHtml(alt);
    return `<img src="${safeUrl}" alt="${escapeHtml(alt)}" class="rounded-lg max-w-full my-4"/>`;
  });
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="my-2 text-[#a8b2c1] leading-relaxed">');
  html = html.replace(/\n/g, '<br/>');

  return `<div class="prose-container">${html}</div>`;
}

const sampleMd = `# Markdown 编辑器使用说明

## 功能介绍

这是一个**在线Markdown编辑器**，支持：

- 实时预览效果
- **基础语法**：标题、粗体、斜体
- \`代码块\` 和行内代码
- 链接和图片
- 列表和引用

## 示例代码

\`\`\`javascript
const greeting = "Hello, ToolBox!";
console.log(greeting);
\`\`\`

> 这是一段引用文字，可以用来强调重要内容。

---

开始编辑左侧区域，右侧将**实时显示**渲染效果！`;

export default function MarkdownEditor() {
  const [md, setMd] = useState(sampleMd);
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const previewHtml = markdownToHtml(md);

  const copyHtml = () => navigator.clipboard.writeText(previewHtml);
  const copyMd = () => navigator.clipboard.writeText(md);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00d9ff]/15 flex items-center justify-center">
            <FileCode size={20} className="text-[#00d9ff]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">Markdown编辑器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时预览，支持导出HTML和一键复制</p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'split' as const, icon: Eye, label: '分屏' },
          { key: 'edit' as const, icon: Code, label: '仅编辑' },
          { key: 'preview' as const, icon: Eye, label: '仅预览' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === key ? 'bg-[#00d9ff]/15 text-[#00d9ff]' : 'bg-white/5 text-[#666] hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={copyMd} className="btn-secondary !py-1.5 !px-3 text-xs">
            <Copy size={13} className="inline mr-1" /> 复制MD
          </button>
          <button onClick={copyHtml} className="btn-secondary !py-1.5 !px-3 text-xs">
            <Copy size={13} className="inline mr-1" /> 复制HTML
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ display: mode === 'preview' ? 'none' : undefined }}>
        {(mode === 'edit' || mode === 'split') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${mode === 'split' ? '' : 'lg:col-span-2'}`}
          >
            <textarea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              aria-label="Markdown输入"
              className="tool-area w-full h-[520px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333] font-mono"
              spellCheck={false}
            />
          </motion.div>
        )}
        {(mode === 'preview' || mode === 'split') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`tool-area overflow-auto p-6 ${mode === 'preview' ? 'lg:col-span-2' : ''}`}
            style={{ height: mode === 'preview' ? 'auto' : '520px', minHeight: '520px' }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </div>
  );
}
