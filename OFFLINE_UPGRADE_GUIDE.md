# DAMO Cashier 离线可用改造指南

## 🎯 改造目标

1. **离线缓存**: 首次加载缓存关键数据，断网时可正常浏览
2. **离线下单**: 断网时订单存储本地，联网后自动同步
3. **数据同步**: 联网时自动更新缓存数据
4. **最少修改**: 基于现有架构，最小化代码改动

## 📋 改造方案概览

### 核心策略
- **缓存层**: 在现有 `common/request.js` 基础上添加缓存逻辑
- **离线队列**: 使用 IndexedDB 存储离线操作
- **数据同步**: 网络恢复时自动同步数据
- **状态管理**: 扩展 Vuex store 管理离线状态

## 🛠️ 实施步骤

### 第一步：安装依赖

```bash
npm install localforage
```

### 第二步：创建离线管理器

创建 `common/offline-manager.js`：

```javascript
import localforage from 'localforage'

// 配置存储实例
const cacheStore = localforage.createInstance({
  name: 'damo_cashier',
  storeName: 'cache'
})

const queueStore = localforage.createInstance({
  name: 'damo_cashier', 
  storeName: 'offline_queue'
})

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.setupNetworkListeners()
  }

  // 网络状态监听
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncOfflineQueue()
      uni.$emit('network-online')
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      uni.$emit('network-offline')
    })
  }

  // 缓存数据
  async cacheData(key, data, ttl = 3600000) { // 默认1小时
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl
    }
    await cacheStore.setItem(key, cacheItem)
  }

  // 获取缓存数据
  async getCachedData(key) {
    try {
      const cacheItem = await cacheStore.getItem(key)
      if (!cacheItem) return null
      
      const { data, timestamp, ttl } = cacheItem
      if (Date.now() - timestamp > ttl) {
        await cacheStore.removeItem(key)
        return null
      }
      
      return data
    } catch (error) {
      console.error('获取缓存失败:', error)
      return null
    }
  }

  // 添加到离线队列
  async addToQueue(operation) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const queueItem = {
      id,
      ...operation,
      timestamp: Date.now()
    }
    await queueStore.setItem(id, queueItem)
    return id
  }

  // 同步离线队列
  async syncOfflineQueue() {
    try {
      const keys = await queueStore.keys()
      console.log(`开始同步 ${keys.length} 个离线操作`)
      
      for (const key of keys) {
        const item = await queueStore.getItem(key)
        if (!item) continue
        
        try {
          // 执行网络请求
          const response = await uni.request({
            url: item.url,
            method: item.method || 'POST',
            data: item.data,
            header: item.header
          })
          
          if (response[1].statusCode === 200) {
            await queueStore.removeItem(key)
            console.log(`同步成功: ${item.type}`)
            
            // 触发同步成功事件
            uni.$emit('sync-success', {
              type: item.type,
              data: response[1].data
            })
          }
        } catch (error) {
          console.error(`同步失败: ${item.type}`, error)
        }
      }
    } catch (error) {
      console.error('同步队列失败:', error)
    }
  }

  // 清理过期缓存
  async clearExpiredCache() {
    try {
      const keys = await cacheStore.keys()
      for (const key of keys) {
        const item = await cacheStore.getItem(key)
        if (item && Date.now() - item.timestamp > item.ttl) {
          await cacheStore.removeItem(key)
        }
      }
    } catch (error) {
      console.error('清理缓存失败:', error)
    }
  }
}

export default new OfflineManager()
```

### 第三步：改造请求层

修改 `common/request.js`：

