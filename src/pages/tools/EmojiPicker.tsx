import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, Search } from 'lucide-react';

// Emoji 分类数据（带关键词）
const EMOJI_DATA: Record<string, Array<{ emoji: string; keywords: string[] }>> = {
  '笑脸': [
    { emoji: '😀', keywords: ['笑', '开心', '快乐', '哈哈', 'grinning'] },
    { emoji: '😃', keywords: ['笑', '开心', '快乐', '大笑', 'smiley'] },
    { emoji: '😄', keywords: ['笑', '开心', '快乐', '大笑', 'smile'] },
    { emoji: '😁', keywords: ['笑', '开心', '快乐', '大笑', 'beaming'] },
    { emoji: '😆', keywords: ['笑', '开心', '大笑', '眯眼', 'laughing'] },
    { emoji: '😅', keywords: ['笑', '尴尬', '汗', 'sweat'] },
    { emoji: '🤣', keywords: ['笑', '大笑', '滚地', 'rofl'] },
    { emoji: '😂', keywords: ['笑', '大笑', '眼泪', 'joy'] },
    { emoji: '🙂', keywords: ['笑', '微笑', 'slight'] },
    { emoji: '🙃', keywords: ['笑', '倒脸', 'upside'] },
    { emoji: '😉', keywords: ['笑', '眨眼', 'wink'] },
    { emoji: '😊', keywords: ['笑', '开心', '温暖', 'blush'] },
    { emoji: '😇', keywords: ['天使', '善良', 'innocent'] },
    { emoji: '🥰', keywords: ['爱', '喜欢', '心动', 'love'] },
    { emoji: '😍', keywords: ['爱', '喜欢', '心动', 'heart'] },
    { emoji: '🤩', keywords: ['星星', '眼', '崇拜', 'star'] },
    { emoji: '😘', keywords: ['爱', '亲吻', 'kiss'] },
    { emoji: '😗', keywords: ['亲吻', 'kiss'] },
    { emoji: '😚', keywords: ['亲吻', '闭眼', 'kiss'] },
    { emoji: '😙', keywords: ['亲吻', '微笑', 'kiss'] },
    { emoji: '🥲', keywords: ['笑', '眼泪', '感动', 'smile'] },
    { emoji: '😋', keywords: ['好吃', '美味', 'yum'] },
    { emoji: '😛', keywords: ['调皮', '舌头', 'tongue'] },
    { emoji: '😜', keywords: ['调皮', '舌头', 'wink'] },
    { emoji: '🤪', keywords: ['疯狂', '搞怪', 'zany'] },
    { emoji: '😝', keywords: ['调皮', '舌头', 'squint'] },
    { emoji: '🤑', keywords: ['钱', '财富', 'money'] },
    { emoji: '🤗', keywords: ['拥抱', '欢迎', 'hug'] },
    { emoji: '🤭', keywords: ['捂嘴', '偷笑', 'giggle'] },
    { emoji: '🤫', keywords: ['安静', '保密', 'hush'] },
    { emoji: '🤔', keywords: ['思考', '疑问', 'think'] },
    { emoji: '🤐', keywords: ['闭嘴', '保密', 'zip'] },
    { emoji: '🤨', keywords: ['怀疑', '疑问', 'raised'] },
    { emoji: '😐', keywords: ['中性', '无表情', 'neutral'] },
    { emoji: '😑', keywords: ['无语', '无表情', 'expressionless'] },
    { emoji: '😶', keywords: ['沉默', '无语', 'speechless'] },
    { emoji: '😏', keywords: ['得意', 'smirk'] },
    { emoji: '😒', keywords: ['不满', '郁闷', 'unamused'] },
    { emoji: '🙄', keywords: ['翻白眼', '无语', 'roll'] },
    { emoji: '😬', keywords: ['尴尬', 'grimace'] },
    { emoji: '😮', keywords: ['惊讶', '张嘴', 'open'] },
    { emoji: '🤯', keywords: ['爆炸', '震惊', 'mind'] },
    { emoji: '😱', keywords: ['恐惧', '尖叫', 'scream'] },
    { emoji: '🥵', keywords: ['热', '流汗', 'hot'] },
    { emoji: '🥶', keywords: ['冷', '冻', 'cold'] },
    { emoji: '🥴', keywords: ['晕', '醉', 'woozy'] },
    { emoji: '😵', keywords: ['晕', 'dizzy'] },
    { emoji: '🤒', keywords: ['生病', '医院', 'sick'] },
    { emoji: '🤕', keywords: ['受伤', 'hurt'] },
    { emoji: '🤢', keywords: ['恶心', 'sick'] },
    { emoji: '🤮', keywords: ['呕吐', 'vomit'] },
    { emoji: '🤧', keywords: ['感冒', '打喷嚏', 'sneeze'] },
    { emoji: '😷', keywords: ['口罩', '生病', 'mask'] },
  ],
  '手势': [
    { emoji: '👋', keywords: ['挥手', '再见', 'hello', 'wave'] },
    { emoji: '🤚', keywords: ['手', '停止', 'raised'] },
    { emoji: '🖐', keywords: ['手', '五指', 'hand'] },
    { emoji: '✋', keywords: ['手', '停止', 'raised'] },
    { emoji: '🖖', keywords: ['手', 'vulcan'] },
    { emoji: '👌', keywords: ['OK', '好的', 'ok'] },
    { emoji: '🤌', keywords: ['手指', 'pinched'] },
    { emoji: '🤏', keywords: ['一点', '少量', 'pinch'] },
    { emoji: '✌️', keywords: ['胜利', '耶', 'victory'] },
    { emoji: '🤞', keywords: ['祈祷', '希望', 'crossed'] },
    { emoji: '🤟', keywords: ['爱你', 'love'] },
    { emoji: '🤘', keywords: ['摇滚', 'horns'] },
    { emoji: '🤙', keywords: ['打电话', 'call'] },
    { emoji: '👈', keywords: ['左', '指向', 'left'] },
    { emoji: '👉', keywords: ['右', '指向', 'right'] },
    { emoji: '👆', keywords: ['上', '指向', 'up'] },
    { emoji: '🖕', keywords: ['中指', 'middle'] },
    { emoji: '👇', keywords: ['下', '指向', 'down'] },
    { emoji: '☝️', keywords: ['上', '指向', 'index'] },
    { emoji: '👍', keywords: ['赞', '好的', 'thumbs'] },
    { emoji: '👎', keywords: ['差', '不好', 'thumbs'] },
    { emoji: '✊', keywords: ['拳头', 'raised'] },
    { emoji: '👊', keywords: ['拳头', '碰拳', 'punch'] },
    { emoji: '🤛', keywords: ['拳头', 'left'] },
    { emoji: '🤜', keywords: ['拳头', 'right'] },
    { emoji: '👏', keywords: ['鼓掌', '拍手', 'clap'] },
    { emoji: '🙌', keywords: ['举手', '庆祝', 'raising'] },
    { emoji: '👐', keywords: ['手', '张开', 'open'] },
    { emoji: '🤲', keywords: ['手', '祈祷', 'palms'] },
    { emoji: '🙏', keywords: ['祈祷', '感谢', 'pray'] },
    { emoji: '✍️', keywords: ['写字', 'writing'] },
    { emoji: '💅', keywords: ['指甲', '美甲', 'nail'] },
    { emoji: '🤳', keywords: ['自拍', 'selfie'] },
    { emoji: '💪', keywords: ['力量', '肌肉', 'muscle'] },
  ],
  '动物': [
    { emoji: '🐶', keywords: ['狗', '宠物', 'dog'] },
    { emoji: '🐱', keywords: ['猫', '宠物', 'cat'] },
    { emoji: '🐭', keywords: ['老鼠', 'mouse'] },
    { emoji: '🐹', keywords: ['仓鼠', 'hamster'] },
    { emoji: '🐰', keywords: ['兔子', 'rabbit'] },
    { emoji: '🦊', keywords: ['狐狸', 'fox'] },
    { emoji: '🐻', keywords: ['熊', 'bear'] },
    { emoji: '🐼', keywords: ['熊猫', 'panda'] },
    { emoji: '🐨', keywords: ['考拉', 'koala'] },
    { emoji: '🐯', keywords: ['老虎', 'tiger'] },
    { emoji: '🦁', keywords: ['狮子', 'lion'] },
    { emoji: '🐮', keywords: ['牛', 'cow'] },
    { emoji: '🐷', keywords: ['猪', 'pig'] },
    { emoji: '🐸', keywords: ['青蛙', 'frog'] },
    { emoji: '🐵', keywords: ['猴子', 'monkey'] },
    { emoji: '🙈', keywords: ['猴子', '捂眼', 'see'] },
    { emoji: '🙉', keywords: ['猴子', '捂耳', 'hear'] },
    { emoji: '🙊', keywords: ['猴子', '捂嘴', 'speak'] },
    { emoji: '🐒', keywords: ['猴子', 'monkey'] },
    { emoji: '🐔', keywords: ['鸡', 'chicken'] },
    { emoji: '🐧', keywords: ['企鹅', 'penguin'] },
    { emoji: '🐦', keywords: ['鸟', 'bird'] },
    { emoji: '🐤', keywords: ['小鸟', 'chick'] },
    { emoji: '🐣', keywords: ['小鸡', 'hatching'] },
    { emoji: '🐥', keywords: ['小鸡', 'baby'] },
    { emoji: '🦆', keywords: ['鸭子', 'duck'] },
    { emoji: '🦅', keywords: ['鹰', 'eagle'] },
    { emoji: '🦉', keywords: ['猫头鹰', 'owl'] },
    { emoji: '🦇', keywords: ['蝙蝠', 'bat'] },
    { emoji: '🐺', keywords: ['狼', 'wolf'] },
    { emoji: '🐗', keywords: ['野猪', 'boar'] },
    { emoji: '🐴', keywords: ['马', 'horse'] },
    { emoji: '🦄', keywords: ['独角兽', 'unicorn'] },
    { emoji: '🐝', keywords: ['蜜蜂', 'bee'] },
    { emoji: '🐛', keywords: ['虫', 'bug'] },
    { emoji: '🦋', keywords: ['蝴蝶', 'butterfly'] },
    { emoji: '🐌', keywords: ['蜗牛', 'snail'] },
    { emoji: '🐞', keywords: ['瓢虫', 'ladybug'] },
    { emoji: '🐜', keywords: ['蚂蚁', 'ant'] },
    { emoji: '🦟', keywords: ['蚊子', 'mosquito'] },
    { emoji: '🦗', keywords: ['蟋蟀', 'cricket'] },
    { emoji: '🦂', keywords: ['蝎子', 'scorpion'] },
    { emoji: '🦎', keywords: ['蜥蜴', 'lizard'] },
    { emoji: '🦖', keywords: ['恐龙', 'trex'] },
    { emoji: '🦕', keywords: ['恐龙', 'sauropod'] },
    { emoji: '🐙', keywords: ['章鱼', 'octopus'] },
    { emoji: '🦑', keywords: ['鱿鱼', 'squid'] },
    { emoji: '🦐', keywords: ['虾', 'shrimp'] },
    { emoji: '🦞', keywords: ['龙虾', 'lobster'] },
    { emoji: '🦀', keywords: ['螃蟹', 'crab'] },
    { emoji: '🐡', keywords: ['鱼', 'blowfish'] },
    { emoji: '🐠', keywords: ['鱼', '热带鱼', 'fish'] },
    { emoji: '🐟', keywords: ['鱼', 'fish'] },
    { emoji: '🐬', keywords: ['海豚', 'dolphin'] },
    { emoji: '🐳', keywords: ['鲸鱼', 'whale'] },
    { emoji: '🐋', keywords: ['鲸鱼', 'whale'] },
    { emoji: '🦈', keywords: ['鲨鱼', 'shark'] },
    { emoji: '🐊', keywords: ['鳄鱼', 'crocodile'] },
    { emoji: '🐅', keywords: ['老虎', 'tiger'] },
    { emoji: '🐆', keywords: ['豹', 'leopard'] },
    { emoji: '🦓', keywords: ['斑马', 'zebra'] },
    { emoji: '🦍', keywords: ['猩猩', 'gorilla'] },
    { emoji: '🦧', keywords: ['猩猩', 'orangutan'] },
    { emoji: '🐘', keywords: ['大象', 'elephant'] },
    { emoji: '🦛', keywords: ['河马', 'hippo'] },
    { emoji: '🦏', keywords: ['犀牛', 'rhino'] },
    { emoji: '🐪', keywords: ['骆驼', 'camel'] },
    { emoji: '🐫', keywords: ['骆驼', 'camel'] },
    { emoji: '🦒', keywords: ['长颈鹿', 'giraffe'] },
    { emoji: '🦘', keywords: ['袋鼠', 'kangaroo'] },
    { emoji: '🦬', keywords: ['野牛', 'bison'] },
    { emoji: '🐃', keywords: ['水牛', 'buffalo'] },
    { emoji: '🐂', keywords: ['牛', 'ox'] },
    { emoji: '🐄', keywords: ['奶牛', 'cow'] },
    { emoji: '🐎', keywords: ['马', 'horse'] },
    { emoji: '🐖', keywords: ['猪', 'pig'] },
    { emoji: '🐏', keywords: ['公羊', 'ram'] },
    { emoji: '🐑', keywords: ['羊', 'sheep'] },
    { emoji: '🦙', keywords: ['羊驼', 'lama'] },
    { emoji: '🐐', keywords: ['山羊', 'goat'] },
    { emoji: '🦌', keywords: ['鹿', 'deer'] },
    { emoji: '🐕', keywords: ['狗', 'dog'] },
    { emoji: '🐩', keywords: ['贵宾犬', 'poodle'] },
    { emoji: '🦮', keywords: ['导盲犬', 'guide'] },
    { emoji: '🐈', keywords: ['猫', 'cat'] },
    { emoji: '🐓', keywords: ['公鸡', 'rooster'] },
    { emoji: '🦃', keywords: ['火鸡', 'turkey'] },
    { emoji: '🦚', keywords: ['孔雀', 'peacock'] },
    { emoji: '🦜', keywords: ['鹦鹉', 'parrot'] },
    { emoji: '🦢', keywords: ['天鹅', 'swan'] },
    { emoji: '🦩', keywords: ['火烈鸟', 'flamingo'] },
    { emoji: '🕊', keywords: ['鸽子', '和平', 'dove'] },
    { emoji: '🐇', keywords: ['兔子', 'rabbit'] },
    { emoji: '🦝', keywords: ['浣熊', 'raccoon'] },
    { emoji: '🦨', keywords: ['臭鼬', 'skunk'] },
    { emoji: '🦡', keywords: ['獾', 'badger'] },
    { emoji: '🦦', keywords: ['水獭', 'otter'] },
    { emoji: '🦥', keywords: ['树懒', 'sloth'] },
    { emoji: '🦭', keywords: ['海豹', 'seal'] },
    { emoji: '🦫', keywords: ['海狸', 'beaver'] },
    { emoji: '🦤', keywords: ['渡渡鸟', 'dodo'] },
  ],
  '食物': [
    { emoji: '🍎', keywords: ['苹果', '水果', 'apple'] },
    { emoji: '🍐', keywords: ['梨', '水果', 'pear'] },
    { emoji: '🍊', keywords: ['橙子', '水果', 'orange'] },
    { emoji: '🍋', keywords: ['柠檬', '水果', 'lemon'] },
    { emoji: '🍌', keywords: ['香蕉', '水果', 'banana'] },
    { emoji: '🍉', keywords: ['西瓜', '水果', 'watermelon'] },
    { emoji: '🍇', keywords: ['葡萄', '水果', 'grape'] },
    { emoji: '🍓', keywords: ['草莓', '水果', 'strawberry'] },
    { emoji: '🫐', keywords: ['蓝莓', '水果', 'blueberry'] },
    { emoji: '🍈', keywords: ['哈密瓜', '水果', 'melon'] },
    { emoji: '🍒', keywords: ['樱桃', '水果', 'cherry'] },
    { emoji: '🍑', keywords: ['桃子', '水果', 'peach'] },
    { emoji: '🥭', keywords: ['芒果', '水果', 'mango'] },
    { emoji: '🍍', keywords: ['菠萝', '水果', 'pineapple'] },
    { emoji: '🥥', keywords: ['椰子', '水果', 'coconut'] },
    { emoji: '🥝', keywords: ['猕猴桃', '水果', 'kiwi'] },
    { emoji: '🍅', keywords: ['番茄', '蔬菜', 'tomato'] },
    { emoji: '🍆', keywords: ['茄子', '蔬菜', 'eggplant'] },
    { emoji: '🥑', keywords: ['牛油果', 'avocado'] },
    { emoji: '🥦', keywords: ['西兰花', '蔬菜', 'broccoli'] },
    { emoji: '🥬', keywords: ['白菜', '蔬菜', 'leafy'] },
    { emoji: '🥒', keywords: ['黄瓜', '蔬菜', 'cucumber'] },
    { emoji: '🌶', keywords: ['辣椒', '蔬菜', 'pepper'] },
    { emoji: '🫑', keywords: ['辣椒', '蔬菜', 'bell'] },
    { emoji: '🥕', keywords: ['胡萝卜', '蔬菜', 'carrot'] },
    { emoji: '🧄', keywords: ['大蒜', '蔬菜', 'garlic'] },
    { emoji: '🧅', keywords: ['洋葱', '蔬菜', 'onion'] },
    { emoji: '🥔', keywords: ['土豆', '蔬菜', 'potato'] },
    { emoji: '🍠', keywords: ['红薯', '蔬菜', 'sweet'] },
    { emoji: '🥐', keywords: ['面包', '牛角包', 'croissant'] },
    { emoji: '🥯', keywords: ['面包', '贝果', 'bagel'] },
    { emoji: '🥖', keywords: ['面包', '法棍', 'bread'] },
    { emoji: '🥨', keywords: ['面包', 'pretzel'] },
    { emoji: '🧀', keywords: ['奶酪', 'cheese'] },
    { emoji: '🥚', keywords: ['蛋', '鸡蛋', 'egg'] },
    { emoji: '🍳', keywords: ['煎蛋', 'cooking'] },
    { emoji: '🧈', keywords: ['黄油', 'butter'] },
    { emoji: '🥞', keywords: ['煎饼', 'pancakes'] },
    { emoji: '🧇', keywords: ['华夫饼', 'waffle'] },
    { emoji: '🥓', keywords: ['培根', 'bacon'] },
    { emoji: '🥩', keywords: ['肉', 'steak'] },
    { emoji: '🍗', keywords: ['鸡肉', 'meat'] },
    { emoji: '🍖', keywords: ['肉', 'meat'] },
    { emoji: '🦴', keywords: ['骨头', 'bone'] },
    { emoji: '🌭', keywords: ['热狗', 'hotdog'] },
    { emoji: '🍔', keywords: ['汉堡', 'burger'] },
    { emoji: '🍟', keywords: ['薯条', 'fries'] },
    { emoji: '🥙', keywords: ['卷饼', 'stuffed'] },
    { emoji: '🧆', keywords: ['沙拉', 'falafel'] },
    { emoji: '🥘', keywords: ['锅', 'stew'] },
    { emoji: '🥫', keywords: ['罐头', 'canned'] },
    { emoji: '🍝', keywords: ['意大利面', 'pasta'] },
    { emoji: '🍜', keywords: ['面条', 'noodle'] },
    { emoji: '🍲', keywords: ['火锅', 'pot'] },
    { emoji: '🥣', keywords: ['碗', 'bowl'] },
    { emoji: '🥗', keywords: ['沙拉', 'salad'] },
    { emoji: '🍿', keywords: ['爆米花', 'popcorn'] },
    { emoji: '🧂', keywords: ['盐', 'salt'] },
    { emoji: '🥧', keywords: ['派', 'pie'] },
    { emoji: '🧁', keywords: ['蛋糕', 'cupcake'] },
    { emoji: '🍰', keywords: ['蛋糕', 'cake'] },
    { emoji: '🎂', keywords: ['蛋糕', '生日', 'birthday'] },
    { emoji: '🍮', keywords: ['布丁', 'pudding'] },
    { emoji: '🍭', keywords: ['糖果', 'lollipop'] },
    { emoji: '🍬', keywords: ['糖果', 'candy'] },
    { emoji: '🍫', keywords: ['巧克力', 'chocolate'] },
    { emoji: '🍩', keywords: ['甜甜圈', 'doughnut'] },
    { emoji: '🍪', keywords: ['饼干', 'cookie'] },
    { emoji: '🌰', keywords: ['栗子', 'chestnut'] },
    { emoji: '🥜', keywords: ['花生', 'nuts'] },
    { emoji: '🫘', keywords: ['豆子', 'beans'] },
    { emoji: '🍯', keywords: ['蜂蜜', 'honey'] },
    { emoji: '🥛', keywords: ['牛奶', 'milk'] },
    { emoji: '🍼', keywords: ['奶瓶', 'baby'] },
    { emoji: '☕', keywords: ['咖啡', 'coffee'] },
    { emoji: '🫖', keywords: ['茶壶', 'teapot'] },
    { emoji: '🍵', keywords: ['茶', 'tea'] },
    { emoji: '🧃', keywords: ['果汁', 'juice'] },
    { emoji: '🥤', keywords: ['饮料', 'cup'] },
    { emoji: '🧋', keywords: ['奶茶', 'bubble'] },
    { emoji: '🫧', keywords: ['气泡', 'bubble'] },
    { emoji: '🥃', keywords: ['威士忌', 'whiskey'] },
    { emoji: '🥂', keywords: ['香槟', 'champagne'] },
    { emoji: '🍷', keywords: ['红酒', 'wine'] },
    { emoji: '🍺', keywords: ['啤酒', 'beer'] },
    { emoji: '🍻', keywords: ['啤酒', 'beer'] },
    { emoji: '🥡', keywords: ['外卖盒', 'takeout'] },
    { emoji: '🥢', keywords: ['筷子', 'chopsticks'] },
  ],
  '自然': [
    { emoji: '🌸', keywords: ['花', '樱花', 'flower'] },
    { emoji: '💮', keywords: ['花', 'white'] },
    { emoji: '🏵', keywords: ['花', 'rosette'] },
    { emoji: '🌹', keywords: ['玫瑰', '花', 'rose'] },
    { emoji: '🥀', keywords: ['花', '枯萎', 'wilted'] },
    { emoji: '🌺', keywords: ['花', 'hibiscus'] },
    { emoji: '🌻', keywords: ['向日葵', '花', 'sunflower'] },
    { emoji: '🌼', keywords: ['花', 'flower'] },
    { emoji: '🌷', keywords: ['郁金香', '花', 'tulip'] },
    { emoji: '🌱', keywords: ['植物', '发芽', 'seedling'] },
    { emoji: '🪴', keywords: ['植物', '盆栽', 'plant'] },
    { emoji: '🌲', keywords: ['树', '松树', 'tree'] },
    { emoji: '🌳', keywords: ['树', 'tree'] },
    { emoji: '🌴', keywords: ['树', '棕榈', 'palm'] },
    { emoji: '🌵', keywords: ['仙人掌', 'cactus'] },
    { emoji: '🌾', keywords: ['稻子', 'sheaf'] },
    { emoji: '🌿', keywords: ['草', 'herb'] },
    { emoji: '☘️', keywords: ['草', 'shamrock'] },
    { emoji: '🍀', keywords: ['草', '幸运', 'four'] },
    { emoji: '🍁', keywords: ['枫叶', '叶子', 'maple'] },
    { emoji: '🍂', keywords: ['叶子', '落叶', 'fallen'] },
    { emoji: '🍃', keywords: ['叶子', 'leaf'] },
    { emoji: '🪹', keywords: ['巢', 'nest'] },
    { emoji: '🪺', keywords: ['巢', 'nest'] },
    { emoji: '🍄', keywords: ['蘑菇', 'mushroom'] },
    { emoji: '🌰', keywords: ['栗子', 'chestnut'] },
    { emoji: '🔥', keywords: ['火', '火焰', 'fire'] },
    { emoji: '✨', keywords: ['星星', '闪光', 'sparkles'] },
    { emoji: '🌟', keywords: ['星星', 'star'] },
    { emoji: '💫', keywords: ['星星', 'dizzy'] },
    { emoji: '⭐', keywords: ['星星', 'star'] },
    { emoji: '🌠', keywords: ['流星', 'shooting'] },
    { emoji: '☁️', keywords: ['云', 'cloud'] },
    { emoji: '⛅', keywords: ['云', 'sun'] },
    { emoji: '⛈', keywords: ['雷雨', 'storm'] },
    { emoji: '🌤', keywords: ['天气', 'sun'] },
    { emoji: '🌥', keywords: ['天气', 'cloud'] },
    { emoji: '🌦', keywords: ['天气', '雨', 'sun'] },
    { emoji: '🌧', keywords: ['雨', 'rain'] },
    { emoji: '🌨', keywords: ['雪', 'snow'] },
    { emoji: '❄️', keywords: ['雪', '雪花', 'snowflake'] },
    { emoji: '☃️', keywords: ['雪人', 'snowman'] },
    { emoji: '⛄', keywords: ['雪人', 'snowman'] },
    { emoji: '🌬', keywords: ['风', 'wind'] },
    { emoji: '💨', keywords: ['风', 'dash'] },
    { emoji: '🌪', keywords: ['龙卷风', 'tornado'] },
    { emoji: '🌫', keywords: ['雾', 'fog'] },
    { emoji: '🌈', keywords: ['彩虹', 'rainbow'] },
    { emoji: '☀️', keywords: ['太阳', 'sun'] },
    { emoji: '🌙', keywords: ['月亮', 'moon'] },
    { emoji: '🌚', keywords: ['月亮', 'moon'] },
    { emoji: '🌛', keywords: ['月亮', 'moon'] },
    { emoji: '🌜', keywords: ['月亮', 'moon'] },
    { emoji: '🌝', keywords: ['月亮', 'moon'] },
    { emoji: '🌞', keywords: ['太阳', 'sun'] },
    { emoji: '⏳', keywords: ['沙漏', '时间', 'hourglass'] },
    { emoji: '⏰', keywords: ['闹钟', '时间', 'alarm'] },
    { emoji: '⌚', keywords: ['手表', '时间', 'watch'] },
    { emoji: '⌛', keywords: ['沙漏', '时间', 'hourglass'] },
    { emoji: '⏱', keywords: ['计时器', '时间', 'stopwatch'] },
    { emoji: '⏲', keywords: ['计时器', '时间', 'timer'] },
    { emoji: '🧭', keywords: ['指南针', 'compass'] },
    { emoji: '🌋', keywords: ['火山', 'volcano'] },
    { emoji: '🗻', keywords: ['山', '富士山', 'mount'] },
    { emoji: '🏔', keywords: ['山', 'mountain'] },
    { emoji: '⛰', keywords: ['山', 'mountain'] },
    { emoji: '🏕️', keywords: ['露营', '帐篷', 'camping'] },
    { emoji: '🏝', keywords: ['岛屿', 'island'] },
    { emoji: '🏖', keywords: ['沙滩', 'beach'] },
    { emoji: '🏜️', keywords: ['沙漠', 'desert'] },
  ],
  '符号': [
    { emoji: '❤️', keywords: ['爱', '心', 'love', 'heart'] },
    { emoji: '🧡', keywords: ['爱', '心', 'heart'] },
    { emoji: '💛', keywords: ['爱', '心', 'yellow'] },
    { emoji: '💚', keywords: ['爱', '心', 'green'] },
    { emoji: '💙', keywords: ['爱', '心', 'blue'] },
    { emoji: '💜', keywords: ['爱', '心', 'purple'] },
    { emoji: '🤎', keywords: ['爱', '心', 'brown'] },
    { emoji: '🖤', keywords: ['爱', '心', 'black'] },
    { emoji: '🤍', keywords: ['爱', '心', 'white'] },
    { emoji: '💔', keywords: ['心', 'broken'] },
    { emoji: '❣️', keywords: ['心', 'heart'] },
    { emoji: '💕', keywords: ['爱', '心', 'two'] },
    { emoji: '💞', keywords: ['爱', '心', 'revolving'] },
    { emoji: '💓', keywords: ['爱', '心', 'beating'] },
    { emoji: '💗', keywords: ['爱', '心', 'growing'] },
    { emoji: '💖', keywords: ['爱', '心', 'sparkling'] },
    { emoji: '💘', keywords: ['爱', '心', 'arrow'] },
    { emoji: '💝', keywords: ['爱', '心', 'ribbon'] },
    { emoji: '💟', keywords: ['心', 'heart'] },
    { emoji: '☮️', keywords: ['和平', 'peace'] },
    { emoji: '✝️', keywords: ['十字', 'cross'] },
    { emoji: '☪️', keywords: ['伊斯兰', 'star'] },
    { emoji: '🕉', keywords: ['印度', 'om'] },
    { emoji: '☸️', keywords: ['佛教', 'wheel'] },
    { emoji: '✡️', keywords: ['犹太', 'star'] },
    { emoji: '🔯', keywords: ['六角', 'star'] },
    { emoji: '🕎', keywords: ['犹太', 'menorah'] },
    { emoji: '☯️', keywords: ['阴阳', 'yin'] },
    { emoji: '☦️', keywords: ['十字', 'orthodox'] },
    { emoji: '🛐', keywords: ['祈祷', 'pray'] },
    { emoji: '⛎', keywords: ['星座', 'ophiuchus'] },
    { emoji: '♈', keywords: ['星座', '白羊', 'aries'] },
    { emoji: '♉', keywords: ['星座', '金牛', 'taurus'] },
    { emoji: '♊', keywords: ['星座', '双子', 'gemini'] },
    { emoji: '♋', keywords: ['星座', '巨蟹', 'cancer'] },
    { emoji: '♌', keywords: ['星座', '狮子', 'leo'] },
    { emoji: '♍', keywords: ['星座', '处女', 'virgo'] },
    { emoji: '♎', keywords: ['星座', '天秤', 'libra'] },
    { emoji: '♏', keywords: ['星座', '天蝎', 'scorpio'] },
    { emoji: '♐', keywords: ['星座', '射手', 'sagittarius'] },
    { emoji: '♑', keywords: ['星座', '摩羯', 'capricorn'] },
    { emoji: '♒', keywords: ['星座', '水瓶', 'aquarius'] },
    { emoji: '♓', keywords: ['星座', '双鱼', 'pisces'] },
    { emoji: '🆔', keywords: ['ID', '标识', 'id'] },
    { emoji: '⚛️', keywords: ['原子', 'atom'] },
    { emoji: '🉑', keywords: ['可', 'accept'] },
    { emoji: '☢️', keywords: ['辐射', 'radio'] },
    { emoji: '☣️', keywords: ['病毒', 'biohazard'] },
    { emoji: '📴', keywords: ['关机', 'mobile'] },
    { emoji: '📳', keywords: ['震动', 'vibration'] },
    { emoji: '🈶', keywords: ['有', 'not'] },
    { emoji: '🈚', keywords: ['无', 'free'] },
    { emoji: '🈸', keywords: ['申', 'application'] },
    { emoji: '🈺', keywords: ['营', 'open'] },
    { emoji: '🈷', keywords: ['月', 'month'] },
    { emoji: '✴️', keywords: ['星', 'eight'] },
    { emoji: '🆚', keywords: ['VS', '对', 'vs'] },
    { emoji: '🉐', keywords: ['得', 'gain'] },
    { emoji: '🈹', keywords: ['割', 'discount'] },
    { emoji: '🈲', keywords: ['禁', 'prohibited'] },
    { emoji: '🈳', keywords: ['空', 'empty'] },
    { emoji: '🈵', keywords: ['满', 'full'] },
    { emoji: '🔴', keywords: ['红', '圆', 'red'] },
    { emoji: '🟠', keywords: ['橙', '圆', 'orange'] },
    { emoji: '🟡', keywords: ['黄', '圆', 'yellow'] },
    { emoji: '🟢', keywords: ['绿', '圆', 'green'] },
    { emoji: '🔵', keywords: ['蓝', '圆', 'blue'] },
    { emoji: '🟣', keywords: ['紫', '圆', 'purple'] },
    { emoji: '🟤', keywords: ['棕', '圆', 'brown'] },
    { emoji: '⚫', keywords: ['黑', '圆', 'black'] },
    { emoji: '⚪', keywords: ['白', '圆', 'white'] },
    { emoji: '🟥', keywords: ['红', '方', 'red'] },
    { emoji: '🟧', keywords: ['橙', '方', 'orange'] },
    { emoji: '🟨', keywords: ['黄', '方', 'yellow'] },
    { emoji: '🟩', keywords: ['绿', '方', 'green'] },
    { emoji: '🟦', keywords: ['蓝', '方', 'blue'] },
    { emoji: '🟪', keywords: ['紫', '方', 'purple'] },
    { emoji: '🟫', keywords: ['棕', '方', 'brown'] },
    { emoji: '⬛', keywords: ['黑', '方', 'black'] },
    { emoji: '⬜', keywords: ['白', '方', 'white'] },
    { emoji: '◼️', keywords: ['黑', '方', 'black'] },
    { emoji: '◻️', keywords: ['白', '方', 'white'] },
    { emoji: '◾', keywords: ['黑', '方', 'black'] },
    { emoji: '◽', keywords: ['白', '方', 'white'] },
    { emoji: '▪️', keywords: ['黑', '方', 'black'] },
    { emoji: '▫️', keywords: ['白', '方', 'white'] },
    { emoji: '🔶', keywords: ['橙', '菱形', 'orange'] },
    { emoji: '🔷', keywords: ['蓝', '菱形', 'blue'] },
    { emoji: '🔸', keywords: ['橙', '菱形', 'orange'] },
    { emoji: '🔹', keywords: ['蓝', '菱形', 'blue'] },
    { emoji: '🔺', keywords: ['红', '三角', 'triangle'] },
    { emoji: '🔻', keywords: ['红', '三角', 'triangle'] },
    { emoji: '💠', keywords: ['钻石', 'diamond'] },
    { emoji: '🔘', keywords: ['按钮', 'button'] },
    { emoji: '🔳', keywords: ['按钮', 'white'] },
    { emoji: '🔲', keywords: ['按钮', 'black'] },
    { emoji: '🏁', keywords: ['旗帜', 'flag'] },
    { emoji: '🚩', keywords: ['旗帜', 'flag'] },
    { emoji: '🎌', keywords: ['旗帜', 'crossed'] },
    { emoji: '🏴', keywords: ['旗帜', 'black'] },
    { emoji: '🏳️', keywords: ['旗帜', 'white'] },
    { emoji: '🏳️‍🌈', keywords: ['旗帜', '彩虹', 'rainbow'] },
    { emoji: '🏳️‍⚧️', keywords: ['旗帜', 'transgender'] },
    { emoji: '🏴‍☠️', keywords: ['旗帜', '海盗', 'pirate'] },
    { emoji: '🇨🇳', keywords: ['中国', '国旗', 'china'] },
    { emoji: '🇺🇸', keywords: ['美国', '国旗', 'usa'] },
    { emoji: '🇯🇵', keywords: ['日本', '国旗', 'japan'] },
    { emoji: '🇬🇧', keywords: ['英国', '国旗', 'uk'] },
    { emoji: '🇫🇷', keywords: ['法国', '国旗', 'france'] },
    { emoji: '🇩🇪', keywords: ['德国', '国旗', 'germany'] },
    { emoji: '🇰🇷', keywords: ['韩国', '国旗', 'korea'] },
    { emoji: '🇷🇺', keywords: ['俄罗斯', '国旗', 'russia'] },
    { emoji: '🇮🇳', keywords: ['印度', '国旗', 'india'] },
    { emoji: '🇧🇷', keywords: ['巴西', '国旗', 'brazil'] },
    { emoji: '🇦🇺', keywords: ['澳大利亚', '国旗', 'australia'] },
    { emoji: '🇨🇦', keywords: ['加拿大', '国旗', 'canada'] },
    { emoji: '🇮🇹', keywords: ['意大利', '国旗', 'italy'] },
    { emoji: '🇪🇸', keywords: ['西班牙', '国旗', 'spain'] },
    { emoji: '🇹🇷', keywords: ['土耳其', '国旗', 'turkey'] },
    { emoji: '🇸🇬', keywords: ['新加坡', '国旗', 'singapore'] },
    { emoji: '🇹🇭', keywords: ['泰国', '国旗', 'thailand'] },
    { emoji: '🇻🇳', keywords: ['越南', '国旗', 'vietnam'] },
    { emoji: '🇵🇭', keywords: ['菲律宾', '国旗', 'philippines'] },
    { emoji: '🇲🇾', keywords: ['马来西亚', '国旗', 'malaysia'] },
    { emoji: '🇮🇩', keywords: ['印尼', '国旗', 'indonesia'] },
    { emoji: '🇳🇱', keywords: ['荷兰', '国旗', 'netherlands'] },
    { emoji: '🇵🇱', keywords: ['波兰', '国旗', 'poland'] },
    { emoji: '🇸🇪', keywords: ['瑞典', '国旗', 'sweden'] },
    { emoji: '🇳🇴', keywords: ['挪威', '国旗', 'norway'] },
    { emoji: '🇩🇰', keywords: ['丹麦', '国旗', 'denmark'] },
    { emoji: '🇫🇮', keywords: ['芬兰', '国旗', 'finland'] },
    { emoji: '🇨🇭', keywords: ['瑞士', '国旗', 'switzerland'] },
    { emoji: '🇦🇪', keywords: ['阿联酋', '国旗', 'uae'] },
    { emoji: '🇿🇦', keywords: ['南非', '国旗', 'southafrica'] },
    { emoji: '🇪🇬', keywords: ['埃及', '国旗', 'egypt'] },
    { emoji: '🇳🇬', keywords: ['尼日利亚', '国旗', 'nigeria'] },
    { emoji: '🇦🇷', keywords: ['阿根廷', '国旗', 'argentina'] },
    { emoji: '🇲🇽', keywords: ['墨西哥', '国旗', 'mexico'] },
    { emoji: '🇵🇹', keywords: ['葡萄牙', '国旗', 'portugal'] },
    { emoji: '🇬🇷', keywords: ['希腊', '国旗', 'greece'] },
    { emoji: '🇦🇹', keywords: ['奥地利', '国旗', 'austria'] },
    { emoji: '🇧🇪', keywords: ['比利时', '国旗', 'belgium'] },
    { emoji: '🇮🇱', keywords: ['以色列', '国旗', 'israel'] },
    { emoji: '🇳🇿', keywords: ['新西兰', '国旗', 'newzealand'] },
    { emoji: '🇭🇰', keywords: ['香港', '国旗', 'hongkong'] },
    { emoji: '🇹🇼', keywords: ['台湾', '国旗', 'taiwan'] },
    { emoji: '🇲🇴', keywords: ['澳门', '国旗', 'macau'] },
  ],
};

