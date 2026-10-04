import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Type, Download, Image as ImageIcon, RefreshCw } from 'lucide-react';

const color = '#ffd369';

const DEFAULT_TEXT = '春眠不觉晓\n处处闻啼鸟\n夜来风雨声\n花落知多少';

const FONTS = [
  { label: '系统默认', value: 'sans-serif' },
  { label: '衬线', value: 'serif' },
  { label: '等宽', value: 'monospace' },
  { label: '楷体', value: '"KaiTi", "STKaiti", serif' },
  { label: '宋体', value: '"SimSun", "STSong", serif' },
];

const PATTERNS = [
  { label: '纯色', value: 'none' },
  { label: '点阵', value: 'dots' },
  { label: '网格', value: 'grid' },
  { label: '斜线', value: 'lines' },
];

interface RenderOptions {
  text: string;
  width: number;
  margin: number;
  fontSize: number;
  lineHeight: number;
  lineSpacing: number;
  radius: number;
  textColor: string;
  bgColor: string;
  fontFamily: string;
  pattern: string;
}

/** 绘制圆角矩形路径（不填充），radius<=0 时退化为普通矩形 */
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 按最大宽度逐字符换行，空行保留用于段落分隔 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (para === '') {
      lines.push('');
      continue;
    }
    let current = '';
    for (const ch of para) {
      if (current !== '' && ctx.measureText(current + ch).width > maxWidth) {
        lines.push(current);
        current = ch;
      } else {
        current += ch;
      }
    }
    lines.push(current);
  }
  return lines;
}

/** 核心绘制逻辑：在 canvas 上渲染文本图片，返回画布高度 */
function renderTextImage(canvas: HTMLCanvasElement, opts: RenderOptions): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;

  const width = Math.max(60, opts.width);
  const margin = Math.max(0, opts.margin);
  const fontSize = Math.max(8, opts.fontSize);
  const maxTextWidth = Math.max(10, width - margin * 2);

  ctx.font = `${fontSize}px ${opts.fontFamily}`;
  const lines = wrapLines(ctx, opts.text, maxTextWidth);
  const lineStep = Math.max(fontSize, Math.round(fontSize * opts.lineHeight));
  let contentHeight = 0;
  for (const line of lines) {
    contentHeight += lineStep;
    if (line === '') contentHeight += opts.lineSpacing;
  }
  const height = Math.max(fontSize * 2 + margin * 2, margin * 2 + contentHeight);

  canvas.width = width;
  canvas.height = height;

  // 背景（圆角外保持透明，供 PNG 导出）
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  drawRoundRect(ctx, 0, 0, width, height, opts.radius);
  ctx.clip();
  ctx.fillStyle = opts.bgColor;
  ctx.fillRect(0, 0, width, height);

  if (opts.pattern !== 'none') {
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.18)';
    ctx.fillStyle = 'rgba(128, 128, 128, 0.18)';
    ctx.lineWidth = 1;
    const gap = 20;
    if (opts.pattern === 'dots') {
      for (let x = gap; x < width; x += gap) {
        for (let y = gap; y < height; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (opts.pattern === 'grid') {
      for (let x = gap; x < width; x += gap) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = gap; y < height; y += gap) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    } else if (opts.pattern === 'lines') {
      for (let x = -height; x < width; x += gap) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + height, height); ctx.stroke();
      }
    }
  }
  ctx.restore();

  // 文本
  ctx.font = `${fontSize}px ${opts.fontFamily}`;
  ctx.fillStyle = opts.textColor;
  ctx.textBaseline = 'middle';
  let y = margin + lineStep / 2;
  for (const line of lines) {
    if (line === '') {
      y += lineStep + opts.lineSpacing;
      continue;
    }
    ctx.fillText(line, margin, y);
    y += lineStep;
  }

  return height;
}

function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

const DEFAULT_OPTS: RenderOptions = {
  text: DEFAULT_TEXT,
  width: 620,
  margin: 20,
  fontSize: 18,
  lineHeight: 1.8,
  lineSpacing: 25,
  radius: 0,
  textColor: '#000000',
  bgColor: '#ffffff',
  fontFamily: 'sans-serif',
  pattern: 'none',
};

