import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native'
import { Suit, TileValue, Honor } from '@/types/tile'
import { TILE_IMAGES, tileImageKey } from '@/assets/tileImages'
import { WinMethod } from '@/logic/score/scoreCalculator'
import { useMahjongCalc } from '@/hooks/useMahjongCalc'

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
  const {
    handTiles,
    winTile,
    ankans,
    isKanMode,
    bakaze,
    jikaze,
    winMethod,
    riichi,
    totalCount,
    result,
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
  } = useMahjongCalc()

  const { yakuLines, scoreLine, isSuccess } = result

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
