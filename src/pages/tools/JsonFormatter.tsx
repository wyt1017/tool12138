import { useState } from 'react';
import { motion } from 'framer-motion';
import { Braces, Copy, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);
  const [showTree, setShowTree] = useState(false);

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError('');
      setShowTree(false);
    } catch (e) {
      setError(`JSON格式错误: ${(e as Error).message}`);
      setOutput('');
      setShowTree(false);
    }
  };

  const compress = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
      setShowTree(false);
    } catch (e) {
      setError(`JSON格式错误: ${(e as Error).message}`);
      setOutput('');
      setShowTree(false);
    }
  };

  const renderTreeNode = (data: unknown, key?: string, depth = 0): React.ReactNode => {
    if (data === null) {
      return (
        <div key={key ?? depth} style={{ paddingLeft: `${depth * 20}px` }} className="py-0.5">
          <ChevronRight size={14} className="inline mr-1 text-[#555]" />
          <span className="text-[#e94560]">{key}</span>
          <span className="text-[#888]">: </span>
          <span className="text-[#888] italic">null</span>
        </div>
      );
    }
    if (typeof data === 'boolean') {
      return (
        <div key={key ?? depth} style={{ paddingLeft: `${depth * 20}px` }} className="py-0.5">
          <ChevronRight size={14} className="inline mr-1 text-[#555]" />
          <span className="text-[#e94560]">{key}</span>
          <span className="text-[#888]">: </span>
          <span className="text-[#6bcb77]">{String(data)}</span>
        </div>
      );
    }
    if (typeof data === 'number') {
      return (
        <div key={key ?? depth} style={{ paddingLeft: `${depth * 20}px` }} className="py-0.5">
          <ChevronRight size={14} className="inline mr-1 text-[#555]" />
          <span className="text-[#e94560]">{key}</span>
          <span className="text-[#888]">: </span>
          <span className="text-[#ffd369]">{data}</span>
        </div>
      );
    }
    if (typeof data === 'string') {
      return (
        <div key={key ?? depth} style={{ paddingLeft: `${depth * 20}px` }} className="py-0.5">
          <ChevronRight size={14} className="inline mr-1 text-[#555]" />
          <span className="text-[#e94560]">{key}</span>
          <span className="text-[#888]">: </span>
          <span className="text-[#00d9ff]">"{data}"</span>
        </div>
      );
    }
    if (Array.isArray(data)) {
      return (
        <div key={key ?? depth} style={{ paddingLeft: `${depth * 20}px` }} className="py-0.5">
          <ChevronDown size={14} className="inline mr-1 text-[#a78bfa]" />
          <span className="text-[#e94560]">{key}</span>
          <span className="text-[#888]">: </span>
          <span className="text-[#a78bfa]">[{data.length}]</span>
          {data.map((item, i) => (
            <div key={i}>{renderTreeNode(item, String(i), depth + 1)}</div>
          ))}
        </div>
      );
    }
    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const keys = Object.keys(obj);
      return (
        <div key={key ?? depth} style={{ paddingLeft: `${depth * 20}px` }} className="py-0.5">
          <ChevronDown size={14} className="inline mr-1 text-[#ffd369]" />
          <span className="text-[#ffd369]">{key || '{root}'}</span>
          <span className="text-[#888]">: </span>
          <span className="text-[#ffd369]">{'{'}{keys.length}{'}'}</span>
          {keys.map((k) => (
            <div key={k}>{renderTreeNode(obj[k], k, depth + 1)}</div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleFormatAndShow = () => {
    format();
    if (!error && input) {
      setTimeout(() => setShowTree(true), 100);
    }
  };

  let treeData: unknown = null;
  try {
    treeData = input ? JSON.parse(input) : null;
  } catch { /* ignore */ }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
            <Braces size={20} className="text-[#e94560]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">JSON格式化</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">JSON美化、压缩、校验，支持树形可视化展示</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-2 ml-1">输入JSON</label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            placeholder='{"name": "示例", "value": 123}'
            aria-label="输入JSON"
            className="tool-area w-full h-[340px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333] font-mono"
            spellCheck={false}
          />
          {error && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#e94560] bg-[#e94560]/10 border border-[#e94560]/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
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
          {!showTree ? (
            <textarea
              readOnly
              value={output}
              placeholder="点击下方按钮进行格式化..."
              aria-label="输出结果"
              className="tool-area w-full h-[340px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] font-mono placeholder:text-[#333]"
            />
          ) : (
            <div className="tool-area w-full h-[340px] overflow-auto p-5 text-sm font-mono">
              {treeData !== null ? renderTreeNode(treeData) : <span className="text-[#555]">无数据</span>}
            </div>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-3 mt-6"
      >
        <button onClick={format} disabled={!input} className="btn-primary disabled:opacity-30">
          美化格式化
        </button>
        <button onClick={compress} disabled={!input} className="btn-primary disabled:opacity-30">
          压缩（Minify）
        </button>
        <button onClick={handleFormatAndShow} disabled={!input} className="btn-primary disabled:opacity-30">
          树形展示
        </button>
        <button onClick={() => { setInput(''); setOutput(''); setError(''); setShowTree(false); }} className="btn-secondary">
          <Trash2 size={15} className="inline mr-1.5" /> 清空
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#555]">缩进:</span>
          {[2, 4].map((n) => (
            <button
              key={n}
              onClick={() => setIndent(n)}
              className={`w-8 h-8 rounded-lg text-xs font-mono transition-all ${indent === n ? 'bg-[#00d9ff]/20 text-[#00d9ff]' : 'bg-white/5 text-[#666] hover:bg-white/10'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
