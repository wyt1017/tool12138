import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Radio, Copy, Check, Play, Pause, Volume2 } from 'lucide-react';

const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

const MORSE_DECODE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

export default function MorseCode() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [wpm, setWpm] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const encode = () => {
    const text = input.toUpperCase().trim();
    const result: string[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') {
        result.push('/');
      } else if (MORSE_CODE[ch]) {
        result.push(MORSE_CODE[ch]);
      }
      // ignore unsupported chars
    }
    setOutput(result.join(' '));
  };

  const decode = () => {
    const words = input.trim().split(/\s+/);
    const result: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const token = words[i];
      if (token === '/') {
        result.push(' ');
      } else if (MORSE_DECODE[token]) {
        result.push(MORSE_DECODE[token]);
      }
    }
    setOutput(result.join('').replace(/\s+/g, ' ').trim());
  };

  const playMorseAudio = async () => {
    if (!output || mode !== 'encode') return;
    setIsPlaying(true);

    const ctx = getAudioContext();
    const baseUnit = 1200 / wpm; // ms per unit
    const dotDuration = baseUnit / 1000; // 转换为秒
    const dashDuration = baseUnit * 3 / 1000;
    const gapDuration = baseUnit / 1000;
    const letterGap = baseUnit * 3 / 1000;
    const wordGap = baseUnit * 7 / 1000;

    const symbols = output.split('');
    let currentTime = ctx.currentTime + 0.1;

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];

      if (sym === '.') {
        playTone(ctx, currentTime, dotDuration);
        currentTime += dotDuration + gapDuration;
      } else if (sym === '-') {
        playTone(ctx, currentTime, dashDuration);
        currentTime += dashDuration + gapDuration;
      } else if (sym === '/') {
        currentTime += wordGap - gapDuration;
      } else if (sym === ' ') {
        currentTime += letterGap - gapDuration;
      }
    }

    // Auto stop after total duration
    const totalTime = (currentTime - ctx.currentTime) * 1000;
    setTimeout(() => setIsPlaying(false), totalTime + 200);
  };

  const playTone = (ctx: AudioContext, startTime: number, duration: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 600;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
            <Radio size={20} className="text-[#e94560]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">摩斯电码编解码</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">文本与摩斯电码互转，支持音频播放和速度调节</p>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-6">
        <button
          onClick={() => { setMode('encode'); setOutput(''); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'encode' ? 'bg-[#e94560]/15 text-[#e94560]' : 'bg-white/5 text-[#666]'
          }`}
        >
          编码 → 摩斯
        </button>
        <button
          onClick={() => { setMode('decode'); setOutput(''); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'decode' ? 'bg-[#e94560]/15 text-[#e94560]' : 'bg-white/5 text-[#666]'
          }`}
        >
          解码 ← 摩斯
        </button>
      </motion.div>

      {/* WPM Control (only in encode mode) */}
      {mode === 'encode' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card p-4 mb-6 flex items-center gap-4">
          <Volume2 size={18} className="text-[#e94560]" />
          <span className="text-sm text-[#a8b2c1] whitespace-nowrap">播放速度：</span>
          <input
            type="range"
            min={5}
            max={30}
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
            aria-label="播放速度"
            className="flex-1 max-w-[200px] accent-[#e94560]"
          />
          <span className="text-sm font-mono text-[#e94560] min-w-[50px]">{wpm} WPM</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 block ml-1">
            {mode === 'encode' ? '输入文本' : '输入摩斯电码'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? '输入要编码的文本（支持 A-Z, 0-9）...'
                : '输入摩斯电码，用空格分隔字符，/ 分隔单词\n例如：.... . .-.. .-.. --- / .-- --- .-. .-.. -..'
            }
            aria-label="输入文本"
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">
              {mode === 'encode' ? '摩斯电码结果' : '解码文本结果'}
            </label>
            {output && (
              <div className="flex gap-2">
                <button onClick={copyResult} className="btn-secondary !py-1.5 !px-3 text-xs">
                  {copied ? <Check size={13} className="inline mr-1" /> : <Copy size={13} className="inline mr-1" />}
                  {copied ? '已复制' : '复制'}
                </button>
                {mode === 'encode' && (
                  <button onClick={playMorseAudio} disabled={isPlaying} className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-50">
                    {isPlaying ? <Pause size={13} className="inline mr-1" /> : <Play size={13} className="inline mr-1" />}
                    {isPlaying ? '播放中...' : '播放音频'}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="tool-area w-full min-h-[280px] p-5 text-base leading-relaxed font-mono break-all whitespace-pre-wrap tracking-widest text-[#f0f0f5] placeholder:text-[#333]">
            {output || (
              <span className="text-[#444]">输出结果将显示在这里...</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3 mt-6"
      >
        <button onClick={mode === 'encode' ? encode : decode} disabled={!input} className="btn-primary disabled:opacity-30">
          {mode === 'encode' ? '编码为摩斯电码' : '解码为文本'}
        </button>
        <button onClick={() => { setInput(''); setOutput(''); }} className="btn-secondary">
          清空
        </button>
      </motion.div>

      {/* Reference Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 glass-card p-6"
      >
        <h3 className="text-sm font-semibold text-[#e94560] mb-4">摩斯电码对照表</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 text-xs font-mono">
          {Object.entries(MORSE_CODE).map(([letter, code]) => (
            <div key={letter} className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-white/5">
              <span className="text-[#e94560] font-bold w-4">{letter}</span>
              <span className="text-[#a8b2c1] tracking-wider">{code}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
