import { useState } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Copy, RotateCcw, TrendingUp } from 'lucide-react';

const color = '#f59e0b';

type Mode = 'mortgage' | 'compound';
type Repay = 'equal-installment' | 'equal-principal';

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });

// ===== 房贷计算 =====
function calcMortgage(
  principal: number, // 元
  annualRate: number,
  years: number,
  repay: Repay
) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const yearly: { year: number; interest: number; remain: number }[] = [];

  if (repay === 'equal-installment') {
    const pow = Math.pow(1 + r, n);
    const monthly = r === 0 ? principal / n : (principal * r * pow) / (pow - 1);
    const totalPay = monthly * n;
    const totalInterest = totalPay - principal;
    let remain = principal;
    let accInterest = 0;
    for (let m = 1; m <= n; m++) {
      const interest = remain * r;
      const principalPart = monthly - interest;
      remain -= principalPart;
      accInterest += interest;
      if (m % 12 === 0) {
        yearly.push({ year: m / 12, interest: accInterest, remain: Math.max(remain, 0) });
        accInterest = 0;
      }
    }
    return { monthly, totalPay, totalInterest, yearly, decrease: 0, firstMonth: monthly };
  }

  // 等额本金
  const monthlyPrincipal = principal / n;
  const firstMonth = monthlyPrincipal + principal * r;
  const decrease = monthlyPrincipal * r;
  const totalInterest = (principal * r * (n + 1)) / 2;
  const totalPay = principal + totalInterest;
  let remain = principal;
  let accInterest = 0;
  for (let m = 1; m <= n; m++) {
    const interest = remain * r;
    remain -= monthlyPrincipal;
    accInterest += interest;
    if (m % 12 === 0) {
      yearly.push({ year: m / 12, interest: accInterest, remain: Math.max(remain, 0) });
      accInterest = 0;
    }
  }
  return { monthly: firstMonth, decrease, totalPay, totalInterest, yearly, firstMonth };
}

// ===== 复利计算 =====
const FREQ: Record<string, number> = { 年: 1, 半年: 2, 季: 4, 月: 12, 日: 365 };

function calcCompound(
  principal: number,
  annualRate: number,
  years: number,
  monthlyDeposit: number,
  freqKey: string
) {
  const freq = FREQ[freqKey] ?? 12;
  const r = annualRate / 100;
  const i = Math.pow(1 + r, 1 / freq) - 1; // 每期等效利率
  const N = freq * years;
  const depositPerPeriod = monthlyDeposit * (12 / freq);
  let balance = principal;
  let totalPrincipal = principal;
  const points: number[] = [principal];
  for (let p = 1; p <= N; p++) {
    balance = balance * (1 + i) + depositPerPeriod;
    totalPrincipal += depositPerPeriod;
    if (p % freq === 0) points.push(balance);
  }
  return { final: balance, totalPrincipal, totalInterest: balance - totalPrincipal, points, years };
}

function GrowthChart({ points, totalPrincipal }: { points: number[]; totalPrincipal: number }) {
  const w = 560;
  const h = 220;
  const pad = 32;
  const max = Math.max(...points, totalPrincipal) * 1.05;
  const min = Math.min(...points, totalPrincipal) * 0.95;
  const range = max - min || 1;
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);
  const totalLine = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p).toFixed(1)}`)
    .join(' ');
  const principalLine = `M ${x(0).toFixed(1)} ${y(points[0]).toFixed(1)} L ${x(points.length - 1).toFixed(1)} ${y(totalPrincipal).toFixed(1)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ffffff20" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#ffffff20" />
      <path d={principalLine} fill="none" stroke="#666" strokeWidth={2} strokeDasharray="6 5" />
      <path d={totalLine} fill="none" stroke={color} strokeWidth={2.5} />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p)} r={2.5} fill={color} />
      ))}
      <text x={pad} y={h - 10} fill="#666" fontSize={11}>第0年</text>
      <text x={w - pad - 28} y={h - 10} fill="#666" fontSize={11}>{`第${points.length - 1}年`}</text>
      <text x={pad + 4} y={pad + 4} fill={color} fontSize={11}>总额</text>
      <text x={pad + 4} y={pad + 18} fill="#888" fontSize={11}>本金</text>
    </svg>
  );
}

