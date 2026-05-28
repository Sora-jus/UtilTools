<template>
  <div
    class="pet-avatar"
    :class="{
      'dragging': isDragging,
      'pet-mode': currentMode === 'pet',
      'tool-mode': currentMode === 'tool'
    }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @dblclick="handleDoubleClick"
  >
    <!-- 宠物模式 - 显示宠物形象 -->
    <div v-if="currentMode === 'pet'" class="pet-container">
      <div class="pet-image" :class="currentPetState">
        <div class="pet-body">
          <div class="pet-head">
            <div class="pet-ear pet-ear-left"></div>
            <div class="pet-ear pet-ear-right"></div>
            <div class="pet-face">
              <div class="pet-eyes">
                <div class="eye eye-left" :class="{ 'closed': petEmotion === 'sleepy' }">
                  <div class="pupil" :class="{ 'small': petEmotion === 'happy' }"></div>
                </div>
                <div class="eye eye-right" :class="{ 'closed': petEmotion === 'sleepy' }">
                  <div class="pupil" :class="{ 'small': petEmotion === 'happy' }"></div>
                </div>
              </div>
              <div class="pet-nose"></div>
              <div class="pet-mouth" :class="petEmotion"></div>
              <div class="pet-whiskers">
                <div class="whisker whisker-1"></div>
                <div class="whisker whisker-2"></div>
                <div class="whisker whisker-3"></div>
              </div>
            </div>
            <!-- 老虎王字纹路 -->
            <div class="tiger-marking">
              <div class="marking-line line-1"></div>
              <div class="marking-line line-2"></div>
              <div class="marking-line line-3"></div>
            </div>
          </div>
          <div class="pet-body-main">
            <div class="tiger-stripe stripe-1"></div>
            <div class="tiger-stripe stripe-2"></div>
            <div class="tiger-stripe stripe-3"></div>
          </div>
        </div>
      </div>
      <!-- 状态指示器 -->
      <div v-if="showStatusIndicator" class="status-indicator" :class="petStatus.level">
        {{ petStatus.level === 'low' ? '需要照顾' : '' }}
      </div>
    </div>

    <!-- 工具模式 - 显示悬浮按钮 -->
    <div v-else class="tool-button">
      <div class="button-icon">🔧</div>
      <div v-if="showStatusIndicator && petStatus.level === 'low'" class="status-dot"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  createFloatingButtonInteractionService,
  type Position,
  type FloatingButtonConfig
} from '@/services/FloatingButtonInteractionService'

const { ipcRenderer } = require('electron')

// 接口定义
interface PetState {
  hunger: number
  cleanliness: number
  happiness: number
}

interface Config {
  position: Position
  opacity: number
  size: number
  dragThreshold: number
}

// 配置
const config: Config = {
  position: { x: 0, y: 0 },
  opacity: 80,
  size: 100,
  dragThreshold: 5
}

// 创建交互服务
const interactionService = createFloatingButtonInteractionService(config)

// 状态
const isDragging = ref(false)
const position = ref({ x: 100, y: 100 })
const currentMode = ref<'pet' | 'tool'>('pet')
const currentPetState = ref('idle')
const petEmotion = ref('normal')
const petStatus = ref({
  hunger: 80,
  cleanliness: 80,
  happiness: 80,
  level: 'normal' as 'normal' | 'warning' | 'low'
})

// 计算属性
const showStatusIndicator = computed(() => {
  return petStatus.value.level !== 'normal'
})

// 根据宠物状态计算情感
const updatePetEmotion = () => {
  const { hunger, cleanliness, happiness } = petStatus.value
  const avgStatus = (hunger + cleanliness + happiness) / 3

  if (avgStatus < 30) {
    petEmotion.value = 'sad'
    petStatus.value.level = 'low'
  } else if (avgStatus < 50) {
    petEmotion.value = 'worried'
    petStatus.value.level = 'warning'
  } else if (happiness > 70 && hunger > 60 && cleanliness > 60) {
    petEmotion.value = 'happy'
    petStatus.value.level = 'normal'
  } else {
    petEmotion.value = 'normal'
    petStatus.value.level = 'normal'
  }
}

// 监听宠物状态变化
watch(petStatus, () => {
  updatePetEmotion()
}, { deep: true })

// 鼠标事件处理
function handleMouseDown(e: MouseEvent) {
  const pos: Position = { x: e.clientX, y: e.clientY }
  interactionService.handleMouseDown(pos)

  // 点击效果
  if (currentMode.value === 'pet') {
    currentPetState.value = 'clicked'
    setTimeout(() => {
      if (currentPetState.value === 'clicked') {
        currentPetState.value = 'idle'
      }
    }, 300)
  }
}

