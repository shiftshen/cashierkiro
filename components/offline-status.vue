<template>
  <view class="offline-status" v-if="!isOnline || syncStatus !== 'idle'">
    <view class="status-bar" :class="statusClass">
      <text class="status-icon">{{ statusIcon }}</text>
      <text class="status-text">{{ statusText }}</text>
      <text class="queue-count" v-if="queueCount > 0">({{ queueCount }})</text>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'
import offlineManager from '@/common/offline-manager.js'

export default {
  name: 'OfflineStatus',
  data() {
    return {
      queueCount: 0
    }
  },
  computed: {
    ...mapState(['isOnline', 'syncStatus']),
    
    statusClass() {
      if (!this.isOnline) return 'offline'
      if (this.syncStatus === 'syncing') return 'syncing'
      if (this.syncStatus === 'success') return 'success'
      return ''
    },
    
    statusIcon() {
      if (!this.isOnline) return '📡'
      if (this.syncStatus === 'syncing') return '🔄'
      if (this.syncStatus === 'success') return '✅'
      return ''
    },
    
    statusText() {
      if (!this.isOnline) return '离线模式 - 数据将在联网后同步'
      if (this.syncStatus === 'syncing') return '正在同步离线数据...'
      if (this.syncStatus === 'success') return '数据同步完成'
      return ''
    }
  },
  async mounted() {
    // 获取队列数量
    await this.updateQueueCount()
    
    // 监听队列变化
    uni.$on('queue-updated', this.updateQueueCount)
  },
  beforeDestroy() {
    uni.$off('queue-updated', this.updateQueueCount)
  },
  methods: {
    async updateQueueCount() {
      const status = await offlineManager.getQueueStatus()
      this.queueCount = status.count
    }
  }
}
</script>

<style scoped>
.offline-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.status-bar {
  padding: 8px 16px;
  text-align: center;
  font-size: 14px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: slideDown 0.3s ease-out;
}

.offline {
  background-color: #ff6b6b;
}

.syncing {
  background-color: #4ecdc4;
}

.success {
  background-color: #51cf66;
}

.status-icon {
  margin-right: 8px;
  animation: pulse 2s infinite;
}

.queue-count {
  margin-left: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>