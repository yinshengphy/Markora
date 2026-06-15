import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

const installMarkoraMock = () => {
  window.markora = {
    onMenuAction: vi.fn(() => undefined),
    onFileOpened: vi.fn(() => undefined),
    onWorkspaceOpened: vi.fn(() => undefined),
    openMarkdownFile: vi.fn(async () => null),
    openWorkspace: vi.fn(async () => null),
    readWorkspaceFile: vi.fn(async () => null),
    saveMarkdown: vi.fn(async () => ({ name: 'Welcome.md', path: '/tmp/Welcome.md' })),
    importAsset: vi.fn(async () => null),
    exportDocument: vi.fn(async () => ({ name: 'Welcome.pdf', path: '/tmp/Welcome.pdf', format: 'pdf' })),
    setDocumentDirty: vi.fn(),
  }
}

describe('Markora shell', () => {
  it('renders a Typora-style workspace with file tree, editor, outline, and status bar', async () => {
    installMarkoraMock()
    const { container } = render(<App />)

    expect(screen.getAllByText('Welcome.md').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Search files')).toBeInTheDocument()
    expect(screen.getAllByText('Markora').length).toBeGreaterThan(0)
    expect(screen.getByText('Outline')).toBeInTheDocument()
    expect(screen.getByText('WYSIWYG Mode')).toBeInTheDocument()
    expect(screen.getByText('Sample Workspace')).toBeInTheDocument()
    await waitFor(() => {
      expect(container.querySelector('.markora-yaml')).toBeInTheDocument()
      expect(container.querySelector('.markora-math-inline')).toBeInTheDocument()
    expect(container.querySelector('.markora-math-block')).toBeInTheDocument()
    expect(container.querySelector('.markora-mermaid')).toBeInTheDocument()
    expect(container.querySelector('.markora-plantuml')).toBeInTheDocument()
      expect(container.querySelector('input[type="checkbox"]')).toBeInTheDocument()
    })
  })

  it('toggles focus mode from the toolbar', async () => {
    installMarkoraMock()
    const user = userEvent.setup()
    const { container } = render(<App />)

    await user.click(screen.getByTitle('Focus mode'))

    expect(container.querySelector('.markora-shell')).toHaveClass('is-focus')
  })

  it('registers Electron menu and file-open listeners', () => {
    installMarkoraMock()
    render(<App />)

    expect(window.markora?.onMenuAction).toHaveBeenCalledOnce()
    expect(window.markora?.onFileOpened).toHaveBeenCalledOnce()
    expect(window.markora?.onWorkspaceOpened).toHaveBeenCalledOnce()
  })

  it('switches to real Markdown source mode', async () => {
    installMarkoraMock()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTitle('Source Code Mode'))

    expect(screen.getByDisplayValue(/```mermaid/)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/\\int_0\^1/)).toBeInTheDocument()
  })

  it('filters the workspace file list', async () => {
    installMarkoraMock()
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('Search files'), 'research')

    expect(screen.getByText('Research.md')).toBeInTheDocument()
    expect(screen.queryByText('Daily Notes.md')).not.toBeInTheDocument()
  })

  it('exports the active document from the toolbar', async () => {
    installMarkoraMock()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTitle('Export PDF'))

    await waitFor(() => {
      expect(window.markora?.exportDocument).toHaveBeenCalledWith(expect.objectContaining({
        format: 'pdf',
        documentName: 'Welcome.md',
      }))
    })
  })
})
