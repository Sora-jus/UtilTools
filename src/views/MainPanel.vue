<template>
  <div class="main-panel">
    <div class="panel-header">
      <h1>主功能面板</h1>
      <button class="close-btn" @click="closePanel">×</button>
    </div>

    <div class="panel-content">
      <!-- 选项卡导航 -->
      <div class="tab-navigation">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'care' }"
          @click="activeTab = 'care'"
        >
          <span class="tab-icon">🐾</span>
          <span class="tab-text">宠物养成</span>
        </button>

        <button
          class="tab-btn"
          :class="{ active: activeTab === 'json' }"
          @click="activeTab = 'json'"
        >
          <span class="tab-icon">📋</span>
          <span class="tab-text">JSON工具</span>
        </button>

        <button
          class="tab-btn"
          :class="{ active: activeTab === 'markdown' }"
          @click="activeTab = 'markdown'"
        >
          <span class="tab-icon">📝</span>
          <span class="tab-text">Markdown编辑器</span>
        </button>
      </div>

      <!-- 选项卡内容 -->
      <div class="tab-content">
        <div class="tab-pane" v-show="activeTab === 'care'">
          <PetCareTab />
        </div>

        <div class="tab-pane" v-show="activeTab === 'json'">
          <JsonTool @open-new-window="openJsonToolWindow" />
        </div>

        <div class="tab-pane" v-show="activeTab === 'markdown'">
          <MarkdownEditor @open-new-window="openMarkdownEditorWindow" />
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="panel-footer">
      <div class="footer-left">
        <span class="status-dot" :class="petStatusLevel"></span>
        <span class="status-text">宠物状态: {{ petStatusText }}</span>
      </div>
      <div class="footer-right">
        <button class="mini-btn" @click="refreshStatus" title="刷新状态">
          🔄
        </button>
        <button class="mini-btn" @click="openSettings" title="设置">
          ⚙️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PetCareTab from './PetCareTab.vue'
import JsonTool from './JsonTool.vue'
import MarkdownEditor from './MarkdownEditor.vue'

const { ipcRenderer } = require('electron')

// 状态
const activeTab = ref('care')
const petStatus = ref({
  hunger: 80,
  cleanliness: 80,
  happiness: 80
})

// 计算属性
const petStatusLevel = computed(() => {
  const avg = (petStatus.value.hunger + petStatus.value.cleanliness + petStatus.value.happiness) / 3
  if (avg < 20) return 'critical'
  if (avg < 40) return 'low'
  if (avg < 60) return 'warning'
  return 'normal'
})

const petStatusText = computed(() => {
  const levelMap: Record<string, string> = {
    normal: '良好',
    warning: '需要注意',
    low: '不佳',
    critical: '急需照顾'
  }
  return levelMap[petStatusLevel.value]
})

// 方法
function closePanel() {
  ipcRenderer.send('close-main-panel')
}

function openJsonToolWindow() {
  ipcRenderer.send('open-json-tool')
}

function openMarkdownEditorWindow() {
  ipcRenderer.send('open-markdown-editor')
}

function refreshStatus() {
  ipcRenderer.send('get-pet-status')
}

function openSettings() {
  ipcRenderer.send('open-settings')
}

// 初始化时获取宠物状态
onMounted(() => {
  // 加载宠物状态
  ipcRenderer.send('get-pet-status')

  // 监听宠物状态更新
  ipcRenderer.on('update-pet-status', (_event, status) => {
    petStatus.value = {
      hunger: status.hunger,
      cleanliness: status.cleanliness,
      happiness: status.happiness
    }
  })
})
</script>

<style scoped>
.main-panel {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.panel-header h1 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-navigation {
  display: flex;
  background: white;
  padding: 8px 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.02);
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.tab-icon {
  font-size: 18px;
}

.tab-text {
  font-size: 14px;
}

.tab-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.tab-pane {
  height: 100%;
  animation: fadeIn 0.3s ease;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
}

.status-dot.warning {
  background: #ff9800;
}

.status-dot.low {
  background: #ff5722;
}

.status-dot.critical {
  background: #f44336;
  animation: pulse 1s infinite;
}

.status-text {
  font-size: 14px;
  color: #666;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.mini-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.mini-btn:hover {
  background: #e0e0e0;
  transform: scale(1.05);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>