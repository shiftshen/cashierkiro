<template>
  <view class="performance-dashboard">
    <!-- 性能总览 -->
    <view class="performance-summary">
      <view class="summary-card" :class="getScoreClass(performanceScore)">
        <view class="score-circle">
          <text class="score-text">{{ performanceScore }}</text>
          <text class="score-label">分</text>
        </view>
        <view class="grade-info">
          <text class="grade">{{ performanceGrade }}</text>
          <text class="grade-label">性能等级</text>
        </view>
      </view>
      
      <view class="metrics-grid">
        <view class="metric-item">
          <text class="metric-value">{{ pageLoadTime }}ms</text>
          <text class="metric-label">页面加载</text>
        </view>
        <view class="metric-item">
          <text class="metric-value">{{ apiResponseTime }}ms</text>
          <text class="metric-label">API响应</text>
        </view>
        <view class="metric-item">
          <text class="metric-value">{{ memoryUsage }}%</text>
          <text class="metric-label">内存使用</text>
        </view>
        <view class="metric-item">
          <text class="metric-value">{{ errorRate }}%</text>
          <text class="metric-label">错误率</text>
        </view>
      </view>
    </view>

    <!-- 实时监控 -->
    <view class="real-time-section">
      <view class="section-header">
        <text class="section-title">实时监控</text>
        <view class="status-indicator" :class="{ active: isMonitoring }">
          <text class="status-dot"></text>
          <text class="status-text">{{ isMonitoring ? '监控中' : '已停止' }}</text>
        </view>
      </view>
      
      <view class="real-time-metrics">
        <view class="real-time-item">
          <text class="rt-label">活跃请求</text>
          <text class="rt-value">{{ activeRequests }}</text>
        </view>
        <view class="real-time-item">
          <text class="rt-label">当前内存</text>
          <text class="rt-value">{{ formatBytes(currentMemory) }}</text>
        </view>
        <view class="real-time-item">
          <text class="rt-label">监控时长</text>
          <text class="rt-value">{{ monitoringDuration }}</text>
        </view>
      </view>
    </view>

    <!-- 性能图表 -->
    <view class="charts-section" v-if="showCharts">
      <view class="section-header">
        <text class="section-title">性能趋势</text>
        <view class="chart-controls">
          <text 
            class="chart-tab" 
            :class="{ active: activeChart === 'memory' }"
            @click="switchChart('memory')"
          >内存</text>
          <text 
            class="chart-tab" 
            :class="{ active: activeChart === 'api' }"
            @click="switchChart('api')"
          >API</text>
          <text 
            class="chart-tab" 
            :class="{ active: activeChart === 'business' }"
            @click="switchChart('business')"
          >业务</text>
        </view>
      </view>
      
      <view class="chart-container">
        <!-- 这里可以集成图表库，如echarts -->
        <view class="chart-placeholder">
          <text>{{ activeChart }} 性能图表</text>
          <text class="chart-desc">{{ getChartDescription(activeChart) }}</text>
        </view>
      </view>
    </view>

    <!-- 告警信息 -->
    <view class="alerts-section" v-if="alerts.length > 0">
      <view class="section-header">
        <text class="section-title">性能告警</text>
        <text class="alert-count">{{ alerts.length }}</text>
      </view>
      
      <view class="alerts-list">
        <view 
          class="alert-item" 
          :class="getAlertClass(alert.type)"
          v-for="(alert, index) in alerts" 
          :key="index"
        >
          <view class="alert-icon">⚠️</view>
          <view class="alert-content">
            <text class="alert-title">{{ getAlertTitle(alert.type) }}</text>
            <text class="alert-desc">{{ getAlertDescription(alert) }}</text>
            <text class="alert-time">{{ formatTime(alert.timestamp) }}</text>
          </view>
          <view class="alert-action" @click="dismissAlert(index)">
            <text>✕</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 优化建议 -->
    <view class="recommendations-section" v-if="recommendations.length > 0">
      <view class="section-header">
        <text class="section-title">优化建议</text>
      </view>
      
      <view class="recommendations-list">
        <view 
          class="recommendation-item"
          v-for="(recommendation, index) in recommendations" 
          :key="index"
        >
          <view class="rec-icon">💡</view>
          <text class="rec-text">{{ recommendation }}</text>
        </view>
      </view>
    </view>

    <!-- 控制按钮 -->
    <view class="controls-section">
      <button 
        class="control-btn" 
        :class="{ primary: !isMonitoring }"
        @click="toggleMonitoring"
      >
        {{ isMonitoring ? '停止监控' : '开始监控' }}
      </button>
      
      <button class="control-btn" @click="generateReport">
        生成报告
      </button>
      
      <button class="control-btn" @click="clearData">
        清空数据
      </button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PerformanceDashboard',
  
  data() {
    return {
      // 性能指标
      performanceScore: 85,
      performanceGrade: 'B',
      pageLoadTime: 2340,
      apiResponseTime: 856,
      memoryUsage: 45,
      errorRate: 2.1,
      
      // 实时数据
      isMonitoring: true,
      activeRequests: 3,
      currentMemory: 67108864, // 64MB
      monitoringStartTime: Date.now(),
      
      // 图表控制
      showCharts: true,
      activeChart: 'memory',
      
      // 告警数据
      alerts: [
        {
          type: 'slow_api',
          data: { url: '/channel/table/list', duration: 3200 },
          timestamp: Date.now() - 120000
        },
        {
          type: 'memory_leak',
          data: { growth: 15728640, current: 67108864 },
          timestamp: Date.now() - 300000
        }
      ],
      
      // 优化建议
      recommendations: [
        '优化餐桌列表加载：使用虚拟滚动减少DOM节点',
        '减少API请求频率：将轮询间隔从3秒调整为10秒',
        '启用资源缓存：配置PWA缓存策略提升加载速度'
      ],
      
      // 性能监控器实例
      performanceMonitor: null
    }
  },
  
  computed: {
    monitoringDuration() {
      const duration = Date.now() - this.monitoringStartTime
      const minutes = Math.floor(duration / 60000)
      const seconds = Math.floor((duration % 60000) / 1000)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  },
  
  async mounted() {
    await this.initPerformanceMonitor()
    this.startRealTimeUpdate()
    this.setupEventListeners()
  },
  
  methods: {
    // 初始化性能监控器
    async initPerformanceMonitor() {
      try {
        const module = await import('@/common/performance-monitor.js')
        this.performanceMonitor = module.default
        
        // 获取初始数据
        this.updateMetrics()
      } catch (error) {
        console.error('性能监控器初始化失败:', error)
      }
    },
    
    // 更新性能指标
    updateMetrics() {
      if (!this.performanceMonitor) return
      
      const report = this.performanceMonitor.generateReport()
      
      this.performanceScore = report.summary.overallScore
      this.performanceGrade = report.summary.performanceGrade
      this.pageLoadTime = Math.round(report.details.pageLoad.loadTime || 0)
      this.apiResponseTime = Math.round(report.details.api.averageResponseTime || 0)
      
      const memStats = report.details.memory
      this.memoryUsage = Math.round(memStats.usageRate || 0)
      this.currentMemory = memStats.current || 0
      
      this.errorRate = parseFloat((report.details.api.errorRate || 0).toFixed(1))
      this.recommendations = report.recommendations || []
    },
    
    // 开始实时更新
    startRealTimeUpdate() {
      setInterval(() => {
        this.updateRealTimeData()
      }, 2000) // 每2秒更新一次
    },
    
    // 更新实时数据
    updateRealTimeData() {
      if (!this.performanceMonitor) return
      
      const realTimeMetrics = this.performanceMonitor.getRealTimeMetrics()
      this.isMonitoring = realTimeMetrics.isMonitoring
      this.activeRequests = realTimeMetrics.activeRequests
      this.currentMemory = realTimeMetrics.currentMemory
    },
    
    // 设置事件监听
    setupEventListeners() {
      // 监听性能告警
      uni.$on('performance-alert', (alertData) => {
        this.alerts.unshift(alertData)
        
        // 限制告警数量
        if (this.alerts.length > 10) {
          this.alerts = this.alerts.slice(0, 10)
        }
      })
    },
    
    // 获取评分样式类
    getScoreClass(score) {
      if (score >= 90) return 'score-excellent'
      if (score >= 80) return 'score-good'
      if (score >= 70) return 'score-fair'
      return 'score-poor'
    },
    
    // 切换图表
    switchChart(chartType) {
      this.activeChart = chartType
    },
    
    // 获取图表描述
    getChartDescription(chartType) {
      const descriptions = {
        memory: '内存使用趋势和峰值监控',
        api: 'API响应时间和错误率统计',
        business: '业务指标性能分析'
      }
      return descriptions[chartType] || ''
    },
    
    // 获取告警样式类
    getAlertClass(type) {
      const classes = {
        slow_api: 'alert-warning',
        memory_leak: 'alert-danger',
        long_task: 'alert-warning',
        connection_timeout: 'alert-danger'
      }
      return classes[type] || 'alert-info'
    },
    
    // 获取告警标题
    getAlertTitle(type) {
      const titles = {
        slow_api: 'API响应缓慢',
        memory_leak: '内存泄漏',
        long_task: '长任务阻塞',
        connection_timeout: '连接超时'
      }
      return titles[type] || '性能告警'
    },
    
    // 获取告警描述
    getAlertDescription(alert) {
      switch (alert.type) {
        case 'slow_api':
          return `${alert.data.url} 响应时间 ${alert.data.duration}ms`
        case 'memory_leak':
          return `内存增长 ${this.formatBytes(alert.data.growth)}`
        case 'long_task':
          return `任务执行时间 ${alert.data.duration}ms`
        default:
          return '检测到性能问题'
      }
    },
    
    // 格式化时间
    formatTime(timestamp) {
      const now = Date.now()
      const diff = now - timestamp
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      return `${Math.floor(diff / 86400000)}天前`
    },
    
    // 格式化字节
    formatBytes(bytes) {
      if (bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    // 切换监控状态
    toggleMonitoring() {
      if (!this.performanceMonitor) return
      
      if (this.isMonitoring) {
        this.performanceMonitor.stop()
      } else {
        // 重新初始化监控
        this.initPerformanceMonitor()
      }
    },
    
    // 生成报告
    generateReport() {
      if (!this.performanceMonitor) return
      
      const report = this.performanceMonitor.generateReport()
      
      // 可以下载报告或发送到服务器
      console.log('📊 性能报告已生成:', report)
      
      uni.showToast({
        title: '报告已生成',
        icon: 'success'
      })
    },
    
    // 清空数据
    clearData() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有性能数据吗？',
        success: (res) => {
          if (res.confirm) {
            this.alerts = []
            this.recommendations = []
            
            uni.showToast({
              title: '数据已清空',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 关闭告警
    dismissAlert(index) {
      this.alerts.splice(index, 1)
    }
  },
  
  beforeDestroy() {
    // 清理事件监听
    uni.$off('performance-alert')
  }
}
</script>

<style lang="scss" scoped>
.performance-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.performance-summary {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-card {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  &.score-excellent { border-left: 4px solid #52c41a; }
  &.score-good { border-left: 4px solid #1890ff; }
  &.score-fair { border-left: 4px solid #faad14; }
  &.score-poor { border-left: 4px solid #f5222d; }
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.score-text {
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.score-label {
  color: white;
  font-size: 12px;
}

.grade-info {
  display: flex;
  flex-direction: column;
}

.grade {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.grade-label {
  font-size: 14px;
  color: #666;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.metric-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.real-time-section,
.charts-section,
.alerts-section,
.recommendations-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.status-indicator {
  display: flex;
  align-items: center;
  
  &.active .status-dot {
    background: #52c41a;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d9d9d9;
  margin-right: 8px;
}

.status-text {
  font-size: 14px;
  color: #666;
}

.real-time-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.real-time-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.rt-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.rt-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.chart-controls {
  display: flex;
  gap: 10px;
}

.chart-tab {
  padding: 6px 12px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  
  &.active {
    background: #1890ff;
    color: white;
  }
}

.chart-container {
  height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #666;
}

.chart-desc {
  font-size: 12px;
  margin-top: 5px;
}

.alert-count {
  background: #f5222d;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #d9d9d9;
  
  &.alert-warning { border-left-color: #faad14; background: #fffbe6; }
  &.alert-danger { border-left-color: #f5222d; background: #fff2f0; }
  &.alert-info { border-left-color: #1890ff; background: #e6f7ff; }
}

.alert-icon {
  margin-right: 10px;
  font-size: 16px;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.alert-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 12px;
  color: #999;
}

.alert-action {
  padding: 4px 8px;
  cursor: pointer;
  color: #999;
  
  &:hover {
    color: #666;
  }
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f6ffed;
  border-radius: 8px;
  border-left: 4px solid #52c41a;
}

.rec-icon {
  margin-right: 10px;
  font-size: 16px;
}

.rec-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.controls-section {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.control-btn {
  padding: 12px 24px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  
  &.primary {
    background: #1890ff;
    color: white;
    border-color: #1890ff;
  }
  
  &:hover {
    opacity: 0.8;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .real-time-metrics {
    grid-template-columns: 1fr;
  }
  
  .controls-section {
    flex-direction: column;
  }
}
</style>