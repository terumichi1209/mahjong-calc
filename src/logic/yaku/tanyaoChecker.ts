import { Hand } from '@/types/hand'
import { isSimple } from '@/types/tile'

// タンヤオ（断么九）判定
// 全ての牌が中張牌（2〜8）であること
export function checkTanyao(hand: Hand): boolean {
  return hand.tiles.every((tile) => isSimple(tile))
}