export default function EmojiPicker() {
  const color = '#ffd369';
  const [selectedCategory, setSelectedCategory] = useState('笑脸');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null);

  const categories = Object.keys(EMOJI_DATA);

  // 获取当前分类的emoji列表
  const getCategoryEmojis = (category: string) => {
    return EMOJI_DATA[category].map(item => item.emoji);
  };

  // 搜索emoji（根据关键词匹配）
  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_DATA)
        .flat()
        .filter(item => 
          item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.emoji === searchQuery
        )
        .map(item => item.emoji)
    : getCategoryEmojis(selectedCategory);

  const copyEmoji = (emoji: string) => {
    navigator.clipboard.writeText(emoji);
    setCopiedEmoji(emoji);
    setTimeout(() => setCopiedEmoji(null), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smile size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">Emoji表情大全</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>分类展示所有Emoji表情（支持搜索），点击即可复制到剪贴板</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search size={18} className="text-[#666]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索Emoji（如：笑、爱、狗、苹果）..."
              aria-label="搜索Emoji"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#ffd369]/30 w-full"
            />
          </div>
          {copiedEmoji && (
            <div style={{ fontSize: 14, color }}>
              已复制: {copiedEmoji}
            </div>
          )}
        </div>
      </motion.div>

      {/* Categories */}
      {!searchQuery && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: selectedCategory === cat ? 500 : 400,
                background: selectedCategory === cat ? `${color}24` : 'rgba(255,255,255,0.05)',
                color: selectedCategory === cat ? color : '#666',
                border: selectedCategory === cat ? `${color}4d` : 'none',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      )}

      {/* Emoji Grid */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[#a8b2c1]">
            {searchQuery ? `搜索结果 (${filteredEmojis.length})` : `${selectedCategory} (${filteredEmojis.length})`}
          </h2>
        </div>
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
          {filteredEmojis.map((emoji, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.5) }}
              onClick={() => copyEmoji(emoji)}
              className="text-2xl p-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer active:scale-90"
              title="点击复制"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <div className="text-center text-[#666] py-8">没有找到匹配的Emoji</div>
        )}
      </motion.div>

      {/* Tips */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 mt-6">
        <p className="text-xs text-[#666]">
          <strong className="text-[#a8b2c1]">提示：</strong>
          点击任意Emoji即可复制到剪贴板，可直接粘贴到聊天、文档等场景使用。支持中文关键词搜索，如输入"笑"、"爱"、"狗"等。
        </p>
      </motion.div>
    </div>
  );
}