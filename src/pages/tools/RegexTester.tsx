import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Regex, Copy, AlertCircle, CheckCircle2, Hash, Brackets } from 'lucide-react';

interface Flag {
  key: string;
  label: string;
}

const FLAGS: Flag[] = [
  { key: 'g', label: 'g 全局' },
  { key: 'i', label: 'i 忽略大小写' },
  { key: 'm', label: 'm 多行' },
  { key: 's', label: 's dotAll' },
];

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState<Set<string>>(new Set(['g']));

  const toggleFlag = (key: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const result = useMemo(() => {
    if (!pattern) {
      return {
        error: null,
        matches: [] as RegExpExecArray[],
        matchText: testString,
        captureGroups: [] as string[][],
        matchCount: 0,
        isMatch: false,
      };
    }

    try {
      const flagStr = Array.from(flags).join('');
      const regex = new RegExp(pattern, flagStr);
      const matches: RegExpExecArray[] = [];
      const captureGroups: string[][] = [];
      let match: RegExpExecArray | null;

      if (flags.has('g')) {
        while ((match = regex.exec(testString)) !== null) {
          matches.push(match);
          if (match.length > 1) {
            captureGroups.push(match.slice(1));
          }
          if (match[0].length === 0) regex.lastIndex++;
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          matches.push(match);
          if (match.length > 1) {
            captureGroups.push(match.slice(1));
          }
        }
      }

      // Build highlighted text
      let lastIndex = 0;
      const highlightedParts: (string | { text: string; isMatch: boolean })[] = [];

      if (flags.has('g')) {
        for (const m of matches) {
          if (m.index! > lastIndex) {
            highlightedParts.push(testString.slice(lastIndex, m.index));
          }
          highlightedParts.push({ text: m[0], isMatch: true });
          lastIndex = m.index! + m[0].length;
        }
        if (lastIndex < testString.length) {
          highlightedParts.push(testString.slice(lastIndex));
        }
      } else {
        if (matches.length > 0 && matches[0].index !== undefined) {
          const m = matches[0];
          if (m.index > 0) {
            highlightedParts.push(testString.slice(0, m.index));
          }
          highlightedParts.push({ text: m[0], isMatch: true });
          if (m.index + m[0].length < testString.length) {
            highlightedParts.push(testString.slice(m.index + m[0].length));
          }
        } else {
          highlightedParts.push(testString);
        }
      }

      return {
        error: null,
        matches,
        matchText: highlightedParts,
        captureGroups,
        matchCount: matches.length,
        isMatch: matches.length > 0,
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : '正则表达式错误',
        matches: [],
        matchText: testString,
        captureGroups: [],
        matchCount: 0,
        isMatch: false,
      };
    }
  }, [pattern, testString, flags]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
            <Regex size={20} className="text-[#e94560]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">正则表达式测试</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时测试正则表达式，支持匹配高亮和捕获组显示</p>
      </motion.div>

      {/* Pattern Input & Flags */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-[#a8b2c1]">正则表达式</span>
            <div className="flex-1 relative">
              <code className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-xs select-none">/</code>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="输入正则表达式，如 \\d+、[a-z]+ 等"
                aria-label="正则表达式"
                className="tool-area w-full h-[44px] pl-7 pr-8 text-sm outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333] font-mono"
              />
              <code className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] text-xs select-none">/{Array.from(flags).join('')}</code>
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-2 flex-wrap">
            {FLAGS.map((flag) => (
              <button
                key={flag.key}
                onClick={() => toggleFlag(flag.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  flags.has(flag.key)
                    ? 'bg-[#e94560]/15 text-[#e94560]'
                    : 'bg-white/5 text-[#666] hover:text-[#a8b2c1]'
                }`}
              >
                {flag.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Test String Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <label className="text-sm font-medium text-[#a8b2c1] ml-1 mb-2 block">测试文本</label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="输入要匹配的测试文本..."
          aria-label="测试文本"
          className="tool-area w-full h-[180px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333]"
        />
      </motion.div>

      {/* Result Area */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="mt-6 space-y-4">
          {/* Match Status */}
          {(pattern || testString) && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                {result.error ? (
                  <>
                    <AlertCircle size={18} className="text-red-400" />
                    <span className="text-red-400 text-sm">{result.error}</span>
                  </>
                ) : pattern ? (
                  <>
                    {result.isMatch ? (
                      <CheckCircle2 size={18} className="text-green-400" />
                    ) : (
                      <AlertCircle size={18} className="text-[#666]" />
                    )}
                    <span className={`text-sm ${result.isMatch ? 'text-green-400' : 'text-[#888]'}`}>
                      {result.isMatch
                        ? `匹配成功 — 共 ${result.matchCount} 处匹配`
                        : '未找到匹配'}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Highlighted Output */}
          {!result.error && pattern && testString && (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#666] flex items-center gap-1.5">
                  <Brackets size={12} /> 匹配高亮
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(testString)}
                  className="btn-secondary !py-1 !px-2 text-xs"
                >
                  <Copy size={11} className="inline mr-1" /> 复制原文
                </button>
              </div>
              <div className="tool-area p-4 min-h-[80px] max-h-[240px] overflow-auto">
                <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">
                  {Array.isArray(result.matchText)
                    ? result.matchText.map((part, i) =>
                        typeof part === 'string' ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <mark
                            key={i}
                            className="bg-[#e94560]/25 text-white rounded px-0.5"
                          >
                            {part.text}
                          </mark>
                        )
                      )
                    : result.matchText}
                </pre>
              </div>
            </div>
          )}

          {/* Capture Groups */}
          {result.captureGroups.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Hash size={14} className="text-[#e94560]" />
                <span className="text-xs text-[#666]">捕获组 ({result.captureGroups.length} 组)</span>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-auto">
                {result.captureGroups.map((groups, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-1.5 px-3 rounded-lg bg-white/[0.02]">
                    <span className="text-xs text-[#555] font-mono shrink-0 pt-0.5">#{idx + 1}</span>
                    <div className="flex flex-wrap gap-2">
                      {groups.map(
                        (group, gIdx) =>
                          group !== undefined && (
                            <code
                              key={gIdx}
                              className="text-xs bg-[#e94560]/10 text-[#e94560] px-2 py-0.5 rounded font-mono"
                            >
                              ${gIdx + 1}: {group}
                            </code>
                          )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
