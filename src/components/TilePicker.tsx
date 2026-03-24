import { StyleSheet, View, Image, TouchableOpacity } from 'react-native'
import { Suit, TileValue, Honor } from '@/types/tile'
import { TILE_IMAGES, tileImageKey } from '@/assets/tileImages'

const HONORS: Honor[] = ['east', 'south', 'west', 'north', 'white', 'green', 'red']
const SUITS: Suit[] = ['manzu', 'pinzu', 'souzu']
const VALUES: TileValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

interface Props {
  onSelectNumberTile: (suit: Suit, value: TileValue) => void
  onSelectHonorTile: (honor: Honor) => void
}

export function TilePicker({ onSelectNumberTile, onSelectHonorTile }: Props) {
  return (
    <View>
      {SUITS.map((suit) => (
        <View key={suit} style={styles.row}>
          {VALUES.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.tileButton}
              onPress={() => onSelectNumberTile(suit, value)}
            >
              <Image
                source={TILE_IMAGES[tileImageKey({ type: 'number', suit, value })]}
                style={styles.tileImage}
              />
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        {HONORS.map((honor) => (
          <TouchableOpacity
            key={honor}
            style={styles.tileButton}
            onPress={() => onSelectHonorTile(honor)}
          >
            <Image
              source={TILE_IMAGES[tileImageKey({ type: 'honor', honor })]}
              style={styles.tileImage}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
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
  tileImage: {
    width: 34,
    height: 44,
    resizeMode: 'contain',
  },
})
