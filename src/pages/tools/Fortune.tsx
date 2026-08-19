import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';

const color = '#a78bfa';

// 日期种子随机数（当天稳定，次日变化）
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const todaySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const FORTUNE_TEXTS = [
  '宜进取，忌犹豫。今日思路清晰，适合推进搁置的计划。',
  '人气运上升，与人合作事半功倍，留意旧友的消息。',
  '财运平稳，小有进账，但不宜冲动消费。',
  '健康运佳，适合运动与调整作息，身体会给你正向反馈。',
  '事业有贵人相助，主动出击更容易被看见。',
  '情绪起伏较大，遇事先深呼吸，三思后行。',
  '学习运强，适合充电与考证，投入会有回报。',
  '出行运好，若有旅行或出差计划，过程顺利。',
];
const LUCKY_COLORS = ['#e94560', '#00d9ff', '#6bcb77', '#ffd369', '#a78bfa', '#f472b6'];

interface LingQian {
  no: number;
  level: string;
  levelColor: string;
  poem: string;
  desc: string;
}
const LINGQIAN: LingQian[] = [
  { no: 1, level: '上上签', levelColor: '#6bcb77', poem: '云开雾散见月明，凡事谋为总称情。', desc: '诸事顺遂，宜把握时机大胆前行。' },
  { no: 2, level: '上签', levelColor: '#6bcb77', poem: '东风借得力无边，平地青云上九天。', desc: '得外力相助，计划可成，宜进取。' },
  { no: 3, level: '中签', levelColor: '#ffd369', poem: '守得云开见日出，静中自有好消息。', desc: '平稳之中藏机遇，耐心等待时机。' },
  { no: 4, level: '中下签', levelColor: '#f59e0b', poem: '行舟逆水费精神，守旧安分保身名。', desc: '宜守不宜攻，避免冒险与口舌。' },
  { no: 5, level: '下签', levelColor: '#e94560', poem: '月被云遮光不明，且宜退步免遭刑。', desc: '诸事受阻，宜低调谨慎，暂收锋芒。' },
  { no: 6, level: '上上签', levelColor: '#6bcb77', poem: '花开富贵满庭芳，福禄双全喜气扬。', desc: '福运临门，喜事将近，宜分享。' },
  { no: 7, level: '上签', levelColor: '#6bcb77', poem: '锦上添花更是春，谋望求财总遂心。', desc: '喜上加喜，所求易得，宜把握。' },
  { no: 8, level: '中签', levelColor: '#ffd369', poem: '柳暗花明又一村，困中得路莫忧烦。', desc: '困境将解，转机在即，宜坚持。' },
];

const TYPES: Record<string, { name: string; desc: string; tip: string }> = {
  A: { name: '行动派', desc: '说干就干，执行力强，讨厌拖延。', tip: '偶尔三思后行，避免冲动。' },
  B: { name: '思考派', desc: '先分析再出手，逻辑清晰冷静。', tip: '别让过度思考拖慢行动。' },
  C: { name: '社交派', desc: '在人群中获得能量，擅长沟通协作。', tip: '留点独处时间给自己充电。' },
  D: { name: '自由派', desc: '讨厌束缚，喜欢灵活与新鲜感。', tip: '适度规划能让你走得更远。' },
};
interface Question {
  q: string;
  options: { text: string; type: string }[];
}
const TEST: Question[] = [
  { q: '周末你更想怎么过？', options: [ { text: '约朋友出去玩', type: 'C' }, { text: '在家独处充电', type: 'B' }, { text: '列计划表充实自己', type: 'A' }, { text: '随性而为不设限', type: 'D' } ] },
  { q: '接到一个新任务，你通常会？', options: [ { text: '立刻动手做', type: 'A' }, { text: '先想清楚再开工', type: 'B' }, { text: '拉人一起讨论', type: 'C' }, { text: '看心情再说', type: 'D' } ] },
  { q: '旅行你偏好？', options: [ { text: '打卡所有景点', type: 'A' }, { text: '做详尽攻略', type: 'B' }, { text: '结伴热闹游', type: 'C' }, { text: '走到哪算哪', type: 'D' } ] },
  { q: '面对规则，你？', options: [ { text: '遵守并高效利用', type: 'A' }, { text: '研究规则合理性', type: 'B' }, { text: '更在意大家怎么玩', type: 'C' }, { text: '能绕就绕', type: 'D' } ] },
  { q: '别人眼中的你更像是？', options: [ { text: '雷厉风行', type: 'A' }, { text: '深思熟虑', type: 'B' }, { text: '气氛担当', type: 'C' }, { text: '随性自由', type: 'D' } ] },
];

