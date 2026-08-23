import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Copy, ArrowRightLeft } from 'lucide-react';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export default function JsonYamlConverter() {
  const color = '#a78bfa';
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'json2yaml' | 'yaml2json'>('json2yaml');
  const [error, setError] = useState<string | null>(null);

  const jsonToYaml = (obj: JsonValue, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);

    if (obj === null || obj === undefined) {
      return 'null';
    }

    if (typeof obj !== 'object') {
      if (typeof obj === 'string') {
        // 含换行、冒号、井号、双引号或反斜杠时需加引号并完整转义
        if (!/[\n:#"\\]/.test(obj)) return obj;
        const escaped = obj
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escaped}"`;
      }
      return String(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => {
        const val = jsonToYaml(item, indent + 1);
        if (typeof item === 'object' && item !== null) {
          return `${spaces}-\n${val}`;
        }
        return `${spaces}- ${val}`;
      }).join('\n');
    }

    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';

    return entries.map(([key, value]) => {
      const val = jsonToYaml(value, indent + 1);
      if (typeof value === 'object' && value !== null) {
        return `${spaces}${key}:\n${val}`;
      }
      return `${spaces}${key}: ${val}`;
    }).join('\n');
  };

    interface YEntry { key: string; value: string; isEmpty: boolean }

  const yamlToJson = (yaml: string): JsonValue => {
    const lines = yaml.split('\n').filter((l) => l.trim() && !/^\s*#/.test(l));
    interface TNode { indent: number; text: string; children: TNode[] }
    const root: TNode = { indent: -1, text: '', children: [] };
    const stack: TNode[] = [root];
    for (const line of lines) {
      const node: TNode = { indent: line.search(/\S/), text: line.trim(), children: [] };
      while (stack.length > 1 && node.indent <= stack[stack.length - 1].indent) stack.pop();
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }

    // 按缩进构造树后再按结构转成 JSON，正确处理嵌套对象、对象的列表、列表中的对象
    const parseEntry = (s: string): YEntry | null => {
      // 仅当冒号后有空白、或整行以冒号结尾时才视为映射条目，避免把 "http://x" 误判为键值
      const m = /^(.*?):\s+(.*)$/.exec(s) || /^(.*?):$/.exec(s);
      if (!m) return null;
      return { key: m[1], value: m[2] ?? '', isEmpty: m[2] === undefined };
    };

    const convertNode = (n: TNode): JsonValue => {
      const text = n.text;
      const isItem = text.startsWith('- ');
      const content = isItem ? text.slice(2).trim() : text;

      if (isItem) {
        const entry = parseEntry(content);
        if (entry) {
          // 列表项本身是映射条目（如 "- name: a"），其子节点为同一对象的下级字段
          if (n.children.length > 0) {
            const dict: Record<string, JsonValue> = {};
            dict[entry.key] = entry.isEmpty ? convertChildren(n.children) : parseYamlValue(entry.value);
            for (const child of n.children) {
              if (!child.text.startsWith('- ')) {
                const ce = parseEntry(child.text);
                if (ce && !(ce.key in dict)) dict[ce.key] = convertNode(child);
              }
            }
            return dict;
          }
          return { [entry.key]: parseYamlValue(entry.value) };
        }
        return n.children.length > 0 ? convertChildren(n.children) : parseYamlValue(content);
      }

      const entry = parseEntry(text);
      if (!entry) return parseYamlValue(text);
      return entry.isEmpty ? convertChildren(n.children) : parseYamlValue(entry.value);
    };

    const convertChildren = (children: TNode[]): JsonValue => {
      if (children.length === 0) return {};
      const allItems = children.every((c) => c.text.startsWith('- '));
      if (allItems) return children.map(convertNode);
      const dict: Record<string, JsonValue> = {};
      for (const c of children) {
        const e = parseEntry(c.text);
        if (e) dict[e.key] = convertNode(c);
      }
      return dict;
    };

    return convertChildren(root.children);
  };
const parseYamlValue = (str: string): JsonValue => {
    if (str === 'null' || str === '~') return null;
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
    if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1);
    if (!isNaN(Number(str))) return Number(str);
    return str;
  };

  const convert = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'json2yaml') {
        const json = JSON.parse(input);
        setOutput(jsonToYaml(json));
      } else {
        const yamlObj = yamlToJson(input);
        setOutput(JSON.stringify(yamlObj, null, 2));
      }
    } catch {
      setError(mode === 'json2yaml' ? 'JSON格式错误' : 'YAML格式错误');
      setOutput('');
    }
  };

  const swapInOut = () => {
    setInput(output);
    setOutput('');
    setMode(mode === 'json2yaml' ? 'yaml2json' : 'json2yaml');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCode size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">JSON/YAML互转</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>将JSON文本转换为YAML格式，或将YAML转换回JSON，支持格式校验</p>
      </motion.div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setMode('json2yaml')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: mode === 'json2yaml' ? 500 : 400,
            background: mode === 'json2yaml' ? `${color}24` : 'rgba(255,255,255,0.05)',
            color: mode === 'json2yaml' ? color : '#666',
            border: mode === 'json2yaml' ? `${color}4d` : 'none',
            cursor: 'pointer',
          }}
        >
          JSON → YAML
        </button>
        <button
          onClick={() => setMode('yaml2json')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: mode === 'yaml2json' ? 500 : 400,
            background: mode === 'yaml2json' ? '#00d9ff24' : 'rgba(255,255,255,0.05)',
            color: mode === 'yaml2json' ? '#00d9ff' : '#666',
            border: mode === 'yaml2json' ? '#00d9ff4d' : 'none',
            cursor: 'pointer',
          }}
        >
          YAML → JSON
        </button>
      </div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 ml-1 block">
            {mode === 'json2yaml' ? 'JSON输入' : 'YAML输入'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'json2yaml' ? '粘贴JSON内容...' : '粘贴YAML内容...'}
            aria-label={mode === 'json2yaml' ? 'JSON输入' : 'YAML输入'}
            className="tool-area w-full h-[350px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[var(--text-faint)] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              {mode === 'json2yaml' ? 'YAML输出' : 'JSON输出'}
            </label>
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
            className="tool-area w-full h-[350px] p-5 text-sm leading-relaxed resize-none outline-none text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] font-mono"
          />
        </motion.div>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mt-6 border border-red-500/30">
          <span className="text-[var(--danger)] text-sm">{error}</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mt-6">
        <button onClick={convert} disabled={!input} className="btn-primary disabled:opacity-30">
          转换
        </button>
        <button onClick={swapInOut} disabled={!output} className="btn-secondary">
          <ArrowRightLeft size={15} className="inline mr-1.5" /> 交换输入输出
        </button>
        <button onClick={() => { setInput(''); setOutput(''); setError(null); }} className="btn-secondary">
          清空
        </button>
      </motion.div>
    </div>
  );
}