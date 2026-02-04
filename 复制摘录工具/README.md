# 📋 Snippet Collector Pro

> 本地优先的个人知识捕获系统（macOS）｜捕获、理解、检索、关联

![Platform](https://img.shields.io/badge/platform-macOS-blue)
![Electron](https://img.shields.io/badge/electron-39.x-green)
![License](https://img.shields.io/badge/license-ISC-orange)

---

## ✨ 核心功能

### 🚀 一键摘录（无感）
选中任意文字或截图，按下 `⌘ + Shift + X`，自动收集到知识库

### 🧠 AI 自动理解
自动生成摘要、关键词、主题与 Markdown 引用格式

### 🔍 全局搜索 + 语义检索
关键词检索 + 语义检索混合排序，快速找回

### 🔗 关联推荐
基于语义相似度自动提示相关旧笔记

### 🏷️ 标签系统
手动标签 + 智能集合

### 🖼️ 图片 OCR
图片自动识别文本并加入检索

### 💾 本地优先
数据全部保存在本地知识库，默认离线

---

## �️ 安装

### 方式一：直接运行 DMG
下载 `dist/` 目录中的 `.dmg` 文件，拖拽到 Applications 即可

### 方式二：从源码运行
```bash
# 克隆项目
git clone <repo-url>
cd snippet-collector

# 安装依赖
npm install

# 启动应用
npm start
```

---

## ⌨️ 快捷键

| 操作 | 快捷键 |
|------|--------|
| 摘录内容 | `⌘ + Shift + X` |
| 隐藏窗口 | 点击红色按钮 |
| 切换笔记 | 点击侧边栏 |

---

## 🔐 权限设置

首次运行需授权：

**系统设置 → 隐私与安全性 → 辅助功能** → 开启权限

> ⚠️ 未授权将无法捕获前台应用内容

---

## 🛠️ 开发

```bash
# 开发模式（Vite + Electron）
npm run dev

# 打包 DMG
npm run dist

# 仅打包目录
npm run pack
```

---

## 📁 项目结构

```
snippet-collector/
├── src/main/          # Electron 主进程
├── src/renderer/      # React + Vite 前端
├── tools/             # OCR 工具
├── package.json       # 项目配置
└── dist/              # 打包输出
```

---

## 📦 技术栈

- **Electron** - macOS 桌面应用
- **React + Vite** - 知识库界面
- **SQLite + FTS** - 本地检索
- **Vision OCR** - 图片识别（macOS）

---

## 📄 License

ISC © Snippet Collector User
