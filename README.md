# Markora

Markora is a Typora-inspired desktop Markdown editor built with Electron, React, TypeScript, Vite, and Tiptap/ProseMirror.

The project is in active staged development. The current build implements the desktop shell, the first WYSIWYG editing model, workspace file management, export flows, and a growing set of Typora-style menus and shortcuts.

## Features

- Typora-like desktop shell with native Electron menus.
- Three-pane workspace with file tree, editor page, outline, and status bar.
- WYSIWYG Markdown editing through Tiptap/ProseMirror.
- Source Code Mode with live Markdown source.
- Markdown import/export conversion.
- File open, folder open, save, and save-as through native dialogs.
- Workspace Markdown file scanning and sidebar filtering.
- Image paste/drop support with local asset import in Electron.
- Table insertion and contextual row/column/table controls.
- YAML front matter block rendering.
- Task list checkbox rendering.
- KaTeX inline and block math rendering.
- Mermaid diagram rendering to SVG.
- PlantUML fenced block preservation with a visual placeholder.
- GitHub, Newsprint, and Night theme foundations.
- Focus mode, sidebar toggle, outline toggle, and expanded formatting shortcuts.
- HTML, PDF, and Word-compatible `.doc` export.

## Typora Parity

| Area | Current Status | Notes |
| --- | --- | --- |
| WYSIWYG Markdown editing | Partial | Core typing and rendered document model are implemented; more cursor-edge cases remain. |
| Source Code Mode | Implemented | Round-trips through the Markdown conversion pipeline. |
| Math | Partial | KaTeX inline and block rendering works; more delimiter compatibility should be tested. |
| Diagrams | Partial | Mermaid renders to SVG; PlantUML is preserved as a placeholder. |
| File tree | Partial | Folder scanning and Markdown file opening work. |
| Images | Partial | Paste/drop and local asset copying work in Electron. |
| Tables | Partial | Insertion and basic row/column/delete tools work. |
| Themes | Partial | GitHub, Newsprint, and Night foundations exist; pixel-level fidelity needs refinement. |
| Export | Partial | HTML/PDF/Word-compatible `.doc` export works; true `.docx` is planned. |
| Packaging | Configured | electron-builder targets macOS DMG/PKG and Windows NSIS/MSI. |

## Development

This project uses `pnpm` and the npm mirror required by the project goal.

```bash
pnpm config set registry https://registry.npmmirror.com/
pnpm install
pnpm dev
```

If Electron binary download is slow or stalls:

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm exec install-electron --no
```

## Verification

```bash
pnpm lint
pnpm test
pnpm build:renderer
```

## Packaging

Packaging is configured through `electron-builder`:

```bash
pnpm dist:mac
pnpm dist:win
```

macOS packaging can be produced on macOS. Windows installer verification is best performed on Windows or CI with the required electron-builder toolchain.

## Project Structure

```text
electron/              Electron main and preload process code
src/                   React renderer, editor nodes, tests, and Markdown engine
docs/phase-reports/    Stage-by-stage implementation and verification reports
scripts/               Dependency mirror setup helpers
public/                Static app assets
```

## License

MIT. See `LICENSE`.
