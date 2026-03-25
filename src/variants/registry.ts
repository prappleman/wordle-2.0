import { lazy } from 'react'
import type { VariantDefinition } from './types'
import {
  WORDS_3,
  WORDS_4,
  WORDS_5,
  WORDS_6,
  WORDS_7,
} from '../data/words/words12dictsGame'

const CustomStubScreen = lazy(() => import('../pages/variants/CustomStubPage'))

export const VARIANTS: VariantDefinition[] = [
  {
    kind: 'classic',
    id: 'classic-3',
    title: 'Micro (3 letters)',
    description: 'Three-letter words from the 12dicts game list.',
    tags: ['3-letter', 'quick'],
    config: {
      wordLength: 3,
      maxGuesses: 6,
      words: WORDS_3,
    },
  },
  {
    kind: 'classic',
    id: 'classic-4',
    title: 'Mini (4 letters)',
    description: 'Four-letter words from the 12dicts game list.',
    tags: ['4-letter', 'quick'],
    config: {
      wordLength: 4,
      maxGuesses: 6,
      words: WORDS_4,
    },
  },
  {
    kind: 'classic',
    id: 'classic-5',
    title: 'Classic (5 letters)',
    description: 'Six guesses to find a five-letter word.',
    tags: ['5-letter', 'classic'],
    config: {
      wordLength: 5,
      maxGuesses: 6,
      words: WORDS_5,
    },
  },
  {
    kind: 'classic',
    id: 'classic-6',
    title: 'Six letters',
    description: 'Same rules, six-letter answers.',
    tags: ['6-letter'],
    config: {
      wordLength: 6,
      maxGuesses: 6,
      words: WORDS_6,
    },
  },
  {
    kind: 'classic',
    id: 'classic-7',
    title: 'Wide (7 letters)',
    description: 'Seven-letter words; same scoring rules.',
    tags: ['7-letter'],
    config: {
      wordLength: 7,
      maxGuesses: 6,
      words: WORDS_7,
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
