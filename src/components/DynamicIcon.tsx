import { icons, LucideIcon, CircleHelp } from 'lucide-react';

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

// 使用 lucide-react 提供的 icons 对象进行动态查找
// 这样可以避免导入所有图标，只加载实际使用的图标
export default function DynamicIcon({ name, size = 24, className }: DynamicIconProps) {
  const IconComponent = (icons as Record<string, LucideIcon>)[name];
  
  if (!IconComponent) {
    // 如果图标不存在，返回一个默认图标
    return <CircleHelp size={size} className={className} />;
  }
  
  return <IconComponent size={size} className={className} />;
}