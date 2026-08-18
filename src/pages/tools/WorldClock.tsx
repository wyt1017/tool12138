import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Globe, Search, MapPin, Plus, Trash2 } from 'lucide-react';

const color = '#6bcb77';

const TIMEZONE_CITIES = [
  { tz: 'Asia/Shanghai', label: '北京', offset: '+08:00' },
  { tz: 'Asia/Tokyo', label: '东京', offset: '+09:00' },
  { tz: 'America/New_York', label: '纽约', offset: '-05:00' },
  { tz: 'America/Los_Angeles', label: '洛杉矶', offset: '-08:00' },
  { tz: 'Europe/London', label: '伦敦', offset: '+00:00' },
  { tz: 'Europe/Berlin', label: '柏林', offset: '+01:00' },
  { tz: 'Europe/Paris', label: '巴黎', offset: '+01:00' },
  { tz: 'Asia/Dubai', label: '迪拜', offset: '+04:00' },
  { tz: 'Asia/Singapore', label: '新加坡', offset: '+08:00' },
  { tz: 'Australia/Sydney', label: '悉尼', offset: '+11:00' },
  { tz: 'Asia/Seoul', label: '首尔', offset: '+09:00' },
  { tz: 'Pacific/Auckland', label: '奥克兰', offset: '+13:00' },
  { tz: 'America/Chicago', label: '芝加哥', offset: '-06:00' },
  { tz: 'America/Sao_Paulo', label: '圣保罗', offset: '-03:00' },
  { tz: 'Asia/Mumbai', label: '孟买', offset: '+05:30' },
  { tz: 'Asia/Kolkata', label: '加尔各答', offset: '+05:30' },
];

interface CityEntry {
  id: string;
  tz: string;
  label: string;
  offset: string;
}

function getDayOfWeek(tz: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  return weekdays[d.getDay()];
}

function getCityTime(tz: string): { time: string; date: string } {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('zh-CN', { timeZone: tz, month: 'short', day: 'numeric' });
  return { time: timeStr, date: dateStr };
}

function getOffsetStr(tz: string): string {
  const now = new Date();
  const str = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  const match = str.match(/GMT([+-]\d+):\d{2}/);
  return match ? `UTC${match[1]}` : '';
}

export default function WorldClock() {
  const [cities, setCities] = useState<CityEntry[]>(() => {
    try {
      const raw = localStorage.getItem('worldclock_cities');
      return raw ? (JSON.parse(raw) as CityEntry[]) : [
        { id: '1', tz: 'Asia/Shanghai', label: '北京', offset: '+08:00' },
        { id: '2', tz: 'America/New_York', label: '纽约', offset: '-05:00' },
        { id: '3', tz: 'Europe/London', label: '伦敦', offset: '+00:00' },
      ];
    } catch {
      return [
        { id: '1', tz: 'Asia/Shanghai', label: '北京', offset: '+08:00' },
        { id: '2', tz: 'America/New_York', label: '纽约', offset: '-05:00' },
      ];
    }
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('worldclock_cities', JSON.stringify(cities));
  }, [cities]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Close search panel when clicking outside
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-search-panel]')) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  const filteredCities = searchQuery.trim()
    ? TIMEZONE_CITIES.filter((c) =>
        c.label.includes(searchQuery) || c.tz.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : TIMEZONE_CITIES;

  const addCity = (tz: string, label: string, offset: string) => {
    if (cities.some((c) => c.tz === tz)) return;
    setCities((prev) => [...prev, { id: Date.now().toString(), tz, label, offset }]);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const removeCity = (id: string) => {
    setCities((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Globe size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">世界时钟</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时显示全球城市时间，支持添加删除城市，时差一目了然</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
        <div className="relative">
          <button
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="btn-secondary flex items-center gap-2 !px-5"
          >
            <Plus size={16} /> 添加城市
          </button>
          {searchOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden" data-search-panel>
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                  <Search size={14} className="text-[#666]" />
                  <input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索城市或时区..."
                    className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-[#444]"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredCities.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[#666] text-sm">未找到匹配城市</div>
                ) : (
                  filteredCities.map((c) => {
                    const alreadyAdded = cities.some((cc) => cc.tz === c.tz);
                    return (
                      <button
                        key={c.tz}
                        onClick={() => !alreadyAdded && addCity(c.tz, c.label, c.offset)}
                        disabled={alreadyAdded}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                          alreadyAdded
                            ? 'text-[#444] cursor-not-allowed'
                            : 'text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{c.label}</span>
                        <span className="text-xs text-[#666]">{c.offset}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cities.map((city) => {
          const timeInfo = getCityTime(city.tz);
          const offset = getOffsetStr(city.tz);
          const dayOfWeek = getDayOfWeek(city.tz);
          return (
            <div key={city.id} className="glass-card p-6 relative group">
              <button
                onClick={() => removeCity(city.id)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#666] hover:text-[#e94560] hover:bg-[#e94560]/10 opacity-0 group-hover:opacity-100 transition-all"
                title="删除"
              >
                <Trash2 size={13} />
              </button>
              <div className="flex items-center gap-2 text-sm text-[#666] mb-3">
                <MapPin size={13} />
                <span className="font-medium text-white">{city.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5">{offset}</span>
              </div>
              <div className="font-['Syne'] font-bold text-4xl text-white tabular-nums">
                {timeInfo.time}
              </div>
              <div className="text-sm text-[#a8b2c1] mt-1">
                {dayOfWeek} · {timeInfo.date}
              </div>
            </div>
          );
        })}
        {cities.length === 0 && (
          <div className="sm:col-span-2 text-center py-16 text-[#666]">
            <Globe size={40} className="mx-auto mb-4 opacity-30" />
            <div className="text-base mb-2">暂无城市</div>
            <div className="text-sm">点击「添加城市」开始使用</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
