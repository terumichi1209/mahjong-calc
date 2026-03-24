// 点数計算結果
export interface ScoreResult {
  han: number
  fu: number
  score: number
  yaku: string[]
}

// 点数計算（Phase 0: 固定値）
// 1翻30符 = 子ロン1000点
export function calculateScore(han: number, fu: number): number {
  // 基本点 = 符 × 2^(翻+2)
  const basePoints = fu * Math.pow(2, han + 2)
  // 子ロン = 基本点 × 4（100点未満切り上げ）
  const ronPoints = Math.ceil((basePoints * 4) / 100) * 100
  return ronPoints
}
