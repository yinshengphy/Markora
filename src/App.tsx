import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Typography from '@tiptap/extension-typography'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Code2,
  Columns3,
  FileText,
  FilePlus,
  Focus,
  FolderPlus,
  FolderOpen,
  Hash,
  ImagePlus,
  Download,
  PanelLeft,
  PanelRight,
  Rows3,
  Save,
  Search,
  Pencil,
  RefreshCw,
  Replace,
  Table2,
  Trash2,
} from 'lucide-react'
import type { ExportFormat, OpenedMarkdownFile, OpenedWorkspace, WorkspaceFileEntry } from '../electron/preload'
import { DiagramBlock, MathBlock, MathInline, YamlFrontMatter } from './editor/markdownNodes'
import { fileToDataUrl, imageFilesFromList } from './lib/fileAssets'
import { htmlToMarkdown, markdownToHtml, welcomeMarkdown } from './lib/markdownEngine'
import './App.css'

type ThemeName = 'github' | 'newsprint' | 'night'
type OutlineHeading = { level: number; text: string }
type OutlineDoc = {
  descendants: (callback: (node: { type: { name: string }; attrs: { level?: number }; textContent: string }) => void) => void
}

const defaultFiles: WorkspaceFileEntry[] = [
  { name: 'Welcome.md', path: 'welcome.md', relativePath: 'Welcome.md', type: 'file' },
  { name: 'Daily Notes.md', path: 'daily-notes.md', relativePath: 'Daily Notes.md', type: 'file' },
  { name: 'Research.md', path: 'research.md', relativePath: 'Research.md', type: 'file' },
  { name: 'Export Checklist.md', path: 'export-checklist.md', relativePath: 'Export Checklist.md', type: 'file' },
]

const collectOutline = (doc: OutlineDoc) => {
  const headings: OutlineHeading[] = []
  doc.descendants((node) => {
    if (node.type.name === 'heading') {
      headings.push({ level: node.attrs.level ?? 1, text: node.textContent || 'Untitled' })
    }
  })
  return headings
}

const flattenWorkspaceFiles = (entries: WorkspaceFileEntry[]): WorkspaceFileEntry[] =>
  entries.flatMap((entry) => (entry.type === 'directory' ? flattenWorkspaceFiles(entry.children ?? []) : [entry]))

const filterWorkspaceEntries = (entries: WorkspaceFileEntry[], query: string): WorkspaceFileEntry[] => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return entries

  return entries.flatMap((entry) => {
    const children = entry.children ? filterWorkspaceEntries(entry.children, query) : []
    if (entry.relativePath.toLowerCase().includes(normalizedQuery) || children.length) {
      return [{ ...entry, children }]
    }
    return []
  })
}

const countMatches = (source: string, query: string) => {
  if (!query) return 0
  return source.toLowerCase().split(query.toLowerCase()).length - 1
}

const replaceAllLiteral = (source: string, query: string, replacement: string) =>
  query ? source.replaceAll(query, replacement) : source

const exportCss = `
body {
  margin: 0;
  color: #24292f;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.65;
}
.markora-export {
  width: min(780px, calc(100vw - 64px));
  margin: 48px auto;
  font-size: 16px;
}
.markora-export h1,
.markora-export h2,
.markora-export h3 {
  line-height: 1.25;
  margin: 1.5em 0 0.65em;
}
.markora-export img {
  max-width: 100%;
}
.markora-export table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}
.markora-export th,
.markora-export td {
  border: 1px solid #d0d7de;
  padding: 6px 10px;
}
.markora-export pre,
.markora-export code {
  font-family: "SFMono-Regular", Consolas, monospace;
}
.markora-export pre {
  overflow: auto;
  padding: 14px 16px;
  border-radius: 6px;
  background: #f6f8fa;
}
.markora-export blockquote {
  margin-left: 0;
  padding-left: 16px;
  color: #57606a;
  border-left: 4px solid #d0d7de;
}
`

