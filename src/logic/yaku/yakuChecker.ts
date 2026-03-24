import { Tile, Suit, Honor, isSimple, isNumberTile, isHonorTile } from '@/types/tile'
import { Yaku } from '@/types/yaku'
import { parseHand, ParsedHand, isChiitoitsu, isKokushi } from '@/logic/parser/handParser'

export interface WindContext {
  bakaze: Honor // 場風
  jikaze: Honor // 自風
}

// 全ての役を判定
export function checkAllYaku(tiles: Tile[], context?: WindContext): Yaku[] {
  const yaku: Yaku[] = []

  // 特殊形（役満）
  if (isKokushi(tiles)) {
    return [{ name: '国士無双', han: 13 }]
  }

  // 七対子（単独判定）
  if (isChiitoitsu(tiles)) {
    return [{ name: '七対子', han: 2 }]
  }

  const parsed = parseHand(tiles)

  if (!parsed) return yaku

  // 1翻
  if (checkTanyao(tiles)) {
    yaku.push({ name: 'タンヤオ', han: 1 })
  }

  if (checkPinfu(parsed)) {
    yaku.push({ name: '平和', han: 1 })
  }

  // 役牌（三元牌）
  for (const honor of checkYakuhaiDragon(parsed)) {
    const label = { white: '白', green: '發', red: '中' }[honor]
    yaku.push({ name: `役牌(${label})`, han: 1 })
  }

  // 役牌（風牌）
  if (context) {
    for (const { honor, han } of checkYakuhaiWind(parsed, context.bakaze, context.jikaze)) {
      const label: Record<Honor, string> = {
        east: '東',
        south: '南',
        west: '西',
        north: '北',
        white: '白',
        green: '發',
        red: '中',
      }
      yaku.push({ name: `役牌(${label[honor]})`, han })
    }
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

  // 混一色と清一色は複合しない（清一色優先）
  if (checkChinitsu(tiles)) {
    yaku.push({ name: '清一色', han: 6 })
  } else if (checkHonitsu(tiles)) {
    yaku.push({ name: '混一色', han: 3 })
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

// 清一色: 全て同じ色の数牌（字牌なし）
function checkChinitsu(tiles: Tile[]): boolean {
  if (tiles.some(isHonorTile)) return false
  const suits = new Set(tiles.filter(isNumberTile).map((t) => t.suit))
  return suits.size === 1
}

// 混一色: 1色の数牌＋字牌（数牌は1色のみ）
function checkHonitsu(tiles: Tile[]): boolean {
  const numberTiles = tiles.filter(isNumberTile)
  const honorTiles = tiles.filter(isHonorTile)
  if (numberTiles.length === 0 || honorTiles.length === 0) return false
  const suits = new Set(numberTiles.map((t) => t.suit))
  return suits.size === 1
}

// 役牌（三元牌）: 白・發・中の刻子
function checkYakuhaiDragon(parsed: ParsedHand): Honor[] {
  const dragons: Honor[] = ['white', 'green', 'red']
  return parsed.melds
    .filter((m) => m.type === 'koutsu' && m.honor !== undefined && dragons.includes(m.honor))
    .map((m) => m.honor!)
}

// 役牌（風牌）: 場風・自風の刻子
function checkYakuhaiWind(
  parsed: ParsedHand,
  bakaze: Honor,
  jikaze: Honor
): { honor: Honor; han: number }[] {
  const result: { honor: Honor; han: number }[] = []
  for (const meld of parsed.melds) {
    if (meld.type !== 'koutsu' || meld.honor === undefined) continue
    const isBakaze = meld.honor === bakaze
    const isJikaze = meld.honor === jikaze
    if (isBakaze || isJikaze) {
      result.push({ honor: meld.honor, han: isBakaze && isJikaze ? 2 : 1 })
    }
  }
  return result
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

// 純全帯幺九（ジュンチャン）: 全面子・雀頭に1か9を含む（字牌なし）
function checkJunchan(parsed: ParsedHand): boolean {
  // 雀頭が数牌の1か9（字牌はNG）
  if (parsed.pair.honor !== undefined) return false
  if (parsed.pair.value !== 1 && parsed.pair.value !== 9) return false

  for (const meld of parsed.melds) {
    if (meld.honor !== undefined) return false // 字牌面子はNG
    if (!meld.tiles || !meld.tiles.some((t) => t === 1 || t === 9)) return false
  }
  return true
}

// 混全帯幺九（チャンタ）: 全面子・雀頭に幺九牌を含み、字牌が1つ以上ある
function checkChanta(parsed: ParsedHand): boolean {
  const pairHasYaochuuhai =
    parsed.pair.honor !== undefined || parsed.pair.value === 1 || parsed.pair.value === 9
  if (!pairHasYaochuuhai) return false

  let hasHonor = parsed.pair.honor !== undefined

  for (const meld of parsed.melds) {
    if (meld.honor !== undefined) {
      hasHonor = true
      continue // 字牌刻子は幺九牌を含む
    }
    if (!meld.tiles || !meld.tiles.some((t) => t === 1 || t === 9)) return false
  }

  return hasHonor // 字牌がなければ純チャン（チャンタにならない）
}
