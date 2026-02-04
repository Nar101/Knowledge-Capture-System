# GitHub 上传指南 🚀

> 这份指南将帮助你把「复制摘录工具」项目上传到 GitHub，并在另一台电脑上下载使用。

---

## 📋 前置准备（只需做一次）

### 1. 注册 GitHub 账号
如果还没有 GitHub 账号：
1. 访问 [github.com](https://github.com)
2. 点击 "Sign up" 注册
3. 填写邮箱、密码等信息
4. 验证邮箱

### 2. 配置 Git 用户信息
在终端运行以下命令（替换成你的信息）：

```bash
# 设置你的 Git 用户名（会显示在提交记录中）
git config --global user.name "你的名字"

# 设置你的 Git 邮箱（使用注册 GitHub 的邮箱）
git config --global user.email "your-email@example.com"
```

**为什么需要这一步？**
- Git 需要知道是谁在提交代码
- 这些信息会记录在每次提交中
- 使用和 GitHub 相同的邮箱，提交记录才会关联到你的账号

---

## 🌟 第一部分：在 GitHub 创建仓库

### 步骤 1：创建新仓库
1. 登录 [github.com](https://github.com)
2. 点击右上角的 **"+"** 号
3. 选择 **"New repository"**

### 步骤 2：填写仓库信息
- **Repository name（仓库名称）**: `copy-excerpt-tool`
- **Description（描述，可选）**: `一个用于快速摘录文本和图片的 macOS 工具`
- **Public/Private（公开/私有）**: 
  - **Public**：任何人都可以看到（推荐，方便学习交流）
  - **Private**：只有你能看到
- ⚠️ **重要**：不要勾选任何初始化选项（README、.gitignore、license）

### 步骤 3：创建仓库
点击绿色按钮 **"Create repository"**

### 步骤 4：复制仓库地址
创建完成后，你会看到一个页面，找到类似这样的地址：
```
https://github.com/你的用户名/copy-excerpt-tool.git
```
把这个地址复制下来，一会儿要用。

---

## 💻 第二部分：上传代码到 GitHub

### 步骤 1：提交代码到本地 Git 仓库

**什么是提交（commit）？**
- 就像给项目拍一个"快照"
- 记录了这个时间点项目的所有文件
- 可以随时回到这个版本

在终端运行（我已经帮你准备好了文件）：

```bash
# 进入项目目录
cd "/Users/nar/Desktop/Vibe Coding/复制摘录工具"

# 提交代码（-m 后面是提交说明）
git commit -m "初始提交：复制摘录工具第一版"
```

**提交说明的作用**：
- 简短描述这次改动了什么
- 方便以后查看历史记录
- 常见的提交说明：
  - `git commit -m "初始提交"`
  - `git commit -m "添加了图片识别功能"`
  - `git commit -m "修复了闪退问题"`

### 步骤 2：关联 GitHub 仓库

**什么是关联（remote）？**
- 告诉本地 Git，远程仓库在哪里
- `origin` 是远程仓库的别名（可以理解为昵称）

```bash
# 关联远程仓库（替换成你刚才复制的地址）
git remote add origin https://github.com/你的用户名/copy-excerpt-tool.git
```

### 步骤 3：推送代码到 GitHub

**什么是推送（push）？**
- 把本地的提交"上传"到 GitHub
- 就像把文件上传到云盘

```bash
# 推送代码到 GitHub 的 main 分支
git push -u origin main
```

**第一次推送时**：
- 可能会要求输入 GitHub 用户名和密码
- 如果使用了两步验证，需要使用 Personal Access Token（个人访问令牌）

**获取 Personal Access Token**：
1. 访问 GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
2. 点击 "Generate new token" -> "Generate new token (classic)"
3. 填写 Note（备注）：`复制摘录工具`
4. 勾选 `repo`（完整的仓库访问权限）
5. 点击 "Generate token"
6. 复制生成的 token（只显示一次，要保存好）
7. 在推送时，密码处粘贴这个 token

---

## 🔄 第三部分：在另一台电脑上下载项目

### 步骤 1：安装必要工具（如果还没有）
确保另一台电脑已安装：
- Git
- Node.js（v16 或更高版本）

### 步骤 2：克隆（下载）项目

**什么是克隆（clone）？**
- 把 GitHub 上的项目完整下载到本地
- 包含所有文件和 Git 历史记录

```bash
# 在你想要存放项目的位置运行
# 例如，在桌面
cd ~/Desktop

# 克隆项目（替换成你的仓库地址）
git clone https://github.com/你的用户名/copy-excerpt-tool.git

# 进入项目目录
cd copy-excerpt-tool
```

### 步骤 3：安装依赖

**为什么需要这一步？**
- 我们没有上传 `node_modules` 文件夹（太大了）
- 需要重新下载项目所需的依赖包

```bash
# 安装项目依赖
npm install
```

### 步骤 4：运行项目

```bash
# 启动开发模式
npm run dev
```

---

## 🔄 日常工作流程

### 在电脑 A 上修改代码后

```bash
# 1. 查看修改了哪些文件
git status

# 2. 添加修改的文件到暂存区
git add .

# 3. 提交修改
git commit -m "描述你做了什么修改"

# 4. 推送到 GitHub
git push
```

### 在电脑 B 上获取最新代码

```bash
# 进入项目目录
cd copy-excerpt-tool

# 拉取最新代码
git pull
```

**什么是拉取（pull）？**
- 从 GitHub 下载最新的代码
- 更新本地项目到最新版本

---

## 🎯 Git 常用命令速查表

| 命令 | 作用 | 什么时候用 |
|------|------|------------|
| `git status` | 查看当前状态 | 想知道改了哪些文件 |
| `git add .` | 添加所有修改到暂存区 | 准备提交之前 |
| `git commit -m "说明"` | 提交修改 | 完成一个功能或修复 |
| `git push` | 推送到 GitHub | 想把代码上传到 GitHub |
| `git pull` | 从 GitHub 拉取最新代码 | 想获取最新版本 |
| `git log` | 查看提交历史 | 想看之前做了什么 |
| `git diff` | 查看具体修改了什么 | 想看代码改动细节 |

---

## ❓ 常见问题

### Q1: 推送时出现 "Permission denied"
**原因**：没有权限推送到仓库
**解决**：
- 检查是否登录了正确的 GitHub 账号
- 如果使用 HTTPS，确保 Personal Access Token 正确
- 或者配置 SSH 密钥（更安全）

### Q2: 拉取时出现冲突（conflict）
**原因**：两台电脑修改了同一个文件的同一部分
**解决**：
```bash
# 1. 查看哪些文件有冲突
git status

# 2. 手动编辑冲突文件，选择保留哪个版本
# 文件中会有类似这样的标记：
# <<<<<<< HEAD
# 你的修改
# =======
# GitHub 上的修改
# >>>>>>> origin/main

# 3. 解决冲突后，添加并提交
git add .
git commit -m "解决冲突"
git push
```

### Q3: 不小心提交了不该提交的文件
**解决**：
```bash
# 从 Git 中移除文件，但保留本地文件
git rm --cached 文件名

# 提交这个删除操作
git commit -m "移除不需要的文件"
git push
```

### Q4: 想撤销最后一次提交
**解决**：
```bash
# 撤销提交，但保留修改
git reset --soft HEAD~1

# 或者，撤销提交和修改（危险！）
git reset --hard HEAD~1
```

---

## 💡 小贴士

1. **经常提交**：完成一个小功能就提交一次，不要等到做了很多改动才提交
2. **写清楚提交说明**：方便以后查看是什么时候改的什么
3. **先 pull 后 push**：开始工作前先拉取最新代码，避免冲突
4. **不要上传敏感信息**：API 密钥、密码等应该放在 `.env` 文件中，并加入 `.gitignore`

---

## 🎓 学习资源

- [Git 简明指南](https://rogerdudler.github.io/git-guide/index.zh.html)
- [GitHub 官方文档](https://docs.github.com/cn)
- [廖雪峰的 Git 教程](https://www.liaoxuefeng.com/wiki/896043488029600)

---

**祝你学习愉快！如果遇到问题，随时问我 😊**
