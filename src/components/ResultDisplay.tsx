import { StyleSheet, View, Text } from 'react-native'

interface Props {
  yakuLines: string[]
  scoreLine: string | null
  isSuccess: boolean
}

export function ResultDisplay({ yakuLines, scoreLine, isSuccess }: Props) {
  if (yakuLines.length === 0) return null

  return (
    <View style={[styles.container, isSuccess ? styles.success : styles.error]}>
      {yakuLines.map((line, i) => (
        <Text key={i} style={[styles.yakuLine, isSuccess ? styles.textSuccess : styles.textError]}>
          {line}
        </Text>
      ))}
      {scoreLine && (
        <>
          <View style={styles.divider} />
          <Text style={[styles.scoreLine, isSuccess ? styles.textSuccess : styles.textError]}>
            {scoreLine}
          </Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  success: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  error: {
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
  textSuccess: {
    color: '#1565C0',
  },
  textError: {
    color: '#c62828',
  },
})
