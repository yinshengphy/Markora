# Markora Context Summary

Last updated: 2026-06-16

## Goal

Build Markora, a Typora-faithful Markdown editor clone using Electron, React, TypeScript, Vite, Tiptap/ProseMirror, KaTeX, Mermaid, and electron-builder. The final target is a standard open-source project with Windows and macOS installers and a GitHub Release.

## Current State

- Phase 1 is complete: Electron/Vite/React/TypeScript scaffold, Typora-like titlebar, sidebar, outline, editor area, status bar, menus, themes, and packaging config.
- Phase 2 is complete: WYSIWYG Markdown editing, Markdown import/export conversion, source code mode, YAML front matter, task lists, KaTeX inline/block math, Mermaid rendering, PlantUML placeholder, and custom Tiptap NodeViews.
- Phase 3 is partially complete: file open/save/save-as, workspace folder scan, sidebar file filtering, image paste/drop/import, table insertion, contextual table controls, and dirty-state title updates.
- The repository has a `.git` directory but most files are still untracked.

## Validation Already Passing

- `pnpm lint`
- `pnpm test`
- `pnpm build:renderer`

## Important Commands

- Install registry mirror: `npm config set registry https://registry.npmmirror.com/`
- Install dependencies: `pnpm install`
- Run app UI: `pnpm dev`
- Renderer build: `pnpm build:renderer`
- macOS package: `pnpm dist:mac`
- Windows package: `pnpm dist:win`

If Electron download stalls, retry with:

```sh
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm exec install-electron --no
```

## Remaining Work

- Finish Phase 4: real HTML/PDF/Word export, shortcut coverage, theme fidelity, focus/Zen polish, and manual consistency notes.
- Finish Phase 5: generate and verify macOS and Windows installers where the host environment allows it.
- Finish Phase 6: standardize open-source docs, initialize commits, create/push GitHub repository, create Release, and upload installer assets. GitHub publishing may require user authentication if no usable token/session exists.
