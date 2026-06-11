import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Upload, Download, Type } from 'lucide-react';

const POSITION_OPTIONS = [
  { value: 'top-left', label: '左上角' },
  { value: 'top-right', label: '右上角' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-right', label: '右下角' },
  { value: 'center', label: '居中' },
];

export default function ImageWatermark() {
  const [image, setImage] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [position, setPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-right');
  const [opacity, setOpacity] = useState(0.5);
  const [fontSize, setFontSize] = useState(24);
  const [color, setColor] = useState('#ffffff');
  const [result, setResult] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const addWatermark = () => {
    if (!image || !watermarkText || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;

      const padding = 20;
      const textWidth = ctx.measureText(watermarkText).width;
      let x = padding;
      let y = padding + fontSize;

      switch (position) {
        case 'top-right':
          x = canvas.width - textWidth - padding;
          y = padding + fontSize;
          break;
        case 'bottom-left':
          x = padding;
          y = canvas.height - padding;
          break;
        case 'bottom-right':
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          break;
        case 'center':
          x = (canvas.width - textWidth) / 2;
          y = canvas.height / 2;
          break;
      }

      ctx.fillText(watermarkText, x, y);
      ctx.globalAlpha = 1;

      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  const download = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.download = 'watermarked.png';
    link.href = result;
    link.click();
  };

  const selectPosition = (value: string) => {
    setPosition(value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center');
    setDropdownOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00d9ff]/15 flex items-center justify-center">
            <Droplet size={20} className="text-[#00d9ff]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">图片水印工具</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">在图片上添加文字水印，可自定义位置、透明度、大小</p>
      </motion.div>

      {/* Upload */}
      {!image && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <label className="glass-card p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
            <Upload size={48} className="text-[#666] mb-4" />
            <span className="text-[#a8b2c1] mb-2">点击上传图片</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} aria-label="上传图片" className="hidden" />
          </label>
        </motion.div>
      )}

      {/* Options & Preview */}
      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Original */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-card p-4">
              <label className="text-sm font-medium text-[#a8b2c1] mb-3 block">原始图片</label>
              <div className="bg-white rounded-lg p-2">
                <img src={image} alt="Original" className="max-w-full max-h-[250px]" />
              </div>
              <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer mt-3 block text-center">
                <Upload size={13} className="inline mr-1" /> 更换图片
                <input type="file" accept="image/*" onChange={handleFileUpload} aria-label="更换图片" className="hidden" />
              </label>
            </div>
          </motion.div>

          {/* Options */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
            <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">水印设置</h2>

            <div className="mb-4">
              <label className="text-xs text-[#666] block mb-2">水印文字</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="输入水印文字..."
                aria-label="水印文字"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#666] block mb-2">位置</label>
              {/* Custom dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 w-full flex items-center justify-between"
                >
                  <span>{POSITION_OPTIONS.find(o => o.value === position)?.label}</span>
                  <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                      {POSITION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => selectPosition(opt.value)}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            position === opt.value ? 'bg-[#00d9ff]/15 text-[#00d9ff]' : 'text-[#a8b2c1] hover:bg-white/5'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#666] block mb-2">透明度</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                aria-label="透明度"
                className="w-full"
              />
              <div className="text-xs text-[#a8b2c1] mt-1">{Math.round(opacity * 100)}%</div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#666] block mb-2">字体大小</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={12}
                max={100}
                aria-label="字体大小"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#666] block mb-2">颜色</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="水印颜色"
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>

            <button onClick={addWatermark} disabled={!watermarkText} className="btn-primary w-full disabled:opacity-30">
              <Type size={15} className="inline mr-2" /> 添加水印
            </button>
          </motion.div>

          {/* Result */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card p-4 h-full">
              <label className="text-sm font-medium text-[#a8b2c1] mb-3 block">添加水印后</label>
              {result ? (
                <>
                  <div className="bg-white rounded-lg p-2 mb-3">
                    <img src={result} alt="Watermarked" className="max-w-full max-h-[250px]" />
                  </div>
                  <button onClick={download} className="btn-primary w-full">
                    <Download size={15} className="inline mr-2" /> 下载图片
                  </button>
                </>
              ) : (
                <div className="text-[#666] text-sm text-center py-12">等待添加水印...</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}