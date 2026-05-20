<template>
  <div class="markdown-editor">
    <div class="toolbar">
      <button @click="insertBold" class="btn" title="粗体">B</button>
      <button @click="insertItalic" class="btn" title="斜体">I</button>
      <button @click="insertHeading" class="btn" title="标题">H</button>
      <button @click="insertLink" class="btn" title="链接">🔗</button>
      <button @click="insertCode" class="btn" title="代码">代码</button>
      <button @click="insertList" class="btn" title="列表">列表</button>
      <div class="toolbar-divider"></div>
      <button @click="openFile" class="btn">打开</button>
      <button @click="saveFile" class="btn">保存</button>
      <button @click="saveAsFile" class="btn">另存为</button>
      <button @click="newFile" class="btn">新建</button>
    </div>
    
    <div class="editor-container">
      <div class="editor-panel">
        <div class="panel-header">编辑</div>
        <textarea 
          ref="editorRef"
          v-model="content" 
          class="editor" 
          placeholder="请输入Markdown内容..."
          @input="onContentChange"
        ></textarea>
      </div>
      
      <div class="editor-panel">
        <div class="panel-header">预览</div>
        <div class="preview" v-html="renderedContent"></div>
      </div>
    </div>
    
    <div class="status-bar">
      <span>{{ status }}</span>
      <span v-if="hasUnsavedChanges" class="unsaved">未保存</span>
      <span v-if="filePath">{{ filePath }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')

const content = ref('')
const filePath = ref('')
const hasUnsavedChanges = ref(false)
const editorRef = ref<HTMLTextAreaElement | null>(null)

const status = computed(() => {
  const lines = content.value.split('\n').length
  const chars = content.value.length
  return `${lines} 行, ${chars} 字符`
})

// 简单的Markdown渲染器
const renderMarkdown = (text: string): string => {
  let html = text
  
  // 转义HTML
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // 粗体和斜体
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 代码块
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  html = html.replace(/`(.*?)`/g, '<code>$1</code>')
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // 列表
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  // 段落
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  
  return html
}

const renderedContent = computed(() => renderMarkdown(content.value))

const onContentChange = () => {
  hasUnsavedChanges.value = true
}

const insertText = (before: string, after: string = '') => {
  const editor = editorRef.value
  if (!editor) return
  
  const start = editor.selectionStart
  const end = editor.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  const newText = before + selectedText + after
  content.value = content.value.substring(0, start) + newText + content.value.substring(end)
  
  editor.focus()
  editor.setSelectionRange(start + before.length, start + before.length + selectedText.length)
  hasUnsavedChanges.value = true
}

const insertBold = () => insertText('**', '**')
const insertItalic = () => insertText('*', '*')
const insertHeading = () => insertText('## ')
const insertLink = () => insertText('[', '](url)')
const insertCode = () => insertText('`', '`')
const insertList = () => insertText('* ')

const newFile = () => {
  if (hasUnsavedChanges.value) {
    if (!confirm('当前文件未保存，是否继续新建？')) {
      return
    }
  }
  content.value = ''
  filePath.value = ''
  hasUnsavedChanges.value = false
}

const openFile = async () => {
  if (hasUnsavedChanges.value) {
    if (!confirm('当前文件未保存，是否继续打开？')) {
      return
    }
  }
  
  const result = await ipcRenderer.invoke('show-open-dialog', {
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  
  if (result && !result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    try {
      content.value = fs.readFileSync(selectedPath, 'utf-8')
      filePath.value = selectedPath
      hasUnsavedChanges.value = false
    } catch (e: any) {
      alert('打开文件失败: ' + e.message)
    }
  }
}

const saveFile = async () => {
  if (!filePath.value) {
    await saveAsFile()
    return
  }
  
  try {
    fs.writeFileSync(filePath.value, content.value, 'utf-8')
    hasUnsavedChanges.value = false
  } catch (e: any) {
    alert('保存文件失败: ' + e.message)
  }
}

const saveAsFile = async () => {
  const result = await ipcRenderer.invoke('show-save-dialog', {
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  
  if (result && !result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content.value, 'utf-8')
      filePath.value = result.filePath
      hasUnsavedChanges.value = false
    } catch (e: any) {
      alert('保存文件失败: ' + e.message)
    }
  }
}
</script>

<style scoped>
.markdown-editor {
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
  padding: 6px 12px;
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

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 8px;
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

.preview {
  flex: 1;
  padding: 12px;
  overflow: auto;
  line-height: 1.6;
}

.preview :deep(h1) {
  font-size: 2em;
  margin: 0.5em 0;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.3em;
}

.preview :deep(h2) {
  font-size: 1.5em;
  margin: 0.5em 0;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.3em;
}

.preview :deep(h3) {
  font-size: 1.25em;
  margin: 0.5em 0;
}

.preview :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.preview :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.preview :deep(pre code) {
  background: none;
  padding: 0;
}

.preview :deep(a) {
  color: #1976d2;
  text-decoration: none;
}

.preview :deep(a:hover) {
  text-decoration: underline;
}

.preview :deep(ul) {
  margin: 0.5em 0;
  padding-left: 2em;
}

.preview :deep(li) {
  margin: 0.25em 0;
}

.status-bar {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: white;
  border-top: 1px solid #e0e0e0;
  font-size: 13px;
}

.unsaved {
  color: #f57c00;
  font-weight: 500;
}
</style>
