import { describe, expect, it } from 'vitest'
import { htmlToMarkdown, markdownToHtml } from './markdownEngine'

describe('markdownEngine', () => {
  it('renders Markdown headings, task lists, YAML, math, and diagram fences to Typora-like HTML', () => {
    const html = markdownToHtml(`---
title: Spec
---

# Heading

- [x] Done

Inline $E=mc^2$.

$$
\\int_0^1 x^2 dx
$$

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

\`\`\`plantuml
@startuml
Alice -> Bob
@enduml
\`\`\`
`)

    expect(html).toContain('class="markora-yaml"')
    expect(html).toContain('<h1')
    expect(html).toContain('data-type="taskItem"')
    expect(html).toContain('data-type="math-inline"')
    expect(html).toContain('data-type="math-block"')
    expect(html).toContain('markora-mermaid')
    expect(html).toContain('markora-plantuml')
  })

  it('serializes rendered diagrams back to fenced Markdown', () => {
    const markdown = htmlToMarkdown(`
      <h1>Heading</h1>
      <div data-type="diagram" class="markora-diagram markora-mermaid" data-language="mermaid"><pre>flowchart LR
A --> B</pre></div>
    `)

    expect(markdown).toContain('# Heading')
    expect(markdown).toContain('```mermaid')
    expect(markdown).toContain('A --> B')
  })
})
