<template>
  <view class="container">
    <view class="section">
      <text class="title">店铺列表调试</text>
    </view>
    
    <view class="section">
      <text class="label">当前存储信息:</text>
      <view class="info">
        <text>Token: {{ token ? '已设置' : '未设置' }}</text>
        <text>UniacId: {{ uniacid }}</text>
        <text>StoreId: {{ storeId }}</text>
        <text>API端点: {{ apiEndpoint }}</text>
      </view>
    </view>
    
    <view class="section">
      <button @click="debugStoreList" class="btn">调试店铺列表请求</button>
      <button @click="clearAll" class="btn danger">清除所有存储</button>
    </view>
    
    <view class="section">
      <text class="label">调试结果:</text>
      <view class="result">
        <text>{{ debugResult }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      token: '',
      uniacid: '',
      storeId: '',
      apiEndpoint: '',
      debugResult: '等待调试...'
    }
  },
  
  onLoad() {
    this.loadInfo()
  },
  
  methods: {
    loadInfo() {
      this.token = uni.getStorageSync('token')
      this.uniacid = uni.getStorageSync('uniacid')
      this.storeId = uni.getStorageSync('storeId')
      this.apiEndpoint = this.api ? this.api.storeList : '未定义'
    },
    
    async debugStoreList() {
      try {
        this.debugResult = '开始调试...\n'
        
        // 检查必要的信息
        this.debugResult += `Token: ${this.token ? '✅ 已设置' : '❌ 未设置'}\n`
        this.debugResult += `UniacId: ${this.uniacid || '❌ 未设置'}\n`
        this.debugResult += `API端点: ${this.apiEndpoint}\n\n`
        
        if (!this.token) {
          this.debugResult += '❌ 错误：没有登录token，请先登录\n'
          return
        }
        
        if (!this.uniacid) {
          this.debugResult += '❌ 错误：没有uniacid，请检查登录流程\n'
          return
        }
        
        this.debugResult += '正在请求店铺列表...\n'
        
        // 使用完整的API路径
        const res = await this.beg.request({
          url: '/channel/store',
          data: {
            pageSize: 999
          }
        })
        
        this.debugResult += `响应状态码: ${res.code}\n`
        this.debugResult += `响应消息: ${res.msg}\n`
        
        if (res.code === 200) {
          const storeCount = res.data?.list?.length || 0
          this.debugResult += `✅ 成功！找到 ${storeCount} 个店铺\n\n`
          
          if (storeCount > 0) {
            res.data.list.forEach((store, index) => {
              this.debugResult += `店铺${index + 1}: ${store.name} (ID: ${store.id})\n`
            })
          } else {
            this.debugResult += '⚠️ 店铺列表为空，可能是权限问题\n'
          }
        } else {
          this.debugResult += `❌ 请求失败: ${res.msg}\n`
          if (res.code === 401) {
            this.debugResult += '认证失败，请重新登录\n'
          }
        }
        
      } catch (error) {
        this.debugResult += `❌ 调试错误: ${error.message}\n`
        console.error('店铺列表调试错误:', error)
      }
    },
    
    clearAll() {
      uni.clearStorageSync()
      this.loadInfo()
      this.debugResult = '存储已清除，请重新登录'
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20px;
}

.section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.label {
  font-size: 16px;
  font-weight: bold;
  color: #666;
  margin-bottom: 10px;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info text {
  font-size: 14px;
  color: #333;
  word-break: break-all;
}

.btn {
  margin: 10px 0;
  padding: 10px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 5px;
}

.btn.danger {
  background: #ff3b30;
}

.result {
  background: #fff;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.result text {
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.4;
}
</style>