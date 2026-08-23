# 变更记录 · CHANGELOG

本文件记录瓜崎工具箱的功能修复与重要变更详情。

---

## [2026-08-23] 修复 16 个工具功能缺陷

对应提交：`45bae84`（`feat(ui): 霓虹赛博主题改版 + 修复16个工具功能缺陷`）

以下缺陷均为**既有功能 bug**（非改版引入），已在本次提交中修复：

### 实时渲染类（ref 更新未触发 React 重渲染）

| # | 工具 | 缺陷 | 修复 |
|---|------|------|------|
| 1 | 秒表 `Stopwatch.tsx` | 运行时数字不动，只有暂停才显示正确数字——RAF 循环只更新 `elapsedRef`（ref），从不触发 re-render | RAF 循环内加 `setTick` 触发重渲染；重置时同步刷新显示 |
| 2 | 文本反转排序 `TextReverse.tsx` | "字符乱序"按钮点了没反应——按钮只改 `shuffleRef`，且 `useMemo` 依赖不含它 | 改用 state `shuffleVersion` 驱动 useMemo 重新打乱 |

### 按钮 / 交互逻辑缺失

| # | 工具 | 缺陷 | 修复 |
|---|------|------|------|
| 3 | 科学计算器 `ScientificCalculator.tsx` | 数字/运算符/函数按钮点击不录入表达式，只能靠键盘输入 | `handleButtonClick` 补上「追加字符到表达式」的默认分支 |
| 4 | URL 编解码 `UrlEncodeDecode.tsx` | 点击"交换输入输出"后输出框空白 | 交换时立即按新模式重新计算，移除有缺陷的跳过逻辑 |

### 算法 / 计算结果错误

| # | 工具 | 缺陷 | 修复 |
|---|------|------|------|
| 5 | 哈希生成器 `HashGenerator.tsx` | MD5 计算结果全部错误（非空输入）——JS `bitLen >>> (8*i)` 位移按 32 取模损坏长度字节 | 改写为标准 RFC 1321 MD5，长度字节显式写出；已通过 RFC 官方测试向量 |
| 6 | 文件哈希计算 `FileHash.tsx` | 同上，MD5 文件哈希结果错误 | 重写为标准 RFC 1321 MD5，已通过测试向量 |
| 7 | 年龄计算器 `AgeCalculator.tsx` | 星座边界错误：1 月整月误判为摩羯、12/22–31 显示"未知" | 修正摩羯座跨年定义 `start:[12,22] end:[1,19]` |
| 8 | 词频统计 `WordFrequency.tsx` | 排序方式改为"按字母"后，"最高频词"卡片显示错误 | 新增独立于排序的最高频词计算（reduce 取最大 count） |
| 9 | 文本重复统计 `TextDuplicateStats.tsx` | 排序方式改为"按内容"后，"最高重复"卡片显示错误 | 改用已有的独立 `maxCount` 而非 `stats[0]` |

### 输入校验缺失 / 边界崩溃

| # | 工具 | 缺陷 | 修复 |
|---|------|------|------|
| 10 | IP 子网计算 `IpSubnetCalculator.tsx` | CIDR 留空时 `parseInt('')` 得 NaN，校验通过后产生 NaN/错误结果 | 增加 `isNaN` 检查，空 CIDR 提示错误 |
| 11 | CSS 单位转换 `CssUnitConverter.tsx` | 根/父字体基准为 0 时除零，结果显示 `Infinity` | 转换前校验基准值必须 > 0 |
| 12 | 人民币大写 `RmbConverter.tsx` | 负数金额被清洗成正数（`[^\d.]` 删掉负号），与占位符提示不符 | 清洗保留前导负号，负数正常加"负" |
| 13 | Crontab 解析 `CrontabParser.tsx` | 非法表达式（如 `99`、`abc`）永不标红——`parseCronField` 从不抛错 | 对超界/无法解析的 token 抛异常，触发失效状态标红 |

### 结果不可见 / 功能失效

| # | 工具 | 缺陷 | 修复 |
|---|------|------|------|
| 14 | 文本打乱 `TextShuffle.tsx` | 加权随机模式下结果列表从不渲染，无法查看/复制 | 权重框下方补充结果列表与复制/恢复按钮 |
| 15 | 中文拼音 `ChinesePinyin.tsx` | "数字标调"模式失效——传 `toneType:'none'` 导致无调号可转换 | 改为 `toneType:'num'` 直接输出数字声调 |
| 16 | 打字速度测试 `TypingSpeedTest.tsx` | 结束时统计缺算最后一个词，准确率可能虚高 | 用已提交的完整词数组重算最终统计 |

---

## [2026-08-23] 全量排查其余 62 个工具（新增修复 11 处 + 复核 51 个）

上一轮已修复 16 个已知缺陷；本轮对剩余全部工具逐一排查功能逻辑，新增修复 11 处，并复核确认其余 51 个工具无功能缺陷。

