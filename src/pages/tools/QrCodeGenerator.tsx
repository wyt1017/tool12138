import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Copy } from 'lucide-react';
import QRCode from 'qrcode';

export default function QrCodeGenerator() {
  const [text, setText] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [size, setSize] = useState(256);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = useCallback(async () => {
    if (!text.trim()) return;
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: { dark: '#ffffff', light: '#0a0a1a' },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl('');
    }
  }, [text, size]);

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrDataUrl;
    link.click();
  };

  const copyQR = async () => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    } catch {
      // Fallback: open in new tab
      window.open(qrDataUrl, '_blank');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center">
            <QrCode size={20} className="text-[#6bcb77]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">二维码生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">输入文本或链接生成高清二维码，支持下载</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-2 ml-1">输入内容</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入网址、文本或任意内容..."
            aria-label="输入二维码内容"
            className="tool-area w-full h-[200px] p-5 text-white text-sm leading-relaxed resize-none outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333]"
          />

          {/* Size Options */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-[#a8b2c1] mb-3 ml-1">尺寸大小</label>
            <div className="flex gap-3">
              {[128, 256, 384, 512].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    size === s ? 'bg-[#6bcb77]/15 text-[#6bcb77] border border-[#6bcb77]/30' : 'bg-white/5 text-[#666] border border-transparent hover:bg-white/10'
                  }`}
                >
                  {s}×{s}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateQR}
            disabled={!text.trim()}
            className="btn-primary w-full mt-6 !py-3 !text-base disabled:opacity-30"
          >
            <QrCode size={18} className="inline mr-2" />
            生成二维码
          </button>

          {/* Quick Tips */}
          <div className="mt-6 glass-card p-5">
            <h4 className="font-['Syne'] font-semibold text-sm text-white mb-3">使用提示</h4>
            <ul className="space-y-2 text-xs text-[#666]">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#6bcb77] mt-1.5 flex-shrink-0" />
                支持网址、纯文本、邮箱等多种内容类型
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#6bcb77] mt-1.5 flex-shrink-0" />
                尺寸越大，打印越清晰；推荐256以上用于打印
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#6bcb77] mt-1.5 flex-shrink-0" />
                所有数据仅在浏览器本地处理，不会上传到服务器
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Right: QR Display */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-2 ml-1">预览</label>
          <div className="tool-area p-8 min-h-[400px] flex flex-col items-center justify-center">
            {qrDataUrl ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-block p-4 rounded-2xl bg-white">
                  <img src={qrDataUrl} alt="QR Code" className="block" style={{ width: Math.min(size, 300), height: Math.min(size, 300) }} />
                </div>
                <p className="mt-4 text-xs text-[#555]">{size}×{size} px</p>

                <div className="flex gap-3 mt-6 justify-center">
                  <button onClick={downloadQR} className="btn-primary">
                    <Download size={15} className="inline mr-1.5" /> 下载PNG
                  </button>
                  <button onClick={copyQR} className="btn-secondary">
                    <Copy size={15} className="inline mr-1.5" /> 复制图片
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  <QrCode size={40} className="text-[#333]" />
                </div>
                <p className="text-sm text-[#555]">输入内容后点击生成二维码</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </div>
    </div>
  );
}
