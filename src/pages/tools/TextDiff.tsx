import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Copy, Trash2, ArrowRight } from 'lucide-react';

interface DiffLine {
  type: 'add' | 'remove' | 'unchanged' | 'modify';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

// LCS-based diff algorithm
function diffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Traceback to build diff
  let i = m, j = n;
  const steps: { type: 'add' | 'remove' | 'equal'; oldIdx?: number; newIdx?: number }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      steps.push({ type: 'equal', oldIdx: i - 1, newIdx: j - 1 });
      i--; j--;
    } else if (j > 0 && (!i || dp[i][j - 1] >= dp[i - 1][j])) {
      steps.push({ type: 'add', newIdx: j - 1 });
      j--;
    } else {
      steps.push({ type: 'remove', oldIdx: i - 1 });
      i--;
    }
  }

  steps.reverse();

  // Group consecutive remove+add into modify when counts match
  const grouped: { type: 'add' | 'remove' | 'equal'; idx?: number }[] = [];
  for (const step of steps) {
    if (step.type === 'equal') {
      grouped.push({ type: 'equal', idx: step.oldIdx! });
    } else if (step.type === 'remove') {
      grouped.push({ type: 'remove', idx: step.oldIdx! });
    } else {
      grouped.push({ type: 'add', idx: step.newIdx! });
    }
  }

  // Merge adjacent remove+add pairs into modify
  const merged: { type: 'add' | 'remove' | 'modify' | 'unchanged'; content: string; oldLineNum?: number; newLineNum?: number }[] = [];
  let k = 0;
  while (k < grouped.length) {
    if (grouped[k].type === 'equal') {
      merged.push({
        type: 'unchanged',
        content: oldLines[grouped[k].idx!],
        oldLineNum: grouped[k].idx! + 1,
        newLineNum: grouped[k].idx! + 1,
      });
      k++;
    } else if (grouped[k].type === 'remove' && k + 1 < grouped.length && grouped[k + 1].type === 'add') {
      merged.push({
        type: 'modify',
        content: `${oldLines[grouped[k].idx!]} → ${newLines[grouped[k + 1].idx!]}`,
        oldLineNum: grouped[k].idx! + 1,
        newLineNum: grouped[k + 1].idx! + 1,
      });
      k += 2;
    } else if (grouped[k].type === 'remove') {
      merged.push({
        type: 'remove',
        content: oldLines[grouped[k].idx!],
        oldLineNum: grouped[k].idx! + 1,
      });
      k++;
    } else {
      merged.push({
        type: 'add',
        content: newLines[grouped[k].idx!],
        newLineNum: grouped[k].idx! + 1,
      });
      k++;
    }
  }

  // Handle trailing adds (new lines after end of old text)
  // Already handled by the loop above

  return merged;
}

export default function TextDiff() {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);
  const [hasDiffed, setHasDiffed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDiff = () => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    setDiffResult(diffLines(oldLines, newLines));
    setHasDiffed(true);
  };

  const stats = {
    add: diffResult.filter((d) => d.type === 'add').length,
    remove: diffResult.filter((d) => d.type === 'remove').length,
    modify: diffResult.filter((d) => d.type === 'modify').length,
    unchanged: diffResult.filter((d) => d.type === 'unchanged').length,
  };

  const handleCopy = async () => {
    const report = diffResult
      .map((line) => {
        const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : line.type === 'modify' ? '~' : ' ';
        return `${prefix} ${line.content}`;
      })
      .join('\n');
    try {
      await navigator.clipboard.writeText(
        `文本差异对比报告\n${'='.repeat(40)}\n新增: ${stats.add} 行 | 删除: ${stats.remove} 行 | 修改: ${stats.modify} 行 | 未变: ${stats.unchanged} 行\n${'='.repeat(40)}\n\n${report}`
      );
    } catch {
      // fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLineColor = (type: DiffLine['type']): string => {
    switch (type) {
      case 'add':
        return 'bg-emerald-500/15 border-l-2 border-emerald-500 text-emerald-300';
      case 'remove':
        return 'bg-red-500/15 border-l-2 border-red-500 text-red-300';
      case 'modify':
        return 'bg-amber-500/15 border-l-2 border-amber-500 text-amber-300';
      default:
        return 'bg-white/[0.02] border-l-2 border-white/10 text-[#888]';
    }
  };

  const getSymbol = (type: DiffLine['type']): string => {
    switch (type) {
      case 'add':
        return '+';
      case 'remove':
        return '-';
      case 'modify':
        return '~';
      default:
        return ' ';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00d9ff]/15 flex items-center justify-center">
            <GitCompare size={20} className="text-[#00d9ff]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本差异对比</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">逐行对比两段文本，高亮显示新增、删除和修改内容</p>
      </motion.div>

      {/* Input Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-2 ml-1">原始文本</label>
          <textarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="粘贴原始文本..."
            aria-label="原始文本"
            className="tool-area w-full h-[280px] p-4 text-white text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-2 ml-1">新文本</label>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="粘贴新文本..."
            aria-label="新文本"
            className="tool-area w-full h-[280px] p-4 text-white text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 mb-6">
        <button onClick={handleDiff} disabled={!oldText && !newText} className="btn-primary">
          <ArrowRight size={16} className="inline mr-2" /> 开始对比
        </button>
        <button
          onClick={() => {
            setOldText('');
            setNewText('');
            setDiffResult([]);
            setHasDiffed(false);
          }}
          disabled={!oldText && !newText}
          className="btn-secondary"
        >
          <Trash2 size={15} className="inline mr-1.5" /> 清空
        </button>
      </motion.div>

      {/* Result Area */}
      {hasDiffed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {/* Stats Bar */}
          <div className="glass-card p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded bg-emerald-500" /> 新增 <strong className="text-white ml-1">{stats.add}</strong> 行
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded bg-red-500" /> 删除 <strong className="text-white ml-1">{stats.remove}</strong> 行
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded bg-amber-500" /> 修改 <strong className="text-white ml-1">{stats.modify}</strong> 行
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded bg-white/20" /> 未变 <strong className="text-white ml-1">{stats.unchanged}</strong> 行
                </span>
              </div>
              <button onClick={handleCopy} className="btn-secondary !py-1.5 !px-3 text-xs">
                {copied ? (
                  <span className="text-green-400">已复制</span>
                ) : (
                  <>
                    <Copy size={13} className="inline mr-1" /> 复制报告
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Diff Content */}
          <div className="glass-card p-4 overflow-auto max-h-[480px]">
            {diffResult.length > 0 ? (
              <div className="font-mono text-xs sm:text-sm">
                {diffResult.map((line, idx) => (
                  <div key={idx} className={`flex ${getLineColor(line.type)} py-1 px-3`}>
                    <span className="w-7 text-right mr-3 text-[#555] select-none flex-shrink-0">
                      {line.oldLineNum ?? line.newLineNum ?? ''}
                    </span>
                    <span className="w-4 text-center mr-3 select-none flex-shrink-0 font-bold">{getSymbol(line.type)}</span>
                    <span className="whitespace-pre-wrap break-all">{line.content || '\u00A0'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#666]">两段文本完全相同，无差异</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