export default function Fortune() {
  const [tab, setTab] = useState<'daily' | 'lingqian' | 'test'>('daily');

  // ===== 每日运势 =====
  const [daily] = useState(() => {
    const rng = mulberry32(todaySeed());
    const dims = ['综合', '爱情', '事业', '健康'];
    const scores = dims.map(() => Math.floor(rng() * 41) + 60);
    const text = FORTUNE_TEXTS[Math.floor(rng() * FORTUNE_TEXTS.length)];
    const luckyColor = LUCKY_COLORS[Math.floor(rng() * LUCKY_COLORS.length)];
    const luckyNum = Math.floor(rng() * 99) + 1;
    return { dims, scores, text, luckyColor, luckyNum };
  });
  const [dailyCopied, setDailyCopied] = useState(false);
  const copyDaily = () => {
    const text = `今日运势（${new Date().toLocaleDateString('zh-CN')}）\n` +
      daily.dims.map((d, i) => `${d}：${daily.scores[i]}分`).join('  ') + '\n' +
      `签文：${daily.text}\n幸运色：${daily.luckyColor}  幸运数字：${daily.luckyNum}`;
    navigator.clipboard.writeText(text);
    setDailyCopied(true);
    setTimeout(() => setDailyCopied(false), 1500);
  };

  // ===== 灵签 =====
  const [qian, setQian] = useState<LingQian>(() => LINGQIAN[Math.floor(Math.random() * LINGQIAN.length)]);
  const [qianCopied, setQianCopied] = useState(false);
  const drawQian = () => {
    setQian(LINGQIAN[Math.floor(Math.random() * LINGQIAN.length)]);
    setQianCopied(false);
  };
  const copyQian = () => {
    navigator.clipboard.writeText(`第${qian.no}签 · ${qian.level}\n${qian.poem}\n${qian.desc}`);
    setQianCopied(true);
    setTimeout(() => setQianCopied(false), 1500);
  };

  // ===== 心理测试 =====
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const pick = (i: number) => {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
    if (step + 1 >= TEST.length) {
      setDone(true);
    } else {
      setStep(step + 1);
    }
  };
  const resetTest = () => {
    setAnswers([]);
    setStep(0);
    setDone(false);
  };
  let testResult: { type: string; info: (typeof TYPES)[string] } | null = null;
  if (done) {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    answers.forEach((ai, qi) => {
      const t = TEST[qi].options[ai]?.type;
      if (t) counts[t]++;
    });
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    testResult = { type: best, info: TYPES[best] };
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Sparkles size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">运势 / 抽签 / 心理测试</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">今日运势、灵签抽签与趣味心理测试三合一</p>
      </motion.div>

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { k: 'daily', label: '每日运势' },
          { k: 'lingqian', label: '灵签抽签' },
          { k: 'test', label: '心理测试' },
        ] as const).map((m) => (
          <button
            key={m.k}
            onClick={() => setTab(m.k)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === m.k ? '' : 'bg-white/5 text-[#666] hover:text-white hover:bg-white/10'
            }`}
            style={tab === m.k ? { background: `${color}30`, border: `1px solid ${color}50` } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 每日运势 */}
      {tab === 'daily' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-7">
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm text-[#a8b2c1]">每日更新 · {new Date().toLocaleDateString('zh-CN')}</div>
            <button onClick={copyDaily} className="btn-secondary flex items-center gap-2 !px-3 !py-1.5 text-xs">
              <Copy size={12} /> {dailyCopied ? '已复制' : '复制'}
            </button>
          </div>
          <div className="space-y-4 mb-5">
            {daily.dims.map((d, i) => (
              <div key={d}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[#a8b2c1]">{d}</span>
                  <span className="text-white font-semibold">{daily.scores[i]} 分</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${daily.scores[i]}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-lg px-4 py-3 text-[#a8b2c1] text-sm mb-4">{daily.text}</div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#666]">幸运色</span>
              <span className="w-5 h-5 rounded-full border border-white/20" style={{ background: daily.luckyColor }} />
            </div>
            <div className="text-[#666]">幸运数字 <span className="text-white font-semibold">{daily.luckyNum}</span></div>
          </div>
        </motion.div>
      )}

      {/* 灵签 */}
      {tab === 'lingqian' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-7 text-center">
          <div className="text-xs text-[#666] mb-1">第 {qian.no} 签</div>
          <div className="font-['Syne'] font-bold text-2xl mb-4" style={{ color: qian.levelColor }}>{qian.level}</div>
          <div className="text-lg text-white mb-4 leading-relaxed">「{qian.poem}」</div>
          <div className="text-sm text-[#a8b2c1] mb-6">{qian.desc}</div>
          <div className="flex justify-center gap-3">
            <button onClick={drawQian} className="btn-primary flex items-center gap-2 !px-6">
              <RefreshCw size={16} /> 再抽一支
            </button>
            <button onClick={copyQian} className="btn-secondary flex items-center gap-2 !px-4 text-sm">
              <Copy size={14} /> {qianCopied ? '已复制' : '复制'}
            </button>
          </div>
        </motion.div>
      )}

      {/* 心理测试 */}
      {tab === 'test' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-7">
          {!done ? (
            <>
              <div className="text-xs text-[#666] mb-1">第 {step + 1} / {TEST.length} 题</div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-5">
                <div className="h-full rounded-full" style={{ width: `${((step + 1) / TEST.length) * 100}%`, background: color }} />
              </div>
              <h3 className="text-lg text-white mb-5">{TEST[step].q}</h3>
              <div className="space-y-3">
                {TEST[step].options.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white transition-all"
                  >
                    {o.text}
                  </button>
                ))}
              </div>
            </>
          ) : (
            testResult && (
              <div className="text-center">
                <div className="text-xs text-[#666] mb-2">你的类型是</div>
                <div className="font-['Syne'] font-bold text-3xl text-white mb-3">{testResult.info.name}</div>
                <div className="text-[#a8b2c1] mb-2">{testResult.info.desc}</div>
                <div className="text-sm text-[#666] mb-6">建议：{testResult.info.tip}</div>
                <button onClick={resetTest} className="btn-secondary flex items-center gap-2 !px-6 mx-auto">
                  <RefreshCw size={16} /> 重新测试
                </button>
              </div>
            )
          )}
        </motion.div>
      )}
    </div>
  );
}
