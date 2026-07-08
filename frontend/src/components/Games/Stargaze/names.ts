const ADJECTIVES = [
  'Half-Spoken', 'Mirror', 'Late', 'Drowned', 'Bone', 'Glass', 'Folded',
  'Restless', 'Tender', 'Hollow', 'Unfinished', 'Crooked', 'Bright', 'Soft',
  'Faint', 'Salt', 'Slow', 'Tin', 'Quiet', 'Stray', 'Threadbare', 'Empty',
  'Hidden', 'Wet', 'Pale', 'Dim', 'Bent', 'Open', 'Lost', 'Cold',
  'Half-Light', 'Brittle', 'Vagrant', 'Bare', 'Borrowed',
]

const NOUNS = [
  'Sea', 'Garden', 'Echo', 'Knee', 'Lung', 'Mouth', 'Door', 'Bell',
  'Thread', 'Coast', 'Branch', 'Window', 'Tide', 'Page', 'Ash', 'Hand',
  'Sky', 'Bone', 'Net', 'Stone', 'Salt', 'Hour', 'Mile', 'Hum',
  'Rope', 'Lamp', 'Tooth', 'Glass', 'Shore', 'Whistle', 'Hollow',
  'Mast', 'Hymn', 'Loom', 'Pulse',
]

const CONNECTORS = ['of', 'and', 'beneath', 'before', 'through', 'against', 'beyond']

const SHORT_NAMES = [
  'Vesper', 'Sable', 'Knot', 'Drift', 'Coda', 'Loom', 'Ember', 'Aether',
  'Sloe', 'Cinder', 'Marrow', 'Quill',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateName(starCount: number): string {
  const r = Math.random()
  if (starCount <= 2 && r < 0.35) return pick(SHORT_NAMES)
  if (r < 0.50) return `${pick(ADJECTIVES)} ${pick(NOUNS)}`
  if (r < 0.80) {
    let a = pick(NOUNS), b = pick(NOUNS)
    while (b === a) b = pick(NOUNS)
    return `${a} ${pick(CONNECTORS)} ${b}`
  }
  if (r < 0.95) {
    let a = pick(ADJECTIVES), b = pick(ADJECTIVES)
    while (b === a) b = pick(ADJECTIVES)
    return `${a} ${b} ${pick(NOUNS)}`
  }
  return pick(SHORT_NAMES)
}
