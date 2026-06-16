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
- 修复安装版 preload 产物格式：`preload.cjs` 与主进程加载路径一致，避免安装后 `window.markora` 注入失败。
- 补齐 macOS 标准应用菜单，确保菜单栏包含 `Markora`、`File`、`Edit`、`Paragraph`、`Insert`、`View`、`Themes` 和 `Help`。
- `New` 现在会同时清空主进程当前文件路径，避免新建空白文档后保存覆盖原文件。
- `Close` 在 macOS 下会隐藏当前应用窗口，重新激活 Markora 后窗口恢复。

## 自动化验证

| 项目 | 结果 | 说明 |
| --- | --- | --- |
| ESLint | 通过 | `./node_modules/.bin/eslint .` |
| Vitest | 通过 | 2 个测试文件，12 个测试全部通过 |
| TypeScript 构建 | 通过 | `tsc -b` |
| Vite/Electron 构建 | 通过 | `vite build` 成功生成 `dist` 与 `dist-electron` |
| Electron 目录打包 | 通过 | `electron-builder --dir --publish never` 成功生成 `release/mac-arm64/Markora.app` |

## macOS 真实安装验证

使用本轮重新生成的 `release/Markora-0.1.0-arm64.dmg` 执行真实安装：

1. 退出并清理已有 Markora 进程。
2. 使用 `hdiutil attach` 挂载 DMG，CRC 校验通过。
3. 使用 `ditto` 将卷内 `Markora.app` 安装到 `/Applications/Markora.app`。
4. 使用 LaunchServices 执行 `open -a /Applications/Markora.app` 启动安装后的应用。
5. 使用 CoreGraphics 窗口列表验证 Markora 窗口 onscreen。
6. 使用 System Events 验证菜单栏包含独立 `File` 菜单。
7. 执行 `File > New`，窗口标题变为 `Untitled - Markora`。
8. 执行 `File > Close`，窗口从 onscreen 状态消失，进程保留。
9. 再次执行 `open -a /Applications/Markora.app`，窗口恢复 onscreen。
10. 检查最近 2 分钟系统日志，无 `preload`、`error`、`exception`、`unable` 相关错误。

本轮重新生成的 macOS 安装包：

| 文件 | 大小 | SHA-256 |
| --- | ---: | --- |
| `release/Markora-0.1.0-arm64.dmg` | 152 MB | `585c98aa4a1f45ffab83d98f175a5750ea93fbbbb561f67af533726aaa619d7c` |
| `release/Markora-0.1.0-arm64.pkg` | 153 MB | `8d9b5c9a1cf5965a26558bf6b604702fcd8ceb9eedc28abec81bca87580ca71f` |

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
- 安装版应用：已安装到 `/Applications/Markora.app` 并完成启动、菜单、新建、关闭和重新激活测试。

## Windows 安装包检查

- EXE：文件类型为 Windows PE GUI 可执行文件，识别为 Nullsoft Installer 自解压安装器。
- MSI：文件类型为 Windows MSI Installer，元数据包含 Markora、x64、WiX Toolset 信息。
- 受当前 macOS 环境限制，尚未执行 Windows 真实安装、开始菜单、桌面快捷方式和卸载入口验证。该项需要在 Windows 主机或 Windows CI 运行。

## 与 Typora 的差异

- 文件树操作已更接近 Typora，但仍缺少完整右键菜单、拖拽移动、文件监听自动刷新和更精细的错误提示。
- 查找/替换已具备基础能力，但还不是 Typora 级逐项查找、高亮当前匹配和大小写/正则选项。
- `.docx` 已是合法 OOXML 包，但当前主要保留文本、标题、列表和基础表格结构；图片、公式、图表和主题样式保真度仍需继续增强。
- macOS 安装包未签名，正式发布前仍需 Developer ID 签名与公证。
- 当前 `Close` 在 macOS 下采用隐藏窗口实现，以确保用户可见的关闭行为可靠；真正的多窗口关闭生命周期和未保存确认仍需后续打磨。

## 后续计划

- 增强文件树右键菜单、文件监听和异常处理。
- 将查找/替换升级为逐项定位、高亮和选项化搜索。
- 提升 `.docx` 导出对图片、表格、公式和 Mermaid/PlantUML 的保真度。
- 在 Windows 环境执行真实安装和安装后系统测试。
- 生成新版本安装包并创建新的 GitHub Release。
