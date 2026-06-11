import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette, Copy, Check, Image, X } from 'lucide-react';

interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
    case gn: h = ((bn - rn) / d + 2) / 6; break;
    default: h = ((rn - gn) / d + 4) / 6; break;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function parseColor(input: string): ColorValue | null {
  let hex = input.trim();
  if (/^#[a-fA-F0-9]{6}$/.test(hex)) {
    hex = hex.toUpperCase();
  } else if (/^#[a-fA-F0-9]{3}$/.test(hex)) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    hex = hex.toUpperCase();
  } else if (/^rgb\(/i.test(hex)) {
    const match = hex.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    } else return null;
  } else {
    return null;
  }
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return { hex, rgb, hsl: rgbToHsl(rgb.r, rgb.g, rgb.b) };
}

// Generate a nice palette based on base color
function generatePalette(baseHex: string): string[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];
  const { r, g, b } = rgb;
  return Array.from({ length: 7 }, (_, i) => {
    const factor = i * 12.5;
    const nr = Math.round(r + (255 - r) * factor / 100);
    const ng = Math.round(g + (255 - g) * factor / 100);
    const nb = Math.round(b + (255 - b) * factor / 100);
    return '#' + [nr, ng, nb].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
  });
}

export default function ColorPicker() {
  const [colorInput, setColorInput] = useState('#6366F1');
  const [color, setColor] = useState<ColorValue | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  
  // 图片取色相关状态
  const [imageData, setImageData] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [magnifierColor, setMagnifierColor] = useState<string>('#000000');
  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const parsed = parseColor(colorInput);
    setColor(parsed);
    if (parsed) {
      setPalette(generatePalette(parsed.hex));
    } else {
      setPalette([]);
    }
  }, [colorInput]);

  // 当 imageData 变化时，绘制到 canvas
  useEffect(() => {
    if (showImagePicker && imageData && canvasRef.current) {
      const canvas = canvasRef.current;
      const img = new window.Image();
      img.onload = () => {
        // 设置 canvas 尺寸，限制最大高度
        const maxHeight = 400;
        const scale = img.naturalHeight > maxHeight ? maxHeight / img.naturalHeight : 1;
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setCanvasReady(true);

        }
      };
      img.src = imageData;
    }
  }, [showImagePicker, imageData]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // 图片上传处理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
        setShowImagePicker(true);
        setCanvasReady(false);
        setMagnifierColor('#000000');
      };
      reader.readAsDataURL(file);
    }
  };

  // 从canvas获取像素颜色
  const getPixelColor = (x: number, y: number): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#000000';
    
    // 确保坐标在有效范围内
    const safeX = Math.max(0, Math.min(x, canvas.width - 1));
    const safeY = Math.max(0, Math.min(y, canvas.height - 1));
    
    try {
      const pixel = ctx.getImageData(safeX, safeY, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    } catch {
      return '#000000';
    }
  };

  // 鼠标移动显示放大镜（使用getPixelColor函数）
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasReady) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // 计算缩放比例：canvas 实际像素尺寸 vs CSS 显示尺寸
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // 转换为实际像素坐标
    const pixelX = Math.floor((e.clientX - rect.left) * scaleX);
    const pixelY = Math.floor((e.clientY - rect.top) * scaleY);
    
    // 确保在有效范围内
    const safeX = Math.max(0, Math.min(pixelX, canvas.width - 1));
    const safeY = Math.max(0, Math.min(pixelY, canvas.height - 1));
    
    setMagnifierPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    
    // 使用 getPixelColor 函数获取像素颜色
    setMagnifierColor(getPixelColor(safeX, safeY));
    setMagnifierVisible(true);
  };

  // 点击取色
  const handlePickColor = () => {
    if (magnifierColor) {
      setColorInput(magnifierColor);
      setShowImagePicker(false);
      setImageData(null);
    }
  };

  // 关闭图片取色
  const closeImagePicker = () => {
    setShowImagePicker(false);
    setImageData(null);
    setMagnifierVisible(false);
    setCanvasReady(false);
  };

  const formatRow = (label: string, value: string, field: string) => (
    <div
      key={field}
      onClick={() => copyToClipboard(value, field)}
      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#555] w-12">{label}</span>
        <code className="text-sm text-white font-mono group-hover:text-[#00d9ff] transition-colors">{value}</code>
      </div>
      {copiedField === field ? (
        <Check size={14} className="text-[#6bcb77]" />
      ) : (
        <Copy size={13} className="text-[#444] opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffd369]/15 flex items-center justify-center">
            <Palette size={20} className="text-[#ffd369]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">颜色选择器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">取色、HEX/RGB/HSL格式转换、调色板生成</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Picker & Preview */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          {/* Color Preview */}
          <div
            className="w-full h-48 rounded-2xl mb-6 shadow-lg relative overflow-hidden"
            style={{ backgroundColor: color?.hex || '#000' }}
          >
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <code className="text-2xl font-['Syne'] font-bold text-white drop-shadow-lg">
                {color?.hex || '#000000'}
              </code>
              <div className="text-right">
                <div className="text-sm text-white/80 drop-shadow">{color?.rgb.r}, {color?.rgb.g}, {color?.rgb.b}</div>
                <div className="text-xs text-white/60 drop-shadow mt-0.5">
                  HSL({color?.hsl.h}, {color?.hsl.s}%, {color?.hsl.l}%)
                </div>
              </div>
            </div>
          </div>

          {/* Color Input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#a8b2c1] ml-1">输入颜色值</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={color?.hex || '#000000'}
                onChange={(e) => setColorInput(e.target.value.toUpperCase())}
                aria-label="选择颜色"
                className="w-14 h-14 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="#6366F1 或 rgb(99,102,241)"
                aria-label="颜色值"
                className="flex-1 tool-area !rounded-xl px-4 text-white text-sm outline-none focus:border-[#ffd369]/30 transition-colors font-mono"
              />
              {/* 图片取色按钮 */}
              <label className="w-14 h-14 rounded-xl cursor-pointer border border-white/10 hover:border-[#ffd369]/30 flex items-center justify-center transition-colors bg-white/5 hover:bg-[#ffd369]/10">
                <Image size={20} className="text-[#a8b2c1]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  aria-label="上传图片取色"
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-[#666] ml-1">点击图片图标上传图片取色</p>
          </div>

          {/* Palette */}
          {palette.length > 0 && (
            <div className="mt-8">
              <label className="block text-sm font-medium text-[#a8b2c1] mb-3 ml-1">调色板</label>
              <div className="flex gap-2">
                {palette.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setColorInput(c)}
                    title={c}
                    className="flex-1 h-12 rounded-xl transition-transform hover:scale-105 hover:shadow-lg"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right: Values */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-3 ml-1">颜色值（点击复制）</label>
          <div className="space-y-2">
            {color ? (
              <>
                {formatRow('HEX', color.hex, 'hex')}
                {formatRow('RGB', `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, 'rgb')}
                {formatRow('RGB数字', `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`, 'rgb-num')}
                {formatRow('HSL', `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`, 'hsl')}
                {formatRow('HSV', `hsv(${color.hsl.h}, ${Math.round(((Math.max(color.rgb.r, color.rgb.g, color.rgb.b) - Math.min(color.rgb.r, color.rgb.g, color.rgb.b)) / (Math.max(color.rgb.r, color.rgb.g, color.rgb.b) || 1)) * 100)}%, ${Math.round(Math.max(color.rgb.r, color.rgb.g, color.rgb.b) / 255 * 100)}%)`, 'hsv')}
              </>
            ) : (
              <div className="text-center py-12 text-[#555] text-sm">请输入有效的颜色值</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 图片取色弹窗 */}
      {showImagePicker && imageData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl max-h-[80vh] bg-[#1a1a2e] rounded-2xl p-6 shadow-2xl"
          >
            {/* 关闭按钮 */}
            <button
              onClick={closeImagePicker}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
            
            {/* 标题 */}
            <div className="flex items-center gap-2 mb-4 px-2">
              <Image size={18} className="text-[#ffd369]" />
              <span className="text-sm font-medium text-white">从图片取色</span>
              <span className="text-xs text-[#666]">移动鼠标查看颜色，点击选取</span>
            </div>
            
            {/* 图片区域 - 使用 canvas 直接显示和取色 */}
            <div className="relative rounded-xl overflow-hidden flex justify-center bg-black/30">
              <canvas 
                ref={canvasRef} 
                className="cursor-crosshair"
                style={{ maxHeight: '50vh', width: 'auto', maxWidth: '100%' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMagnifierVisible(false)}
                onClick={handlePickColor}
              />
              
              {/* 放大镜 */}
              {magnifierVisible && (
                <div 
                  className="absolute pointer-events-none flex flex-col items-center"
                  style={{ 
                    left: magnifierPos.x, 
                    top: magnifierPos.y - 10,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div 
                    className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: magnifierColor }}
                  />
                  <div className="mt-2 px-3 py-1.5 rounded bg-black/80 text-white text-xs font-mono">
                    {magnifierColor}
                  </div>
                </div>
              )}
            </div>
            
            {/* 当前颜色预览 */}
            <div className="mt-4 flex items-center gap-3 px-2">
              <div 
                className="w-10 h-10 rounded-xl border border-white/20"
                style={{ backgroundColor: magnifierColor }}
              />
              <div>
                <code className="text-sm font-mono text-white">{magnifierColor}</code>
                <p className="text-xs text-[#666] mt-0.5">点击图片选取此颜色</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
