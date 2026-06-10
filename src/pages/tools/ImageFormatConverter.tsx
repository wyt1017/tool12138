import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Upload, Download } from 'lucide-react';

const FORMAT_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
  { value: 'bmp', label: 'BMP' },
];

export default function ImageFormatConverter() {
  const [image, setImage] = useState<string | null>(null);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.9);
  const [converted, setConverted] = useState<string | null>(null);
  const [originalFormat, setOriginalFormat] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    setOriginalFormat(ext);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
      setConverted(null);
    };
    reader.readAsDataURL(file);
  };

  const convert = () => {
    if (!image || !canvasRef.current) return;

    const img = document.createElement('img');
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : format === 'bmp' ? 'image/bmp' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      setConverted(dataUrl);
    };
    img.src = image;
  };

  const download = () => {
    if (!converted) return;
    const link = document.createElement('a');
    link.download = `converted.${format}`;
    link.href = converted;
    link.click();
  };

  const selectFormat = (value: string) => {
    setFormat(value);
    setDropdownOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffd369]/15 flex items-center justify-center">
            <Image size={20} className="text-[#ffd369]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">图片格式转换</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">PNG/JPEG/WEBP/BMP等格式互转，可调整图片质量并下载</p>
      </motion.div>

      {/* Upload */}
      {!image && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <label className="glass-card p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
            <Upload size={48} className="text-[#666] mb-4" />
            <span className="text-[#a8b2c1] mb-2">点击上传图片</span>
            <span className="text-xs text-[#666]">支持 PNG、JPEG、WebP、BMP 等格式</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} aria-label="上传图片" className="hidden" />
          </label>
        </motion.div>
      )}

      {/* Options & Preview */}
      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Original Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#a8b2c1]">原始图片</label>
                <span className="text-xs text-[#666]">{originalFormat?.toUpperCase()}</span>
              </div>
              <div className="bg-white rounded-lg p-2 flex items-center justify-center">
                <img src={image} alt="Original" className="max-w-full max-h-[200px]" />
              </div>
              <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer mt-3 block text-center">
                <Upload size={13} className="inline mr-1" /> 更换图片
                <input type="file" accept="image/*" onChange={handleFileUpload} aria-label="更换图片" className="hidden" />
              </label>
            </div>
          </motion.div>

          {/* Options */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
            <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">转换设置</h2>

            <div className="mb-4">
              <label className="text-xs text-[#666] block mb-2">目标格式</label>
              {/* Custom dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#ffd369]/30 w-full flex items-center justify-between"
                >
                  <span>{FORMAT_OPTIONS.find(o => o.value === format)?.label}</span>
                  <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                      {FORMAT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => selectFormat(opt.value)}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            format === opt.value ? 'bg-[#ffd369]/15 text-[#ffd369]' : 'text-[#a8b2c1] hover:bg-white/5'
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

            {format === 'jpeg' && (
              <div className="mb-4">
                <label className="text-xs text-[#666] block mb-2">图片质量</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  aria-label="图片质量"
                  className="w-full"
                />
                <div className="text-xs text-[#a8b2c1] mt-1">{Math.round(quality * 100)}%</div>
              </div>
            )}

            <button onClick={convert} className="btn-primary w-full mt-4">
              开始转换
            </button>
          </motion.div>

          {/* Converted Image */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#a8b2c1]">转换结果</label>
                <span className="text-xs text-[#666]">{format.toUpperCase()}</span>
              </div>
              {converted ? (
                <>
                  <div className="bg-white rounded-lg p-2 flex items-center justify-center mb-3">
                    <img src={converted} alt="Converted" className="max-w-full max-h-[200px]" />
                  </div>
                  <button onClick={download} className="btn-primary w-full">
                    <Download size={15} className="inline mr-2" /> 下载图片
                  </button>
                </>
              ) : (
                <div className="text-[#666] text-sm text-center py-8">等待转换...</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}