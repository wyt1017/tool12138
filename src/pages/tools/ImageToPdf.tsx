import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  FileDown,
  FileImage,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

type PageSize = 'a4' | 'letter' | 'fit';
type Orientation = 'auto' | 'portrait' | 'landscape';
type LayoutMode = 'paged' | 'stitched';
type OutputFormat = 'jpeg' | 'png';

interface PdfImage {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  width: number;
  height: number;
}

/** A4 与 Letter 的物理尺寸（毫米） */
const PAGE_DIMENSIONS = {
  a4: [210, 297],
  letter: [215.9, 279.4],
} as const;

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']);
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MAX_FILES = 30;
/** 写进 PDF 前的最长边上限，避免超大原图把 canvas 撑爆并让 PDF 体积失控 */
const MAX_CANVAS_EDGE = 3000;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${units[i]}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解码失败'));
    img.src = url;
  });
}

/** 重绘到 canvas 上以便按格式导出，同时限制最长边 */
function canvasFromImage(img: HTMLImageElement, format: OutputFormat): HTMLCanvasElement {
  const scale = Math.min(1, MAX_CANVAS_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持 Canvas');
  // JPEG 无透明通道，先铺白底避免透明区域变黑
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** 计算单页尺寸（毫米）；fit 模式返回像素尺寸，因此调用方需保持单位一致 */
function resolvePageSize(size: PageSize, orientation: Orientation, imgW: number, imgH: number): [number, number] {
  if (size === 'fit') return [imgW, imgH];
  const [shortEdge, longEdge] = PAGE_DIMENSIONS[size];
  const landscape = orientation === 'landscape' || (orientation === 'auto' && imgW > imgH);
  return landscape ? [longEdge, shortEdge] : [shortEdge, longEdge];
}

export default function ImageToPdf() {
  const [images, setImages] = useState<PdfImage[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('paged');
  const [margin, setMargin] = useState(0);
  const [format, setFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(0.92);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; size: number; pages: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 原地维护 URL 列表，便于卸载时一次性回收
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const releasePreviews = () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
  };

  const addFiles = async (fileList: FileList | null, append: boolean) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const rejected = files.find(
      (file) => !SUPPORTED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE
    );
    if (rejected) {
      setError(
        !SUPPORTED_TYPES.has(rejected.type)
          ? `「${rejected.name}」格式不支持，请上传 JPG / PNG / WebP / GIF / BMP`
          : `「${rejected.name}」超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
      return;
    }

    setError('');
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);

    if (!append) {
      releasePreviews();
    }
    const room = MAX_FILES - (append ? images.length : 0);
    if (room <= 0) {
      setError(`最多 ${MAX_FILES} 张图片`);
      return;
    }

    const accepted = files.slice(0, room);
    if (files.length > room) {
      setError(`最多 ${MAX_FILES} 张图片，已忽略超出的 ${files.length - room} 张`);
    }

    let failed = false;
    const loaded = await Promise.all(
      accepted.map(async (file, index) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.push(previewUrl);
        try {
          const img = await loadImage(previewUrl);
          return {
            id: `${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            previewUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          } satisfies PdfImage;
        } catch {
          failed = true;
          URL.revokeObjectURL(previewUrl);
          previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== previewUrl);
          return null;
        }
      })
    );

    const valid = loaded.filter((item): item is PdfImage => item !== null);
    if (failed) setError('部分图片读取失败，已跳过');
    setImages((prev) => (append ? [...prev, ...valid] : valid));
  };

  const move = (index: number, delta: number) => {
    setImages((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeAt = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAll = () => {
    releasePreviews();
    setImages([]);
    setError('');
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setGenerating(true);
    setError('');
    setProgress(0);

    try {
      // fit 模式页面尺寸跟随图片，用 px 作单位；其余用 mm
      const docUnit = pageSize === 'fit' ? 'px' : 'mm';

      // stitched 模式整份文档共用同一页面尺寸（方向自动时固定纵向），避免混排横竖页
      const [pageW, pageH] = resolvePageSize(
        pageSize,
        layoutMode === 'stitched' && orientation === 'auto' ? 'portrait' : orientation,
        images[0].width,
        images[0].height
      );
      const pageOrientation = pageW > pageH ? 'landscape' : 'portrait';

      // 构造函数已生成第1 页，两种模式都直接复用它，无需额外 addPage
      const doc = new jsPDF({ unit: docUnit, format: [pageW, pageH], compress: true, orientation: pageOrientation });
      const imageFormat = format === 'jpeg' ? 'JPEG' : 'PNG';
      let cursorY = margin;

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const img = await loadImage(item.previewUrl);
        const canvas = canvasFromImage(img, format);
        const dataUrl = canvas.toDataURL(`image/${format}`, quality);

        // 每页可用区域（当前页尺寸在fit 模式下可能随图片变化，故每轮重取）
        const curW = doc.internal.pageSize.getWidth();
        const curH = doc.internal.pageSize.getHeight();
        const availW = curW - margin * 2;
        const availH = curH - margin * 2;

        if (layoutMode === 'paged') {
          if (i > 0) {
            const [pw, ph] = resolvePageSize(pageSize, orientation, item.width, item.height);
            doc.addPage([pw, ph], pw > ph ? 'landscape' : 'portrait');
          }
          const pw = doc.internal.pageSize.getWidth();
          const ph = doc.internal.pageSize.getHeight();
          const boxW = pw - margin * 2;
          const boxH = ph - margin * 2;
          const scale = Math.min(boxW / item.width, boxH / item.height);
          doc.addImage(
            dataUrl,
            imageFormat,
            margin + (boxW - item.width * scale) / 2,
            margin + (boxH - item.height * scale) / 2,
            item.width * scale,
            item.height * scale,
            undefined,
            'FAST'
          );
        } else {
          // 高度按可用区域等比缩放，保证单张恰好落在一页内
          const scale = Math.min(availW / item.width, availH / item.height);
          const drawW = item.width * scale;
          const drawH = item.height * scale;

          if (i > 0 || cursorY + drawH > curH - margin) {
            doc.addPage([pageW, pageH], pageOrientation);
            cursorY = margin;
          }
          doc.addImage(dataUrl, imageFormat, margin, cursorY, drawW, drawH, undefined, 'FAST');
          cursorY += drawH;
        }

        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, pages: doc.getNumberOfPages() });
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成 PDF 失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `images-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
  };

  const totalSize = images.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#f472b6]/15 flex items-center justify-center">
            <FileDown size={20} className="text-[#f472b6]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">图片转 PDF</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">
          多张图片合并为一个 PDF，支持自定义页面尺寸、方向与边距，全程在浏览器本地完成
        </p>
      </motion.div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDrop={(e) => {
            e.preventDefault();
            void addFiles(e.dataTransfer.files, images.length > 0);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="glass-card p-12 cursor-pointer border-2 border-dashed border-[var(--border-color)] hover:border-[#f472b6]/40 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
            multiple
            onChange={(e) => void addFiles(e.target.files, false)}
            aria-label="选择图片文件"
            className="sr-only"
          />
          <Upload size={48} className="mx-auto text-[var(--text-faint)] mb-4" />
          <p className="text-[var(--text-faint)] text-sm text-center">拖拽图片到此处，或点击选择文件</p>
          <p className="text-[var(--text-faint)] text-xs text-center mt-2">
            支持 JPG / PNG / WebP / GIF / BMP，单张最大 {MAX_FILE_SIZE / 1024 / 1024}MB，最多 {MAX_FILES} 张
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--text-secondary)]">
                已选 <span className="text-[#f472b6] font-['Syne'] font-bold">{images.length}</span> 张 ·{' '}
                {formatFileSize(totalSize)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary !px-3 !py-1.5 text-xs"
                >
                  <Plus size={14} className="inline mr-1" />
                  继续添加
                </button>
                <button onClick={clearAll} className="btn-secondary !px-3 !py-1.5 text-xs">
                  <Trash2 size={14} className="inline mr-1" />
                  清空
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
              multiple
              onChange={(e) => void addFiles(e.target.files, true)}
              aria-label="追加图片文件"
              className="sr-only"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="glass-card p-3 relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-black/20 mb-2 flex items-center justify-center">
                    <img src={item.previewUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <p className="text-xs text-[var(--text-primary)] truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
                    {item.width} × {item.height} · {formatFileSize(item.size)}
                  </p>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white">
                    {index + 1}
                  </span>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="上移"
                      className="p-1 rounded bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 disabled:hover:bg-black/60"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label="下移"
                      className="p-1 rounded bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 disabled:hover:bg-black/60"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      onClick={() => removeAt(index)}
                      aria-label="移除"
                      className="p-1 rounded bg-black/60 text-white hover:bg-red-500/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs text-[var(--text-faint)] mb-1.5 ml-1">页面尺寸</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PageSize)}
                  aria-label="页面尺寸"
                  className="tool-area w-full py-2 px-3 text-[var(--text-primary)] text-sm outline-none bg-transparent focus:border-[#f472b6]/30 transition-colors"
                >
                  <option value="a4" className="bg-[#111]">A4 (210 × 297mm)</option>
                  <option value="letter" className="bg-[#111]">Letter (216 × 279mm)</option>
                  <option value="fit" className="bg-[#111]">适应图片尺寸</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)] mb-1.5 ml-1">页面方向</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as Orientation)}
                  aria-label="页面方向"
                  className="tool-area w-full py-2 px-3 text-[var(--text-primary)] text-sm outline-none bg-transparent focus:border-[#f472b6]/30 transition-colors"
                >
                  <option value="auto" className="bg-[#111]">自动（按图片长宽）</option>
                  <option value="portrait" className="bg-[#111]">纵向</option>
                  <option value="landscape" className="bg-[#111]">横向</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)] mb-1.5 ml-1">图片排布</label>
                <select
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
                  aria-label="图片排布"
                  className="tool-area w-full py-2 px-3 text-[var(--text-primary)] text-sm outline-none bg-transparent focus:border-[#f472b6]/30 transition-colors"
                >
                  <option value="paged" className="bg-[#111]">每图一页</option>
                  <option value="stitched" className="bg-[#111]">纵向连续排版</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)] mb-1.5 ml-1">输出格式</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  aria-label="输出格式"
                  className="tool-area w-full py-2 px-3 text-[var(--text-primary)] text-sm outline-none bg-transparent focus:border-[#f472b6]/30 transition-colors"
                >
                  <option value="jpeg" className="bg-[#111]">JPEG（体积小）</option>
                  <option value="png" className="bg-[#111]">PNG（无损）</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)] mb-1.5 ml-1">
                  页面边距 {margin} {pageSize === 'fit' ? 'px' : 'mm'}
                </label>
                <input
                  type="range"
                  min="0"
                  max={pageSize === 'fit' ? 120 : 30}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  aria-label="页面边距"
                  className="w-full h-1.5 mt-3 bg-[var(--bg-secondary)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f472b6]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)] mb-1.5 ml-1">
                  图片质量 {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="1"
                  step="0.02"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  aria-label="图片质量"
                  className="w-full h-1.5 mt-3 bg-[var(--bg-secondary)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f472b6]"
                />
              </div>
            </div>

            <button onClick={() => void handleGenerate()} disabled={generating} className="btn-primary w-full sm:w-auto">
              {generating ? (
                <>
                  <Loader2 size={16} className="inline mr-2 animate-spin" /> 生成中 {progress}%
                </>
              ) : (
                <>
                  <FileDown size={16} className="inline mr-2" /> 生成 PDF
                </>
              )}
            </button>
          </motion.div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <FileImage size={16} className="text-[#f472b6]" />
                生成结果
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                  <div className="text-xs text-[var(--text-faint)] mb-1">页数</div>
                  <div className="font-['Syne'] font-bold text-lg text-[var(--text-primary)]">{result.pages}</div>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                  <div className="text-xs text-[var(--text-faint)] mb-1">文件大小</div>
                  <div className="font-['Syne'] font-bold text-lg text-[var(--text-primary)]">
                    {formatFileSize(result.size)}
                  </div>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                  <div className="text-xs text-[var(--text-faint)] mb-1">来源图片</div>
                  <div className="font-['Syne'] font-bold text-lg text-[var(--text-primary)]">{images.length}</div>
                </div>
              </div>
              <button onClick={handleDownload} className="btn-primary w-full sm:w-auto">
                <FileDown size={16} className="inline mr-2" /> 下载 PDF
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}