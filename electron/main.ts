import { app, BrowserWindow, Menu, dialog, ipcMain, nativeTheme, shell } from 'electron'
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

let mainWindow: BrowserWindow | null = null
let currentFilePath: string | null = null
let currentWorkspacePath: string | null = null

type WorkspaceFileEntry = {
  path: string
  name: string
  relativePath: string
}

type ExportFormat = 'html' | 'pdf' | 'doc'

type ExportPayload = {
  format: ExportFormat
  documentName: string
  markdown: string
  html: string
  css: string
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1160,
    height: 780,
    minWidth: 860,
    minHeight: 560,
    title: 'Untitled - Markora',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 13 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1f1f1f' : '#ffffff',
    webPreferences: {
      preload: fileURLToPath(new URL('./preload.mjs', import.meta.url)),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile('dist/index.html')
  }
}

const sendMenuAction = (action: string) => {
  mainWindow?.webContents.send('menu-action', action)
}

const updateTitle = (filePath: string | null, dirty = false) => {
  const name = filePath ? basename(filePath) : 'Untitled'
  mainWindow?.setTitle(`${dirty ? '*' : ''}${name} - Markora`)
}

const readWorkspaceMarkdownFiles = async (workspacePath: string) => {
  const entries: WorkspaceFileEntry[] = []
  const visit = async (directoryPath: string) => {
    const children = await readdir(directoryPath, { withFileTypes: true })

    for (const child of children) {
      if (child.name.startsWith('.') || child.name === 'node_modules') continue
      const childPath = join(directoryPath, child.name)

      if (child.isDirectory()) {
        await visit(childPath)
        continue
      }

      if (!child.isFile()) continue
      const extension = extname(child.name).toLowerCase()
      if (!['.md', '.markdown', '.mdown', '.mkd', '.txt'].includes(extension)) continue
      entries.push({
        path: childPath,
        name: child.name,
        relativePath: relative(workspacePath, childPath),
      })
    }
  }

  await visit(workspacePath)
  return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
}

const openMarkdownFile = async () => {
  if (!mainWindow) return
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'Text', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (result.canceled || !result.filePaths[0]) return
  currentFilePath = result.filePaths[0]
  currentWorkspacePath = dirname(currentFilePath)
  const markdown = await readFile(currentFilePath, 'utf8')
  updateTitle(currentFilePath)
  const payload = {
    path: currentFilePath,
    name: basename(currentFilePath),
    markdown,
  }
  mainWindow.webContents.send('file-opened', payload)
  return payload
}

const openWorkspace = async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })

  if (result.canceled || !result.filePaths[0]) return null
  currentWorkspacePath = result.filePaths[0]
  const files = await readWorkspaceMarkdownFiles(currentWorkspacePath)
  const payload = {
    path: currentWorkspacePath,
    name: basename(currentWorkspacePath),
    files,
  }
  mainWindow.webContents.send('workspace-opened', payload)
  if (files[0]) {
    currentFilePath = files[0].path
    const markdown = await readFile(currentFilePath, 'utf8')
    updateTitle(currentFilePath)
    mainWindow.webContents.send('file-opened', {
      path: currentFilePath,
      name: basename(currentFilePath),
      markdown,
    })
  }
  return payload
}

const readWorkspaceFile = async (_event: Electron.IpcMainInvokeEvent, filePath: string) => {
  const fileStats = await stat(filePath)
  if (!fileStats.isFile()) return null

  currentFilePath = filePath
  currentWorkspacePath = currentWorkspacePath ?? dirname(filePath)
  const markdown = await readFile(filePath, 'utf8')
  updateTitle(filePath)
  return { path: filePath, name: basename(filePath), markdown }
}

const saveMarkdownFile = async (_event: Electron.IpcMainInvokeEvent, markdown: string, saveAs = false) => {
  if (!mainWindow) return null

  if (!currentFilePath || saveAs) {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: currentFilePath ?? 'Untitled.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (result.canceled || !result.filePath) return null
    currentFilePath = result.filePath
    currentWorkspacePath = dirname(currentFilePath)
  }

  await writeFile(currentFilePath, markdown, 'utf8')
  updateTitle(currentFilePath)
  return { path: currentFilePath, name: basename(currentFilePath) }
}

const importAsset = async (_event: Electron.IpcMainInvokeEvent, sourcePath: string) => {
  if (!currentFilePath && !currentWorkspacePath) return null
  const assetDirectory = currentFilePath ? join(dirname(currentFilePath), 'assets') : join(currentWorkspacePath as string, 'assets')
  await mkdir(assetDirectory, { recursive: true })

  const targetPath = join(assetDirectory, basename(sourcePath))
  await copyFile(sourcePath, targetPath)
  const markdownBase = currentFilePath ? dirname(currentFilePath) : (currentWorkspacePath as string)
  return {
    path: targetPath,
    relativePath: relative(markdownBase, targetPath),
    name: basename(targetPath),
  }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const createExportHtml = (payload: ExportPayload) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(payload.documentName)}</title>
  <style>${payload.css}</style>
</head>
<body>
  <main class="markora-export">
${payload.html}
  </main>