### 本轮新增修复

| # | 工具 | 缺陷 | 修复 |
|---|------|------|------|
| 1 | 进制转换 `BaseConverter.tsx` | 大数精度丢失：先 `parseInt` 转 Number，>2^53 精度丢失，与"支持大数"宣传不符 | 改为按当前进制直接 `BigInt('0x'/'0o'/'0b'/裸串)` 解析，全精度保留 |
| 2 | CSV 转 JSON `CsvJsonConverter.tsx` | "制表符"分隔符失效：`<option value="\t">` 在 JSX 引号属性中 `\t` 是字面反斜杠+t，匹配不到真实 Tab | 改用 JS 表达式 `value={'\t'}` |
| 3 | 日期计算 `DateCalc.tsx` | ISO 周数算出"第0周"（如 2023-01-01）：按"1月4日所在周"算法对年初日期出错 | 改为以"本周四"为准的标准 ISO 周数算法，年初日归入上一年最末周（52） |
| 4 | 代码格式化 `CodeFormatter.tsx` | JS 对象字面量 `{a:1}` 被误判为 CSS 而格式化错乱：CSS 判定在 JS 关键字判定之前 | 调换两行顺序，让 JS 关键字判定优先（纯 CSS 不受影响） |
| 5 | YAML 转 JSON `JsonYamlConverter.tsx` | 无法识别"对象的列表"（`list:` + `- name: a` 被解析成字符串数组） | 按缩进建树后递归还原嵌套对象 / 对象列表 / 列表内对象，并规避 `http://x` 被误判为键值对 |
| 6 | JWT 解析 `JwtParser.tsx` | 含中文的 payload/header 解码乱码或 JSON.parse 失败：裸 `atob` 得到 Latin-1 串 | 改为 `atob` → `Uint8Array` → `TextDecoder('utf-8')` |
| 7 | 数字转中文大写 `NumberChinese.tsx` | 大数分组顺序颠倒（如 12345678 输出"五千六百七十八 一千二百三十四万"）：从高位组循环却用 `unshift` 头部插入 | 改为 `push`，多组数字恢复正确顺序 |
| 8 | 文本替换 `TextReplace.tsx` | 正则含捕获组时"找到 N 处"计数虚高：`match()` 数组长度在非全局下被分组撑大 | 非全局模式固定计 1 次 |
| 9 | 工作日计算 `WorkingDayCalc.tsx` | "今天"按钮在 UTC+8 地区每天 0-8 点会落到昨天：`toISOString()` 按 UTC 取值 | 改用本地时区 `formatDate(new Date())` |
| 10 | Markdown 编辑器 `MarkdownEditor.tsx` | "仅预览"模式整块空白不显示：外层容器被 `display:none` 隐藏，连同预览区一起消失 | 移除隐藏条件，仅靠子区块条件渲染切换视图 |
| 11 | 保质期计算 `ExpiryCalculator.tsx` | "今天"用 `toISOString().split('T')[0]` 按 UTC 取日期：UTC+8 凌晨会落到昨天，且 `max` 挡住当天选择 | 改用本地时区格式化今日日期 |

### 复核无功能缺陷的工具（51 个）

- **编码/图像类**：Base64FileDecoder、Base64Tool、ImageColorPicker、ImageCompress、ImageCrop、ImageFormatConverter、ImageToBase64、ImageWatermark、HtmlEntityEncoder、MorseCode
- **文本类**：CaseConverter、Fortune、FullhalfConverter、TextCounter、TextDedup、TextDiff、TextSorter、UrlParser、WhitespaceGen、XmlFormatter、ScTcConverter
- **JSON/代码类**：JsonFormatter、LineNumberTool、CodeRunner、LoremIpsumGenerator、LzStringCompress
- **计算类**：BmiCalculator、CaesarCipher、MortgageCalculator、PercentageCalculator、RandomNumber、TimeDiffCalc、TimeUnitConverter、TimestampConverter、UnitConverter
- **生成/安全类**：PasswordGenerator、PasswordStrength、QrCodeDecoder、QrCodeGenerator、UuidGenerator、RegexTester、ColorPicker、ColorPaletteGenerator
- **娱乐/工具类**：LotteryWheel、EmojiPicker、GithubCard、MediaQueryTester、PomodoroTodo、MusicPlayer、WeatherWidget、WorldClock

> 注：纯样式/主题 token 类问题不在本轮功能排查范围内。

---

## 说明

- 修复范围仅涉及上述工具的业务逻辑，未改动任何路由、数据、API 配置。
- MD5 修复均通过 RFC 1321 官方测试向量验证（空串 / a / abc / message digest / 中文字符等）。
- 浏览器端回归验证：14/14 修复项通过；类型检查 `tsc -b --noEmit` 通过。