function handleMouseMove(e: MouseEvent) {
  const pos: Position = { x: e.clientX, y: e.clientY }
  const result = interactionService.handleMouseMove(pos)

  if (result.type === 'drag') {
    isDragging.value = true
    const size = currentMode.value === 'pet' ? 100 : 60
    const newPosition = {
      x: e.screenX - size / 2,
      y: e.screenY - size / 2
    }
    position.value = newPosition
    ipcRenderer.send('update-button-position', newPosition)
  }
}

function handleMouseUp(e: MouseEvent) {
  const pos: Position = { x: e.clientX, y: e.clientY }
  const result = interactionService.handleMouseUp(pos)

  isDragging.value = false

  if (result.shouldShowMenu && currentMode.value === 'tool') {
    // 工具模式点击显示菜单
    showMenu()
  } else if (result.type === 'drag') {
    savePosition()
  }

  // 重置宠物状态
  if (currentPetState.value === 'clicked') {
    currentPetState.value = 'idle'
  }
}

function handleMouseLeave() {
  if (isDragging.value) {
    isDragging.value = false
  }
}

function handleDoubleClick() {
  // 双击显示主面板
  ipcRenderer.send('show-main-panel')
}

// 显示菜单（仅在工具模式下）
const showMenu = () => {
  ipcRenderer.send('show-menu')
}

// 保存位置
const savePosition = () => {
  ipcRenderer.send('save-button-position', {
    position: position.value,
    mode: currentMode.value
  })
}

// 宠物交互
const feed = () => {
  petStatus.value.hunger = Math.min(100, petStatus.value.hunger + 15)
  petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 5)
  currentPetState.value = 'eating'
  petEmotion.value = 'happy'

  setTimeout(() => {
    currentPetState.value = 'idle'
    updatePetEmotion()
  }, 2000)

  ipcRenderer.send('pet-action', { action: 'feed', status: petStatus.value })
}

const clean = () => {
  petStatus.value.cleanliness = Math.min(100, petStatus.value.cleanliness + 20)
  petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 3)
  currentPetState.value = 'cleaning'
  petEmotion.value = 'happy'

  setTimeout(() => {
    currentPetState.value = 'idle'
    updatePetEmotion()
  }, 1500)

  ipcRenderer.send('pet-action', { action: 'clean', status: petStatus.value })
}

const play = () => {
  petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 20)
  petStatus.value.hunger = Math.max(0, petStatus.value.hunger - 5)
  petStatus.value.cleanliness = Math.max(0, petStatus.value.cleanliness - 5)
  currentPetState.value = 'playing'
  petEmotion.value = 'happy'

  setTimeout(() => {
    currentPetState.value = 'idle'
    updatePetEmotion()
  }, 2000)

  ipcRenderer.send('pet-action', { action: 'play', status: petStatus.value })
}

// 监听IPC消息
onMounted(() => {
  // 加载保存的位置
  ipcRenderer.on('load-button-position', (_event, data) => {
    if (data && data.position) {
      position.value = data.position
      if (data.mode) {
        currentMode.value = data.mode
      }
    }
  })

  // 监听模式切换
  ipcRenderer.on('switch-mode', (_event, mode: 'pet' | 'tool') => {
    currentMode.value = mode
    // 模式切换时请求对应的位置
    ipcRenderer.send('get-position-for-mode', mode)
  })

  // 监听宠物状态更新
  ipcRenderer.on('update-pet-status', (_event, status: PetState) => {
    petStatus.value = {
      ...petStatus.value,
      ...status,
      level: 'normal' // 会在watch中重新计算
    }
    updatePetEmotion()
  })

  // 监听宠物操作命令
  ipcRenderer.on('pet-action', (_event, action: string) => {
    switch (action) {
      case 'feed':
        feed()
        break
      case 'clean':
        clean()
        break
      case 'play':
        play()
        break
    }
  })

  // 监听位置更新
  ipcRenderer.on('position-for-mode', (_event, positionData: Position) => {
    if (positionData) {
      position.value = positionData
    }
  })

  // 初始化情感状态
  updatePetEmotion()
})

onUnmounted(() => {
  ipcRenderer.removeAllListeners('load-button-position')
  ipcRenderer.removeAllListeners('switch-mode')
  ipcRenderer.removeAllListeners('update-pet-status')
  ipcRenderer.removeAllListeners('pet-action')
})

// 导出方法供外部调用
defineExpose({
  feed,
  clean,
  play,
  getStatus: () => petStatus.value,
  getMode: () => currentMode.value
})
</script>

<style scoped>
.pet-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  -webkit-app-region: no-drag;
  user-select: none;
  position: relative;
}

.pet-avatar.dragging {
  cursor: grabbing;
  transition: none;
}

/* 宠物模式样式 */
.pet-avatar.pet-mode {
  width: 100px;
  height: 100px;
}

/* 工具模式样式 */
.pet-avatar.tool-mode {
  width: 60px;
  height: 60px;
}

