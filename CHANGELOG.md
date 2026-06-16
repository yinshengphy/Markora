# 变更日志

Markora 的重要变更都会记录在此文件中。

## 0.1.0 - 2026-06-16

### 新增

- 工作区文件树增强：目录层级展示、文件夹展开/折叠、新建文件、新建文件夹、重命名、删除和刷新入口。
- 查找/替换面板：支持在当前 Markdown 文档中统计匹配项并执行全量替换。
- 真正 `.docx` 导出入口：新增 Word `.docx` 菜单项，并写出 Office Open XML 文档包。
- Release 安装包下载校验报告：记录 macOS DMG/PKG、Windows EXE/MSI 的下载、哈希、文件类型和 macOS 侧检查结果。
- macOS 真实安装验证：使用新生成 DMG 安装到 `/Applications/Markora.app`，验证启动、标准 File 菜单、新建和关闭窗口行为。
- 初始 Electron、React、TypeScript 和 Vite 应用脚手架。
- 类 Typora 外壳：标题栏、侧边栏、编辑页面、大纲、状态栏、菜单、主题和专注模式。
- Tiptap/ProseMirror WYSIWYG Markdown 编辑器。
- Markdown 转换链路和 Source Code Mode。
- YAML Front Matter、任务列表、KaTeX 数学公式、Mermaid 图表和 PlantUML 占位渲染。
- 打开文件、打开文件夹、保存、另存为、工作区扫描、图片粘贴/拖放和本地资源导入。
- 表格插入和上下文表格编辑工具。
- HTML、PDF、兼容 Word 的 `.doc` 和基础 `.docx` 导出。
- 自动化 lint、单元测试、渲染进程构建和浏览器冒烟验证。
- macOS DMG/PKG 与 Windows NSIS/MSI Release 构建流程。

### 修复

- 修复安装版 preload 被输出为 `.mjs` 但内部使用 `require`，导致 `window.markora` 注入失败的问题。
- 修复 macOS 菜单缺少独立 `File` 菜单的问题，现在会先注册标准应用菜单，再注册 File/Edit 等菜单。
- 修复 `New` 只清空渲染层、不清空主进程当前文件路径的问题，避免新建后保存覆盖旧文件。
- 修复 `Close` 基础行为：macOS 下关闭当前窗口会隐藏应用窗口，并可通过重新激活 Markora 恢复窗口。
