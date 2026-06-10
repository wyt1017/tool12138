import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImageDown, Upload, Download, Trash2, ImageIcon, Loader2 } from 'lucide-react';

type ImageFormat = 'jpeg' | 'webp' | 'png';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function compressImage(
  file: File,
  quality: number,
  maxWidth: number,
  maxHeight: number,
  format: ImageFormat
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (w > maxWidth || h > maxHeight) {
        const ratioW = maxWidth / w;
        const ratioH = maxHeight / h;
        const ratio = Math.min(ratioW, ratioH);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const mimeType = `image/${format}`;
      const q = format === 'png' ? undefined : quality;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width: w, height: h });
          } else {
            reject(new Error('Compression failed'));
          }
        },
        mimeType,
        q
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' },
];

export default function ImageCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string>('');
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [compressing, setCompressing] = useState(false);
  const [resultBlobUrl, setResultBlobUrl] = useState<string>('');
  const [result, setResult] = useState<{ blob: Blob; width: number; height: number; originalSize: number; originalWidth: number; originalHeight: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 清理 blob URL 防止内存泄漏
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
    };
  }, [originalPreview]);

  useEffect(() => {
    return () => {
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
    };
  }, [resultBlobUrl]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
      setResultBlobUrl('');
      setFile(droppedFile);
      setOriginalPreview(URL.createObjectURL(droppedFile));
      setResult(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
      setResultBlobUrl('');
      setFile(selectedFile);
      setOriginalPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setCompressing(true);
    try {
      // Get original dimensions
      const origImg = new Image();
      await new Promise<void>((resolve, reject) => {
        origImg.onload = () => resolve();
        origImg.onerror = () => reject();
        origImg.src = URL.createObjectURL(file);
      });

      const compressed = await compressImage(file, quality, maxWidth, maxHeight, format);
      // 清理旧的 blob URL
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
      const url = URL.createObjectURL(compressed.blob);
      setResultBlobUrl(url);
      setResult({
        ...compressed,
        originalSize: file.size,
        originalWidth: origImg.width,
        originalHeight: origImg.height,
      });
    } catch {
      // 压缩失败， silently handled
    }
    setCompressing(false);
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace(/\.[^.]+$/, '')}_compressed.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compressionRate = result ? ((1 - result.blob.size / result.originalSize) * 100).toFixed(1) : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffd369]/15 flex items-center justify-center">
            <ImageDown size={20} className="text-[#ffd369]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">图片压缩</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">使用 Canvas API 在浏览器中压缩图片，支持 JPEG / WebP / PNG</p>
      </motion.div>

      {/* Upload Area */}
      {!file ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="glass-card p-12 cursor-pointer border-2 border-dashed border-white/10 hover:border-[#ffd369]/40 transition-all mb-6"
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} aria-label="选择图片文件" className="sr-only" />
          <Upload size={48} className="mx-auto text-[#333] mb-4" />
          <p className="text-[#666] text-sm text-center">拖拽图片到此处，或点击选择图片文件</p>
          <p className="text-[#444] text-xs text-center mt-2">支持 JPG、PNG、WebP 等常见格式</p>
        </motion.div>
      ) : (
        <>
          {/* Settings Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ffd369]/15 flex items-center justify-center overflow-hidden">
                  {originalPreview && <img src={originalPreview} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-[#666]">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setOriginalPreview('');
                  setResult(null);
                }}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={18} className="text-[#666] hover:text-red-400" />
              </button>
            </div>

            {/* Quality Slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#a8b2c1]">压缩质量</label>
                <span className="text-sm font-mono font-semibold text-[#ffd369]">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                aria-label="压缩质量"
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffd369]"
              />
            </div>

            {/* Dimensions & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs text-[#666] mb-1.5 ml-1">最大宽度</label>
                <input
                  type="number"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(Math.max(1, parseInt(e.target.value) || 1920))}
                  aria-label="最大宽度"
                  className="tool-area w-full py-2 px-3 text-white text-sm outline-none focus:border-[#ffd369]/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1.5 ml-1">最大高度</label>
                <input
                  type="number"
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(Math.max(1, parseInt(e.target.value) || 1080))}
                  aria-label="最大高度"
                  className="tool-area w-full py-2 px-3 text-white text-sm outline-none focus:border-[#ffd369]/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1.5 ml-1">输出格式</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ImageFormat)}
                  aria-label="输出格式"
                  className="tool-area w-full py-2 px-3 text-white text-sm outline-none bg-transparent focus:border-[#ffd369]/30 transition-colors"
                >
                  {FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#111]">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compress Button */}
            <button onClick={handleCompress} disabled={compressing} className="btn-primary w-full sm:w-auto">
              {compressing ? (
                <>
                  <Loader2 size={16} className="inline mr-2 animate-spin" /> 压缩中...
                </>
              ) : (
                <>
                  <ImageDown size={16} className="inline mr-2" /> 开始压缩
                </>
              )}
            </button>
          </motion.div>

          {/* Result Area */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {/* Preview Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon size={14} className="text-[#666]" />
                    <span className="text-xs font-medium text-[#a8b2c1]">原图预览</span>
                    <span className="ml-auto text-xs text-[#555]">{result.originalWidth} × {result.originalHeight}</span>
                  </div>
                  <div className="rounded-lg overflow-hidden bg-black/20 flex items-center justify-center min-h-[200px]">
                    {originalPreview && <img src={originalPreview} alt="原图" className="max-w-full max-h-[300px] object-contain" />}
                  </div>
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon size={14} className="text-[#ffd369]" />
                    <span className="text-xs font-medium text-[#a8b2c1]">压缩后预览</span>
                    <span className="ml-auto text-xs text-[#555]">{result.width} × {result.height}</span>
                  </div>
                  <div className="rounded-lg overflow-hidden bg-black/20 flex items-center justify-center min-h-[200px]">
                    <img src={resultBlobUrl} alt="压缩后" className="max-w-full max-h-[300px] object-contain" />
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}
              <div className="glass-card p-5 mb-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <ImageDown size={16} className="text-[#ffd369]" />
                  压缩对比信息
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/[0.03] rounded-xl p-4">
                    <div className="text-xs text-[#666] mb-1">原始大小</div>
                    <div className="font-['Syne'] font-bold text-lg text-white">{formatFileSize(result.originalSize)}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4">
                    <div className="text-xs text-[#666] mb-1">压缩后大小</div>
                    <div className="font-['Syne'] font-bold text-lg text-[#ffd369]">{formatFileSize(result.blob.size)}</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4">
                    <div className="text-xs text-[#666] mb-1">压缩率</div>
                    <div className={`font-['Syne'] font-bold text-lg ${parseFloat(compressionRate!) > 0 ? 'text-emerald-400' : parseFloat(compressionRate!) < 0 ? 'text-red-400' : 'text-[#888]'}`}>
                      {compressionRate}% {parseFloat(compressionRate!) > 0 ? '↓' : parseFloat(compressionRate!) < 0 ? '↑' : ''}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4">
                    <div className="text-xs text-[#666] mb-1">输出格式</div>
                    <div className="font-['Syne'] font-bold text-lg text-white uppercase">{format}</div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button onClick={handleDownload} className="btn-primary w-full sm:w-auto">
                <Download size={16} className="inline mr-2" /> 下载压缩图片 ({formatFileSize(result.blob.size)})
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
