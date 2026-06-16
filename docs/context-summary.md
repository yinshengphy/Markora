# Markora 上下文摘要

最后更新：2026-06-16

## 目标

构建 Markora：一个尽可能忠实于 Typora 的 Markdown 编辑器克隆，技术栈为 Electron、React、TypeScript、Vite、Tiptap/ProseMirror、KaTeX、Mermaid 和 electron-builder。最终目标是形成标准开源项目，提供 Windows 和 macOS 安装包，并发布到 GitHub Release。

## 当前状态

- 阶段 1 已完成：Electron/Vite/React/TypeScript 脚手架、类 Typora 标题栏、侧边栏、大纲、编辑区、状态栏、菜单、主题和打包配置。
- 阶段 2 已完成：WYSIWYG Markdown 编辑、Markdown 导入/导出转换、Source Code Mode、YAML Front Matter、任务列表、KaTeX 行内/块级公式、Mermaid 渲染、PlantUML 占位和自定义 Tiptap NodeView。
- 阶段 3 已进一步推进：打开/保存/另存为、工作区文件夹扫描、目录树展示、文件夹展开/折叠、文件/文件夹新建、重命名、删除、刷新、侧边栏过滤、图片粘贴/拖放/导入、表格插入、上下文表格工具和脏状态标题更新。
- 阶段 4 已进一步推进：HTML/PDF/兼容 Word 的 `.doc` 导出、基础 `.docx` 导出、查找/替换面板、更多菜单命令、更多快捷键入口和视图 polish。
- 阶段 5 已完成首轮打包链路：本地 macOS ARM64 DMG/PKG 可生成，GitHub Actions 可生成 macOS 与 Windows Release 资产。
- 阶段 6 已完成首轮开源发布：仓库已推送到 GitHub，并创建 `v0.1.0` Release。

## 已通过验证

- `pnpm lint`
- `pnpm test`
- `pnpm build:renderer`
- `electron-builder --dir --publish never`
- `pnpm dist:mac`
- GitHub Actions 发布工作流
- Release 资产下载校验：macOS DMG/PKG 与 Windows EXE/MSI 均可下载且文件类型正确。

## 重要命令

- 设置 registry 镜像：`pnpm config set registry https://registry.npmmirror.com/`
- 安装依赖：`pnpm install`
- 启动开发界面：`pnpm dev`
- 构建渲染进程：`pnpm build:renderer`
- 生成 macOS 安装包：`pnpm dist:mac`
- 生成 Windows 安装包：`pnpm dist:win`

如果 Electron 下载卡住，可重试：

```sh
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm exec install-electron --no
```

## 后续工作

- 继续提升 Typora 忠实度：光标边界行为、Markdown 输入快捷展开、表格浮层、图片路径策略、偏好设置和完整快捷键矩阵。
- 继续增强 `.docx` 保真度、PlantUML 渲染服务和更完整的 Typora 级文件树交互。
- 为 macOS/Windows 增加正式代码签名与公证。
- 扩展自动化测试，加入更系统的 Typora 对比用例。
