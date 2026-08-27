const sharp = require('sharp')

const RED = '#dc2626'
const SLATE = '#334155'

function buildOverlaySvg(width, height, annotations) {
  const parts = [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="${RED}" />
      </marker>
    </defs>`
  ]

  const ordered = [
    ...annotations.filter((a) => a.type === 'redact'),
    ...annotations.filter((a) => a.type !== 'redact')
  ]

  for (const a of ordered) {
    if (a.type === 'redact') {
      // Painted before any outline so a box may still frame the area without
      // the value underneath showing through. Used where a screenshot would
      // otherwise publish a credential or a patient identifier.
      parts.push(
        `<rect x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" fill="${a.fill ?? SLATE}" />`
      )
    } else if (a.type === 'box') {
      const rx = a.rx ?? 10
      parts.push(
        `<rect x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" rx="${rx}" ry="${rx}" fill="none" stroke="${RED}" stroke-width="${a.strokeWidth ?? 3}" />`
      )
    } else if (a.type === 'arrow') {
      parts.push(
        `<line x1="${a.from.x}" y1="${a.from.y}" x2="${a.to.x}" y2="${a.to.y}" stroke="${RED}" stroke-width="${a.strokeWidth ?? 3}" marker-end="url(#arrowhead)" />`
      )
    }
  }

  parts.push('</svg>')
  return parts.join('\n')
}

/**
 * annotations: Array<
 *   | { type: 'box', x, y, width, height, rx?, strokeWidth? }
 *   | { type: 'arrow', from: {x,y}, to: {x,y}, strokeWidth? }
 *   | { type: 'redact', x, y, width, height, fill? }
 * >
 *
 * Redactions are drawn first, so ordering inside the array does not matter.
 */
async function annotate(inputPath, outputPath, annotations) {
  const image = sharp(inputPath)
  const { width, height } = await image.metadata()
  if (!annotations || annotations.length === 0) {
    await image.toFile(outputPath)
    return
  }
  const svg = buildOverlaySvg(width, height, annotations)
  await image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile(outputPath)
}

module.exports = { annotate }