/* 工具按钮样式 */
.tool-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.tool-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.pet-avatar.dragging .tool-button {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  transition: none;
}

.button-icon {
  font-size: 28px;
  user-select: none;
  pointer-events: none;
}

/* 宠物容器 */
.pet-container {
  width: 100px;
  height: 100px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 宠物图像 */
.pet-image {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.3s ease;
}

.pet-image.clicked {
  transform: scale(0.9);
}

.pet-image.eating {
  animation: eating 0.5s ease-in-out 2;
}

.pet-image.cleaning {
  animation: cleaning 1.5s ease-in-out;
}

.pet-image.playing {
  animation: playing 0.3s ease-in-out 4;
}

/* 宠物身体 */
.pet-body {
  width: 80px;
  height: 80px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 宠物头部 */
.pet-head {
  width: 60px;
  height: 50px;
  background: linear-gradient(135deg, #ffb347 0%, #ff8c00 100%);
  border-radius: 50% 50% 45% 45%;
  position: relative;
  margin-bottom: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 宠物耳朵 */
.pet-ear {
  width: 18px;
  height: 18px;
  background: #ff8c00;
  border-radius: 50%;
  position: absolute;
  top: -8px;
  z-index: 1;
}

.pet-ear-left {
  left: 5px;
  transform: rotate(-15deg);
}

.pet-ear-right {
  right: 5px;
  transform: rotate(15deg);
}

/* 宠物脸部 */
.pet-face {
  width: 50px;
  height: 35px;
  position: absolute;
  top: 12px;
  left: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 眼睛 */
.pet-eyes {
  display: flex;
  gap: 12px;
  margin-bottom: 5px;
}

.eye {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye.closed {
  height: 2px;
  background: #333;
}

.pupil {
  width: 6px;
  height: 6px;
  background: #333;
  border-radius: 50%;
  transition: transform 0.2s;
}

.pupil.small {
  transform: scale(0.7);
}

/* 鼻子 */
.pet-nose {
  width: 8px;
  height: 6px;
  background: #ff6b6b;
  border-radius: 50%;
  margin: 2px 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 嘴巴 */
.pet-mouth {
  width: 12px;
  height: 6px;
  border: 2px solid #333;
  border-top: none;
  border-radius: 0 0 6px 6px;
  margin-top: 2px;
}

.pet-mouth.happy {
  width: 16px;
  height: 8px;
  border-radius: 0 0 8px 8px;
}

.pet-mouth.sad {
  transform: rotate(180deg);
}

.pet-mouth.worried {
  width: 8px;
  height: 4px;
  border-radius: 0 0 4px 4px;
}

/* 胡须 */
.pet-whiskers {
  position: absolute;
  width: 100%;
  top: 22px;
}

.whisker {
  width: 15px;
  height: 2px;
  background: #333;
  position: absolute;
  border-radius: 1px;
  opacity: 0.6;
}

.whisker-1 {
  left: -5px;
  top: 0;
  transform: rotate(-10deg);
}

.whisker-2 {
  left: -8px;
  top: 8px;
  transform: rotate(10deg);
}

.whisker-3 {
  right: -8px;
  top: 8px;
  transform: rotate(-10deg);
}

/* 老虎王字纹路 */
.tiger-marking {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 10px;
}

.marking-line {
  height: 3px;
  background: #cc7000;
  border-radius: 2px;
  position: absolute;
  width: 8px;
}

.line-1 {
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
}

.line-2 {
  top: 6px;
  left: 20%;
  transform: rotate(-20deg);
}

.line-3 {
  top: 6px;
  right: 20%;
  transform: rotate(20deg);
}

/* 宠物身体 */
.pet-body-main {
  width: 50px;
  height: 30px;
  background: linear-gradient(135deg, #ffb347 0%, #ff8c00 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

/* 老虎条纹 */
.tiger-stripe {
  height: 4px;
  background: #cc7000;
  border-radius: 2px;
  position: absolute;
  width: 12px;
}

.stripe-1 {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.stripe-2 {
  top: 16px;
  left: 20%;
  transform: rotate(-15deg);
}

.stripe-3 {
  top: 16px;
  right: 20%;
  transform: rotate(15deg);
}

/* 状态指示器 */
.status-indicator {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff6b6b;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}

.status-indicator.warning {
  background: #ffd93d;
  color: #333;
}

.status-indicator.low {
  background: #ff6b6b;
  color: white;
}

/* 工具模式状态点 */
.status-dot {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 12px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}

/* 动画 */
@keyframes eating {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1) rotate(5deg); }
}

@keyframes cleaning {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

@keyframes playing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 悬停效果 */
.pet-avatar.pet-mode:hover {
  transform: scale(1.05);
}

.pet-avatar.pet-mode.dragging {
  transform: scale(1.1);
  transition: none;
}
</style>