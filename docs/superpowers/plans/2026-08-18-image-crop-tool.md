# 图片裁剪工具（Image Crop）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在瓜崎工具站点新增纯前端「图片裁剪」工具，支持拖拽选区、多比例预设、导出 PNG/JPEG/WebP。

**Architecture:** 单文件 React 组件 `ImageCrop.tsx`，原生 Pointer 事件实现选区移动与 8 向缩放，离屏 canvas 完成裁剪导出；复用现有 `tools.ts` 元数据 + `App.tsx` 路由懒加载模式。零新增依赖。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + framer-motion + lucide-react

**验证方式：** 项目无测试框架（`package.json` 无 test 脚本），每步用 `npm run check`（tsc 类型检查）验证，最后 `npm run build` + 手动验收。

---

## 任务 1：注册工具元数据

**Files:**
- Modify: `src/data/tools.ts`

在 `tools` 数组末尾（`typing-speed-test` 条目之后、`];` 之前）新增一条设计类工具。

- [ ] **Step 1: 添加工具条目**

在 [tools.ts](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/data/tools.ts) 的 `typing-speed-test` 行后插入：

```ts
  { id: 'image-crop', name: '图片裁剪', description: '上传图片拖拽选区裁剪，支持 1:1、4:3、16:9 等多比例预设，导出 PNG/JPEG/WebP', category: 'design', icon: 'Crop', path: '/tools/image-crop', tags: ['裁剪', '图片', 'Crop', '比例', '尺寸'] },
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 通过，无错误。

---

## 任务 2：创建 ImageCrop 组件

**Files:**
- Create: `src/pages/tools/ImageCrop.tsx`

- [ ] **Step 1: 写入完整组件**

创建 [ImageCrop.tsx](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/pages/tools/ImageCrop.tsx)，内容如下：

```tsx
import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Crop as CropIcon, Upload, Download, Trash2, RotateCcw } from 'lucide-react';

type Ratio = 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16';
type OutputFormat = 'png' | 'jpeg' | 'webp';
type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  startCrop: CropRect;
}

interface ResultState {
  url: string;
  blob: Blob;
  width: number;
  height: number;
}

const RATIO_OPTIONS: { value: Ratio; label: string; ratio: number | null }[] = [
  { value: 'free', label: '自由', ratio: null },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '3:4', label: '3:4', ratio: 3 / 4 },
  { value: '9:16', label: '9:16', ratio: 9 / 16 },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
];

