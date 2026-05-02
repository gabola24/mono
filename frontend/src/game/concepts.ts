export interface ConceptPair {
    id: string
    conceptA: string
    conceptB: string
    category: 'analog' | 'digital' | 'abstract' | 'tech' | 'art'
}

export const CONCEPT_PAIRS: ConceptPair[] = [
    { id: '1', conceptA: 'Coffee', conceptB: 'Code', category: 'tech' },
    { id: '2', conceptA: 'Brush', conceptB: 'Pixels', category: 'art' },
    { id: '3', conceptA: 'Music', conceptB: 'Math', category: 'abstract' },
    { id: '4', conceptA: 'Vinyl', conceptB: 'Cloud', category: 'analog' },
    { id: '5', conceptA: 'Seed', conceptB: 'Algorithm', category: 'digital' },
    { id: '6', conceptA: 'Neon', conceptB: 'Sunset', category: 'art' },
    { id: '7', conceptA: 'Chaos', conceptB: 'Grid', category: 'abstract' },
    { id: '8', conceptA: 'Ghost', conceptB: 'Shell', category: 'tech' },
    { id: '9', conceptA: 'Ink', conceptB: 'Keyboard', category: 'analog' },
    { id: '10', conceptA: 'Memory', conceptB: 'RAM', category: 'tech' },
    { id: '11', conceptA: 'Heart', conceptB: 'CPU', category: 'tech' },
    { id: '12', conceptA: 'Lens', conceptB: 'Screen', category: 'analog' },
    { id: '13', conceptA: 'Echo', conceptB: 'Ping', category: 'digital' },
    { id: '14', conceptA: 'Dust', conceptB: 'Cache', category: 'tech' },
    { id: '15', conceptA: 'Thread', conceptB: 'Web', category: 'digital' },
    { id: '16', conceptA: 'Dream', conceptB: 'Simulation', category: 'abstract' },
    { id: '17', conceptA: 'Mirror', conceptB: 'Display', category: 'analog' },
    { id: '18', conceptA: 'Silence', conceptB: 'Null', category: 'abstract' },
    { id: '19', conceptA: 'Fire', conceptB: 'Laser', category: 'tech' },
    { id: '20', conceptA: 'Stone', conceptB: 'Silicon', category: 'tech' },
    { id: '21', conceptA: 'River', conceptB: 'Stream', category: 'digital' },
    { id: '22', conceptA: 'Map', conceptB: 'Graph', category: 'abstract' }
]

export function getRandomPairs(count: number): ConceptPair[] {
    const shuffled = [...CONCEPT_PAIRS].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}
