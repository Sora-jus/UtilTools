<template>
  <div class="json-tool">
    <div class="toolbar">
      <button @click="format" class="btn">格式化</button>
      <button @click="compress" class="btn">压缩</button>
      <button @click="validate" class="btn">验证</button>
      <button @click="copy" class="btn">复制</button>
      <button @click="clear" class="btn">清空</button>
      <select v-model="indent" class="select">
        <option :value="2">2空格缩进</option>
        <option :value="4">4空格缩进</option>
      </select>
    </div>
    
    <div class="editor-container">
      <div class="editor-panel">
        <div class="panel-header">输入</div>
        <textarea 
          v-model="input" 
          class="editor" 
          placeholder="请输入JSON文本..."
          @input="onInput"
        ></textarea>
      </div>
      
      <div class="editor-panel">
        <div class="panel-header">输出</div>
        <textarea 
          v-model="output" 
          class="editor" 
          readonly
          :class="{ 'error': hasError }"
        ></textarea>
      </div>
    </div>
    
    <div class="status-bar">
      <span :class="statusClass">{{ status }}</span>
      <span v-if="errorInfo" class="error-info">{{ errorInfo }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const input = ref('')
const output = ref('')
const indent = ref(2)
const status = ref('就绪')
const hasError = ref(false)
const errorInfo = ref('')

const statusClass = computed(() => hasError.value ? 'error' : 'success')

// JSON解析和格式化
const parseJson = (text: string) => {
  try {
    return { success: true, data: JSON.parse(text) }
  } catch (e: any) {
    const match = e.message.match(/position (\d+)/)
    if (match) {
      const position = parseInt(match[1])
      const lines = text.substring(0, position).split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length + 1
      return { 
        success: false, 
        error: {
          line,
          column,
          message: e.message
        }
      }
    }
    return { success: false, error: { line: 0, column: 0, message: e.message } }
  }
}

const format = () => {
  hasError.value = false
  errorInfo.value = ''
  
  if (!input.value.trim()) {
    status.value = '输入为空'
    return
  }
  
  const result = parseJson(input.value)
  if (result.success) {
    output.value = JSON.stringify(result.data, null, indent.value)
    status.value = '格式化成功'
  } else {
    hasError.value = true
    output.value = result.error!.message
    errorInfo.value = `行 ${result.error!.line}, 列 ${result.error!.column}`
    status.value = '格式化失败'
  }
}

const compress = () => {
  hasError.value = false
  errorInfo.value = ''
  
  if (!input.value.trim()) {
    status.value = '输入为空'
    return
  }
  
  const result = parseJson(input.value)
  if (result.success) {
    output.value = JSON.stringify(result.data)
    status.value = '压缩成功'
  } else {
    hasError.value = true
    output.value = result.error!.message
    errorInfo.value = `行 ${result.error!.line}, 列 ${result.error!.column}`
    status.value = '压缩失败'
  }
}

const validate = () => {
  hasError.value = false
  errorInfo.value = ''
  
  if (!input.value.trim()) {
    status.value = '输入为空'
    return
  }
  
  const result = parseJson(input.value)
  if (result.success) {
    output.value = 'JSON格式正确'
    status.value = '验证通过'
  } else {
    hasError.value = true
    output.value = result.error!.message
    errorInfo.value = `行 ${result.error!.line}, 列 ${result.error!.column}`
    status.value = '验证失败'
  }
}

const copy = () => {
  if (output.value) {
    navigator.clipboard.writeText(output.value)
    status.value = '已复制到剪贴板'
  }
}

const clear = () => {
  input.value = ''
  output.value = ''
  hasError.value = false
  errorInfo.value = ''
  status.value = '已清空'
}

const onInput = () => {
  // 实时验证
  if (input.value.trim()) {
    const result = parseJson(input.value)
    if (result.success) {
      hasError.value = false
      errorInfo.value = ''
      status.value = 'JSON格式正确'
    } else {
      hasError.value = true
      errorInfo.value = `行 ${result.error!.line}, 列 ${result.error!.column}`
      status.value = 'JSON格式错误'
    }
  } else {
    hasError.value = false
    errorInfo.value = ''
    status.value = '就绪'
  }
}
</script>

<style scoped>
.json-tool {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.toolbar {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.btn {
  padding: 6px 16px;
  border: 1px solid #d0d0d0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  background: #f0f0f0;
  border-color: #b0b0b0;
}

.select {
  padding: 6px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.editor-container {
  flex: 1;
  display: flex;
  gap: 1px;
  background: #e0e0e0;
  overflow: hidden;
}

.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.panel-header {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 500;
  font-size: 14px;
}

.editor {
  flex: 1;
  border: none;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  resize: none;
  outline: none;
  line-height: 1.6;
}

.editor.error {
  color: #d32f2f;
  background: #fff5f5;
}

.status-bar {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: white;
  border-top: 1px solid #e0e0e0;
  font-size: 13px;
}

.status-bar .success {
  color: #388e3c;
}

.status-bar .error {
  color: #d32f2f;
}

.error-info {
  color: #d32f2f;
  font-weight: 500;
}
</style>
