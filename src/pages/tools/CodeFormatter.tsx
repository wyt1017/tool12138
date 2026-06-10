import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, Minimize2, AlignLeft, FileCode } from 'lucide-react';

type LangType = 'js' | 'css' | 'html' | 'sql' | 'xml' | 'json';

interface TabConfig {
  id: LangType;
  label: string;
}

const LANG_TABS: TabConfig[] = [
  { id: 'js', label: 'JS' },
  { id: 'css', label: 'CSS' },
  { id: 'html', label: 'HTML' },
  { id: 'sql', label: 'SQL' },
  { id: 'xml', label: 'XML' },
  { id: 'json', label: 'JSON' },
];

function formatJS(code: string, indentSize: number): string {
  const indent = ' '.repeat(indentSize);
  let depth = 0;
  let result = '';
  let buffer = '';
  let inSingleComment = false;
  let inMultiComment = false;
  let inString: string | null = null;
  let prevCh = '';

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    // Handle string literals
    if (!inSingleComment && !inMultiComment && (ch === '"' || ch === "'" || ch === '`')) {
      if (inString === ch && prevCh !== '\\') {
        buffer += ch;
        inString = null;
      } else if (!inString) {
        inString = ch;
        buffer += ch;
      } else {
        buffer += ch;
      }
      prevCh = ch;
      continue;
    }

    if (inString) {
      buffer += ch;
      prevCh = ch;
      continue;
    }

    // Handle single-line comments
    if (!inMultiComment && ch === '/' && next === '/') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '//';
      inSingleComment = true;
      i++;
      prevCh = '/';
      continue;
    }

    if (inSingleComment) {
      if (ch === '\n') {
        result += indent.repeat(depth) + buffer.trimEnd() + '\n';
        buffer = '';
        inSingleComment = false;
      } else {
        buffer += ch;
      }
      prevCh = ch;
      continue;
    }

    // Handle multi-line comments
    if (!inSingleComment && ch === '/' && next === '*') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '/*';
      inMultiComment = true;
      i++;
      prevCh = '*';
      continue;
    }

    if (inMultiComment) {
      buffer += ch;
      if (ch === '*' && next === '/') {
        buffer += '/';
        i++;
        result += indent.repeat(depth) + buffer.trim() + '\n';
        buffer = '';
        inMultiComment = false;
      }
      prevCh = ch;
      continue;
    }

    if (ch === '{') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '';
      result += indent.repeat(depth) + '{\n';
      depth++;
    } else if (ch === '}') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '';
      depth = Math.max(0, depth - 1);
      result += indent.repeat(depth) + '}\n';
    } else if (ch === ';') {
      buffer += ';';
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '';
    } else if (ch === '\n') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '';
    } else {
      buffer += ch;
    }
    prevCh = ch;
  }

  if (buffer.trim()) {
    result += indent.repeat(depth) + buffer.trim() + '\n';
  }

  return result.replace(/\n{3,}/g, '\n\n').trim();
}

function formatCSS(code: string, indentSize: number): string {
  const indent = ' '.repeat(indentSize);
  let depth = 0;
  let result = '';
  let buffer = '';
  let inComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    // Handle block comments
    if (!inComment && ch === '/' && next === '*') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '/*';
      inComment = true;
      i++; // skip the '*'
      continue;
    }

    if (inComment) {
      buffer += ch;
      if (ch === '*' && next === '/') {
        buffer += '/';
        i++; // skip the '/'
        result += indent.repeat(depth) + buffer.trim() + '\n';
        buffer = '';
        inComment = false;
      }
      continue;
    }

    if (ch === '{') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '';
      result += indent.repeat(depth) + '{\n';
      depth++;
    } else if (ch === '}') {
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '';
      depth--;
      result += indent.repeat(depth) + '}\n';
    } else if (ch === ';') {
      buffer += ';';
      if (buffer.trim()) {
        result += indent.repeat(depth) + buffer.trim() + '\n';
      }
      buffer = '';
    } else {
      buffer += ch;
    }
  }

  if (buffer.trim()) {
    result += buffer.trim();
  }

  return result.replace(/\n{3,}/g, '\n\n').trim();
}

