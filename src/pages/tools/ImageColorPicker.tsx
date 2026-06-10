import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, Copy } from 'lucide-react';

const COLOR = '#ffd369';

export default function ImageColorPicker() {
  const [image, setImage] = useState<string | null>(null);
  const [color, setColor] = useState({ hex: '#000000', rgb: { r: 0, g: 0, b: 0 } });
  const [colorHistory, setColorHistory] = useState<Array<{ hex: string; rgb: { r: number; g: number; b: number } }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
      setColorHistory([]);
    };
    reader.readAsDataURL(file);
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };

  const pickColor = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const hex = rgbToHex(r, g, b);

    setColor({ hex, rgb: { r, g, b } });
  }, []);

  const addToHistory = () => {
    if (!colorHistory.find(c => c.hex === color.hex)) {
      setColorHistory(prev => [...prev.slice(-9), color]);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      // 限制 canvas 最大高度为 400px，保持宽高比
      const maxHeight = 400;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (h > maxHeight) {
        const scale = maxHeight / h;
        w = Math.round(w * scale);
        h = maxHeight;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Palette size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">图片取色器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">上传图片后鼠标悬停/点击，拾取任意像素点的HEX/RGB值</p>
      </motion.div>

      {/* Upload */}
      {!image && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <label className="glass-card p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
            <Upload size={48} className="text-[#666] mb-4" />
            <span className="text-[#a8b2c1] mb-2">点击上传图片</span>
            <span className="text-xs text-[#666]">支持 JPG、PNG、GIF、WebP 等格式</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} aria-label="上传图片" className="hidden" />
          </label>
        </motion.div>
      )}

      {/* Image & Color Display */}
      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image Canvas */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#a8b2c1]">图片预览</label>
                <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer">
                  <Upload size={13} className="inline mr-1" /> 更换图片
                  <input type="file" accept="image/*" onChange={handleFileUpload} aria-label="更换图片" className="hidden" />
                </label>
              </div>
              <div className="relative overflow-hidden rounded-lg bg-black/20 min-h-[300px] flex items-center justify-center cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[400px] object-contain"
                  style={{ display: 'block' }}
                  onMouseMove={pickColor}
                  onClick={addToHistory}
                />
                {/* 隐藏的原图用于 preload */}
                <img
                  src={image}
                  alt="Uploaded"
                  onLoad={handleImageLoad}
                  className="absolute opacity-0 pointer-events-none"
                  style={{ position: 'absolute', visibility: 'hidden' }}
                />
              </div>
              <p className="text-xs text-[#666] mt-2">鼠标移动查看颜色，点击添加到历史记录</p>
            </div>
          </motion.div>

          {/* Color Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card p-6 h-full">
              <h2 className="text-lg font-semibold text-white mb-4">当前颜色</h2>

              {/* Color Preview */}
              <div
                className="w-full h-[100px] rounded-xl mb-4 border border-white/10"
                style={{ backgroundColor: color.hex }}
              />

              {/* HEX */}
              <div className="mb-4">
                <label className="text-xs text-[#666] block mb-1.5">HEX</label>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-lg text-white bg-white/5 px-3 py-2 rounded-lg flex-1">{color.hex}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(color.hex)}
                    className="btn-secondary !py-2 !px-3"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* RGB */}
              <div className="mb-4">
                <label className="text-xs text-[#666] block mb-1.5">RGB</label>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-lg text-white bg-white/5 px-3 py-2 rounded-lg flex-1">
                    rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`)}
                    className="btn-secondary !py-2 !px-3"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Color History */}
              {colorHistory.length > 0 && (
                <div>
                  <label className="text-xs text-[#666] block mb-2">历史记录</label>
                  <div className="flex flex-wrap gap-2">
                    {colorHistory.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-lg border border-white/10 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}