```javascript
import config from '@/custom/config.js';
import site from '@/custom/siteroot.js';
import api from '@/api';
import i18n from '@/locale/index.js'
import offlineManager from './offline-manager.js'

// 可缓存的接口列表
const CACHEABLE_APIS = [
  '/channel/store/goods',           // 商品列表
  '/channel/store/goods/category',  // 商品分类
  '/channel/member',                // 会员信息
  '/channel/statistics',            // 统计数据
  '/channel/apply'                  // 店铺信息
]

// 离线可操作的接口
const OFFLINE_OPERATIONS = [
  '/channel/inStore/order',         // 下单
  '/channel/inStore/cart',          // 购物车
  '/channel/order',                 // 订单操作
  '/channel/member/changeIntegral', // 积分变更
  '/channel/member/changeBalance'   // 余额变更
]

export default {
  request: async function(option) {
    if (option.mask) {
      uni.showLoading({
        title: option.mask == 1 ? 'Loading...' : option.mask,
        mask: true
      });
    }
    
    var option = option || {};
    if (!option.url) {
      return false;
    }

    const fullUrl = site.siteroot + option.url
    const cacheKey = `${option.url}_${JSON.stringify(option.data || {})}`
    
    // 检查是否为可缓存接口
    const isCacheable = CACHEABLE_APIS.some(api => option.url.includes(api))
    const isOfflineOperation = OFFLINE_OPERATIONS.some(api => option.url.includes(api))
    
    // 如果离线且是可缓存接口，尝试返回缓存数据
    if (!offlineManager.isOnline && isCacheable) {
      const cachedData = await offlineManager.getCachedData(cacheKey)
      if (cachedData) {
        if (option.mask) {
          uni.hideLoading();
        }
        console.log('返回缓存数据:', option.url)
        return cachedData
      }
    }
    
    // 如果离线且是可离线操作，添加到队列
    if (!offlineManager.isOnline && isOfflineOperation) {
      const queueId = await offlineManager.addToQueue({
        type: 'api_request',
        url: fullUrl,
        method: option.method || 'GET',
        data: option.data,
        header: {
          contentType: config.contentType,
          appType: 'cashier',
          lang: i18n.locale,
          uniacid: uni.getStorageSync('uniacid'),
          storeId: uni.getStorageSync('storeId'),
          Authorization: `Bearer ${uni.getStorageSync('token')}`,
        }
      })
      
      if (option.mask) {
        uni.hideLoading();
      }
      
      // 返回离线响应
      return {
        code: 200,
        msg: '已添加到离线队列，联网后自动同步',
        data: { offline: true, queueId },
        offline: true
      }
    }

    // 在线请求
    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        data: option.data ? option.data : {},
        method: option.method ? option.method : 'GET',
        header: {
          contentType: config.contentType,
          appType: 'cashier',
          lang: i18n.locale,
          uniacid: uni.getStorageSync('uniacid'),
          storeId: uni.getStorageSync('storeId'),
          Authorization: `Bearer ${uni.getStorageSync('token')}`,
        },
        complete: async (res) => {
          if (option.mask) {
            uni.hideLoading();
          }
          
          if (res?.data?.code == 200) {
            // 缓存成功响应的数据
            if (isCacheable && offlineManager.isOnline) {
              await offlineManager.cacheData(cacheKey, res.data)
            }
            resolve(res.data)
          } else {
            if (res?.data?.code == 400) {
              resolve(res.data)
              config.tokenErrorMessage(res.data.msg || res.msg)
            } else if (res?.data?.code == 401) {
              config.tokenErrorMessage(res.data.msg || res.msg)
              uni.removeStorageSync('token')
              uni.removeStorageSync('storeId')
              uni.reLaunch({
                url: `/pages/login/index`
              })
            } else {
              config.tokenErrorMessage(res.data.msg || res.msg)
            }
          }
        }
      });
    })
  }
}
```

### 第四步：扩展 Vuex Store

修改 `store/index.js`，添加离线状态管理：

```javascript
import Vue from 'vue'
import Vuex from 'vuex'
import api from '@/api';
import beg from '@/common/request';
import offlineManager from '@/common/offline-manager.js'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    // ... 现有状态
    user: uni.getStorageSync('user_info'),
    token: '',
    isLogin: false,
    storeInfo: uni.getStorageSync('storeInfo'),
    storeId: uni.getStorageSync('storeId'),
    store: uni.getStorageSync('store'),
    vipInfo: uni.getStorageSync('vipInfo'),
    vipUserInfo: uni.getStorageSync('vipUserInfo'),
    siteroot: uni.getStorageSync('siteroot'),
    config: {
      reasonConfig: {},
      cashieSetting: {},
    },
    handOver: uni.getStorageSync('handOver'),
    cashierprint: uni.getStorageSync('cashierprint') || 1,
    
    // 新增离线状态
    isOnline: navigator.onLine,
    offlineQueue: [],
    syncStatus: 'idle' // idle, syncing, success, error
  },
  
  mutations: {
    // ... 现有 mutations
    setUser(state, data) {
      uni.setStorageSync('userId', data.id)
      uni.setStorageSync('user_info', data)
      state.user = data
      if (data.mobile) state.isLogin = true
    },
    // ... 其他现有 mutations
    
    // 新增离线相关 mutations
    SET_ONLINE_STATUS(state, status) {
      state.isOnline = status
    },
    SET_SYNC_STATUS(state, status) {
      state.syncStatus = status
    },
    ADD_TO_OFFLINE_QUEUE(state, item) {
      state.offlineQueue.push(item)
    },
    REMOVE_FROM_OFFLINE_QUEUE(state, id) {
      state.offlineQueue = state.offlineQueue.filter(item => item.id !== id)
    }
  },
  
  actions: {
    // ... 现有 actions
    
    // 初始化离线管理
    initOfflineManager({ commit }) {
      // 监听网络状态变化
      uni.$on('network-online', () => {
        commit('SET_ONLINE_STATUS', true)
        commit('SET_SYNC_STATUS', 'syncing')
      })
      
      uni.$on('network-offline', () => {
        commit('SET_ONLINE_STATUS', false)
      })
      
      uni.$on('sync-success', (data) => {
        commit('SET_SYNC_STATUS', 'success')
        setTimeout(() => {
          commit('SET_SYNC_STATUS', 'idle')
        }, 3000)
      })
    }
  }
})

export default store
```

