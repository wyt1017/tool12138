import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImageUp, Copy, Trash2, FileImage } from 'lucide-react';

export default function ImageToBase64() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [base64Output, setBase64Output] = useState<string>('');
  const [formatMode, setFormatMode] = useState<'full' | 'pure'>('full');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64Output(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const displayOutput = formatMode === 'full' ? base64Output : base64Output.split(',')[1] || '';

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const clearAll = () => {
    setImageFile(null);
    setPreviewUrl('');
    setBase64Output('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#f472b6]/15 flex items-center justify-center">
            <ImageUp size={20} className="text-[#f472b6]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">图片转Base64</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">将图片转换为 Base64 编码字符串，支持 JPG/PNG/GIF/WebP</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-2 ml-1">上传图片</label>
          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`tool-area h-[340px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging ? 'border-[#f472b6]/50 bg-[#f472b6]/5' : ''
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDragging ? 'bg-[#f472b6]/20' : 'bg-white/5'}`}>
                <FileImage size={32} className={`${isDragging ? 'text-[#f472b6]' : 'text-[#555]'}`} />
              </div>
              <p className="text-sm text-[#a8b2c1] mb-1">拖拽图片到此处，或点击上传</p>
              <p className="text-xs text-[#555]">支持 JPG / PNG / GIF / WebP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleInputChange}
                aria-label="上传图片"
                className="hidden"
              />
            </div>
          ) : (
            <div className="tool-area p-4 h-[340px] flex items-center justify-center overflow-hidden">
              <img src={previewUrl} alt="预览" className="max-w-full max-h-full rounded-lg object-contain" />
            </div>
          )}
          {imageFile && (
            <div className="mt-3 flex items-center gap-4 text-xs text-[#888] ml-1">
              <span>文件名: {imageFile.name}</span>
              <span>大小: {formatSize(imageFile.size)}</span>
            </div>
          )}
        </motion.div>

        {/* Output Area */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">Base64 输出</label>
            {base64Output && (
              <button onClick={() => navigator.clipboard.writeText(displayOutput)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={displayOutput}
            placeholder="上传图片后，Base64 字符串将显示在这里..."
            aria-label="Base64输出"
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] font-mono placeholder:text-[#333]"
          />
          {base64Output && (
            <div className="mt-3 flex items-center gap-4 text-xs text-[#888] ml-1">
              <span>长度: {displayOutput.length.toLocaleString()} 字符</span>
              {imageFile && <span>原始大小: {formatSize(imageFile.size)}</span>}
            </div>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-3 mt-6"
      >
        {/* Format Toggle */}
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => setFormatMode('full')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              formatMode === 'full' ? 'bg-[#f472b6]/15 text-[#f472b6]' : 'bg-white/5 text-[#666]'
            }`}
          >
            完整 Data URL
          </button>
          <button
            onClick={() => setFormatMode('pure')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              formatMode === 'pure' ? 'bg-[#f472b6]/15 text-[#f472b6]' : 'bg-white/5 text-[#666]'
            }`}
          >
            纯 Base64
          </button>
        </div>

        <button onClick={clearAll} disabled={!imageFile} className="btn-secondary disabled:opacity-30">
          <Trash2 size={15} className="inline mr-1.5" /> 清除重新上传
        </button>
      </motion.div>
    </div>
  );
}
