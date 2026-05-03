/**
 * ASCII Art Engine — core canvas and composition primitives.
 *
 * AsciiCanvas is a 2D grid of single characters. Build scenes by:
 * 1. Creating a canvas (room background, object, or pet)
 * 2. Calling paint() to layer art strings onto the canvas
 * 3. Calling toLines() / toString() to retrieve the composed scene
 *
 * Designed for extensibility: room backgrounds, placed objects, and
 * animated pet frames are all composed at render time, so the room
 * evolves independently from the pet animation.
 */

export class AsciiCanvas {
  readonly width: number
  readonly height: number
  private cells: string[][]

  constructor(width: number, height: number, fill = ' ') {
    this.width = width
    this.height = height
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => fill)
    )
  }

  set(row: number, col: number, char: string): this {
    if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
      this.cells[row][col] = char[0] ?? ' '
    }
    return this
  }

  get(row: number, col: number): string {
    if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
      return this.cells[row][col]
    }
    return ' '
  }

  /**
   * Paint `art` (array of strings, one per row) onto the canvas at
   * (startRow, startCol). Characters equal to `transparent` are skipped,
   * letting the background show through.
   */
  paint(art: string[], startRow: number, startCol: number, transparent = ' '): this {
    for (let r = 0; r < art.length; r++) {
      const chars = Array.from(art[r])
      for (let c = 0; c < chars.length; c++) {
        const ch = chars[c]
        if (ch !== transparent) {
          this.set(startRow + r, startCol + c, ch)
        }
      }
    }
    return this
  }

  /** Draw a horizontal line of `char` from col1 to col2 inclusive. */
  hline(row: number, col1: number, col2: number, char: string): this {
    for (let c = col1; c <= col2; c++) this.set(row, c, char)
    return this
  }

  /** Fill a rectangular region with `char`. */
  fill(rowStart: number, colStart: number, rowEnd: number, colEnd: number, char: string): this {
    for (let r = rowStart; r <= rowEnd; r++) {
      for (let c = colStart; c <= colEnd; c++) this.set(r, c, char)
    }
    return this
  }

  /** Return the canvas as an array of strings, one per row. */
  toLines(): string[] {
    return this.cells.map(row => row.join(''))
  }

  /** Return the canvas as a single newline-joined string. */
  toString(): string {
    return this.toLines().join('\n')
  }

  /** Return a deep copy so mutations don't affect the original. */
  clone(): AsciiCanvas {
    const next = new AsciiCanvas(this.width, this.height)
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        next.cells[r][c] = this.cells[r][c]
      }
    }
    return next
  }
}
