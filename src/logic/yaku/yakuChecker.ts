import {
  Tile,
  Suit,
  Honor,
  isSimple,
  isNumberTile,
  isHonorTile,
  isTerminal,
  isYaochuuhai,
  isSameTile,
} from '@/types/tile'
import { Yaku } from '@/types/yaku'
import {
  parseAllHands,
  parseAllHandsWithKans,
  ParsedHand,
  isChiitoitsu,
  isKokushi,
} from '@/logic/parser/handParser'

export interface WindContext {
  bakaze: Honor // 場風
  jikaze: Honor // 自風
}

// 1つの分解に対して通常役を判定
function checkYakuForParsed(
  parsed: ParsedHand,
  tiles: Tile[],
  context?: WindContext,
  winTile?: Tile
): Yaku[] {
  const yaku: Yaku[] = []

  if (checkTanyao(tiles)) yaku.push({ name: 'タンヤオ', han: 1 })
  if (checkPinfu(parsed, context, winTile)) yaku.push({ name: '平和', han: 1 })

  for (const honor of checkYakuhaiDragon(parsed)) {
    const label = { white: '白', green: '發', red: '中' }[honor]
    yaku.push({ name: `役牌(${label})`, han: 1 })
  }

  if (context) {
    const windLabel: Record<Honor, string> = {
      east: '東',
      south: '南',
      west: '西',
      north: '北',
      white: '白',
      green: '發',
      red: '中',
    }
    for (const { honor, han } of checkYakuhaiWind(parsed, context.bakaze, context.jikaze)) {
      yaku.push({ name: `役牌(${windLabel[honor]})`, han })
    }
  }

  const ryanpeikouCount = countRyanpeikou(parsed)
  if (ryanpeikouCount === 2) yaku.push({ name: '二盃口', han: 3 })
  else if (ryanpeikouCount === 1) yaku.push({ name: '一盃口', han: 1 })

  if (checkShousangen(parsed)) yaku.push({ name: '小三元', han: 2 })

  if (checkSanshoku(parsed)) yaku.push({ name: '三色同順', han: 2 })
  if (checkSanshokuDoukou(parsed)) yaku.push({ name: '三色同刻', han: 2 })
  if (checkIttsu(parsed)) yaku.push({ name: '一気通貫', han: 2 })
  if (checkToitoi(parsed)) yaku.push({ name: '対々和', han: 2 })
  if (checkSanankou(parsed)) yaku.push({ name: '三暗刻', han: 2 })
  if (checkSankantsu(parsed)) yaku.push({ name: '三槓子', han: 2 })

  if (checkJunchan(parsed)) yaku.push({ name: '純全帯幺九', han: 3 })
  else if (checkChanta(parsed)) yaku.push({ name: '混全帯幺九', han: 2 })

  if (checkChinitsu(tiles)) yaku.push({ name: '清一色', han: 6 })
  else if (checkHonitsu(tiles)) yaku.push({ name: '混一色', han: 3 })

  return yaku
}

