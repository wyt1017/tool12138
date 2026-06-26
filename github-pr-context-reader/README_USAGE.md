# GitHub PR Context Reader - 使用指南

## 安装步骤

### 1. 生成图标

打开 `generate-icons.html` 文件（双击或用浏览器打开），点击"Generate Icons"按钮，然后点"Download Icons"下载三个图标文件。

将下载的 `icon16.png`、`icon48.png`、`icon128.png` 移动到 `icons/` 文件夹中。

### 2. 加载扩展到Chrome

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `github-pr-context-reader` 文件夹
5. 扩展加载成功后会出现GitHub PR Context Reader图标

### 3. 配置GitHub Token（可选但推荐）

为了获取完整数据，建议配置GitHub Personal Access Token：

1. 访问 https://github.com/settings/tokens
2. 点击"Generate new token (classic)"
3. 勾选 `repo` 权限（如果需要访问私有仓库）
4. 复制生成的token
5. 在任意GitHub PR页面，按F12打开开发者工具
6. 切换到Console标签
7. 粘贴以下代码并回车：
```javascript
chrome.storage.local.set({githubToken: 'YOUR_TOKEN_HERE'});
```
将 `YOUR_TOKEN_HERE` 替换为你的实际token

## 使用方法

1. 访问任意GitHub Pull Request页面（如：https://github.com/owner/repo/pull/123）
2. 在PR页面顶部会出现"PR Context"按钮
3. 点击按钮，右侧会滑出上下文面板
4. 面板包含三个标签：
   - **Summary**: PR摘要，包含文件变更统计、描述、标签、负责人等信息
   - **Related**: 相关PR列表，显示同一作者的近期PR
   - **History**: 文件提交历史，显示每个文件的最近5次提交

## 功能说明

### PR摘要
- 文件变更数量
- 代码添加/删除行数
- 提交数量
- PR描述（支持基础Markdown格式）
- 作者、状态、创建时间
- 负责人和标签

### 相关PR
- 显示同一作者的其他PR
- 可以直接跳转到相关PR

### 文件历史
- 显示变更文件的最近提交历史
- 点击可以查看完整提交详情

## 注意事项

1. 如果没有配置GitHub Token，API调用会受限（每分钟60次请求）
2. 配置Token后提升至每分钟5000次请求
3. Token只存储在本地浏览器，不会发送到其他服务器
4. 扩展只在GitHub PR页面（`/pull/*`）生效

## 故障排除

### 按钮不显示
- 确认当前页面是PR页面（URL包含 `/pull/`）
- 检查扩展是否已启用
- 刷新页面

### 数据加载失败
- 检查是否配置了GitHub Token
- 检查网络连接
- 确认GitHub API未被封禁

### 图标不显示
- 按使用指南重新生成并放置图标文件
- 确认icons文件夹中有三个PNG文件
