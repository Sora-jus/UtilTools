<template>
  <div class="pet-care-tab">
    <div class="pet-header">
      <h2>宠物养成</h2>
      <div class="level-badge">
        <span class="level-number">Lv.{{ petStatus.level }}</span>
        <div class="exp-bar">
          <div class="exp-progress" :style="{ width: expProgress + '%' }"></div>
        </div>
        <span class="exp-text">{{ petStatus.experience }}/{{ expNeeded }} EXP</span>
      </div>
    </div>

    <!-- 宠物状态显示 -->
    <div class="pet-status-section">
      <div class="pet-avatar-preview">
        <div class="emotion-display" :class="petEmotion">
          {{ emotionEmoji }}
        </div>
        <div class="status-indicator" :class="statusLevel">
          {{ statusText }}
        </div>
      </div>

      <div class="stats-container">
        <!-- 饱食度 -->
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-icon">🍖</span>
            <span class="stat-name">饱食度</span>
            <span class="stat-value" :class="getStatClass(petStatus.hunger)">
              {{ Math.round(petStatus.hunger) }}%
            </span>
          </div>
          <div class="stat-bar">
            <div class="stat-progress hunger" :style="{ width: petStatus.hunger + '%' }"></div>
          </div>
        </div>

        <!-- 清洁度 -->
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-icon">🛁</span>
            <span class="stat-name">清洁度</span>
            <span class="stat-value" :class="getStatClass(petStatus.cleanliness)">
              {{ Math.round(petStatus.cleanliness) }}%
            </span>
          </div>
          <div class="stat-bar">
            <div class="stat-progress cleanliness" :style="{ width: petStatus.cleanliness + '%' }"></div>
          </div>
        </div>

        <!-- 快乐度 -->
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-icon">😊</span>
            <span class="stat-name">快乐度</span>
            <span class="stat-value" :class="getStatClass(petStatus.happiness)">
              {{ Math.round(petStatus.happiness) }}%
            </span>
          </div>
          <div class="stat-bar">
            <div class="stat-progress happiness" :style="{ width: petStatus.happiness + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 互动按钮 -->
    <div class="action-section">
      <h3>互动操作</h3>
      <div class="action-buttons">
        <button
          class="action-btn feed-btn"
          :disabled="isProcessing"
          @click="handleFeed"
        >
          <span class="btn-icon">🍖</span>
          <span class="btn-text">喂食</span>
          <span class="btn-hint">+15 饱食度</span>
        </button>

        <button
          class="action-btn clean-btn"
          :disabled="isProcessing"
          @click="handleClean"
        >
          <span class="btn-icon">🛁</span>
          <span class="btn-text">清洁</span>
          <span class="btn-hint">+20 清洁度</span>
        </button>

        <button
          class="action-btn play-btn"
          :disabled="isProcessing"
          @click="handlePlay"
        >
          <span class="btn-icon">🎮</span>
          <span class="btn-text">玩耍</span>
          <span class="btn-hint">+25 快乐度</span>
        </button>
      </div>
    </div>

    <!-- 状态建议 -->
    <div class="advice-section" v-if="advices.length > 0">
      <h3>💡 建议</h3>
      <ul class="advice-list">
        <li v-for="(advice, index) in advices" :key="index">{{ advice }}</li>
      </ul>
    </div>

    <!-- 操作反馈 -->
    <div class="feedback-section" v-if="showFeedback">
      <div class="feedback-message" :class="feedbackType">
        {{ feedbackMessage }}
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <h3>活动记录</h3>
      <div class="history-list">
        <div
          v-for="(record, index) in recentActivities"
          :key="index"
          class="history-item"
        >
          <span class="history-icon">{{ record.icon }}</span>
          <span class="history-action">{{ record.action }}</span>
          <span class="history-time">{{ record.time }}</span>
        </div>
        <div v-if="recentActivities.length === 0" class="history-empty">
          暂无活动记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { PetState, PetEmotion, StatusLevel } from '@/types'

const { ipcRenderer } = require('electron')

// 状态定义
const petStatus = ref<PetState>({
  hunger: 80,
  cleanliness: 80,
  happiness: 80,
  level: 1,
  experience: 0,
  lastFed: new Date().toISOString(),
  lastCleaned: new Date().toISOString(),
  lastPlayed: new Date().toISOString()
})

const isProcessing = ref(false)
const showFeedback = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error' | 'info'>('success')
const recentActivities = ref<Array<{ icon: string; action: string; time: string }>>([])

