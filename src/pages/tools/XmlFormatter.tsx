import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Copy, AlertCircle, CheckCircle } from 'lucide-react';

// Tokenize XML into segments for robust parsing
type Token =
  | { type: 'open'; name: string; full: string }
  | { type: 'close'; name: string; full: string }
  | { type: 'selfclose'; name: string; full: string }
  | { type: 'text'; content: string }
  | { type: 'comment'; content: string }
  | { type: 'cdata'; content: string }
  | { type: 'decl'; content: string };

function tokenizeXml(xml: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < xml.length) {
    // Text content before a tag
    if (xml[i] !== '<') {
      const end = xml.indexOf('<', i);
      const text = end === -1 ? xml.slice(i) : xml.slice(i, end);
      if (text) tokens.push({ type: 'text', content: text });
      i = end === -1 ? xml.length : end;
      continue;
    }

    // CDATA section
    if (xml.slice(i, i + 9) === '<![CDATA[') {
      const end = xml.indexOf(']]>', i + 9);
      if (end === -1) {
        tokens.push({ type: 'text', content: xml.slice(i) });
        break;
      }
      tokens.push({ type: 'cdata', content: xml.slice(i, end + 3) });
      i = end + 3;
      continue;
    }

    // Comment
    if (xml.slice(i, i + 4) === '<!--') {
      const end = xml.indexOf('-->', i + 4);
      if (end === -1) {
        tokens.push({ type: 'text', content: xml.slice(i) });
        break;
      }
      tokens.push({ type: 'comment', content: xml.slice(i, end + 3) });
      i = end + 3;
      continue;
    }

    // XML declaration or processing instruction
    if (xml[i + 1] === '?') {
      const end = xml.indexOf('?>', i + 2);
      if (end === -1) {
        tokens.push({ type: 'text', content: xml.slice(i) });
        break;
      }
      tokens.push({ type: 'decl', content: xml.slice(i, end + 2) });
      i = end + 2;
      continue;
    }

    // DOCTYPE or other <! declarations
    if (xml.slice(i, i + 2) === '<!') {
      const end = xml.indexOf('>', i + 2);
      if (end === -1) {
        tokens.push({ type: 'text', content: xml.slice(i) });
        break;
      }
      tokens.push({ type: 'decl', content: xml.slice(i, end + 1) });
      i = end + 1;
      continue;
    }

    // Closing tag
    if (xml[i + 1] === '/') {
      const end = xml.indexOf('>', i + 2);
      if (end === -1) {
        tokens.push({ type: 'text', content: xml.slice(i) });
        break;
      }
      const full = xml.slice(i, end + 1);
      const name = full.match(/<\/(\S+)/)?.[1] || '';
      tokens.push({ type: 'close', name, full });
      i = end + 1;
      continue;
    }

    // Opening or self-closing tag
    // Find the real end of the tag (handle attributes with quotes)
    let tagEnd = -1;
    let j = i + 1;
    let inQuote: string | null = null;
    while (j < xml.length) {
      if (inQuote) {
        if (xml[j] === inQuote) inQuote = null;
      } else {
        if (xml[j] === '"' || xml[j] === "'") {
          inQuote = xml[j];
        } else if (xml[j] === '>') {
          tagEnd = j;
          break;
        }
      }
      j++;
    }

    if (tagEnd === -1) {
      tokens.push({ type: 'text', content: xml.slice(i) });
      break;
    }

    const full = xml.slice(i, tagEnd + 1);
    const isSelfClosing = full.endsWith('/>');
    const name = full.match(/<(\S+)/)?.[1] || '';

    if (isSelfClosing) {
      tokens.push({ type: 'selfclose', name, full });
    } else {
      tokens.push({ type: 'open', name, full });
    }
    i = tagEnd + 1;
  }

  return tokens;
}

