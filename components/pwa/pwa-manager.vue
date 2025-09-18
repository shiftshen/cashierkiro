<template>
  <view class="pwa-manager">
    <!-- PWA安装提示 -->
    <u-modal 
      :show="showInstallPrompt" 
      title="安装应用"
      :showCancelButton="true"
      confirmText="安装"
      cancelText="稍后"
      @confirm="installPWA"
      @cancel="dismissInstall"
    >
      <view class="install-content">
        <view class="install-icon">📱</view>
        <view class="install-text">
          <text>将DAMO收银台添加到主屏幕，获得更好的使用体验</text>
        </view>
        <view class="install-benefits">
          <view class="benefit-item">✓ 快速启动</view>
          <view class="benefit-item">✓ 离线使用</view>
          <view class="benefit-item">✓ 全屏体验</view>
        </view>
      </view>
    </u-modal>

    <!-- 更新提示 -->
    <u-modal
      :show="showUpdatePrompt"
      title="发现新版本"
      :showCancelButton="true"
      confirmText="立即更新"
      cancelText="稍后"
      @confirm="updateApp"
      @cancel="dismissUpdate"
    >
      <view class="update-content">
        <view class="update-icon">🔄</view>
        <view class="update-text">
          <text>应用有新版本可用，建议立即更新以获得最新功能和性能优化</text>
        </view>
      </view>
    </u-modal>

    <!-- 离线状态提示 -->
    <view v-if="isOffline" class="offline-banner">
      <text class="offline-icon">📵</text>
      <text class="offline-text">当前处于离线模式，部分功能可能受限</text>
    </view>

    <!-- 缓存状态（开发模式显示） -->
    <view v-if="showCacheStatus && isDev" class="cache-status">
      <view class="cache-header" @click="toggleCacheDetails">
        <text>缓存状态</text>
        <text class="cache-toggle">{{ showCacheDetails ? '▼' : '▶' }}</text>
      </view>
      <view v-if="showCacheDetails" class="cache-details">
        <view v-for="(cache, name) in cacheStatus" :key="name" class="cache-item">
          <text class="cache-name">{{ name }}</text>
          <text class="cache-info">{{ cache.count }}项 / {{ formatSize(cache.size) }}</text>
        </view>
        <view class="cache-actions">
          <button @click="refreshCache" class="cache-btn">刷新缓存</button>
          <button @click="clearCache" class="cache-btn danger">清空缓存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PWAManager',
  
  data() {
    return {
      showInstallPrompt: false,
      showUpdatePrompt: false,
      isOffline: false,
      showCacheStatus: false,
      showCacheDetails: false,
      cacheStatus: {},
      deferredPrompt: null,
      isDev: process.env.NODE_ENV === 'development'
    }
  },
  
  async mounted() {
    await this.initPWA()
    this.setupEventListeners()
    this.checkNetworkStatus()
    
    if (this.isDev) {
      this.showCacheStatus = true
      this.updateCacheStatus()
    }
  },
  
  methods: {
    // 初始化PWA
    async initPWA() {
      try {
        // 导入PWA缓存管理器
        const pwaCacheManager = await import('@/common/pwa-cache-manager.js')
        this.pwaCacheManager = pwaCacheManager.default
        
        console.log('✅ PWA管理器初始化完成')
      } catch (error) {
        console.error('PWA管理器初始化失败:', error)
      }
    },
    
    // 设置事件监听
    setupEventListeners() {
      // 监听安装提示事件
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        this.deferredPrompt = e
        
        // 延迟显示安装提示，避免打断用户操作
        setTimeout(() => {
          this.showInstallPrompt = true
        }, 30000) // 30秒后显示
      })
      
      // 监听应用安装事件
      window.addEventListener('appinstalled', () => {
        console.log('✅ PWA应用已安装')
        this.showInstallPrompt = false
        this.deferredPrompt = null
        
        uni.showToast({
          title: '应用安装成功',
          icon: 'success'
        })
      })
      
      // 监听更新事件
      uni.$on('app-update-available', () => {
        this.showUpdatePrompt = true
      })
      
      // 监听网络状态变化
      window.addEventListener('online', () => {
        this.isOffline = false
        console.log('📶 网络已连接')
      })
      
      window.addEventListener('offline', () => {
        this.isOffline = true
        console.log('📵 网络已断开')
      })
    },
    
    // 检查网络状态
    checkNetworkStatus() {
      this.isOffline = !navigator.onLine
    },
    
    // 安装PWA
    async installPWA() {
      if (!this.deferredPrompt) {
        uni.showToast({
          title: '安装功能不可用',
          icon: 'none'
        })
        return
      }
      
      try {
        this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          console.log('✅ 用户接受安装')
        } else {
          console.log('❌ 用户拒绝安装')
        }
        
        this.deferredPrompt = null
        this.showInstallPrompt = false
      } catch (error) {
        console.error('安装失败:', error)
        uni.showToast({
          title: '安装失败',
          icon: 'none'
        })
      }
    },
    
    // 取消安装
    dismissInstall() {
      this.showInstallPrompt = false
      
      // 24小时后再次提示
      setTimeout(() => {
        if (this.deferredPrompt) {
          this.showInstallPrompt = true
        }
      }, 24 * 60 * 60 * 1000)
    },
    
    // 更新应用
    async updateApp() {
      try {
        if (this.pwaCacheManager) {
          await this.pwaCacheManager.updateApp()
        } else {
          window.location.reload()
        }
      } catch (error) {
        console.error('更新失败:', error)
        uni.showToast({
          title: '更新失败',
          icon: 'none'
        })
      }
    },
    
    // 取消更新
    dismissUpdate() {
      this.showUpdatePrompt = false
    },
    
    // 切换缓存详情显示
    toggleCacheDetails() {
      this.showCacheDetails = !this.showCacheDetails
      if (this.showCacheDetails) {
        this.updateCacheStatus()
      }
    },
    
    // 更新缓存状态
    async updateCacheStatus() {
      if (this.pwaCacheManager) {
        try {
          this.cacheStatus = await this.pwaCacheManager.getCacheStatus()
        } catch (error) {
          console.error('获取缓存状态失败:', error)
        }
      }
    },
    
    // 刷新缓存
    async refreshCache() {
      if (this.pwaCacheManager) {
        try {
          await this.pwaCacheManager.cleanExpiredCache()
          await this.updateCacheStatus()
          
          uni.showToast({
            title: '缓存已刷新',
            icon: 'success'
          })
        } catch (error) {
          console.error('刷新缓存失败:', error)
          uni.showToast({
            title: '刷新失败',
            icon: 'none'
          })
        }
      }
    },
    
    // 清空缓存
    async clearCache() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有缓存吗？这将影响离线使用体验。',
        success: async (res) => {
          if (res.confirm && this.pwaCacheManager) {
            try {
              await this.pwaCacheManager.clearAllCache()
              await this.updateCacheStatus()
              
              uni.showToast({
                title: '缓存已清空',
                icon: 'success'
              })
            } catch (error) {
              console.error('清空缓存失败:', error)
              uni.showToast({
                title: '清空失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 格式化文件大小
    formatSize(bytes) {
      if (bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  },
  
  beforeDestroy() {
    // 清理事件监听
    uni.$off('app-update-available')
  }
}
</script>

<style lang="scss" scoped>
.pwa-manager {
  position: relative;
}

.install-content,
.update-content {
  text-align: center;
  padding: 20px;
}

.install-icon,
.update-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.install-text,
.update-text {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
}

.install-benefits {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benefit-item {
  font-size: 14px;
  color: #4275F4;
  text-align: left;
}

.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ff9800;
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-size: 14px;
}

.offline-icon {
  margin-right: 8px;
}

.cache-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  font-size: 12px;
  z-index: 1000;
}

.cache-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 8px;
}

.cache-toggle {
  font-size: 10px;
}

.cache-details {
  max-height: 200px;
  overflow-y: auto;
}

.cache-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cache-name {
  font-weight: bold;
  flex: 1;
  margin-right: 8px;
}

.cache-info {
  color: #ccc;
  font-size: 10px;
}

.cache-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.cache-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #4275F4;
  color: white;
  font-size: 10px;
  cursor: pointer;
  
  &.danger {
    background: #f44336;
  }
  
  &:hover {
    opacity: 0.8;
  }
}
</style>