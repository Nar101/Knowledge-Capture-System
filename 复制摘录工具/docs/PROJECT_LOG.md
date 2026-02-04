# 项目集记录｜剪贴板摘录工具（知识捕获系统）

最后更新：2026-02-04

## 1. 项目目标（PRD v1.0 摘要）
- 剪贴板驱动的知识捕获系统（macOS）。
- 用户在浏览器/其他 App 复制内容，系统自动按来源归类为“笔记”。
- 笔记内按顺序保存文本/图片。
- 描述栏固定包含：摘要 + 作者 + 时间 + 关键词。
- 支持一键复制整篇笔记（Markdown）。
- 支持“收藏网页”（稍后读列表，独立于笔记）。

## 2. 当前实现状态（已完成）
### 2.1 数据模型（SQLite）
- notes：note_key、title、summary、author、publish_time、keywords、source_url、source_app、source_window、created_at、updated_at。
- clips：note_id、sequence、type、content_text、image_path、ocr_text、created_at。
- bookmarks：url、title、created_at。
- FTS：对 clips 的 content_text/ocr_text 建索引。

### 2.2 捕获逻辑
- 剪贴板轮询捕获（文本 + 图片）。
- 浏览器（Chrome/Safari）：同 URL（标准化）归同一笔记。
- 非浏览器：App 名 + 窗口标题归同一笔记。
- 去重：文本/图片 hash + 30s 窗口。
- 新 clip 入库后进入处理队列。

### 2.3 描述栏生成
- 摘要：正文前 2 句。
- 关键词：简单 TF 统计。
- 作者/时间：网页 meta 读取。
- 若是网页笔记，会尝试抓取正文并刷新摘要/关键词。

### 2.4 UI 与交互
- 移除小窗口，仅保留主界面 + 菜单栏托盘。
- 主界面结构：左侧笔记/收藏切换；右侧笔记详情；顶部搜索 + 一键复制按钮。
- 收藏列表独立展示，点击可跳浏览器。
- 菜单栏支持：捕获开关/状态、立即捕获、收藏当前网页、打开主界面。
- 快捷键：
  - `⌘ + Shift + X` 立即捕获
  - `⌘ + Shift + H` 暂停/恢复捕获

### 2.5 一键复制（Markdown）
- 输出格式：标题、URL、作者、时间、关键词、摘要 + clips 按顺序输出。

## 3. 关键技术决策
- 平台仅 macOS。
- Electron + React + Vite。
- SQLite（sql.js）本地库 + FTS。
- OCR：保持现有 OCR 工具链（Vision CLI）。
- URL 标准化：去 hash，移除 utm/ref/fbclid/gclid 等参数。

## 4. 已知问题 / 风险
- 网页正文抓取依赖网络请求，可能被反爬或超时。
- 作者/时间 meta 质量依赖网站规范。
- 旧库迁移时可能存在重复 note_key（已修复迁移逻辑）。

## 5. 下一步计划（待办）
- UI 进一步对齐 PRD：优化笔记列表信息密度与空状态提示。
- 收藏列表支持搜索/筛选。
- 完善“描述栏”渲染样式和更新节奏。
- 增加手动合并/拆分笔记的入口（后续可选）。

## 6. 测试与验收记录
- ✅ 同 URL 文本 + 图片 -> 同一笔记
- ✅ 笔记内顺序与复制顺序一致
- ✅ 一键复制输出 Markdown
- ✅ 收藏列表可跳浏览器
- ✅ 非浏览器按 App + 窗口标题归类
