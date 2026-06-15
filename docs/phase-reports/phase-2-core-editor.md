# 阶段 2 报告：核心编辑器与 Markdown 渲染

日期：2026-06-15

## 已完成

- 添加 Markdown 引擎，支持 Markdown 到编辑器 HTML，以及编辑器 HTML 到 Markdown 的序列化。
- 将占位文档替换为真实 Markdown 示例。
- 添加真正的 Source Code Mode，背后使用 Markdown 文本，而不是单纯切换视觉字体。
- 为 YAML、KaTeX 数学公式、Mermaid 和 PlantUML 添加 Tiptap 自定义节点与 React NodeView。
- 将 `- [ ]` / `- [x]` Markdown 任务行转换为 Tiptap 任务列表节点。
- 为 Markdown 引擎和编辑器外壳添加测试。

## 验证

- `pnpm lint`：通过。
- `pnpm test`：通过，2 个文件、6 个测试。
- `pnpm build:renderer`：通过。
- 浏览器验证 `http://127.0.0.1:5173/`：通过。

浏览器观察结果：

- YAML Front Matter 可见。
- 任务列表渲染出 2 个复选框输入。
- 渲染出 1 个 KaTeX 行内公式。
- 渲染出 1 个 KaTeX 块级公式。
- 1 个 Mermaid 图表渲染为 SVG。
- 1 个 PlantUML 块被保留。
- Source Code Mode 显示 Mermaid 围栏代码和 LaTeX 源文本。
- 浏览器控制台无错误。

## Typora 忠实度说明

- 改进：Markdown 文件现在进入 WYSIWYG 编辑模型，不再被当作纯文本或通用 HTML。
- 改进：数学公式、图表、YAML 和任务列表现在具备编辑器原生表示。
- 仍未完成：原子节点周围精确的 Typora 光标行为、表格编辑控件、图片粘贴/拖放、完整 Markdown 快捷语法一致性、PlantUML 渲染服务和导出忠实度。

## 下一阶段

阶段 3 应聚焦高级编辑和文件管理：

- 真实文件夹/文件树。
- 强化打开、保存和另存为流程。
- 图片拖拽、粘贴、复制和相对路径处理。
- 表格编辑控件。
- 更好的 Callout 节点模型。
- Mermaid 刷新/编辑入口。
- 基于真实 Markdown fixture 的持久化测试。
