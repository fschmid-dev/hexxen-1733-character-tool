// Shared Quasar q-editor toolbar configuration
// Secondary color (#35b9e9) als Highlight-Farbe – Toggle: an/aus

export const editorToolbar = [
  ['bold', 'italic', 'underline', 'highlight'],
  ['unordered', 'ordered'],
  ['undo', 'redo'],
]

export const editorDefinitions = {
  highlight: {
    label: 'Hervorheben',
    icon: 'format_color_fill',
    tip: 'Text hervorheben / Hervorhebung entfernen',
    handler() {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const node = sel.getRangeAt(0).commonAncestorContainer
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element
      const bg = el ? window.getComputedStyle(el).backgroundColor : ''
      const isHighlighted = bg === 'rgb(53, 185, 233)'
      document.execCommand('backColor', false, isHighlighted ? 'transparent' : '#35b9e9')
    },
  },
}
