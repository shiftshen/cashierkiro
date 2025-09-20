<template>
  <view class="role-debug" v-if="showDebug">
    <view class="debug-header">
      <text class="debug-title">角色调试面板</text>
      <text class="debug-close" @click="closeDebug">×</text>
    </view>
    <view class="debug-content">
      <view class="debug-section">
        <text class="section-title">当前用户信息</text>
        <view class="info-item">
          <text>用户ID: {{ userInfo.id || 'N/A' }}</text>
        </view>
        <view class="info-item">
          <text>用户名: {{ userInfo.username || 'N/A' }}</text>
        </view>
        <view class="info-item">
          <text>角色: {{ userInfo.role || 'N/A' }}</text>
        </view>
        <view class="info-item">
          <text>权限: {{ userInfo.permissions ? userInfo.permissions.join(', ') : 'N/A' }}</text>
        </view>
      </view>
      
      <view class="debug-section">
        <text class="section-title">店铺信息</text>
        <view class="info-item">
          <text>店铺ID: {{ storeInfo.id || 'N/A' }}</text>
        </view>
        <view class="info-item">
          <text>店铺名称: {{ storeInfo.name || 'N/A' }}</text>
        </view>
        <view class="info-item">
          <text>UNIACID: {{ storeInfo.uniacid || 'N/A' }}</text>
        </view>
      </view>
      
      <view class="debug-section">
        <text class="section-title">系统状态</text>
        <view class="info-item">
          <text>登录状态: {{ isLoggedIn ? '已登录' : '未登录' }}</text>
        </view>
        <view class="info-item">
          <text>网络状态: {{ networkStatus }}</text>
        </view>
        <view class="info-item">
          <text>设备类型: {{ deviceType }}</text>
        </view>
      </view>
      
      <view class="debug-actions">
        <button class="debug-btn" @click="refreshUserInfo">刷新用户信息</button>
        <button class="debug-btn" @click="clearCache">清除缓存</button>
        <button class="debug-btn" @click="exportLogs">导出日志</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'RoleDebug',
  data() {
    return {
      showDebug: false,
      userInfo: {},
      storeInfo: {},
      isLoggedIn: false,
      networkStatus: 'unknown',
      deviceType: 'unknown'
    };
  },
  
  mounted() {
    // 开发环境下自动显示调试面板
    // #ifdef H5
    if (process.env.NODE_ENV === 'development') {
      this.showDebug = true;
    }
    // #endif
    
    this.initDebugInfo();
  },
  
  methods: {
    // 初始化调试信息
    initDebugInfo() {
      this.getUserInfo();
      this.getStoreInfo();
      this.getSystemStatus();
    },
    
    // 获取用户信息
    getUserInfo() {
      try {
        const token = uni.getStorageSync('token');
        const userStr = uni.getStorageSync('userInfo');
        
        this.isLoggedIn = !!token;
        
        if (userStr) {
          this.userInfo = JSON.parse(userStr);
        } else {
          this.userInfo = {
            id: 'N/A',
            username: 'N/A',
            role: 'N/A',
            permissions: []
          };
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
        this.userInfo = {};
      }
    },
    
    // 获取店铺信息
    getStoreInfo() {
      try {
        this.storeInfo = {
          id: uni.getStorageSync('storeId') || 'N/A',
          name: uni.getStorageSync('storeName') || 'N/A',
          uniacid: uni.getStorageSync('uniacid') || 'N/A'
        };
      } catch (error) {
        console.error('Failed to get store info:', error);
        this.storeInfo = {};
      }
    },
    
    // 获取系统状态
    getSystemStatus() {
      // 获取网络状态
      uni.getNetworkType({
        success: (res) => {
          this.networkStatus = res.networkType;
        },
        fail: () => {
          this.networkStatus = 'unknown';
        }
      });
      
      // 获取设备类型
      uni.getSystemInfo({
        success: (res) => {
          this.deviceType = res.platform;
        },
        fail: () => {
          this.deviceType = 'unknown';
        }
      });
    },
    
    // 刷新用户信息
    refreshUserInfo() {
      this.initDebugInfo();
      uni.showToast({
        title: '信息已刷新',
        icon: 'success'
      });
    },
    
    // 清除缓存
    clearCache() {
      try {
        uni.clearStorageSync();
        uni.showToast({
          title: '缓存已清除',
          icon: 'success'
        });
        
        // 重新获取信息
        setTimeout(() => {
          this.initDebugInfo();
        }, 1000);
      } catch (error) {
        console.error('Failed to clear cache:', error);
        uni.showToast({
          title: '清除缓存失败',
          icon: 'error'
        });
      }
    },
    
    // 导出日志
    exportLogs() {
      const logs = {
        timestamp: new Date().toISOString(),
        userInfo: this.userInfo,
        storeInfo: this.storeInfo,
        systemStatus: {
          isLoggedIn: this.isLoggedIn,
          networkStatus: this.networkStatus,
          deviceType: this.deviceType
        }
      };
      
      console.log('Debug Logs:', JSON.stringify(logs, null, 2));
      
      uni.showToast({
        title: '日志已导出到控制台',
        icon: 'success'
      });
    },
    
    // 关闭调试面板
    closeDebug() {
      this.showDebug = false;
    },
    
    // 显示调试面板
    show() {
      this.showDebug = true;
      this.initDebugInfo();
    }
  }
};
</script>

<style lang="scss" scoped>
.role-debug {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  z-index: 9999;
  color: #fff;
  font-size: 12px;
  overflow: hidden;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.debug-title {
  font-weight: bold;
  font-size: 14px;
}

.debug-close {
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
}

.debug-content {
  padding: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 15px;
}

.section-title {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #4CAF50;
  font-size: 13px;
}

.info-item {
  margin-bottom: 3px;
  padding: 2px 0;
  word-break: break-all;
}

.debug-actions {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.debug-btn {
  padding: 8px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.debug-btn:active {
  background: #45a049;
}
</style>