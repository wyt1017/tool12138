import DynamicIcon from './DynamicIcon';

interface IconBadgeProps {
  name: string;
  size?: number;
  className?: string;
  catColor?: string;
  catBg?: string;
}

// 工具图标霓虹底座：渐变底 + 内描边 + 图标辉光，hover 外圈发光
export default function IconBadge({
  name,
  size = 22,
  className = '',
  catColor = '#00d9ff',
  catBg = 'rgba(0, 217, 255, 0.1)',
}: IconBadgeProps) {
  return (
    <span
      className={`neon-badge icon-neon inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        ['--cat-color' as string]: catColor,
        background: `linear-gradient(135deg, ${catBg}, ${catColor}22)`,
        color: catColor,
      }}
    >
      <DynamicIcon name={name} size={size} />
    </span>
  );
}
