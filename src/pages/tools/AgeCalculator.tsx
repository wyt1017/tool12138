import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Cake, Heart, Star, Timer, Sparkles, Zap } from 'lucide-react';

const COLOR = '#f472b6';

const ZODIAC_SIGNS: { name: string; symbol: string; start: [number, number]; end: [number, number] }[] = [
  { name: '摩羯座', symbol: '♑', start: [1, 1], end: [1, 19] },
  { name: '水瓶座', symbol: '♒', start: [1, 20], end: [2, 18] },
  { name: '双鱼座', symbol: '♓', start: [2, 19], end: [3, 20] },
  { name: '白羊座', symbol: '♈', start: [3, 21], end: [4, 19] },
  { name: '金牛座', symbol: '♉', start: [4, 20], end: [5, 20] },
  { name: '双子座', symbol: '♊', start: [5, 21], end: [6, 21] },
  { name: '巨蟹座', symbol: '♋', start: [6, 22], end: [7, 22] },
  { name: '狮子座', symbol: '♌', start: [7, 23], end: [8, 22] },
  { name: '处女座', symbol: '♍', start: [8, 23], end: [9, 22] },
  { name: '天秤座', symbol: '♎', start: [9, 23], end: [10, 23] },
  { name: '天蝎座', symbol: '♏', start: [10, 24], end: [11, 22] },
  { name: '射手座', symbol: '♐', start: [11, 23], end: [12, 21] },
  { name: '摩羯座', symbol: '♑', start: [12, 22], end: [12, 31] },
];

const CHINESE_ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function getZodiac(month: number, day: number): { name: string; symbol: string } {
  for (const sign of ZODIAC_SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) {
      return sign;
    }
  }
  return { name: '未知', symbol: '?' };
}

function getChineseZodiac(year: number): string {
  return CHINESE_ZODIAC[(year - 4) % 12];
}

function calculateAge(birthDate: Date, targetDate: Date): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalHours: number;
  totalWeeks: number;
  totalMonths: number;
} {
  let years = targetDate.getFullYear() - birthDate.getFullYear();
  let months = targetDate.getMonth() - birthDate.getMonth();
  let days = targetDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diffMs = targetDate.getTime() - birthDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;

  return { years, months, days, totalDays, totalHours, totalWeeks, totalMonths };
}

