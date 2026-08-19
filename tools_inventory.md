# 瓜崎工具项目 - 工具清单

生成时间：2026-08-18

---

## 一、MCP 工具

| 序号 | 服务器名称 | 工具名称 | 功能描述 |
|------|-----------|---------|---------|
| 1 | integrated_code_mode | Exec | 在隔离 V8 上下文中运行 JavaScript 代码，支持链式调用多个工具 |
| 2 | integrated_goal | get_goal | 获取当前目标的完整信息（状态、预算、token 用量、耗时等） |
| 3 | integrated_goal | create_goal | 创建新目标（需用户明确请求） |
| 4 | integrated_goal | update_goal | 更新现有目标状态（complete / blocked） |

---

## 二、Web 应用工具（src/pages/tools）

### 文本处理

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 1 | TextCounter.tsx | 字数统计 | 统计文本的字符数、词数、行数等 |
| 2 | TextReverse.tsx | 文字反转 | 反转文本顺序 |
| 3 | TextSorter.tsx | 文字排序 | 对文本行进行排序 |
| 4 | TextReplace.tsx | 文字替换 | 查找并替换文本内容 |
| 5 | TextDiff.tsx | 文字对比 | 对比两段文本差异 |
| 6 | TextDedup.tsx | 去重复行 | 去除文本中的重复行 |
| 7 | TextShuffle.tsx | 文字乱序 | 随机打乱文本顺序 |
| 8 | TextDuplicateStats.tsx | 重复统计 | 统计文本中重复内容的出现次数 |
| 9 | WordFrequency.tsx | 词频统计 | 统计文本中各词出现的频率 |
| 10 | LoremIpsumGenerator.tsx | 随机文本生成 | 生成 Lorem Ipsum 占位文本 |
| 11 | WhitespaceGen.tsx | 空白字符生成 | 生成各类空白字符 |
| 12 | MorseCode.tsx | 摩斯密码 | 文本与摩斯密码互转 |
| 13 | CaesarCipher.tsx | 凯撒密码 | 凯撒密码加解密 |
| 14 | CaseConverter.tsx | 大小写转换 | 文本大小写格式转换 |
| 15 | ScTcConverter.tsx | 繁简转换 | 繁体与简体中文互转 |
| 16 | ChinesePinyin.tsx | 拼音标注 | 为中文添加拼音 |
| 17 | NumberChinese.tsx | 中文数字 | 阿拉伯数字与中文数字互转 |
| 18 | FullhalfConverter.tsx | 全角半角转换 | 全角与半角字符互转 |
| 19 | RegexTester.tsx | 正则测试 | 在线测试正则表达式 |

### 格式转换 / 编解码

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 20 | Base64Tool.tsx | Base64 编解码 | Base64 编码与解码 |
| 21 | Base64FileDecoder.tsx | Base64 文件解码 | 将 Base64 字符串解码为文件 |
| 22 | UrlEncodeDecode.tsx | URL 编解码 | URL 编码与解码 |
| 23 | UrlParser.tsx | URL 解析器 | 解析 URL 各组成部分 |
| 24 | JsonFormatter.tsx | JSON 格式化 | JSON 格式化与校验 |
| 25 | XmlFormatter.tsx | XML 格式化 | XML 格式化与校验 |
| 26 | CsvJsonConverter.tsx | CSV/JSON 转换 | CSV 与 JSON 互转 |
| 27 | JsonYamlConverter.tsx | JSON/YAML 转换 | JSON 与 YAML 互转 |
| 28 | HtmlEntityEncoder.tsx | HTML 实体编码 | HTML 实体编码与解码 |
| 29 | LzStringCompress.tsx | LZ-String 压缩 | LZ-String 压缩与解压 |
| 30 | MarkdownEditor.tsx | Markdown 编辑器 | Markdown 实时预览编辑 |

### 代码 / 开发工具

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 31 | CodeFormatter.tsx | 代码格式化 | 代码格式美化 |
| 32 | CodeRunner.tsx | 代码运行器 | 在线运行代码 |
| 33 | CssUnitConverter.tsx | CSS 单位转换 | rem/em/vw 等单位互转 |
| 34 | JwtParser.tsx | JWT 解析器 | 解析和查看 JWT Token |
| 35 | CrontabParser.tsx | Cron 表达式解析 | 解析和预览 Cron 表达式 |
| 36 | LineNumberTool.tsx | 行号工具 | 为文本添加行号 |

