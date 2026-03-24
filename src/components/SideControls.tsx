import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { Honor } from '@/types/tile'
import { WinMethod } from '@/logic/score/scoreCalculator'

const WINDS: { honor: Honor; label: string }[] = [
  { honor: 'east', label: '東' },
  { honor: 'south', label: '南' },
  { honor: 'west', label: '西' },
  { honor: 'north', label: '北' },
]

interface Props {
  bakaze: Honor
  jikaze: Honor
  winMethod: WinMethod
  riichi: boolean
  isKanMode: boolean
  onSetBakaze: (h: Honor) => void
  onSetJikaze: (h: Honor) => void
  onSetWinMethod: (m: WinMethod) => void
  onToggleRiichi: () => void
  onToggleKanMode: () => void
}

export function SideControls({
  bakaze,
  jikaze,
  winMethod,
  riichi,
  isKanMode,
  onSetBakaze,
  onSetJikaze,
  onSetWinMethod,
  onToggleRiichi,
  onToggleKanMode,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>場風</Text>
      <View style={styles.windGrid}>
        {WINDS.map(({ honor, label }) => (
          <TouchableOpacity
            key={honor}
            style={[styles.btn, bakaze === honor && styles.btnActive]}
            onPress={() => onSetBakaze(honor)}
          >
            <Text style={[styles.btnText, bakaze === honor && styles.btnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>自風</Text>
      <View style={styles.windGrid}>
        {WINDS.map(({ honor, label }) => (
          <TouchableOpacity
            key={honor}
            style={[styles.btn, jikaze === honor && styles.btnActive]}
            onPress={() => onSetJikaze(honor)}
          >
            <Text style={[styles.btnText, jikaze === honor && styles.btnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>和了</Text>
      {(['ron', 'tsumo'] as WinMethod[]).map((method) => (
        <TouchableOpacity
          key={method}
          style={[styles.methodBtn, winMethod === method && styles.btnActive]}
          onPress={() => onSetWinMethod(method)}
        >
          <Text style={[styles.btnText, winMethod === method && styles.btnTextActive]}>
            {method === 'ron' ? 'ロン' : 'ツモ'}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>役</Text>
      <TouchableOpacity
        style={[styles.methodBtn, riichi && styles.btnActive]}
        onPress={onToggleRiichi}
      >
        <Text style={[styles.btnText, riichi && styles.btnTextActive]}>リーチ</Text>
      </TouchableOpacity>

      <Text style={styles.label}>カン</Text>
      <TouchableOpacity
        style={[styles.methodBtn, isKanMode && styles.kanBtnActive]}
        onPress={onToggleKanMode}
      >
        <Text style={[styles.btnText, isKanMode && styles.btnTextActive]}>暗カン</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 68,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
    marginTop: 6,
    marginBottom: 3,
  },
  windGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  btn: {
    width: 30,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  kanBtnActive: {
    backgroundColor: '#FF8F00',
    borderColor: '#FF8F00',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  btnTextActive: {
    color: '#fff',
  },
  methodBtn: {
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
})
