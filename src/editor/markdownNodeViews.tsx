import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import { useEffect, useId, useMemo, useState } from 'react'

type DiagramAttrs = {
  language: string
  source: string
}

type SourceAttrs = {
  source: string
}

export function MathNodeView({ node }: NodeViewProps) {
  const attrs = node.attrs as SourceAttrs
  const html = useMemo(
    () =>
      katex.renderToString(attrs.source, {
        displayMode: node.type.name === 'mathBlock',
        throwOnError: false,
        strict: false,
        output: 'html',
      }),
    [attrs.source, node.type.name],
  )

  return (
    <NodeViewWrapper
      as={node.type.name === 'mathInline' ? 'span' : 'div'}
      className={node.type.name === 'mathInline' ? 'markora-math-inline' : 'markora-math-block'}
      data-source={attrs.source}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function DiagramNodeView({ node }: NodeViewProps) {
  const attrs = node.attrs as DiagramAttrs
  const [svg, setSvg] = useState('')
  const reactId = useId()
  const id = useMemo(() => `markora-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [reactId])

  useEffect(() => {
    let cancelled = false
    if (attrs.language !== 'mermaid') return

    void import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' })
      try {
        const result = await mermaid.render(id, attrs.source)
        if (!cancelled) setSvg(result.svg)
      } catch {
        if (!cancelled) setSvg('')
      }
    })

    return () => {
      cancelled = true
    }
  }, [attrs.language, attrs.source, id])

  if (attrs.language === 'mermaid' && svg) {
    return (
      <NodeViewWrapper className="markora-diagram markora-mermaid" data-language="mermaid">
        <div className="diagram-render" dangerouslySetInnerHTML={{ __html: svg }} />
        <pre>{attrs.source}</pre>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className={`markora-diagram markora-${attrs.language}`} data-language={attrs.language}>
      <pre>{attrs.source}</pre>
    </NodeViewWrapper>
  )
}
