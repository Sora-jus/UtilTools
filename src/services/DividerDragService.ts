/**
 * 分隔栏拖拽服务
 * 实现Markdown编辑器分隔栏拖动逻辑
 */

export interface DividerState {
  position: number        // 当前位置比例（0-1）
  isDragging: boolean     // 是否正在拖拽
  startX: number          // 拖拽起始X坐标
  startWidth: number      // 拖拽起始时编辑区宽度
}

export interface DividerDragService {
  // 开始拖拽
  startDrag(x: number, containerWidth: number): void
  // 计算新位置
  calculatePosition(x: number, containerWidth: number): number
  // 结束拖拽
  endDrag(): void
  // 获取当前状态
  getState(): DividerState
}

/**
 * 分隔栏拖拽服务实现
 */
export class DividerDragServiceImpl implements DividerDragService {
  private state: DividerState = {
    position: 0.5,  // 默认居中
    isDragging: false,
    startX: 0,
    startWidth: 0
  }
  
  constructor(
    private minPanelWidth: number = 200,  // 最小面板宽度
    initialPosition: number = 0.5  // 初始位置比例
  ) {
    this.state.position = initialPosition
  }
  
  startDrag(x: number, containerWidth: number): void {
    this.state = {
      position: this.state.position,
      isDragging: true,
      startX: x,
      startWidth: containerWidth * this.state.position
    }
  }
  
  calculatePosition(x: number, containerWidth: number): number {
    if (!this.state.isDragging) {
      return this.state.position
    }
    
    const deltaX = x - this.state.startX
    const newWidth = this.state.startWidth + deltaX
    
    // 应用最小宽度限制
    const minWidth = this.minPanelWidth
    const maxWidth = containerWidth - minWidth
    
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    const newPosition = clampedWidth / containerWidth
    
    // 更新状态
    this.state.position = newPosition
    
    return newPosition
  }
  
  endDrag(): void {
    this.state.isDragging = false
    // 可以在这里保存位置到配置
  }
  
  getState(): DividerState {
    return { ...this.state }
  }
  
  // 设置位置（用于从配置恢复）
  setPosition(position: number): void {
    this.state.position = Math.max(0, Math.min(1, position))
  }
}

/**
 * 创建分隔栏拖拽服务实例
 */
export function createDividerDragService(
  minPanelWidth?: number,
  initialPosition?: number
): DividerDragService {
  return new DividerDragServiceImpl(minPanelWidth, initialPosition)
}