const HANDLES: { mode: DragMode; style: CSSProperties; cursor: string }[] = [
  { mode: 'nw', style: { left: -6, top: -6 }, cursor: 'nwse-resize' },
  { mode: 'n', style: { left: '50%', top: -6, transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { mode: 'ne', style: { right: -6, top: -6 }, cursor: 'nesw-resize' },
  { mode: 'e', style: { right: -6, top: '50%', transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { mode: 'se', style: { right: -6, bottom: -6 }, cursor: 'nwse-resize' },
  { mode: 's', style: { left: '50%', bottom: -6, transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { mode: 'sw', style: { left: -6, bottom: -6 }, cursor: 'nesw-resize' },
  { mode: 'w', style: { left: -6, top: '50%', transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
];

const MIN_SIZE = 20;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function initialCrop(imgW: number, imgH: number): CropRect {
  const w = imgW * 0.8;
  const h = imgH * 0.8;
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
}

function fitRatioCrop(imgW: number, imgH: number, ratio: number): CropRect {
  let w = imgW;
  let h = imgH;
  if (imgW / imgH > ratio) {
    w = imgH * ratio;
  } else {
    h = imgW / ratio;
  }
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('图片加载失败'));
        im.src = url;
      });
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function resizeCrop(
  startCrop: CropRect,
  mode: DragMode,
  dx: number,
  dy: number,
  ratio: number | null,
  imgW: number,
  imgH: number
): CropRect {
  if (mode === 'move') {
    return {
      x: clamp(startCrop.x + dx, 0, imgW - startCrop.w),
      y: clamp(startCrop.y + dy, 0, imgH - startCrop.h),
      w: startCrop.w,
      h: startCrop.h,
    };
  }

  let left = startCrop.x;
  let top = startCrop.y;
  let right = startCrop.x + startCrop.w;
  let bottom = startCrop.y + startCrop.h;

  if (mode.includes('w')) left = startCrop.x + dx;
  if (mode.includes('e')) right = right + dx;
  if (mode.includes('n')) top = startCrop.y + dy;
  if (mode.includes('s')) bottom = bottom + dy;

  left = clamp(left, 0, right - MIN_SIZE);
  top = clamp(top, 0, bottom - MIN_SIZE);
  right = clamp(right, left + MIN_SIZE, imgW);
  bottom = clamp(bottom, top + MIN_SIZE, imgH);

  let w = right - left;
  let h = bottom - top;

  if (ratio) {
    if (w / h > ratio) {
      const newW = h * ratio;
      if (mode.includes('w')) {
        left = right - newW;
      } else {
        right = left + newW;
      }
    } else {
      const newH = w / ratio;
      if (mode.includes('n')) {
        top = bottom - newH;
      } else {
        bottom = top + newH;
      }
    }
    w = right - left;
    h = bottom - top;
  }

  return { x: left, y: top, w, h };
}

export default function ImageCrop() {
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState('');
  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [ratio, setRatio] = useState<Ratio>('free');
  const [format, setFormat] = useState<OutputFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // 将图片绘制到显示 canvas（内部保持原始分辨率）
  useEffect(() => {
    if (!image) return;
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(image, 0, 0);
  }, [image]);

  // 按容器宽度等比计算显示尺寸
  useEffect(() => {
    if (!image) return;
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const maxW = el.clientWidth || 400;
      const s = Math.min(1, maxW / image.width);
      setDisplay({
        w: Math.max(1, Math.round(image.width * s)),
        h: Math.max(1, Math.round(image.height * s)),
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [image]);

  // 释放旧的 ImageBitmap
  useEffect(() => {
    return () => {
      image?.close();
    };
  }, [image]);

  // 释放旧的裁剪结果 URL
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const handleFiles = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件（JPG、PNG、WebP 等）');
      return;
    }
    setError('');
    setResult(null);
    loadImageBitmap(file)
      .then((bmp) => {
        setImage(bmp);
        setFileName(file.name);
        setCrop(initialCrop(bmp.width, bmp.height));
        setRatio('free');
      })
      .catch(() => setError('图片加载失败，请换一张图片试试'));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const resetImage = () => {
    setImage(null);
    setFileName('');
    setCrop({ x: 0, y: 0, w: 0, h: 0 });
    setResult(null);
    setError('');
  };

  const selectRatio = (value: Ratio) => {
    setRatio(value);
    if (value !== 'free' && image) {
      const r = RATIO_OPTIONS.find((o) => o.value === value)?.ratio;
      if (r) setCrop(fitRatioCrop(image.width, image.height, r));
    }
  };

  const resetCrop = () => {
    if (!image) return;
    const r = RATIO_OPTIONS.find((o) => o.value === ratio)?.ratio ?? null;
    setCrop(r ? fitRatioCrop(image.width, image.height, r) : initialCrop(image.width, image.height));
  };

  const scale = image && display.w ? display.w / image.width : 1;

  const startDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    if (!image) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } };
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !image) return;
      const r = RATIO_OPTIONS.find((o) => o.value === ratio)?.ratio ?? null;
      const dx = (ev.clientX - d.startX) / scale;
      const dy = (ev.clientY - d.startY) / scale;
      setCrop(resizeCrop(d.startCrop, d.mode, dx, dy, r, image.width, image.height));
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const doCrop = () => {
    if (!image) return;
    const w = Math.round(crop.w);
    const h = Math.round(crop.h);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('当前浏览器不支持 Canvas');
      return;
    }
    ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
    const mime = `image/${format}`;
    const q = format === 'png' ? undefined : quality;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('裁剪失败，请重试');
        return;
      }
      const url = URL.createObjectURL(blob);
      setResult({ url, blob, width: w, height: h });
    }, mime, q);
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${fileName.replace(/\.[^.]+$/, '') || 'image'}_cropped.${format}`;
    a.click();
  };

  const cx = crop.x * scale;
  const cy = crop.y * scale;
  const cw = crop.w * scale;
  const ch = crop.h * scale;
  const visibleHandles = ratio === 'free' ? HANDLES : HANDLES.filter((h) => h.mode.length === 2);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffd369]/15 flex items-center justify-center">
            <CropIcon size={20} className="text-[#ffd369]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">图片裁剪</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">上传图片拖拽选区裁剪，支持多比例预设，导出 PNG / JPEG / WebP</p>
      </motion.div>

      {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

      {/* Upload */}
      {!image ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <label className="glass-card p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
            <Upload size={48} className="text-[#666] mb-4" />
            <span className="text-[#a8b2c1] mb-2">点击或拖拽图片到此处</span>
            <span className="text-xs text-[#666]">支持 JPG、PNG、WebP 等常见格式</span>
            <input type="file" accept="image/*" onChange={handleInputChange} aria-label="上传图片" className="hidden" />
          </label>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crop Area */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <div className="glass-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-sm font-medium text-[#a8b2c1]">裁剪区域</span>
                <div className="flex gap-2">
                  <button onClick={resetCrop} className="btn-secondary !py-1.5 !px-3 text-xs">
                    <RotateCcw size={13} className="inline mr-1" /> 重置选区
                  </button>
                  <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer">
                    <Upload size={13} className="inline mr-1" /> 更换图片
                    <input type="file" accept="image/*" onChange={handleInputChange} aria-label="更换图片" className="hidden" />
                  </label>
                  <button onClick={resetImage} className="btn-secondary !py-1.5 !px-3 text-xs">
                    <Trash2 size={13} className="inline mr-1" /> 移除
                  </button>
                </div>
              </div>

              <div ref={containerRef} className="w-full flex justify-center">
                <div className="relative overflow-hidden" style={{ width: display.w, height: display.h }}>
                  <canvas ref={displayCanvasRef} style={{ width: display.w, height: display.h, display: 'block' }} />
                  <div
                    onPointerDown={startDrag('move')}
                    className="absolute border-2 border-[#ffd369]"
                    style={{
                      left: cx,
                      top: cy,
                      width: cw,
                      height: ch,
                      cursor: 'move',
                      zIndex: 10,
                      touchAction: 'none',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                    }}
                  >
                    {visibleHandles.map((h) => (
                      <div
                        key={h.mode}
                        onPointerDown={startDrag(h.mode)}
                        className="absolute w-3 h-3 bg-white border border-black/30 rounded-full"
                        style={{ ...h.style, cursor: h.cursor, zIndex: 20, touchAction: 'none' }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#666] mt-2">拖拽框体移动选区，拖拽手柄调整大小</p>
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-card p-6">
              <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">裁剪设置</h2>

              {/* Ratio */}
              <div className="mb-4">
                <label className="text-xs text-[#666] block mb-2">比例预设</label>
                <div className="flex flex-wrap gap-2">
                  {RATIO_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => selectRatio(o.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        ratio === o.value
                          ? 'bg-[#ffd369]/15 border-[#ffd369]/50 text-[#ffd369]'
                          : 'bg-white/5 border-white/10 text-[#a8b2c1] hover:bg-white/10'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="mb-4">
                <label className="text-xs text-[#666] block mb-2">输出格式</label>
                <div className="flex gap-2">
                  {FORMAT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setFormat(o.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        format === o.value
                          ? 'bg-[#ffd369]/15 border-[#ffd369]/50 text-[#ffd369]'
                          : 'bg-white/5 border-white/10 text-[#a8b2c1] hover:bg-white/10'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              {format !== 'png' && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[#666]">质量</label>
                    <span className="text-xs font-mono text-[#ffd369]">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    aria-label="输出质量"
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffd369]"
                  />
                </div>
              )}

              {/* Crop Button */}
              <button onClick={doCrop} className="btn-primary w-full">
                <CropIcon size={15} className="inline mr-2" /> 裁剪图片
              </button>

              {/* Result */}
              {result && (
                <div className="mt-5">
                  <div className="rounded-lg overflow-hidden bg-black/20 mb-3">
                    <img src={result.url} alt="裁剪结果" className="max-w-full" />
                  </div>
                  <div className="text-xs text-[#666] mb-3">
                    {result.width} × {result.height} · {formatFileSize(result.blob.size)}
                  </div>
                  <button onClick={download} className="btn-primary w-full">
                    <Download size={15} className="inline mr-2" /> 下载图片
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 通过，无错误。

---

## 任务 3：接入路由

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 添加 lazy import**

在 [App.tsx](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/App.tsx) 第 7 批 import 之后（`TypingSpeedTest` 行后）插入：

```ts
const ImageCrop = lazy(() => import('@/pages/tools/ImageCrop'));
```

- [ ] **Step 2: 添加路由**

在 [App.tsx](file:///d:/TRAE%20SOLO%20CN/瓜崎工具/src/App.tsx) 第 7 批路由之后（`/tools/typing-speed-test` 路由行后）插入：

```tsx
          <Route path="/tools/image-crop" element={<Suspense fallback={<LoadingSpinner />}><ImageCrop /></Suspense>} />
```

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: 通过，无错误。

---

## 任务 4：构建与手动验收

- [ ] **Step 1: 生产构建**

Run: `npm run build`
Expected: 构建成功，产物包含 `ImageCrop` 的独立 chunk。

- [ ] **Step 2: 手动验收清单**

启动 `npm run dev`，访问 `/tools/image-crop`，逐项验证：

1. 首页 / 全部工具页出现「图片裁剪」卡片，图标正常。
2. 上传一张 JPG：选区初始居中，占图片约 80%。
3. 拖拽选区框体：整体移动，不超出图片边界。
4. 自由模式下拖拽 8 个手柄：各方向缩放，最小尺寸 20px。
5. 选择 `1:1` / `16:9` 等预设：选区居中适配比例；此时仅显示 4 个角手柄，拖拽保持比例。
6. 切换输出格式 PNG / JPEG / WebP；JPEG / WebP 出现质量滑块。
7. 点击「裁剪图片」：右侧显示裁剪结果预览、尺寸与文件大小。
8. 点击「下载图片」：下载文件名为 `原名_cropped.扩展名`。
9. 上传非图片文件：出现错误提示。
10. 用手机拍摄的带 EXIF 方向照片验证方向正确。
