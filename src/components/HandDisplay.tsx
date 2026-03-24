import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native'
import { Tile } from '@/types/tile'
import { TILE_IMAGES, tileImageKey } from '@/assets/tileImages'

interface Props {
  handTiles: Tile[]
  winTile: Tile | null
  ankans: Tile[]
  isKanMode: boolean
  totalCount: number
  onRemoveHandTile: (index: number) => void
  onRemoveWinTile: () => void
  onRemoveAnkan: (index: number) => void
}

export function HandDisplay({
  handTiles,
  winTile,
  ankans,
  isKanMode,
  totalCount,
  onRemoveHandTile,
  onRemoveWinTile,
  onRemoveAnkan,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        手牌 ({totalCount}/{14 + ankans.length}){isKanMode ? '  【暗カン選択中】' : ''}
      </Text>
      {ankans.length > 0 && (
        <View style={[styles.tilesRow, styles.kanRow]}>
          {ankans.map((tile, kanIndex) => (
            <TouchableOpacity
              key={`kan-${kanIndex}`}
              style={styles.kanGroup}
              onPress={() => onRemoveAnkan(kanIndex)}
            >
              {[0, 1, 2, 3].map((i) => (
                <Image key={i} source={TILE_IMAGES[tileImageKey(tile)]} style={styles.tileImage} />
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
            onPress={() => onRemoveHandTile(index)}
          >
            <Image source={TILE_IMAGES[tileImageKey(tile)]} style={styles.tileImage} />
          </TouchableOpacity>
        ))}
        {winTile && (
          <>
            <View style={styles.winTileSeparator} />
            <TouchableOpacity style={styles.winTile} onPress={onRemoveWinTile}>
              <Image source={TILE_IMAGES[tileImageKey(winTile)]} style={styles.tileImage} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
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
    borderWidth: 2,
    borderColor: '#1976D2',
    borderRadius: 4,
  },
  tileImage: {
    width: 28,
    height: 37,
    resizeMode: 'contain',
  },
})
