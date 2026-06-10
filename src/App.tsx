import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Tools from '@/pages/Tools';
import About from '@/pages/About';

// 加载提示组件
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="text-[#a8b2c1] text-sm animate-pulse">加载中...</div>
    </div>
  );
}

// 第1批：核心工具
const TextCounter = lazy(() => import('@/pages/tools/TextCounter'));
const JsonFormatter = lazy(() => import('@/pages/tools/JsonFormatter'));
const ColorPicker = lazy(() => import('@/pages/tools/ColorPicker'));
const MarkdownEditor = lazy(() => import('@/pages/tools/MarkdownEditor'));
const Base64Tool = lazy(() => import('@/pages/tools/Base64Tool'));
const QrCodeGenerator = lazy(() => import('@/pages/tools/QrCodeGenerator'));

// 第2批：热门工具
const TimestampConverter = lazy(() => import('@/pages/tools/TimestampConverter'));
const UrlEncodeDecode = lazy(() => import('@/pages/tools/UrlEncodeDecode'));
const CaseConverter = lazy(() => import('@/pages/tools/CaseConverter'));
const TextDedup = lazy(() => import('@/pages/tools/TextDedup'));
const RegexTester = lazy(() => import('@/pages/tools/RegexTester'));
const PasswordGenerator = lazy(() => import('@/pages/tools/PasswordGenerator'));
const BaseConverter = lazy(() => import('@/pages/tools/BaseConverter'));
const HashGenerator = lazy(() => import('@/pages/tools/HashGenerator'));
const UuidGenerator = lazy(() => import('@/pages/tools/UuidGenerator'));
const TextReplace = lazy(() => import('@/pages/tools/TextReplace'));

// 第3批：扩展工具
const RmbConverter = lazy(() => import('@/pages/tools/RmbConverter'));
const ScTcConverter = lazy(() => import('@/pages/tools/ScTcConverter'));
const WorkingDayCalc = lazy(() => import('@/pages/tools/WorkingDayCalc'));
const DateCalc = lazy(() => import('@/pages/tools/DateCalc'));
const TextReverse = lazy(() => import('@/pages/tools/TextReverse'));
const FullhalfConverter = lazy(() => import('@/pages/tools/FullhalfConverter'));
const MorseCode = lazy(() => import('@/pages/tools/MorseCode'));
const CrontabParser = lazy(() => import('@/pages/tools/CrontabParser'));
const CodeFormatter = lazy(() => import('@/pages/tools/CodeFormatter'));
const BmiCalculator = lazy(() => import('@/pages/tools/BmiCalculator'));

// 第4批：新增工具
const TextDiff = lazy(() => import('@/pages/tools/TextDiff'));
const TextSorter = lazy(() => import('@/pages/tools/TextSorter'));
const PasswordStrength = lazy(() => import('@/pages/tools/PasswordStrength'));
const FileHash = lazy(() => import('@/pages/tools/FileHash'));
const ImageCompress = lazy(() => import('@/pages/tools/ImageCompress'));
const ImageToBase64 = lazy(() => import('@/pages/tools/ImageToBase64'));
const RandomNumber = lazy(() => import('@/pages/tools/RandomNumber'));
const NumberChinese = lazy(() => import('@/pages/tools/NumberChinese'));
const TimeDiffCalc = lazy(() => import('@/pages/tools/TimeDiffCalc'));
const UrlParser = lazy(() => import('@/pages/tools/UrlParser'));
const TextShuffle = lazy(() => import('@/pages/tools/TextShuffle'));
const WhitespaceGen = lazy(() => import('@/pages/tools/WhitespaceGen'));
const AgeCalculator = lazy(() => import('@/pages/tools/AgeCalculator'));
const ExpiryCalculator = lazy(() => import('@/pages/tools/ExpiryCalculator'));

