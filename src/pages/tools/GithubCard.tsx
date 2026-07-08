import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Search, Download, Copy, AlertCircle, Loader2 } from 'lucide-react';

const color = '#a78bfa';

interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
  company: string | null;
  location: string | null;
  blog: string | null;
  created_at: string;
}

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Go: '#00ADD8',
  Rust: '#dea584', Java: '#b07219', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051', Vue: '#41b883', 'Jupyter Notebook': '#DA5B0B',
};

export default function GithubCard() {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState<GithubUser | null>(null);
  const [languages, setLanguages] = useState<{ name: string; pct: number; color: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    const name = username.trim();
    if (!name) return;
    setLoading(true);
    setError('');
    setUser(null);
    setLanguages([]);
    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}`);
      if (userRes.status === 404) throw new Error('未找到该 GitHub 用户');
      if (userRes.status === 403) throw new Error('已达到 GitHub API 匿名限流（60次/小时），请稍后再试');
      if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`);
      const u: GithubUser = await userRes.json();

      let langs: { name: string; pct: number; color: string }[] = [];
      try {
        const repoRes = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=updated`);
        if (repoRes.ok) {
          const repos = await repoRes.json();
          const tally: Record<string, number> = {};
          let total = 0;
          (repos as any[]).forEach((r) => {
            const l = r.language;
            if (l) { tally[l] = (tally[l] || 0) + 1; total++; }
          });
          langs = Object.entries(tally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
              name,
              pct: total ? (count / total) * 100 : 0,
              color: LANG_COLORS[name] || '#8b949e',
            }));
        }
      } catch {
        /* 语言统计失败不影响主卡片 */
      }

      setUser(u);
      setLanguages(langs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取失败');
    } finally {
      setLoading(false);
    }
  };

  const buildSvg = (): string => {
    if (!user) return '';
    const w = 480;
    const h = 200;
    const displayName = (user.name || user.login).slice(0, 18);
    const bio = (user.bio || '').slice(0, 30);
    const langBar = languages.length
      ? languages
          .map((l) => `<rect x="20" y="160" width="${(l.pct / 100) * 440}" height="8" rx="4" fill="${l.color}"/><text x="20" y="185" fill="#8b949e" font-size="11" font-family="sans-serif">${l.name} ${l.pct.toFixed(0)}%</text>`)
          .join('')
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><clipPath id="a"><rect x="20" y="20" width="80" height="80" rx="16"/></clipPath></defs>
  <rect width="${w}" height="${h}" rx="16" fill="#0d1117"/>
  <image href="${user.avatar_url}" x="20" y="20" width="80" height="80" clip-path="url(#a)"/>
  <text x="120" y="46" fill="#ffffff" font-size="20" font-weight="700" font-family="sans-serif">${displayName}</text>
  <text x="120" y="68" fill="#8b949e" font-size="13" font-family="sans-serif">@${user.login}</text>
  ${bio ? `<text x="120" y="90" fill="#c9d1d9" font-size="12" font-family="sans-serif">${bio}</text>` : ''}
  <text x="120" y="120" fill="#ffffff" font-size="13" font-family="sans-serif">👥 ${user.followers} followers   🔭 ${user.following} following   📦 ${user.public_repos} repos</text>
  ${langBar}
</svg>`;
  };

  const copySvg = () => {
    const svg = buildSvg();
    if (svg) navigator.clipboard.writeText(svg);
  };
  const downloadSvg = () => {
    const svg = buildSvg();
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user?.login || 'github'}-card.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Github size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">GitHub 卡片生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">输入用户名，自动拉取公开资料生成 SVG 统计卡，可下载或复制代码嵌入 README</p>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 mb-6">
        <div className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder="输入 GitHub 用户名，如 torvalds"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#00d9ff]/30"
          />
          <button onClick={generate} disabled={loading || !username.trim()} className="btn-primary flex items-center gap-2 !px-5 disabled:opacity-40">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} 生成
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="glass-card p-5 mb-6 flex items-center gap-3" style={{ borderColor: '#e9456055' }}>
          <AlertCircle size={18} className="text-[#e94560]" />
          <span className="text-sm text-[#e94560]">{error}</span>
        </div>
      )}

      {/* Result */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Preview */}
          <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
            <img src={user.avatar_url} alt={user.login} className="w-20 h-20 rounded-2xl" />
            <div className="text-center sm:text-left">
              <div className="font-['Syne'] font-bold text-xl text-white">{user.name || user.login}</div>
              <div className="text-sm text-[#666]">@{user.login}</div>
              {user.bio && <div className="text-sm text-[#a8b2c1] mt-1 max-w-md">{user.bio}</div>}
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start mt-3 text-sm">
                <span className="text-white">👥 {user.followers} <span className="text-[#666]">followers</span></span>
                <span className="text-white">🔭 {user.following} <span className="text-[#666]">following</span></span>
                <span className="text-white">📦 {user.public_repos} <span className="text-[#666]">repos</span></span>
              </div>
            </div>
          </div>

          {/* Language bar */}
          {languages.length > 0 && (
            <div className="glass-card p-5">
              <div className="text-sm text-[#a8b2c1] mb-3">主要语言</div>
              <div className="flex h-3 rounded-full overflow-hidden mb-3">
                {languages.map((l) => (
                  <div key={l.name} style={{ width: `${l.pct}%`, background: l.color }} title={`${l.name} ${l.pct.toFixed(0)}%`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {languages.map((l) => (
                  <span key={l.name} className="flex items-center gap-1.5 text-[#a8b2c1]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} /> {l.name} {l.pct.toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SVG card preview */}
          <div className="glass-card p-6">
            <div className="text-sm text-[#a8b2c1] mb-3">SVG 卡片预览</div>
            <div className="bg-[#0d1117] rounded-xl p-4 flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: buildSvg() }} />
            <div className="flex gap-3 mt-4">
              <button onClick={downloadSvg} className="btn-secondary flex items-center gap-2"><Download size={15} /> 下载 SVG</button>
              <button onClick={copySvg} className="btn-secondary flex items-center gap-2"><Copy size={15} /> 复制 SVG 代码</button>
              <a href={user.html_url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ color }}>在 GitHub 打开 ↗</a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
