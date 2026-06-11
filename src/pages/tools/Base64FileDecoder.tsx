import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Download } from 'lucide-react';

export default function Base64FileDecoder() {
  const color = '#6bcb77';
  const cyan = '#00d9ff';
  const green = '#6bcb77';

  const [input, setInput] = useState('');
  const [result, setResult] = useState<{
    mimeType: string;
    filename: string;
    size: number;
    blobUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 清理之前的 blob URL，避免内存泄漏
  const prevBlobUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
    };
  }, []);

  // 通过文件魔数（magic bytes）检测文件类型
  const detectMimeType = (bytes: Uint8Array): string => {
    if (bytes.length < 4) return 'application/octet-stream';

    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }
    // GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return 'image/gif';
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      if (bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return 'image/webp';
      }
    }
    // PDF: 25 50 44 46 (%PDF)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return 'application/pdf';
    }
    // ZIP: 50 4B 03 04 (also works for DOCX, XLSX, etc.)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return 'application/zip';
    }
    // RAR: 52 61 72 21
    if (bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21) {
      return 'application/x-rar-compressed';
    }
    // 7Z: 37 7A BC AF
    if (bytes[0] === 0x37 && bytes[1] === 0x7A && bytes[2] === 0xBC && bytes[3] === 0xAF) {
      return 'application/x-7z-compressed';
    }
    // MP3: 49 44 33 (ID3) or FF FB/FA/F3/F2
    if ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
        (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0)) {
      return 'audio/mpeg';
    }
    // MP4/MOV: various signatures
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return 'video/mp4';
    }

    return 'application/octet-stream';
  };

  const decode = () => {
    setError(null);
    if (!input.trim()) {
      setResult(null);
      return;
    }

    try {
      // 支持 data:xxx;base64,xxx 格式
      let base64Data = input;
      let mimeType: string | null = null;

      if (input.startsWith('data:')) {
        const match = input.match(/^data:([^;]+);base64,(.+)$/s);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      // 清理空白字符（换行、空格、制表符等）
      base64Data = base64Data.replace(/[\s\r\n\t]/g, '');

      if (!base64Data) {
        setError('解码失败：未找到 Base64 数据');
        return;
      }

      // 验证 Base64 字符集
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        setError('解码失败：包含非 Base64 字符。请确保输入中不包含空格或换行符。');
        return;
      }

      // 补齐填充（base64 长度必须是 4 的倍数）
      while (base64Data.length % 4 !== 0) {
        base64Data += '=';
      }

      // 解码 Base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 如果没有 data: 前缀，通过魔数自动检测文件类型
      const finalMimeType = mimeType || detectMimeType(bytes);

      // 生成文件名
      let filename = 'decoded_file';
      if (finalMimeType.startsWith('image/')) {
        const ext = finalMimeType.split('/')[1] || 'png';
        filename = `decoded_image.${ext}`;
      } else if (finalMimeType === 'application/pdf') {
        filename = 'decoded_document.pdf';
      } else if (finalMimeType === 'application/json') {
        filename = 'decoded_data.json';
      } else if (finalMimeType.startsWith('text/')) {
        filename = 'decoded_text.txt';
      } else if (finalMimeType === 'application/zip') {
        filename = 'decoded_file.zip';
      } else if (finalMimeType === 'application/x-rar-compressed') {
        filename = 'decoded_file.rar';
      } else if (finalMimeType === 'application/x-7z-compressed') {
        filename = 'decoded_file.7z';
      } else if (finalMimeType === 'audio/mpeg') {
        filename = 'decoded_audio.mp3';
      } else if (finalMimeType === 'video/mp4') {
        filename = 'decoded_video.mp4';
      }

      // 创建 Blob
      const blob = new Blob([bytes], { type: finalMimeType });
      const blobUrl = URL.createObjectURL(blob);

      // 释放之前的 blob URL，避免内存泄漏
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
      prevBlobUrlRef.current = blobUrl;

      setResult({
        mimeType: finalMimeType,
        filename,
        size: bytes.length,
        blobUrl,
      });
    } catch {
      setError('解码失败：无效的 Base64 字符串。请检查输入是否正确。');
      setResult(null);
    }
  };

  const download = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.download = result.filename;
    link.href = result.blobUrl;
    link.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileDown size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">Base64文件还原工具</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>将Base64字符串解码并还原为原始文件，提供下载</p>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
        <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">Base64字符串</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴Base64字符串，支持 data:image/png;base64,... 格式"
          aria-label="Base64字符串"
          className="tool-area w-full h-[200px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333] font-mono"
        />
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-6 border border-red-500/30">
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 mb-6">
        <button onClick={decode} disabled={!input} className="btn-primary disabled:opacity-30">
          解码还原
        </button>
        <button onClick={() => { setInput(''); setResult(null); setError(null); if (prevBlobUrlRef.current) { URL.revokeObjectURL(prevBlobUrlRef.current); prevBlobUrlRef.current = null; } }} className="btn-secondary">
          清空
        </button>
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">解码结果</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>文件类型</div>
              <div style={{ fontSize: 14, fontWeight: 500, color }}>{result.mimeType}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>文件名</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{result.filename}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>文件大小</div>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'monospace', color: cyan }}>{formatSize(result.size)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>状态</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: green }}>✓ 已还原</div>
            </div>
          </div>

          {/* Preview for images */}
          {result.mimeType.startsWith('image/') && (
            <div className="mb-6">
              <label className="text-xs text-[#666] block mb-2">图片预览</label>
              <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                <img src={result.blobUrl} alt="Decoded Image" className="max-w-full max-h-[300px]" />
              </div>
            </div>
          )}

          {/* Download */}
          <button onClick={download} className="btn-primary w-full">
            <Download size={15} className="inline mr-2" /> 下载文件
          </button>
        </motion.div>
      )}

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 mt-6">
        <p className="text-xs text-[#666]">
          <strong className="text-[#a8b2c1]">说明：</strong>
          支持两种格式：1) 带 data: 前缀的完整格式（如 data:image/png;base64,iVBORw0KGgo...）；2) 纯 Base64 字符串。
          解码后自动识别文件类型并提供下载。
        </p>
      </motion.div>
    </div>
  );
}