### 图片 / 媒体工具

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 37 | ImageToBase64.tsx | 图片转 Base64 | 将图片转换为 Base64 字符串 |
| 38 | ImageCrop.tsx | 图片裁剪 | 裁剪图片 |
| 39 | ImageCompress.tsx | 图片压缩 | 压缩图片文件大小 |
| 40 | ImageFormatConverter.tsx | 图片格式转换 | PNG/JPG/WebP 等格式互转 |
| 41 | ImageColorPicker.tsx | 图片取色器 | 从图片中提取颜色 |
| 42 | ImageWatermark.tsx | 图片水印 | 给图片添加水印 |
| 43 | ColorPicker.tsx | 颜色选择器 | 选择和转换颜色值 |
| 44 | ColorPaletteGenerator.tsx | 配色方案生成 | 生成配色方案 |
| 45 | EmojiPicker.tsx | Emoji 选择器 | 浏览和复制 Emoji |
| 46 | QrCodeGenerator.tsx | 二维码生成 | 生成二维码图片 |
| 47 | QrCodeDecoder.tsx | 二维码解码 | 识别并解码二维码 |

### 计算器 / 转换器

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 48 | ScientificCalculator.tsx | 科学计算器 | 支持三角函数等高级运算 |
| 49 | PercentageCalculator.tsx | 百分比计算器 | 计算百分比相关数值 |
| 50 | MortgageCalculator.tsx | 房贷计算器 | 计算房贷月供和利息 |
| 51 | UnitConverter.tsx | 单位换算器 | 通用单位换算 |
| 52 | TimeUnitConverter.tsx | 时间单位换算 | 秒/分/时/天等单位互转 |
| 53 | BaseConverter.tsx | 进制转换器 | 二进制/十六进制/十进制互转 |
| 54 | TimestampConverter.tsx | 时间戳转换 | Unix 时间戳与日期互转 |
| 55 | IpSubnetCalculator.tsx | IP 子网计算器 | 计算子网掩码和网络信息 |
| 56 | RmbConverter.tsx | 人民币大写 | 金额转为中文大写 |
| 57 | PasswordGenerator.tsx | 密码生成器 | 生成安全随机密码 |
| 58 | PasswordStrength.tsx | 密码强度检测 | 检测密码强度 |
| 59 | HashGenerator.tsx | 哈希生成器 | MD5/SHA 等哈希计算 |
| 60 | FileHash.tsx | 文件哈希 | 计算文件的哈希值 |
| 61 | UuidGenerator.tsx | UUID 生成器 | 生成 UUID |
| 62 | RandomNumber.tsx | 随机数生成 | 生成指定范围随机数 |

### 日期 / 时间工具

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 63 | DateCalc.tsx | 日期计算 | 日期加减运算 |
| 64 | TimeDiffCalc.tsx | 时间差计算 | 计算两个时间的间隔 |
| 65 | ExpiryCalculator.tsx | 过期计算 | 计算产品/密码过期时间 |
| 66 | WorkingDayCalc.tsx | 工作日计算 | 排除节假日计算工作日 |
| 67 | AgeCalculator.tsx | 年龄计算器 | 根据生日计算年龄 |
| 68 | Stopwatch.tsx | 秒表 | 计时器 |
| 69 | WorldClock.tsx | 世界时钟 | 查看不同时区时间 |
| 70 | PomodoroTodo.tsx | 番茄钟待办 | 番茄工作法 + 待办事项 |

### 网络 / 数据查询

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 71 | WeatherWidget.tsx | 天气组件 | 实时天气查询展示 |
| 72 | ExchangeRate.tsx | 汇率查询 | 实时汇率转换 |
| 73 | GithubCard.tsx | GitHub 卡片 | 生成 GitHub 个人/仓库卡片 |
| 74 | MediaQueryTester.tsx | CSS 查询测试 | 测试 CSS Media Query |

### 趣味 / 娱乐

| 序号 | 文件名 | 工具名称 | 功能描述 |
|------|--------|---------|---------|
| 75 | Fortune.tsx | 运势抽签 | 每日运势抽签 |
| 76 | LotteryWheel.tsx | 抽奖转盘 | 名单抽奖转盘 |
| 77 | TypingSpeedTest.tsx | 打字速度测试 | 测试打字速度和准确率 |
| 78 | BmiCalculator.tsx | BMI 计算器 | 计算身体质量指数 |

---

## 统计

- **MCP 工具总数**：4 个
- **Web 应用工具总数**：78 个
- **项目总计**：82 个工具
