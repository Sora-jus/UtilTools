import { app, BrowserWindow, ipcMain, screen, dialog, Menu, MenuItem, Tray, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'

// 类型定义
interface Position {
  x: number
  y: number
}

interface PetState {
  hunger: number
  cleanliness: number
  happiness: number
  level: number
  experience: number
  lastFed: string
  lastCleaned: string
  lastPlayed: string
}

interface AppConfig {
  petSkin: string
  petMode: 'pet' | 'tool'
  petPosition: Position
  toolPosition: Position
  autoStart: boolean
  petSize: number
  lastActivityTime: string
}

// 数据管理器
class DataManager {
  private dataPath: string
  private configPath: string
  private petStatePath: string
  private config: AppConfig
  private petState: PetState

  constructor() {
    const userDataPath = app.getPath('userData')
    this.dataPath = path.join(userDataPath, 'pet-tool-data')
    this.configPath = path.join(this.dataPath, 'config.json')
    this.petStatePath = path.join(this.dataPath, 'pet-state.json')

    // 确保数据目录存在
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true })
    }

    // 初始化默认配置
    this.config = this.loadConfig()
    this.petState = this.loadPetState()
  }

  loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.log('Failed to load config, using defaults:', error)
    }

    // 返回默认配置
    const { width } = screen.getPrimaryDisplay().workAreaSize
    return {
      petSkin: 'tiger',
      petMode: 'pet',
      petPosition: { x: width - 120, y: 100 },
      toolPosition: { x: width - 80, y: 100 },
      autoStart: false,
      petSize: 100,
      lastActivityTime: new Date().toISOString()
    }
  }

  saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      console.log('Config saved successfully')
    } catch (error) {
      console.log('Failed to save config:', error)
    }
  }

  loadPetState(): PetState {
    try {
      if (fs.existsSync(this.petStatePath)) {
        const data = fs.readFileSync(this.petStatePath, 'utf-8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.log('Failed to load pet state, using defaults:', error)
    }

    // 返回默认宠物状态
    const now = new Date()
    return {
      hunger: 80,
      cleanliness: 80,
      happiness: 80,
      level: 1,
      experience: 0,
      lastFed: now.toISOString(),
      lastCleaned: now.toISOString(),
      lastPlayed: now.toISOString()
    }
  }

  savePetState(): void {
    try {
      fs.writeFileSync(this.petStatePath, JSON.stringify(this.petState, null, 2))
      console.log('Pet state saved successfully')
    } catch (error) {
      console.log('Failed to save pet state:', error)
    }
  }

  getConfig(): AppConfig {
    return { ...this.config }
  }

  setConfig(config: Partial<AppConfig>): void {
    this.config = { ...this.config, ...config }
    this.saveConfig()
  }

  getPetState(): PetState {
    return { ...this.petState }
  }

  setPetState(state: Partial<PetState>): void {
    this.petState = { ...this.petState, ...state }
    this.savePetState()
  }

  updatePetAttribute(attribute: 'hunger' | 'cleanliness' | 'happiness', value: number): PetState {
    this.petState[attribute] = Math.max(0, Math.min(100, value))
    this.petState.lastActivityTime = new Date().toISOString()
    this.savePetState()
    return this.getPetState()
  }

  updatePetPosition(position: Position, mode: 'pet' | 'tool'): void {
    if (mode === 'pet') {
      this.config.petPosition = position
    } else {
      this.config.toolPosition = position
    }
    this.saveConfig()
  }

  getPositionForMode(mode: 'pet' | 'tool'): Position {
    return mode === 'pet' ? this.config.petPosition : this.config.toolPosition
  }
}

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

// 初始化数据管理器
const dataManager = new DataManager()

// 窗口管理器
class WindowManager {
  public petWindow: BrowserWindow | null = null
  private jsonToolWindow: BrowserWindow | null = null
  private markdownEditorWindow: BrowserWindow | null = null
  private mainPanelWindow: BrowserWindow | null = null
  private tray: Tray | null = null

  // 创建宠物窗口（可以是宠物模式或工具模式）
  createPetWindow() {
    const config = dataManager.getConfig()
    const position = config.petMode === 'pet' ? config.petPosition : config.toolPosition
    const size = config.petMode === 'pet' ? config.petSize : 60

    console.log(`Creating ${config.petMode} window at:`, position)

    this.petWindow = new BrowserWindow({
      width: size,
      height: size,
      x: Math.round(position.x),
      y: Math.round(position.y),
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
      this.petWindow.loadURL('http://localhost:5173')
    } else {
      this.petWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    // 加载初始数据
    this.petWindow.webContents.on('did-finish-load', () => {
      const petState = dataManager.getPetState()
      this.petWindow?.webContents.send('load-pet-data', {
        mode: config.petMode,
        position: position,
        state: petState
      })
    })

    console.log(`${config.petMode} window is ready to show`)

    // 创建系统托盘
    this.createTray()
  }

  // 切换宠物模式
  switchMode(mode: 'pet' | 'tool') {
    if (!this.petWindow) return

    const config = dataManager.getConfig()
    const currentPosition = this.petWindow.getPosition()
    const position = mode === 'pet' ? config.petPosition : config.toolPosition
    const size = mode === 'pet' ? config.petSize : 60

    // 更新配置
    dataManager.setConfig({ petMode: mode })

    // 更新窗口大小和位置
    this.petWindow.setSize(size, size)
    this.petWindow.setPosition(Math.round(position.x), Math.round(position.y))

    // 通知渲染进程切换模式
    this.petWindow.webContents.send('switch-mode', mode)

    console.log(`Switched to ${mode} mode`)
  }

  // 创建系统托盘
  createTray() {
    if (this.tray) return

    // 创建托盘图标
    const iconPath = path.join(__dirname, '../assets/tray-icon.png')
    let trayIcon: any

    if (process.env.NODE_ENV === 'development' || !fs.existsSync(iconPath)) {
      // 开发环境使用默认图标
      trayIcon = nativeImage.createEmpty()
    } else {
      trayIcon = nativeImage.createFromPath(iconPath)
    }

    this.tray = new Tray(trayIcon)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示宠物',
        type: 'radio',
        checked: dataManager.getConfig().petMode === 'pet',
        click: () => this.switchMode('pet')
      },
      {
        label: '显示工具按钮',
        type: 'radio',
        checked: dataManager.getConfig().petMode === 'tool',
        click: () => this.switchMode('tool')
      },
      { type: 'separator' },
      { label: 'JSON 工具', click: () => this.createJsonToolWindow() },
      { label: 'Markdown 编辑器', click: () => this.createMarkdownEditorWindow() },
      { type: 'separator' },
      { label: '主功能面板', click: () => this.showMainPanel() },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() }
    ])

    this.tray.setToolTip('桌面宠物工具')
    this.tray.setContextMenu(contextMenu)
  }

  // 显示优化后的菜单（仅在工具模式下）
  showMenu() {
    if (!this.petWindow) return

    const menu = new Menu()

    // 模式切换菜单项
    menu.append(new MenuItem({
      label: '显示宠物',
      type: 'radio',
      checked: dataManager.getConfig().petMode === 'pet',
      click: () => this.switchMode('pet')
    }))

    menu.append(new MenuItem({
      label: '显示工具按钮',
      type: 'radio',
      checked: dataManager.getConfig().petMode === 'tool',
      click: () => this.switchMode('tool')
    }))

    menu.append(new MenuItem({ type: 'separator' }))

    // 工具菜单项
    menu.append(new MenuItem({
      label: 'JSON 工具',
      accelerator: 'CmdOrCtrl+J',
      click: () => {
        this.createJsonToolWindow()
      }
    }))

    menu.append(new MenuItem({
      label: 'Markdown 编辑器',
      accelerator: 'CmdOrCtrl+M',
      click: () => {
        this.createMarkdownEditorWindow()
      }
    }))

    menu.append(new MenuItem({ type: 'separator' }))

    // 主面板
    menu.append(new MenuItem({
      label: '主功能面板',
      accelerator: 'CmdOrCtrl+P',
      click: () => {
        this.showMainPanel()
      }
    }))

    menu.append(new MenuItem({ type: 'separator' }))

    // 设置子菜单
    const settingsSubMenu = new Menu()
    settingsSubMenu.append(new MenuItem({
      label: '关于',
      accelerator: 'F1',
      click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: '关于 桌面宠物工具',
          message: '桌面宠物工具 v1.0.0',
          detail: 'Windows桌面宠物工具集\n\n功能：\n• 可爱宠物形象（默认Q版老虎）\n• 宠物养成系统\n• JSON解析格式化验证\n• Markdown编辑器\n• 多种显示模式\n\n技术栈：Electron + Vue 3 + TypeScript'
        })
      }
    }))

    menu.append(new MenuItem({
      label: '设置',
      submenu: settingsSubMenu
    }))

    menu.append(new MenuItem({ type: 'separator' }))

    // 退出
    menu.append(new MenuItem({
      label: '退出',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        app.quit()
      }
    }))

    const { x, y } = this.petWindow.getPosition()
    menu.popup({
      window: this.petWindow,
      x: x,
      y: y + 60
    })
  }

  // 显示主功能面板
  showMainPanel() {
    if (this.mainPanelWindow) {
      this.mainPanelWindow.focus()
      return
    }

    const { x, y } = this.petWindow?.getPosition() || { x: 100, y: 100 }

    this.mainPanelWindow = new BrowserWindow({
      width: 500,
      height: 600,
      x: x + 50,
      y: y,
      title: '主功能面板',
      frame: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    if (process.env.NODE_ENV === 'development') {
      this.mainPanelWindow.loadURL('http://localhost:5173/main-panel.html')
    } else {
      this.mainPanelWindow.loadFile(path.join(__dirname, '../renderer/main-panel.html'))
    }

    // 加载宠物数据
    this.mainPanelWindow.webContents.on('did-finish-load', () => {
      const petState = dataManager.getPetState()
      this.mainPanelWindow?.webContents.send('load-pet-state', petState)
    })

    this.mainPanelWindow.on('closed', () => {
      this.mainPanelWindow = null
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

  // 更新窗口位置
  updateWindowPosition(position: Position, mode: 'pet' | 'tool') {
    if (this.petWindow) {
      this.petWindow.setPosition(Math.round(position.x), Math.round(position.y))
      dataManager.updatePetPosition(position, mode)
    }
  }

  // 处理宠物动作
  handlePetAction(action: 'feed' | 'clean' | 'play'): PetState {
    const currentState = dataManager.getPetState()

    switch (action) {
      case 'feed':
        return dataManager.updatePetAttribute('hunger', currentState.hunger + 15)
      case 'clean':
        return dataManager.updatePetAttribute('cleanliness', currentState.cleanliness + 20)
      case 'play':
        const newState = dataManager.updatePetAttribute('happiness', currentState.happiness + 20)
        dataManager.updatePetAttribute('hunger', currentState.hunger - 5)
        dataManager.updatePetAttribute('cleanliness', currentState.cleanliness - 5)
        return newState
      default:
        return currentState
    }
  }

  // 获取指定模式的位置
  getPositionForMode(mode: 'pet' | 'tool'): Position {
    return dataManager.getPositionForMode(mode)
  }
}

const windowManager = new WindowManager()

// 应用准备就绪
app.whenReady().then(() => {
  console.log('App is ready')
  windowManager.createPetWindow()

  // IPC通信处理
  ipcMain.on('show-menu', () => {
    windowManager.showMenu()
  })

  ipcMain.on('show-main-panel', () => {
    windowManager.showMainPanel()
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

  // 更新窗口位置
  ipcMain.on('update-button-position', (_event, data: { position: Position, mode: 'pet' | 'tool' }) => {
    windowManager.updateWindowPosition(data.position, data.mode)
  })

  // 保存按钮位置
  ipcMain.on('save-button-position', (_event, data: { position: Position, mode: 'pet' | 'tool' }) => {
    dataManager.updatePetPosition(data.position, data.mode)
  })

  // 加载按钮位置
  ipcMain.on('load-button-position', (event) => {
    const config = dataManager.getConfig()
    const position = config.petMode === 'pet' ? config.petPosition : config.toolPosition
    event.reply('load-button-position', {
      position: position,
      mode: config.petMode
    })
  })

  // 切换模式
  ipcMain.on('switch-mode', (_event, mode: 'pet' | 'tool') => {
    windowManager.switchMode(mode)
  })

  // 获取指定模式的位置
  ipcMain.on('get-position-for-mode', (event, mode: 'pet' | 'tool') => {
    const position = windowManager.getPositionForMode(mode)
    event.reply('position-for-mode', position)
  })

  // 宠物动作处理
  ipcMain.on('pet-action', (event, action: 'feed' | 'clean' | 'play') => {
    const newState = windowManager.handlePetAction(action)

    // 通知所有窗口更新宠物状态
    if (windowManager.petWindow) {
      windowManager.petWindow.webContents.send('update-pet-status', newState)
    }
    if (windowManager.mainPanelWindow) {
      windowManager.mainPanelWindow.webContents.send('update-pet-status', newState)
    }

    event.reply('pet-action-result', {
      success: true,
      action: action,
      newState: newState
    })
  })

  // 获取宠物状态
  ipcMain.handle('get-pet-state', () => {
    return dataManager.getPetState()
  })

  // 获取宠物状态（旧接口兼容）
  ipcMain.handle('get-pet-status', () => {
    return dataManager.getPetState()
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
