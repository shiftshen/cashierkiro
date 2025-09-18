# Design Document

## Overview

The App Performance Optimization design addresses the fundamental performance gap between mobile app WebView containers and native browsers. The solution implements a multi-layered optimization approach targeting WebView configuration, build processes, resource management, and runtime performance. The design prioritizes immediate wins (10-minute fixes) while establishing a foundation for long-term performance improvements.

## Architecture

### Performance Optimization Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    App Shell Layer                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Android       │ │      iOS        │ │   Web/H5        ││
│  │  WebView Config │ │ WKWebView Config│ │ Browser Optimiz ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Build Optimization Layer                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Vite Production │ │ Code Splitting  │ │ Resource Optim  ││
│  │ Build Config    │ │ & Lazy Loading  │ │ & Compression   ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Runtime Optimization Layer                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Offline Manager │ │ Performance     │ │ Memory & Cache  ││
│  │ & Local Cache   │ │ Monitoring      │ │ Management      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Vue 2 + uView   │ │ Vuex State      │ │ API & WebSocket ││
│  │ Optimized UI    │ │ Management      │ │ Optimization    ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. WebView Configuration Manager

#### Android Configuration (manifest.json)
```javascript
{
  "app-plus": {
    "distribute": {
      "android": {
        "hardwareAccelerated": true,        // 启用硬件加速
        "largeHeap": true,                  // 启用大内存堆
        "resizeableActivity": false,        // 禁用窗口调整
        "minSdkVersion": 23,               // 最低API 23 (Android 6.0)
        "targetSdkVersion": 33,            // 目标API 33
        "abiFilters": ["armeabi-v7a", "arm64-v8a"],
        "permissions": [
          "CAMERA", "ACCESS_NETWORK_STATE", 
          "ACCESS_WIFI_STATE", "VIBRATE", "WAKE_LOCK"
        ]
      }
    },
    "optimization": {
      "subPackages": true                   // 启用分包
    },
    "runmode": "liberate"                   // 释放模式
  }
}
```

#### iOS Configuration (manifest.json)
```javascript
{
  "app-plus": {
    "distribute": {
      "ios": {
        "deploymentTarget": "11.0",         // 最低iOS 11
        "privacyDescription": {
          "NSCameraUsageDescription": "扫码支付需要使用相机"
        },
        "capabilities": {
          "entitlements": {
            "com.apple.developer.networking.wifi-info": true
          }
        }
      }
    }
  }
}
```

### 2. Build Optimization Configuration

#### Vite Production Configuration
```javascript
// vite.config.js
export default {
  build: {
    target: 'es2020',                       // 现代JS目标
    minify: 'esbuild',                      // 快速压缩
    sourcemap: false,                       // 生产环境禁用sourcemap
    cssCodeSplit: true,                     // CSS代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vuex', 'vue-i18n'],
          ui: ['uview-ui'],
          utils: ['dayjs', 'lodash-es'],
          charts: ['echarts']               // 按需加载图表库
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000             // 提高chunk大小警告阈值
  },
  
  // 资源优化插件
  plugins: [
    // 图片优化
    viteImageOptimize({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.8] },
      webp: { quality: 75 }
    }),
    
    // PWA缓存
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.vdamo\.com\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24小时
              }
            }
          }
        ]
      }
    })
  ]
}
```

### 3. Smart Polling & Offline Manager

#### Table Status Manager
```javascript
// common/table-manager.js
class TableManager {
  constructor() {
    this.tables = new Map()
    this.pollingInterval = 10000           // 默认10秒轮询
    this.isPageActive = true
    this.lastUpdateTime = 0
    this.maxRetries = 3
    this.retryCount = 0
  }

  // 智能轮询策略
  startSmartPolling() {
    // 页面可见性API
    document.addEventListener('visibilitychange', () => {
      this.isPageActive = !document.hidden
      this.adjustPollingFrequency()
    })

    // 网络状态监听
    window.addEventListener('online', () => this.handleNetworkChange(true))
    window.addEventListener('offline', () => this.handleNetworkChange(false))

    this.poll()
  }

  adjustPollingFrequency() {
    if (this.isPageActive) {
      this.pollingInterval = 10000         // 活跃时10秒
    } else {
      this.pollingInterval = 30000         // 后台时30秒
    }
  }

  async poll() {
    try {
      if (navigator.onLine) {
        const response = await this.fetchTableStatus()
        this.updateLocalTables(response.data)
        this.retryCount = 0
      }
    } catch (error) {
      this.handlePollingError(error)
    }

    setTimeout(() => this.poll(), this.pollingInterval)
  }

  // 增量更新策略
  updateLocalTables(newTables) {
    const changes = []
    newTables.forEach(table => {
      const existing = this.tables.get(table.id)
      if (!existing || this.hasTableChanged(existing, table)) {
        this.tables.set(table.id, table)
        changes.push(table)
      }
    })

    if (changes.length > 0) {
      this.notifyComponents(changes)
      console.log(`Updated ${changes.length} table(s)`)
    }
  }

  hasTableChanged(oldTable, newTable) {
    return oldTable.status !== newTable.status ||
           oldTable.customerCount !== newTable.customerCount ||
           oldTable.orderAmount !== newTable.orderAmount
  }
}
```