// 役満の複合判定
export function checkAllYaku(
  tiles: Tile[],
  context?: WindContext,
  winTile?: Tile,
  ankans: Tile[] = []
): Yaku[] {
  // 暗カンあり手牌では全牌を展開
  const allTiles = ankans.length > 0 ? [...tiles, ...ankans.flatMap((t) => [t, t, t, t])] : tiles

  if (ankans.length === 0 && isKokushi(tiles)) {
    const is13sided =
      winTile &&
      (() => {
        const hand13 = [...tiles]
        const idx = hand13.findIndex((t) => isSameTile(t, winTile))
        if (idx === -1) return false
        hand13.splice(idx, 1)
        if (!hand13.every(isYaochuuhai)) return false
        const keys = hand13.map((t) =>
          isNumberTile(t) ? `${t.suit}-${t.value}` : `honor-${(t as { honor: string }).honor}`
        )
        return new Set(keys).size === 13
      })()
    return [{ name: is13sided ? '国士無双十三面' : '国士無双', han: is13sided ? 26 : 13 }]
  }

  const allParsed = ankans.length > 0 ? parseAllHandsWithKans(tiles, ankans) : parseAllHands(tiles)
  const yakuman: Yaku[] = []

  // 牌構成による役満（七対子形も含む）
  if (checkTsuuiisou(allTiles)) yakuman.push({ name: '字一色', han: 13 })
  if (checkRyuuiisou(allTiles)) yakuman.push({ name: '緑一色', han: 13 })
  if (checkChinroutou(allTiles)) yakuman.push({ name: '清老頭', han: 13 })
  if (checkChuuren(allTiles)) yakuman.push({ name: '九蓮宝燈', han: 13 })

  // 面子構成による役満
  for (const parsed of allParsed) {
    if (checkSuukantsu(parsed)) {
      yakuman.push({ name: '四槓子', han: 13 })
      break
    }
  }
  for (const parsed of allParsed) {
    if (checkSuuankou(parsed)) {
      const isTanki =
        winTile &&
        (isNumberTile(winTile)
          ? parsed.pair.suit === winTile.suit && parsed.pair.value === winTile.value
          : parsed.pair.honor === (winTile as { honor: Honor }).honor)
      yakuman.push({ name: isTanki ? '四暗刻単騎' : '四暗刻', han: isTanki ? 26 : 13 })
      break
    }
  }
  for (const parsed of allParsed) {
    if (checkDaisangen(parsed)) {
      yakuman.push({ name: '大三元', han: 13 })
      break
    }
  }

  if (yakuman.length > 0) return yakuman

  // 七対子と通常役を両方評価して高い方を返す（暗カンなしのみ）
  const chiitoitsuYaku: Yaku[] =
    ankans.length === 0 && isChiitoitsu(tiles) ? [{ name: '七対子', han: 2 }] : []

  let bestYaku: Yaku[] = []
  for (const parsed of allParsed) {
    const yaku = checkYakuForParsed(parsed, allTiles, context, winTile)
    if (yaku.reduce((s, y) => s + y.han, 0) > bestYaku.reduce((s, y) => s + y.han, 0)) {
      bestYaku = yaku
    }
  }

  const chiitoitsuHan = chiitoitsuYaku.reduce((s, y) => s + y.han, 0)
  const bestHan = bestYaku.reduce((s, y) => s + y.han, 0)

  if (chiitoitsuHan > bestHan) return chiitoitsuYaku
  return bestYaku
}

// タンヤオ: 全て中張牌（2-8）
function checkTanyao(tiles: Tile[]): boolean {
  return tiles.every((tile) => isSimple(tile))
}

