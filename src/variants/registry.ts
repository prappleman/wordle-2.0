import { lazy } from 'react'
import type { VariantDefinition } from './types'
import {
  WORDS_1,
  WORDS_2,
  WORDS_3,
  WORDS_4,
  WORDS_5,
  WORDS_6,
  WORDS_7,
  WORDS_8,
  WORDS_9,
  WORDS_10,
  WORDS_11,
  WORDS_12,
} from '../data/words/words12dictsGame'
import { LADDER_PICK_LENGTHS } from './ladderLength'
import { MULTI_BOARD_COUNTS, multiMaxGuesses } from './multiVariant'

const MultiWordleScreen = lazy(() => import('../pages/MultiWordleScreen'))
const InfiniteWordleScreen = lazy(() => import('../pages/InfiniteWordleScreen'))
const Word500Screen = lazy(() => import('../pages/Word500Screen'))
const ColorlessScreen = lazy(() => import('../pages/ColorlessScreen'))
const AlternatingDuetScreen = lazy(() => import('../pages/AlternatingDuetScreen'))
const GrowingWordScreen = lazy(() => import('../pages/GrowingWordScreen'))
const LadderInfiniteWordleScreen = lazy(() => import('../pages/LadderInfiniteWordleScreen'))
const LadderWord500Screen = lazy(() => import('../pages/LadderWord500Screen'))
const LadderColorlessScreen = lazy(() => import('../pages/LadderColorlessScreen'))
const LadderAlternatingDuetScreen = lazy(() => import('../pages/LadderAlternatingDuetScreen'))
const LadderStreakScreen = lazy(() => import('../pages/LadderStreakScreen'))
const LadderMisleadingTileScreen = lazy(() => import('../pages/LadderMisleadingTileScreen'))
const LadderZenScreen = lazy(() => import('../pages/LadderZenScreen'))
const LadderUnscrambleScreen = lazy(() => import('../pages/LadderUnscrambleScreen'))
const LadderMultiWordleScreen = lazy(() => import('../pages/LadderMultiWordleScreen'))
const StreakScreen = lazy(() => import('../pages/StreakScreen'))
const MisleadingTileScreen = lazy(() => import('../pages/MisleadingTileScreen'))
const ZenScreen = lazy(() => import('../pages/ZenScreen'))
const UnscrambleScreen = lazy(() => import('../pages/UnscrambleScreen'))
const WordChainScreen = lazy(() => import('../pages/WordChainScreen'))
const LadderWordChainScreen = lazy(() => import('../pages/LadderWordChainScreen'))
const BannedWordleScreen = lazy(() => import('../pages/BannedWordleScreen'))
const MemoryColorsScreen = lazy(() => import('../pages/MemoryColorsScreen'))
const MemoryLettersScreen = lazy(() => import('../pages/MemoryLettersScreen'))
const LockedScreen = lazy(() => import('../pages/LockedScreen'))
const ReverseScreen = lazy(() => import('../pages/ReverseScreen'))
const BlockedWordleScreen = lazy(() => import('../pages/BlockedWordleScreen'))
const SpacesWordleScreen = lazy(() => import('../pages/SpacesWordleScreen'))
const ForcedLetterScreen = lazy(() => import('../pages/ForcedLetterScreen'))
const DoublesOnlyScreen = lazy(() => import('../pages/DoublesOnlyScreen'))

const CAT_CLASSIC = 'Classic'
const CAT_MULTI = 'Multi-board & special'
const CAT_NEW = 'New modes'

/** Hub “normal” play lengths (2–12). */
const PLAY_LENS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

const WORDS_BY_LEN: Record<number, readonly string[]> = {
  1: WORDS_1,
  2: WORDS_2,
  3: WORDS_3,
  4: WORDS_4,
  5: WORDS_5,
  6: WORDS_6,
  7: WORDS_7,
  8: WORDS_8,
  9: WORDS_9,
  10: WORDS_10,
  11: WORDS_11,
  12: WORDS_12,
}

const CLASSIC_TITLE: Record<number, string> = {
  2: 'Tiny',
  3: 'Micro',
  4: 'Mini',
  5: 'Classic',
  6: 'Extra',
  7: 'Wide',
  8: 'Grand',
  9: 'Vast',
  10: 'Epic',
  11: 'Titan',
  12: 'Mega',
}

