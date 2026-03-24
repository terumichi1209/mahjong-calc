import { StatusBar } from 'expo-status-bar'
import { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native'
import {
  Tile,
  Suit,
  TileValue,
  Honor,
  NumberTile,
  HonorTile,
  tileToSortKey,
  isSameTile,
} from '@/types/tile'
import { TILE_IMAGES } from '@/assets/tileImages'
import { checkAllYaku, WindContext } from '@/logic/yaku/yakuChecker'
import {
  WinMethod,
  calculateFu,
  buildScoreString,
  detectWaitType,
} from '@/logic/score/scoreCalculator'
import { isValidHandWithKans, parseAllHandsWithKans } from '@/logic/parser/handParser'

const HONORS: { honor: Honor; label: string }[] = [
  { honor: 'east', label: '東' },
  { honor: 'south', label: '南' },
  { honor: 'west', label: '西' },
  { honor: 'north', label: '北' },
  { honor: 'white', label: '白' },
  { honor: 'green', label: '發' },
  { honor: 'red', label: '中' },
]

const WINDS: { honor: Honor; label: string }[] = [
  { honor: 'east', label: '東' },
  { honor: 'south', label: '南' },
  { honor: 'west', label: '西' },
  { honor: 'north', label: '北' },
]

export default function App() {
  const [handTiles, setHandTiles] = useState<Tile[]>([])
  const [winTile, setWinTile] = useState<Tile | null>(null)
  const [yakuLines, setYakuLines] = useState<string[]>([])
  const [scoreLine, setScoreLine] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [bakaze, setBakaze] = useState<Honor>('east')
  const [jikaze, setJikaze] = useState<Honor>('east')
  const [winMethod, setWinMethod] = useState<WinMethod>('ron')
  const [riichi, setRiichi] = useState(false)
  const [ankans, setAnkans] = useState<Tile[]>([])
  const [isKanMode, setIsKanMode] = useState(false)

  const handSizeTarget = 13 - ankans.length * 3
  const totalCount = handTiles.length + (winTile ? 1 : 0) + ankans.length * 4

  const countTile = (tile: Tile) => {
    const inHand = handTiles.filter((t) => isSameTile(t, tile)).length
    const inWin = winTile && isSameTile(winTile, tile) ? 1 : 0
    const inKan = ankans.filter((t) => isSameTile(t, tile)).length * 4
    return inHand + inWin + inKan
  }

  const sortTiles = (tiles: Tile[]): Tile[] => {
    return [...tiles].sort((a, b) => tileToSortKey(a) - tileToSortKey(b))
  }

  const selectKanTile = (tile: Tile) => {
    if (ankans.length >= 4) return
    if (ankans.some((t) => isSameTile(t, tile))) return
    // 既存の同種牌を手牌・和了牌から除去してカンとして宣言
    const newHandTiles = handTiles.filter((t) => !isSameTile(t, tile))
    const newWinTile = winTile && isSameTile(winTile, tile) ? null : winTile
    setHandTiles(newHandTiles)
    setWinTile(newWinTile)
    setAnkans([...ankans, tile])
    setIsKanMode(false)
  }

  const selectNumberTile = (suit: Suit, value: TileValue) => {
    const tile: NumberTile = { type: 'number', suit, value }
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

  const selectHonorTile = (honor: Honor) => {
    const tile: HonorTile = { type: 'honor', honor }
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

  const removeHandTile = (index: number) => {
    setHandTiles(handTiles.filter((_, i) => i !== index))
  }

  const removeWinTile = () => {
    setWinTile(null)
  }

  const removeAnkan = (index: number) => {
    const tile = ankans[index]
    const fourCopies: Tile[] = [tile, tile, tile, tile]
    setHandTiles(sortTiles([...handTiles, ...fourCopies]))
    setAnkans(ankans.filter((_, i) => i !== index))
  }

  const tileImageKey = (tile: Tile): string => {
    if (tile.type === 'number') {
      const suit = { manzu: 'man', pinzu: 'pin', souzu: 'sou' }[tile.suit]
      return `${suit}${tile.value}`
    }
    return {
      east: 'east',
      south: 'south',
      west: 'west',
      north: 'north',
      white: 'haku',
      green: 'hatsu',
      red: 'chun',
    }[tile.honor]
  }

  const clearAll = () => {
    setHandTiles([])
    setWinTile(null)
    setAnkans([])
    setIsKanMode(false)
    setRiichi(false)
    setYakuLines([])
    setScoreLine(null)
    setIsSuccess(false)
  }

  // 手牌が揃ったら自動計算
  useEffect(() => {
    if (handTiles.length === handSizeTarget && winTile) {
      const nonKanTiles = [...handTiles, winTile]
      if (!isValidHandWithKans(nonKanTiles, ankans)) {
        setYakuLines(['無効な手牌（4面子+1雀頭の形になっていません）'])
        setScoreLine(null)
        setIsSuccess(false)
        return
      }

      const windContext: WindContext = { bakaze, jikaze }
      const yaku = checkAllYaku(nonKanTiles, windContext, winTile, ankans)
      if (riichi) yaku.push({ name: 'リーチ', han: 1 })
      const isChiitoitsu = yaku.some((y) => y.name === '七対子')
      const isYakuman = yaku.some((y) => y.han >= 13)

      if (yaku.length > 0) {
        const totalHan = yaku.reduce((sum, y) => sum + y.han, 0)
        const lines = yaku.map((y) => `${y.name}  ${y.han >= 13 ? '役満' : `${y.han}翻`}`)

        let scoreStr: string
        if (isYakuman || isChiitoitsu) {
          scoreStr = buildScoreString(totalHan, 25, winMethod, isChiitoitsu)
        } else {
          const parsedHands = parseAllHandsWithKans(nonKanTiles, ankans)
          const parsed = parsedHands.length > 0 ? parsedHands[0] : null
          const waitType = detectWaitType(nonKanTiles, winTile, ankans)
          const fu = parsed ? calculateFu(parsed, winMethod, waitType, bakaze, jikaze) : 30
          scoreStr = buildScoreString(totalHan, fu, winMethod)
        }

        setYakuLines(lines)
        setScoreLine(scoreStr)
        setIsSuccess(true)
      } else {
        setYakuLines(['役なし'])
        setScoreLine(null)
        setIsSuccess(false)
      }
    } else {
      setYakuLines([])
      setScoreLine(null)
      setIsSuccess(false)
    }
  }, [handTiles, winTile, ankans, bakaze, jikaze, winMethod, riichi])

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>麻雀点数計算</Text>

        <View style={styles.handContainer}>
          <Text style={styles.label}>
            手牌 ({totalCount}/{14 + ankans.length}){isKanMode ? '  【暗カン選択中】' : ''}
          </Text>
          {ankans.length > 0 && (
            <View style={[styles.tilesRow, styles.kanRow]}>
              {ankans.map((tile, kanIndex) => (
                <TouchableOpacity
                  key={`kan-${kanIndex}`}
                  style={styles.kanGroup}
                  onPress={() => removeAnkan(kanIndex)}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <Image
                      key={i}
                      source={TILE_IMAGES[tileImageKey(tile)]}
                      style={styles.tileImage}
                    />
                  ))}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.tilesRow}>
            {handTiles.map((tile, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedTile}
                onPress={() => removeHandTile(index)}
              >
                <Image source={TILE_IMAGES[tileImageKey(tile)]} style={styles.tileImage} />
              </TouchableOpacity>
            ))}
            {winTile && (
              <>
                <View style={styles.winTileSeparator} />
                <TouchableOpacity style={styles.winTile} onPress={removeWinTile}>
                  <Image source={TILE_IMAGES[tileImageKey(winTile)]} style={styles.tileImage} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.pickerWithControls}>
          <View style={styles.pickerColumn}>
            {(['manzu', 'pinzu', 'souzu'] as Suit[]).map((suit) => (
              <View key={suit} style={styles.pickerRow}>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileValue[]).map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.tileButton}
                    onPress={() => selectNumberTile(suit, value)}
                  >
                    <Image
                      source={TILE_IMAGES[tileImageKey({ type: 'number', suit, value })]}
                      style={styles.tileButtonImage}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.pickerRow}>
              {HONORS.map(({ honor }) => (
                <TouchableOpacity
                  key={honor}
                  style={styles.tileButton}
                  onPress={() => selectHonorTile(honor)}
                >
                  <Image
                    source={TILE_IMAGES[tileImageKey({ type: 'honor', honor })]}
                    style={styles.tileButtonImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sideControls}>
            <Text style={styles.sideLabel}>場風</Text>
            <View style={styles.sideWindGrid}>
              {WINDS.map(({ honor, label }) => (
                <TouchableOpacity
                  key={honor}
                  style={[styles.sideBtn, bakaze === honor && styles.sideBtnActive]}
                  onPress={() => setBakaze(honor)}
                >
                  <Text style={[styles.sideBtnText, bakaze === honor && styles.sideBtnTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sideLabel}>自風</Text>
            <View style={styles.sideWindGrid}>
              {WINDS.map(({ honor, label }) => (
                <TouchableOpacity
                  key={honor}
                  style={[styles.sideBtn, jikaze === honor && styles.sideBtnActive]}
                  onPress={() => setJikaze(honor)}
                >
                  <Text style={[styles.sideBtnText, jikaze === honor && styles.sideBtnTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sideLabel}>和了</Text>
            {(['ron', 'tsumo'] as WinMethod[]).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.sideMethodBtn, winMethod === method && styles.sideBtnActive]}
                onPress={() => setWinMethod(method)}
              >
                <Text
                  style={[styles.sideBtnText, winMethod === method && styles.sideBtnTextActive]}
                >
                  {method === 'ron' ? 'ロン' : 'ツモ'}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.sideLabel}>役</Text>
            <TouchableOpacity
              style={[styles.sideMethodBtn, riichi && styles.sideBtnActive]}
              onPress={() => setRiichi(!riichi)}
            >
              <Text style={[styles.sideBtnText, riichi && styles.sideBtnTextActive]}>リーチ</Text>
            </TouchableOpacity>
            <Text style={styles.sideLabel}>カン</Text>
            <TouchableOpacity
              style={[styles.sideMethodBtn, isKanMode && styles.kanBtnActive]}
              onPress={() => setIsKanMode(!isKanMode)}
            >
              <Text style={[styles.sideBtnText, isKanMode && styles.sideBtnTextActive]}>
                暗カン
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={clearAll}>
            <Text style={styles.actionButtonText}>クリア</Text>
          </TouchableOpacity>
        </View>

        {yakuLines.length > 0 && (
          <View
            style={[styles.resultContainer, isSuccess ? styles.resultSuccess : styles.resultError]}
          >
            {yakuLines.map((line, i) => (
              <Text
                key={i}
                style={[
                  styles.yakuLine,
                  isSuccess ? styles.resultTextSuccess : styles.resultTextError,
                ]}
              >
                {line}
              </Text>
            ))}
            {scoreLine && (
              <>
                <View style={styles.divider} />
                <Text
                  style={[
                    styles.scoreLine,
                    isSuccess ? styles.resultTextSuccess : styles.resultTextError,
                  ]}
                >
                  {scoreLine}
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  handContainer: {
    marginBottom: 24,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    minHeight: 40,
    backgroundColor: '#e8e8e8',
    padding: 4,
    borderRadius: 8,
  },
  kanRow: {
    backgroundColor: '#FFF3E0',
    marginBottom: 4,
  },
  selectedTile: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 3,
  },
  winTileSeparator: {
    width: 2,
    backgroundColor: '#1976D2',
    marginHorizontal: 4,
    borderRadius: 1,
  },
  kanGroup: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#FF8F00',
    borderRadius: 4,
    backgroundColor: '#FFF8E1',
    marginRight: 4,
  },
  winTile: {
    padding: 0,
    borderWidth: 2,
    borderColor: '#1976D2',
    borderRadius: 4,
  },
  tileImage: {
    width: 28,
    height: 37,
    resizeMode: 'contain',
  },
  pickerWithControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },
  tileButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 3,
  },
  tileButtonImage: {
    width: 34,
    height: 44,
    resizeMode: 'contain',
  },
  sideControls: {
    width: 68,
  },
  sideLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
    marginTop: 6,
    marginBottom: 3,
  },
  sideWindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  sideBtn: {
    width: 30,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  kanBtnActive: {
    backgroundColor: '#FF8F00',
    borderColor: '#FF8F00',
  },
  sideBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sideBtnTextActive: {
    color: '#fff',
  },
  sideMethodBtn: {
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ddd',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  resultSuccess: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  resultError: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  yakuLine: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#90CAF9',
    marginVertical: 8,
  },
  scoreLine: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultTextSuccess: {
    color: '#1565C0',
  },
  resultTextError: {
    color: '#c62828',
  },
})