### 第五步：添加离线状态组件

创建 `components/offline-status.vue`：

```vue
<template>
  <view class="offline-status" v-if="!isOnline || syncStatus !== 'idle'">
    <view class="status-bar" :class="statusClass">
      <text class="status-icon">{{ statusIcon }}</text>
      <text class="status-text">{{ statusText }}</text>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'OfflineStatus',
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
}
</style>
```

### 第六步：修改 App.vue

在 `App.vue` 中初始化离线管理：

```javascript
// 在 App.vue 的 script 部分添加
import offlineManager from '@/common/offline-manager.js'

export default {
  onLaunch: function() {
    // ... 现有代码
    
    // 初始化离线管理
    this.$store.dispatch('initOfflineManager')
    
    // 定期清理过期缓存
    setInterval(() => {
      offlineManager.clearExpiredCache()
    }, 300000) // 5分钟清理一次
    
    // ... 其他现有代码
  },
  
  // ... 其他现有方法
}
```

### 第七步：在主页面添加离线状态

修改 `pages/home/index.vue`，添加离线状态组件：

```vue
<template>
  <view class="w100v h100v f-bt f20 o-h">
    <!-- 添加离线状态组件 -->
    <offline-status />
    
    <!-- 现有内容 -->
    <view class="left cc">
      <!-- ... 现有左侧导航 -->
    </view>
    
    <view class="right f-1 f-y-bt">
      <!-- ... 现有右侧内容 -->
    </view>
  </view>
</template>

<script>
// 导入离线状态组件
import OfflineStatus from '@/components/offline-status.vue'

export default {
  components: {
    // ... 现有组件
    OfflineStatus
  },
  
  // ... 其他现有代码
}
</script>
```

## 🔧 配置说明

### 缓存策略
- **商品数据**: 缓存1小时，离线时可浏览
- **会员信息**: 缓存30分钟
- **统计数据**: 缓存15分钟
- **订单数据**: 不缓存，但支持离线操作

### 离线操作
- **下单**: 离线时存储到本地队列
- **会员操作**: 积分、余额变更离线存储
- **购物车**: 离线时本地存储

### 同步机制
- **自动同步**: 网络恢复时自动执行
- **重试机制**: 失败操作会在下次联网时重试
- **冲突处理**: 服务端需要支持幂等操作

## 📱 使用效果

### 离线场景
1. **断网浏览**: 可以查看已缓存的商品、会员信息
2. **离线下单**: 订单存储本地，显示"离线模式"提示
3. **状态提示**: 顶部显示离线状态和同步进度

### 联网恢复
1. **自动同步**: 后台自动同步离线操作
2. **状态更新**: 显示同步进度和结果
3. **数据刷新**: 自动获取最新数据

## ⚠️ 注意事项

1. **服务端支持**: 需要确保API支持幂等操作
2. **存储限制**: IndexedDB有存储限制，注意清理
3. **冲突处理**: 离线期间的数据可能与服务端冲突
4. **用户体验**: 明确提示离线状态和同步进度

## 🚀 部署步骤

1. 安装依赖: `npm install localforage`
2. 复制上述代码文件到对应位置
3. 修改现有文件的导入和组件注册
4. 测试离线功能
5. 部署到生产环境

这个方案基于你现有的架构，最小化修改，确保离线功能的完整实现。