import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import attrs from 'markdown-it-attrs'
import container from 'markdown-it-container'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import TurndownService from 'turndown'
import 'katex/dist/katex.min.css'

type FenceToken = {
  info: string
  content: string
}

export const welcomeMarkdown = `---
title: Welcome
tags: [markora, typora]
---

# Markora

A quiet, Typora-inspired Markdown workspace.

## Daily Notes

- [x] Build the Electron shell
- [ ] Match Typora editing rhythm

> [!NOTE]
> Write in one surface. Let Markdown become the document as you type.

### Syntax Targets

Inline math $E=mc^2$ and block math:

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Markora]
  B --> C[WYSIWYG]
\`\`\`

\`\`\`plantuml
@startuml
Alice -> Bob: Hello
@enduml
\`\`\`
`

const fenceRenderer = (tokens: FenceToken[], index: number) => {
  const token = tokens[index]
  const language = token.info.trim().split(/\s+/)[0]?.toLowerCase()
  const content = token.content

  if (language === 'mermaid') {
    return `<div data-type="diagram" class="markora-diagram markora-mermaid" data-language="mermaid"><pre>${escapeHtml(content)}</pre></div>`
  }

  if (language === 'plantuml' || language === 'puml') {
    return `<div data-type="diagram" class="markora-diagram markora-plantuml" data-language="plantuml"><pre>${escapeHtml(content)}</pre></div>`
  }

  const languageClass = language ? ` class="language-${escapeHtml(language)}"` : ''
  return `<pre><code${languageClass}>${escapeHtml(content)}</code></pre>`
}

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
  .use(anchor, { permalink: false })
  .use(attrs)
  .use(footnote)
  .use(taskLists, { enabled: true, label: true, labelAfter: true })
  .use(container, 'warning')
  .use(container, 'tip')
  .use(container, 'note')

markdown.renderer.rules.fence = fenceRenderer

const turndown = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  headingStyle: 'atx',
})

turndown.addRule('taskListItems', {
  filter: (node) => node.nodeName === 'LI' && (node as HTMLElement).getAttribute('data-type') === 'taskItem',
  replacement: (content, node) => {
    const checked = (node as HTMLElement).getAttribute('data-checked') === 'true'
    return `- [${checked ? 'x' : ' '}] ${content.trim()}\n`
  },
})

turndown.addRule('mathBlocks', {
  filter: (node) => node.nodeName === 'DIV' && (node as HTMLElement).dataset.type === 'math-block',
  replacement: (_content, node) => {
    const element = node as HTMLElement
    const source = element.dataset.source?.trim() || element.querySelector('pre')?.textContent?.trim()
    return source ? `\n\n$$\n${source}\n$$\n\n` : ''
  },
})

turndown.addRule('mathInline', {
  filter: (node) => node.nodeName === 'SPAN' && (node as HTMLElement).dataset.type === 'math-inline',
  replacement: (_content, node) => {
    const source = (node as HTMLElement).dataset.source?.trim()
    return source ? `$${source}$` : ''
  },
})

turndown.addRule('diagrams', {
  filter: (node) => node.nodeName === 'DIV' && (node as HTMLElement).dataset.type === 'diagram',
  replacement: (_content, node) => {
    const element = node as HTMLElement
    const language = element.dataset.language ?? 'mermaid'
    const source = element.querySelector('pre')?.textContent ?? ''
    return `\n\n\`\`\`${language}\n${source.trim()}\n\`\`\`\n\n`
  },
})

turndown.addRule('callouts', {
  filter: (node) => node.nodeName === 'BLOCKQUOTE' && /^\s*\[[!][A-Z]+]/.test(node.textContent ?? ''),
  replacement: (content) => `\n> ${content.trim().replace(/\n/g, '\n> ')}\n\n`,
})

export function markdownToHtml(source: string) {
  return markdown.render(preprocessMarkdown(source))
}

export function htmlToMarkdown(html: string) {
  return turndown.turndown(html).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

function normalizeYamlFrontMatter(source: string) {
  if (!source.startsWith('---\n')) return source
  const end = source.indexOf('\n---', 4)
  if (end === -1) return source
  const yaml = source.slice(4, end).trim()
  const rest = source.slice(end + 4)
  return `<pre data-type="yaml-frontmatter" class="markora-yaml"><code>${escapeHtml(yaml)}</code></pre>\n${rest}`
}

function preprocessMarkdown(source: string) {
  return protectInlineMath(protectBlockMath(protectTaskLists(normalizeYamlFrontMatter(source))))
}

function protectTaskLists(source: string) {
  const lines = source.split('\n')
  const output: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const taskMatch = lines[index].match(/^- \[([ xX])\] (.*)$/)
    if (!taskMatch) {
      output.push(lines[index])
      continue
    }

    const items: string[] = []
    while (index < lines.length) {
      const match = lines[index].match(/^- \[([ xX])\] (.*)$/)
      if (!match) break
      const checked = match[1].toLowerCase() === 'x'
      items.push(
        `<li data-type="taskItem" data-checked="${checked ? 'true' : 'false'}"><label><input type="checkbox"${
          checked ? ' checked="checked"' : ''
        }><span></span></label><div><p>${escapeHtml(match[2])}</p></div></li>`,
      )
      index += 1
    }
    index -= 1
    output.push(`<ul data-type="taskList">${items.join('')}</ul>`)
  }

  return output.join('\n')
}

function protectBlockMath(source: string) {
  return source.replace(/(^|\n)\$\$\n([\s\S]*?)\n\$\$(?=\n|$)/g, (_match, prefix: string, mathSource: string) => {
    const trimmed = mathSource.trim()
    return `${prefix}<div data-type="math-block" data-source="${escapeHtmlAttribute(trimmed)}"><pre>${escapeHtml(trimmed)}</pre></div>`
  })
}

function protectInlineMath(source: string) {
  return source.replace(/(^|[^\\$])\$([^$\n]+?)\$/g, (_match, prefix: string, mathSource: string) => {
    const trimmed = mathSource.trim()
    return `${prefix}<span data-type="math-inline" data-source="${escapeHtmlAttribute(trimmed)}">${escapeHtml(trimmed)}</span>`
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeHtmlAttribute(value: string) {
  return escapeHtml(value).replaceAll('\n', '&#10;')
}