// 第5批：新增工具
const CaesarCipher = lazy(() => import('@/pages/tools/CaesarCipher'));
const WordFrequency = lazy(() => import('@/pages/tools/WordFrequency'));
const ImageColorPicker = lazy(() => import('@/pages/tools/ImageColorPicker'));
const JwtParser = lazy(() => import('@/pages/tools/JwtParser'));
const XmlFormatter = lazy(() => import('@/pages/tools/XmlFormatter'));
const CssUnitConverter = lazy(() => import('@/pages/tools/CssUnitConverter'));
const LineNumberTool = lazy(() => import('@/pages/tools/LineNumberTool'));
const LoremIpsumGenerator = lazy(() => import('@/pages/tools/LoremIpsumGenerator'));
const HtmlEntityEncoder = lazy(() => import('@/pages/tools/HtmlEntityEncoder'));
const LzStringCompress = lazy(() => import('@/pages/tools/LzStringCompress'));

// 第6批：新增工具
const UnitConverter = lazy(() => import('@/pages/tools/UnitConverter'));
const ScientificCalculator = lazy(() => import('@/pages/tools/ScientificCalculator'));
const TimeUnitConverter = lazy(() => import('@/pages/tools/TimeUnitConverter'));
const JsonYamlConverter = lazy(() => import('@/pages/tools/JsonYamlConverter'));
const QrCodeDecoder = lazy(() => import('@/pages/tools/QrCodeDecoder'));
const ImageFormatConverter = lazy(() => import('@/pages/tools/ImageFormatConverter'));
const ImageWatermark = lazy(() => import('@/pages/tools/ImageWatermark'));
const ColorPaletteGenerator = lazy(() => import('@/pages/tools/ColorPaletteGenerator'));
const CsvJsonConverter = lazy(() => import('@/pages/tools/CsvJsonConverter'));
const IpSubnetCalculator = lazy(() => import('@/pages/tools/IpSubnetCalculator'));
const CodeRunner = lazy(() => import('@/pages/tools/CodeRunner'));
const MediaQueryTester = lazy(() => import('@/pages/tools/MediaQueryTester'));
const EmojiPicker = lazy(() => import('@/pages/tools/EmojiPicker'));
const ChinesePinyin = lazy(() => import('@/pages/tools/ChinesePinyin'));
const TextDuplicateStats = lazy(() => import('@/pages/tools/TextDuplicateStats'));
const Base64FileDecoder = lazy(() => import('@/pages/tools/Base64FileDecoder'));

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          {/* 第1批 */}
          <Route path="/tools/text-counter" element={<Suspense fallback={<LoadingSpinner />}><TextCounter /></Suspense>} />
          <Route path="/tools/json-formatter" element={<Suspense fallback={<LoadingSpinner />}><JsonFormatter /></Suspense>} />
          <Route path="/tools/color-picker" element={<Suspense fallback={<LoadingSpinner />}><ColorPicker /></Suspense>} />
          <Route path="/tools/markdown-editor" element={<Suspense fallback={<LoadingSpinner />}><MarkdownEditor /></Suspense>} />
          <Route path="/tools/base64" element={<Suspense fallback={<LoadingSpinner />}><Base64Tool /></Suspense>} />
          <Route path="/tools/qrcode-generator" element={<Suspense fallback={<LoadingSpinner />}><QrCodeGenerator /></Suspense>} />
          {/* 第2批 */}
          <Route path="/tools/timestamp-converter" element={<Suspense fallback={<LoadingSpinner />}><TimestampConverter /></Suspense>} />
          <Route path="/tools/url-encode-decode" element={<Suspense fallback={<LoadingSpinner />}><UrlEncodeDecode /></Suspense>} />
          <Route path="/tools/case-converter" element={<Suspense fallback={<LoadingSpinner />}><CaseConverter /></Suspense>} />
          <Route path="/tools/text-dedup" element={<Suspense fallback={<LoadingSpinner />}><TextDedup /></Suspense>} />
          <Route path="/tools/regex-tester" element={<Suspense fallback={<LoadingSpinner />}><RegexTester /></Suspense>} />
          <Route path="/tools/password-generator" element={<Suspense fallback={<LoadingSpinner />}><PasswordGenerator /></Suspense>} />
          <Route path="/tools/base-converter" element={<Suspense fallback={<LoadingSpinner />}><BaseConverter /></Suspense>} />
          <Route path="/tools/hash-generator" element={<Suspense fallback={<LoadingSpinner />}><HashGenerator /></Suspense>} />
          <Route path="/tools/uuid-generator" element={<Suspense fallback={<LoadingSpinner />}><UuidGenerator /></Suspense>} />
          <Route path="/tools/text-replace" element={<Suspense fallback={<LoadingSpinner />}><TextReplace /></Suspense>} />
          {/* 第3批 */}
          <Route path="/tools/rmb-converter" element={<Suspense fallback={<LoadingSpinner />}><RmbConverter /></Suspense>} />
          <Route path="/tools/sc-tc-converter" element={<Suspense fallback={<LoadingSpinner />}><ScTcConverter /></Suspense>} />
          <Route path="/tools/working-day-calc" element={<Suspense fallback={<LoadingSpinner />}><WorkingDayCalc /></Suspense>} />
          <Route path="/tools/date-calc" element={<Suspense fallback={<LoadingSpinner />}><DateCalc /></Suspense>} />
          <Route path="/tools/text-reverse" element={<Suspense fallback={<LoadingSpinner />}><TextReverse /></Suspense>} />
          <Route path="/tools/fullhalf-converter" element={<Suspense fallback={<LoadingSpinner />}><FullhalfConverter /></Suspense>} />
          <Route path="/tools/morse-code" element={<Suspense fallback={<LoadingSpinner />}><MorseCode /></Suspense>} />
          <Route path="/tools/crontab-parser" element={<Suspense fallback={<LoadingSpinner />}><CrontabParser /></Suspense>} />
          <Route path="/tools/code-formatter" element={<Suspense fallback={<LoadingSpinner />}><CodeFormatter /></Suspense>} />
          <Route path="/tools/bmi-calculator" element={<Suspense fallback={<LoadingSpinner />}><BmiCalculator /></Suspense>} />
          {/* 第4批 */}
          <Route path="/tools/text-diff" element={<Suspense fallback={<LoadingSpinner />}><TextDiff /></Suspense>} />
          <Route path="/tools/text-sorter" element={<Suspense fallback={<LoadingSpinner />}><TextSorter /></Suspense>} />
          <Route path="/tools/password-strength" element={<Suspense fallback={<LoadingSpinner />}><PasswordStrength /></Suspense>} />
          <Route path="/tools/file-hash" element={<Suspense fallback={<LoadingSpinner />}><FileHash /></Suspense>} />
          <Route path="/tools/image-compress" element={<Suspense fallback={<LoadingSpinner />}><ImageCompress /></Suspense>} />
          <Route path="/tools/image-to-base64" element={<Suspense fallback={<LoadingSpinner />}><ImageToBase64 /></Suspense>} />
          <Route path="/tools/random-number" element={<Suspense fallback={<LoadingSpinner />}><RandomNumber /></Suspense>} />
          <Route path="/tools/number-chinese" element={<Suspense fallback={<LoadingSpinner />}><NumberChinese /></Suspense>} />
          <Route path="/tools/time-diff-calc" element={<Suspense fallback={<LoadingSpinner />}><TimeDiffCalc /></Suspense>} />
          <Route path="/tools/url-parser" element={<Suspense fallback={<LoadingSpinner />}><UrlParser /></Suspense>} />
          <Route path="/tools/text-shuffle" element={<Suspense fallback={<LoadingSpinner />}><TextShuffle /></Suspense>} />
          <Route path="/tools/whitespace-gen" element={<Suspense fallback={<LoadingSpinner />}><WhitespaceGen /></Suspense>} />
          <Route path="/tools/age-calculator" element={<Suspense fallback={<LoadingSpinner />}><AgeCalculator /></Suspense>} />
          <Route path="/tools/expiry-calculator" element={<Suspense fallback={<LoadingSpinner />}><ExpiryCalculator /></Suspense>} />
          {/* 第5批 */}
          <Route path="/tools/caesar-cipher" element={<Suspense fallback={<LoadingSpinner />}><CaesarCipher /></Suspense>} />
          <Route path="/tools/word-frequency" element={<Suspense fallback={<LoadingSpinner />}><WordFrequency /></Suspense>} />
          <Route path="/tools/image-color-picker" element={<Suspense fallback={<LoadingSpinner />}><ImageColorPicker /></Suspense>} />
          <Route path="/tools/jwt-parser" element={<Suspense fallback={<LoadingSpinner />}><JwtParser /></Suspense>} />
          <Route path="/tools/xml-formatter" element={<Suspense fallback={<LoadingSpinner />}><XmlFormatter /></Suspense>} />
          <Route path="/tools/css-unit-converter" element={<Suspense fallback={<LoadingSpinner />}><CssUnitConverter /></Suspense>} />
          <Route path="/tools/line-number-tool" element={<Suspense fallback={<LoadingSpinner />}><LineNumberTool /></Suspense>} />
          <Route path="/tools/lorem-ipsum-generator" element={<Suspense fallback={<LoadingSpinner />}><LoremIpsumGenerator /></Suspense>} />
          <Route path="/tools/html-entity-encoder" element={<Suspense fallback={<LoadingSpinner />}><HtmlEntityEncoder /></Suspense>} />
          <Route path="/tools/lz-string-compress" element={<Suspense fallback={<LoadingSpinner />}><LzStringCompress /></Suspense>} />
          {/* 第6批 */}
          <Route path="/tools/unit-converter" element={<Suspense fallback={<LoadingSpinner />}><UnitConverter /></Suspense>} />
          <Route path="/tools/scientific-calculator" element={<Suspense fallback={<LoadingSpinner />}><ScientificCalculator /></Suspense>} />
          <Route path="/tools/time-unit-converter" element={<Suspense fallback={<LoadingSpinner />}><TimeUnitConverter /></Suspense>} />
          <Route path="/tools/json-yaml-converter" element={<Suspense fallback={<LoadingSpinner />}><JsonYamlConverter /></Suspense>} />
          <Route path="/tools/qrcode-decoder" element={<Suspense fallback={<LoadingSpinner />}><QrCodeDecoder /></Suspense>} />
          <Route path="/tools/image-format-converter" element={<Suspense fallback={<LoadingSpinner />}><ImageFormatConverter /></Suspense>} />
          <Route path="/tools/image-watermark" element={<Suspense fallback={<LoadingSpinner />}><ImageWatermark /></Suspense>} />
          <Route path="/tools/color-palette-generator" element={<Suspense fallback={<LoadingSpinner />}><ColorPaletteGenerator /></Suspense>} />
          <Route path="/tools/csv-json-converter" element={<Suspense fallback={<LoadingSpinner />}><CsvJsonConverter /></Suspense>} />
          <Route path="/tools/ip-subnet-calculator" element={<Suspense fallback={<LoadingSpinner />}><IpSubnetCalculator /></Suspense>} />
          <Route path="/tools/code-runner" element={<Suspense fallback={<LoadingSpinner />}><CodeRunner /></Suspense>} />
          <Route path="/tools/media-query-tester" element={<Suspense fallback={<LoadingSpinner />}><MediaQueryTester /></Suspense>} />
          <Route path="/tools/emoji-picker" element={<Suspense fallback={<LoadingSpinner />}><EmojiPicker /></Suspense>} />
          <Route path="/tools/chinese-pinyin" element={<Suspense fallback={<LoadingSpinner />}><ChinesePinyin /></Suspense>} />
          <Route path="/tools/text-duplicate-stats" element={<Suspense fallback={<LoadingSpinner />}><TextDuplicateStats /></Suspense>} />
          <Route path="/tools/base64-file-decoder" element={<Suspense fallback={<LoadingSpinner />}><Base64FileDecoder /></Suspense>} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
