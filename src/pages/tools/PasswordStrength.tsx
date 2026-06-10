import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';

interface CheckItem {
  label: string;
  passed: boolean;
}

interface StrengthResult {
  score: number;
  level: string;
  levelColor: string;
  checks: CheckItem[];
  crackTime: string;
  suggestions: string[];
}

const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '111111', 'letmein', 'admin', 'welcome',
  'password1', '1234567890', 'iloveyou', 'sunshine', 'master',
];

function analyzePassword(password: string): StrengthResult {
  const checks: CheckItem[] = [
    { label: '长度 ≥ 8 字符', passed: password.length >= 8 },
    { label: '长度 ≥ 12 字符', passed: password.length >= 12 },
    { label: '包含小写字母', passed: /[a-z]/.test(password) },
    { label: '包含大写字母', passed: /[A-Z]/.test(password) },
    { label: '包含数字', passed: /\d/.test(password) },
    { label: '包含特殊符号', passed: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) },
    { label: '非常见弱密码', passed: !COMMON_PASSWORDS.includes(password.toLowerCase()) },
    { label: '无连续/重复字符', passed: !/(.)\1{2,}|(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  let score = Math.round((passedCount / checks.length) * 100);
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) score = Math.min(score, 10);

  let level = '';
  let levelColor = '';
  if (score < 20) { level = '极弱'; levelColor = '#ef4444'; }
  else if (score < 40) { level = '弱'; levelColor = '#f97316'; }
  else if (score < 60) { level = '中等'; levelColor = '#eab308'; }
  else if (score < 80) { level = '强'; levelColor = '#22c55e'; }
  else { level = '极强'; levelColor = '#00d9ff'; }

  // Crack time estimation
  let crackTime = '瞬间';
  const charsetSize =
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/\d/.test(password) ? 10 : 0) +
    (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) ? 32 : 0);
  const combinations = charsetSize ** password.length;

  if (combinations > 0) {
    const guessesPerSecond = 10000000000; // 10 billion
    const seconds = combinations / guessesPerSecond;
    if (seconds > 31536000 * 1000) crackTime = '数千年+';
    else if (seconds > 31536000) crackTime = `${Math.round(seconds / 31536000)} 年`;
    else if (seconds > 86400) crackTime = `${Math.round(seconds / 86400)} 天`;
    else if (seconds > 3600) crackTime = `${Math.round(seconds / 3600)} 小时`;
    else if (seconds > 60) crackTime = `${Math.round(seconds / 60)} 分钟`;
    else if (seconds > 1) crackTime = `${Math.round(seconds)} 秒`;
  }

  const suggestions: string[] = [];
  if (!checks[0].passed) suggestions.push('增加密码长度至至少 8 个字符');
  if (!checks[2].passed || !checks[3].passed) suggestions.push('混合使用大小写字母');
  if (!checks[4].passed) suggestions.push('添加数字字符');
  if (!checks[5].passed) suggestions.push('添加特殊符号（如 !@#$% 等）');
  if (!checks[7].passed) suggestions.push('避免连续或重复的字符序列');

  return { score, level, levelColor, checks, crackTime, suggestions };
}

export default function PasswordStrength() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const result = useMemo(() => analyzePassword(password), [password]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
            <Shield size={20} className="text-[#e94560]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">密码强度检测</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时分析密码安全性，估算暴力破解时间</p>
      </motion.div>

      {/* Password Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        <label className="block text-sm font-medium text-[#a8b2c1] mb-3">输入密码</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入要检测的密码..."
            aria-label="输入密码"
            className="tool-area w-full py-3.5 pl-4 pr-12 text-white text-sm outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333]"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Strength Bar */}
        {password && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#666]">密码长度：{password.length} 字符</span>
              <span className="text-xs font-semibold" style={{ color: result.levelColor }}>
                {result.level}
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.score}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: result.levelColor }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#333]">0</span>
              <span className="text-[10px] text-[#333]">{result.score}%</span>
              <span className="text-[10px] text-[#333]">100</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Analysis Panel */}
      {password && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {/* Crack Time */}
          <div className="glass-card p-5 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-[#e94560]" />
                <span className="text-sm text-[#a8b2c1]">暴力破解预估时间（100亿次/秒）</span>
              </div>
              <span className="font-['Syne'] font-bold text-lg" style={{ color: result.levelColor }}>
                {result.crackTime}
              </span>
            </div>
          </div>

          {/* Checklist */}
          <div className="glass-card p-5 mb-4">
            <h3 className="text-sm font-semibold text-white mb-4">安全检查项</h3>
            <div className="space-y-3">
              {result.checks.map((check, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${check.passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {check.passed ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-red-400" />}
                  </div>
                  <span className={`text-sm ${check.passed ? 'text-[#a8b2c1]' : 'text-red-400'}`}>{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="glass-card p-5 border-l-2 border-[#e94560]/50">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={15} className="text-[#e94560]" />
                改进建议
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-[#a8b2c1] flex items-start gap-2">
                    <span className="text-[#e94560] mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {!password && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-12 text-center">
          <Shield size={48} className="mx-auto text-[#222] mb-4" />
          <p className="text-[#555] text-sm">在上方输入框中输入密码，即可查看安全分析结果</p>
        </motion.div>
      )}
    </div>
  );
}
