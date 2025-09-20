<template>
  <view class="container">
    <view class="section">
      <text class="title">API测试页面</text>
    </view>
    
    <view class="section">
      <text class="label">当前存储信息:</text>
      <view class="info">
        <text>Token: {{ token ? '已设置' : '未设置' }}</text>
        <text>UniacId: {{ uniacid }}</text>
        <text>StoreId: {{ storeId }}</text>
        <text>用户信息: {{ userInfo ? JSON.stringify(userInfo) : '无' }}</text>
      </view>
    </view>
    
    <view class="section">
      <button @click="testLogin" class="btn">测试登录 (test001)</button>
      <button @click="testStoreList" class="btn">测试店铺列表</button>
      <button @click="clearStorage" class="btn danger">清除存储</button>
    </view>
    
    <view class="section">
      <text class="label">测试结果:</text>
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
      uniacid: '',
      storeId: '',
      userInfo: null,
      result: '等待测试...'
    }
  },
  
  onLoad() {
    this.loadStorageInfo()
  },
  
  methods: {
    loadStorageInfo() {
      this.token = uni.getStorageSync('token')
      this.uniacid = uni.getStorageSync('uniacid')
      this.storeId = uni.getStorageSync('storeId')
      this.userInfo = uni.getStorageSync('userInfo')
    },
    
    async testLogin() {
      try {
        this.result = '正在测试登录...'
        
        const res = await this.beg.request({
          url: '/channel/login',
          method: 'POST',
          data: {
            username: 'test001',
            password: '123456',
            number: ''
          }
        })
        
        if (res.code === 200) {
          this.result = `登录成功！\n用户信息: ${JSON.stringify(res.data.user_info, null, 2)}`
          
          // 存储登录信息
          if (res.data.token) {
            uni.setStorageSync('token', res.data.token)
          }
          if (res.data.user_info) {
            uni.setStorageSync('userInfo', res.data.user_info)
            if (res.data.user_info.uniacid) {
              uni.setStorageSync('uniacid', res.data.user_info.uniacid)
            }
          }
          
          this.loadStorageInfo()
        } else {
          this.result = `登录失败: ${res.msg}`
        }
      } catch (error) {
        this.result = `登录错误: ${error.message}`
      }
    },
    
    async testStoreList() {
      try {
        this.result = '正在获取店铺列表...'
        
        const res = await this.beg.request({
          url: '/channel/store',
          data: {
            pageSize: 999
          }
        })
        
        if (res.code === 200) {
          this.result = `店铺列表获取成功！\n店铺数量: ${res.data.total}\n店铺信息: ${JSON.stringify(res.data.list, null, 2)}`
        } else {
          this.result = `获取店铺列表失败: ${res.msg}`
        }
      } catch (error) {
        this.result = `店铺列表错误: ${error.message}`
      }
    },
    
    clearStorage() {
      uni.clearStorageSync()
      this.loadStorageInfo()
      this.result = '存储已清除'
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
  min-height: 100px;
}

.result text {
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>