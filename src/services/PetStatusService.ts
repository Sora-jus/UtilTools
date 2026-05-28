/**
 * 宠物状态服务
 * 负责管理宠物属性、状态变化和数据存储
 */

import type { PetState, PetEmotion, StatusLevel } from '@/types'

export interface PetActionResult {
  success: boolean
  message: string
  newStatus: PetState
  emotion: PetEmotion
}

export interface PetStatusConfig {
  hungerDecayRate: number      // 饱食度衰减速率（每小时）
  cleanlinessDecayRate: number // 清洁度衰减速率（每小时）
  happinessDecayRate: number   // 快乐度衰减速率（每小时）
  maxValues: {                 // 最大属性值
    hunger: number
    cleanliness: number
    happiness: number
  }
  minValues: {                 // 最小属性值
    hunger: number
    cleanliness: number
    happiness: number
  }
}

// 默认配置
const DEFAULT_CONFIG: PetStatusConfig = {
  hungerDecayRate: 5,
  cleanlinessDecayRate: 4,
  happinessDecayRate: 6,
  maxValues: {
    hunger: 100,
    cleanliness: 100,
    happiness: 100
  },
  minValues: {
    hunger: 0,
    cleanliness: 0,
    happiness: 0
  }
}

/**
 * 宠物状态服务实现
 */
export class PetStatusServiceImpl {
  private state: PetState
  private config: PetStatusConfig
  private decayInterval: NodeJS.Timeout | null = null
  private lastUpdateTime: number

  constructor(initialState?: PetState, config: Partial<PetStatusConfig> = {}) {
    this.state = initialState || this.getDefaultState()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.lastUpdateTime = Date.now()

    // 启动自动衰减
    this.startDecay()
  }

  /**
   * 获取默认宠物状态
   */
  private getDefaultState(): PetState {
    const now = new Date()
    return {
      hunger: 80,
      cleanliness: 80,
      happiness: 80,
      level: 1,
      experience: 0,
      lastFed: now.toISOString(),
      lastCleaned: now.toISOString(),
      lastPlayed: now.toISOString()
    }
  }

  /**
   * 获取当前宠物状态
   */
  getState(): PetState {
    return { ...this.state }
  }

  /**
   * 设置宠物状态
   */
  setState(state: Partial<PetState>): void {
    this.state = { ...this.state, ...state }
    this.checkLevelUp()
  }

  /**
   * 获取情感状态
   */
  getEmotion(): PetEmotion {
    const avgStatus = this.getAverageStatus()

    if (avgStatus < 20) {
      return 'sad'
    } else if (avgStatus < 40) {
      return 'worried'
    } else if (avgStatus > 70 && this.state.happiness > 70) {
      return 'happy'
    } else if (this.state.happiness < 30 && avgStatus > 50) {
      return 'sleepy'
    } else if (avgStatus < 30) {
      return 'angry'
    }

    return 'normal'
  }

  /**
   * 获取状态等级
   */
  getStatusLevel(): StatusLevel {
    const avgStatus = this.getAverageStatus()

    if (avgStatus < 20) {
      return 'critical'
    } else if (avgStatus < 40) {
      return 'low'
    } else if (avgStatus < 60) {
      return 'warning'
    }

    return 'normal'
  }

  /**
   * 计算平均状态值
   */
  private getAverageStatus(): number {
    return (this.state.hunger + this.state.cleanliness + this.state.happiness) / 3
  }

  /**
   * 检查是否应该升级
   */
  private checkLevelUp(): void {
    const expNeeded = this.state.level * 100

    if (this.state.experience >= expNeeded) {
      this.state.experience -= expNeeded
      this.state.level++
      console.log(`Pet leveled up to level ${this.state.level}!`)
    }
  }

  /**
   * 喂食
   */
  feed(): PetActionResult {
    const oldValue = this.state.hunger
    this.state.hunger = Math.min(
      this.config.maxValues.hunger,
      this.state.hunger + 15
    )
    this.state.happiness = Math.min(
      this.config.maxValues.happiness,
      this.state.happiness + 5
    )
    this.state.lastFed = new Date().toISOString()
    this.addExperience(10)

    const newState = this.getState()

    return {
      success: true,
      message: `喂食成功！饱食度从 ${oldValue} 增加到 ${this.state.hunger}`,
      newStatus: newState,
      emotion: this.getEmotion()
    }
  }

  /**
   * 清洁
   */
  clean(): PetActionResult {
    const oldValue = this.state.cleanliness
    this.state.cleanliness = Math.min(
      this.config.maxValues.cleanliness,
      this.state.cleanliness + 20
    )
    this.state.happiness = Math.min(
      this.config.maxValues.happiness,
      this.state.happiness + 5
    )
    this.state.lastCleaned = new Date().toISOString()
    this.addExperience(8)

    const newState = this.getState()

    return {
      success: true,
      message: `清洁成功！清洁度从 ${oldValue} 增加到 ${this.state.cleanliness}`,
      newStatus: newState,
      emotion: this.getEmotion()
    }
  }

