# 阶段 5 报告：打包

日期：2026-06-16

## 已完成

- 添加 `scripts/patch-electron-get-cache-mode.mjs`，规避 `electron-builder@26.15.3` 与 `@electron/get@3` 的兼容性问题。
- 成功生成未签名的 macOS ARM64 安装包：
  - `release/Markora-0.1.0-arm64.dmg`
  - `release/Markora-0.1.0-arm64.pkg`
- 确认打包后的应用位于 `release/mac-arm64/Markora.app`。
- 添加 `.github/workflows/release.yml`，在原生 GitHub Actions runner 上构建 macOS 和 Windows 安装包，并发布 Release 资产。
- 将 Windows 打包脚本更新为面向标准分发的 x64 安装包。
- 添加应用图标资源，供 macOS 和 Windows 打包使用。
- 禁用 electron-builder 在 CI 中的隐式发布，改由 GitHub Actions 统一上传 Release 资产。

## 验证

- `pnpm lint`：通过
- `pnpm test`：通过，8 个测试
- `pnpm build:renderer`：通过
- `pnpm dist:mac`：通过
- 浏览器冒烟检查：通过
  - 编辑器可渲染
  - YAML 可渲染
  - 行内数学公式可渲染
  - Mermaid 块可渲染
  - Source Code Mode 可打开真实 Markdown
  - 插入表格后显示表格工具
- GitHub Actions 发布工作流：通过
  - macOS DMG/PKG 构建并上传
  - Windows NSIS EXE/MSI 构建并上传
  - GitHub Release 创建成功

## Windows 打包结果

`pnpm dist:win` 和仅 NSIS 的重试都能进入 Windows 应用打包阶段，但在本机 macOS ARM 环境中无法完成最终安装器生成：

- MSI：Wine 执行失败，错误为 `spawn Unknown system error -86`。
- NSIS：`makensis` 执行失败，错误为 `spawn Unknown system error -86`。

这是下载的 Windows 打包工具在 macOS ARM 上的执行架构限制，不是渲染进程或 Electron 应用构建失败。GitHub Actions 工作流在 `windows-latest` 上原生构建 Windows 资产，NSIS 和 WiX 可以正常运行。

## 阻塞项

- 本机 macOS ARM 无法在没有兼容 Wine/NSIS 工具链的情况下完成 Windows `.exe` 和 `.msi` 安装器生成。
- macOS 安装包未签名、未公证，因为当前环境没有安装 Apple Developer ID 证书。

## 下一步

继续提升 Typora 忠实度、完善文档、补充代码签名/公证配置，并扩展自动化一致性测试。
