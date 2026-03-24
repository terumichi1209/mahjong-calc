import { Tile, Suit, Honor, isNumberTile, isHonorTile, isYaochuuhai } from '@/types/tile'

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

// 七対子形かどうか
export function isChiitoitsu(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false
  const counts = new Map<string, number>()
  for (const tile of tiles) {
    const key = isNumberTile(tile) ? `${tile.suit}-${tile.value}` : `honor-${tile.honor}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const pairs = [...counts.values()].filter((c) => c >= 2)
  return pairs.length === 7
}

// 国士無双形かどうか
export function isKokushi(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false
  const yaochuuTypes = new Set<string>()
  let hasExtraPair = false
  for (const tile of tiles) {
    if (!isYaochuuhai(tile)) return false
    const key = isNumberTile(tile) ? `${tile.suit}-${tile.value}` : `honor-${tile.honor}`
    if (yaochuuTypes.has(key)) {
      hasExtraPair = true
    } else {
      yaochuuTypes.add(key)
    }
  }
  return yaochuuTypes.size === 13 && hasExtraPair
}

// 手牌が有効な形（4面子+1雀頭 / 七対子 / 国士無双）かどうか検証
export function isValidHand(tiles: Tile[]): boolean {
  return parseHand(tiles) !== null || isChiitoitsu(tiles) || isKokushi(tiles)
}

// 手牌の全ての有効な分解を返す
export function parseAllHands(tiles: Tile[]): ParsedHand[] {
  if (tiles.length !== 14) return []

  const results: ParsedHand[] = []
  const { suitCounts, honorCounts } = tilesToCounts(tiles)

  const suits: Suit[] = ['manzu', 'pinzu', 'souzu']
  for (const suit of suits) {
    for (let i = 0; i < 9; i++) {
      if (suitCounts[suit][i] >= 2) {
        suitCounts[suit][i] -= 2
        for (const melds of findAllMelds(suitCounts, honorCounts, 4, [])) {
          results.push({ melds, pair: { suit, value: i + 1 } })
        }
        suitCounts[suit][i] += 2
      }
    }
  }

  const honors: Honor[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red']
  for (const honor of honors) {
    if (honorCounts[honor] >= 2) {
      honorCounts[honor] -= 2
      for (const melds of findAllMelds(suitCounts, honorCounts, 4, [])) {
        results.push({ melds, pair: { honor } })
      }
      honorCounts[honor] += 2
    }
  }

  return results
}

// 手牌を分解して結果を返す（無効な場合はnull）
export function parseHand(tiles: Tile[]): ParsedHand | null {
  const all = parseAllHands(tiles)
  return all.length > 0 ? all[0] : null
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

// 全ての有効な面子組み合わせを列挙
function findAllMelds(
  suitCounts: SuitCounts,
  honorCounts: HonorCounts,
  meldsNeeded: number,
  current: Meld[]
): Meld[][] {
  if (meldsNeeded === 0) {
    const allEmpty =
      Object.values(suitCounts).every((arr) => arr.every((c) => c === 0)) &&
      Object.values(honorCounts).every((c) => c === 0)
    return allEmpty ? [[...current]] : []
  }

  const results: Meld[][] = []

  // 字牌：最初に残っている字牌は必ず刻子にするしかない
  const honors: Honor[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red']
  for (const honor of honors) {
    if (honorCounts[honor] === 0) continue
    // 字牌があるが刻子を組めない場合は詰み
    if (honorCounts[honor] < 3) return []
    honorCounts[honor] -= 3
    current.push({ type: 'koutsu', honor })
    results.push(...findAllMelds(suitCounts, honorCounts, meldsNeeded - 1, current))
    current.pop()
    honorCounts[honor] += 3
    return results // この字牌は必ずここで使う
  }

  // 数牌：最初に残っている牌を必ず刻子か順子で使う
  const suits: Suit[] = ['manzu', 'pinzu', 'souzu']
  for (const suit of suits) {
    const counts = suitCounts[suit]
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
      current.push({ type: 'koutsu', suit, tiles: [firstIdx + 1, firstIdx + 1, firstIdx + 1] })
      results.push(...findAllMelds(suitCounts, honorCounts, meldsNeeded - 1, current))
      current.pop()
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
      current.push({ type: 'shuntsu', suit, tiles: [firstIdx + 1, firstIdx + 2, firstIdx + 3] })
      results.push(...findAllMelds(suitCounts, honorCounts, meldsNeeded - 1, current))
      current.pop()
      counts[firstIdx]++
      counts[firstIdx + 1]++
      counts[firstIdx + 2]++
    }

    return results // この牌は必ずここで使う
  }

  return results
}