#### Weight Calculation Manager
```javascript
// common/weight-manager.js
class WeightManager {
  constructor() {
    this.syncQueue = []
    this.isOnline = navigator.onLine
    this.productCache = new Map()
  }

  // 本地称重计算
  processWeight(rawWeight, productId) {
    const product = this.getProductFromCache(productId)
    if (!product) {
      throw new Error('Product not found in cache')
    }

    const weight = parseFloat(rawWeight) || 0
    const result = {
      weight: weight,
      unitPrice: product.price,
      totalPrice: (weight * product.price).toFixed(2),
      productId: productId,
      productName: product.name,
      timestamp: Date.now(),
      offline: !this.isOnline
    }

    // 立即更新UI
    this.updateWeightDisplay(result)

    // 异步同步到服务器
    if (this.isOnline) {
      this.syncToServer(result)
    } else {
      this.addToSyncQueue(result)
    }

    return result
  }

  // 批量同步队列
  async syncWeightQueue() {
    if (this.syncQueue.length === 0) return

    try {
      const response = await uni.request({
        url: '/channel/weight/batch',
        method: 'POST',
        data: { weights: this.syncQueue }
      })

      if (response.statusCode === 200) {
        this.syncQueue = []
        console.log('Weight queue synced successfully')
      }
    } catch (error) {
      console.error('Failed to sync weight queue:', error)
    }
  }
}
```

### 4. Resource Optimization System

#### Image Optimization Pipeline
```javascript
// build/image-optimizer.js
class ImageOptimizer {
  constructor() {
    this.supportedFormats = ['webp', 'avif', 'jpg', 'png']
    this.qualitySettings = {
      webp: 75,
      avif: 65,
      jpg: 80,
      png: 85
    }
  }

  async optimizeImages() {
    const imageFiles = await this.findImages('static/imgs')
    
    for (const file of imageFiles) {
      await this.processImage(file)
    }
  }

  async processImage(filePath) {
    const originalSize = fs.statSync(filePath).size
    
    // 转换为WebP
    const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    await sharp(filePath)
      .webp({ quality: this.qualitySettings.webp })
      .toFile(webpPath)

    const newSize = fs.statSync(webpPath).size
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1)
    
    console.log(`Optimized ${filePath}: ${savings}% size reduction`)
  }
}
```

#### Font Subsetting
```javascript
// build/font-optimizer.js
class FontOptimizer {
  async subsetFonts() {
    const fontFiles = await this.findFonts('static/fonts')
    const usedChars = await this.extractUsedCharacters()
    
    for (const fontFile of fontFiles) {
      await this.createSubset(fontFile, usedChars)
    }
  }

  async extractUsedCharacters() {
    // 扫描所有Vue文件和语言包，提取使用的字符
    const vueFiles = await glob('**/*.vue')
    const langFiles = await glob('lang/*.js')
    
    const chars = new Set()
    // ... 字符提取逻辑
    return Array.from(chars).join('')
  }
}
```

### 5. Virtual Scrolling Implementation

