import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Copy, Check, AlertCircle, Timer, Calendar } from 'lucide-react';

interface CronFieldInfo {
  raw: string;
  description: string;
  values: number[];
  valid: boolean;
}

const FIELD_CONFIGS = [
  { name: '分', min: 0, max: 59, label: '分钟 (0-59)' },
  { name: '时', min: 0, max: 23, label: '小时 (0-23)' },
  { name: '日', min: 1, max: 31, label: '日 (1-31)' },
  { name: '月', min: 1, max: 12, label: '月 (1-12)' },
  { name: '周', min: 0, max: 6, label: '周 (0-6 周日=0)' },
];

const STATIC_PRESETS = [
  { expr: '* * * * *', desc: '每分钟执行' },
  { expr: '0 * * * *', desc: '每小时整点执行' },
  { expr: '0 0 * * *', desc: '每天午夜执行' },
  { expr: '0 0 * * 1', desc: '每周一执行' },
  { expr: '0 0 1 * *', desc: '每月1号执行' },
  { expr: '0 9 * * 1-5', desc: '工作日上午9点执行' },
  { expr: '*/15 * * * *', desc: '每15分钟执行' },
  { expr: '0 0 1,15 * *', desc: '每月1号和15号执行' },
  { expr: '0 */2 * * *', desc: '每2小时整点执行' },
  { expr: '30 18 * * 5', desc: '每周五下午6:30执行' },
];

// 动态预设：基于当前时间生成表达式
function getDynamicPresets(): { expr: string; desc: string }[] {
  const now = new Date();
  const minute = now.getMinutes();
  const hour = now.getHours();

  // 生成每隔2小时的小时列表（从当前小时开始）
  const every2Hours: number[] = [];
  for (let h = hour; h <= hour + 22; h += 2) {
    every2Hours.push(h % 24);
  }

  return [
    { expr: `${minute} * * * *`, desc: `每小时${minute}分执行` },
    { expr: `${minute} ${every2Hours.join(',')} * * *`, desc: `每2小时${minute}分执行（从当前小时开始）` },
    { expr: `${minute} ${hour} * * *`, desc: `每天${hour}:${minute.toString().padStart(2, '0')}执行` },
  ];
}

function parseCronField(field: string, min: number, max: number): number[] {
  const values = new Set<number>();
  const parts = field.split(',');

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part === '*') {
      for (let v = min; v <= max; v++) values.add(v);
      continue;
    }

    // Handle step: */n or a-b/n
    let step = 1;
    let rangePart = part;

    if (part.includes('/')) {
      const stepParts = part.split('/');
      rangePart = stepParts[0];
      step = parseInt(stepParts[1], 10) || 1;
    }

    if (rangePart.includes('-')) {
      const rangeParts = rangePart.split('-');
      const startVal = parseInt(rangeParts[0], 10);
      const endVal = parseInt(rangeParts[1], 10);
      if (!isNaN(startVal) && !isNaN(endVal)) {
        for (let v = startVal; v <= endVal; v += step) {
          if (v >= min && v <= max) values.add(v);
        }
      }
    } else if (rangePart === '*') {
      for (let v = min; v <= max; v += step) values.add(v);
    } else {
      const val = parseInt(rangePart, 10);
      if (!isNaN(val)) {
        if (part.includes('/')) {
          // e.g., "5/2" means starting at 5, every 2
          for (let v = val; v <= max; v += step) {
            if (v >= min && v <= max) values.add(v);
          }
        } else {
          // Single value, just add it
          if (val >= min && val <= max) values.add(val);
        }
      }
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

function getNextRuns(cronFields: CronFieldInfo[], count: number): Date[] {
  const results: Date[] = [];
  const minutes = cronFields[0].values;
  const hours = cronFields[1].values;
  const days = cronFields[2].values;
  const months = cronFields[3].values;
  const weekdays = cronFields[4].values;

  const now = new Date();
  // Start from the beginning of the next minute
  let current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

  const endTime = new Date(now.getTime() + 4 * 365.25 * 24 * 3600 * 1000);

  // Smart search: jump to the next valid month, day, hour, minute
  while (results.length < count && current <= endTime) {
    const month = current.getMonth() + 1;
    if (!months.includes(month)) {
      // Jump to the first day of the next valid month
      const nextMonth = months.find((m) => m > month);
      if (nextMonth !== undefined) {
        current = new Date(current.getFullYear(), nextMonth - 1, 1, 0, 0, 0, 0);
      } else {
        current = new Date(current.getFullYear() + 1, months[0] - 1, 1, 0, 0, 0, 0);
      }
      continue;
    }

    const day = current.getDate();
    const weekday = current.getDay();
    const dayValid = days.includes(day);
    const weekdayValid = weekdays.includes(weekday);
    // Standard cron: if both day-of-month and day-of-week are restricted (not all values), use OR logic
    const dayRestricted = days.length < 31;
    const weekdayRestricted = weekdays.length < 7;
    const dayMatch = dayRestricted && weekdayRestricted ? (dayValid || weekdayValid) : (dayValid && weekdayValid);

    if (!dayMatch) {
      // Jump to next day
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
      continue;
    }

    const hour = current.getHours();
    if (!hours.includes(hour)) {
      const nextHour = hours.find((h) => h > hour);
      if (nextHour !== undefined) {
        current.setHours(nextHour, 0, 0, 0);
      } else {
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, hours[0], 0, 0, 0);
      }
      continue;
    }

    const minute = current.getMinutes();
    if (!minutes.includes(minute)) {
      const nextMinute = minutes.find((m) => m > minute);
      if (nextMinute !== undefined) {
        current.setMinutes(nextMinute, 0, 0);
      } else {
        const nextHour = hours.find((h) => h > hour);
        if (nextHour !== undefined) {
          current.setHours(nextHour, minutes[0], 0, 0);
        } else {
          current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, hours[0], minutes[0], 0, 0);
        }
      }
      continue;
    }

    results.push(new Date(current));

    // Advance to next minute
    const nextMinute = minutes.find((m) => m > minute);
    if (nextMinute !== undefined) {
      current.setMinutes(nextMinute, 0, 0);
    } else {
      const nextHour = hours.find((h) => h > hour);
      if (nextHour !== undefined) {
        current.setHours(nextHour, minutes[0], 0, 0);
      } else {
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, hours[0], minutes[0], 0, 0);
      }
    }
  }

  return results;
}

