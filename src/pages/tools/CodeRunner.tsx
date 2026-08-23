import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Code, Play, RotateCcw } from 'lucide-react';

const COLOR = '#a78bfa';

const DEFAULT_HTML = `<h1>Hello World</h1>
<p>这是一个测试页面</p>
<button onclick="alert('点击成功!')">点击我</button>`;

const DEFAULT_CSS = `body {
  font-family: Arial, sans-serif;
  padding: 20px;
}

h1 {
  color: #3b82f6;
}`;

const DEFAULT_JS = `console.log('代码运行器已启动');`;

export default function CodeRunner() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 每次 render 更新到 ref，确保 timeout 内始终调用最新闭包版本
  const runRef = useRef<(() => void) | null>(null);
  runRef.current = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // 捕获 iframe 内的 JS 错误
    const errorScript = `
      <script>
        window.onerror = function(message, source, lineno, colno, error) {
          window.parent.postMessage({
            type: 'error',
            message: message,
            line: lineno,
            column: colno,
            stack: error ? error.stack : null
          }, '*');
        };
      </script>
    `;

    // 对 JS 内容进行转义，防止 </script> 注入
    const escapeJs = (s: string) => s.replace(/<\/script>/gi, '<\\/script>');
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css.replace(/<\/style>/gi, '<\\/style>')}</style>
</head>
<body>
  ${html.replace(/<\/body>/gi, '<\\/body>')}
  ${errorScript}
  <script>
    try {
      ${escapeJs(js)}
    } catch(e) {
      window.parent.postMessage({
        type: 'error',
        message: e.message || String(e),
        line: e.lineNumber || 0,
        column: e.columnNumber || 0,
        stack: e.stack || null
      }, '*');
    }
  </script>
</body>
</html>`;

    iframe.srcdoc = fullHtml;
    setError(null);
  }, [html, css, js]);

  // 监听 iframe 发送的错误消息
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data && e.data.type === 'error') {
        const { message, line, column } = e.data;
        setError(`${message}\n    at line ${line}:${column}`);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const reset = () => {
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setJs(DEFAULT_JS);
    setError(null);
    setTimeout(() => runRef.current?.(), 50);
  };

  // 输入时防抖 300ms 再重建 iframe，避免每次按键都重载
  // 使用 timerRef 保证清理事件，不依赖 run 的引用稳定性
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runRef.current?.(), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [html, css, js]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Code size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">在线代码运行器</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">实时编写HTML/CSS/JS代码并预览运行效果，适合前端原型测试</p>
      </motion.div>

      {/* Code Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* HTML */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#e94560]">HTML</label>
          </div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            aria-label="HTML代码"
            className="tool-area w-full h-[250px] p-4 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 font-mono"
            spellCheck={false}
          />
        </motion.div>

        {/* CSS */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#00d9ff]">CSS</label>
          </div>
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            placeholder="/* 输入CSS样式 */"
            aria-label="CSS代码"
            className="tool-area w-full h-[250px] p-4 text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 font-mono"
            spellCheck={false}
          />
        </motion.div>

        {/* JavaScript */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#ffd369]">JavaScript</label>
          </div>
          <textarea
            value={js}
            onChange={(e) => setJs(e.target.value)}
            placeholder="// 输入JavaScript代码"
            aria-label="JavaScript代码"
            className="tool-area w-full h-[250px] p-4 text-sm leading-relaxed resize-none outline-none focus:border-[#ffd369]/30 font-mono"
            spellCheck={false}
          />
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 mb-4">
        <button onClick={() => runRef.current?.()} className="btn-primary">
          <Play size={15} className="inline mr-2" /> 运行
        </button>
        <button onClick={reset} className="btn-secondary">
          <RotateCcw size={15} className="inline mr-1.5" /> 重置
        </button>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4 mb-4 border border-[#e94560]/30"
        >
          <div className="flex items-start gap-2">
            <span className="text-[#e94560] text-sm font-medium whitespace-pre-wrap">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Preview */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[var(--text-secondary)]">预览效果</label>
        </div>
        <div className="bg-white rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            title="Preview"
            className="w-full h-[400px]"
            sandbox="allow-scripts allow-modals"
          />
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 mt-4">
        <p className="text-xs text-[var(--text-faint)]">
          <strong className="text-[var(--text-secondary)]">提示：</strong>
          代码在沙箱环境中运行，支持基本的HTML/CSS/JS。点击"运行"按钮查看效果。
        </p>
      </motion.div>
    </div>
  );
}