export default function Text2Image() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [width, setWidth] = useState(620);
  const [margin, setMargin] = useState(20);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [lineSpacing, setLineSpacing] = useState(25);
  const [radius, setRadius] = useState(0);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [pattern, setPattern] = useState('none');
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentOpts: RenderOptions = {
    text, width, margin, fontSize, lineHeight, lineSpacing, radius, textColor, bgColor, fontFamily, pattern,
  };

  const generate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderTextImage(canvas, currentOpts);
    setDataUrl(canvas.toDataURL('image/png'));
  };

  // 初次加载渲染默认示例
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderTextImage(canvas, DEFAULT_OPTS);
    setDataUrl(canvas.toDataURL('image/png'));
  }, []);

  const downloadPng = () => {
    if (!dataUrl) return;
    downloadDataUrl(dataUrl, 'text2image.png');
  };

  const downloadJpg = () => {
    const canvas = canvasRef.current;
    if (!canvas || !dataUrl) return;
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    tctx.fillStyle = bgColor;
    tctx.fillRect(0, 0, tmp.width, tmp.height);
    tctx.drawImage(canvas, 0, 0);
    downloadDataUrl(tmp.toDataURL('image/jpeg', 0.92), 'text2image.jpg');
  };

  const inputCls = 'w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#ffd369]/40';

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Type size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">文本转图片</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">将文本渲染为图片，可自定义尺寸、字体、颜色与背景，支持 PNG/JPG 导出</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">参数设置</h3>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">文本内容</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                aria-label="文本内容"
                placeholder="输入要转为图片的文本"
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">图像宽度</label>
                <input type="number" value={width} min={60} max={2000} onChange={(e) => setWidth(Math.max(60, Math.min(Number(e.target.value), 2000)))} aria-label="图像宽度" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">边距</label>
                <input type="number" value={margin} min={0} max={200} onChange={(e) => setMargin(Math.max(0, Math.min(Number(e.target.value), 200)))} aria-label="边距" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">字体大小</label>
                <input type="number" value={fontSize} min={8} max={200} onChange={(e) => setFontSize(Math.max(8, Math.min(Number(e.target.value), 200)))} aria-label="字体大小" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">行高倍数</label>
                <input type="number" step={0.1} value={lineHeight} min={1} max={3} onChange={(e) => setLineHeight(Math.max(1, Math.min(Number(e.target.value), 3)))} aria-label="行高倍数" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">段间距(px)</label>
                <input type="number" value={lineSpacing} min={0} max={100} onChange={(e) => setLineSpacing(Math.max(0, Math.min(Number(e.target.value), 100)))} aria-label="段间距" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">圆角(px)</label>
                <input type="number" value={radius} min={0} max={64} onChange={(e) => setRadius(Math.max(0, Math.min(Number(e.target.value), 64)))} aria-label="圆角" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">文本色</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} aria-label="文本色" className="w-full h-10 rounded-lg cursor-pointer border border-[var(--border-color)] bg-transparent" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1.5">背景色</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} aria-label="背景色" className="w-full h-10 rounded-lg cursor-pointer border border-[var(--border-color)] bg-transparent" />
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">字体</label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} aria-label="字体" className={inputCls}>
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">背景图案</label>
              <select value={pattern} onChange={(e) => setPattern(e.target.value)} aria-label="背景图案" className={inputCls}>
                {PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <button onClick={generate} className="btn-primary w-full">
              <RefreshCw size={16} className="inline mr-1.5" /> 生成图片
            </button>
          </div>
        </motion.div>

        {/* Preview Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">预览</h3>
              <div className="flex gap-2">
                <button onClick={downloadPng} disabled={!dataUrl} className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs disabled:opacity-40">
                  <ImageIcon size={13} /> PNG
                </button>
                <button onClick={downloadJpg} disabled={!dataUrl} className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs disabled:opacity-40">
                  <Download size={13} /> JPG
                </button>
              </div>
            </div>
            <div className="rounded-xl p-4 min-h-[280px] flex items-start justify-center overflow-auto bg-[var(--bg-hover)]/40">
              {dataUrl ? (
                <img src={dataUrl} alt="文本转图片预览" className="max-w-full h-auto rounded shadow-lg" />
              ) : (
                <span className="text-[var(--text-faint)] text-sm py-24">点击「生成图片」查看效果</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
