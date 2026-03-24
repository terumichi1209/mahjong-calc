import { Tile, Suit, Honor, isNumberTile, isHonorTile } from '@/types/tile'

// 面子の種類
export interface Meld {
  type: 'shuntsu' | 'koutsu'
  // 数牌の場合
  suit?: Suit
  tiles?: number[]
  // 字牌の場合
  honor?: Honor
}

// 雀頭
export interface Pair {
  suit?: Suit
  value?: number
  honor?: Honor
}

// 手牌の分解結果
export interface ParsedHand {
  melds: Meld[]
  pair: Pair
}

type SuitCounts = { [key in Suit]: number[] }
type HonorCounts = { [key in Honor]: number }

// 手牌が有効な形（4面子+1雀頭）かどうか検証
export function isValidHand(tiles: Tile[]): boolean {
  return parseHand(tiles) !== null
}

// 手牌を分解して結果を返す（無効な場合はnull）
export function parseHand(tiles: Tile[]): ParsedHand | null {
  if (tiles.length !== 14) return null

  const { suitCounts, honorCounts } = tilesToCounts(tiles)

  // 数牌の雀頭を試す
  const suits: Suit[] = ['manzu', 'pinzu', 'souzu']
  for (const suit of suits) {
    for (let i = 0; i < 9; i++) {
      if (suitCounts[suit][i] >= 2) {
        suitCounts[suit][i] -= 2
        const melds: Meld[] = []
        if (findMelds(suitCounts, honorCounts, 4, melds)) {
          return {
            melds,
            pair: { suit, value: i + 1 },
          }
        }
        suitCounts[suit][i] += 2
      }
    }
  }

  // 字牌の雀頭を試す
  const honors: Honor[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red']
  for (const honor of honors) {
    if (honorCounts[honor] >= 2) {
      honorCounts[honor] -= 2
      const melds: Meld[] = []
      if (findMelds(suitCounts, honorCounts, 4, melds)) {
        return {
          melds,
          pair: { honor },
        }
      }
      honorCounts[honor] += 2
    }
  }

  return null
}

// 牌の配列をカウント配列に変換
function tilesToCounts(tiles: Tile[]): { suitCounts: SuitCounts; honorCounts: HonorCounts } {
  const suitCounts: SuitCounts = {
    manzu: new Array(9).fill(0),
    pinzu: new Array(9).fill(0),
    souzu: new Array(9).fill(0),
  }
  const honorCounts: HonorCounts = {
    east: 0,
    south: 0,
    west: 0,
    north: 0,
    white: 0,
    green: 0,
    red: 0,
  }

  for (const tile of tiles) {
    if (isNumberTile(tile)) {
      suitCounts[tile.suit][tile.value - 1]++
    } else if (isHonorTile(tile)) {
      honorCounts[tile.honor]++
    }
  }

  return { suitCounts, honorCounts }
}

// 面子を探して結果を記録
function findMelds(
  suitCounts: SuitCounts,
  honorCounts: HonorCounts,
  meldsNeeded: number,
  result: Meld[]
): boolean {
  if (meldsNeeded === 0) {
    const allEmpty =
      Object.values(suitCounts).every((arr) => arr.every((c) => c === 0)) &&
      Object.values(honorCounts).every((c) => c === 0)
    return allEmpty
  }

  // 字牌の刻子を探す
  const honors: Honor[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red']
  for (const honor of honors) {
    if (honorCounts[honor] >= 3) {
      honorCounts[honor] -= 3
      const meld: Meld = { type: 'koutsu', honor }
      result.push(meld)
      if (findMelds(suitCounts, honorCounts, meldsNeeded - 1, result)) {
        honorCounts[honor] += 3
        return true
      }
      result.pop()
      honorCounts[honor] += 3
    }
  }

  // 数牌の面子を探す
  const suits: Suit[] = ['manzu', 'pinzu', 'souzu']
  for (const suit of suits) {
    const counts = suitCounts[suit]

    // 最初の牌がある位置を探す
    let firstIdx = -1
    for (let i = 0; i < 9; i++) {
      if (counts[i] > 0) {
        firstIdx = i
        break
      }
    }

    if (firstIdx === -1) continue

    // 刻子を試す
    if (counts[firstIdx] >= 3) {
      counts[firstIdx] -= 3
      const meld: Meld = {
        type: 'koutsu',
        suit,
        tiles: [firstIdx + 1, firstIdx + 1, firstIdx + 1],
      }
      result.push(meld)
      if (findMelds(suitCounts, honorCounts, meldsNeeded - 1, result)) {
        counts[firstIdx] += 3
        return true
      }
      result.pop()
      counts[firstIdx] += 3
    }

    // 順子を試す
    if (
      firstIdx <= 6 &&
      counts[firstIdx] >= 1 &&
      counts[firstIdx + 1] >= 1 &&
      counts[firstIdx + 2] >= 1
    ) {
      counts[firstIdx]--
      counts[firstIdx + 1]--
      counts[firstIdx + 2]--
      const meld: Meld = {
        type: 'shuntsu',
        suit,
        tiles: [firstIdx + 1, firstIdx + 2, firstIdx + 3],
      }
      result.push(meld)
      if (findMelds(suitCounts, honorCounts, meldsNeeded - 1, result)) {
        counts[firstIdx]++
        counts[firstIdx + 1]++
        counts[firstIdx + 2]++
        return true
      }
      result.pop()
      counts[firstIdx]++
      counts[firstIdx + 1]++
      counts[firstIdx + 2]++
    }

    // この色に牌があるのに面子が作れなかった場合は失敗
    if (firstIdx !== -1) {
      return false
    }
  }

  return meldsNeeded === 0
}