function formatHTML(code: string, indentSize: number): string {
  const indent = ' '.repeat(indentSize);
  let depth = 0;
  let result = '';
  let buffer = '';
  let inTag = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];

    if (ch === '<') {
      if (buffer.trim()) {
        result += indent.repeat(Math.max(0, depth)) + buffer.trim() + '\n';
      }
      buffer = '<';
      inTag = true;
    } else if (inTag && ch === '>') {
      buffer += '>';
      const isClosing = /^\s*<\//.test(buffer);
      const isSelfClosing = /\/>\s*$/.test(buffer);

      if (isClosing && !isSelfClosing) {
        depth = Math.max(0, depth - 1);
      }

      result += indent.repeat(Math.max(0, depth)) + buffer.trim() + '\n';

      if (!isClosing && !isSelfClosing) {
        depth++;
      }

      buffer = '';
      inTag = false;
    } else if (inTag) {
      buffer += ch;
    } else {
      buffer += ch;
    }
  }

  if (buffer.trim()) {
    result += indent.repeat(Math.max(0, depth)) + buffer.trim();
  }

  return result.replace(/\n{3,}/g, '\n\n').trim();
}

function formatSQL(code: string): string {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'];

  let formatted = code;

  // Sort keywords by length descending to match longer ones first
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

  for (let i = 0; i < sortedKeywords.length; i++) {
    const kw = sortedKeywords[i];
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, `\n${kw}`);
  }

  // Clean up multiple newlines and add indentation
  const lines = formatted.split('\n').filter((line) => line.trim());
  let depth = 0;
  const indentedLines: string[] = [];

  for (let j = 0; j < lines.length; j++) {
    const line = lines[j].trim();
    const lineUpper = line.toUpperCase();

    // Decrease indent before certain keywords
    if (/^(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|AND|OR|ON)\b/.test(lineUpper)) {
      depth = Math.max(0, depth - 1);
    }

    indentedLines.push('  '.repeat(Math.max(0, depth)) + line);

    // Increase indent after certain keywords
    if (/^(SELECT|FROM|WHERE|SET|VALUES|INTO)\b/.test(lineUpper)) {
      depth++;
    }
  }

  return indentedLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
}

function formatXML(code: string, indentSize: number): string {
  return formatHTML(code, indentSize); // XML uses same tag-based formatting as HTML
}

function compressCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/<!--[\s\S]*?-->/g, '')   // remove HTML comments
    .replace(/\s+/g, ' ')               // collapse whitespace
    .replace(/>\s+</g, '><')           // collapse between tags
    .replace(/\s*([{};,])\s*/g, '$1')  // trim around punctuation
    .trim();
}

