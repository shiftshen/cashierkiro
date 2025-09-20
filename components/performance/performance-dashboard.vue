<template>
  <view class="performance-dashboard" v-if="visible">
    <view class="dashboard-overlay" @click="closeDashboard"></view>
    <view class="dashboard-panel">
      <view class="dashboard-header">
        <text class="dashboard-title">性能监控面板</text>
        <button class="close-btn" @click="closeDashboard">✕</button>
      </view>
      
      <view class="dashboard-content">
        <!-- 性能指标 -->
        <view class="metrics-section">
          <view class="section-title">实时性能指标</view>
          <view class="metrics-grid">
            <view class="metric-item">
              <text class="metric-label">FPS</text>
              <text class="metric-value">{{ fps }}</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">内存使用</text>
              <text class="metric-value">{{ memoryUsage }} MB</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">CPU</text>
              <text class="metric-value">{{ cpuUsage }}%</text>
            </view>
            <view class="metric-item">
              <text class="metric-label">网络延迟</text>
              <text class="metric-value">{{ networkLatency }}ms</text>
            </view>
          </view>
        </view>
        
        <!-- 渲染性能 -->
        <view class="render-section">
          <view class="section-title">渲染性能</view>
          <view class="render-metrics">
            <view class="render-item">
              <text class="render-label">首次渲染</text>
              <text class="render-value">{{ firstPaint }}ms</text>
            </view>
            <view class="render-item">
              <text class="render-label">最大内容绘制</text>
              <text class="render-value">{{ largestContentfulPaint }}ms</text>
            </view>
            <view class="render-item">
              <text class="render-label">累积布局偏移</text>
              <text class="render-value">{{ cumulativeLayoutShift }}</text>
            </view>
          </view>
        </view>
        
        <!-- 资源加载 -->
        <view class="resources-section">
          <view class="section-title">资源加载</view>
          <view class="resources-list">
            <view 
              v-for="(resource, index) in resourceLoadTimes" 
              :key="index"
              class="resource-item"
            >
              <text class="resource-name">{{ resource.name }}</text>
              <text class="resource-time">{{ resource.time }}ms</text>
            </view>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="actions-section">
          <button class="action-btn" @click="forceGC">强制垃圾回收</button>
          <button class="action-btn" @click="clearCache">清除缓存</button>
          <button class="action-btn" @click="refreshMetrics">刷新数据</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PerformanceDashboard',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 性能指标
      fps: 60,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      
      // 渲染性能
      firstPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      
      // 资源加载时间
      resourceLoadTimes: [
        { name: 'app.js', time: 120 },
        { name: 'vendor.js', time: 350 },
        { name: 'main.css', time: 80 },
        { name: 'images', time: 220 }
      ],
      
      // 监控定时器
      monitorTimer: null
    }
  },
  mounted() {
    this.startMonitoring()
  },
  beforeDestroy() {
    this.stopMonitoring()
  },
  methods: {
    closeDashboard() {
      this.$emit('close')
    },
    
    startMonitoring() {
      // 模拟性能数据更新
      this.monitorTimer = setInterval(() => {
        this.updateMetrics()
      }, 1000)
    },
    
    stopMonitoring() {
      if (this.monitorTimer) {
        clearInterval(this.monitorTimer)
        this.monitorTimer = null
      }
    },
    
    updateMetrics() {
      // 模拟更新性能指标
      this.fps = Math.max(30, 60 - Math.random() * 10)
      this.memoryUsage = Math.round(50 + Math.random() * 100)
      this.cpuUsage = Math.round(Math.random() * 30)
      this.networkLatency = Math.round(50 + Math.random() * 150)
      
      // 模拟渲染指标
      this.firstPaint = Math.round(100 + Math.random() * 200)
      this.largestContentfulPaint = Math.round(500 + Math.random() * 500)
      this.cumulativeLayoutShift = (Math.random() * 0.1).toFixed(3)
    },
    
    forceGC() {
      // 模拟强制垃圾回收
      uni.showToast({
        title: '正在执行垃圾回收...',
        icon: 'none'
      })
      
      // 模拟GC过程
      setTimeout(() => {
        this.memoryUsage = Math.max(10, this.memoryUsage - 20)
        uni.showToast({
          title: '垃圾回收完成',
          icon: 'success'
        })
      }, 1000)
    },
    
    clearCache() {
      // 模拟清除缓存
      try {
        // 清除本地存储
        uni.clearStorageSync()
        uni.showToast({
          title: '缓存已清除',
          icon: 'success'
        })
      } catch (error) {
        uni.showToast({
          title: '清除缓存失败',
          icon: 'none'
        })
      }
    },
    
    refreshMetrics() {
      this.updateMetrics()
      uni.showToast({
        title: '数据已刷新',
        icon: 'success'
      })
    }
  }
}
</script>

<style scoped>
.performance-dashboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
}

.dashboard-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.dashboard-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  background: #4275F4;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-title {
  font-size: 18px;
  font-weight: bold;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dashboard-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #4275F4;
  padding-bottom: 5px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.metric-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #4275F4;
}

.render-metrics {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.render-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.render-label {
  color: #666;
}

.render-value {
  font-weight: bold;
  color: #4275F4;
}

.resources-list {
  max-height: 150px;
  overflow-y: auto;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.resource-name {
  color: #666;
}

.resource-time {
  color: #4275F4;
  font-weight: bold;
}

.actions-section {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  background: #4275F4;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.action-btn:hover {
  background: #3564e0;
}

@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
    flex-direction: column;
  }
}
</style>