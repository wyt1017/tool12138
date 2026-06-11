import { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, Copy, ArrowRightLeft } from 'lucide-react';

export default function CsvJsonConverter() {
  const color = '#6bcb77';
  const cyan = '#00d9ff';
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'csv2json' | 'json2csv'>('csv2json');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const csvToJson = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const lines = input.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setOutput('[]');
        return;
      }

      let headers: string[] = [];
      let startIndex = 0;

      if (hasHeader) {
        headers = parseCsvLine(lines[0], delimiter);
        startIndex = 1;
      } else {
        const firstLine = parseCsvLine(lines[0], delimiter);
        headers = firstLine.map((_, i) => `column_${i}`);
      }

      const result = lines.slice(startIndex).map(line => {
        const values = parseCsvLine(line, delimiter);
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });

      setOutput(JSON.stringify(result, null, 2));
    } catch {
      setError('CSV解析错误');
      setOutput('');
    }
  };

  const parseCsvLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  const jsonToCsv = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const json = JSON.parse(input);
      if (!Array.isArray(json)) {
        setError('JSON必须是数组格式');
        setOutput('');
        return;
      }

      if (json.length === 0) {
        setOutput('');
        return;
      }

      const headers = Object.keys(json[0]);
      const csvLines: string[] = [];

      if (hasHeader) {
        csvLines.push(headers.join(delimiter));
      }

      json.forEach(item => {
        const values = headers.map(header => {
          const val = item[header] ?? '';
          // 如果包含分隔符或引号，需要用引号包裹
          if (typeof val === 'string' && (val.includes(delimiter) || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val);
        });
        csvLines.push(values.join(delimiter));
      });

      setOutput(csvLines.join('\n'));
    } catch {
      setError('JSON解析错误');
      setOutput('');
    }
  };

  const convert = () => {
    if (mode === 'csv2json') {
      csvToJson();
    } else {
      jsonToCsv();
    }
  };

  const swapInOut = () => {
    setInput(output);
    setOutput('');
    setMode(mode === 'csv2json' ? 'json2csv' : 'csv2json');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Table size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">CSV/JSON互转</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>CSV文本与JSON数组互相转换，支持带表头解析和自定义分隔符</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setMode('csv2json')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: mode === 'csv2json' ? 500 : 400,
                background: mode === 'csv2json' ? `${color}24` : 'rgba(255,255,255,0.05)',
                color: mode === 'csv2json' ? color : '#666',
                border: mode === 'csv2json' ? `${color}4d` : 'none',
                cursor: 'pointer',
              }}
            >
              CSV → JSON
            </button>
            <button
              onClick={() => setMode('json2csv')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: mode === 'json2csv' ? 500 : 400,
                background: mode === 'json2csv' ? `${cyan}24` : 'rgba(255,255,255,0.05)',
                color: mode === 'json2csv' ? cyan : '#666',
                border: mode === 'json2csv' ? `${cyan}4d` : 'none',
                cursor: 'pointer',
              }}
            >
              JSON → CSV
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666]">分隔符：</span>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              aria-label="分隔符"
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
            >
              <option value=",">逗号 (,)</option>
              <option value=";">分号 (;)</option>
              <option value="\t">制表符 (Tab)</option>
              <option value="|">竖线 (|)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#a8b2c1]">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              aria-label="包含表头"
              className="w-4 h-4 rounded accent-[#6bcb77]"
            />
            包含表头
          </label>
        </div>
      </motion.div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">
            {mode === 'csv2json' ? 'CSV输入' : 'JSON输入'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'csv2json' ? '粘贴CSV内容...' : '粘贴JSON数组...'}
            aria-label={mode === 'csv2json' ? 'CSV输入' : 'JSON输入'}
            className="tool-area w-full h-[300px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">
              {mode === 'csv2json' ? 'JSON输出' : 'CSV输出'}
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
            className="tool-area w-full h-[300px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333] font-mono"
          />
        </motion.div>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mt-6 border border-red-500/30">
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      {/* Actions */}
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