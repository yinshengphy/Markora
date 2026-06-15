# Markora

Markora 是一款受 Typora 启发的桌面 Markdown 编辑器，基于 Electron、React、TypeScript、Vite 和 Tiptap/ProseMirror 构建。

项目目前处于分阶段开发中。当前版本已经实现桌面外壳、第一版 WYSIWYG 编辑模型、工作区文件管理、导出流程，以及一组不断扩展的 Typora 风格菜单和快捷键。

## 功能

- 类 Typora 的桌面外壳，支持 Electron 原生菜单。
- 三栏工作区：文件树、编辑页面、大纲和状态栏。
- 基于 Tiptap/ProseMirror 的 WYSIWYG Markdown 编辑。
- Source Code Mode，可直接编辑实时 Markdown 源文本。
- Markdown 导入和导出转换链路。
- 通过原生对话框打开文件、打开文件夹、保存和另存为。
- 扫描工作区 Markdown 文件并支持侧边栏过滤。
- 支持图片粘贴/拖放；在 Electron 中可导入为本地资源。
- 支持插入表格，并提供行、列、表格删除等上下文工具。
- YAML Front Matter 块渲染。
- 任务列表复选框渲染。
- KaTeX 行内公式和块级公式渲染。
- Mermaid 图表渲染为 SVG。
- PlantUML 围栏代码块保留，并显示可视化占位。
- GitHub、Newsprint 和 Night 主题基础。
- 专注模式、侧边栏切换、大纲切换和扩展格式化快捷键。
- 导出 HTML、PDF 和兼容 Word 的 `.doc` 文件。

## Typora 一致性

| 领域 | 当前状态 | 说明 |
| --- | --- | --- |
| WYSIWYG Markdown 编辑 | 部分完成 | 已实现核心输入和渲染文档模型；仍需打磨更多光标边界场景。 |
| Source Code Mode | 已实现 | 可通过 Markdown 转换链路往返。 |
| 数学公式 | 部分完成 | KaTeX 行内和块级渲染可用；还需测试更多分隔符兼容性。 |
| 图表 | 部分完成 | Mermaid 可渲染为 SVG；PlantUML 目前作为占位保留。 |
| 文件树 | 部分完成 | 支持文件夹扫描和打开 Markdown 文件。 |
| 图片 | 部分完成 | Electron 中支持粘贴/拖放和本地资源复制。 |
| 表格 | 部分完成 | 支持插入以及基础的增删行列和删除表格。 |
| 主题 | 部分完成 | 已有 GitHub、Newsprint 和 Night 基础；像素级一致性仍需精修。 |
| 导出 | 部分完成 | HTML/PDF/兼容 Word 的 `.doc` 导出可用；计划补充真正的 `.docx`。 |
| 打包 | 已配置并验证 | electron-builder 目标包括 macOS DMG/PKG 和 Windows NSIS/MSI。 |

## 开发

项目使用 `pnpm`，并按目标要求配置 npm 国内镜像。

```bash
pnpm config set registry https://registry.npmmirror.com/
pnpm install
pnpm dev
```

如果 Electron 二进制下载缓慢或卡住，可以重试：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm exec install-electron --no
```

## 验证

```bash
pnpm lint
pnpm test
pnpm build:renderer
```

## 打包

打包由 `electron-builder` 配置：

```bash
pnpm dist:mac
pnpm dist:win
```

macOS 安装包可在 macOS 上生成。Windows 安装包建议在 Windows 或 GitHub Actions 等具备完整 electron-builder 工具链的 CI 环境中验证。

## 项目结构

```text
electron/              Electron 主进程和 preload 代码
src/                   React 渲染进程、编辑器节点、测试和 Markdown 引擎
docs/phase-reports/    分阶段实现与验证报告
scripts/               依赖镜像和兼容性补丁脚本
public/                静态应用资源
build/                 应用图标等打包资源
```

## 开源发布

当前公开仓库为 <https://github.com/yinshengphy/Markora>。

`v0.1.0` Release 已包含：

- macOS DMG
- macOS PKG
- Windows NSIS EXE
- Windows MSI

## 许可证

MIT。详见 `LICENSE`。