// 计算属性
const petEmotion = computed((): PetEmotion => {
  const avgStatus = (petStatus.value.hunger + petStatus.value.cleanliness + petStatus.value.happiness) / 3

  if (avgStatus < 20) return 'sad'
  if (avgStatus < 40) return 'worried'
  if (avgStatus > 70 && petStatus.value.happiness > 70) return 'happy'
  if (petStatus.value.happiness < 30 && avgStatus > 50) return 'sleepy'
  if (avgStatus < 30) return 'angry'

  return 'normal'
})

const emotionEmoji = computed(() => {
  const emotionMap: Record<PetEmotion, string> = {
    normal: '😐',
    happy: '😊',
    sad: '😢',
    worried: '😟',
    sleepy: '😴',
    angry: '😠'
  }
  return emotionMap[petEmotion.value] || '😐'
})

const statusLevel = computed((): StatusLevel => {
  const avgStatus = (petStatus.value.hunger + petStatus.value.cleanliness + petStatus.value.happiness) / 3

  if (avgStatus < 20) return 'critical'
  if (avgStatus < 40) return 'low'
  if (avgStatus < 60) return 'warning'

  return 'normal'
})

const statusText = computed(() => {
  const levelMap: Record<StatusLevel, string> = {
    normal: '状态良好',
    warning: '需要注意',
    low: '状态不佳',
    critical: '急需照顾'
  }
  return levelMap[statusLevel.value]
})

const expProgress = computed(() => {
  const expNeeded = petStatus.value.level * 100
  return (petStatus.value.experience / expNeeded) * 100
})

const expNeeded = computed(() => {
  return petStatus.value.level * 100
})

const advices = computed(() => {
  const adviceList: string[] = []
  const level = statusLevel.value

  if (level === 'critical') {
    adviceList.push('你的宠物状态非常糟糕！')
    adviceList.push('需要立即进行喂食、清洁和玩耍。')
  } else if (level === 'low') {
    adviceList.push('你的宠物状态不太好。')
    adviceList.push('建议多关注宠物的需求。')
  }

  if (petStatus.value.hunger < 40) {
    adviceList.push('宠物饿了，给它一些食物吧！')
  }

  if (petStatus.value.cleanliness < 40) {
    adviceList.push('宠物需要清洁，帮它洗个澡吧！')
  }

  if (petStatus.value.happiness < 40) {
    adviceList.push('宠物不开心，陪它玩一会儿吧！')
  }

  if (adviceList.length === 0) {
    adviceList.push('你的宠物状态很好！继续保持吧！')
  }

  return adviceList
})

// 方法
function getStatClass(value: number): string {
  if (value < 20) return 'critical'
  if (value < 40) return 'low'
  if (value < 60) return 'warning'
  return 'normal'
}

async function handleFeed() {
  if (isProcessing.value) return

  isProcessing.value = true

  try {
    ipcRenderer.send('pet-action', 'feed')

    // 等待IPC响应
    await new Promise<void>((resolve) => {
      const handler = (_event: any, result: any) => {
        ipcRenderer.removeListener('pet-action-result', handler)
        resolve()
      }
      ipcRenderer.on('pet-action-result', handler)
    })

    addActivity('🍖', '喂食宠物')
    showFeedbackMessage('喂食成功！饱食度增加了！', 'success')
  } catch (error) {
    showFeedbackMessage('操作失败，请重试', 'error')
  } finally {
    isProcessing.value = false
  }
}

async function handleClean() {
  if (isProcessing.value) return

  isProcessing.value = true

  try {
    ipcRenderer.send('pet-action', 'clean')

    await new Promise<void>((resolve) => {
      const handler = (_event: any, result: any) => {
        ipcRenderer.removeListener('pet-action-result', handler)
        resolve()
      }
      ipcRenderer.on('pet-action-result', handler)
    })

    addActivity('🛁', '清洁宠物')
    showFeedbackMessage('清洁成功！宠物变得干净了！', 'success')
  } catch (error) {
    showFeedbackMessage('操作失败，请重试', 'error')
  } finally {
    isProcessing.value = false
  }
}

async function handlePlay() {
  if (isProcessing.value) return

  isProcessing.value = true

  try {
    ipcRenderer.send('pet-action', 'play')

    await new Promise<void>((resolve) => {
      const handler = (_event: any, result: any) => {
        ipcRenderer.removeListener('pet-action-result', handler)
        resolve()
      }
      ipcRenderer.on('pet-action-result', handler)
    })

    addActivity('🎮', '陪宠物玩耍')
    showFeedbackMessage('玩耍成功！宠物很开心！', 'success')
  } catch (error) {
    showFeedbackMessage('操作失败，请重试', 'error')
  } finally {
    isProcessing.value = false
  }
}

