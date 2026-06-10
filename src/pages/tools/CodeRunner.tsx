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

  const run = useCallback(() => {
    if (!iframeRef.current) return;

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

    // 直接拼接完整 HTML 文档，不再做误删正则
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${html}
  ${errorScript}
  <script>
    try {
      ${js}
    } catch(e) {
      window.onerror(e.message, '', e.lineNumber || 0, e.columnNumber || 0, e);
    }
  </script>
</body>
</html>`;

    iframeRef.current.srcdoc = fullHtml;
    setError(null);
  }, [html, css, js]);

  // 监听 iframe 发送的错误消息
  useEffect(() => {
    const handler = (e: MessageEvent) => {
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
    run();
  };

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Code size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">在线代码运行器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时编写HTML/CSS/JS代码并预览运行效果，适合前端原型测试</p>
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
        <button onClick={run} className="btn-primary">
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
          <label className="text-sm font-medium text-[#a8b2c1]">预览效果</label>
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
        <p className="text-xs text-[#666]">
          <strong className="text-[#a8b2c1]">提示：</strong>
          代码在沙箱环境中运行，支持基本的HTML/CSS/JS。点击"运行"按钮查看效果。
        </p>
      </motion.div>
    </div>
  );
}