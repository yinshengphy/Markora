declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it'

  const taskLists: MarkdownIt.PluginWithOptions<{ enabled?: boolean; label?: boolean; labelAfter?: boolean }>
  export default taskLists
}

declare module 'markdown-it-texmath' {
  import type MarkdownIt from 'markdown-it'

  const texmath: MarkdownIt.PluginWithOptions<Record<string, unknown>>
  export default texmath
}
