<template>
  <div
    class="divider-bar"
    :class="{ dragging: isDragging }"
    @mousedown="handleMouseDown"
  >
    <div class="divider-handle">
      <div class="handle-line"></div>
      <div class="handle-line"></div>
      <div class="handle-line"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  'position-change': [position: number]
  'drag-start': []
  'drag-end': []
}>()

const props = defineProps<{
  containerWidth: number
}>()

const isDragging = ref(false)
const startX = ref(0)
const startPosition = ref(0)

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  startX.value = e.clientX
  startPosition.value = 0.5 // 当前位置比例，应从父组件传入
  
  emit('drag-start')
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaX = e.clientX - startX.value
  const newPosition = calculateNewPosition(deltaX)
  
  emit('position-change', newPosition)
}

function handleMouseUp() {
  isDragging.value = false
  emit('drag-end')
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

function calculateNewPosition(deltaX: number): number {
  // 计算新位置比例
  const minPosition = 200 / props.containerWidth  // 最小宽度比例
  const maxPosition = 1 - minPosition
  
  const newPosition = startPosition.value + (deltaX / props.containerWidth)
  
  // 限制在最小和最大位置之间
  return Math.max(minPosition, Math.min(maxPosition, newPosition))
}
</script>

<style scoped>
.divider-bar {
  width: 8px;
  height: 100%;
  background: #f0f0f0;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  user-select: none;
  flex-shrink: 0;
}

.divider-bar:hover {
  background: #e0e0e0;
}

.divider-bar.dragging {
  background: #1890ff;
}

.divider-handle {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.handle-line {
  width: 4px;
  height: 2px;
  background: #999;
  border-radius: 1px;
}

.divider-bar:hover .handle-line,
.divider-bar.dragging .handle-line {
  background: #666;
}

.divider-bar.dragging .handle-line {
  background: #fff;
}
</style>
