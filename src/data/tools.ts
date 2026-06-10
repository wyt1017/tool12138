export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'dev' | 'design' | 'generator' | 'convert' | 'calculator';
  icon: string;
  path: string;
  hot?: boolean;
  tags: string[];
}

export interface CategoryInfo {
  key: Tool['category'];
  label: string;
  color: string;
  bgColor: string;
}

export const categories: CategoryInfo[] = [
  { key: 'text', label: '文本工具', color: '#00d9ff', bgColor: 'rgba(0, 217, 255, 0.1)' },
  { key: 'dev', label: '开发工具', color: '#e94560', bgColor: 'rgba(233, 69, 96, 0.1)' },
  { key: 'design', label: '设计工具', color: '#ffd369', bgColor: 'rgba(255, 211, 105, 0.1)' },
  { key: 'generator', label: '生成器', color: '#6bcb77', bgColor: 'rgba(107, 203, 119, 0.1)' },
  { key: 'convert', label: '转换编解码', color: '#f472b6', bgColor: 'rgba(244, 114, 182, 0.1)' },
  { key: 'calculator', label: '计算器', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.1)' },
];

export const tools: Tool[] = [
  // ===== 第1批：核心工具 (6个) =====
  { id: 'text-counter', name: '文本字数统计', description: '实时统计中英文字数、字符数、段落数、行数', category: 'text', icon: 'Type', path: '/tools/text-counter', hot: true, tags: ['字数', '统计', '文本', '字符'] },
  { id: 'json-formatter', name: 'JSON格式化', description: 'JSON美化、压缩、校验，支持树形可视化展示', category: 'dev', icon: 'Braces', path: '/tools/json-formatter', hot: true, tags: ['JSON', '格式化', '美化', '压缩'] },
  { id: 'color-picker', name: '颜色选择器', description: '取色、HEX/RGB/HSL格式转换、调色板生成', category: 'design', icon: 'Palette', path: '/tools/color-picker', hot: true, tags: ['颜色', '取色', 'HEX', 'RGB', '调色板'] },
  { id: 'markdown-editor', name: 'Markdown编辑器', description: '实时预览，支持导出HTML和一键复制', category: 'text', icon: 'FileCode', path: '/tools/markdown-editor', tags: ['Markdown', '编辑器', '预览', 'MD'] },
  { id: 'base64', name: 'Base64编解码', description: '文本和图片的Base64编码与解码工具', category: 'convert', icon: 'Binary', path: '/tools/base64', tags: ['Base64', '编码', '解码', '加密'] },
  { id: 'qrcode-generator', name: '二维码生成器', description: '输入文本或链接生成高清二维码，支持下载', category: 'generator', icon: 'QrCode', path: '/tools/qrcode-generator', hot: true, tags: ['二维码', 'QR', '生成', '下载'] },

  // ===== 第2批：热门工具 (10个) =====
  { id: 'timestamp-converter', name: '时间戳转换', description: 'Unix时间戳与日期时间互转，支持毫秒级，获取当前时间戳', category: 'convert', icon: 'Clock', path: '/tools/timestamp-converter', hot: true, tags: ['时间戳', 'Timestamp', 'Unix', '日期', '时间'] },
  { id: 'url-encode-decode', name: 'URL编解码', description: 'URL编码和解码，处理特殊字符，支持URIComponent方式', category: 'convert', icon: 'Link2', path: '/tools/url-encode-decode', tags: ['URL', '编码', '解码', 'Encode', 'Decode'] },
  { id: 'case-converter', name: '大小写转换', description: '英文字母大小写互转：首字母大写、全大写、全小写、驼峰等格式', category: 'text', icon: 'CaseSensitive', path: '/tools/case-converter', tags: ['大小写', '大写', '小写', '驼峰', '英文'] },
  { id: 'text-dedup', name: '文本去重', description: '去除重复行、空行，去重后排序，一键清理杂乱文本', category: 'text', icon: 'Funnel', path: '/tools/text-dedup', tags: ['去重', '重复', '空行', '排序', '清洗'] },
  { id: 'regex-tester', name: '正则表达式测试', description: '在线测试正则表达式，实时匹配高亮显示捕获组结果', category: 'dev', icon: 'Regex', path: '/tools/regex-tester', tags: ['正则', 'RegExp', 'Regex', '匹配', '测试'] },
  { id: 'password-generator', name: '随机密码生成', description: '自定义长度和字符类型，生成高强度安全随机密码', category: 'generator', icon: 'KeyRound', path: '/tools/password-generator', tags: ['密码', '随机', '生成', '安全', '强度'] },
  { id: 'base-converter', name: '进制转换器', description: '二进制、八进制、十进制、十六进制互相转换', category: 'calculator', icon: 'Calculator', path: '/tools/base-converter', tags: ['进制', '二进制', '八进制', '十六进制', '十进制'] },
  { id: 'hash-generator', name: 'MD5/SHA哈希生成', description: '计算文本的MD5、SHA1、SHA256、SHA512哈希值', category: 'generator', icon: 'ShieldCheck', path: '/tools/hash-generator', tags: ['MD5', 'SHA', '哈希', 'Hash', '加密', '摘要'] },
  { id: 'uuid-generator', name: 'UUID/GUID生成器', description: '批量生成UUID v4唯一标识符，支持多种格式输出', category: 'generator', icon: 'Fingerprint', path: '/tools/uuid-generator', tags: ['UUID', 'GUID', '唯一标识', '生成', 'ID'] },
  { id: 'text-replace', name: '文本替换', description: '全局查找替换文本内容，支持正则表达式模式匹配', category: 'text', icon: 'Replace', path: '/tools/text-replace', tags: ['替换', '查找', '正则', '文本', '批量'] },

  // ===== 第3批：新增工具 (10个) =====
  { id: 'rmb-converter', name: '人民币大写转换', description: '阿拉伯数字金额转中文大写，支持元角分，符合财务规范', category: 'convert', icon: 'Banknote', path: '/tools/rmb-converter', hot: true, tags: ['人民币', '大写', '金额', '财务', '转换'] },
  { id: 'sc-tc-converter', name: '简繁体转换', description: '简体中文与繁体中文互转，支持词汇级别智能转换', category: 'text', icon: 'Languages', path: '/tools/sc-tc-converter', tags: ['简体', '繁体', '中文', '转换', '翻译'] },
  { id: 'working-day-calc', name: '工作日计算器', description: '计算两个日期之间的工作日天数，排除周末和节假日', category: 'calculator', icon: 'CalendarDays', path: '/tools/working-day-calc', hot: true, tags: ['工作日', '天数', '日期', '计算', '排班'] },
  { id: 'date-calc', name: '日期时间计算器', description: '日期加减计算、两个日期差值、星期查询、年份判断', category: 'calculator', icon: 'CalendarRange', path: '/tools/date-calc', tags: ['日期', '时间', '计算', '相差', '加减'] },
  { id: 'text-reverse', name: '文本反转排序', description: '文本倒序、每行反转、单词倒序、字符乱序等多种反转模式', category: 'text', icon: 'ArrowLeftRight', path: '/tools/text-reverse', tags: ['反转', '倒序', '排序', '文本', '翻转'] },
  { id: 'fullhalf-converter', name: '全角半角转换', description: '全角字符与半角字符互转，处理标点符号、字母、数字', category: 'convert', icon: 'ArrowLeft', path: '/tools/fullhalf-converter', tags: ['全角', '半角', '字符', '转换', '标点'] },
  { id: 'morse-code', name: '摩斯电码编解码', description: '文本与摩斯电码互转，支持音频播放摩斯电码声音', category: 'convert', icon: 'Radio', path: '/tools/morse-code', tags: ['摩斯电码', 'Morse', '编码', '解码', '电报'] },
  { id: 'crontab-parser', name: 'Crontab解析器', description: '解析Cron表达式，展示最近5次/10次执行时间，可视化解释', category: 'dev', icon: 'Timer', path: '/tools/crontab-parser', tags: ['Crontab', 'Cron', '定时任务', '解析', 'Linux'] },
  { id: 'code-formatter', name: '代码格式化工具', description: 'CSS/HTML/SQL/XML代码美化和压缩，自动缩进排版', category: 'dev', icon: 'Code', path: '/tools/code-formatter', tags: ['格式化', 'CSS', 'HTML', 'SQL', '美化', '压缩'] },
  { id: 'bmi-calculator', name: 'BMI体质指数计算', description: '输入身高体重计算BMI值，判断体型分类，提供健康建议', category: 'calculator', icon: 'Scale', path: '/tools/bmi-calculator', tags: ['BMI', '体质指数', '健康', '身高', '体重'] },

  // ===== 第4批：扩展工具 (14个) =====
  { id: 'text-diff', name: '文本差异对比', description: '逐行比较两段文本，高亮显示增删改部分，支持并排/统一视图', category: 'text', icon: 'GitCompare', path: '/tools/text-diff', hot: true, tags: ['差异', '对比', 'Diff', '比较', '高亮'] },
  { id: 'text-sorter', name: '文本排序工具', description: '按字母升序/降序、按字符串长度、按数字大小排序文本行', category: 'text', icon: 'ArrowUpDown', path: '/tools/text-sorter', tags: ['排序', '字母', '长度', '数字', '升序', '降序'] },
  { id: 'password-strength', name: '密码强度检测', description: '输入密码后实时分析长度、大小写、数字、符号组合强度等级', category: 'text', icon: 'Shield', path: '/tools/password-strength', hot: true, tags: ['密码', '强度', '安全', '检测', '分析'] },
  { id: 'file-hash', name: '文件哈希计算', description: '上传文件后计算MD5、SHA-1、SHA-256等哈希值，本地计算不上传', category: 'generator', icon: 'FileCheck', path: '/tools/file-hash', tags: ['文件', '哈希', 'MD5', 'SHA', '校验', '上传'] },
  { id: 'image-compress', name: '图片压缩工具', description: '上传图片并调整压缩比例，预览压缩前后大小及效果，支持下载', category: 'design', icon: 'ImageDown', path: '/tools/image-compress', hot: true, tags: ['图片', '压缩', '大小', '预览', '下载'] },
  { id: 'image-to-base64', name: '图片转Base64', description: '将图片文件转为Base64字符串，支持复制和预览', category: 'convert', icon: 'Image', path: '/tools/image-to-base64', tags: ['图片', 'Base64', '转换', '编码', '预览'] },
  { id: 'random-number', name: '随机数生成器', description: '自定义范围、生成个数、是否含小数，批量生成随机数', category: 'generator', icon: 'Dice5', path: '/tools/random-number', tags: ['随机数', '范围', '批量', '整数', '小数'] },
  { id: 'number-chinese', name: '数字转中文大写', description: '将阿拉伯数字转换为中文大写（壹贰叁...），支持金额和普通数字模式', category: 'convert', icon: 'Hash', path: '/tools/number-chinese', tags: ['数字', '中文大写', '转换', '阿拉伯', '大写'] },
  { id: 'time-diff-calc', name: '时间差计算器', description: '精确计算两个日期之间相差的天、时、分、秒，输出自然语言描述', category: 'calculator', icon: 'Timer', path: '/tools/time-diff-calc', tags: ['时间差', '日期', '相差', '天', '小时', '自然语言'] },
  { id: 'url-parser', name: 'URL参数解析器', description: '输入URL自动解析查询参数、拆分键值对，支持修改后重新拼接', category: 'dev', icon: 'Link', path: '/tools/url-parser', tags: ['URL', '参数', '解析', '键值对', '拼接'] },
  { id: 'text-shuffle', name: '文本行随机打乱', description: '将多行文本随机重新排序，适用于抽奖、随机排列等场景', category: 'text', icon: 'Shuffle', path: '/tools/text-shuffle', tags: ['打乱', '随机', '排序', '抽奖', '排列'] },
  { id: 'whitespace-gen', name: '空白字符生成器', description: '生成不可见空白字符（零宽空格、不换行空格等），用于特殊网名等场景', category: 'generator', icon: 'Space', path: '/tools/whitespace-gen', tags: ['空白字符', '不可见', '网名', 'Unicode', '特殊字符'] },
  { id: 'age-calculator', name: '年龄/周岁计算', description: '输入出生日期，精确计算年龄、周岁、已活天数、下一个生日倒计时', category: 'calculator', icon: 'Cake', path: '/tools/age-calculator', tags: ['年龄', '周岁', '生日', '天数', '倒计时'] },
  { id: 'expiry-calculator', name: '保质期计算器', description: '输入生产日期和保质期，自动计算过期时间，支持天/月/年单位', category: 'calculator', icon: 'ClockAlert', path: '/tools/expiry-calculator', tags: ['保质期', '过期', '生产日期', '食品', '计算'] },

  // ===== 第5批：新增工具 (10个) =====
  { id: 'caesar-cipher', name: '凯撒密码/ROT13', description: '简单移位加密，支持自定义偏移量或ROT13，对字母循环移位', category: 'convert', icon: 'Lock', path: '/tools/caesar-cipher', tags: ['凯撒密码', 'ROT13', '加密', '解密', '移位'] },
  { id: 'word-frequency', name: '词频统计', description: '统计文本中每个单词出现的次数，支持中英文，可排序展示', category: 'text', icon: 'ChartBar', path: '/tools/word-frequency', tags: ['词频', '统计', '单词', '频率', '排序'] },
  { id: 'image-color-picker', name: '图片取色器', description: '上传图片后鼠标悬停/点击，拾取任意像素点的HEX/RGB值', category: 'design', icon: 'Palette', path: '/tools/image-color-picker', tags: ['取色', '颜色', '图片', 'HEX', 'RGB', '像素'] },
  { id: 'jwt-parser', name: 'JWT解析器', description: '粘贴JWT字符串，自动解码Header、Payload、Signature，JSON展示', category: 'dev', icon: 'Key', path: '/tools/jwt-parser', tags: ['JWT', 'Token', '解析', '解码', 'Header', 'Payload'] },
  { id: 'xml-formatter', name: 'XML格式化与校验', description: '美化XML缩进，检查标签是否闭合、语法错误，支持压缩', category: 'dev', icon: 'FileCode', path: '/tools/xml-formatter', tags: ['XML', '格式化', '校验', '美化', '压缩'] },
  { id: 'css-unit-converter', name: 'CSS单位转换', description: 'px ↔ rem ↔ em ↔ % 相互转换，基于根元素或父元素基准字体', category: 'dev', icon: 'Ruler', path: '/tools/css-unit-converter', tags: ['CSS', '单位', 'px', 'rem', 'em', '转换'] },
  { id: 'line-number-tool', name: '文本行编号工具', description: '为每行文本添加行号（可自定义起始编号、分隔符），或去除行号', category: 'text', icon: 'ListOrdered', path: '/tools/line-number-tool', tags: ['行号', '编号', '添加', '去除', '分隔符'] },
  { id: 'lorem-ipsum-generator', name: 'Lorem Ipsum生成器', description: '生成占位文本，可控制段落数、句子数或单词数量', category: 'generator', icon: 'FileText', path: '/tools/lorem-ipsum-generator', tags: ['Lorem', 'Ipsum', '占位', '文本', '生成'] },
  { id: 'html-entity-encoder', name: 'HTML实体编解码', description: '将特殊字符转换为HTML安全实体（如 < → &lt;），或反向还原', category: 'convert', icon: 'Code', path: '/tools/html-entity-encoder', tags: ['HTML', '实体', '编码', '解码', '特殊字符'] },
  { id: 'lz-string-compress', name: '文本压缩/解压', description: '基于LZ算法的纯前端文本压缩，适合长文本存储或传输', category: 'convert', icon: 'Minimize', path: '/tools/lz-string-compress', tags: ['压缩', '解压', 'LZ', '文本', '存储'] },

  // ===== 第6批：新增工具 (16个) =====
  { id: 'unit-converter', name: '单位换算器', description: '支持长度、质量、温度、面积、体积、速度等常见单位之间的快速换算', category: 'calculator', icon: 'Scale', path: '/tools/unit-converter', tags: ['单位', '换算', '长度', '质量', '温度', '面积'] },
  { id: 'scientific-calculator', name: '科学计算器', description: '支持三角函数、指数、对数、幂运算等科学计算，实时表达式求值', category: 'calculator', icon: 'Calculator', path: '/tools/scientific-calculator', tags: ['计算器', '科学', '三角函数', '对数', '幂运算'] },
  { id: 'time-unit-converter', name: '时间单位换算', description: '毫秒、秒、分钟、小时、天、周之间的互相转换，便于时间计算', category: 'calculator', icon: 'Clock', path: '/tools/time-unit-converter', tags: ['时间', '单位', '换算', '毫秒', '秒', '分钟', '小时'] },
  { id: 'json-yaml-converter', name: 'JSON/YAML互转', description: '将JSON文本转换为YAML格式，或将YAML转换回JSON，支持格式校验', category: 'dev', icon: 'FileCode', path: '/tools/json-yaml-converter', tags: ['JSON', 'YAML', '转换', '格式', '校验'] },
  { id: 'qrcode-decoder', name: '二维码解码器', description: '上传二维码图片，自动解析并显示其中的文本、链接或联系信息', category: 'dev', icon: 'QrCode', path: '/tools/qrcode-decoder', tags: ['二维码', '解码', '解析', '图片', 'QR'] },
  { id: 'image-format-converter', name: '图片格式转换', description: 'PNG/JPEG/WEBP/BMP等格式互转，可调整图片质量并下载', category: 'design', icon: 'Image', path: '/tools/image-format-converter', tags: ['图片', '格式', '转换', 'PNG', 'JPEG', 'WebP'] },
  { id: 'image-watermark', name: '图片水印工具', description: '在图片上添加文字水印，可自定义位置、透明度、大小', category: 'design', icon: 'Droplet', path: '/tools/image-watermark', tags: ['水印', '图片', '文字', '透明度', '位置'] },
  { id: 'color-palette-generator', name: '颜色调色板生成器', description: '基于主色生成互补色、类似色、三色搭配等配色方案，一键复制色值', category: 'design', icon: 'Palette', path: '/tools/color-palette-generator', tags: ['颜色', '调色板', '配色', '互补色', '类似色'] },
  { id: 'csv-json-converter', name: 'CSV/JSON互转', description: 'CSV文本与JSON数组互相转换，支持带表头解析和自定义分隔符', category: 'dev', icon: 'Table', path: '/tools/csv-json-converter', tags: ['CSV', 'JSON', '转换', '表头', '分隔符'] },
  { id: 'ip-subnet-calculator', name: 'IP子网计算器', description: '输入CIDR或IP+掩码，计算网络地址、广播地址、可用主机范围等', category: 'calculator', icon: 'Network', path: '/tools/ip-subnet-calculator', tags: ['IP', '子网', 'CIDR', '网络地址', '广播地址'] },
  { id: 'code-runner', name: '在线代码运行器', description: '实时编写HTML/CSS/JS代码并预览运行效果，适合前端原型测试', category: 'dev', icon: 'Code', path: '/tools/code-runner', tags: ['代码', '运行', 'HTML', 'CSS', 'JS', '预览'] },
  { id: 'media-query-tester', name: '屏幕尺寸与媒体查询测试', description: '显示当前窗口尺寸、设备像素比，自定义媒体查询条件并实时测试', category: 'dev', icon: 'Monitor', path: '/tools/media-query-tester', tags: ['屏幕', '尺寸', '媒体查询', 'DPR', '响应式'] },
  { id: 'emoji-picker', name: 'Emoji表情大全', description: '分类展示所有Emoji表情（支持搜索），点击即可复制到剪贴板', category: 'text', icon: 'Smile', path: '/tools/emoji-picker', tags: ['Emoji', '表情', '搜索', '复制', '分类'] },
  { id: 'chinese-pinyin', name: '中文转拼音工具', description: '将中文文本转换为拼音（带声调或数字标调），支持多音字简单识别', category: 'text', icon: 'Languages', path: '/tools/chinese-pinyin', tags: ['拼音', '中文', '声调', '转换', '多音字'] },
  { id: 'text-duplicate-stats', name: '文本重复内容统计', description: '分析文本中重复的行或单词，统计每个重复项的出现次数并排序', category: 'text', icon: 'BarChart', path: '/tools/text-duplicate-stats', tags: ['重复', '统计', '分析', '排序', '频率'] },
  { id: 'base64-file-decoder', name: 'Base64文件还原工具', description: '将Base64字符串解码并还原为原始文件，提供下载', category: 'convert', icon: 'FileDown', path: '/tools/base64-file-decoder', tags: ['Base64', '解码', '文件', '还原', '下载'] },
];

export function getToolByPath(path: string): Tool | undefined {
  return tools.find((t) => t.path === path);
}

export function getToolsByCategory(category: Tool['category']): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase();
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
