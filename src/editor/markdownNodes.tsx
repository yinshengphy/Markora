import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DiagramNodeView, MathNodeView } from './markdownNodeViews'

export const YamlFrontMatter = Node.create({
  name: 'yamlFrontMatter',
  priority: 1000,
  group: 'block',
  atom: true,
  code: true,

  addAttributes() {
    return {
      source: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-type="yaml-frontmatter"]',
        priority: 1000,
        getAttrs: (element) => ({ source: (element as HTMLElement).textContent ?? '' }),
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, { 'data-type': 'yaml-frontmatter', class: 'markora-yaml' }),
      ['code', node.attrs.source],
    ]
  },
})

export const DiagramBlock = Node.create({
  name: 'diagramBlock',
  priority: 1000,
  group: 'block',
  atom: true,
  isolating: true,

  addAttributes() {
    return {
      language: { default: 'mermaid' },
      source: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="diagram"]',
        priority: 1000,
        getAttrs: (element) => {
          const target = element as HTMLElement
          return {
            language: target.dataset.language ?? 'mermaid',
            source: target.querySelector('pre')?.textContent ?? '',
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'diagram',
        'data-language': node.attrs.language,
        class: `markora-diagram markora-${node.attrs.language}`,
      }),
      ['pre', node.attrs.source],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramNodeView)
  },
})

export const MathInline = Node.create({
  name: 'mathInline',
  priority: 1000,
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      source: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
        priority: 1000,
        getAttrs: (element) => ({ source: (element as HTMLElement).dataset.source ?? '' }),
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math-inline', 'data-source': node.attrs.source })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },
})

export const MathBlock = Node.create({
  name: 'mathBlock',
  priority: 1000,
  group: 'block',
  atom: true,
  isolating: true,

  addAttributes() {
    return {
      source: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
        priority: 1000,
        getAttrs: (element) => {
          const target = element as HTMLElement
          return { source: target.dataset.source ?? target.querySelector('pre')?.textContent ?? '' }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'math-block', 'data-source': node.attrs.source, class: 'markora-math-block' }),
      ['pre', node.attrs.source],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },
})