function describeField(field: CronFieldInfo, config: typeof FIELD_CONFIGS[0]): string {
  if (!field.valid) return '无效表达式';
  if (field.raw === '*') return `每${config.name}`;
  if (field.raw.startsWith('*/')) {
    const step = field.raw.slice(2);
    return `每${step}${config.name}`;
  }
  if (field.values.length > 10) {
    return `${config.name}: ${field.values.slice(0, 10).join(',')} ... (${field.values.length}个值)`;
  }
  if (field.values.length === 1) return `${config.name}: ${field.values[0]}`;
  return `${config.name}: ${field.values.join(', ')}`;
}

export default function CrontabParser() {
  const [fields, setFields] = useState<string[]>(['*', '*', '*', '*', '*']);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());

  const parsedFields: CronFieldInfo[] = useMemo(() => {
    return fields.map((raw, idx) => {
      const config = FIELD_CONFIGS[idx];
      try {
        const values = parseCronField(raw, config.min, config.max);
        return { raw, description: '', values, valid: true };
      } catch {
        return { raw, description: '', values: [], valid: false };
      }
    });
  }, [fields]);

  const allValid = useMemo(() => parsedFields.every((f) => f.valid), [parsedFields]);

  const nextRuns = useMemo(() => {
    if (!allValid) return [];
    return getNextRuns(parsedFields, 10);
  }, [parsedFields, allValid]);

  const naturalDescription = useMemo(() => {
    if (!allValid) return null;
    const descs = parsedFields.map((f, i) => describeField(f, FIELD_CONFIGS[i]));
    return `该Cron表达式含义：${descs.join('，')}`;
  }, [parsedFields, allValid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updateField = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index] = value;
    setFields(newFields);
  };

  const applyPreset = (expr: string) => {
    setFields(expr.split(' '));
  };

  const copyExpression = async () => {
    await navigator.clipboard.writeText(fields.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCountdown = (targetDate: Date): string => {
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return '即将执行';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}天 ${hours}时 ${minutes}分 ${seconds}秒`;
    if (hours > 0) return `${hours}时 ${minutes}分 ${seconds}秒`;
    if (minutes > 0) return `${minutes}分 ${seconds}秒`;
    return `${seconds}秒`;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffd369]/15 flex items-center justify-center">
            <Clock size={20} className="text-[#ffd369]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">Crontab表达式解析</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">解析和验证Cron定时任务表达式，查看执行时间和倒计时</p>
      </motion.div>

      {/* Cron Expression Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium text-[#ffd369]">Cron 表达式</label>
          <button onClick={copyExpression} className="btn-secondary !py-1 !px-2.5 text-xs">
            {copied ? <Check size={12} className="inline mr-1" /> : <Copy size={12} className="inline mr-1" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {FIELD_CONFIGS.map((config, idx) => (
            <div key={config.name}>
              <label className="text-xs text-[#666] mb-1 block">{config.label}</label>
              <input
                type="text"
                value={fields[idx]}
                onChange={(e) => updateField(idx, e.target.value)}
                aria-label={config.label}
                className={`tool-area w-full px-3 py-2.5 text-center text-sm font-mono outline-none transition-colors ${
                  parsedFields[idx].valid
                    ? 'focus:border-[#ffd369]/30'
                    : '!border-red-500/50'
                }`}
                placeholder={config.label}
              />
              {!parsedFields[idx].valid && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> 无效
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Field Descriptions */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          {parsedFields.map((pf, idx) => (
            <div key={idx} className={`text-xs p-2 rounded ${pf.valid ? 'bg-white/5' : 'bg-red-500/10'}`}>
              <span className="text-[#555]">{FIELD_CONFIGS[idx].name}:</span>{' '}
              <span className={`${pf.valid ? 'text-[#a8b2c1]' : 'text-red-400'}`}>
                {describeField(pf, FIELD_CONFIGS[idx])}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Dynamic Presets */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-6">
        <h3 className="text-sm font-medium text-[#a8b2c1] mb-3">基于当前时间的预设</h3>
        <div className="flex flex-wrap gap-2">
          {getDynamicPresets().map((preset) => (
            <button
              key={preset.expr + preset.desc}
              onClick={() => applyPreset(preset.expr)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#ffd369]/10 hover:bg-[#ffd369]/20 text-[#ffd369] border border-[#ffd369]/20 hover:border-[#ffd369]/40 transition-all"
            >
              {preset.expr}
              <span className="ml-1.5 opacity-70 normal-case font-sans">{preset.desc}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Static Presets */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <h3 className="text-sm font-medium text-[#a8b2c1] mb-3">常用预设</h3>
        <div className="flex flex-wrap gap-2">
          {STATIC_PRESETS.map((preset) => (
            <button
              key={preset.expr}
              onClick={() => applyPreset(preset.expr)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 hover:bg-[#ffd369]/10 text-[#a8b2c1] hover:text-[#ffd369] border border-white/10 hover:border-[#ffd369]/30 transition-all"
            >
              {preset.expr}
              <span className="ml-1.5 opacity-50 normal-case font-sans">{preset.desc}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {allValid && (
        <>
          {/* Natural Language Description */}
          {naturalDescription && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 mb-6">
              <p className="text-sm text-[#a8b2c1]">{naturalDescription}</p>
            </motion.div>
          )}

          {/* Next Run Countdown */}
          {nextRuns.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="glass-card p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Timer size={16} className="text-[#ffd369]" />
                <h3 className="text-sm font-semibold text-[#ffd369]">下次执行倒计时</h3>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {formatCountdown(nextRuns[0])}
              </p>
              <p className="text-xs text-[#666] mt-1">
                下次执行时间：{nextRuns[0].toLocaleString('zh-CN')}
              </p>
            </motion.div>
          )}

          {/* Next 10 Runs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#ffd369]" />
              <h3 className="text-sm font-semibold text-[#ffd369]">最近10次执行时间</h3>
            </div>
            <div className="space-y-2">
              {nextRuns.map((date, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    idx === 0 ? 'bg-[#ffd369]/10 border border-[#ffd369]/20' : 'bg-white/5'
                  }`}
                >
                  <span className="text-[#666]">第{idx + 1}次</span>
                  <span className="font-mono text-[#f0f0f5]">{date.toLocaleString('zh-CN')}</span>
                  {idx === 0 && (
                    <span className="text-xs text-[#ffd369] font-mono">{formatCountdown(date)}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {!allValid && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4 border-red-500/30">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle size={16} /> 表达式存在错误，请检查上方标红的字段
          </p>
        </motion.div>
      )}
    </div>
  );
}
