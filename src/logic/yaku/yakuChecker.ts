import { Tile, Suit, isSimple } from '@/types/tile'
import { Yaku } from '@/types/yaku'
import { parseHand, ParsedHand, Meld } from '@/logic/parser/handParser'

// 全ての役を判定
export function checkAllYaku(tiles: Tile[]): Yaku[] {
  const yaku: Yaku[] = []
  const parsed = parseHand(tiles)

  if (!parsed) return yaku

  // 1翻
  if (checkTanyao(tiles)) {
    yaku.push({ name: 'タンヤオ', han: 1 })
  }

  if (checkPinfu(parsed)) {
    yaku.push({ name: '平和', han: 1 })
  }

  // 一盃口と二盃口は複合しない
  const ryanpeikouCount = countRyanpeikou(parsed)
  if (ryanpeikouCount === 2) {
    yaku.push({ name: '二盃口', han: 3 })
  } else if (ryanpeikouCount === 1) {
    yaku.push({ name: '一盃口', han: 1 })
  }

  // 2翻
  if (checkSanshoku(parsed)) {
    yaku.push({ name: '三色同順', han: 2 })
  }

  if (checkSanshokuDoukou(parsed)) {
    yaku.push({ name: '三色同刻', han: 2 })
  }

  if (checkIttsu(parsed)) {
    yaku.push({ name: '一気通貫', han: 2 })
  }

  if (checkToitoi(parsed)) {
    yaku.push({ name: '対々和', han: 2 })
  }

  if (checkSanankou(parsed)) {
    yaku.push({ name: '三暗刻', han: 2 })
  }

  // チャンタと純チャンは複合しない（純チャン優先）
  if (checkJunchan(parsed)) {
    yaku.push({ name: '純全帯幺九', han: 3 })
  } else if (checkChanta(parsed)) {
    yaku.push({ name: '混全帯幺九', han: 2 })
  }

  // 6翻
  if (checkChinitsu(tiles)) {
    yaku.push({ name: '清一色', han: 6 })
  }

  return yaku
}

// タンヤオ: 全て中張牌（2-8）
function checkTanyao(tiles: Tile[]): boolean {
  return tiles.every((tile) => isSimple(tile))
}

// 平和: 順子のみ（字牌なしなので雀頭の条件は常に満たす）
function checkPinfu(parsed: ParsedHand): boolean {
  return parsed.melds.every((m) => m.type === 'shuntsu')
}

// 清一色: 全て同じ色
function checkChinitsu(tiles: Tile[]): boolean {
  const suits = new Set(tiles.map((t) => t.suit))
  return suits.size === 1
}

// 一盃口/二盃口のカウント
function countRyanpeikou(parsed: ParsedHand): number {
  const shuntsuList = parsed.melds.filter((m) => m.type === 'shuntsu')
  const used = new Array(shuntsuList.length).fill(false)
  let pairCount = 0

  for (let i = 0; i < shuntsuList.length; i++) {
    if (used[i]) continue
    for (let j = i + 1; j < shuntsuList.length; j++) {
      if (used[j]) continue
      if (
        shuntsuList[i].suit === shuntsuList[j].suit &&
        shuntsuList[i].tiles[0] === shuntsuList[j].tiles[0]
      ) {
        used[i] = true
        used[j] = true
        pairCount++
        break
      }
    }
  }
  return pairCount
}

// 三色同順: 3色で同じ数字の順子
function checkSanshoku(parsed: ParsedHand): boolean {
  const shuntsuBySuit: { [key in Suit]: number[] } = {
    manzu: [],
    pinzu: [],
    souzu: [],
  }

  for (const meld of parsed.melds) {
    if (meld.type === 'shuntsu') {
      shuntsuBySuit[meld.suit].push(meld.tiles[0])
    }
  }

  for (const start of shuntsuBySuit.manzu) {
    if (shuntsuBySuit.pinzu.includes(start) && shuntsuBySuit.souzu.includes(start)) {
      return true
    }
  }
  return false
}

// 三色同刻: 3色で同じ数字の刻子
function checkSanshokuDoukou(parsed: ParsedHand): boolean {
  const koutsuBySuit: { [key in Suit]: number[] } = {
    manzu: [],
    pinzu: [],
    souzu: [],
  }

  for (const meld of parsed.melds) {
    if (meld.type === 'koutsu') {
      koutsuBySuit[meld.suit].push(meld.tiles[0])
    }
  }

  for (const value of koutsuBySuit.manzu) {
    if (koutsuBySuit.pinzu.includes(value) && koutsuBySuit.souzu.includes(value)) {
      return true
    }
  }
  return false
}

// 一気通貫: 同じ色で123, 456, 789
function checkIttsu(parsed: ParsedHand): boolean {
  const suits: Suit[] = ['manzu', 'pinzu', 'souzu']

  for (const suit of suits) {
    const shuntsuStarts = parsed.melds
      .filter((m) => m.type === 'shuntsu' && m.suit === suit)
      .map((m) => m.tiles[0])

    if (shuntsuStarts.includes(1) && shuntsuStarts.includes(4) && shuntsuStarts.includes(7)) {
      return true
    }
  }
  return false
}

// 対々和: 全て刻子
function checkToitoi(parsed: ParsedHand): boolean {
  return parsed.melds.every((m) => m.type === 'koutsu')
}

// 三暗刻: 暗刻3つ（門前なので全て暗刻扱い）
function checkSanankou(parsed: ParsedHand): boolean {
  const koutsuCount = parsed.melds.filter((m) => m.type === 'koutsu').length
  return koutsuCount === 3
}

// 混全帯幺九（チャンタ）: 全ての面子と雀頭に1か9を含む（字牌なしなので純チャンと同じ条件）
function checkChanta(parsed: ParsedHand): boolean {
  return checkJunchan(parsed)
}

// 純全帯幺九（ジュンチャン）: 全ての面子と雀頭に1か9を含む
function checkJunchan(parsed: ParsedHand): boolean {
  // 雀頭が1か9か
  if (parsed.pair.value !== 1 && parsed.pair.value !== 9) {
    return false
  }

  // 全ての面子に1か9が含まれるか
  for (const meld of parsed.melds) {
    const hasTerminal = meld.tiles.some((t) => t === 1 || t === 9)
    if (!hasTerminal) {
      return false
    }
  }

  return true
}
