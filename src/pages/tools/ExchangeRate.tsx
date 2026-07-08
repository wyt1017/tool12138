import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

const color = '#ffd369';

const CURRENCIES: { code: string; name: string; flag: string }[] = [
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺' },
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧' },
  { code: 'HKD', name: '港币', flag: '🇭🇰' },
  { code: 'KRW', name: '韩元', flag: '🇰🇷' },
  { code: 'AUD', name: '澳元', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭' },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
  { code: 'THB', name: '泰铢', flag: '🇹🇭' },
  { code: 'INR', name: '印度卢比', flag: '🇮🇳' },
  { code: 'NZD', name: '新西兰元', flag: '🇳🇿' },
  { code: 'MYR', name: '马来西亚林吉特', flag: '🇲🇾' },
  { code: 'PHP', name: '菲律宾比索', flag: '🇵🇭' },
  { code: 'MXN', name: '墨西哥比索', flag: '🇲🇽' },
  { code: 'BRL', name: '巴西雷亚尔', flag: '🇧🇷' },
  { code: 'ZAR', name: '南非兰特', flag: '🇿🇦' },
  { code: 'TRY', name: '土耳其里拉', flag: '🇹🇷' },
];

const DISPLAY = ['USD', 'EUR', 'CNY', 'JPY', 'GBP', 'HKD', 'KRW', 'AUD', 'CAD', 'SGD', 'THB', 'INR'];

export default function ExchangeRate() {
  const [base, setBase] = useState('CNY');
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const symbols = CURRENCIES.map((c) => c.code).join(',');
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${symbols}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.rates) throw new Error('返回数据异常');
      setRates({ [base]: 1, ...data.rates });
      setDate(data.date || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取汇率失败，请检查网络后重试');
      setRates(null);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const amt = parseFloat(amount) || 0;
  const baseInfo = CURRENCIES.find((c) => c.code === base);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <TrendingUp size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">汇率看板</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时多币种汇率换算，数据来自 Frankfurter（欧洲央行参考汇率）</p>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-[#666] block mb-2">基准币种</label>
            <select value={base} onChange={(e) => setBase(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00d9ff]/30"
              style={{ backgroundColor: '#1a1a2e' }}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                  {c.flag} {c.code} · {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-2">金额</label>
            <input type="number" value={amount} min={0}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00d9ff]/30" />
          </div>
          <button onClick={fetchRates} disabled={loading}
            className="btn-secondary flex items-center justify-center gap-2 !py-2.5 disabled:opacity-40">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {loading ? '刷新中' : '刷新汇率'}
          </button>
        </div>
        {date && !error && (
          <div className="text-xs text-[#666] mt-3">汇率日期：{date} · 1 {base} = 基准</div>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <div className="glass-card p-5 mb-6 flex items-center gap-3" style={{ borderColor: '#e9456055' }}>
          <AlertCircle size={18} className="text-[#e94560]" />
          <span className="text-sm text-[#e94560] flex-1">{error}</span>
          <button onClick={fetchRates} className="btn-secondary !py-1.5 !px-3 text-xs">重试</button>
        </div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-[#a8b2c1]">
          <ArrowLeftRight size={15} style={{ color }} />
          {amt} {baseInfo?.flag} {base} 可兑换
        </div>
        {loading && !rates ? (
          <div className="text-center text-[#666] py-10">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DISPLAY.filter((c) => c !== base).map((code) => {
              const info = CURRENCIES.find((c) => c.code === code)!;
              const rate = rates?.[code] ?? 0;
              const value = amt * rate;
              return (
                <div key={code} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{info.flag}</span>
                    <span className="text-sm text-white font-medium">{code}</span>
                    <span className="text-xs text-[#666]">{info.name}</span>
                  </div>
                  <div className="font-['Syne'] font-bold text-xl text-white">
                    {value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-[#555]">1 {base} = {rate.toLocaleString('zh-CN', { maximumFractionDigits: 4 })} {code}</div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <p className="text-xs text-[#555] mt-6 text-center">
        汇率为欧洲央行每日参考价，仅供参考，非实时交易价。浏览器直连公开 API，无需后端。
      </p>
    </div>
  );
}