</body>
</html>
`

const exportFilters: Record<ExportFormat, Electron.FileFilter[]> = {
  html: [{ name: 'HTML', extensions: ['html'] }],
  pdf: [{ name: 'PDF', extensions: ['pdf'] }],
  doc: [{ name: 'Word Document', extensions: ['doc'] }],
}

const exportExtensions: Record<ExportFormat, string> = {
  html: 'html',
  pdf: 'pdf',
  doc: 'doc',
}

const exportDocument = async (_event: Electron.IpcMainInvokeEvent, payload: ExportPayload) => {
  if (!mainWindow) return null
  const baseName = payload.documentName.replace(/\.[^.]+$/, '') || 'Untitled'
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `${baseName}.${exportExtensions[payload.format]}`,
    filters: exportFilters[payload.format],
  })
  if (result.canceled || !result.filePath) return null

  const html = createExportHtml(payload)
  if (payload.format === 'pdf') {
    const exportWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
      },
    })
    await exportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const pdf = await exportWindow.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'default' },
      pageSize: 'A4',
    })
    await writeFile(result.filePath, pdf)
    exportWindow.destroy()
  } else if (payload.format === 'doc') {
    const wordHtml = `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(payload.documentName)}</title><style>${payload.css}</style></head>
<body><main class="markora-export">${payload.html}</main></body>
</html>`
    await writeFile(result.filePath, wordHtml, 'utf8')
  } else {
    await writeFile(result.filePath, html, 'utf8')
  }

  return { path: result.filePath, name: basename(result.filePath), format: payload.format }
}

const buildMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => sendMenuAction('new') },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => void openMarkdownFile() },
        { label: 'Open Folder...', accelerator: 'CmdOrCtrl+Shift+O', click: () => void openWorkspace() },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendMenuAction('save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenuAction('save-as') },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            { label: 'HTML', click: () => sendMenuAction('export-html') },
            { label: 'PDF', click: () => sendMenuAction('export-pdf') },
            { label: 'Word (.doc)', click: () => sendMenuAction('export-doc') },
          ],
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { label: 'Bold', accelerator: 'CmdOrCtrl+B', click: () => sendMenuAction('toggle-bold') },
        { label: 'Italic', accelerator: 'CmdOrCtrl+I', click: () => sendMenuAction('toggle-italic') },
        { label: 'Strikethrough', accelerator: 'Alt+Shift+5', click: () => sendMenuAction('toggle-strike') },
        { label: 'Code', accelerator: 'CmdOrCtrl+Shift+`', click: () => sendMenuAction('toggle-code') },
        { label: 'Clear Style', accelerator: 'CmdOrCtrl+\\', click: () => sendMenuAction('clear-formatting') },
      ],
    },
    {
      label: 'Paragraph',
      submenu: [
        { label: 'Heading 1', accelerator: 'CmdOrCtrl+1', click: () => sendMenuAction('heading-1') },
        { label: 'Heading 2', accelerator: 'CmdOrCtrl+2', click: () => sendMenuAction('heading-2') },
        { label: 'Heading 3', accelerator: 'CmdOrCtrl+3', click: () => sendMenuAction('heading-3') },
        { label: 'Heading 4', accelerator: 'CmdOrCtrl+4', click: () => sendMenuAction('heading-4') },
        { label: 'Heading 5', accelerator: 'CmdOrCtrl+5', click: () => sendMenuAction('heading-5') },
        { label: 'Heading 6', accelerator: 'CmdOrCtrl+6', click: () => sendMenuAction('heading-6') },
        { label: 'Paragraph', accelerator: 'CmdOrCtrl+0', click: () => sendMenuAction('paragraph') },
        { type: 'separator' },
        { label: 'Bulleted List', accelerator: 'CmdOrCtrl+Shift+8', click: () => sendMenuAction('bullet-list') },
        { label: 'Numbered List', accelerator: 'CmdOrCtrl+Shift+7', click: () => sendMenuAction('ordered-list') },
        { label: 'Task List', accelerator: 'CmdOrCtrl+Shift+X', click: () => sendMenuAction('task-list') },
        { label: 'Quote', accelerator: 'CmdOrCtrl+Shift+Q', click: () => sendMenuAction('blockquote') },
        { label: 'Code Block', accelerator: 'CmdOrCtrl+Shift+K', click: () => sendMenuAction('code-block') },
      ],
    },
    {
      label: 'Insert',
      submenu: [
        { label: 'Table', accelerator: 'CmdOrCtrl+Alt+T', click: () => sendMenuAction('insert-table') },
        { label: 'Horizontal Rule', accelerator: 'CmdOrCtrl+Alt+-', click: () => sendMenuAction('horizontal-rule') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+Shift+L', click: () => sendMenuAction('toggle-sidebar') },
        { label: 'Toggle Outline', accelerator: 'CmdOrCtrl+Shift+O', click: () => sendMenuAction('toggle-outline') },
        { label: 'Focus Mode', accelerator: 'CmdOrCtrl+Shift+F', click: () => sendMenuAction('focus-mode') },
        { label: 'Source Code Mode', accelerator: 'CmdOrCtrl+/', click: () => sendMenuAction('source-mode') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'reload' },
      ],
    },
    {
      label: 'Themes',
      submenu: [
        { label: 'GitHub', type: 'radio', checked: true, click: () => sendMenuAction('theme-github') },
        { label: 'Newsprint', type: 'radio', click: () => sendMenuAction('theme-newsprint') },
        { label: 'Night', type: 'radio', click: () => sendMenuAction('theme-night') },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Markdown Reference', click: () => sendMenuAction('markdown-reference') },
        { label: 'About Markora', click: () => dialog.showMessageBox({ message: 'Markora', detail: 'Typora-inspired Markdown editor prototype.' }) },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  ipcMain.handle('open-markdown-file', openMarkdownFile)
  ipcMain.handle('open-workspace', openWorkspace)
  ipcMain.handle('read-workspace-file', readWorkspaceFile)
  ipcMain.handle('save-markdown', saveMarkdownFile)
  ipcMain.handle('import-asset', importAsset)
  ipcMain.handle('export-document', exportDocument)
  ipcMain.on('document-dirty', (_event, dirty: boolean) => updateTitle(currentFilePath, dirty))
  buildMenu()
  void createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow()
})