function classicTags(len: number): string[] {
  const t = [`${len}-letter`, '6 guesses']
  if (len === 5) t.push('classic')
  if (len === 3 || len === 4) t.push('quick')
  return t
}

export const VARIANTS: VariantDefinition[] = [
  ...PLAY_LENS.map(
    (len) =>
      ({
        kind: 'classic',
        id: `classic-${len}`,
        title: CLASSIC_TITLE[len]!,
        description: 'Standard Wordle scoring—green, yellow, gray. Six guesses.',
        tags: classicTags(len),
        category: CAT_CLASSIC,
        config: {
          wordLength: len,
          maxGuesses: 6,
          words: WORDS_BY_LEN[len]!,
        },
      }) satisfies VariantDefinition,
  ),
  ...PLAY_LENS.flatMap((len) =>
    MULTI_BOARD_COUNTS.map((boards) => {
      const maxG = multiMaxGuesses(boards)
      return {
        kind: 'custom' as const,
        id: `multi-${len}-${boards}`,
        title: `Multi (${boards})`,
        description: `${boards} hidden words (${len} letters each). One guess applies to every unsolved grid. ${maxG} guesses total.`,
        tags: ['multi', `${len}-letter`, `${boards} words`],
        category: CAT_MULTI,
        screen: MultiWordleScreen,
      }
    }),
  ),
  ...PLAY_LENS.flatMap((n) => [
    {
      kind: 'custom' as const,
      id: `infinite-${n}`,
      title: 'Infinite',
      description:
        'Six rows per round—fill the board without solving and you lose. Solve to slide away the last two guesses and continue.',
      tags: [`${n}-letter`, 'endless', '6 guesses'],
      category: CAT_MULTI,
      screen: InfiniteWordleScreen,
    },
    {
      kind: 'custom' as const,
      id: `word-500-${n}`,
      title: 'Word 500',
      description:
        'You see green/yellow/red counts and can add your own notes by tapping tiles. Eight guesses.',
      tags: [`${n}-letter`, 'notes', '8 guesses'],
      category: CAT_MULTI,
      screen: Word500Screen,
    },
  ]),
  ...PLAY_LENS.flatMap((n) => {
    const lenLabel = `${n}-letter`
    return [
      {
        kind: 'custom' as const,
        id: `colorless-${n}`,
        title: 'Colorless',
        description:
          'No tile colors—green and yellow are both white to show which letters are in the word; gray shows absent letters.',
        tags: [lenLabel, 'letters', '8 guesses'],
        category: CAT_NEW,
        screen: ColorlessScreen,
      },
      {
        kind: 'custom' as const,
        id: `alternating-duet-${n}`,
        title: 'Alternating',
        description:
          'One board, two words. Odd guesses score Word A, even guesses Word B until one is solved—then normal Wordle on the other. Twelve guesses total.',
        tags: [lenLabel, 'dual', '10 guesses'],
        category: CAT_NEW,
        screen: AlternatingDuetScreen,
      },
      {
        kind: 'custom' as const,
        id: `unscramble-${n}`,
        title: 'Unscramble',
        description:
          'Green row shows word length only; letters appear dimmed off the keyboard if they are not in the answer. Three guesses.',
        tags: [lenLabel, 'unscramble', '3 guesses'],
        category: CAT_NEW,
        screen: UnscrambleScreen,
      },
      {
        kind: 'custom' as const,
        id: `word-chain-${n}`,
        title: 'Word chain',
        description:
          'Start and goal words differ by one letter per step through real words. Guessed rows use green only vs the goal (no yellow). Pairs are solvable with a known shortest path.',
        tags: [lenLabel, 'chain', 'path'],
        category: CAT_NEW,
        screen: WordChainScreen,
      },
      {
        kind: 'custom' as const,
        id: `streak-${n}`,
        title: 'Streak',
        description:
          'Chain words back-to-back with six guesses each. Fail once and the run ends. Best streak is saved locally.',
        tags: [lenLabel, 'streak', '6 guesses'],
        category: CAT_NEW,
        screen: StreakScreen,
      },
      {
        kind: 'custom' as const,
        id: `misleading-${n}`,
        title: 'Misleading Tile',
        description:
          'Exactly one wrong tile per guess. Keyboard matches tile colors; green+grey for the same letter leaves that key uncolored. Ten guesses.',
        tags: [lenLabel, 'hard', '10 guesses'],
        category: CAT_NEW,
        screen: MisleadingTileScreen,
      },
      {
        kind: 'custom' as const,
        id: `zen-${n}`,
        title: 'Zen',
        description:
          'Unlimited guesses, scrolling six-row board, no loss. Solve to move to the next word.',
        tags: [lenLabel, 'zen', '6 guesses'],
        category: CAT_NEW,
        screen: ZenScreen,
      },
      {
        kind: 'custom' as const,
        id: `zen-infinite-${n}`,
        title: 'Zen Infinite',
        description:
          'Like Zen, but wins chain instantly with no pause—endless relaxed practice.',
        tags: [lenLabel, 'zen', 'endless', '6 guesses'],
        category: CAT_NEW,
        screen: ZenScreen,
      },
      {
        kind: 'custom' as const,
        id: `banned-${n}`,
        title: 'Banned',
        description:
          'Normal Wordle, but each guess bans one common letter (not in the answer) until your final guess.',
        tags: [lenLabel, 'ban', '6 guesses'],
        category: CAT_NEW,
        screen: BannedWordleScreen,
      },
      {
        kind: 'custom' as const,
        id: `memory-colors-${n}`,
        title: 'Memory colors',
        description:
          'After each guess, tile colors only stay visible briefly—remember the pattern.',
        tags: [lenLabel, 'memory', '6 guesses'],
        category: CAT_NEW,
        screen: MemoryColorsScreen,
      },
      {
        kind: 'custom' as const,
        id: `memory-letters-${n}`,
        title: 'Memory letters',
        description:
          'Green/yellow/gray stay on the grid; letters in past guesses are hidden. On-screen keyboard stays plain during play.',
        tags: [lenLabel, 'memory', '6 guesses'],
        category: CAT_NEW,
        screen: MemoryLettersScreen,
      },
      {
        kind: 'custom' as const,
        id: `locked-${n}`,
        title: 'Locked',
        description:
          'One fixed letter at one position. Enter as many valid words as you can before the timer ends; see how many were possible.',
        tags: [lenLabel, 'timer', 'infinite tries'],
        category: CAT_NEW,
        screen: LockedScreen,
      },
      {
        kind: 'custom' as const,
        id: `reverse-${n}`,
        title: 'Reverse',
        description:
          'Answer is shown. Six color patterns—submit words that match any open row to clear it; timed (faster is better).',
        tags: [lenLabel, '6 rows', 'puzzle'],
        category: CAT_NEW,
        screen: ReverseScreen,
      },
      {
        kind: 'custom' as const,
        id: `blocked-${n}`,
        title: 'Blocked',
        description:
          'Wildcard slot per row—fill the rest so some valid word fits; Wordle scoring on your letters vs the answer.',
        tags: [lenLabel, 'blocked', '6 guesses'],
        category: CAT_NEW,
        screen: BlockedWordleScreen,
      },
      {
        kind: 'custom' as const,
        id: `spaces-${n}`,
        title: 'Spaces',
        description:
          'Wildcard column on early rows; bonus rows (two fixed blocked tiles each) appear before your final guess.',
        tags: [lenLabel, 'bonus', '6 guesses'],
        category: CAT_NEW,
        screen: SpacesWordleScreen,
      },
      {
        kind: 'custom' as const,
        id: `forced-letter-${n}`,
        title: 'Forced letter',
        description:
          'Each guess (except your last) must contain a random required letter anywhere; the letter changes every guess. White key highlight.',
        tags: [lenLabel, 'constraint', '6 guesses'],
        category: CAT_NEW,
        screen: ForcedLetterScreen,
      },
      ...(n >= 2
        ? [
            {
              kind: 'custom' as const,
              id: `doubles-${n}`,
              title: 'Doubles',
              description:
                'Answer and every guess must include at least one letter twice (e.g. POOLS, SNAGS). Valid words only.',
              tags: [lenLabel, 'repeat', '6 guesses'],
              category: CAT_NEW,
              screen: DoublesOnlyScreen,
            },
          ]
        : []),
    ]
  }),
  ...LADDER_PICK_LENGTHS.flatMap((n) => [
    {
      kind: 'custom' as const,
      id: `growing-word-${n}`,
      title: 'Classic',
      description: 'Standard Wordle scoring—green, yellow, gray. Six guesses.',
      tags: ['ladder', `${n}-letter`, '6 guesses'],
      category: CAT_NEW,
      screen: GrowingWordScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-infinite-${n}`,
      title: 'Infinite',
      description:
        'Six rows per round—fill the board without solving and you lose. Solve to slide away the last two guesses and continue.',
      tags: [`${n}-letter`, 'endless', 'ladder', '6 guesses'],
      category: CAT_MULTI,
      screen: LadderInfiniteWordleScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-word-500-${n}`,
      title: 'Word 500',
      description:
        'You see green/yellow/red counts and can add your own notes by tapping tiles. Eight guesses.',
      tags: [`${n}-letter`, 'notes', 'ladder', '8 guesses'],
      category: CAT_MULTI,
      screen: LadderWord500Screen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-colorless-${n}`,
      title: 'Colorless',
      description:
        'No tile colors—green and yellow are both white to show which letters are in the word; gray shows absent letters.',
      tags: [`${n}-letter`, 'letters', 'ladder', '8 guesses'],
      category: CAT_NEW,
      screen: LadderColorlessScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-alternating-duet-${n}`,
      title: 'Alternating',
      description:
        'One board, two words. Odd guesses score Word A, even guesses Word B until one is solved—then normal Wordle on the other. Twelve guesses total.',
      tags: [`${n}-letter`, 'dual', 'ladder', '10 guesses'],
      category: CAT_NEW,
      screen: LadderAlternatingDuetScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-unscramble-${n}`,
      title: 'Unscramble',
      description:
        'Green row shows word length only; letters appear dimmed off the keyboard if they are not in the answer. Three guesses.',
      tags: [`${n}-letter`, 'unscramble', 'ladder', '3 guesses'],
      category: CAT_NEW,
      screen: LadderUnscrambleScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-streak-${n}`,
      title: 'Streak',
      description:
        'Chain words back-to-back with six guesses each. Fail once and the run ends. Best streak is saved locally.',
      tags: [`${n}-letter`, 'streak', 'ladder', '6 guesses'],
      category: CAT_NEW,
      screen: LadderStreakScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-misleading-${n}`,
      title: 'Misleading Tile',
      description:
        'Exactly one wrong tile per guess. Keyboard matches tile colors; green+grey for the same letter leaves that key uncolored. Ten guesses.',
      tags: [`${n}-letter`, 'hard', 'ladder', '10 guesses'],
      category: CAT_NEW,
      screen: LadderMisleadingTileScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-zen-${n}`,
      title: 'Zen',
      description:
        'Unlimited guesses, scrolling six-row board, no loss. Solve to move to the next word.',
      tags: [`${n}-letter`, 'zen', 'ladder', '6 guesses'],
      category: CAT_NEW,
      screen: LadderZenScreen,
    },
    {
      kind: 'custom' as const,
      id: `ladder-word-chain-${n}`,
      title: 'Word chain',
      description:
        'One-letter steps through valid words from start to goal; green-only vs goal tiles; optimal path length is shown. Win to advance the letter rungs.',
      tags: [`${n}-letter`, 'chain', 'ladder', 'path'],
      category: CAT_NEW,
      screen: LadderWordChainScreen,
    },
  ]),
  ...([2, 4, 6, 8] as const).map((boardCount) => ({
    kind: 'custom' as const,
    id: `ladder-multi-${boardCount}`,
    title: `Multi (${boardCount})`,
    description: (() => {
      const maxG = multiMaxGuesses(boardCount)
      return 'Several hidden words at once. Each guess fills every unsolved grid. Solve up to ' + maxG + ' times before losing.'
    })(),
    tags: [`${boardCount}×boards`, 'ladder'],
    category: CAT_MULTI,
    screen: LadderMultiWordleScreen,
  })),
]

const byId = new Map(VARIANTS.map((v) => [v.id, v]))

export function getVariant(id: string): VariantDefinition | undefined {
  return byId.get(id)
}