function formatXml(xml: string, indentSize: number): string {
  const tokens = tokenizeXml(xml);
  const pad = ' '.repeat(indentSize);
  let level = 0;
  const lines: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    switch (token.type) {
      case 'decl':
        lines.push(token.content);
        break;

      case 'comment':
        lines.push(pad.repeat(level) + token.content);
        break;

      case 'cdata':
        lines.push(pad.repeat(level) + token.content);
        break;

      case 'open': {
        // Check if next token is text and the one after is close (inline content)
        const next = tokens[i + 1];
        const afterNext = tokens[i + 2];
        if (
          next?.type === 'text' &&
          afterNext?.type === 'close' &&
          afterNext.name === token.name &&
          next.content.trim().length > 0
        ) {
          // Inline: <tag>text</tag>
          lines.push(pad.repeat(level) + token.full + next.content.trim() + afterNext.full);
          i += 2; // skip text and close
        } else {
          lines.push(pad.repeat(level) + token.full);
          level++;
        }
        break;
      }

      case 'selfclose':
        lines.push(pad.repeat(level) + token.full);
        break;

      case 'close':
        level = Math.max(0, level - 1);
        lines.push(pad.repeat(level) + token.full);
        break;

      case 'text': {
        const trimmed = token.content.trim();
        if (trimmed) {
          lines.push(pad.repeat(level) + trimmed);
        }
        break;
      }
    }
  }

  return lines.join('\n').trim();
}

function validateXml(xml: string): string | null {
  const tokens = tokenizeXml(xml);
  const stack: string[] = [];

  for (const token of tokens) {
    if (token.type === 'open') {
      stack.push(token.name);
    } else if (token.type === 'close') {
      if (stack.length === 0) {
        return `标签配对错误：未找到 <${token.name}> 的开始标签`;
      }
      const top = stack.pop()!;
      if (top !== token.name) {
        return `标签配对错误：期望 </${top}>，但找到 </${token.name}>`;
      }
    }
  }

  if (stack.length > 0) {
    return `标签未闭合：${stack.map((t) => `<${t}>`).join(', ')}`;
  }

  return null;
}

export default function XmlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [indentSize, setIndentSize] = useState(2);

  const handleFormat = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    const validationError = validateXml(input);
    if (validationError) {
      setError(validationError);
      setOutput('');
      return;
    }

    try {
      const formatted = formatXml(input, indentSize);
      setOutput(formatted);
    } catch {
      setError('格式化失败：XML结构异常');
    }
  };

  const handleMinify = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    const validationError = validateXml(input);
    if (validationError) {
      setError(validationError);
      setOutput('');
      return;
    }

    try {
      // Remove whitespace between tags, preserve whitespace within text content
      const minified = input
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .trim();
      setOutput(minified);
    } catch {
      setError('压缩失败');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center">
            <FileCode size={20} className="text-[#6bcb77]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">XML格式化与校验</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">美化XML缩进，同时检查标签是否闭合、语法错误</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm text-[#a8b2c1]">缩进大小：</label>
          <select
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            aria-label="缩进大小"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#6bcb77]/30"
          >
            <option value={2}>2 空格</option>
            <option value={4}>4 空格</option>
          </select>
        </div>
      </motion.div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">输入XML</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴XML内容..."
            aria-label="输入XML"
            className="tool-area w-full h-[350px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">输出结果</label>
            {output && (
              <button onClick={() => navigator.clipboard.writeText(output)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="结果将显示在这里..."
            aria-label="输出结果"
            className="tool-area w-full h-[350px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333] font-mono"
          />
        </motion.div>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mt-6 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Success */}
      {output && !error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mt-6 border border-green-500/30">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={18} />
            <span className="text-sm">XML格式正确，标签已闭合</span>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 mt-6"
      >
        <button onClick={handleFormat} disabled={!input} className="btn-primary disabled:opacity-30">
          格式化
        </button>
        <button onClick={handleMinify} disabled={!input} className="btn-secondary">
          压缩
        </button>
        <button onClick={() => { setInput(''); setOutput(''); setError(null); }} className="btn-secondary">
          清空
        </button>
      </motion.div>
    </div>
  );
}
