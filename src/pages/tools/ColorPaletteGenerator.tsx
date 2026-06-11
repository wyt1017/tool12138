import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Copy, RefreshCw } from 'lucide-react';

const color = '#f472b6';

// 颜色转换函数
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h: number, s: number, l: number) => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

// 生成配色方案
const generatePalette = (baseHex: string) => {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const colors: { name: string; hex: string; type: string }[] = [];

  // 基色
  colors.push({ name: '基色', hex: baseHex, type: 'base' });

  // 互补色 (色相 + 180°)
  const complementH = (hsl.h + 180) % 360;
  const complementRgb = hslToRgb(complementH, hsl.s, hsl.l);
  colors.push({ name: '互补色', hex: rgbToHex(complementRgb.r, complementRgb.g, complementRgb.b), type: 'complement' });

  // 类似色 (色相 ± 30°)
  const similar1H = (hsl.h + 30) % 360;
  const similar2H = (hsl.h - 30 + 360) % 360;
  const similar1Rgb = hslToRgb(similar1H, hsl.s, hsl.l);
  const similar2Rgb = hslToRgb(similar2H, hsl.s, hsl.l);
  colors.push({ name: '类似色1', hex: rgbToHex(similar1Rgb.r, similar1Rgb.g, similar1Rgb.b), type: 'similar' });
  colors.push({ name: '类似色2', hex: rgbToHex(similar2Rgb.r, similar2Rgb.g, similar2Rgb.b), type: 'similar' });

  // 三色搭配 (色相 + 120°, + 240°)
  const triad1H = (hsl.h + 120) % 360;
  const triad2H = (hsl.h + 240) % 360;
  const triad1Rgb = hslToRgb(triad1H, hsl.s, hsl.l);
  const triad2Rgb = hslToRgb(triad2H, hsl.s, hsl.l);
  colors.push({ name: '三色搭配1', hex: rgbToHex(triad1Rgb.r, triad1Rgb.g, triad1Rgb.b), type: 'triad' });
  colors.push({ name: '三色搭配2', hex: rgbToHex(triad2Rgb.r, triad2Rgb.g, triad2Rgb.b), type: 'triad' });

  // 分裂互补色 (色相 + 150°, + 210°)
  const split1H = (hsl.h + 150) % 360;
  const split2H = (hsl.h + 210) % 360;
  const split1Rgb = hslToRgb(split1H, hsl.s, hsl.l);
  const split2Rgb = hslToRgb(split2H, hsl.s, hsl.l);
  colors.push({ name: '分裂互补1', hex: rgbToHex(split1Rgb.r, split1Rgb.g, split1Rgb.b), type: 'split' });
  colors.push({ name: '分裂互补2', hex: rgbToHex(split2Rgb.r, split2Rgb.g, split2Rgb.b), type: 'split' });

  // 明暗变化
  const lighterRgb = hslToRgb(hsl.h, hsl.s, Math.min(hsl.l + 20, 100));
  const darkerRgb = hslToRgb(hsl.h, hsl.s, Math.max(hsl.l - 20, 0));
  colors.push({ name: '亮色', hex: rgbToHex(lighterRgb.r, lighterRgb.g, lighterRgb.b), type: 'shade' });
  colors.push({ name: '暗色', hex: rgbToHex(darkerRgb.r, darkerRgb.g, darkerRgb.b), type: 'shade' });

  return colors;
};

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState('#3b82f6');
  const [palette, setPalette] = useState<{ name: string; hex: string; type: string }[]>([]);

  const generate = () => {
    setPalette(generatePalette(baseColor));
  };

  const randomColor = () => {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setBaseColor(randomHex);
    setPalette(generatePalette(randomHex));
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">颜色调色板生成器</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>基于主色生成互补色、类似色、三色搭配等配色方案，一键复制色值</p>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#666]">主色：</label>
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              aria-label="选择主色"
              className="w-12 h-12 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              aria-label="主色色值"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono w-[100px]"
            />
          </div>
          <button onClick={generate} className="btn-primary">
            生成配色方案
          </button>
          <button onClick={randomColor} className="btn-secondary">
            <RefreshCw size={15} className="inline mr-1.5" /> 随机颜色
          </button>
        </div>
      </motion.div>

      {/* Palette */}
      {palette.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">配色方案</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {palette.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 rounded-lg p-3"
              >
                <div
                  className="w-full h-[80px] rounded-lg mb-3 cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => copyColor(c.hex)}
                  title="点击复制"
                />
                <div className="text-xs text-[#666] mb-1">{c.name}</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{c.hex}</span>
                  <button onClick={() => copyColor(c.hex)} className="btn-secondary !py-1 !px-2 text-xs">
                    <Copy size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Color Theory */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h3 className="text-xs text-[#666] mb-2">配色理论说明</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#a8b2c1]">
              <div><strong className="text-[#f472b6]">互补色：</strong>色相相差180°，对比强烈</div>
              <div><strong className="text-[#00d9ff]">类似色：</strong>色相相差30°，和谐统一</div>
              <div><strong className="text-[#6bcb77]">三色搭配：</strong>色相相差120°，平衡配色</div>
              <div><strong className="text-[#a78bfa]">分裂互补：</strong>互补色的变体，更柔和</div>
              <div><strong className="text-[#ffd369]">亮色：</strong>亮度增加20%</div>
              <div><strong className="text-[#e94560]">暗色：</strong>亮度减少20%</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}