# 贡献指南

感谢你帮助改进 Markora。

## 开发环境

```bash
pnpm config set registry https://registry.npmmirror.com/
pnpm install
pnpm dev
```

如果 Electron 二进制下载缓慢：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm exec install-electron --no
```

## 质量检查

提交 Pull Request 前请运行：

```bash
pnpm lint
pnpm test
pnpm build:renderer
```

## Pull Request 规范

- 每次改动尽量聚焦在一个行为或功能区域。
- 尽可能保留并强化 Typora 风格的交互细节。
- 如果改动影响 Markdown 转换、编辑器命令、IPC 行为或 UI 流程，请添加有针对性的测试。
- 当阶段目标有实质变化时，更新 `docs/phase-reports/`。
- 避免无关的格式化改动。

## Typora 忠实度检查

修改编辑行为时，请重点和 Typora 对比以下方面：

- 渲染节点前后的光标移动。
- 输入时 Markdown 快捷语法的展开行为。
- 渲染后的间距、排版和表格行为。
- 菜单名称和快捷键习惯。
- Source Code Mode 往返后的 Markdown 输出。
