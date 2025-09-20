<template>
  <view class="container">
    <view class="section">
      <text class="title">UniacId 修复工具</text>
    </view>
    
    <view class="section">
      <text class="label">当前存储信息:</text>
      <view class="info">
        <text>Token: {{ token ? '已设置' : '未设置' }}</text>
        <text>当前UniacId: {{ currentUniacid }}</text>
        <text>正确UniacId: 3</text>
        <text>状态: {{ isCorrect ? '✅ 正确' : '❌ 需要修复' }}</text>
      </view>
    </view>
    
    <view class="section">
      <button @click="fixUniacid" class="btn" :disabled="isCorrect">
        {{ isCorrect ? '无需修复' : '修复 UniacId' }}
      </button>
      <button @click="testStoreList" class="btn">测试店铺列表</button>
      <button @click="goToSelectShop" class="btn success">前往店铺选择</button>
    </view>
    
    <view class="section">
      <text class="label">操作结果:</text>
      <view class="result">
        <text>{{ result }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      token: '',
      currentUniacid: '',
      result: '等待操作...'
    }
  },
  
  computed: {
    isCorrect() {
      return this.currentUniacid === '3' || this.currentUniacid === 3
    }
  },
  
  onLoad() {
    this.loadInfo()
  },
  
  methods: {
    loadInfo() {
      this.token = uni.getStorageSync('token')
      this.currentUniacid = uni.getStorageSync('uniacid')
      
      if (!this.isCorrect && this.token) {
        this.result = '检测到uniacid不正确，需要修复'
      } else if (this.isCorrect) {
        this.result = 'uniacid配置正确'
      } else {
        this.result = '请先登录获取token'
      }
    },
    
    fixUniacid() {
      try {
        uni.setStorageSync('uniacid', 3)
        this.currentUniacid = 3
        this.result = '✅ uniacid已修复为3\n现在可以正常访问店铺列表了'
      } catch (error) {
        this.result = `❌ 修复失败: ${error.message}`
      }
    },
    
    async testStoreList() {
      if (!this.token) {
        this.result = '❌ 请先登录获取token'
        return
      }
      
      try {
        this.result = '正在测试店铺列表...'
        
        const res = await this.beg.request({
          url: '/channel/store',
          data: {
            pageSize: 999
          }
        })
        
        if (res.code === 200) {
          const storeCount = res.data?.list?.length || 0
          this.result = `✅ 测试成功！找到 ${storeCount} 个店铺:\n`
          
          if (storeCount > 0) {
            res.data.list.forEach((store, index) => {
              this.result += `${index + 1}. ${store.name} (ID: ${store.id})\n`
            })
          }
        } else {
          this.result = `❌ 测试失败: ${res.msg}`
        }
      } catch (error) {
        this.result = `❌ 测试错误: ${error.message}`
      }
    },
    
    goToSelectShop() {
      if (!this.token) {
        this.result = '❌ 请先登录'
        return
      }
      
      if (!this.isCorrect) {
        this.result = '❌ 请先修复uniacid'
        return
      }
      
      uni.reLaunch({
        url: '/pages/login/selectShop'
      })
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
}

.btn {
  margin: 10px 0;
  padding: 10px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 5px;
}

.btn:disabled {
  background: #ccc;
}

.btn.success {
  background: #28a745;
}

.result {
  background: #fff;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.result text {
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  line-height: 1.4;
}
</style>