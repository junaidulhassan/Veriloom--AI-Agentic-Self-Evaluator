function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function csvCell(value: unknown) {
  if (value == null) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const lines = [columns.join(','), ...rows.map((row) => columns.map((c) => csvCell(row[c])).join(','))]
  triggerDownload(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`)
}

function inlineStyles(source: Element, target: Element) {
  const computed = getComputedStyle(source)
  const style = (target as SVGElement).style
  for (const prop of [
    'fill',
    'stroke',
    'stroke-width',
    'opacity',
    'font-family',
    'font-size',
    'font-weight',
    'color',
    'stop-color',
  ]) {
    style.setProperty(prop, computed.getPropertyValue(prop))
  }
  Array.from(source.children).forEach((child, index) => {
    const next = target.children[index]
    if (next) inlineStyles(child, next)
  })
}

export async function downloadElementPng(element: HTMLElement, filename: string) {
  const canvas = element.querySelector('canvas')
  const background =
    getComputedStyle(document.documentElement).getPropertyValue('--chart-surface').trim() || '#fff8f5'
  if (canvas) {
    const out = document.createElement('canvas')
    out.width = canvas.width
    out.height = canvas.height
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = background
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, 0, 0)
    out.toBlob((blob) => blob && triggerDownload(blob, `${filename}.png`))
    return
  }
  const svg = element.querySelector('svg.recharts-surface') ?? element.querySelector('svg')
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const clone = svg.cloneNode(true) as SVGSVGElement
  inlineStyles(svg, clone)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(rect.width))
  clone.setAttribute('height', String(rect.height))
  const data = new XMLSerializer().serializeToString(clone)
  const image = new Image()
  const scale = 2
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image export failed'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`
  })
  const out = document.createElement('canvas')
  out.width = rect.width * scale
  out.height = rect.height * scale
  const ctx = out.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = background
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.scale(scale, scale)
  ctx.drawImage(image, 0, 0)
  out.toBlob((blob) => blob && triggerDownload(blob, `${filename}.png`))
}
