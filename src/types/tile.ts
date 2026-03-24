// 数牌の種類
export type Suit = 'manzu' | 'pinzu' | 'souzu'

// 数牌の値
export type TileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// 字牌の種類
export type Honor = 'east' | 'south' | 'west' | 'north' | 'white' | 'green' | 'red'

// 数牌
export interface NumberTile {
  type: 'number'
  suit: Suit
  value: TileValue
}

// 字牌
export interface HonorTile {
  type: 'honor'
  honor: Honor
}

// 牌
export type Tile = NumberTile | HonorTile

// 数牌かどうか
export function isNumberTile(tile: Tile): tile is NumberTile {
  return tile.type === 'number'
}

// 字牌かどうか
export function isHonorTile(tile: Tile): tile is HonorTile {
  return tile.type === 'honor'
}

// タンヤオ判定用：中張牌（2〜8）かどうか
export function isSimple(tile: Tile): boolean {
  return isNumberTile(tile) && tile.value >= 2 && tile.value <= 8
}

// 老頭牌（1か9）かどうか
export function isTerminal(tile: Tile): boolean {
  return isNumberTile(tile) && (tile.value === 1 || tile.value === 9)
}

// 幺九牌（老頭牌または字牌）かどうか
export function isYaochuuhai(tile: Tile): boolean {
  return isHonorTile(tile) || isTerminal(tile)
}

// 牌が同じかどうか
export function isSameTile(a: Tile, b: Tile): boolean {
  if (a.type !== b.type) return false
  if (isNumberTile(a) && isNumberTile(b)) {
    return a.suit === b.suit && a.value === b.value
  }
  if (isHonorTile(a) && isHonorTile(b)) {
    return a.honor === b.honor
  }
  return false
}

// 牌のソート用キー
export function tileToSortKey(tile: Tile): number {
  if (isNumberTile(tile)) {
    const suitOrder = { manzu: 0, pinzu: 1, souzu: 2 }
    return suitOrder[tile.suit] * 10 + tile.value
  } else {
    const honorOrder: Record<Honor, number> = {
      east: 100,
      south: 101,
      west: 102,
      north: 103,
      white: 104,
      green: 105,
      red: 106,
    }
    return honorOrder[tile.honor]
  }
}
