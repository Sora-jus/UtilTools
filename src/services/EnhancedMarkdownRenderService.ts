/**
 * 增强Markdown渲染服务
 * 支持表格、列表、Mermaid图表和代码高亮
 */

export interface RenderOptions {
  highlight: boolean      // 是否启用语法高亮
  breaks: boolean         // 是否将换行符转换为<br>
  linkify: boolean        // 是否自动识别链接
  mermaid: boolean        // 是否启用Mermaid图表渲染
  tables: boolean         // 是否启用表格渲染
  taskLists: boolean      // 是否启用任务列表
}

export interface MarkdownRendererConfig {
  renderOptions: RenderOptions
  codeTheme: string      // 代码高亮主题
  mermaidTheme: string   // Mermaid图表主题
}

export interface EnhancedMarkdownRenderService {
  // 渲染Markdown内容
  render(content: string, options: MarkdownRendererConfig): Promise<string>
  // 渲染Mermaid图表
  renderMermaid(code: string): Promise<string>
  // 应用代码高亮
  highlightCode(code: string, language: string): string
  // 渲染表格
  renderTable(markdown: string): string
}

/**
 * 增强Markdown渲染服务实现
 */
export class EnhancedMarkdownRenderServiceImpl implements EnhancedMarkdownRenderService {
  private mermaidInitialized = false
  
  constructor() {
    this.initMermaid()
  }
  
  private async initMermaid(): Promise<void> {
    if (typeof window !== 'undefined' && !this.mermaidInitialized) {
      try {
        // 动态导入mermaid
        const mermaid = await import('mermaid')
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        })
        this.mermaidInitialized = true
      } catch (error) {
        console.warn('Mermaid initialization failed:', error)
      }
    }
  }
  
  async render(content: string, config: MarkdownRendererConfig): Promise<string> {
    let processed = content
    
    // 预处理Mermaid代码块
    if (config.renderOptions.mermaid) {
      processed = await this.processMermaidBlocks(processed)
    }
    
    // 使用简单的Markdown渲染（实际项目中应使用markdown-it等库）
    let html = this.basicMarkdownRender(processed, config)
    
    return html
  }
  
  async renderMermaid(code: string): Promise<string> {
    if (!this.mermaidInitialized) {
      await this.initMermaid()
    }
    
    try {
      if (typeof window !== 'undefined') {
        const mermaid = await import('mermaid')
        const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        const { svg } = await mermaid.default.render(id, code)
        return svg
      }
    } catch (error) {
      console.error('Mermaid render error:', error)
      return `<pre class="mermaid-error">Mermaid Error: ${error}</pre>`
    }
    
    return `<pre class="mermaid-code">${code}</pre>`
  }
  
  highlightCode(code: string, language: string): string {
    // 简单的代码高亮实现
    // 实际项目中应使用highlight.js或prism.js
    const escaped = this.escapeHtml(code)
    return `<code class="language-${language}">${escaped}</code>`
  }
  
  renderTable(markdown: string): string {
    // 简单的表格渲染
    // 实际项目中应使用markdown-it-table插件
    return markdown
  }
  
  private async processMermaidBlocks(content: string): Promise<string> {
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
    const matches = [...content.matchAll(mermaidRegex)]
    
    let result = content
    for (const match of matches) {
      const mermaidCode = match[1]
      const svg = await this.renderMermaid(mermaidCode)
      result = result.replace(match[0], `<div class="mermaid-diagram">${svg}</div>`)
    }
    
    return result
  }
  
  private basicMarkdownRender(content: string, config: MarkdownRendererConfig): string {
    let html = content
    
    // 转义HTML
    html = this.escapeHtml(html)
    
    // 标题
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // 粗体和斜体
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // 代码块
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const language = lang || 'plaintext'
      const highlighted = this.highlightCode(code.trim(), language)
      return `<pre>${highlighted}</pre>`
    })
    
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // 链接
    if (config.renderOptions.linkify) {
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    }
    
    // 列表
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>')
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>')
    html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
    
    // 换行
    if (config.renderOptions.breaks) {
      html = html.replace(/\n/g, '<br>')
    }
    
    // 表格（简单实现）
    if (config.renderOptions.tables) {
      html = this.renderSimpleTable(html)
    }
    
    return html
  }
  
  private renderSimpleTable(html: string): string {
    // 简单的表格渲染
    const tableRegex = /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/g
    return html.replace(tableRegex, (_match, headerRow, bodyRows) => {
      const headers = headerRow.split('|').filter((h: string) => h.trim())
      const headerHtml = headers.map((h: string) => `<th>${h.trim()}</th>`).join('')
      
      const rows = bodyRows.trim().split('\n')
      const bodyHtml = rows.map((row: string) => {
        const cells = row.split('|').filter((c: string) => c.trim())
        return `<tr>${cells.map((c: string) => `<td>${c.trim()}</td>`).join('')}</tr>`
      }).join('')
      
      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`
    })
  }
  
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }
}

/**
 * 创建增强Markdown渲染服务实例
 */
export function createEnhancedMarkdownRenderService(): EnhancedMarkdownRenderService {
  return new EnhancedMarkdownRenderServiceImpl()
}