#### Large List Optimization
```vue
<!-- components/virtual-list.vue -->
<template>
  <div class="virtual-list" @scroll="handleScroll" ref="container">
    <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-list-content" :style="{ transform: `translateY(${offset}px)` }">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="virtual-list-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" :index="item.index"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: Array,
    itemHeight: { type: Number, default: 60 },
    visibleCount: { type: Number, default: 10 }
  },
  
  data() {
    return {
      scrollTop: 0,
      containerHeight: 0
    }
  },
  
  computed: {
    totalHeight() {
      return this.items.length * this.itemHeight
    },
    
    startIndex() {
      return Math.floor(this.scrollTop / this.itemHeight)
    },
    
    endIndex() {
      return Math.min(
        this.startIndex + this.visibleCount + 2,
        this.items.length
      )
    },
    
    visibleItems() {
      return this.items.slice(this.startIndex, this.endIndex).map((item, index) => ({
        ...item,
        index: this.startIndex + index
      }))
    },
    
    offset() {
      return this.startIndex * this.itemHeight
    }
  },
  
  methods: {
    handleScroll() {
      this.scrollTop = this.$refs.container.scrollTop
    }
  }
}
</script>
```

### 6. Performance Monitoring System

#### Performance Metrics Collector
```javascript
// common/performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      apiResponseTimes: [],
      errorCount: 0
    }
  }

  // 监控页面加载性能
  measurePageLoad() {
    if (performance.timing) {
      const timing = performance.timing
      this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart
      this.metrics.renderTime = timing.domContentLoadedEventEnd - timing.navigationStart
    }
  }

  // 监控内存使用
  measureMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
  }

  // 监控API响应时间
  measureApiResponse(url, startTime, endTime) {
    const responseTime = endTime - startTime
    this.metrics.apiResponseTimes.push({
      url,
      responseTime,
      timestamp: Date.now()
    })

    // 保持最近100条记录
    if (this.metrics.apiResponseTimes.length > 100) {
      this.metrics.apiResponseTimes.shift()
    }
  }

  // 生成性能报告
  generateReport() {
    const avgApiTime = this.metrics.apiResponseTimes.reduce((sum, item) => 
      sum + item.responseTime, 0) / this.metrics.apiResponseTimes.length

    return {
      loadTime: this.metrics.loadTime,
      renderTime: this.metrics.renderTime,
      memoryUsage: this.metrics.memoryUsage,
      avgApiResponseTime: avgApiTime || 0,
      errorCount: this.metrics.errorCount,
      timestamp: Date.now()
    }
  }
}
```

## Data Models

### Performance Configuration Model
```javascript
{
  webview: {
    android: {
      hardwareAccelerated: boolean,
      largeHeap: boolean,
      minSdkVersion: number,
      targetSdkVersion: number
    },
    ios: {
      deploymentTarget: string,
      wkWebViewConfig: object
    }
  },
  
  build: {
    target: string,
    minify: string,
    sourcemap: boolean,
    chunkSizeLimit: number
  },
  
  polling: {
    activeInterval: number,
    inactiveInterval: number,
    maxRetries: number
  },
  
  cache: {
    maxAge: number,
    maxEntries: number,
    strategies: array
  }
}
```

### Performance Metrics Model
```javascript
{
  timestamp: number,
  loadTime: number,
  renderTime: number,
  memoryUsage: {
    used: number,
    total: number,
    limit: number
  },
  apiMetrics: {
    averageResponseTime: number,
    errorRate: number,
    requestCount: number
  },
  userInteraction: {
    inputLatency: number,
    scrollPerformance: number,
    touchResponseTime: number
  }
}
```

## Error Handling

### 1. WebView Performance Issues
- Hardware acceleration fallback detection
- Memory pressure handling and cleanup
- JIT compilation failure recovery
- Native bridge communication optimization

### 2. Build Optimization Failures
- Asset compression error handling
- Code splitting fallback strategies
- Bundle size limit enforcement
- Source map generation error recovery

### 3. Runtime Performance Degradation
- Memory leak detection and prevention
- Main thread blocking detection
- Infinite loop prevention in polling
- Cache overflow protection

## Testing Strategy

### 1. Performance Benchmarking
- Load time measurement across different devices
- Memory usage profiling during extended use
- API response time monitoring
- User interaction latency testing

### 2. WebView Configuration Testing
- Hardware acceleration verification
- JIT compilation effectiveness testing
- Cache strategy validation
- Native plugin performance testing

### 3. Offline Functionality Testing
- Network interruption simulation
- Data synchronization validation
- Cache consistency verification
- Offline-to-online transition testing

### 4. Cross-Platform Performance Testing
- Android device compatibility (API 23-33)
- iOS device compatibility (iOS 11+)
- Different screen sizes and resolutions
- Various hardware specifications