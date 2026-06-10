import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Copy } from 'lucide-react';

export default function MediaQueryTester() {
  const [windowSize, setWindowSize] = useState({ width: -1, height: -1 });
  const [dpr, setDpr] = useState(1);
  const [customQuery, setCustomQuery] = useState('');
  const [queryMatches, setQueryMatches] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [hasReady, setHasReady] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setDpr(window.devicePixelRatio || 1);
    };

    updateSize();
    setHasReady(true);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!customQuery.trim()) {
      setQueryMatches(false);
      setHasQueried(false);
      return;
    }

    try {
      const mql = window.matchMedia(customQuery);
      setQueryMatches(mql.matches);
      setHasQueried(true);
      // 监听媒体查询变化
      mql.addEventListener('change', (e) => setQueryMatches(e.matches));
      return () => mql.removeEventListener('change', () => {});
    } catch {
      setQueryMatches(false);
      setHasQueried(true);
    }
  }, [customQuery]);

  const presetQueries = [
    { name: '手机 (< 768px)', query: '(max-width: 767px)' },
    { name: '平板 (≥ 768px)', query: '(min-width: 768px)' },
    { name: '桌面 (≥ 1024px)', query: '(min-width: 1024px)' },
    { name: '大屏 (≥ 1280px)', query: '(min-width: 1280px)' },
    { name: '横屏', query: '(orientation: landscape)' },
    { name: '竖屏', query: '(orientation: portrait)' },
    { name: '高分辨率', query: '(min-resolution: 2dppx)' },
    { name: '打印模式', query: 'print' },
  ];

  const copyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  const color = '#00d9ff';
  const green = '#6bcb77';
  const pink = '#f472b6';
  const purple = '#a78bfa';

  const getDeviceType = () => {
    if (windowSize.width < 768) return { type: '手机', color };
    if (windowSize.width < 1024) return { type: '平板', color: green };
    return { type: '桌面', color: purple };
  };

  const checkPresetMatch = (query: string) => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Monitor size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">屏幕尺寸与媒体查询测试</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>显示当前窗口尺寸、设备像素比，自定义媒体查询条件并实时测试匹配结果</p>
      </motion.div>

      {/* Current Size */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <h2 style={{ fontSize: 14, fontWeight: 500, color: '#a8b2c1', marginBottom: 16 }}>当前窗口信息</h2>
        <div className="grid grid-cols-3 gap-4">
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>宽度</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color }}>{windowSize.width}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>px</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>高度</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: green }}>{windowSize.height}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>px</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>设备像素比</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: pink }}>{dpr.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>DPR</div>
          </div>
        </div>

        {/* Device Type */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
          <span style={{ fontSize: 11, color: '#666' }}>当前设备类型：</span>
          {(() => {
            const dt = getDeviceType();
            return (
              <span style={{ fontSize: 14, fontWeight: 500, color: dt.color }}>
                {dt.type}
              </span>
            );
          })()}
          <span style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>
            ({windowSize.width >= windowSize.height ? '横屏' : '竖屏'})
          </span>
        </div>
      </motion.div>

      {/* Preset Queries */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        <h2 style={{ fontSize: 14, fontWeight: 500, color: '#a8b2c1', marginBottom: 16 }}>常用媒体查询</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presetQueries.map((preset) => {
            const matches = checkPresetMatch(preset.query);
            return (
              <div
                key={preset.query}
                style={{
                  background: matches ? `${color}24` : 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: 12,
                  border: matches ? `${color}4d` : 'none',
                }}
              >
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{preset.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: matches ? color : '#a8b2c1' }}>
                  {preset.query}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: matches ? color : '#666' }}>
                    {matches ? '✓ 匹配' : '✗ 不匹配'}
                  </span>
                  <button onClick={() => copyQuery(preset.query)} className="btn-secondary !py-1 !px-2 text-xs">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Custom Query */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
        <h2 style={{ fontSize: 14, fontWeight: 500, color: '#a8b2c1', marginBottom: 16 }}>自定义媒体查询测试</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="输入媒体查询，如 (min-width: 500px)"
            aria-label="自定义媒体查询"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#00d9ff]/30 flex-1 font-mono"
          />
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: queryMatches && hasQueried ? `${color}24` : 'rgba(255,255,255,0.05)',
            color: queryMatches && hasQueried ? color : '#666',
          }}>
            {hasQueried ? (queryMatches ? '✓ 匹配' : '✗ 不匹配') : '请输入查询'}
          </div>
        </div>

        {/* Query Reference */}
        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <h3 style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>媒体查询语法参考</h3>
          <div style={{ fontSize: 12, color: '#a8b2c1' }}>
            <p style={{ marginBottom: 4 }}>• <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>(min-width: 768px)</code> - 最小宽度</p>
            <p style={{ marginBottom: 4 }}>• <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>(max-width: 1024px)</code> - 最大宽度</p>
            <p style={{ marginBottom: 4 }}>• <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>(orientation: landscape)</code> - 横屏</p>
            <p>• <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>(min-resolution: 2dppx)</code> - 高分辨率屏幕</p>
          </div>
        </div>
      </motion.div>
      {/* Loading state */}
      {!hasReady && (
        <motion.div className="glass-card p-6 text-center">
          <p style={{ color: '#a8b2c1', fontSize: 14 }}>正在获取窗口信息...</p>
        </motion.div>
      )}
    </div>
  );
}