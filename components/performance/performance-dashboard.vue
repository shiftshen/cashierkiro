<template>
  <view class="performance-dashboard" v-if="showDashboard">
    <view class="dashboard-header">
      <text class="dashboard-title">性能监控</text>
      <text class="dashboard-close" @click="closeDashboard">×</text>
    </view>
    <view class="dashboard-content">
      <view class="metric-section">
        <text class="section-title">内存使用</text>
        <view class="metric-item">
          <text>已用内存: {{ formatBytes(memoryUsage.used) }}</text>
        </view>
        <view class="metric-item">
          <text>总内存: {{ formatBytes(memoryUsage.total) }}</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: memoryUsage.percentage + '%' }"></view>
        </view>
      </view>
      
      <view class="metric-section">
        <text class="section-title">页面性能</text>
        <view class="metric-item">
          <text>页面加载时间: {{ pageLoadTime }}ms</text>
        </view>
        <view class="metric-item">
          <text>DOM节点数: {{ domNodeCount }}</text>
        </view>
        <view class="metric-item">
          <text>FPS: {{ currentFPS }}</text>
        </view>
      </view>
      
      <view class="metric-section">
        <text class="section-title">网络请求</text>
        <view class="metric-item">
          <text>总请求数: {{ networkStats.totalRequests }}</text>
        </view>
        <view class="metric-item">
          <text>成功请求: {{ networkStats.successRequests }}</text>
        </view>
        <view class="metric-item">
          <text>失败请求: {{ networkStats.failedRequests }}</text>
        </view>
        <view class="metric-item">
          <text>平均响应时间: {{ networkStats.avgResponseTime }}ms</text>
        </view>
      </view>
      
      <view class="metric-section">
        <text class="section-title">错误日志</text>
        <view class="error-list">
          <view class="error-item" v-for="(error, index) in recentErrors" :key="index">
            <text class="error-time">{{ formatTime(error.timestamp) }}</text>
            <text class="error-message">{{ error.message }}</text>
          </view>
        </view>
      </view>
      
      <view class="dashboard-actions">
        <button class="action-btn" @click="refreshMetrics">刷新数据</button>
        <button class="action-btn" @click="clearErrors">清除错误</button>
        <button class="action-btn" @click="exportReport">导出报告</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PerformanceDashboard',
  data() {
    return {
      showDashboard: false,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0
      },
      pageLoadTime: 0,
      domNodeCount: 0,
      currentFPS: 0,
      networkStats: {
        totalRequests: 0,
        successRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0
      },
      recentErrors: [],
      updateTimer: null,
      fpsCounter: {
        frames: 0,
        lastTime: 0
      }
    };
  },
  
  mounted() {
    this.initPerformanceMonitoring();
  },
  
  beforeDestroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  },
  
  methods: {
    // 初始化性能监控
    initPerformanceMonitoring() {
      this.startFPSMonitoring();
      this.startMemoryMonitoring();
      this.monitorNetworkRequests();
      this.captureErrors();
      
      // 定期更新数据
      this.updateTimer = setInterval(() => {
        this.updateMetrics();
      }, 1000);
    },
    
    // 开始FPS监控
    startFPSMonitoring() {
      const measureFPS = () => {
        this.fpsCounter.frames++;
        const now = performance.now();
        
        if (now - this.fpsCounter.lastTime >= 1000) {
          this.currentFPS = Math.round(this.fpsCounter.frames * 1000 / (now - this.fpsCounter.lastTime));
          this.fpsCounter.frames = 0;
          this.fpsCounter.lastTime = now;
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      // #ifdef H5
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(measureFPS);
      }
      // #endif
    },
    
    // 开始内存监控
    startMemoryMonitoring() {
      // #ifdef H5
      if (performance.memory) {
        setInterval(() => {
          this.memoryUsage.used = performance.memory.usedJSHeapSize;
          this.memoryUsage.total = performance.memory.totalJSHeapSize;
          this.memoryUsage.percentage = (this.memoryUsage.used / this.memoryUsage.total) * 100;
        }, 2000);
      }
      // #endif
    },
    
    // 监控网络请求
    monitorNetworkRequests() {
      // 拦截uni.request
      const originalRequest = uni.request;
      const self = this;
      
      uni.request = function(options) {
        const startTime = Date.now();
        self.networkStats.totalRequests++;
        
        const originalSuccess = options.success;
        const originalFail = options.fail;
        
        options.success = function(res) {
          const responseTime = Date.now() - startTime;
          self.networkStats.successRequests++;
          self.updateAvgResponseTime(responseTime);
          
          if (originalSuccess) {
            originalSuccess(res);
          }
        };
        
        options.fail = function(err) {
          self.networkStats.failedRequests++;
          self.addError('Network request failed: ' + (err.errMsg || 'Unknown error'));
          
          if (originalFail) {
            originalFail(err);
          }
        };
        
        return originalRequest.call(this, options);
      };
    },
    
    // 捕获错误
    captureErrors() {
      // 捕获全局错误
      const originalError = console.error;
      const self = this;
      
      console.error = function(...args) {
        self.addError(args.join(' '));
        originalError.apply(console, args);
      };
      
      // Vue错误处理
      if (this.$root) {
        this.$root.$on('error', (error) => {
          this.addError(error.message || error.toString());
        });
      }
    },
    
    // 更新平均响应时间
    updateAvgResponseTime(responseTime) {
      const total = this.networkStats.avgResponseTime * (this.networkStats.successRequests - 1) + responseTime;
      this.networkStats.avgResponseTime = Math.round(total / this.networkStats.successRequests);
    },
    
    // 添加错误
    addError(message) {
      this.recentErrors.unshift({
        message: message,
        timestamp: Date.now()
      });
      
      // 只保留最近10个错误
      if (this.recentErrors.length > 10) {
        this.recentErrors = this.recentErrors.slice(0, 10);
      }
    },
    
    // 更新指标
    updateMetrics() {
      // 更新DOM节点数
      // #ifdef H5
      if (typeof document !== 'undefined') {
        this.domNodeCount = document.getElementsByTagName('*').length;
      }
      // #endif
      
      // 更新页面加载时间
      // #ifdef H5
      if (performance.timing) {
        this.pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      }
      // #endif
    },
    
    // 格式化字节数
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    },
    
    // 刷新指标
    refreshMetrics() {
      this.updateMetrics();
      uni.showToast({
        title: '数据已刷新',
        icon: 'success'
      });
    },
    
    // 清除错误
    clearErrors() {
      this.recentErrors = [];
      uni.showToast({
        title: '错误日志已清除',
        icon: 'success'
      });
    },
    
    // 导出报告
    exportReport() {
      const report = {
        timestamp: new Date().toISOString(),
        memoryUsage: this.memoryUsage,
        pageLoadTime: this.pageLoadTime,
        domNodeCount: this.domNodeCount,
        currentFPS: this.currentFPS,
        networkStats: this.networkStats,
        recentErrors: this.recentErrors
      };
      
      console.log('Performance Report:', JSON.stringify(report, null, 2));
      
      uni.showToast({
        title: '报告已导出到控制台',
        icon: 'success'
      });
    },
    
    // 关闭面板
    closeDashboard() {
      this.showDashboard = false;
    },
    
    // 显示面板
    show() {
      this.showDashboard = true;
      this.updateMetrics();
    }
  }
};
</script>

<style lang="scss" scoped>
.performance-dashboard {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 320px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  z-index: 9998;
  color: #fff;
  font-size: 12px;
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.dashboard-title {
  font-weight: bold;
  font-size: 14px;
}

.dashboard-close {
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
}

.dashboard-content {
  padding: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.metric-section {
  margin-bottom: 15px;
}

.section-title {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #2196F3;
  font-size: 13px;
}

.metric-item {
  margin-bottom: 3px;
  padding: 2px 0;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-top: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.error-list {
  max-height: 100px;
  overflow-y: auto;
}

.error-item {
  margin-bottom: 5px;
  padding: 3px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 3px;
}

.error-time {
  display: block;
  font-size: 10px;
  color: #ccc;
}

.error-message {
  display: block;
  font-size: 11px;
  word-break: break-all;
}

.dashboard-actions {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.action-btn {
  padding: 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.action-btn:active {
  background: #1976D2;
}
</style>