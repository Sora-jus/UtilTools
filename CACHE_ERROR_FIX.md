# Electron缓存错误解决方案

## 错误信息
```
[ERROR:cache_util_win.cc(20)] Unable to move the cache: 拒绝访问。 (0x5)
[ERROR:disk_cache.cc(208)] Unable to create cache
[ERROR:gpu_disk_cache.cc(676)] Gpu Cache Creation failed: -2
```

## 问题分析

### 1. 错误原因
- Windows文件权限问题
- Electron缓存目录被占用或权限不足
- GPU缓存创建失败

### 2. 影响程度
⚠️ **这些错误通常不影响应用正常运行**
- 只是缓存功能受限
- 不影响核心功能
- 可能轻微影响性能

## 解决方案

### 方案1：清理缓存（推荐）

#### 手动清理
```bash
# 关闭所有Electron应用
# 删除缓存目录
rm -rf "C:/Users/Administrator/AppData/Local/electron/Cache"
rm -rf "C:/Users/Administrator/AppData/Local/electron/GPUCache"
```

#### 自动清理脚本
在应用启动前添加清理代码：

```typescript
// src/main/index.ts
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// 清理缓存
const cleanCache = () => {
  try {
    const cachePath = path.join(app.getPath('userData'), 'Cache')
    const gpuCachePath = path.join(app.getPath('userData'), 'GPUCache')
    
    if (fs.existsSync(cachePath)) {
      fs.rmSync(cachePath, { recursive: true, force: true })
    }
    if (fs.existsSync(gpuCachePath)) {
      fs.rmSync(gpuCachePath, { recursive: true, force: true })
    }
  } catch (error) {
    console.log('Cache cleanup failed:', error)
  }
}

// 在app ready之前调用
cleanCache()
```

### 方案2：禁用GPU缓存

在启动应用时添加参数：

```typescript
// src/main/index.ts
import { app } from 'electron'

// 禁用GPU缓存
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')
```

### 方案3：修改缓存路径

```typescript
// src/main/index.ts
import { app } from 'electron'
import path from 'path'

// 设置缓存路径到临时目录
app.setPath('userData', path.join(app.getPath('temp'), 'utiltool-cache'))
```

### 方案4：以管理员权限运行

右键点击应用 -> 以管理员身份运行

## 快速修复（推荐）

### 步骤1：关闭应用
```bash
# 关闭所有Electron进程
taskkill /F /IM electron.exe
```

### 步骤2：清理缓存
```bash
# 删除缓存目录
rm -rf "C:/Users/Administrator/AppData/Local/electron/Cache"
rm -rf "C:/Users/Administrator/AppData/Local/electron/GPUCache"
```

### 步骤3：重新启动
```bash
npm run start
```

## 预防措施

### 1. 添加启动参数
在主进程代码中添加：

```typescript
// src/main/index.ts
app.commandLine.appendSwitch('disable-http-cache')
```

### 2. 定期清理
创建定期清理任务：

```typescript
// 每小时清理一次缓存
setInterval(() => {
  cleanCache()
}, 3600000)
```

### 3. 使用环境变量
```bash
# 设置环境变量
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_LOG_FILE=electron.log
```

## 验证修复

### 检查缓存目录
```bash
ls "C:/Users/Administrator/AppData/Local/electron/"
```

### 检查应用运行
- 应用是否正常启动
- 功能是否正常工作
- 是否还有错误信息

## 注意事项

1. **不影响功能**：这些错误通常不影响应用的核心功能
2. **性能影响**：可能轻微影响启动速度和渲染性能
3. **权限问题**：Windows权限管理可能导致缓存创建失败
4. **多次运行**：同时运行多个Electron实例可能导致冲突

## 最佳实践

1. **开发环境**：可以忽略这些错误
2. **生产环境**：建议添加缓存清理机制
3. **打包应用**：在打包配置中设置正确的缓存路径
4. **用户反馈**：如果用户报告问题，再进行修复

## 总结

这些缓存错误是Electron在Windows上的常见问题，通常不影响应用运行。如果需要修复，建议：
1. 清理缓存目录
2. 添加启动参数
3. 以管理员权限运行（如果需要）

对于开发环境，可以暂时忽略这些错误，专注于功能开发。
