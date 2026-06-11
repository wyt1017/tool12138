import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, RotateCcw } from 'lucide-react';

type Mode = 'add' | 'diff' | 'info';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${formatDate(date)} ${h}:${min}:${s}`;
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export default function DateCalc() {
  const [mode, setMode] = useState<Mode>('add');

  // Mode 1: Add/Subtract
  const [baseDate, setBaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [baseTime, setBaseTime] = useState('12:00:00');
  const [addYears, setAddYears] = useState('0');
  const [addMonths, setAddMonths] = useState('0');
  const [addDays, setAddDays] = useState('0');
  const [addHours, setAddHours] = useState('0');
  const [addMinutes, setAddMinutes] = useState('0');
  const [addSeconds, setAddSeconds] = useState('0');

  // Mode 2: Diff
  const [diffDate1, setDiffDate1] = useState('');
  const [diffDate2, setDiffDate2] = useState('');

  // Mode 3: Info
  const [infoDate, setInfoDate] = useState(new Date().toISOString().split('T')[0]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Mode 1 Result
  const addResult = useMemo(() => {
    if (!baseDate) return null;
    try {
      const base = new Date(`${baseDate}T${baseTime || '00:00:00'}`);
      const result = new Date(base);

      result.setFullYear(result.getFullYear() + (parseInt(addYears, 10) || 0));
      result.setMonth(result.getMonth() + (parseInt(addMonths, 10) || 0));
      result.setDate(result.getDate() + (parseInt(addDays, 10) || 0));
      result.setHours(result.getHours() + (parseInt(addHours, 10) || 0));
      result.setMinutes(result.getMinutes() + (parseInt(addMinutes, 10) || 0));
      result.setSeconds(result.getSeconds() + (parseInt(addSeconds, 10) || 0));

      return { base: new Date(`${baseDate}T${baseTime || '00:00:00'}`), result };
    } catch {
      return null;
    }
  }, [baseDate, baseTime, addYears, addMonths, addDays, addHours, addMinutes, addSeconds]);

  // Mode 2 Result
  const diffResult = useMemo(() => {
    if (!diffDate1 || !diffDate2) return null;
    try {
      const d1 = new Date(diffDate1);
      const d2 = new Date(diffDate2);
      const diffMs = Math.abs(d2.getTime() - d1.getTime());

      return {
        days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
        totalHours: Math.floor(diffMs / (1000 * 60 * 60)),
        totalMinutes: Math.floor(diffMs / (1000 * 60)),
        totalSeconds: Math.floor(diffMs / 1000),
        isFuture: d2 > d1,
      };
    } catch {
      return null;
    }
  }, [diffDate1, diffDate2]);

  // Mode 3 Result
  const infoResult = useMemo(() => {
    if (!infoDate) return null;
    try {
      // 使用本地时间创建日期，避免UTC时区偏差
      const [year, month, day] = infoDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

      // 计算年第几天
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const janFirst = new Date(year, 0, 1);
      let weekNum = 0;
      const checkDate = new Date(janFirst);
      while (checkDate <= date) {
        if (checkDate.getDay() === 1) weekNum++;
        checkDate.setDate(checkDate.getDate() + 1);
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      const endOfYear = new Date(year, 11, 31);
      const remainingDays = Math.floor((endOfYear.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const quarter = Math.floor((month - 1) / 3) + 1;

      return {
        weekday: WEEKDAYS[date.getDay()],
        dayOfYear,
        weekNumber: weekNum,
        isLeapYear,
        daysInMonth,
        remainingDays,
        quarter,
        year,
        month,
        day,
      };
    } catch {
      return null;
    }
  }, [infoDate]);

  const NumberInput = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div className="flex-1 min-w-[70px]">
      <label className="text-[10px] text-[#666] mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="tool-area w-full p-2 text-sm text-center outline-none focus:border-[#fb923c]/30 transition-colors"
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#fb923c]/15 flex items-center justify-center">
            <CalendarClock size={20} className="text-[#fb923c]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">日期时间计算器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">日期加减、日期差值计算及日期详细信息查询</p>
      </motion.div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { key: 'add', label: '日期加减', icon: '➕' },
          { key: 'diff', label: '日期差值', icon: '📏' },
          { key: 'info', label: '日期信息', icon: 'ℹ️' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key as Mode)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              mode === tab.key ? 'bg-[#fb923c]/15 text-[#fb923c]' : 'bg-white/5 text-[#666]'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Mode 1: Add/Subtract */}
      {mode === 'add' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="mode-add" className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-medium text-[#a8b2c1]">基准日期时间</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-[#666] mb-1 block">日期</label>
                <input
                  type="date"
                  value={baseDate}
                  onChange={(e) => setBaseDate(e.target.value)}
                  aria-label="基准日期"
                  className="tool-area w-full p-3 outline-none focus:border-[#fb923c]/30 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#666] mb-1 block">时间</label>
                <input
                  type="time"
                  value={baseTime}
                  onChange={(e) => setBaseTime(e.target.value)}
                  step="1"
                  aria-label="基准时间"
                  className="tool-area w-full p-3 outline-none focus:border-[#fb923c]/30 transition-colors"
                />
              </div>
            </div>

            <h3 className="text-sm font-medium text-[#a8b2c1] pt-2">加减量（支持负数）</h3>
            <div className="flex flex-wrap gap-3">
              <NumberInput value={addYears} onChange={setAddYears} label="年" />
              <NumberInput value={addMonths} onChange={setAddMonths} label="月" />
              <NumberInput value={addDays} onChange={setAddDays} label="日" />
              <NumberInput value={addHours} onChange={setAddHours} label="时" />
              <NumberInput value={addMinutes} onChange={setAddMinutes} label="分" />
              <NumberInput value={addSeconds} onChange={setAddSeconds} label="秒" />
            </div>
          </div>

          {addResult && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 border-l-4 border-l-[#fb923c]">
              <p className="text-xs text-[#666] mb-2">计算结果</p>
              <p className="text-xl font-bold text-white font-mono">{formatDateTime(addResult.result)}</p>
              <p className="text-xs text-[#888] mt-2">基准: {formatDateTime(addResult.base)}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Mode 2: Difference */}
      {mode === 'diff' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="mode-diff" className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#a8b2c1] block mb-2">开始日期</label>
                <input
                  type="date"
                  value={diffDate1}
                  onChange={(e) => setDiffDate1(e.target.value)}
                  aria-label="开始日期"
                  className="tool-area w-full p-3 outline-none focus:border-[#fb923c]/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#a8b2c1] block mb-2">结束日期</label>
                <input
                  type="date"
                  value={diffDate2}
                  onChange={(e) => setDiffDate2(e.target.value)}
                  aria-label="结束日期"
                  className="tool-area w-full p-3 outline-none focus:border-[#fb923c]/30 transition-colors"
                />
              </div>
            </div>
          </div>

          {diffResult && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '天', value: diffResult.days, color: '#fb923c' },
                  { label: '小时', value: diffResult.totalHours, color: '#38bdf8' },
                  { label: '分钟', value: diffResult.totalMinutes, color: '#a78bfa' },
                  { label: '秒', value: diffResult.totalSeconds, color: '#6bcb77' },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4 text-center border-t-2 border-t-[var(--color)]"
                    style={{ '--color': item.color } as React.CSSProperties}
                  >
                    <p className="text-xs text-[#666] mb-1">相差{item.label}</p>
                    <p className="text-2xl font-bold font-['Syne']" style={{ color: item.color }}>
                      {item.value.toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="glass-card p-5">
                <p className="text-sm text-[#a8b2c1]">
                  详细差值：<span className="text-white font-mono">{diffResult.days}</span> 天{' '}
                  <span className="text-white font-mono">{diffResult.hours}</span> 小时{' '}
                  <span className="text-white font-mono">{diffResult.minutes}</span> 分钟{' '}
                  <span className="text-white font-mono">{diffResult.seconds}</span> 秒
                </p>
                <p className="text-xs text-[#666] mt-2">
                  结束日期比开始日期{diffResult.isFuture ? '晚' : '早'}
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Mode 3: Info */}
      {mode === 'info' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="mode-info" className="space-y-6">
          <div className="glass-card p-6">
            <label className="text-sm font-medium text-[#a8b2c1] block mb-2">选择日期</label>
            <input
              type="date"
              value={infoDate}
              onChange={(e) => setInfoDate(e.target.value)}
              aria-label="选择日期"
              className="tool-area w-full p-3 max-w-md outline-none focus:border-[#fb923c]/30 transition-colors"
            />
          </div>

          {infoResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '📅', label: '星期几', value: infoResult.weekday },
                { icon: '🔢', label: '年第几天', value: `第 ${infoResult.dayOfYear} 天` },
                { icon: '📆', label: '第几周', value: `第 ${infoResult.weekNumber} 周` },
                { icon: '🔄', label: '是否闰年', value: infoResult.isLeapYear ? '是闰年 ✅' : '平年 ❌' },
                { icon: '📊', label: '季度', value: `第${infoResult.quarter}季度` },
                { icon: '🗓️', label: '该月天数', value: `${infoResult.daysInMonth} 天` },
                { icon: '⏳', label: '该年剩余', value: `${infoResult.remainingDays} 天` },
                { icon: '🎯', label: '完整日期', value: `${infoResult.year}年${infoResult.month}月${infoResult.day}日` },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-4 flex items-center gap-3"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs text-[#666]">{item.label}</p>
                    <p className="text-sm font-medium text-white">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mt-6">
        <button
          onClick={() => {
            setBaseDate(todayStr);
            setBaseTime('12:00:00');
            setAddYears('0');
            setAddMonths('0');
            setAddDays('0');
            setAddHours('0');
            setAddMinutes('0');
            setAddSeconds('0');
            setDiffDate1('');
            setDiffDate2('');
            setInfoDate(todayStr);
          }}
          className="btn-secondary"
        >
          <RotateCcw size={15} className="inline mr-1.5" /> 重置
        </button>
      </motion.div>
    </div>
  );
}
