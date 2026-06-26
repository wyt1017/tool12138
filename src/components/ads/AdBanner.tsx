export interface AdBannerProps {
  /** 广告位置标识，用于区分不同广告位 */
  position?: 'top-banner' | 'tool-top' | 'home-bottom' | 'sidebar' | 'custom';
  /** 自定义广告内容（如 AdSense script） */
  customContent?: React.ReactNode;
  /** 广告宽度 */
  width?: 'full' | 'responsive';
  /** 是否显示占位提示（开发阶段使用） */
  placeholder?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 通用广告横幅组件
 * 
 * 接入 Google AdSense 示例：
 * <AdBanner position="top-banner" customContent={
 *   <ins className="adsbygoogle"
 *     style={{ display: 'block' }}
 *     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
 *     data-ad-slot="1234567890"
 *     data-full-width-responsive="true" />
 * } />
 */
export default function AdBanner({
  position = 'custom',
  customContent,
  width = 'full',
  placeholder = true,
  className = '',
}: AdBannerProps) {
  const widthClass = width === 'full' ? 'w-full' : 'max-w-3xl mx-auto';
  
  const positionLabel: Record<string, string> = {
    'top-banner': '顶部横幅广告',
    'tool-top': '工具页顶部广告',
    'home-bottom': '首页底部广告',
    'sidebar': '侧边栏广告',
    'custom': '自定义广告位',
  };

  return (
    <div
      className={`${widthClass} my-6 px-6 ${className}`}
      aria-label={`广告位：${positionLabel[position] || position}`}
    >
      {customContent ? (
        <div className="glass-card p-2">
          {customContent}
        </div>
      ) : (
        <div className="glass-card p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-[#666] mb-1">广告位</div>
            <div className="text-xs text-[#444]">
              {placeholder ? positionLabel[position] || position : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
