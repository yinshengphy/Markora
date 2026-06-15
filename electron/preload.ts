import { contextBridge, ipcRenderer } from 'electron'

export type OpenedMarkdownFile = {
  path: string
  name: string
  markdown: string
}

export type SavedMarkdownFile = {
  path: string
  name: string
}

export type WorkspaceFileEntry = {
  path: string
  name: string
  relativePath: string
}

export type OpenedWorkspace = {
  path: string
  name: string
  files: WorkspaceFileEntry[]
}

export type ImportedAsset = {
  path: string
  relativePath: string
  name: string
}

export type ExportFormat = 'html' | 'pdf' | 'doc'

export type ExportPayload = {
  format: ExportFormat
  documentName: string
  markdown: string
  html: string
  css: string
}

export type ExportedDocument = {
  path: string
  name: string
  format: ExportFormat
}

const api = {
  onMenuAction: (callback: (action: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('menu-action', listener)
    return () => {
      ipcRenderer.removeListener('menu-action', listener)
    }
  },
  onFileOpened: (callback: (file: OpenedMarkdownFile) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, file: OpenedMarkdownFile) => callback(file)
    ipcRenderer.on('file-opened', listener)
    return () => {
      ipcRenderer.removeListener('file-opened', listener)
    }
  },
  onWorkspaceOpened: (callback: (workspace: OpenedWorkspace) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, workspace: OpenedWorkspace) => callback(workspace)
    ipcRenderer.on('workspace-opened', listener)
    return () => {
      ipcRenderer.removeListener('workspace-opened', listener)
    }
  },
  openMarkdownFile: () => ipcRenderer.invoke('open-markdown-file') as Promise<OpenedMarkdownFile | null>,
  openWorkspace: () => ipcRenderer.invoke('open-workspace') as Promise<OpenedWorkspace | null>,
  readWorkspaceFile: (path: string) => ipcRenderer.invoke('read-workspace-file', path) as Promise<OpenedMarkdownFile | null>,
  saveMarkdown: (markdown: string, saveAs?: boolean) => ipcRenderer.invoke('save-markdown', markdown, saveAs) as Promise<SavedMarkdownFile | null>,
  importAsset: (path: string) => ipcRenderer.invoke('import-asset', path) as Promise<ImportedAsset | null>,
  exportDocument: (payload: ExportPayload) => ipcRenderer.invoke('export-document', payload) as Promise<ExportedDocument | null>,
  setDocumentDirty: (dirty: boolean) => ipcRenderer.send('document-dirty', dirty),
}

contextBridge.exposeInMainWorld('markora', api)

export type MarkoraApi = typeof api
