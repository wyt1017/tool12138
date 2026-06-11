# 卡通小熊鼠标光标设计文档

## 概述

为在线工具网站添加可爱萌系风格的卡通小熊鼠标光标，增强用户体验的趣味性和互动感。

## 功能需求

### 1. 光标外观
- **角色形象**：可爱的小熊
  - 圆润的身体轮廓
  - 棕色主体配色
  - 粉色腮红
  - 可爱的表情（默认开心笑脸）
  - 尺寸约 32x32 像素

### 2. 交互效果
- **移动动画**：小熊跟随鼠标移动时有轻微摇摆效果（左右晃动）
- **点击特效**：点击时小熊闭眼/眨眼，身体轻微缩放
- **悬停反馈**：悬停在可点击元素（链接、按钮）上时，小熊表情变为期待/兴奋状态

## 技术方案

### 实现方式
采用 React 组件 + Framer Motion 方案：
- 创建 `CustomCursor` 组件，监听鼠标位置
- 使用 Framer Motion 实现平滑跟随和动画效果
- 在 Layout 组件中全局引入
- 通过 CSS 隐藏原生光标

### 文件结构
```
src/
  components/
    CustomCursor.tsx    # 自定义光标组件
  components/layout/
    Layout.tsx          # 引入光标组件
  index.css             # 隐藏原生光标的 CSS
```

### 组件设计

#### CustomCursor 组件
```typescript
interface CursorState {
  position: { x: number; y: number }
  isClicking: boolean
  isHovering: boolean
  isHidden: boolean
}
```

**功能**：
1. 监听 `mousemove` 获取鼠标位置
2. 监听 `mousedown/mouseup` 检测点击状态
3. 监测悬停在可点击元素上（通过检测目标元素的 `cursor: pointer` 样式或特定标签）
4. 在触摸设备或鼠标离开窗口时隐藏光标

**动画效果**：
- 平滑跟随：使用 Framer Motion 的 `animate` 属性实现延迟跟随效果
- 摇摆动画：移动时添加轻微的旋转动画
- 点击动画：缩放 + 眼睛变化
- 悬停动画：表情变化 + 轻微放大

### SVG 小熊设计
使用 SVG 绘制小熊形象，包含以下元素：
- 身体：圆形棕色主体
- 耳朵：两个半圆形耳朵
- 脸部：眼睛、鼻子、腮红
- 表情变化：通过改变眼睛和嘴巴的形状实现

**表情状态**：
- 默认：开心笑脸（弯弯的眼睛、微笑嘴巴）
- 点击：闭眼 + 缩小嘴巴
- 悬停：期待表情（睁大眼睛、张开嘴巴）

### CSS 配置
```css
/* 隐藏原生光标 */
body {
  cursor: none !important;
}

/* 可点击元素保持 pointer 样式供检测 */
a, button, [role="button"], input, textarea, select {
  cursor: pointer !important;
}
```

## 兼容性考虑

1. **触摸设备**：检测触摸支持，在触摸设备上隐藏自定义光标，显示原生光标
2. **鼠标离开窗口**：监听 `mouseleave` 事件，隐藏光标
3. **性能优化**：使用 `requestAnimationFrame` 或 Framer Motion 的优化机制
4. **可访问性**：确保光标位置准确，不影响用户操作

## 实现步骤

1. 创建 `CustomCursor.tsx` 组件
2. 绘制小熊 SVG 图形
3. 实现鼠标位置跟踪
4. 实现三种状态动画（默认、点击、悬停）
5. 在 `Layout.tsx` 中引入组件
6. 在 `index.css` 中添加隐藏原生光标的样式
7. 测试各种交互场景

## 测试要点

- 鼠标移动流畅性
- 点击动画响应速度
- 悬停检测准确性
- 触摸设备兼容性
- 不同浏览器兼容性