# UtilTool - Windows桌面悬浮按钮工具集

一个基于Electron + Vue 3 + TypeScript构建的Windows桌面工具集，提供悬浮按钮快速访问常用工具。

## 功能特性

### 1. 悬浮按钮
- 桌面右下角悬浮按钮
- 右键菜单快速访问工具
- 可拖拽移动位置
- 始终置顶显示

### 2. JSON工具
- JSON格式化（支持2/4空格缩进）
- JSON压缩
- JSON语法验证
- 实时错误提示（显示行号和列号）
- 复制到剪贴板

### 3. Markdown编辑器
- 实时预览
- 常用Markdown语法快捷插入（粗体、斜体、标题、链接、代码、列表）
- 文件打开/保存/另存为
- 新建文件
- 未保存提醒

## 技术栈

- **框架**: Electron 28
- **前端**: Vue 3 + TypeScript
- **构建工具**: Vite 5
- **打包工具**: electron-builder

## 项目结构

```
UtilTool/
├── src/
│   ├── main/              # 主进程代码
│   │   └── index.ts       # 主进程入口
│   ├── renderer/          # 渲染进程代码
│   │   ├── index.html     # 悬浮按钮页面
│   │   ├── json-tool.html # JSON工具页面
│   │   ├── markdown-editor.html # Markdown编辑器页面
│   │   ├── main.ts        # 悬浮按钮入口
│   │   ├── json-tool.ts   # JSON工具入口
│   │   └── markdown-editor.ts # Markdown编辑器入口
│   ├── views/             # Vue组件
│   │   ├── FloatingButton.vue
│   │   ├── JsonTool.vue
│   │   └── MarkdownEditor.vue
│   ├── components/        # 公共组件
│   ├── services/          # 服务层
│   └── utils/             # 工具函数
├── public/                # 静态资源
├── dist/                  # 构建输出
├── release/               # 打包输出
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动Vite开发服务器
npm run dev

# 在另一个终端启动Electron
npm run start
```

### 构建应用

```bash
npm run build
```

### 打包应用

```bash
npm run package
```

打包后的安装包位于 `release` 目录。

## 使用说明

1. 启动应用后，桌面右下角会出现一个悬浮按钮
2. 右键点击悬浮按钮，选择要使用的工具
3. JSON工具：输入JSON文本，点击格式化/压缩/验证按钮
4. Markdown编辑器：左侧编辑，右侧实时预览

## 开发计划

- [ ] 添加更多工具（时间戳转换、Base64编解码等）
- [ ] 悬浮按钮位置记忆功能
- [ ] 主题切换功能
- [ ] 国际化支持
- [ ] 配置管理界面

## 许可证

ISC
