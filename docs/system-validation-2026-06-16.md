# Markora 系统验证报告 - 2026-06-16

## 验证范围

本轮验证覆盖 Markora 第一轮忠实度打磨后的核心功能、自动化测试、本机打包、Release 安装包下载和 macOS 侧安装包结构检查。

## 本轮实现

- 文件树从平铺列表升级为目录树，支持文件夹展开与折叠。
- 侧边栏新增新建文件、新建文件夹、重命名当前文件、删除当前文件和刷新文件树入口。
- Electron 主进程新增工作区刷新、创建、重命名和删除 IPC，并限制操作不能越出当前工作区。
- 新增查找/替换面板，支持当前 Markdown 文档匹配统计和全量替换。
- 导出菜单新增 Word `.docx`，主进程生成基础 Office Open XML 文档包。
- HTML 导出语言标记调整为 `zh-CN`。

## 自动化验证

| 项目 | 结果 | 说明 |
| --- | --- | --- |
| ESLint | 通过 | `./node_modules/.bin/eslint .` |
| Vitest | 通过 | 2 个测试文件，9 个测试全部通过 |
| TypeScript 构建 | 通过 | `tsc -b` |
| Vite/Electron 构建 | 通过 | `vite build` 成功生成 `dist` 与 `dist-electron` |
| Electron 目录打包 | 通过 | `electron-builder --dir --publish never` 成功生成 `release/mac-arm64/Markora.app` |

## Release 资产下载验证

从 GitHub Release `v0.1.0` 下载以下资产并校验文件存在、大小合理、类型正确：

| 文件 | 大小 | SHA-256 |
| --- | ---: | --- |
| `Markora-0.1.0-arm64.dmg` | 152 MB | `f1b785e8f850fe0ffeaed7f90d975e3dc708543d45d4bd4258cec507e6b21f4b` |
| `Markora-0.1.0-arm64.pkg` | 153 MB | `5ecbbe3f43e496f105c457df3a69caceac47660ee86da6f9caa3d1c35b2536f0` |
| `Markora.0.1.0.msi` | 141 MB | `cd41e62c2b6d335a27e3d76ef902455c166f1fd05c47c41fb1945605299c8187` |
| `Markora.Setup.0.1.0.exe` | 127 MB | `c7595a6aa24b80b12e66bb7da9bc7d334f6d5ca55a9d166ab109103cf86b7f86` |

## macOS 安装包检查

- DMG：`hdiutil attach -nobrowse -readonly` 挂载成功，CRC 校验通过，卷内包含 `Markora.app`。
- PKG：`pkgutil --check-signature` 显示未签名，`pkgutil --expand-full` 可成功展开。
- 本机目录打包应用：`release/mac-arm64/Markora.app/Contents/MacOS/Markora` 短启动 5 秒无错误输出。

## Windows 安装包检查

- EXE：文件类型为 Windows PE GUI 可执行文件，识别为 Nullsoft Installer 自解压安装器。
- MSI：文件类型为 Windows MSI Installer，元数据包含 Markora、x64、WiX Toolset 信息。
- 受当前 macOS 环境限制，尚未执行 Windows 真实安装、开始菜单、桌面快捷方式和卸载入口验证。该项需要在 Windows 主机或 Windows CI 运行。

## 与 Typora 的差异

- 文件树操作已更接近 Typora，但仍缺少完整右键菜单、拖拽移动、文件监听自动刷新和更精细的错误提示。
- 查找/替换已具备基础能力，但还不是 Typora 级逐项查找、高亮当前匹配和大小写/正则选项。
- `.docx` 已是合法 OOXML 包，但当前主要保留文本、标题、列表和基础表格结构；图片、公式、图表和主题样式保真度仍需继续增强。
- macOS 安装包未签名，正式发布前仍需 Developer ID 签名与公证。

## 后续计划

- 增强文件树右键菜单、文件监听和异常处理。
- 将查找/替换升级为逐项定位、高亮和选项化搜索。
- 提升 `.docx` 导出对图片、表格、公式和 Mermaid/PlantUML 的保真度。
- 在 Windows 环境执行真实安装和安装后系统测试。
- 生成新版本安装包并创建新的 GitHub Release。
