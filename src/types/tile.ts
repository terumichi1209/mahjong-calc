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

// 三元牌かどうか
export function isDragon(tile: Tile): boolean {
  return (
    isHonorTile(tile) && (tile.honor === 'white' || tile.honor === 'green' || tile.honor === 'red')
  )
}

// 風牌かどうか
export function isWind(tile: Tile): boolean {
  return (
    isHonorTile(tile) &&
    (tile.honor === 'east' ||
      tile.honor === 'south' ||
      tile.honor === 'west' ||
      tile.honor === 'north')
  )
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

// 牌を文字列に変換（表示用）
export function tileToString(tile: Tile): string {
  if (isNumberTile(tile)) {
    const suitChar = { manzu: 'm', pinzu: 'p', souzu: 's' }
    return `${tile.value}${suitChar[tile.suit]}`
  } else {
    const honorChar: Record<Honor, string> = {
      east: '東',
      south: '南',
      west: '西',
      north: '北',
      white: '白',
      green: '發',
      red: '中',
    }
    return honorChar[tile.honor]
  }
}

// 牌を漢字2行で表示するための上段・下段を返す
export function tileToKanji(tile: Tile): { top: string; bottom: string } {
  if (isNumberTile(tile)) {
    const num = ['一', '二', '三', '四', '五', '六', '七', '八', '九'][tile.value - 1]
    const suit = { manzu: '萬', pinzu: '筒', souzu: '索' }[tile.suit]
    return { top: num, bottom: suit }
  } else {
    const label: Record<Honor, string> = {
      east: '東',
      south: '南',
      west: '西',
      north: '北',
      white: '白',
      green: '發',
      red: '中',
    }
    return { top: label[tile.honor], bottom: '' }
  }
}

// 牌を絵文字に変換（表示用）
export function tileToEmoji(tile: Tile): string {
  if (isNumberTile(tile)) {
    const manzu = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏']
    const pinzu = ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡']
    const souzu = ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘']
    const map = { manzu, pinzu, souzu }
    return map[tile.suit][tile.value - 1]
  } else {
    const honorEmoji: Record<Honor, string> = {
      east: '🀀',
      south: '🀁',
      west: '🀂',
      north: '🀃',
      white: '🀆',
      green: '🀅',
      red: '🀄',
    }
    return honorEmoji[tile.honor]
  }
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