export default function CodeFormatter() {
  const [activeTab, setActiveTab] = useState<LangType>('js');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);

  const detectLang = (code: string): LangType => {
    const trimmed = code.trim();
    if (/^\s*\{/.test(trimmed) || /^\s*\[/.test(trimmed)) {
      try { JSON.parse(trimmed); return 'json'; } catch { /* not json */ }
    }
    if (/^\s*<\?xml/i.test(trimmed)) return 'xml';
    if (/^\s*<!doctype\s+html/i.test(trimmed) || /^\s*<html/i.test(trimmed) || /<\/\w+>/i.test(trimmed)) return 'html';
    if (/^\s*<(?:\w+)[\s>]/i.test(trimmed) && !/^\s*<\?xml/i.test(trimmed)) return 'xml';
    if (/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i.test(trimmed) && /;?\s*$/.test(trimmed)) return 'sql';
    if (/\{[^}]*\}/.test(trimmed) && /[\w-]+\s*:\s*[^;]+;/.test(trimmed)) return 'css';
    if (/\b(function|const|let|var|import|export|class|=>)\b/.test(trimmed)) return 'js';
    return 'js';
  };

  const handleFormat = () => {
    if (!input.trim()) return;

    try {
      let result = '';
      const lang = activeTab === 'js' ? detectLang(input) : activeTab;
      switch (lang) {
        case 'js':
          result = formatJS(input, indentSize);
          break;
        case 'css':
          result = formatCSS(input, indentSize);
          break;
        case 'html':
          result = formatHTML(input, indentSize);
          break;
        case 'sql':
          result = formatSQL(input);
          break;
        case 'xml':
          result = formatXML(input, indentSize);
          break;
        case 'json': {
          const parsed = JSON.parse(input);
          result = JSON.stringify(parsed, null, indentSize);
          break;
        }
      }
      setOutput(result);
    } catch (err) {
      setOutput(`格式化错误：${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleCompress = () => {
    if (!input.trim()) return;
    setOutput(compressCode(input));
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleInputs: Record<LangType, string> = {
    js: 'function hello(name) { const greeting = "Hello, " + name + "!"; console.log(greeting); return greeting; } class App { constructor() { this.data = []; } add(item) { this.data.push(item); } }',
    css: 'body{margin:0;padding:0;font-family:sans-serif;background:#0a0a1a;color:#fff}.container{max-width:1200px;margin:0 auto}',
    html: '<div><header><nav><ul><li>Home</li><li>About</li></ul></nav></header><main><section><h1>Hello World</h1></section></main></div>',
    sql: 'select id,name,email from users where status=1 order by created_at desc limit 10',
    xml: '<root><person><name>Alice</name><age>25</age></person><person><name>Bob</name><age>30</age></person></root>',
    json: '{"name":"example","version":1,"items":[{"id":1,"value":"first"},{"id":2,"value":"second"}]}',
  };

  const loadSample = () => {
    setInput(sampleInputs[activeTab]);
    setOutput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00d9ff]/15 flex items-center justify-center">
            <Code2 size={20} className="text-[#00d9ff]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">代码格式化工具</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">美化或压缩 JS / CSS / HTML / SQL / XML / JSON 代码</p>
      </motion.div>

      {/* Language Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-6 flex-wrap">
        {LANG_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setInput(''); setOutput(''); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#00d9ff]/15 text-[#00d9ff]'
                : 'bg-white/5 text-[#666]'
            }`}
          >
            <FileCode size={14} className="inline mr-1.5" />
            {tab.label}
          </button>
        ))}

        {/* Indent Size */}
        <div className="ml-auto flex items-center gap-2">
          <AlignLeft size={14} className="text-[#666]" />
          <span className="text-xs text-[#666]">缩进:</span>
          {[2, 4].map((size) => (
            <button
              key={size}
              onClick={() => setIndentSize(size)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                indentSize === size
                  ? 'bg-[#00d9ff]/15 text-[#00d9ff]'
                  : 'bg-white/5 text-[#666]'
              }`}
            >
              {size}sp
            </button>
          ))}
        </div>
      </motion.div>

      {/* Code Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">原始代码</label>
            <button onClick={loadSample} className="btn-secondary !py-1.5 !px-3 text-xs">
              加载示例
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`粘贴${activeTab.toUpperCase()}代码在这里...`}
            aria-label="原始代码"
            className="tool-area w-full h-[380px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">处理结果</label>
            {output && (
              <button onClick={copyResult} className="btn-secondary !py-1.5 !px-3 text-xs">
                {copied ? <Check size={13} className="inline mr-1" /> : <Copy size={13} className="inline mr-1" />}
                {copied ? '已复制' : '复制结果'}
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="处理后的代码将显示在这里..."
            aria-label="处理结果"
            className="tool-area w-full h-[380px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333] font-mono"
          />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3 mt-6"
      >
        <button onClick={handleFormat} disabled={!input.trim()} className="btn-primary disabled:opacity-30">
          <AlignLeft size={16} className="inline mr-1.5" /> 格式化（美化）
        </button>
        <button onClick={handleCompress} disabled={!input.trim()} className="btn-secondary disabled:opacity-30">
          <Minimize2 size={16} className="inline mr-1.5" /> 压缩（去除空白）
        </button>
        <button onClick={() => { setInput(''); setOutput(''); }} className="btn-secondary">
          清空
        </button>
      </motion.div>
    </div>
  );
}