function getNextBirthday(birthDate: Date, targetDate: Date): { daysUntil: number; birthdayThisYear: Date } {
  let nextBirthday = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday <= targetDate) {
    nextBirthday = new Date(targetDate.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }
  const daysUntil = Math.ceil((nextBirthday.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  return { daysUntil, birthdayThisYear: nextBirthday };
}

export default function AgeCalculator() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [birthDate, setBirthDate] = useState('');
  const [targetDate, setTargetDate] = useState(todayStr);

  const result = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const target = targetDate ? new Date(targetDate) : new Date();
    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;

    if (birth > target) return null;

    const ageInfo = calculateAge(birth, target);
    const nextBday = getNextBirthday(birth, target);
    const zodiac = getZodiac(birth.getMonth() + 1, birth.getDate());
    const chineseZodiac = getChineseZodiac(birth.getFullYear());
    const birthWeekday = WEEKDAYS[birth.getDay()];
    const lifePercent = Math.min(100, ((ageInfo.totalDays / (80 * 365.25)) * 100));

    return { ...ageInfo, ...nextBday, zodiac, chineseZodiac, birthWeekday, lifePercent };
  }, [birthDate, targetDate]);

  const setToday = () => {
    setTargetDate(todayStr);
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Cake size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">年龄计算器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">精确计算周岁、已活天数、生日倒计时等</p>
      </motion.div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-[#a8b2c1] block mb-2 flex items-center gap-2">
              <Calendar size={14} /> 出生日期
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={todayStr}
              aria-label="出生日期"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#f472b6]/50 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#a8b2c1] block mb-2 flex items-center gap-2">
              <Timer size={14} /> 目标日期
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              aria-label="目标日期"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#f472b6]/50 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={setToday} className="btn-secondary !py-1.5 !px-4 text-xs">
            <Clock size={13} className="inline mr-1" /> 设为今天
          </button>
          {birthDate && (
            <span className="text-xs text-[#666]">
              出生日期：{formatDisplayDate(birthDate)} ({result?.birthWeekday})
            </span>
          )}
        </div>
      </motion.div>

      {/* Result Panel */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 mb-6"
        >
          {/* Main Age Display */}
          <div className="text-center mb-8 pb-8 border-b border-white/10">
            <div className="text-6xl sm:text-7xl font-bold font-['Syne'] mb-2" style={{ color: COLOR }}>
              {result.years}
              <span className="text-3xl text-white/50 mx-1">岁</span>
              {result.months > 0 && (
                <>
                  <span className="text-2xl text-white/30 mx-1">{result.months}</span>
                  <span className="text-lg text-white/30">个月</span>
                </>
              )}
            </div>
            <p className="text-[#a8b2c1] text-sm">精确周岁年龄</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Calendar, label: '已活天数', value: `${result.totalDays.toLocaleString()} 天`, color: COLOR },
              { icon: Clock, label: '已活小时', value: `${result.totalHours.toLocaleString()} 小时`, color: COLOR },
              { icon: Star, label: '已活周数', value: `${result.totalWeeks.toLocaleString()} 周`, color: COLOR },
              { icon: Heart, label: '已活月数', value: `${result.totalMonths.toLocaleString()} 个月`, color: COLOR },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/8 transition-colors">
                <item.icon size={18} className="mx-auto mb-2" style={{ color: item.color }} />
                <div className="text-xs text-[#666] mb-1">{item.label}</div>
                <div className="font-mono text-sm font-semibold text-[#f0f0f5]">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Birthday Countdown & Zodiac */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-5 text-center">
              <Sparkles size={24} className="mx-auto mb-2" style={{ color: COLOR }} />
              <div className="text-xs text-[#666] mb-1">下一个生日</div>
              <div className="text-2xl font-bold font-mono" style={{ color: COLOR }}>还有 {result.daysUntil} 天</div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 text-center">
              <Star size={24} className="mx-auto mb-2" style={{ color: COLOR }} />
              <div className="text-xs text-[#666] mb-1">星座</div>
              <div className="text-2xl font-bold text-white">
                {result.zodiac.symbol} {result.zodiac.name}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 text-center">
              <Heart size={24} className="mx-auto mb-2" style={{ color: COLOR }} />
              <div className="text-xs text-[#666] mb-1">生肖属相</div>
              <div className="text-2xl font-bold text-white">{result.chineseZodiac}</div>
            </div>
          </div>

          {/* Life Progress */}
          <div className="bg-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} style={{ color: COLOR }} />
                <span className="text-sm font-medium text-[#a8b2c1]">人生进度（基于平均寿命80岁）</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600, color: COLOR }}>{result.lifePercent.toFixed(2)}%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, result.lifePercent)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  width: `${Math.min(100, result.lifePercent)}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  background: `linear-gradient(to right, ${COLOR}, ${COLOR}B3)`
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#555]">
              <span>出生</span>
              <span>{Math.round(result.lifePercent * 80 / 100)}岁 / 80岁</span>
              <span>80岁</span>
            </div>
          </div>
        </motion.div>
      )}

      {!result && birthDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 text-center"
        >
          <p className="text-red-400 text-sm">⚠ 出生日期不能晚于目标日期</p>
        </motion.div>
      )}

      {!birthDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <Cake size={48} className="mx-auto mb-4 text-[#333]" />
          <p className="text-[#555] text-sm">请选择出生日期开始计算</p>
        </motion.div>
      )}
    </div>
  );
}
