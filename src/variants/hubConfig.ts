/** Word lengths shown as one hub card per mode (links to `/{prefix}-{n}`). */
export const HUB_PLAY_LENGTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/** @deprecated use HUB_PLAY_LENGTHS */
export const HUB_WORD_LENGTHS = HUB_PLAY_LENGTHS

const CAT_CLASSIC = 'Classic'
const CAT_MULTI = 'Multi'
const CAT_VARIANTS = 'Variants'

export type HubItem =
  | { kind: 'single'; id: string }
  | {
      kind: 'lengthGroup'
      idPrefix: string
      title: string
      description: string
      tags?: string[]
    }
  | { kind: 'multiGrid' }

export type HubSection = {
  category: string
  items: HubItem[]
}

/** Hub layout: one card per mode; lengths 3–7 are buttons on the same card. */
export const HUB_SECTIONS: HubSection[] = [
  {
    category: CAT_CLASSIC,
    items: [
      {
        kind: 'lengthGroup',
        idPrefix: 'classic',
        title: 'Classic',
        description:
          'Standard Wordle scoring—green, yellow, gray. Pick a word length, then play with six guesses.',
        tags: ['2–12 letters', 'classic'],
      },
    ],
  },
  {
    category: CAT_VARIANTS,
    items: [
      {
        kind: 'lengthGroup',
        idPrefix: 'colorless',
        title: 'Colorless',
        description:
          'No tile colors—white tiles show letters that are in the word (green/yellow are both white), gray tiles are absent.',
        tags: ['letters', '2–12'],
      },
      {
        kind: 'lengthGroup',
        idPrefix: 'unscramble',
        title: 'Unscramble',
        description:
          'Green row shows word length only; letters not in the answer are dimmed on the keyboard. Three guesses.',
        tags: ['unscramble', '2–12'],
      },
      {
        kind: 'lengthGroup',
        idPrefix: 'streak',
        title: 'Streak',
        description:
          'Chain words back-to-back with six guesses each. Fail once and the run ends. Best streak is saved locally.',
        tags: ['streak', '2–12'],
      },
      {
        kind: 'lengthGroup',
        idPrefix: 'misleading',
        title: 'Misleading Tile',
        description:
          'Exactly one wrong tile per guess. Keyboard matches those colors; conflicting green/grey for a letter leaves the key blank. Ten guesses.',
        tags: ['hard', '2–12'],
      },
      {
        kind: 'lengthGroup',
        idPrefix: 'zen',
        title: 'Zen',
        description:
          'Unlimited guesses, scrolling six-row board, no loss. Solve to move to the next word.',
        tags: ['zen', '3–7'],
      },
      {
        kind: 'lengthGroup',
        idPrefix: 'zen-infinite',
        title: 'Zen Infinite',
        description:
          'Like Zen, but wins chain instantly with no pause—endless relaxed practice.',
        tags: ['zen', 'endless', '2–12'],
      },
      {
        kind: 'lengthGroup',
        idPrefix: 'infinite',
        title: 'Infinite',
        description:
          'Sliding answers. Guess up to six times per round; when you solve, the last two guesses slide away and a new answer appears.',
        tags: ['endless', '2–12'],
      },
      {
        kind: 'lengthGroup',
        idPrefix: 'word-500',
        title: 'Word 500',
        description:
          'You see green/yellow/red feedback and counts, and you can tap tiles to add your own notes. No exact per-tile positions.',
        tags: ['notes', '2–12'],
      },
    ],
  },
  {
    category: CAT_MULTI,
    items: [
      {
        kind: 'lengthGroup',
        idPrefix: 'alternating-duet',
        title: 'Alternating',
        description:
          'One board, two hidden words. Odd guesses score Word A, even score Word B until one is solved—then normal Wordle on the other. Twelve guesses total.',
        tags: ['dual', '2–12'],
      },
      { kind: 'multiGrid' },
    ],
  },
]
