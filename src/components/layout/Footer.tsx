import { Link } from 'react-router-dom';
import { Zap, Github, Heart, Sparkles } from 'lucide-react';
import { tools } from '@/data/tools';

export default function Footer() {
  const textTools = tools.filter(t => t.category === 'text').slice(0, 6);
  const devTools = tools.filter(t => t.category === 'dev').slice(0, 7);
  const otherTools = tools.filter(t => !['text', 'dev'].includes(t.category)).slice(0, 3);

  return (
    <footer className="relative border-t border-[var(--border-color)] bg-[color-mix(in_srgb,var(--bg-elevated)_70%,transparent)] backdrop-blur-sm overflow-hidden">
      {/* 霓虹顶边 */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'var(--gradient-rich)', opacity: 0.55 }}
      />
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-['Syne'] font-bold text-lg text-[var(--text-primary)]">
                瓜崎<em className="not-italic gradient-text">工具</em>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
              免费在线工具集合，无需注册，数据本地处理，保护您的隐私安全。
            </p>
            <div className="flex items-center gap-2 mt-5">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[#a78bfa]/40 hover:shadow-[0_0_16px_var(--violet-glow)] transition-all" aria-label="GitHub">
                <Github size={17} />
              </a>
              <span className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] cursor-default" title="每日上新">
                <Sparkles size={16} className="text-[var(--warn)]" />
              </span>
            </div>
          </div>

          {/* 文本工具 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wider">
              文本工具
            </h4>
            <ul className="space-y-2.5">
              {textTools.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-text)] hover:translate-x-0.5 inline-block transition-all">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 开发工具 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wider">
              开发工具
            </h4>
            <ul className="space-y-2.5">
              {devTools.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-text)] hover:translate-x-0.5 inline-block transition-all">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 生成器 & 其他 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wider">
              生成器 & 其他
            </h4>
            <ul className="space-y-2.5">
              {otherTools.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-text)] hover:translate-x-0.5 inline-block transition-all">
                    {tool.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/tools" className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-text)] transition-colors">
                  全部工具
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-text)] transition-colors">
                  关于我们
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-faint)]">&copy; {new Date().getFullYear()} 瓜崎工具. All rights reserved.</p>
          <p className="text-xs text-[var(--text-faint)] flex items-center gap-1">
            Made with <Heart size={12} className="text-[var(--danger)]" /> for developers & creators
          </p>
        </div>
      </div>
    </footer>
  );
}