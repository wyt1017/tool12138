import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Upload, Copy } from 'lucide-react';
import jsQR from 'jsqr';

export default function QrCodeDecoder() {
  const color = '#f472b6';
  const [image, setImage] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
      setDecoded(null);
      setError(null);
      decodeQRCode(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const decodeQRCode = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      // 使用 jsQR 库解码
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setDecoded(code.data);
        setError(null);
      } else {
        setError('无法识别二维码，请确保图片清晰且包含有效的二维码');
      }
    };
    img.onerror = () => {
      setError('图片加载失败');
    };
    img.src = dataUrl;
  };

  const copyDecoded = () => {
    if (decoded) {
      navigator.clipboard.writeText(decoded);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">二维码解码器</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>上传二维码图片，自动解析并显示其中的文本、链接或联系信息</p>
      </motion.div>

      {/* Upload */}
      {!image && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <label className="glass-card p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
            <Upload size={48} className="text-[#666] mb-4" />
            <span className="text-[#a8b2c1] mb-2">点击上传二维码图片</span>
            <span className="text-xs text-[#666]">支持 JPG、PNG、GIF 等格式</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" aria-label="上传二维码图片" />
          </label>
        </motion.div>
      )}

      {/* Image & Result */}
      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#a8b2c1]">上传的图片</label>
                <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer">
                  <Upload size={13} className="inline mr-1" /> 更换图片
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" aria-label="更换图片" />
                </label>
              </div>
              <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                <img src={image} alt="QR Code" className="max-w-full max-h-[300px]" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </motion.div>

          {/* Decoded Result */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card p-6 h-full">
              <h2 className="text-lg font-semibold text-white mb-4">解码结果</h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {decoded && (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-[#a8b2c1] break-all">
                    {decoded}
                  </div>
                  <button onClick={copyDecoded} className="btn-primary w-full">
                    <Copy size={15} className="inline mr-2" /> 复制内容
                  </button>
                </div>
              )}

              {!decoded && !error && (
                <div className="text-[#666] text-sm">正在解码...</div>
              )}
            </div>
          </motion.div>
        </div>
      )}


    </div>
  );
}