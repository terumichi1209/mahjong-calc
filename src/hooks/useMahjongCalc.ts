import { useState, useEffect } from 'react'
import {
  Tile,
  Honor,
  Suit,
  TileValue,
  NumberTile,
  HonorTile,
  tileToSortKey,
  isSameTile,
} from '@/types/tile'
import {
  WinMethod,
  calculateFu,
  buildScoreString,
  detectWaitType,
} from '@/logic/score/scoreCalculator'
import { checkAllYaku, WindContext } from '@/logic/yaku/yakuChecker'
import { isValidHandWithKans, parseAllHandsWithKans } from '@/logic/parser/handParser'

export interface CalcResult {
  yakuLines: string[]
  scoreLine: string | null
  isSuccess: boolean
}

export function useMahjongCalc() {
  const [handTiles, setHandTiles] = useState<Tile[]>([])
  const [winTile, setWinTile] = useState<Tile | null>(null)
  const [ankans, setAnkans] = useState<Tile[]>([])
  const [isKanMode, setIsKanMode] = useState(false)
  const [bakaze, setBakaze] = useState<Honor>('east')
  const [jikaze, setJikaze] = useState<Honor>('east')
  const [winMethod, setWinMethod] = useState<WinMethod>('ron')
  const [riichi, setRiichi] = useState(false)
  const [result, setResult] = useState<CalcResult>({
    yakuLines: [],
    scoreLine: null,
    isSuccess: false,
  })

  const handSizeTarget = 13 - ankans.length * 3
  const totalCount = handTiles.length + (winTile ? 1 : 0) + ankans.length * 4

  const sortTiles = (tiles: Tile[]): Tile[] =>
    [...tiles].sort((a, b) => tileToSortKey(a) - tileToSortKey(b))

  const countTile = (tile: Tile): number => {
    const inHand = handTiles.filter((t) => isSameTile(t, tile)).length
    const inWin = winTile && isSameTile(winTile, tile) ? 1 : 0
    const inKan = ankans.filter((t) => isSameTile(t, tile)).length * 4
    return inHand + inWin + inKan
  }

  const selectKanTile = (tile: Tile) => {
    if (ankans.length >= 4) return
    if (ankans.some((t) => isSameTile(t, tile))) return
    setHandTiles(handTiles.filter((t) => !isSameTile(t, tile)))
    setWinTile(winTile && isSameTile(winTile, tile) ? null : winTile)
    setAnkans([...ankans, tile])
    setIsKanMode(false)
  }

  const selectTile = (tile: Tile) => {
    if (isKanMode) {
      selectKanTile(tile)
      return
    }
    if (countTile(tile) >= 4) return
    if (handTiles.length < handSizeTarget) {
      setHandTiles(sortTiles([...handTiles, tile]))
    } else if (!winTile) {
      setWinTile(tile)
    }
  }

  const selectNumberTile = (suit: Suit, value: TileValue) =>
    selectTile({ type: 'number', suit, value } as NumberTile)

  const selectHonorTile = (honor: Honor) => selectTile({ type: 'honor', honor } as HonorTile)

  const removeHandTile = (index: number) => setHandTiles(handTiles.filter((_, i) => i !== index))

  const removeWinTile = () => setWinTile(null)

  const removeAnkan = (index: number) => {
    const tile = ankans[index]
    setHandTiles(sortTiles([...handTiles, tile, tile, tile, tile]))
    setAnkans(ankans.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setHandTiles([])
    setWinTile(null)
    setAnkans([])
    setIsKanMode(false)
    setRiichi(false)
    setResult({ yakuLines: [], scoreLine: null, isSuccess: false })
  }

  useEffect(() => {
    if (handTiles.length !== handSizeTarget || !winTile) {
      setResult({ yakuLines: [], scoreLine: null, isSuccess: false })
      return
    }

    const nonKanTiles = [...handTiles, winTile]
    if (!isValidHandWithKans(nonKanTiles, ankans)) {
      setResult({
        yakuLines: ['無効な手牌（4面子+1雀頭の形になっていません）'],
        scoreLine: null,
        isSuccess: false,
      })
      return
    }

    const windContext: WindContext = { bakaze, jikaze }
    const yaku = checkAllYaku(nonKanTiles, windContext, winTile, ankans)
    if (riichi) yaku.push({ name: 'リーチ', han: 1 })

    if (yaku.length === 0) {
      setResult({ yakuLines: ['役なし'], scoreLine: null, isSuccess: false })
      return
    }

    const totalHan = yaku.reduce((sum, y) => sum + y.han, 0)
    const yakuLines = yaku.map((y) => `${y.name}  ${y.han >= 13 ? '役満' : `${y.han}翻`}`)
    const isChiitoitsu = yaku.some((y) => y.name === '七対子')
    const isYakuman = yaku.some((y) => y.han >= 13)

    let scoreLine: string
    if (isYakuman || isChiitoitsu) {
      scoreLine = buildScoreString(totalHan, 25, winMethod, isChiitoitsu)
    } else {
      const parsedHands = parseAllHandsWithKans(nonKanTiles, ankans)
      const parsed = parsedHands[0] ?? null
      const waitType = detectWaitType(nonKanTiles, winTile, ankans)
      const fu = parsed ? calculateFu(parsed, winMethod, waitType, bakaze, jikaze) : 30
      scoreLine = buildScoreString(totalHan, fu, winMethod)
    }

    setResult({ yakuLines, scoreLine, isSuccess: true })
  }, [handTiles, winTile, ankans, bakaze, jikaze, winMethod, riichi])

  return {
    // state
    handTiles,
    winTile,
    ankans,
    isKanMode,
    bakaze,
    jikaze,
    winMethod,
    riichi,
    // derived
    handSizeTarget,
    totalCount,
    result,
    // actions
    selectNumberTile,
    selectHonorTile,
    removeHandTile,
    removeWinTile,
    removeAnkan,
    clearAll,
    setBakaze,
    setJikaze,
    setWinMethod,
    setRiichi,
    setIsKanMode,
  }
}
