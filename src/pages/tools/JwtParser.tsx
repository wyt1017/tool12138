import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Key, Copy, AlertCircle } from 'lucide-react';

const COLOR = '#e94560';

export default function JwtParser() {
  const [input, setInput] = useState('');

  const parsed = useMemo(() => {
    if (!input.trim()) return null;

    const parts = input.trim().split('.');
    if (parts.length !== 3) {
      return { error: 'JWT格式错误：应包含3个部分（Header.Payload.Signature）' };
    }

    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const signature = parts[2];

      return {
        header,
        payload,
        signature,
        headerRaw: parts[0],
        payloadRaw: parts[1],
      };
    } catch {
      return { error: '解析失败：无法解码Base64内容' };
    }
  }, [input]);

  const copyJson = (obj: object) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Key size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">JWT解析器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">粘贴JWT字符串，自动解码Header、Payload、Signature</p>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
        <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">JWT字符串</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴JWT Token..."
          aria-label="JWT字符串"
          className="tool-area w-full h-[120px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333] font-mono"
        />
      </motion.div>

      {/* Error */}
      {parsed?.error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-6 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={18} />
            <span className="text-sm">{parsed.error}</span>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {parsed && !parsed.error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          {/* Header */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span style={{ color: COLOR }}>01</span> Header
              </h2>
              <button onClick={() => copyJson(parsed.header)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-[#a8b2c1] overflow-x-auto">
              <pre>{JSON.stringify(parsed.header, null, 2)}</pre>
            </div>
            <div className="mt-3 text-xs text-[#666]">
              <span>原始Base64: </span>
              <code className="font-mono bg-white/5 px-2 py-1 rounded">{parsed.headerRaw}</code>
            </div>
          </div>

          {/* Payload */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#00d9ff]">02</span> Payload
              </h2>
              <button onClick={() => copyJson(parsed.payload)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-[#a8b2c1] overflow-x-auto">
              <pre>{JSON.stringify(parsed.payload, null, 2)}</pre>
            </div>
            {/* Common claims explanation */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {parsed.payload.iat && (
                <div className="bg-white/5 rounded px-2 py-1">
                  <span className="text-[#666]">iat (签发时间): </span>
                  <span className="text-[#a8b2c1]">{new Date(parsed.payload.iat * 1000).toLocaleString()}</span>
                </div>
              )}
              {parsed.payload.exp && (
                <div className="bg-white/5 rounded px-2 py-1">
                  <span className="text-[#666]">exp (过期时间): </span>
                  <span className="text-[#a8b2c1]">{new Date(parsed.payload.exp * 1000).toLocaleString()}</span>
                </div>
              )}
              {parsed.payload.nbf && (
                <div className="bg-white/5 rounded px-2 py-1">
                  <span className="text-[#666]">nbf (生效时间): </span>
                  <span className="text-[#a8b2c1]">{new Date(parsed.payload.nbf * 1000).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-[#666]">
              <span>原始Base64: </span>
              <code className="font-mono bg-white/5 px-2 py-1 rounded">{parsed.payloadRaw}</code>
            </div>
          </div>

          {/* Signature */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-[#6bcb77]">03</span> Signature
              </h2>
              <button onClick={() => navigator.clipboard.writeText(parsed.signature ?? '')} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-[#a8b2c1] break-all">
              {parsed.signature}
            </div>
            <p className="mt-3 text-xs text-[#666]">
              Signature 是对 Header + Payload 使用密钥和算法签名后的结果，无法解码。
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}