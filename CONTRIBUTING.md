# Contributing

Thanks for helping improve Markora.

## Development Setup

```bash
pnpm config set registry https://registry.npmmirror.com/
pnpm install
pnpm dev
```

If Electron binary download is slow:

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm exec install-electron --no
```

## Quality Checks

Run these before opening a pull request:

```bash
pnpm lint
pnpm test
pnpm build:renderer
```

## Pull Request Guidelines

- Keep changes scoped to one behavior or feature area.
- Preserve Typora-like interaction details wherever possible.
- Add focused tests for Markdown conversion, editor commands, IPC behavior, or UI flows touched by the change.
- Update `docs/phase-reports/` when a staged goal changes materially.
- Avoid unrelated formatting churn.

## Typora Fidelity Notes

When changing editor behavior, compare against Typora in these areas:

- Cursor movement before and after rendered Markdown nodes.
- Markdown shortcut expansion while typing.
- Rendered spacing, typography, and table behavior.
- Menu labels and shortcut conventions.
- Source Code Mode round-trip output.
