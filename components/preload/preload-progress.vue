<template>
  <view v-if="showProgress" class="preload-progress">
    <view class="progress-container">
      <view class="progress-header">
        <text class="progress-title">🚀 正在预加载商品数据...</text>
        <text class="progress-percentage">{{ progress.percentage }}%</text>
      </view>
      
      <view class="progress-bar">
        <view 
          class="progress-fill" 
          :style="{ width: progress.percentage + '%' }"
        ></view>
      </view>
      
      <view class="progress-info">
        <text class="progress-current">{{ progress.current }}</text>
        <text class="progress-count">{{ progress.completed }}/{{ progress.total }}</text>
      </view>
      
      <view class="progress-benefits">
        <text class="benefit-item">⚡ 翻页速度提升90%</text>
        <text class="benefit-item">📱 离线浏览支持</text>
        <text class="benefit-item">🔍 本地搜索功能</text>
      </view>
    </view>
  </view>
</template>

<script>
import categoryPreloader from '@/common/category-preloader.js'

export default {
  name: 'PreloadProgress',
  data() {
    return {
      progress: {
        percentage: 0,
        completed: 0,
        total: 0,
        current: '',
        isPreloading: false
      },
      showProgress: false,
      updateTimer: null
    }
  },
  
  mounted() {
    this.startProgressMonitoring()
  },
  
  beforeDestroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }
  },
  
  methods: {
    startProgressMonitoring() {
      this.updateTimer = setInterval(() => {
        const currentProgress = categoryPreloader.getPreloadProgress()
        
        if (currentProgress.isPreloading && !this.showProgress) {
          this.showProgress = true
        }
        
        if (!currentProgress.isPreloading && this.showProgress && currentProgress.percentage >= 100) {
          // 预加载完成，延迟隐藏进度条
          setTimeout(() => {
            this.showProgress = false
          }, 2000)
        }
        
        this.progress = currentProgress
      }, 500)
    }
  }
}
</script>

<style lang="scss" scoped>
.preload-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.progress-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.progress-percentage {
  font-size: 18px;
  font-weight: bold;
  color: #4275F4;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4275F4, #42a5f5);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-current {
  font-size: 14px;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-count {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
}

.progress-benefits {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.benefit-item {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
</style>