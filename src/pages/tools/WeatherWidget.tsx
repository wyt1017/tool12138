import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Search, MapPin, Loader2, AlertCircle, Navigation, Droplets, Wind } from 'lucide-react';

const color = '#00d9ff';

const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: '晴', emoji: '☀️' },
  1: { label: '晴间多云', emoji: '🌤️' },
  2: { label: '局部多云', emoji: '⛅' },
  3: { label: '阴', emoji: '☁️' },
  45: { label: '雾', emoji: '🌫️' },
  48: { label: '雾凇', emoji: '🌫️' },
  51: { label: '小毛毛雨', emoji: '🌦️' },
  53: { label: '毛毛雨', emoji: '🌦️' },
  55: { label: '大毛毛雨', emoji: '🌦️' },
  61: { label: '小雨', emoji: '🌧️' },
  63: { label: '中雨', emoji: '🌧️' },
  65: { label: '大雨', emoji: '🌧️' },
  71: { label: '小雪', emoji: '🌨️' },
  73: { label: '中雪', emoji: '🌨️' },
  75: { label: '大雪', emoji: '❄️' },
  80: { label: '阵雨', emoji: '🌧️' },
  81: { label: '强阵雨', emoji: '🌧️' },
  82: { label: '暴雨', emoji: '⛈️' },
  95: { label: '雷阵雨', emoji: '⛈️' },
  96: { label: '雷阵雨伴冰雹', emoji: '⛈️' },
  99: { label: '强雷暴冰雹', emoji: '⛈️' },
};

const info = (code: number) => WMO[code] || { label: '未知', emoji: '🌡️' };

interface Current {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
}
interface Day {
  date: string;
  code: number;
  max: number;
  min: number;
}

export default function WeatherWidget() {
  const [query, setQuery] = useState('北京');
  const [label, setLabel] = useState('');
  const [current, setCurrent] = useState<Current | null>(null);
  const [daily, setDaily] = useState<Day[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number, locLabel: string, signal: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const c = data.current;
      setCurrent({
        temp: Math.round(c.temperature_2m),
        feels: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        wind: c.wind_speed_10m,
        code: c.weather_code,
      });
      const d = data.daily;
      setDaily(
        d.time.map((date: string, i: number) => ({
          date,
          code: d.weather_code[i],
          max: Math.round(d.temperature_2m_max[i]),
          min: Math.round(d.temperature_2m_min[i]),
        }))
      );
      setLabel(locLabel);
    } catch (e) {
      if (signal.aborted || (e as Error)?.name === 'AbortError') return; // 被新请求取消，忽略
      setError(e instanceof Error ? e.message : '获取天气失败');
      setCurrent(null);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  const searchCity = useCallback(async () => {
    const name = query.trim();
    if (!name) return;
    abortRef.current?.abort(); // 取消上一次可能仍在进行中的请求
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    setError('');
    try {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh&format=json`, { signal });
      if (!geo.ok) throw new Error(`HTTP ${geo.status}`);
      const g = await geo.json();
      if (!g.results || g.results.length === 0) throw new Error('未找到该城市，请检查名称');
      const r = g.results[0];
      const locLabel = [r.name, r.admin1, r.country].filter(Boolean).join(' · ');
      await fetchWeather(r.latitude, r.longitude, locLabel, signal);
    } catch (e) {
      if (signal.aborted || (e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : '搜索失败');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [query, fetchWeather]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('当前浏览器不支持定位');
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { fetchWeather(pos.coords.latitude, pos.coords.longitude, '我的位置', signal).catch(() => {}); },
      () => {
        if (signal.aborted) return;
        setError('无法获取定位，请手动搜索城市');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    searchCity();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Cloud size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">天气小部件</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时天气与三日预报，数据来自 Open-Meteo，免密钥、浏览器直连</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 mb-6">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchCity()}
            placeholder="输入城市名，如 上海 / Tokyo / London"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#00d9ff]/30"
          />
          <button onClick={searchCity} disabled={loading} className="btn-primary flex items-center gap-2 !px-5 disabled:opacity-40">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} 查询
          </button>
          <button onClick={useMyLocation} disabled={loading} className="btn-secondary flex items-center gap-2 !px-4" title="使用我的位置">
            <Navigation size={16} /> 定位
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="glass-card p-5 mb-6 flex items-center gap-3" style={{ borderColor: '#e9456055' }}>
          <AlertCircle size={18} className="text-[#e94560]" />
          <span className="text-sm text-[#e94560]">{error}</span>
        </div>
      )}

      {/* Current */}
      {current && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 mb-6">
          <div className="flex items-center gap-2 text-sm text-[#a8b2c1] mb-4">
            <MapPin size={15} style={{ color }} /> {label}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-5">
              <span className="text-7xl">{info(current.code).emoji}</span>
              <div>
                <div className="font-['Syne'] font-bold text-5xl text-white">{current.temp}°</div>
                <div className="text-[#a8b2c1]">{info(current.code).label}</div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-[#666] text-xs mb-1 flex items-center gap-1"><Wind size={12} /> 风速</div>
                <div className="text-white font-semibold">{current.wind} km/h</div>
              </div>
              <div className="text-center">
                <div className="text-[#666] text-xs mb-1 flex items-center gap-1"><Droplets size={12} /> 湿度</div>
                <div className="text-white font-semibold">{current.humidity}%</div>
              </div>
              <div className="text-center">
                <div className="text-[#666] text-xs mb-1">体感</div>
                <div className="text-white font-semibold">{current.feels}°</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Forecast */}
      {daily.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {daily.map((d, i) => {
            const dt = new Date(d.date);
            const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dt.getDay()];
            return (
              <div key={d.date} className="glass-card p-5 text-center">
                <div className="text-sm text-[#a8b2c1] mb-2">{i === 0 ? '今天' : weekday}</div>
                <div className="text-4xl mb-2">{info(d.code).emoji}</div>
                <div className="text-[#666] text-xs mb-2">{info(d.code).label}</div>
                <div className="font-['Syne'] font-bold text-white">{d.max}° <span className="text-[#666] font-normal">/ {d.min}°</span></div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
