import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Copy, RefreshCw, Shield } from 'lucide-react';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: false,
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [batchCount, setBatchCount] = useState(5);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generatePassword = useCallback(() => {
    let charset = '';
    const requiredChars: string[] = [];

    if (options.uppercase) {
      charset += UPPERCASE;
      requiredChars.push(UPPERCASE);
    }
    if (options.lowercase) {
      charset += LOWERCASE;
      requiredChars.push(LOWERCASE);
    }
    if (options.numbers) {
      charset += NUMBERS;
      requiredChars.push(NUMBERS);
    }
    if (options.special) {
      charset += SPECIAL;
      requiredChars.push(SPECIAL);
    }

    if (charset.length === 0) {
      charset = LOWERCASE;
      requiredChars.push(LOWERCASE);
    }

    // 使用 rejection sampling 避免随机数偏差
    const getRandomChar = (chars: string): string => {
      const maxValid = Math.floor(256 / chars.length) * chars.length;
      let randomValue: number;
      const array = new Uint8Array(1);
      do {
        crypto.getRandomValues(array);
        randomValue = array[0];
      } while (randomValue >= maxValid);
      return chars[randomValue % chars.length];
    };

    // 确保每种选中的字符类型至少出现一次
    let password = '';
    for (const charSet of requiredChars) {
      password += getRandomChar(charSet);
    }

    // 填充剩余长度
    const remainingLength = length - password.length;
    for (let i = 0; i < remainingLength; i++) {
      password += getRandomChar(charset);
    }

    // 打乱顺序，避免固定模式
    const chars = password.split('');
    const shuffleArray = new Uint32Array(chars.length);
    crypto.getRandomValues(shuffleArray);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = shuffleArray[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  }, [length, options]);

  const handleGenerate = () => {
    const result: string[] = [];
    for (let i = 0; i < batchCount; i++) {
      result.push(generatePassword());
    }
    setPasswords(result);
  };

  const getStrength = (pwd: string): { level: string; color: string; width: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: '弱', color: '#ef4444', width: '25%' };
    if (score <= 4) return { level: '中', color: '#f59e0b', width: '50%' };
    if (score <= 5) return { level: '强', color: '#22c55e', width: '75%' };
    return { level: '极强', color: '#10b981', width: '100%' };
  };

  const handleCopy = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index ?? -1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(passwords.join('\n'));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
            <KeyRound size={20} className="text-[#e94560]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">随机密码生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">生成安全随机密码，支持自定义长度和字符类型</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        {/* Length Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#a8b2c1]">密码长度</label>
            <span className="text-lg font-bold text-white font-mono bg-white/5 px-3 py-1 rounded-lg">{length}</span>
          </div>
          <input
            type="range"
            min={6}
            max={128}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            aria-label="密码长度"
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#e94560]"
          />
          <div className="flex justify-between text-xs text-[#666] mt-1">
            <span>6</span>
            <span>128</span>
          </div>
        </div>

        {/* Character Options */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#a8b2c1] mb-3 block">字符类型</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'uppercase' as const, label: '大写字母 A-Z', example: 'ABCXYZ' },
              { key: 'lowercase' as const, label: '小写字母 a-z', example: 'abcxyz' },
              { key: 'numbers' as const, label: '数字 0-9', example: '123456' },
              { key: 'special' as const, label: '特殊字符 !@#$%', example: '!@#$%^&*' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setOptions((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  options[opt.key]
                    ? 'border-[#e94560]/30 bg-[#e94560]/10 text-white'
                    : 'border-white/10 bg-white/5 text-[#666]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    options[opt.key] ? 'border-[#e94560] bg-[#e94560]' : 'border-[#444]'
                  }`}
                >
                  {options[opt.key] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs opacity-50 font-mono">{opt.example}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Batch Count */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#a8b2c1]">批量生成数量</label>
            <span className="text-lg font-bold text-white font-mono bg-white/5 px-3 py-1 rounded-lg">{batchCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={batchCount}
            onChange={(e) => setBatchCount(Number(e.target.value))}
            aria-label="批量生成数量"
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#e94560]"
          />
        </div>

        {/* Generate Button */}
        <button onClick={handleGenerate} className="btn-primary w-full py-3 text-base">
          <RefreshCw size={18} className="inline mr-2" /> 生成密码
        </button>
      </motion.div>

      {/* Results */}
      {passwords.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield size={18} className="text-[#e94560]" /> 生成结果
            </h2>
            {passwords.length > 1 && (
              <button onClick={handleCopyAll} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制全部
              </button>
            )}
          </div>

          <div className="space-y-3">
            {passwords.map((pwd, index) => {
              const strength = getStrength(pwd);
              return (
                <div key={index} className="glass-card p-4 group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-lg text-white break-all tracking-wider">{pwd}</div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[200px]">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: strength.width, backgroundColor: strength.color }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.level}</span>
                        <span className="text-xs text-[#666]">{pwd.length} 位</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(pwd, index)}
                      className="btn-secondary !py-2 !px-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedIndex === index ? (
                        <span className="text-green-400 text-xs">已复制</span>
                      ) : (
                        <>
                          <Copy size={14} className="inline mr-1" /> 复制
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
