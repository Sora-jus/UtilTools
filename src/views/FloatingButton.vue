<template>
  <div
    class="floating-button"
    :class="{ dragging: isDragging }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
  >
    <div class="button-icon">🔧</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  createFloatingButtonInteractionService,
  type Position,
  type FloatingButtonConfig
} from '@/services/FloatingButtonInteractionService'

const { ipcRenderer } = require('electron')

// 配置
const config: FloatingButtonConfig = {
  position: { x: 0, y: 0 },
  opacity: 80,
  size: 60,
  dragThreshold: 5  // 5像素阈值
}

// 创建交互服务
const interactionService = createFloatingButtonInteractionService(config)

// 状态
const isDragging = ref(false)
const position = ref({ x: 100, y: 100 })

// 鼠标事件处理
function handleMouseDown(e: MouseEvent) {
  const pos: Position = { x: e.clientX, y: e.clientY }
  interactionService.handleMouseDown(pos)
}

function handleMouseMove(e: MouseEvent) {
  const pos: Position = { x: e.clientX, y: e.clientY }
  const result = interactionService.handleMouseMove(pos)
  
  if (result.type === 'drag') {
    isDragging.value = true
    // 计算新位置（屏幕坐标）
    const newPosition = {
      x: e.screenX - config.size / 2,
      y: e.screenY - config.size / 2
    }
    position.value = newPosition
    // 通知主进程更新窗口位置
    ipcRenderer.send('update-button-position', newPosition)
  }
}

function handleMouseUp(e: MouseEvent) {
  const pos: Position = { x: e.clientX, y: e.clientY }
  const result = interactionService.handleMouseUp(pos)
  
  isDragging.value = false
  
  if (result.shouldShowMenu) {
    // 点击操作，显示菜单
    showMenu()
  } else if (result.type === 'drag') {
    // 拖拽操作，保存位置
    savePosition()
  }
}

function handleMouseLeave() {
  // 鼠标离开时重置状态
  if (isDragging.value) {
    isDragging.value = false
  }
}

const showMenu = () => {
  // 通过IPC通知主进程显示菜单
  ipcRenderer.send('show-menu')
}

const savePosition = () => {
  // 保存位置到配置
  ipcRenderer.send('save-button-position', position.value)
}

const openJsonTool = () => {
  ipcRenderer.send('open-json-tool')
}

const openMarkdownEditor = () => {
  ipcRenderer.send('open-markdown-editor')
}

const quit = () => {
  ipcRenderer.send('quit-app')
}

// 监听菜单项点击
onMounted(() => {
  ipcRenderer.on('menu-action', (_event, action: string) => {
    switch (action) {
      case 'json-tool':
        openJsonTool()
        break
      case 'markdown-editor':
        openMarkdownEditor()
        break
      case 'quit':
        quit()
        break
    }
  })
  
  // 加载保存的位置
  ipcRenderer.on('load-button-position', (_event, savedPosition: Position) => {
    if (savedPosition) {
      position.value = savedPosition
    }
  })
})

onUnmounted(() => {
  ipcRenderer.removeAllListeners('menu-action')
  ipcRenderer.removeAllListeners('load-button-position')
})
</script>

<style scoped>
.floating-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  -webkit-app-region: no-drag;
  user-select: none;
}

.floating-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.floating-button.dragging {
  cursor: grabbing;
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  transition: none;
}

.button-icon {
  font-size: 28px;
  user-select: none;
  pointer-events: none;
}
</style>