function showFeedbackMessage(message: string, type: 'success' | 'error' | 'info') {
  feedbackMessage.value = message
  feedbackType.value = type
  showFeedback.value = true

  setTimeout(() => {
    showFeedback.value = false
  }, 3000)
}

function addActivity(icon: string, action: string) {
  const now = new Date()
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  recentActivities.value.unshift({
    icon,
    action,
    time
  })

  // 只保留最近10条记录
  if (recentActivities.value.length > 10) {
    recentActivities.value = recentActivities.value.slice(0, 10)
  }
}

function updatePetStatus(newStatus: PetState) {
  petStatus.value = { ...newStatus }
}

// 生命周期钩子
onMounted(() => {
  // 加载宠物状态
  ipcRenderer.send('get-pet-state')

  ipcRenderer.on('get-pet-state-reply', (_event, status: PetState) => {
    if (status) {
      updatePetStatus(status)
    }
  })

  // 监听宠物状态更新
  ipcRenderer.on('update-pet-status', (_event, status: PetState) => {
    updatePetStatus(status)
  })
})

onUnmounted(() => {
  ipcRenderer.removeAllListeners('get-pet-state-reply')
  ipcRenderer.removeAllListeners('update-pet-status')
})
</script>

<style scoped>
.pet-care-tab {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.pet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pet-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
}

.level-number {
  font-weight: bold;
  font-size: 14px;
}

.exp-bar {
  width: 80px;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.exp-progress {
  height: 100%;
  background: #ffd700;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.pet-status-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.pet-avatar-preview {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.emotion-display {
  font-size: 48px;
  animation: bounce 2s infinite;
}

.emotion-display.sad {
  animation: none;
}

.emotion-display.happy {
  animation: bounce 1s infinite;
}

.status-indicator {
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-indicator.normal {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-indicator.warning {
  background: #fff3e0;
  color: #ef6c00;
}

.status-indicator.low {
  background: #ffebee;
  color: #c62828;
}

.status-indicator.critical {
  background: #ffcdd2;
  color: #b71c1c;
  animation: pulse 1s infinite;
}

.stats-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  background: white;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-icon {
  font-size: 20px;
}

.stat-name {
  flex: 1;
  font-weight: 500;
  color: #555;
}

.stat-value {
  font-weight: bold;
  font-size: 16px;
}

.stat-value.normal {
  color: #4caf50;
}

.stat-value.warning {
  color: #ff9800;
}

.stat-value.low {
  color: #ff5722;
}

.stat-value.critical {
  color: #f44336;
}

.stat-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.stat-progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.stat-progress.hunger {
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
}

.stat-progress.cleanliness {
  background: linear-gradient(90deg, #2196f3 0%, #03a9f4 100%);
}

.stat-progress.happiness {
  background: linear-gradient(90deg, #ff9800 0%, #ffc107 100%);
}

.action-section {
  margin-bottom: 20px;
}

.action-section h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.action-btn {
  padding: 16px 12px;
  border: none;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.feed-btn {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
}

.action-btn.clean-btn {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  color: white;
}

.action-btn.play-btn {
  background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%);
  color: white;
}

.btn-icon {
  font-size: 32px;
}

.btn-text {
  font-weight: bold;
  font-size: 14px;
}

.btn-hint {
  font-size: 11px;
  opacity: 0.8;
}

.advice-section {
  margin-bottom: 20px;
  background: #fff3e0;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #ff9800;
}

.advice-section h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.advice-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.advice-list li {
  position: relative;
  margin-bottom: 8px;
  padding-left: 20px;
  color: #666;
  font-size: 14px;
}

.advice-list li::before {
  content: '💡';
  position: absolute;
  left: 0;
  top: 0;
}

.feedback-section {
  margin-bottom: 20px;
}

.feedback-message {
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
}

.feedback-message.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.feedback-message.error {
  background: #ffebee;
  color: #c62828;
}

.feedback-message.info {
  background: #e3f2fd;
  color: #1565c0;
}

.history-section {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 12px;
}

.history-section h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.history-item:last-child {
  border-bottom: none;
}

.history-icon {
  font-size: 20px;
}

.history-action {
  flex: 1;
  color: #555;
  font-size: 14px;
}

.history-time {
  color: #999;
  font-size: 12px;
}

.history-empty {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>