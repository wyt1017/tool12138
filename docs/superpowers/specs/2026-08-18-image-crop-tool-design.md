# 图片裁剪工具（Image Crop）设计

日期：2026-08-18

## 目标

在瓜崎工具站点新增「图片裁剪」工具：上传图片后在浏览器内拖拽选区、锁定比例裁剪，并导出 PNG / JPEG / WebP。所有处理本地完成，不上传服务器。

## 需求（已确认）

1. 交互范围：选区整体移动 + 8 向缩放手柄 + 比例锁定。
2. 输出格式：PNG / JPEG / WebP 可选，JPEG / WebP 支持质量调节。
3. 比例预设：自由、1:1、4:3、16:9、3:4、9:16。
4. 实现架构：单文件组件 + 原生 Pointer 事件，零新增依赖。

## 文件接线

- 新建 `src/pages/tools/ImageCrop.tsx`（单文件，遵循现有图片工具页面模式）。
- `src/data/tools.ts` 新增条目：
  - `id: 'image-crop'`
  - `name: '图片裁剪'`
  - `category: 'design'`
  - `icon: 'Crop'`（lucide-react 已有）
  - `path: '/tools/image-crop'`
  - `tags: ['裁剪', '图片', 'Crop', '比例', '尺寸']`
- `src/App.tsx` 新增 `lazy` import 与 `/tools/image-crop` 路由（置于第 7 批路由之后）。

## 数据流与状态

- `image`：`ImageBitmap | null`。用 `createImageBitmap(file, { imageOrientation: 'from-image' })` 加载，自动校正手机照片 EXIF 旋转；失败时 fallback 到 `new Image()` + object URL。
- `displayRect`：容器显示尺寸（按容器宽度等比缩放原图，保持原始宽高比）。
- `crop`：`{ x, y, w, h }`，存**显示坐标系**浮点数。裁剪时乘 `scale = 原图像素宽 / 显示宽` 映射回原始像素坐标。
- 初始选区：居中的图片 80% 区域。

## 选区交互（原生 Pointer 事件）

- 结构：容器内 `<canvas>` 绘制图片；绝对定位的选区框；选区外半透明遮罩（四块 div）；8 个缩放手柄。
- 移动：选区内部 `pointerdown` → 在 window 上监听 `pointermove` 拖动，位置 clamp 在图片边界内。
- 8 向缩放：边 / 角手柄按各自方向调整宽高；最小选区 20px。
- 比例锁定：`ratio !== 'free'` 时，缩放始终保持比例；此时隐藏 4 个边手柄，仅保留 4 个角手柄用于等比缩放。切换预设时，选区在图片内居中并适配该比例取最大可用尺寸。
- `pointerup` / `pointercancel` 结束交互；使用 `setPointerCapture` 保证拖动不丢失。

## 比例预设

按钮组：`自由`、`1:1`、`4:3`、`16:9`、`3:4`、`9:16`。

## 裁剪与导出

- 输出格式：`PNG / JPEG / WebP` 按钮组；JPEG / WebP 显示质量滑块（0.1–1，默认 0.92）。
- 裁剪：离屏 canvas，`drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)`（原始像素坐标），`toBlob` 导出。
- 结果区：裁剪后预览 + 输出尺寸 + 文件大小。
- 下载：`a.download = 原名_cropped.扩展名`。
- 「重置选区」按钮：恢复初始 80% 居中选区。

## 错误处理

- `accept="image/*"` + `type.startsWith('image/')` 双重校验，非图片文件拒绝。
- 图片加载失败、`toBlob` 返回 null 时展示提示文案。

## 样式与测试

- 沿用 `glass-card` / `btn-primary` / `tool-area`；accent 色用 design 分类黄 `#ffd369`，与现有图片工具一致。
- 验证：`npm run check`（tsc）+ `npm run build` + 手动裁剪测试。

## 非目标（YAGNI）

- 不做旋转 / 翻转 / 放大镜 / 网格参考线。
- 不做裁剪历史记录与多图批处理。
- 不做自定义比例输入。
