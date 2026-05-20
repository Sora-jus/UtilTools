/**
 * 悬浮按钮交互服务
 * 实现拖拽与点击区分逻辑
 */

export interface Position {
  x: number
  y: number
}

export interface FloatingButtonConfig {
  position: Position
  opacity: number      // 范围: 30-100
  size: number         // 范围: 40-80
  dragThreshold: number // 拖拽判定阈值（像素），默认5px
}

export interface FloatingButtonInteractionState {
  isDragging: boolean          // 是否正在拖拽
  mouseDownPosition: Position | null  // 鼠标按下时的位置
  currentPosition: Position    // 当前鼠标位置
  hasMoved: boolean            // 是否已移动（超过阈值）
}

export interface InteractionResult {
  type: 'drag' | 'click' | 'none'
  position?: Position
  shouldShowMenu?: boolean
}

export interface FloatingButtonInteractionService {
  // 处理鼠标按下事件
  handleMouseDown(position: Position): void
  // 处理鼠标移动事件
  handleMouseMove(position: Position): InteractionResult
  // 处理鼠标释放事件
  handleMouseUp(position: Position): InteractionResult
  // 判断是否为拖拽操作
  isDragOperation(): boolean
  // 判断是否为点击操作
  isClickOperation(): boolean
}

/**
 * 悬浮按钮交互服务实现
 */
export class FloatingButtonInteractionServiceImpl implements FloatingButtonInteractionService {
  private state: FloatingButtonInteractionState = {
    isDragging: false,
    mouseDownPosition: null,
    currentPosition: { x: 0, y: 0 },
    hasMoved: false
  }
  
  constructor(private config: FloatingButtonConfig) {}
  
  handleMouseDown(position: Position): void {
    this.state = {
      isDragging: false,
      mouseDownPosition: position,
      currentPosition: position,
      hasMoved: false
    }
  }
  
  handleMouseMove(position: Position): InteractionResult {
    if (!this.state.mouseDownPosition) {
      return { type: 'none' }
    }
    
    this.state.currentPosition = position
    
    // 计算移动距离
    const distance = this.calculateDistance(
      this.state.mouseDownPosition,
      position
    )
    
    // 判断是否超过阈值
    if (distance > this.config.dragThreshold) {
      this.state.hasMoved = true
      this.state.isDragging = true
      return { type: 'drag', position }
    }
    
    return { type: 'none' }
  }
  
  handleMouseUp(position: Position): InteractionResult {
    if (!this.state.mouseDownPosition) {
      return { type: 'none' }
    }
    
    this.state.currentPosition = position
    
    if (this.state.hasMoved) {
      // 拖拽操作，不触发点击
      const result: InteractionResult = {
        type: 'drag',
        position,
        shouldShowMenu: false
      }
      this.resetState()
      return result
    } else {
      // 点击操作，显示菜单
      const result: InteractionResult = {
        type: 'click',
        position: this.state.mouseDownPosition,
        shouldShowMenu: true
      }
      this.resetState()
      return result
    }
  }
  
  isDragOperation(): boolean {
    return this.state.hasMoved
  }
  
  isClickOperation(): boolean {
    return !this.state.hasMoved && this.state.mouseDownPosition !== null
  }
  
  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  private resetState(): void {
    this.state = {
      isDragging: false,
      mouseDownPosition: null,
      currentPosition: { x: 0, y: 0 },
      hasMoved: false
    }
  }
}

/**
 * 创建悬浮按钮交互服务实例
 */
export function createFloatingButtonInteractionService(
  config: FloatingButtonConfig
): FloatingButtonInteractionService {
  return new FloatingButtonInteractionServiceImpl(config)
}
