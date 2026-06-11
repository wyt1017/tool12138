import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Copy } from 'lucide-react';

const COLOR = '#e94560';

export default function ScientificCalculator() {
  const color = '#e94560';
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const evaluate = useCallback(() => {
    if (!expression.trim()) return;

    try {
      // 替换数学函数为 JavaScript 可执行形式
      const expr = expression
        .replace(/sin/gi, 'Math.sin')
        .replace(/cos/gi, 'Math.cos')
        .replace(/tan/gi, 'Math.tan')
        .replace(/asin/gi, 'Math.asin')
        .replace(/acos/gi, 'Math.acos')
        .replace(/atan/gi, 'Math.atan')
        .replace(/log/gi, 'Math.log10')
        .replace(/ln/gi, 'Math.log')
        .replace(/sqrt/gi, 'Math.sqrt')
        .replace(/abs/gi, 'Math.abs')
        .replace(/exp/gi, 'Math.exp')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![xp])/gi, 'Math.E')
        .replace(/\^/g, '**')
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // 安全计算
      const evaluated = Function('"use strict"; return (' + expr + ')')();
      const res = typeof evaluated === 'number' ? evaluated : NaN;

      if (isNaN(res)) {
        setResult('计算错误');
      } else {
        setResult(res.toString());
        setHistory(prev => [...prev.slice(-9), `${expression} = ${res}`]);
      }
    } catch {
      setResult('表达式错误');
    }
  }, [expression]);

  const clear = () => {
    setExpression('');
    setResult(null);
  };

  const copyResult = () => {
    if (result && result !== '计算错误' && result !== '表达式错误') {
      navigator.clipboard.writeText(result);
    }
  };

  const buttons = [
    // 科学函数行
    ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'],
    ['asin', 'acos', 'atan', 'abs', 'exp', '^'],
    // 常量和控制行
    ['pi', 'e', '(', ')', 'C', '←'],
    // 数字和运算符行
    ['7', '8', '9', '÷', '×', '!'],
    ['4', '5', '6', '+', '-', '%'],
    ['1', '2', '3', '0', '.', '='],
  ];

  const handleButtonClick = (btn: string) => {
    if (btn === 'C') clear();
    else if (btn === '=') evaluate();
    else if (btn === '←') setExpression(prev => prev.slice(0, -1));
    else setExpression(prev => prev + btn);
  };

  const getButtonStyle = (btn: string) => {
    if (btn === '=') return `bg-[${COLOR}]/15 text-[${COLOR}] hover:bg-[${COLOR}]/25`;
    if (btn === 'C') return 'bg-red-500/15 text-red-400 hover:bg-red-500/25';
    if (btn === '←') return 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25';
    if (['÷', '×', '+', '-', '%', '^', '!'].includes(btn)) return 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25';
    if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs', 'exp'].includes(btn)) return 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25';
    if (['pi', 'e'].includes(btn)) return 'bg-green-500/15 text-green-400 hover:bg-green-500/25';
    return 'bg-white/5 text-white hover:bg-white/10';
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calculator size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">科学计算器</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>支持三角函数、指数、对数、幂运算等科学计算，实时表达式求值</p>
      </motion.div>

      {/* Calculator */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
        {/* Expression Input */}
        <div className="mb-4">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && evaluate()}
            placeholder="输入表达式，如 sin(pi/2) + log(100)"
            aria-label="数学表达式"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#e94560]/30 w-full font-mono"
          />
        </div>

        {/* Result */}
        <div className="flex items-center justify-between mb-4 bg-white/5 rounded-lg px-4 py-3">
          <div className="text-lg text-[#a8b2c1] font-mono">
            {result || '等待计算...'}
          </div>
          {result && result !== '计算错误' && result !== '表达式错误' && (
            <button onClick={copyResult} className="btn-secondary !py-1.5 !px-3 text-xs">
              <Copy size={13} className="inline mr-1" /> 复制
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          {buttons.map((row, i) => (
            <div key={i} className="grid grid-cols-6 gap-2">
              {row.map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleButtonClick(btn)}
                  className={`py-3 rounded-lg text-sm font-medium transition-all ${getButtonStyle(btn)}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Function Reference */}
        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <h3 className="text-xs text-[#666] mb-2">函数说明</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#a8b2c1]">
            <div>sin/cos/tan - 三角函数</div>
            <div>asin/acos/atan - 反三角</div>
            <div>log - 以10为底对数</div>
            <div>ln - 自然对数</div>
            <div>sqrt - 平方根</div>
            <div>^ - 幂运算</div>
            <div>pi - 圆周率 π</div>
            <div>e - 自然常数</div>
            <div>abs - 绝对值</div>
          </div>
        </div>
      </motion.div>

      {/* History */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 mt-6">
          <h3 className="text-sm font-medium text-[#a8b2c1] mb-3">计算历史</h3>
          <div className="space-y-1 text-xs text-[#666]">
            {history.map((h, i) => (
              <div key={i} className="bg-white/5 rounded px-2 py-1.5 font-mono">{h}</div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}