import { Link } from 'react-router-dom';
import { Zap, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a1a]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#6366f1] flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-['Syne'] font-bold text-lg text-white">
                瓜崎<span className="text-[#00d9ff]">工具</span>
              </span>
            </Link>
            <p className="text-sm text-[#a8b2c1] leading-relaxed max-w-xs">
              免费在线工具集合，无需注册，数据本地处理，保护您的隐私安全。
            </p>
          </div>

          {/* 文本 & 设计 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              文本 & 设计
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: '文本字数统计', path: '/tools/text-counter' },
                { label: '大小写转换', path: '/tools/case-converter' },
                { label: '文本去重', path: '/tools/text-dedup' },
                { label: '文本替换', path: '/tools/text-replace' },
                { label: 'Markdown编辑器', path: '/tools/markdown-editor' },
                { label: '颜色选择器', path: '/tools/color-picker' },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 开发 & 转换 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              开发 & 转换
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'JSON格式化', path: '/tools/json-formatter' },
                { label: '时间戳转换', path: '/tools/timestamp-converter' },
                { label: 'URL编解码', path: '/tools/url-encode-decode' },
                { label: 'Base64编解码', path: '/tools/base64' },
                { label: '正则测试', path: '/tools/regex-tester' },
                { label: '进制转换', path: '/tools/base-converter' },
                { label: 'MD5/SHA哈希', path: '/tools/hash-generator' },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 生成器 & 其他 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              生成器 & 其他
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: '二维码生成', path: '/tools/qrcode-generator' },
                { label: '密码生成', path: '/tools/password-generator' },
                { label: 'UUID生成', path: '/tools/uuid-generator' },
                { label: '全部工具', path: '/tools' },
                { label: '关于我们', path: '/about' },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#a8b2c1] hover:bg-white/10 hover:text-white transition-all" aria-label="GitHub">
                <Github size={17} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#555]">&copy; {new Date().getFullYear()} 瓜崎工具. All rights reserved.</p>
          <p className="text-xs text-[#555] flex items-center gap-1">
            Made with <Heart size={12} className="text-[#e94560]" /> for developers & creators
          </p>
        </div>
      </div>
    </footer>
  );
}