export default function MortgageCalculator() {
  const [mode, setMode] = useState<Mode>('mortgage');
  const [repay, setRepay] = useState<Repay>('equal-installment');

  // 房贷
  const [amount, setAmount] = useState('100'); // 万元
  const [rate, setRate] = useState('3.5'); // %
  const [years, setYears] = useState('30');
  // 复利
  const [principal, setPrincipal] = useState('100000');
  const [ret, setRet] = useState('5');
  const [cyears, setCYears] = useState('20');
  const [deposit, setDeposit] = useState('2000');
  const [freq, setFreq] = useState('月');

  const [result, setResult] = useState<null | Record<string, unknown>>(null);
  const [copied, setCopied] = useState(false);

  const handleCalc = () => {
    if (mode === 'mortgage') {
      const P = parseFloat(amount) * 10000;
      const R = parseFloat(rate);
      const Y = parseFloat(years);
      if (!isFinite(P) || !isFinite(R) || !isFinite(Y) || Y <= 0) {
        setResult(null);
        return;
      }
      const r = calcMortgage(P, R, Y, repay);
      setResult({ ...r, mode });
    } else {
      const P = parseFloat(principal);
      const R = parseFloat(ret);
      const Y = parseFloat(cyears);
      const D = parseFloat(deposit) || 0;
      if (!isFinite(P) || !isFinite(R) || !isFinite(Y) || Y <= 0) {
        setResult(null);
        return;
      }
      const c = calcCompound(P, R, Y, D, freq);
      setResult({ ...c, mode });
    }
    setCopied(false);
  };

  const handleReset = () => {
    setAmount('100');
    setRate('3.5');
    setYears('30');
    setPrincipal('100000');
    setRet('5');
    setCYears('20');
    setDeposit('2000');
    setResult(null);
    setCopied(false);
  };

  const copyResult = () => {
    if (!result) return;
    const text =
      mode === 'mortgage'
        ? `房贷测算（${repay === 'equal-installment' ? '等额本息' : '等额本金'}）\n` +
          `贷款总额：${fmt(parseFloat(amount) * 10000)} 元\n` +
          `年利率：${rate}%\n` +
          `期限：${years} 年\n` +
          (repay === 'equal-installment'
            ? `月供：${fmt((result.monthly as number))} 元\n`
            : `首月月供：${fmt((result.firstMonth as number))} 元，每月递减 ${fmt((result.decrease as number))} 元\n`) +
          `总利息：${fmt(result.totalInterest as number)} 元\n` +
          `总还款：${fmt(result.totalPay as number)} 元`
        : `复利测算\n初始本金：${fmt(parseFloat(principal))} 元\n年化收益率：${ret}%\n期限：${cyears} 年\n每月定投：${fmt(parseFloat(deposit) || 0)} 元\n复利频率：${freq}\n` +
          `期末总额：${fmt(result.final as number)} 元\n累计本金：${fmt(result.totalPrincipal as number)} 元\n累计收益：${fmt(result.totalInterest as number)} 元`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const yearly = (result?.yearly as { year: number; interest: number; remain: number }[]) || [];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Landmark size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">房贷 / 复利计算器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">房贷月供测算与复利投资收益增长曲线</p>
      </motion.div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { k: 'mortgage', label: '房贷计算' },
          { k: 'compound', label: '复利计算' },
        ] as const).map((m) => (
          <button
            key={m.k}
            onClick={() => { setMode(m.k); setResult(null); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              mode === m.k ? '' : 'bg-white/5 text-[#666] hover:text-white hover:bg-white/10'
            }`}
            style={mode === m.k ? { background: `${color}30`, border: `1px solid ${color}50` } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-7 mb-4">
        {mode === 'mortgage' ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              {([
                { k: 'equal-installment', label: '等额本息' },
                { k: 'equal-principal', label: '等额本金' },
              ] as const).map((m) => (
                <button
                  key={m.k}
                  onClick={() => { setRepay(m.k); setResult(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    repay === m.k ? '' : 'bg-white/5 text-[#666] hover:text-white'
                  }`}
                  style={repay === m.k ? { background: `${color}30`, border: `1px solid ${color}50` } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="text-xs text-[#666] mb-1.5 block">贷款总额（万元）</label>
                <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#f59e0b]/40 placeholder:text-[#444]" />
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1.5 block">年利率（%）</label>
                <input type="number" value={rate} onChange={(e) => { setRate(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#f59e0b]/40 placeholder:text-[#444]" />
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1.5 block">贷款年限（年）</label>
                <input type="number" value={years} onChange={(e) => { setYears(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#f59e0b]/40 placeholder:text-[#444]" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs text-[#666] mb-1.5 block">初始本金（元）</label>
                <input type="number" value={principal} onChange={(e) => { setPrincipal(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#f59e0b]/40 placeholder:text-[#444]" />
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1.5 block">年化收益率（%）</label>
                <input type="number" value={ret} onChange={(e) => { setRet(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#f59e0b]/40 placeholder:text-[#444]" />
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1.5 block">投资年限（年）</label>
                <input type="number" value={cyears} onChange={(e) => { setCYears(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#f59e0b]/40 placeholder:text-[#444]" />
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1.5 block">每月定投（元）</label>
                <input type="number" value={deposit} onChange={(e) => { setDeposit(e.target.value); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#f59e0b]/40 placeholder:text-[#444]" />
              </div>
            </div>
            <div className="mb-5">
              <label className="text-xs text-[#666] mb-1.5 block">复利频率</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(FREQ).map((f) => (
                  <button key={f} onClick={() => { setFreq(f); setResult(null); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      freq === f ? '' : 'bg-white/5 text-[#666] hover:text-white'
                    }`}
                    style={freq === f ? { background: `${color}30`, border: `1px solid ${color}50` } : {}}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="flex gap-3">
          <button onClick={handleCalc} className="btn-primary flex items-center gap-2 !px-6">
            <TrendingUp size={16} /> 计算
          </button>
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2 !px-5">
            <RotateCcw size={14} /> 清空
          </button>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="space-y-4">
          <div className="glass-card p-6 flex items-start justify-between gap-4">
            <div className="flex-1">
              {mode === 'mortgage' ? (
                <>
                  <div className="text-xs text-[#666] mb-1">
                    {repay === 'equal-installment' ? '每月月供' : '首月月供'}
                  </div>
                  <div className="font-['Syne'] font-bold text-3xl text-white mb-4">
                    {fmt(result.monthly as number)} <span className="text-base text-[#a8b2c1]">元</span>
                  </div>
                  {repay === 'equal-principal' && (
                    <div className="text-sm text-[#a8b2c1] mb-3">每月递减 {fmt(result.decrease as number)} 元</div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                      <div className="text-[#666] text-xs">总利息</div>
                      <div className="text-white font-semibold">{fmt(result.totalInterest as number)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                      <div className="text-[#666] text-xs">总还款</div>
                      <div className="text-white font-semibold">{fmt(result.totalPay as number)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-[#666] mb-1">期末总额</div>
                  <div className="font-['Syne'] font-bold text-3xl text-white mb-4">
                    {fmt(result.final as number)} <span className="text-base text-[#a8b2c1]">元</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                      <div className="text-[#666] text-xs">累计本金</div>
                      <div className="text-white font-semibold">{fmt(result.totalPrincipal as number)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                      <div className="text-[#666] text-xs">累计收益</div>
                      <div className="text-white font-semibold text-[#6bcb77]">+{fmt(result.totalInterest as number)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={copyResult} className="btn-secondary flex items-center gap-2 !px-4 !py-2 text-sm shrink-0">
              <Copy size={14} /> {copied ? '已复制' : '复制'}
            </button>
          </div>

          {mode === 'compound' && (
            <div className="glass-card p-5">
              <h3 className="text-xs text-[#666] mb-3 uppercase tracking-widest">增长曲线（总额 vs 本金）</h3>
              <GrowthChart points={result.points as number[]} totalPrincipal={result.totalPrincipal as number} />
            </div>
          )}

          {mode === 'mortgage' && yearly.length > 0 && (
            <div className="glass-card p-5 overflow-x-auto">
              <h3 className="text-xs text-[#666] mb-3 uppercase tracking-widest">逐年还款（年末剩余本金）</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#666] text-xs">
                    <th className="text-left py-2">年份</th>
                    <th className="text-right py-2">当年利息</th>
                    <th className="text-right py-2">年末剩余</th>
                  </tr>
                </thead>
                <tbody>
                  {yearly.map((y) => (
                    <tr key={y.year} className="border-t border-white/5">
                      <td className="py-2 text-white">第 {y.year} 年</td>
                      <td className="py-2 text-right text-[#a8b2c1]">{fmt(y.interest)}</td>
                      <td className="py-2 text-right text-white">{fmt(y.remain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
