import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Copy, RotateCcw, CalendarPlus, AlertCircle } from 'lucide-react';

interface DayInfo {
  date: Date;
  isWeekend: boolean;
  isExcluded: boolean;
  dayName: string;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getDayName(date: Date): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function WorkingDayCalc() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [excludedDates, setExcludedDates] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const excludedDateSet = useMemo(() => {
    return new Set(
      excludedDates
        .split(/[\n,，]/)
        .map((d) => d.trim())
        .filter((d) => d.length > 0)
    );
  }, [excludedDates]);

  const result = useMemo(() => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return null;

    let totalDays = 0;
    let workdays = 0;
    let weekendDays = 0;
    const dayList: DayInfo[] = [];

    const current = new Date(start);
    while (current <= end) {
      totalDays++;
      const dateKey = formatDate(current);
      const weekend = isWeekend(current);
      const excluded = excludedDateSet.has(dateKey);

      dayList.push({
        date: new Date(current),
        isWeekend: weekend,
        isExcluded: excluded,
        dayName: getDayName(current),
      });

      if (weekend) {
        weekendDays++;
      } else if (!excluded) {
        workdays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return { totalDays, workdays, weekendDays, dayList };
  }, [startDate, endDate, excludedDateSet]);

  const handleQuickSet = (type: 'today' | 'plus7' | 'plus30') => {
    const now = new Date();
    setStartDate(todayStr);

    if (type === 'today') {
      setEndDate(todayStr);
    } else if (type === 'plus7') {
      const future = new Date(now);
      future.setDate(future.getDate() + 7);
      setEndDate(formatDate(future));
    } else if (type === 'plus30') {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      setEndDate(formatDate(future));
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;
    const text = `总天数: ${result.totalDays}\n工作日: ${result.workdays}\n周末天数: ${result.weekendDays}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center">
            <CalendarDays size={20} className="text-[#6bcb77]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">工作日计算器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">计算两个日期之间的总天数、工作日天数（排除周末）和周末天数</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
          {/* Date Pickers */}
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-[#a8b2c1] block mb-2">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="开始日期"
                className="tool-area w-full p-3 text-sm outline-none focus:border-[#6bcb77]/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#a8b2c1] block mb-2">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="结束日期"
                className="tool-area w-full p-3 text-sm outline-none focus:border-[#6bcb77]/30 transition-colors"
              />
            </div>

            {/* Quick Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => handleQuickSet('today')} className="px-3 py-1.5 rounded-lg bg-[#6bcb77]/10 text-[#6bcb77] text-xs hover:bg-[#6bcb77]/20 transition-colors">
                今天
              </button>
              <button onClick={() => handleQuickSet('plus7')} className="px-3 py-1.5 rounded-lg bg-[#6bcb77]/10 text-[#6bcb77] text-xs hover:bg-[#6bcb77]/20 transition-colors">
                +7天
              </button>
              <button onClick={() => handleQuickSet('plus30')} className="px-3 py-1.5 rounded-lg bg-[#6bcb77]/10 text-[#6bcb77] text-xs hover:bg-[#6bcb77]/20 transition-colors">
                +30天
              </button>
            </div>
          </div>

          {/* Excluded Dates */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <CalendarPlus size={14} className="text-[#6bcb77]" />
              <label className="text-sm font-medium text-[#a8b2c1]">手动排除日期</label>
            </div>
            <textarea
              value={excludedDates}
              onChange={(e) => setExcludedDates(e.target.value)}
              placeholder="输入要排除的日期，每行一个或用逗号分隔&#10;例如：2024-01-01, 2024-02-10"
              aria-label="手动排除日期"
              className="tool-area w-full h-[100px] p-3 text-xs resize-none outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333]"
            />
            <p className="text-xs text-[#666] mt-2 flex items-center gap-1">
              <AlertCircle size={12} /> 已排除 {excludedDateSet.size} 个日期（除周末外额外排除）
            </p>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 space-y-4">
          {/* Stats Cards */}
          {result ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5 text-center border-t-2 border-t-white/10">
                  <p className="text-xs text-[#666] mb-1">总天数</p>
                  <p className="text-3xl font-bold text-white font-['Syne']">{result.totalDays}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 text-center border-t-2 border-t-[#6bcb77]">
                  <p className="text-xs text-[#666] mb-1">工作日</p>
                  <p className="text-3xl font-bold text-[#6bcb77] font-['Syne']">{result.workdays}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5 text-center border-t-2 border-t-[#f472b6]">
                  <p className="text-xs text-[#666] mb-1">周末天数</p>
                  <p className="text-3xl font-bold text-[#f472b6] font-['Syne']">{result.weekendDays}</p>
                </motion.div>
              </div>

              {/* Day List */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#a8b2c1]">日期明细</h3>
                  <button onClick={handleCopyResult} className="btn-secondary !py-1 !px-3 text-xs">
                    <Copy size={12} className="inline mr-1" /> {copied ? '已复制' : '复制统计'}
                  </button>
                </div>
                <div className="max-h-[320px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {result.dayList.map((day, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs ${
                        day.isExcluded
                          ? 'bg-red-500/10 text-red-400'
                          : day.isWeekend
                            ? 'bg-white/5 text-[#888]'
                            : 'bg-[#6bcb77]/10 text-[#a8b2c1]'
                      }`}
                    >
                      <span className="font-mono">{formatDate(day.date)}</span>
                      <span>{day.dayName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                        {day.isExcluded ? '已排除' : day.isWeekend ? '周末' : '工作日'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <CalendarDays size={40} className="mx-auto text-[#333] mb-3" />
              <p className="text-[#555]">请选择开始和结束日期以查看结果</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-3 mt-6">
        <button
          onClick={() => {
            setStartDate('');
            setEndDate('');
            setExcludedDates('');
          }}
          disabled={!startDate && !endDate}
          className="btn-secondary disabled:opacity-30"
        >
          <RotateCcw size={15} className="inline mr-1.5" /> 清空
        </button>
      </motion.div>
    </div>
  );
}
