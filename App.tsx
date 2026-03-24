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
import { isValidHand, parseHand } from '@/logic/parser/handParser'

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

  const totalCount = handTiles.length + (winTile ? 1 : 0)

  const countTile = (tile: Tile) => {
    const inHand = handTiles.filter((t) => isSameTile(t, tile)).length
    const inWin = winTile && isSameTile(winTile, tile) ? 1 : 0
    return inHand + inWin
  }

  const sortTiles = (tiles: Tile[]): Tile[] => {
    return [...tiles].sort((a, b) => tileToSortKey(a) - tileToSortKey(b))
  }

  const selectNumberTile = (suit: Suit, value: TileValue) => {
    const tile: NumberTile = { type: 'number', suit, value }
    if (countTile(tile) >= 4) return
    if (handTiles.length < 13) {
      setHandTiles(sortTiles([...handTiles, tile]))
    } else if (!winTile) {
      setWinTile(tile)
    }
  }

  const selectHonorTile = (honor: Honor) => {
    const tile: HonorTile = { type: 'honor', honor }
    if (countTile(tile) >= 4) return
    if (handTiles.length < 13) {
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
    setYakuLines([])
    setScoreLine(null)
    setIsSuccess(false)
  }

  // 13枚+和了牌が揃ったら自動計算
  useEffect(() => {
    if (handTiles.length === 13 && winTile) {
      const allTiles = [...handTiles, winTile]
      if (!isValidHand(allTiles)) {
        setYakuLines(['無効な手牌（4面子+1雀頭の形になっていません）'])
        setScoreLine(null)
        setIsSuccess(false)
        return
      }

      const windContext: WindContext = { bakaze, jikaze }
      const yaku = checkAllYaku(allTiles, windContext)
      const isChiitoitsu = yaku.some((y) => y.name === '七対子')
      const isKokushiYaku = yaku.some((y) => y.name === '国士無双')

      if (yaku.length > 0) {
        const totalHan = yaku.reduce((sum, y) => sum + y.han, 0)
        const lines = yaku.map((y) => `${y.name}  ${y.han}翻`)

        let scoreStr: string
        if (isKokushiYaku || isChiitoitsu) {
          scoreStr = buildScoreString(totalHan, 25, winMethod, isChiitoitsu)
        } else {
          const parsed = parseHand(allTiles)
          const waitType = detectWaitType(allTiles, winTile)
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
  }, [handTiles, winTile, bakaze, jikaze, winMethod])

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>麻雀点数計算</Text>

        <View style={styles.windContainer}>
          <View style={styles.windRow}>
            <Text style={styles.windLabel}>場風</Text>
            {WINDS.map(({ honor, label }) => (
              <TouchableOpacity
                key={honor}
                style={[styles.windButton, bakaze === honor && styles.windButtonActive]}
                onPress={() => setBakaze(honor)}
              >
                <Text
                  style={[styles.windButtonText, bakaze === honor && styles.windButtonTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.windRow}>
            <Text style={styles.windLabel}>自風</Text>
            {WINDS.map(({ honor, label }) => (
              <TouchableOpacity
                key={honor}
                style={[styles.windButton, jikaze === honor && styles.windButtonActive]}
                onPress={() => setJikaze(honor)}
              >
                <Text
                  style={[styles.windButtonText, jikaze === honor && styles.windButtonTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.windContainer}>
          <View style={styles.windRow}>
            <Text style={styles.windLabel}>和了</Text>
            {(['ron', 'tsumo'] as WinMethod[]).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.windButton, winMethod === method && styles.windButtonActive]}
                onPress={() => setWinMethod(method)}
              >
                <Text
                  style={[
                    styles.windButtonText,
                    winMethod === method && styles.windButtonTextActive,
                  ]}
                >
                  {method === 'ron' ? 'ロン' : 'ツモ'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.handContainer}>
          <Text style={styles.label}>手牌 ({totalCount}/14)</Text>
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

        <View style={styles.pickerRow}>
          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileValue[]).map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.tileButton}
              onPress={() => selectNumberTile('manzu', value)}
            >
              <Text style={styles.tileButtonText}>{value}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pickerRow}>
          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileValue[]).map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.tileButton}
              onPress={() => selectNumberTile('pinzu', value)}
            >
              <Text style={styles.tileButtonText}>{value}p</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pickerRow}>
          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as TileValue[]).map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.tileButton}
              onPress={() => selectNumberTile('souzu', value)}
            >
              <Text style={styles.tileButtonText}>{value}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pickerRow}>
          {HONORS.map(({ honor, label }) => (
            <TouchableOpacity
              key={honor}
              style={styles.tileButton}
              onPress={() => selectHonorTile(honor)}
            >
              <Text style={styles.tileButtonText}>{label}</Text>
            </TouchableOpacity>
          ))}
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
  windContainer: {
    marginBottom: 16,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  windLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    width: 30,
  },
  windButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  windButtonActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  windButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  windButtonTextActive: {
    color: '#fff',
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
  selectedTile: {
    padding: 0,
  },
  winTileSeparator: {
    width: 2,
    backgroundColor: '#1976D2',
    marginHorizontal: 4,
    borderRadius: 1,
  },
  winTile: {
    padding: 0,
    borderWidth: 2,
    borderColor: '#1976D2',
    borderRadius: 4,
  },
  tileImage: {
    width: 40,
    height: 52,
    resizeMode: 'contain',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  tileButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  tileButtonText: {
    fontSize: 18,
    fontWeight: '600',
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
