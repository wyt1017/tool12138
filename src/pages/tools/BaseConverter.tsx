import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hash, Copy } from 'lucide-react';

type Base = 2 | 8 | 10 | 16;

const BASE_CONFIGS: Record<Base, { label: string; name: string; prefix: string }> = {
  2: { label: '二进制', name: 'Binary', prefix: '0b' },
  8: { label: '八进制', name: 'Octal', prefix: '0o' },
  10: { label: '十进制', name: 'Decimal', prefix: '' },
  16: { label: '十六进制', name: 'Hexadecimal', prefix: '0x' },
};

export default function BaseConverter() {
  const [activeBase, setActiveBase] = useState<Base>(10);
  const [inputValue, setInputValue] = useState('');
  const [values, setValues] = useState<Record<Base, string>>({
    2: '',
    8: '',
    10: '',
    16: '',
  });
  const [error, setError] = useState('');
  const [copiedBase, setCopiedBase] = useState<Base | null>(null);

  useEffect(() => {
    if (!inputValue.trim()) {
      setValues({ 2: '', 8: '', 10: '', 16: '' });
      setError('');
      return;
    }

    try {
      const cleaned = inputValue.replace(/^0[bxo]|^0X/i, '');
      const bigInt = BigInt(parseInt(cleaned || '0', activeBase));

      setValues({
        2: bigInt.toString(2),
        8: bigInt.toString(8),
        10: bigInt.toString(10),
        16: bigInt.toString(16).toUpperCase(),
      });
      setError('');
    } catch {
      setError(`无效的${BASE_CONFIGS[activeBase].label}数字`);
      setValues({ 2: '', 8: '', 10: '', 16: '' });
    }
  }, [inputValue, activeBase]);

  const handleCopy = async (base: Base) => {
    const value = values[base];
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedBase(base);
    setTimeout(() => setCopiedBase(null), 2000);
  };

  const formatWithSpaces = (value: string, groupSize: number): string => {
    if (!value) return '';
    return value.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.join(' ') ?? value;
  };

  const bases: Base[] = [2, 8, 10, 16];
  const colors: Record<Base, string> = {
    2: '#ef4444',
    8: '#f59e0b',
    10: '#fb923c',
    16: '#a78bfa',
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#fb923c]/15 flex items-center justify-center">
            <Hash size={20} className="text-[#fb923c]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">进制转换器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">支持二进制、八进制、十进制、十六进制互转，支持大数运算</p>
      </motion.div>

      {/* Active Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-[#a8b2c1]">输入进制</label>
          <div className="flex gap-2">
            {bases.map((base) => (
              <button
                key={base}
                onClick={() => {
                  setActiveBase(base);
                  if (values[base]) {
                    setInputValue(values[base]);
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeBase === base
                    ? `bg-[${colors[base]}]/15 text-[${colors[base]}]`
                    : 'bg-white/5 text-[#666] hover:text-white'
                }`}
                style={
                  activeBase === base
                    ? { backgroundColor: `${colors[base]}20`, color: colors[base] }
                    : undefined
                }
              >
                {BASE_CONFIGS[base].label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] font-mono text-sm">
            {BASE_CONFIGS[activeBase].prefix}
          </span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`输入${BASE_CONFIGS[activeBase].label}数值...`}
            aria-label="输入数值"
            className="tool-area w-full pl-12 pr-4 py-4 text-lg font-mono outline-none focus:border-[#fb923c]/30 transition-colors placeholder:text-[#333]"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </motion.div>

      {/* Results Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bases.map((base) => (
          <div key={base} className={`glass-card p-5 ${activeBase === base ? 'ring-2 ring-[#fb923c]/30' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[base] }}
                />
                <span className="text-sm font-semibold text-white">{BASE_CONFIGS[base].name}</span>
                <span className="text-xs text-[#666]">({BASE_CONFIGS[base].label})</span>
              </div>
              {values[base] && (
                <button onClick={() => handleCopy(base)} className="btn-secondary !py-1 !px-2.5 text-xs">
                  {copiedBase === base ? (
                    <span className="text-green-400">已复制</span>
                  ) : (
                    <>
                      <Copy size={12} className="inline mr-1" /> 复制
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="font-mono text-base break-all leading-relaxed" style={{ color: colors[base] }}>
              {values[base] ? formatWithSpaces(values[base], base === 2 ? 4 : base === 16 ? 2 : 3) : '-'}
            </div>

            {values[base] && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#666]">
                <span>{values[base].length} 位</span>
                <span className="font-mono">{BASE_CONFIGS[base].prefix}{values[base]}</span>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Quick Info */}
      {inputValue && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 glass-card p-4"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-[#666] mb-1">字节数</div>
              <div className="font-mono text-white font-bold">
                {Math.ceil((values[2]?.length ?? 0) / 8)} Bytes
              </div>
            </div>
            <div>
              <div className="text-[#666] mb-1">比特数</div>
              <div className="font-mono text-white font-bold">{values[2]?.length ?? 0} bits</div>
            </div>
            <div>
              <div className="text-[#666] mb-1">八位组</div>
              <div className="font-mono text-white font-bold">
                {Math.ceil((values[2]?.length ?? 0) / 8)} octets
              </div>
            </div>
            <div>
              <div className="text-[#666] mb-1">十六进制字节</div>
              <div className="font-mono text-white font-bold">
                {Math.ceil((values[16]?.length ?? 0) / 2)} bytes
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}