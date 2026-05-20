import { app, BrowserWindow, ipcMain, screen, dialog, Menu, MenuItem } from 'electron'
import path from 'path'
import fs from 'fs'

// 清理缓存函数
const cleanCache = () => {
  try {
    const userDataPath = app.getPath('userData')
    const cachePath = path.join(userDataPath, 'Cache')
    const gpuCachePath = path.join(userDataPath, 'GPUCache')
    
    if (fs.existsSync(cachePath)) {
      fs.rmSync(cachePath, { recursive: true, force: true })
      console.log('Cache cleaned')
    }
    if (fs.existsSync(gpuCachePath)) {
      fs.rmSync(gpuCachePath, { recursive: true, force: true })
      console.log('GPU Cache cleaned')
    }
  } catch (error) {
    console.log('Cache cleanup failed:', error)
  }
}

// 禁用GPU缓存相关参数
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

// 清理缓存
cleanCache()

// 窗口管理器
class WindowManager {
  public floatingButton: BrowserWindow | null = null
  private jsonToolWindow: BrowserWindow | null = null
  private markdownEditorWindow: BrowserWindow | null = null

  // 创建悬浮按钮窗口
  createFloatingButton() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    console.log('Screen size:', width, height)
    console.log('Creating floating button at:', width - 80, 100)
    
    this.floatingButton = new BrowserWindow({
      width: 60,
      height: 60,
      x: width - 80,
      y: 100,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (process.env.NODE_ENV === 'development') {
      this.floatingButton.loadURL('http://localhost:5173')
    } else {
      this.floatingButton.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
    
    console.log('Floating button is ready to show')
  }

  // 显示优化后的菜单
  showMenu() {
    if (!this.floatingButton) return
    
    const menu = new Menu()
    
    // 工具菜单项
    menu.append(new MenuItem({
      label: 'JSON 工具',
      accelerator: 'CmdOrCtrl+J',
      click: () => {
        this.floatingButton?.webContents.send('menu-action', 'json-tool')
      }
    }))
    
    menu.append(new MenuItem({
      label: 'Markdown 编辑器',
      accelerator: 'CmdOrCtrl+M',
      click: () => {
        this.floatingButton?.webContents.send('menu-action', 'markdown-editor')
      }
    }))
    
    // 分隔线
    menu.append(new MenuItem({ type: 'separator' }))
    
    // 设置子菜单
    const settingsSubMenu = new Menu()
    settingsSubMenu.append(new MenuItem({
      label: '首选项',
      accelerator: 'CmdOrCtrl+,',
      enabled: false
    }))
    settingsSubMenu.append(new MenuItem({
      label: '关于',
      accelerator: 'F1',
      click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: '关于 UtilTool',
          message: 'UtilTool v1.0.0',
          detail: 'Windows桌面悬浮按钮工具集\n\n功能：\n• JSON解析格式化验证\n• Markdown编辑器\n\n技术栈：Electron + Vue 3 + TypeScript'
        })
      }
    }))
    
    menu.append(new MenuItem({
      label: '设置',
      submenu: settingsSubMenu
    }))
    
    // 分隔线
    menu.append(new MenuItem({ type: 'separator' }))
    
    // 退出
    menu.append(new MenuItem({
      label: '退出',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        this.floatingButton?.webContents.send('menu-action', 'quit')
      }
    }))
    
    menu.popup({
      window: this.floatingButton,
      x: 0,
      y: 60
    })
  }

  // 创建JSON工具窗口
  createJsonToolWindow() {
    if (this.jsonToolWindow) {
      this.jsonToolWindow.focus()
      return
    }

    this.jsonToolWindow = new BrowserWindow({
      width: 800,
      height: 600,
      title: 'JSON工具',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (process.env.NODE_ENV === 'development') {
      this.jsonToolWindow.loadURL('http://localhost:5173/json-tool.html')
    } else {
      this.jsonToolWindow.loadFile(path.join(__dirname, '../renderer/json-tool.html'))
    }

    this.jsonToolWindow.on('closed', () => {
      this.jsonToolWindow = null
    })
  }

  // 创建Markdown编辑器窗口
  createMarkdownEditorWindow() {
    if (this.markdownEditorWindow) {
      this.markdownEditorWindow.focus()
      return
    }

    this.markdownEditorWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      title: 'Markdown编辑器',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (process.env.NODE_ENV === 'development') {
      this.markdownEditorWindow.loadURL('http://localhost:5173/markdown-editor.html')
    } else {
      this.markdownEditorWindow.loadFile(path.join(__dirname, '../renderer/markdown-editor.html'))
    }

    this.markdownEditorWindow.on('closed', () => {
      this.markdownEditorWindow = null
    })
  }
}

const windowManager = new WindowManager()

// 应用准备就绪
app.whenReady().then(() => {
  console.log('App is ready')
  windowManager.createFloatingButton()

  // IPC通信处理
  ipcMain.on('show-menu', () => {
    windowManager.showMenu()
  })

  ipcMain.on('open-json-tool', () => {
    console.log('Opening JSON tool')
    windowManager.createJsonToolWindow()
  })

  ipcMain.on('open-markdown-editor', () => {
    console.log('Opening Markdown editor')
    windowManager.createMarkdownEditorWindow()
  })

  ipcMain.on('quit-app', () => {
    console.log('Quitting app')
    app.quit()
  })

  // 更新悬浮按钮位置
  ipcMain.on('update-button-position', (_event, position: { x: number, y: number }) => {
    if (windowManager.floatingButton) {
      windowManager.floatingButton.setPosition(Math.round(position.x), Math.round(position.y))
    }
  })

  // 文件对话框
  ipcMain.handle('show-open-dialog', async (_event, options) => {
    return dialog.showOpenDialog(options)
  })

  ipcMain.handle('show-save-dialog', async (_event, options) => {
    return dialog.showSaveDialog(options)
  })
})

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
