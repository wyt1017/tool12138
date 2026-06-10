import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Timer, ArrowLeftRight, Copy, Clock } from 'lucide-react';

interface TimeDiff {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

function calcDiff(start: Date, end: Date): TimeDiff {
  const diffMs = Math.abs(end.getTime() - start.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}

function naturalLanguageDesc(start: Date, end: Date): string {
  const earlier = start < end ? start : end;
  const later = start < end ? end : start;
  let years = later.getFullYear() - earlier.getFullYear();
  let months = later.getMonth() - earlier.getMonth();
  let days = later.getDate() - earlier.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}年`);
  if (months > 0) parts.push(`${months}个月`);
  if (days > 0) parts.push(`${days}天`);

  return parts.length > 0 ? `相差约 ${parts.join('')}` : '同一天';
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getCountdown(endDate: Date): CountdownTime | null {
  const now = new Date();
  if (endDate <= now) return null;
  const diffMs = endDate.getTime() - now.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function TimeDiffCalc() {
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });

  const [countdown, setCountdown] = useState<CountdownTime | null>(null);

  const startObj = useMemo(() => new Date(startDate), [startDate]);
  const endObj = useMemo(() => new Date(endDate), [endDate]);
  const isFuture = useMemo(() => endObj > new Date(), [endObj]);

  const diff = useMemo(() => calcDiff(startObj, endObj), [startObj, endObj]);
  const naturalDesc = useMemo(() => naturalLanguageDesc(startObj, endObj), [startObj, endObj]);

  useEffect(() => {
    if (!isFuture) {
      setCountdown(null);
      return;
    }
    setCountdown(getCountdown(endObj));
    const timer = setInterval(() => {
      const cd = getCountdown(endObj);
      setCountdown(cd);
    }, 1000);
    return () => clearInterval(timer);
  }, [endObj, isFuture]);

  const swapDates = () => {
    const temp = startDate;
    setStartDate(endDate);
    setEndDate(temp);
  };

  const quickSetDays = (days: number) => {
    const now = new Date();
    setStartDate(now.toISOString().slice(0, 16));
    const future = new Date();
    future.setDate(future.getDate() + days);
    setEndDate(future.toISOString().slice(0, 16));
  };

  const formatDateTimeForDisplay = (dateStr: string): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
            <Timer size={20} className="text-[#e94560]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">时间差计算器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">计算两个日期时间的差值，支持倒计时模式和自然语言描述</p>
      </motion.div>

      <div className="space-y-6">
        {/* Date Pickers */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass-card p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#a8b2c1] block mb-2 ml-1">开始日期时间</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="开始日期时间"
                  className="tool-area w-full px-4 py-3 text-sm text-white outline-none focus:border-[#e94560]/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#a8b2c1] block mb-2 ml-1">结束日期时间</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="结束日期时间"
                  className="tool-area w-full px-4 py-3 text-sm text-white outline-none focus:border-[#e94560]/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={swapDates} className="btn-secondary !py-2 !px-4 text-xs">
                <ArrowLeftRight size={14} className="inline mr-1.5" /> 交换起止日期
              </button>
              <span className="text-xs text-[#555]">|</span>
              <span className="text-xs text-[#555] mr-1">快捷:</span>
              {[1, 7, 30, 90, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => quickSetDays(d)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-[#a8b2c1] hover:bg-white/10 hover:text-white transition-all"
                >
                  {d < 365 ? `${d}天后` : '1年后'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="glass-card p-6 space-y-6">
            {/* Time Difference */}
            <div>
              <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">时间差详情</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: '天', value: diff.days, icon: '📅' },
                  { label: '小时', value: diff.hours, icon: '⏰' },
                  { label: '分钟', value: diff.minutes, icon: '⏱️' },
                  { label: '秒', value: diff.seconds, icon: '⚡' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-3xl sm:text-4xl font-mono font-bold text-[#e94560]">{item.value}</p>
                    <p className="text-xs text-[#555] mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Units */}
            <div className="border-t border-white/5 pt-5">
              <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">换算单位</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-mono text-[#a8b2c1]">{(diff.totalSeconds / 3600).toFixed(2)}</p>
                  <p className="text-[10px] text-[#555] mt-0.5">小时</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-mono text-[#a8b2c1]">{(diff.totalSeconds / 60).toFixed(1)}</p>
                  <p className="text-[10px] text-[#555] mt-0.5">分钟</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-mono text-[#a8b2c1]">{diff.totalSeconds.toLocaleString()}</p>
                  <p className="text-[10px] text-[#555] mt-0.5">秒</p>
                </div>
              </div>
            </div>

            {/* Natural Language Description */}
            <div className="border-t border-white/5 pt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest">自然语言描述</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(`${formatDateTimeForDisplay(startDate)} 至 ${formatDateTimeForDisplay(endDate)} ${naturalDesc}`)}
                  className="btn-secondary !py-1 !px-2 text-[10px]"
                >
                  <Copy size={11} className="inline mr-1" /> 复制
                </button>
              </div>
              <p className="text-sm text-[#a8b2c1] bg-white/[0.03] rounded-lg px-4 py-3">
                从 <span className="text-white font-mono">{formatDateTimeForDisplay(startDate)}</span>{' '}
                到 <span className="text-white font-mono">{formatDateTimeForDisplay(endDate)}</span>
                ，{naturalDesc}
              </p>
            </div>

            {/* Countdown */}
            {isFuture && countdown && (
              <div className="border-t border-white/5 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} className="text-[#e94560]" />
                  <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest">实时倒计时</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '天', value: countdown.days },
                    { label: '时', value: countdown.hours },
                    { label: '分', value: countdown.minutes },
                    { label: '秒', value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-xl bg-[#e94560]/5 border border-[#e94560]/20">
                      <p className="text-2xl sm:text-3xl font-mono font-bold text-[#e94560] tabular-nums">
                        {String(item.value).padStart(2, '0')}
                      </p>
                      <p className="text-[10px] text-[#e94560]/70 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
