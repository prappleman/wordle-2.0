import { lazy } from 'react'
import type { VariantDefinition } from './types'
import words4 from '../data/words/4.json'
import words5 from '../data/words/5.json'
import words6 from '../data/words/6.json'

const CustomStubScreen = lazy(() => import('../pages/variants/CustomStubPage'))

export const VARIANTS: VariantDefinition[] = [
  {
    kind: 'classic',
    id: 'classic-5',
    title: 'Classic (5 letters)',
    description: 'Six guesses to find a five-letter word.',
    tags: ['5-letter', 'classic'],
    config: {
      wordLength: 5,
      maxGuesses: 6,
      words: words5,
    },
  },
  {
    kind: 'classic',
    id: 'classic-6',
    title: 'Six letters',
    description: 'Same rules, longer answers.',
    tags: ['6-letter'],
    config: {
      wordLength: 6,
      maxGuesses: 6,
      words: words6,
    },
  },
  {
    kind: 'classic',
    id: 'classic-4',
    title: 'Mini (4 letters)',
    description: 'Quick rounds with four-letter words.',
    tags: ['4-letter', 'quick'],
    config: {
      wordLength: 4,
      maxGuesses: 6,
      words: words4,
    },
  },
  {
    kind: 'custom',
    id: 'lab-stub',
    title: 'Lab (custom stub)',
    description: 'Placeholder route for variants that need their own screen.',
    tags: ['custom', 'stub'],
    screen: CustomStubScreen,
  },
]

const byId = new Map(VARIANTS.map((v) => [v.id, v]))

export function getVariant(id: string): VariantDefinition | undefined {
  return byId.get(id)
}
