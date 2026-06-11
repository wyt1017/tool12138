import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, Plus, Trash2, RotateCcw, Unlock } from 'lucide-react';

interface UrlParts {
  protocol: string;
  host: string;
  port: string;
  pathname: string;
  hash: string;
  params: Array<[string, string]>;
}

function parseUrl(url: string): UrlParts | null {
  try {
    const u = new URL(url);
    const params: Array<[string, string]> = [];
    u.searchParams.forEach((v, k) => params.push([k, v]));
    return {
      protocol: u.protocol.replace(':', ''),
      host: u.hostname,
      port: u.port || (u.protocol === 'https:' ? '443' : '80'),
      pathname: u.pathname,
      hash: u.hash.replace('#', ''),
      params,
    };
  } catch {
    return null;
  }
}

function rebuildUrl(parts: UrlParts): string {
  const portSuffix = parts.port && parts.port !== '80' && parts.port !== '443' ? `:${parts.port}` : '';
  const searchStr = parts.params
    .filter(([k]) => k !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const hashSuffix = parts.hash ? `#${parts.hash}` : '';
  return `${parts.protocol}://${parts.host}${portSuffix}${parts.pathname}${searchStr ? '?' + searchStr : ''}${hashSuffix}`;
}

export default function UrlParser() {
  const [urlInput, setUrlInput] = useState<string>('');
  const [params, setParams] = useState<Array<[string, string]>>([]);
  const [parsed, setParsed] = useState<UrlParts | null>(null);

  const parsedData = useMemo(() => parseUrl(urlInput), [urlInput]);

  const handleParse = () => {
    if (parsedData) {
      setParsed(parsedData);
      setParams(parsedData.params.map(p => [...p]) as Array<[string, string]>);
    } else {
      setParsed(null);
      setParams([]);
    }
  };

  const updateParam = (index: number, field: 'key' | 'value', newValue: string) => {
    setParams((prev) => {
      const next = prev.map((p, i) => (i === index ? ([field === 'key' ? newValue : p[0], field === 'value' ? newValue : p[1]] as [string, string]) : p));
      return next;
    });
  };

  const removeParam = (index: number) => {
    setParams((prev) => prev.filter((_, i) => i !== index));
  };

  const addParam = () => {
    setParams((prev) => [...prev, ['', '']]);
  };

  const rebuiltUrl = useMemo(() => {
    if (!parsed) return '';
    return rebuildUrl({ ...parsed, params });
  }, [parsed, params]);

  const decodeValue = (value: string): string => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00d9ff]/15 flex items-center justify-center">
            <Link2 size={20} className="text-[#00d9ff]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">URL参数解析器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">解析URL结构、编辑查询参数并重新拼接生成新URL</p>
      </motion.div>

      <div className="space-y-6">
        {/* URL Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-medium text-[#a8b2c1] ml-1">输入URL</label>
            <button onClick={handleParse} disabled={!urlInput} className="btn-primary !py-1.5 !px-4 text-xs disabled:opacity-30">
              解析URL
            </button>
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleParse(); }}
            placeholder="https://example.com/path?key=value&foo=bar#section"
            aria-label="输入URL"
            className="tool-area w-full px-4 py-3 text-sm text-white outline-none focus:border-[#00d9ff]/30 placeholder:text-[#333] font-mono"
          />
          {urlInput && !parsedData && (
            <p className="mt-2 text-xs text-[#e94560] ml-1">⚠ 无效的URL格式</p>
          )}
        </motion.div>

        {/* Parsed Results */}
        {parsed && (
          <>
            {/* URL Components */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">URL组成部分</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: '协议', value: parsed.protocol, color: '#6bcb77' },
                    { label: '主机名', value: parsed.host, color: '#ffd369' },
                    { label: '端口', value: parsed.port, color: '#a78bfa' },
                    { label: '路径', value: parsed.pathname || '/', color: '#00d9ff' },
                    { label: 'Hash', value: parsed.hash || '(无)', color: '#f472b6' },
                    { label: '参数数量', value: String(params.filter(([k]) => k !== '').length), color: '#e94560' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-sm font-mono break-all" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Parameters Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest">查询参数</h3>
                  <button onClick={addParam} className="btn-secondary !py-1.5 !px-3 text-xs">
                    <Plus size={13} className="inline mr-1" /> 添加参数
                  </button>
                </div>

                {params.length === 0 ? (
                  <div className="text-center py-8 text-[#555] text-sm">无查询参数</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left text-xs text-[#555] font-medium py-2 px-3 w-[35%]">参数名</th>
                          <th className="text-left text-xs text-[#555] font-medium py-2 px-3 w-[45%]">参数值</th>
                          <th className="text-right text-xs text-[#555] font-medium py-2 px-3 w-[20%]">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {params.map(([key, value], index) => (
                          <tr key={index} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={key}
                                onChange={(e) => updateParam(index, 'key', e.target.value)}
                                className="tool-area w-full px-2 py-1.5 text-xs text-white outline-none focus:border-[#00d9ff]/30 font-mono"
                                aria-label="参数名"
                                placeholder="参数名"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateParam(index, 'value', e.target.value)}
                                className="tool-area w-full px-2 py-1.5 text-xs text-white outline-none focus:border-[#00d9ff]/30 font-mono"
                                aria-label="参数值"
                                placeholder="参数值"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => updateParam(index, 'value', decodeValue(value))}
                                  className="p-1.5 rounded-lg bg-white/5 text-[#555] hover:text-[#00d9ff] hover:bg-[#00d9ff]/10 transition-all"
                                  title="URL解码"
                                >
                                  <Unlock size={12} />
                                </button>
                                <button
                                  onClick={() => removeParam(index)}
                                  className="p-1.5 rounded-lg bg-white/5 text-[#555] hover:text-[#e94560] hover:bg-[#e94560]/10 transition-all"
                                  title="删除"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Rebuilt URL Output */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-[#555] uppercase tracking-widest">重新拼接的URL</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setParsed(null);
                        setParams([]);
                      }}
                      className="btn-secondary !py-1.5 !px-3 text-xs"
                    >
                      <RotateCcw size={13} className="inline mr-1" /> 重置
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(rebuiltUrl)}
                      disabled={!rebuiltUrl}
                      className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-30"
                    >
                      <Copy size={13} className="inline mr-1" /> 复制URL
                    </button>
                  </div>
                </div>
                <div className="tool-area p-4">
                  <p className="text-sm font-mono text-[#a8b2c1] break-all leading-relaxed">
                    {rebuiltUrl || '—'}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
