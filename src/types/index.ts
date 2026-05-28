/**
 * 宠物状态接口
 */
export interface PetState {
  hunger: number      // 饱食度 (0-100)
  cleanliness: number // 清洁度 (0-100)
  happiness: number   // 快乐度 (0-100)
  level: number       // 等级
  experience: number  // 经验值
  lastFed: Date       // 最后喂食时间
  lastCleaned: Date   // 最后清洁时间
  lastPlayed: Date    // 最后玩耍时间
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  petSkin: string                    // 当前宠物皮肤
  petMode: 'pet' | 'tool'            // 宠物模式 ('pet'=显示宠物, 'tool'=显示工具按钮)
  petPosition: Position              // 宠物位置
  toolPosition: Position             // 工具按钮位置
  autoStart: boolean                 // 开机自启
  petSize: number                    // 宠物大小
  lastActivityTime: Date             // 最后活动时间
}

/**
 * 位置接口
 */
export interface Position {
  x: number
  y: number
}

/**
 * 宠物动作类型
 */
export type PetAction = 'feed' | 'clean' | 'play' | 'idle' | 'sleeping'

/**
 * 宠物情感状态
 */
export type PetEmotion = 'normal' | 'happy' | 'sad' | 'worried' | 'sleepy' | 'angry'

/**
 * 状态等级
 */
export type StatusLevel = 'normal' | 'warning' | 'low' | 'critical'

/**
 * 窗口位置数据
 */
export interface WindowPositionData {
  position: Position
  mode: 'pet' | 'tool'
}

/**
 * 宠物交互结果
 */
export interface PetActionResult {
  success: boolean
  message: string
  newStatus?: Partial<PetState>
}