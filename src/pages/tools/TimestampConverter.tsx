import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Copy, RefreshCw, ArrowRightLeft, Calendar } from 'lucide-react';

export default function TimestampConverter() {
  // 初始化为当前时间，datetime-local 需要有效的初始值才能正常工作
  const getInitialDateTime = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const [timestampInput, setTimestampInput] = useState('');
  const [dateInput, setDateInput] = useState(getInitialDateTime());
  const [tsToDateResult, setTsToDateResult] = useState('');
  const [dateToTsResult, setDateToTsResult] = useState('');
  const [nowTime, setNowTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tsToDate = () => {
    if (!timestampInput.trim()) return;
    const ts = Number(timestampInput.trim());
    let date: Date;
    if (ts > 1e12) {
      date = new Date(ts);
    } else {
      date = new Date(ts * 1000);
    }
    if (isNaN(date.getTime())) {
      setTsToDateResult('无效的时间戳');
      return;
    }
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    setTsToDateResult(formatter.format(date));
  };

  const dateToTs = () => {
    if (!dateInput.trim()) return;
    const date = new Date(dateInput.trim());
    if (isNaN(date.getTime())) {
      setDateToTsResult('无效的日期格式');
      return;
    }
    setDateToTsResult(`秒级: ${Math.floor(date.getTime() / 1000)}\n毫秒级: ${date.getTime()}`);
  };

  const getCurrentTimestamps = () => {
    setTimestampInput(String(Math.floor(Date.now() / 1000)));
    // datetime-local 需要格式: YYYY-MM-DDTHH:mm:ss
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setDateInput(formatted);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00d9ff]/15 flex items-center justify-center">
            <Clock size={20} className="text-[#00d9ff]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">时间戳转换</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">Unix时间戳与日期时间互转，支持秒级和毫秒级</p>
      </motion.div>

      {/* Current Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5 mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#666] mb-1">当前时间（实时更新）</p>
            <p className="font-mono text-lg text-white">
              {new Intl.DateTimeFormat('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }).format(nowTime)}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={getCurrentTimestamps} className="btn-primary !py-2 !px-4 text-sm">
              <RefreshCw size={14} className="inline mr-1.5" /> 获取当前时间戳
            </button>
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
          <div>
            <span className="text-xs text-[#666]">秒级时间戳：</span>
            <span className="font-mono text-sm text-[#00d9ff] ml-1 cursor-pointer hover:underline" onClick={() => copyText(String(Math.floor(Date.now() / 1000)))}>
              {Math.floor(Date.now() / 1000)}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#666]">毫秒级时间戳：</span>
            <span className="font-mono text-sm text-[#00d9ff] ml-1 cursor-pointer hover:underline" onClick={() => copyText(String(Date.now()))}>
              {Date.now()}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timestamp → Date */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">时间戳 → 日期时间</label>
            {tsToDateResult && (
              <button onClick={() => copyText(tsToDateResult)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            )}
          </div>
          <textarea
            value={timestampInput}
            onChange={(e) => setTimestampInput(e.target.value)}
            placeholder="输入Unix时间戳（秒或毫秒）..."
            aria-label="时间戳"
            className="tool-area w-full h-[140px] p-4 text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333] font-mono"
          />
          <button onClick={tsToDate} disabled={!timestampInput.trim()} className="btn-primary w-full mt-3 disabled:opacity-30">
            <ArrowRightLeft size={15} className="inline mr-1.5" /> 转换为日期
          </button>
          {tsToDateResult && (
            <div className="tool-area w-full mt-3 p-4 min-h-[60px]">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-[#00d9ff]" />
                <span className="text-xs text-[#666]">转换结果</span>
              </div>
              <p className="font-mono text-sm text-white">{tsToDateResult}</p>
            </div>
          )}
        </motion.div>

        {/* Date → Timestamp */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">日期时间 → 时间戳</label>
            {dateToTsResult && (
              <button onClick={() => copyText(dateToTsResult)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            )}
          </div>
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            aria-label="日期时间"
            className="tool-area w-full h-[48px] px-4 text-sm outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333]"
          />
          <button onClick={dateToTs} disabled={!dateInput.trim()} className="btn-primary w-full mt-3 disabled:opacity-30">
            <ArrowRightLeft size={15} className="inline mr-1.5" /> 转换为时间戳
          </button>
          {dateToTsResult && (
            <div className="tool-area w-full mt-3 p-4 min-h-[80px]">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-[#00d9ff]" />
                <span className="text-xs text-[#666]">转换结果</span>
              </div>
              <pre className="font-mono text-sm text-white whitespace-pre-wrap">{dateToTsResult}</pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