function App() {
  const [theme, setTheme] = useState<ThemeName>('github')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [outlineOpen, setOutlineOpen] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceMarkdown, setSourceMarkdown] = useState(welcomeMarkdown)
  const [documentName, setDocumentName] = useState('Welcome.md')
  const [activeFilePath, setActiveFilePath] = useState('welcome.md')
  const [workspaceName, setWorkspaceName] = useState('Sample Workspace')
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFileEntry[]>(defaultFiles)
  const [fileSearch, setFileSearch] = useState('')
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [findPanelOpen, setFindPanelOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [dirty, setDirty] = useState(false)
  const [outline, setOutline] = useState<OutlineHeading[]>([])
  const editorReady = useRef(false)

  const openWorkspace = useCallback((workspace: OpenedWorkspace) => {
    setWorkspaceName(workspace.name)
    setWorkspaceFiles(workspace.files)
    const firstFile = flattenWorkspaceFiles(workspace.files)[0]
    if (firstFile) setActiveFilePath(firstFile.path)
  }, [])

  const editor = useEditor({
    extensions: [
      YamlFrontMatter,
      DiagramBlock,
      MathInline,
      MathBlock,
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Placeholder.configure({ placeholder: 'Write with Markdown shortcuts...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true }),
      Typography,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: markdownToHtml(welcomeMarkdown),
    autofocus: true,
    editorProps: {
      attributes: {
        class: 'markora-page',
        spellcheck: 'true',
      },
    },
    onCreate: ({ editor }) => {
      setOutline(collectOutline(editor.state.doc))
      queueMicrotask(() => {
        editorReady.current = true
      })
    },
    onUpdate: ({ editor }) => {
      setOutline(collectOutline(editor.state.doc))
      if (!editorReady.current) return
      if (!sourceMode) {
        setSourceMarkdown(htmlToMarkdown(editor.getHTML()))
      }
      setDirty(true)
      window.markora?.setDocumentDirty(true)
    },
  })

  const openDocument = useCallback((file: OpenedMarkdownFile) => {
    setSourceMarkdown(file.markdown)
    editorReady.current = false
    editor?.commands.setContent(markdownToHtml(file.markdown))
    queueMicrotask(() => {
      editorReady.current = true
    })
    setDocumentName(file.name)
    setActiveFilePath(file.path)
    setDirty(false)
    window.markora?.setDocumentDirty(false)
  }, [editor])

  const currentMarkdown = useCallback(() => {
    if (!editor) return sourceMarkdown
    return sourceMode ? sourceMarkdown : htmlToMarkdown(editor.getHTML())
  }, [editor, sourceMarkdown, sourceMode])

  const applyWorkspaceMutation = useCallback((result: Awaited<ReturnType<NonNullable<typeof window.markora>['createWorkspaceEntry']>> | null) => {
    if (!result) return
    setWorkspaceName(result.name)
    setWorkspaceFiles(result.files)
    if (result.activeFile) openDocument(result.activeFile)
  }, [openDocument])

  const saveDocument = useCallback(async () => {
    if (!editor) return
    const markdown = currentMarkdown()
    const result = await window.markora?.saveMarkdown(markdown)
    if (result) {
      setDocumentName(result.name)
      setActiveFilePath(result.path)
      setDirty(false)
      window.markora?.setDocumentDirty(false)
    }
  }, [currentMarkdown, editor])

  const exportDocument = useCallback(async (format: ExportFormat) => {
    if (!editor) return
    const markdown = currentMarkdown()
    const html = sourceMode ? markdownToHtml(sourceMarkdown) : editor.getHTML()
    await window.markora?.exportDocument({
      format,
      documentName,
      markdown,
      html,
      css: exportCss,
    })
  }, [currentMarkdown, documentName, editor, sourceMarkdown, sourceMode])

  const runAction = useCallback(
    (action: string) => {
      if (!editor) return
      const chain = editor.chain().focus()
      const actions: Record<string, () => void> = {
        new: () => {
          void window.markora?.newDocument?.()
          editorReady.current = false
          editor.commands.setContent('')
          queueMicrotask(() => {
            editorReady.current = true
          })
          setSourceMarkdown('')
          setDocumentName('Untitled.md')
          setActiveFilePath('untitled.md')
          setDirty(false)
          window.markora?.setDocumentDirty(false)
        },
        'close-document': () => {
          void window.markora?.closeDocument?.()
          editorReady.current = false
          editor.commands.setContent('')
          queueMicrotask(() => {
            editorReady.current = true
          })
          setSourceMarkdown('')
          setDocumentName('Untitled.md')
          setActiveFilePath('')
          setDirty(false)
          window.markora?.setDocumentDirty(false)
        },
        'close-window': () => void window.markora?.closeWindow?.(),
        save: () => void saveDocument(),
        'save-as': () => {
          const markdown = currentMarkdown()
          void window.markora?.saveMarkdown(markdown, true).then((result) => {
            if (!result) return
            setDocumentName(result.name)
            setActiveFilePath(result.path)
            setDirty(false)
            window.markora?.setDocumentDirty(false)
          })
        },
        'export-html': () => void exportDocument('html'),
        'export-pdf': () => void exportDocument('pdf'),
        'export-doc': () => void exportDocument('doc'),
        'export-docx': () => void exportDocument('docx'),
        'toggle-bold': () => chain.toggleBold().run(),
        'toggle-italic': () => chain.toggleItalic().run(),
        'toggle-strike': () => chain.toggleStrike().run(),
        'toggle-code': () => chain.toggleCode().run(),
        'clear-formatting': () => chain.unsetAllMarks().clearNodes().run(),
        'heading-1': () => chain.toggleHeading({ level: 1 }).run(),
        'heading-2': () => chain.toggleHeading({ level: 2 }).run(),
        'heading-3': () => chain.toggleHeading({ level: 3 }).run(),
        'heading-4': () => chain.toggleHeading({ level: 4 }).run(),
        'heading-5': () => chain.toggleHeading({ level: 5 }).run(),
        'heading-6': () => chain.toggleHeading({ level: 6 }).run(),
        paragraph: () => chain.setParagraph().run(),
        'bullet-list': () => chain.toggleBulletList().run(),
        'ordered-list': () => chain.toggleOrderedList().run(),
        'task-list': () => chain.toggleTaskList().run(),
        blockquote: () => chain.toggleBlockquote().run(),
        'code-block': () => chain.toggleCodeBlock().run(),
        'insert-table': () => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        'horizontal-rule': () => chain.setHorizontalRule().run(),
        'add-row': () => chain.addRowAfter().run(),
        'add-column': () => chain.addColumnAfter().run(),
        'delete-row': () => chain.deleteRow().run(),
        'delete-column': () => chain.deleteColumn().run(),
        'delete-table': () => chain.deleteTable().run(),
        'toggle-sidebar': () => setSidebarOpen((value) => !value),
        'toggle-outline': () => setOutlineOpen((value) => !value),
        'focus-mode': () => setFocusMode((value) => !value),
        'source-mode': () => {
          const nextSourceMode = !sourceMode
          if (nextSourceMode) {
            setSourceMarkdown(htmlToMarkdown(editor.getHTML()))
          } else {
            editor.commands.setContent(markdownToHtml(sourceMarkdown))
          }
          setSourceMode(nextSourceMode)
        },
        find: () => setFindPanelOpen(true),
        replace: () => setFindPanelOpen(true),
        'theme-github': () => setTheme('github'),
        'theme-newsprint': () => setTheme('newsprint'),
        'theme-night': () => setTheme('night'),
      }
      actions[action]?.()
    },
    [currentMarkdown, editor, exportDocument, saveDocument, sourceMarkdown, sourceMode],
  )

  useEffect(() => {
    const removeMenuListener = window.markora?.onMenuAction(runAction)
    const removeOpenListener = window.markora?.onFileOpened(openDocument)
    const removeWorkspaceListener = window.markora?.onWorkspaceOpened(openWorkspace)
    return () => {
      removeMenuListener?.()
      removeOpenListener?.()
      removeWorkspaceListener?.()
    }
  }, [openDocument, openWorkspace, runAction])

  const filteredFiles = filterWorkspaceEntries(workspaceFiles, fileSearch)

  const openFileFromSidebar = async (file: WorkspaceFileEntry) => {
    if (file.type === 'directory') return
    if (!window.markora?.readWorkspaceFile || file.path === 'welcome.md') {
      setDocumentName(file.name)
      setActiveFilePath(file.path)
      setSourceMarkdown(welcomeMarkdown)
      editorReady.current = false
      editor?.commands.setContent(markdownToHtml(welcomeMarkdown))
      queueMicrotask(() => {
        editorReady.current = true
      })
      setDirty(false)
      window.markora?.setDocumentDirty(false)
      return
    }

    const opened = await window.markora.readWorkspaceFile(file.path)
    if (opened) openDocument(opened)
  }

  const refreshWorkspace = async () => {
    const workspace = await window.markora?.refreshWorkspace?.()
    if (workspace) openWorkspace(workspace)
  }

  const createWorkspaceEntry = async (kind: 'file' | 'directory') => {
    const label = kind === 'file' ? 'New Markdown file' : 'New folder'
    const name = window.prompt(label, kind === 'file' ? 'Untitled.md' : 'New Folder')
    if (!name) return
    applyWorkspaceMutation(await window.markora?.createWorkspaceEntry?.(kind, name) ?? null)
  }

  const renameActiveEntry = async () => {
    const active = flattenWorkspaceFiles(workspaceFiles).find((file) => file.path === activeFilePath)
    if (!active) return
    const name = window.prompt('Rename file', active.name)
    if (!name || name === active.name) return
    applyWorkspaceMutation(await window.markora?.renameWorkspaceEntry?.(active.path, name) ?? null)
  }

  const deleteActiveEntry = async () => {
    const active = flattenWorkspaceFiles(workspaceFiles).find((file) => file.path === activeFilePath)
    if (!active || !window.confirm(`Delete ${active.name}?`)) return
    applyWorkspaceMutation(await window.markora?.deleteWorkspaceEntry?.(active.path) ?? null)
  }

  const toggleFolder = (path: string) => {
    setCollapsedFolders((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const applyReplaceAll = () => {
    if (!findQuery) return
    const nextMarkdown = replaceAllLiteral(currentMarkdown(), findQuery, replaceText)
    setSourceMarkdown(nextMarkdown)
    editorReady.current = false
    editor?.commands.setContent(markdownToHtml(nextMarkdown))
    queueMicrotask(() => {
      editorReady.current = true
    })
    setDirty(true)
    window.markora?.setDocumentDirty(true)
  }

  const renderWorkspaceEntry = (file: WorkspaceFileEntry, depth = 0): ReactNode => {
    const isDirectory = file.type === 'directory'
    const collapsed = collapsedFolders.has(file.path)
    return (
      <div className="file-tree-item" key={file.path}>
        <button
          className={file.path === activeFilePath ? 'file-row active' : 'file-row'}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          type="button"
          onClick={() => (isDirectory ? toggleFolder(file.path) : void openFileFromSidebar(file))}
        >
          {isDirectory ? (collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />) : <FileText size={14} />}
          <span>{file.name}</span>
        </button>
        {isDirectory && !collapsed && file.children?.map((child) => renderWorkspaceEntry(child, depth + 1))}
      </div>
    )
  }

  const insertImageFiles = async (files: FileList | File[]) => {
    const images = imageFilesFromList(files)
    for (const image of images) {
      const fileWithPath = image as File & { path?: string }
      if (fileWithPath.path && window.markora?.importAsset) {
        const imported = await window.markora.importAsset(fileWithPath.path)
        if (imported) {
          editor?.chain().focus().setImage({ src: imported.relativePath, alt: imported.name }).run()
          continue
        }
      }
      const source = await fileToDataUrl(image)
      editor?.chain().focus().setImage({ src: source, alt: image.name }).run()
    }
  }

  const findMatches = countMatches(currentMarkdown(), findQuery)

  return (
    <main className={`markora-shell theme-${theme} ${focusMode ? 'is-focus' : ''}`}>
      <header className="titlebar">
        <div className="traffic-space" />
        <div className="document-title">{dirty ? '*' : ''}{documentName}</div>
        <div className="toolbar">
          <button title="Open" type="button" onClick={() => void window.markora?.openMarkdownFile().then((file) => file && openDocument(file))}><FileText size={16} /></button>
          <button title="Open Folder" type="button" onClick={() => void window.markora?.openWorkspace().then((workspace) => workspace && openWorkspace(workspace))}><FolderOpen size={16} /></button>
          <button title="Save" type="button" onClick={() => void saveDocument()}><Save size={16} /></button>
          <button title="Export PDF" type="button" onClick={() => void exportDocument('pdf')}><Download size={16} /></button>
          <button title="Insert Table" type="button" onClick={() => runAction('insert-table')}><Table2 size={16} /></button>
          <button title="Toggle sidebar" type="button" onClick={() => setSidebarOpen((value) => !value)}><PanelLeft size={16} /></button>
          <button title="Focus mode" type="button" onClick={() => setFocusMode((value) => !value)}><Focus size={16} /></button>
          <button title="Source Code Mode" type="button" onClick={() => runAction('source-mode')}><Code2 size={16} /></button>
          <button title="Toggle outline" type="button" onClick={() => setOutlineOpen((value) => !value)}><PanelRight size={16} /></button>
        </div>
      </header>

      <section className="workspace">
        {sidebarOpen && (
          <aside className="sidebar">
            <label className="sidebar-search">
              <Search size={14} />
              <input value={fileSearch} onChange={(event) => setFileSearch(event.target.value)} placeholder="Search files" />
            </label>
            <div className="file-actions" aria-label="File actions">
              <button title="New file" type="button" onClick={() => void createWorkspaceEntry('file')}><FilePlus size={14} /></button>
              <button title="New folder" type="button" onClick={() => void createWorkspaceEntry('directory')}><FolderPlus size={14} /></button>
              <button title="Rename active file" type="button" onClick={() => void renameActiveEntry()}><Pencil size={14} /></button>
              <button title="Delete active file" type="button" onClick={() => void deleteActiveEntry()}><Trash2 size={14} /></button>
              <button title="Refresh file tree" type="button" onClick={() => void refreshWorkspace()}><RefreshCw size={14} /></button>
            </div>
            <div className="sidebar-section">
              <div className="sidebar-heading"><BookOpen size={14} /> {workspaceName}</div>
              {filteredFiles.map((file) => renderWorkspaceEntry(file))}
            </div>
          </aside>
        )}

        <section
          className={sourceMode ? 'editor-wrap source-mode' : 'editor-wrap'}
          onPaste={(event) => {
            if (sourceMode || !event.clipboardData.files.length) return
            void insertImageFiles(event.clipboardData.files)
          }}
          onDrop={(event) => {
            if (sourceMode || !event.dataTransfer.files.length) return
            event.preventDefault()
            void insertImageFiles(event.dataTransfer.files)
          }}
          onDragOver={(event) => {
            if (!sourceMode) event.preventDefault()
          }}
        >
          {findPanelOpen && (
            <div className="find-panel" role="search">
              <label>
                <Search size={14} />
                <input value={findQuery} onChange={(event) => setFindQuery(event.target.value)} placeholder="Find" autoFocus />
              </label>
              <label>
                <Replace size={14} />
                <input value={replaceText} onChange={(event) => setReplaceText(event.target.value)} placeholder="Replace" />
              </label>
              <span>{findMatches} matches</span>
              <button type="button" onClick={applyReplaceAll}>Replace All</button>
              <button type="button" onClick={() => setFindPanelOpen(false)}>Close</button>
            </div>
          )}
          {!sourceMode && editor?.isActive('table') && (
            <div className="table-tools" aria-label="Table editing tools">
              <button type="button" title="Add row" onClick={() => runAction('add-row')}><Rows3 size={14} /></button>
              <button type="button" title="Add column" onClick={() => runAction('add-column')}><Columns3 size={14} /></button>
              <button type="button" title="Delete row" onClick={() => runAction('delete-row')}><Trash2 size={14} /> Row</button>
              <button type="button" title="Delete column" onClick={() => runAction('delete-column')}><Trash2 size={14} /> Column</button>
              <button type="button" title="Delete table" onClick={() => runAction('delete-table')}><Trash2 size={14} /> Table</button>
            </div>
          )}
          {!sourceMode && (
            <div className="drop-hint"><ImagePlus size={14} /> Drop or paste images into the document</div>
          )}
          {sourceMode ? (
            <textarea
              className="source-editor"
              spellCheck="false"
              value={sourceMarkdown}
              onChange={(event) => {
                const nextMarkdown = event.target.value
                setSourceMarkdown(nextMarkdown)
                editor?.commands.setContent(markdownToHtml(nextMarkdown), { emitUpdate: false })
                setOutline(editor ? collectOutline(editor.state.doc) : [])
                setDirty(true)
                window.markora?.setDocumentDirty(true)
              }}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </section>

        {outlineOpen && (
          <aside className="outline">
            <div className="sidebar-heading"><Hash size={14} /> Outline</div>
            {outline.map((heading, index) => (
              <button style={{ paddingLeft: `${8 + heading.level * 10}px` }} className="outline-row" type="button" key={`${heading.text}-${index}`}>
                {heading.text}
              </button>
            ))}
          </aside>
        )}
      </section>

      <footer className="statusbar">
        <span>{editor?.storage.characterCount?.words?.() ?? editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0} words</span>
        <span>{theme}</span>
        <span>{sourceMode ? 'Source Code Mode' : 'WYSIWYG Mode'}</span>
      </footer>
    </main>
  )
}

export default App
