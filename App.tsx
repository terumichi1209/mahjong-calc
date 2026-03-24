import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native'
import { useMahjongCalc } from '@/hooks/useMahjongCalc'
import { HandDisplay } from '@/components/HandDisplay'
import { TilePicker } from '@/components/TilePicker'
import { SideControls } from '@/components/SideControls'
import { ResultDisplay } from '@/components/ResultDisplay'

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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>麻雀点数計算</Text>

        <HandDisplay
          handTiles={handTiles}
          winTile={winTile}
          ankans={ankans}
          isKanMode={isKanMode}
          totalCount={totalCount}
          onRemoveHandTile={removeHandTile}
          onRemoveWinTile={removeWinTile}
          onRemoveAnkan={removeAnkan}
        />

        <View style={styles.pickerWithControls}>
          <View style={styles.pickerColumn}>
            <TilePicker onSelectNumberTile={selectNumberTile} onSelectHonorTile={selectHonorTile} />
          </View>
          <SideControls
            bakaze={bakaze}
            jikaze={jikaze}
            winMethod={winMethod}
            riichi={riichi}
            isKanMode={isKanMode}
            onSetBakaze={setBakaze}
            onSetJikaze={setJikaze}
            onSetWinMethod={setWinMethod}
            onToggleRiichi={() => setRiichi(!riichi)}
            onToggleKanMode={() => setIsKanMode(!isKanMode)}
          />
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={clearAll}>
            <Text style={styles.actionButtonText}>クリア</Text>
          </TouchableOpacity>
        </View>

        <ResultDisplay
          yakuLines={result.yakuLines}
          scoreLine={result.scoreLine}
          isSuccess={result.isSuccess}
        />
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
  pickerWithControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
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
})