// 平和: 全て順子 + 雀頭が役牌でない + 両面待ち
function checkPinfu(parsed: ParsedHand, context?: WindContext, winTile?: Tile): boolean {
  if (!parsed.melds.every((m) => m.type === 'shuntsu')) return false

  // 雀頭が役牌でないこと
  if (parsed.pair.honor !== undefined) {
    const dragons: Honor[] = ['white', 'green', 'red']
    if (dragons.includes(parsed.pair.honor)) return false
    if (context) {
      if (parsed.pair.honor === context.bakaze) return false
      if (parsed.pair.honor === context.jikaze) return false
    }
  }

  // 両面待ちであること
  if (!winTile || !isNumberTile(winTile)) return false
  for (const meld of parsed.melds) {
    if (meld.type !== 'shuntsu' || meld.suit !== winTile.suit) continue
    if (!meld.tiles?.includes(winTile.value)) continue
    const [s1, s2, s3] = meld.tiles
    if (winTile.value === s2) return false // 嵌張
    if (winTile.value === s3 && s1 === 1) return false // 辺張
    if (winTile.value === s1 && s3 === 9) return false // 辺張
    return true // 両面
  }
  return false
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

// 役牌（三元牌）: 白・發・中の刻子・槓子
function checkYakuhaiDragon(parsed: ParsedHand): Honor[] {
  const dragons: Honor[] = ['white', 'green', 'red']
  return parsed.melds
    .filter(
      (m) =>
        (m.type === 'koutsu' || m.type === 'kantsu') &&
        m.honor !== undefined &&
        dragons.includes(m.honor)
    )
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
    if ((meld.type !== 'koutsu' && meld.type !== 'kantsu') || meld.honor === undefined) continue
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

// 小三元: 三元牌2種の刻子・槓子＋残り1種の雀頭
function checkShousangen(parsed: ParsedHand): boolean {
  const dragons: Honor[] = ['white', 'green', 'red']
  const dragonKoutsu = parsed.melds.filter(
    (m) =>
      (m.type === 'koutsu' || m.type === 'kantsu') &&
      m.honor !== undefined &&
      dragons.includes(m.honor)
  )
  if (dragonKoutsu.length !== 2) return false
  return parsed.pair.honor !== undefined && dragons.includes(parsed.pair.honor)
}

// 三色同順: 3色で同じ数字の順子
function checkSanshoku(parsed: ParsedHand): boolean {
  const shuntsuBySuit: { [key in Suit]: number[] } = {
    manzu: [],
    pinzu: [],
    souzu: [],
  }

  for (const meld of parsed.melds) {
    if (meld.type === 'shuntsu' && meld.suit) {
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

// 三色同刻: 3色で同じ数字の刻子・槓子
function checkSanshokuDoukou(parsed: ParsedHand): boolean {
  const koutsuBySuit: { [key in Suit]: number[] } = {
    manzu: [],
    pinzu: [],
    souzu: [],
  }

  for (const meld of parsed.melds) {
    if ((meld.type === 'koutsu' || meld.type === 'kantsu') && meld.suit) {
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

// 対々和: 全て刻子・槓子
function checkToitoi(parsed: ParsedHand): boolean {
  return parsed.melds.every((m) => m.type === 'koutsu' || m.type === 'kantsu')
}

// 三暗刻: 暗刻（暗槓含む）3つ（門前なので全て暗刻扱い）
function checkSanankou(parsed: ParsedHand): boolean {
  const closedCount = parsed.melds.filter((m) => m.type === 'koutsu' || m.type === 'kantsu').length
  return closedCount === 3
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

// ── 役満 ──────────────────────────────────────────────

// 三槓子: 槓子3つ
function checkSankantsu(parsed: ParsedHand): boolean {
  return parsed.melds.filter((m) => m.type === 'kantsu').length === 3
}

// 四槓子: 槓子4つ
function checkSuukantsu(parsed: ParsedHand): boolean {
  return parsed.melds.every((m) => m.type === 'kantsu')
}

// 四暗刻: 暗刻（暗槓含む）4つ
function checkSuuankou(parsed: ParsedHand): boolean {
  return parsed.melds.filter((m) => m.type === 'koutsu' || m.type === 'kantsu').length === 4
}

// 大三元: 三元牌3種すべての刻子・槓子
function checkDaisangen(parsed: ParsedHand): boolean {
  const dragons: Honor[] = ['white', 'green', 'red']
  return dragons.every((d) =>
    parsed.melds.some((m) => (m.type === 'koutsu' || m.type === 'kantsu') && m.honor === d)
  )
}

// 字一色: 全て字牌
function checkTsuuiisou(tiles: Tile[]): boolean {
  return tiles.every(isHonorTile)
}

// 緑一色: 2s 3s 4s 6s 8s 發のみ
function checkRyuuiisou(tiles: Tile[]): boolean {
  const greenSouzu = [2, 3, 4, 6, 8]
  return tiles.every(
    (t) =>
      (isNumberTile(t) && t.suit === 'souzu' && greenSouzu.includes(t.value)) ||
      (isHonorTile(t) && t.honor === 'green')
  )
}

// 清老頭: 全て老頭牌（1か9の数牌）
function checkChinroutou(tiles: Tile[]): boolean {
  return tiles.every((t) => isTerminal(t))
}

// 九蓮宝燈: 同色で 1112345678999 + 同色1枚
function checkChuuren(tiles: Tile[]): boolean {
  const numberTiles = tiles.filter(isNumberTile)
  if (numberTiles.length !== 14) return false
  const suits = new Set(numberTiles.map((t) => t.suit))
  if (suits.size !== 1) return false

  const counts = new Array(9).fill(0)
  for (const t of numberTiles) counts[t.value - 1]++

  // 1と9が3枚以上、2〜8が1枚以上あること
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3]
  const extra = counts.map((c, i) => c - base[i])
  return extra.every((e) => e >= 0) && extra.reduce((s, e) => s + e, 0) === 1
}
