import type { ComponentType, LazyExoticComponent } from 'react'

export type LetterFeedback = 'correct' | 'present' | 'absent'

export interface ClassicGameConfig {
  wordLength: number
  maxGuesses: number
  words: readonly string[]
}

export type VariantDefinition =
  | {
      kind: 'classic'
      id: string
      title: string
      description: string
      tags?: string[]
      /** Hub section heading (optional grouping). */
      category?: string
      config: ClassicGameConfig
    }
  | {
      kind: 'custom'
      id: string
      title: string
      description: string
      tags?: string[]
      /** Hub section heading (optional grouping). */
      category?: string
      /** Created once with `lazy(() => import(...))` at module scope — do not call `lazy` in render. */
      screen: LazyExoticComponent<ComponentType>
    }
