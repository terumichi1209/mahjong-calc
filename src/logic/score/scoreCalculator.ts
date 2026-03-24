import { Honor } from '@/types/tile'
import { ParsedHand } from '@/logic/parser/handParser'

export type WinMethod = 'ron' | 'tsumo'
export type WaitType = 'ryanmen' | 'shanpon' | 'kanchan' | 'penchan' | 'tanki'

// 待ちの日本語表記
export const WAIT_TYPE_LABELS: Record<WaitType, string> = {
  ryanmen: '両面',
  shanpon: '双碰',
  kanchan: '嵌張',
  penchan: '辺張',
  tanki: '単騎',
}

// 点数計算結果
export interface ScoreResult {
  han: number
  fu: number
  score: number
  label: string // 点数の呼称（満貫など）
  yaku: string[]
}

// 符計算
export function calculateFu(
  parsed: ParsedHand,
  winMethod: WinMethod,
  waitType: WaitType,
  bakaze?: Honor,
  jikaze?: Honor
): number {
  let fu = 20

  // 門前加符
  if (winMethod === 'ron') fu += 10
  else fu += 2 // ツモ加符

  // 刻子の符
  for (const meld of parsed.melds) {
    if (meld.type !== 'koutsu') continue
    const isYaochuuhai =
      meld.honor !== undefined ||
      (meld.tiles !== undefined && (meld.tiles[0] === 1 || meld.tiles[0] === 9))
    fu += isYaochuuhai ? 16 : 4
  }

  // 雀頭の符
  if (parsed.pair.honor !== undefined) {
    const dragons: Honor[] = ['white', 'green', 'red']
    if (dragons.includes(parsed.pair.honor)) fu += 2
    if (bakaze && parsed.pair.honor === bakaze) fu += 2
    if (jikaze && parsed.pair.honor === jikaze) fu += 2
  }

  // 待ちの符
  if (waitType === 'kanchan' || waitType === 'penchan' || waitType === 'tanki') fu += 2

  return Math.ceil(fu / 10) * 10
}

// 点数ラベル
function getScoreLabel(han: number, basePoints: number): string {
  if (han >= 13) return '役満'
  if (han >= 11) return '三倍満'
  if (han >= 8) return '倍満'
  if (han >= 6) return '跳満'
  if (han >= 5 || basePoints >= 2000) return '満貫'
  return ''
}

// 子のロン点数
export function calcRonScore(han: number, fu: number): number {
  const base = fu * Math.pow(2, han + 2)
  if (han >= 13) return 32000
  if (han >= 11) return 24000
  if (han >= 8) return 16000
  if (han >= 6) return 12000
  if (han >= 5 || base >= 2000) return 8000
  return Math.ceil((base * 4) / 100) * 100
}

// 子のツモ：[子払い, 親払い]
export function calcTsumoScore(han: number, fu: number): [number, number] {
  const base = fu * Math.pow(2, han + 2)
  if (han >= 13) return [8000, 16000]
  if (han >= 11) return [6000, 12000]
  if (han >= 8) return [4000, 8000]
  if (han >= 6) return [3000, 6000]
  if (han >= 5 || base >= 2000) return [2000, 4000]
  const ko = Math.ceil((base * 2) / 100) * 100
  const oya = Math.ceil((base * 4) / 100) * 100 // 誤: 親は子の2倍ではなくbase×4
  return [ko, oya]
}

// スコア文字列を生成
export function buildScoreString(
  han: number,
  fu: number,
  winMethod: WinMethod,
  isChiitoitsu = false
): string {
  const base = fu * Math.pow(2, han + 2)
  const label = getScoreLabel(han, base)

  if (winMethod === 'ron') {
    const score = calcRonScore(han, fu)
    const labelStr = label ? `【${label}】` : ''
    return `${han}翻${isChiitoitsu ? '' : `${fu}符`} ${score}点 (ロン)${labelStr}`
  } else {
    const [ko, oya] = calcTsumoScore(han, fu)
    const labelStr = label ? `【${label}】` : ''
    return `${han}翻${isChiitoitsu ? '' : `${fu}符`} 子${ko}/親${oya} (ツモ)${labelStr}`
  }
}