  /**
   * 玩耍
   */
  play(): PetActionResult {
    const oldHappiness = this.state.happiness
    const oldHunger = this.state.hunger

    this.state.happiness = Math.min(
      this.config.maxValues.happiness,
      this.state.happiness + 25
    )
    this.state.hunger = Math.max(
      this.config.minValues.hunger,
      this.state.hunger - 8
    )
    this.state.cleanliness = Math.max(
      this.config.minValues.cleanliness,
      this.state.cleanliness - 8
    )
    this.state.lastPlayed = new Date().toISOString()
    this.addExperience(15)

    const newState = this.getState()

    return {
      success: true,
      message: `玩耍愉快！快乐度从 ${oldHappiness} 增加到 ${this.state.happiness}`,
      newStatus: newState,
      emotion: this.getEmotion()
    }
  }

  /**
   * 添加经验值
   */
  private addExperience(amount: number): void {
    this.state.experience += amount
    this.checkLevelUp()
  }

  /**
   * 启动自动衰减
   */
  private startDecay(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval)
    }

    // 每分钟更新一次状态
    this.decayInterval = setInterval(() => {
      this.updateDecay()
    }, 60000) // 1分钟
  }

  /**
   * 更新属性衰减
   */
  private updateDecay(): void {
    const now = Date.now()
    const elapsedHours = (now - this.lastUpdateTime) / (1000 * 60 * 60)

    if (elapsedHours < 0.01) {
      return // 时间间隔太小，跳过
    }

    // 计算衰减量
    const hungerDecay = this.config.hungerDecayRate * elapsedHours
    const cleanlinessDecay = this.config.cleanlinessDecayRate * elapsedHours
    const happinessDecay = this.config.happinessDecayRate * elapsedHours

    // 应用衰减
    this.state.hunger = Math.max(
      this.config.minValues.hunger,
      this.state.hunger - hungerDecay
    )
    this.state.cleanliness = Math.max(
      this.config.minValues.cleanliness,
      this.state.cleanliness - cleanlinessDecay
    )
    this.state.happiness = Math.max(
      this.config.minValues.happiness,
      this.state.happiness - happinessDecay
    )

    this.lastUpdateTime = now
  }

  /**
   * 停止自动衰减
   */
  stopDecay(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval)
      this.decayInterval = null
    }
  }

  /**
   * 计算离线期间的状态变化
   */
  calculateOfflineStatus(lastActivityTime: string): PetState {
    const lastTime = new Date(lastActivityTime).getTime()
    const now = Date.now()
    const elapsedHours = (now - lastTime) / (1000 * 60 * 60)

    if (elapsedHours < 0.01) {
      return this.getState()
    }

    const newState = { ...this.state }

    // 计算衰减
    const hungerDecay = this.config.hungerDecayRate * elapsedHours
    const cleanlinessDecay = this.config.cleanlinessDecayRate * elapsedHours
    const happinessDecay = this.config.happinessDecayRate * elapsedHours

    newState.hunger = Math.max(this.config.minValues.hunger, newState.hunger - hungerDecay)
    newState.cleanliness = Math.max(this.config.minValues.cleanliness, newState.cleanliness - cleanlinessDecay)
    newState.happiness = Math.max(this.config.minValues.happiness, newState.happiness - happinessDecay)

    return newState
  }

  /**
   * 获取状态建议
   */
  getStatusAdvice(): string[] {
    const advice: string[] = []
    const statusLevel = this.getStatusLevel()

    if (statusLevel === 'critical') {
      advice.push('你的宠物状态非常糟糕！')
      advice.push('需要立即进行喂食、清洁和玩耍。')
    } else if (statusLevel === 'low') {
      advice.push('你的宠物状态不太好。')
      advice.push('建议多关注宠物的需求。')
    }

    if (this.state.hunger < 40) {
      advice.push('宠物饿了，给它一些食物吧！')
    }

    if (this.state.cleanliness < 40) {
      advice.push('宠物需要清洁，帮它洗个澡吧！')
    }

    if (this.state.happiness < 40) {
      advice.push('宠物不开心，陪它玩一会儿吧！')
    }

    if (advice.length === 0) {
      advice.push('你的宠物状态很好！继续保持吧！')
    }

    return advice
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopDecay()
  }
}

/**
 * 创建宠物状态服务实例
 */
export function createPetStatusService(
  initialState?: PetState,
  config?: Partial<PetStatusConfig>
): PetStatusServiceImpl {
  return new PetStatusServiceImpl(initialState, config)
}