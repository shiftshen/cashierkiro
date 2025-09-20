<template>
  <view class="role-debug">
    <view class="debug-header">
      <text class="debug-title">🔍 角色调试信息</text>
      <button class="close-btn" @click="$emit('close')">×</button>
    </view>
    
    <view class="debug-content">
      <view class="debug-section">
        <text class="section-title">当前状态</text>
        <view class="debug-item">
          <text class="label">当前标签:</text>
          <text class="value">{{ current }}</text>
        </view>
        <view class="debug-item">
          <text class="label">标签名称:</text>
          <text class="value">{{ getTabName(current) }}</text>
        </view>
        <view class="debug-item">
          <text class="label">运行环境:</text>
          <text class="value">{{ getPlatform() }}</text>
        </view>
      </view>
      
      <view class="debug-section">
        <text class="section-title">用户角色</text>
        <view class="debug-item">
          <text class="label">角色数组:</text>
          <text class="value">{{ JSON.stringify(userRole) }}</text>
        </view>
        <view class="debug-item">
          <text class="label">角色长度:</text>
          <text class="value">{{ userRole.length }}</text>
        </view>
        <view class="debug-item">
          <text class="label">是否为空:</text>
          <text class="value">{{ userRole.length === 0 ? '是' : '否' }}</text>
        </view>
      </view>
      
      <view class="debug-section">
        <text class="section-title">组件匹配</text>
        <view class="debug-item">
          <text class="label">需要角色:</text>
          <text class="value">{{ getRequiredRole(current) }}</text>
        </view>
        <view class="debug-item">
          <text class="label">权限检查:</text>
          <text class="value">{{ hasPermission(current) ? '通过' : '失败' }}</text>
        </view>
        <view class="debug-item">
          <text class="label">组件应显示:</text>
          <text class="value">{{ shouldShowComponent(current) ? '是' : '否' }}</text>
        </view>
      </view>
      
      <view class="debug-section">
        <text class="section-title">存储数据</text>
        <view class="debug-item">
          <text class="label">Token:</text>
          <text class="value">{{ getStorageData('token') ? '已设置' : '未设置' }}</text>
        </view>
        <view class="debug-item">
          <text class="label">Store ID:</text>
          <text class="value">{{ getStorageData('storeId') || '未设置' }}</text>
        </view>
        <view class="debug-item">
          <text class="label">用户信息:</text>
          <text class="value">{{ getStorageData('user') ? '已设置' : '未设置' }}</text>
        </view>
      </view>
      
      <view class="debug-actions">
        <button class="debug-btn" @click="forceShowAll">强制显示所有组件</button>
        <button class="debug-btn" @click="resetRole">重置角色权限</button>
        <button class="debug-btn" @click="refreshPage">刷新页面</button>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'RoleDebug',
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  computed: {
    ...mapState({
      userRole: state => state.user?.roleData || []
    })
  },
  methods: {
    getPlatform() {
      // #ifdef APP-PLUS
      return 'APP-PLUS';
      // #endif
      // #ifdef H5
      return 'H5';
      // #endif
      return 'Unknown';
    },
    
    getTabName(current) {
      const tabNames = {
        0: '订单',
        1: '桌台',
        2: '叫号',
        3: '对账',
        4: '订单管理',
        5: '会员',
        6: '核销',
        7: '商品',
        8: '员工',
        9: '退款',
        10: '交班',
        11: '信息',
        12: '设置',
        13: '打印',
        15: '商品设置',
        61: '核销DL'
      };
      return tabNames[current] || '未知';
    },
    
    getRequiredRole(current) {
      const roleMap = {
        0: 'diandan',
        1: 'zhuotai',
        2: 'jiaohao',
        3: 'duizhang',
        4: 'dingdan',
        5: 'huiyuan',
        6: 'diandan',
        7: 'goods',
        8: 'diandan',
        9: 'diandan',
        10: 'jiaoban',
        11: 'diandan',
        12: 'diandan',
        13: 'yingjian',
        15: 'xitong',
        61: 'diandan'
      };
      return roleMap[current] || '无需权限';
    },
    
    hasPermission(current) {
      const requiredRole = this.getRequiredRole(current);
      if (requiredRole === '无需权限') return true;
      return this.userRole.includes(requiredRole) || this.userRole.length === 0;
    },
    
    shouldShowComponent(current) {
      return this.hasPermission(current);
    },
    
    getStorageData(key) {
      try {
        return uni.getStorageSync(key);
      } catch (error) {
        return null;
      }
    },
    
    forceShowAll() {
      // 通过事件通知父组件强制显示所有组件
      this.$emit('forceShowAll');
      uni.showToast({
        title: '已强制显示所有组件',
        icon: 'success'
      });
    },
    
    resetRole() {
      // 重置角色为默认权限
      const defaultRoles = ['diandan', 'zhuotai', 'jiaohao', 'duizhang'];
      this.$store.commit('setUserRole', defaultRoles);
      uni.showToast({
        title: '角色权限已重置',
        icon: 'success'
      });
    },
    
    refreshPage() {
      uni.reLaunch({
        url: '/pages/home/index'
      });
    }
  }
};
</script>

<style scoped>
.role-debug {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.debug-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.close-btn {
  width: 30px;
  height: 30px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.debug-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.debug-section {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 10px;
  display: block;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 5px 0;
}

.label {
  font-size: 13px;
  color: #666;
  min-width: 100px;
}

.value {
  font-size: 13px;
  color: #333;
  font-weight: bold;
  flex: 1;
  text-align: right;
  word-break: break-all;
}

.debug-actions {
  padding: 15px 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.debug-btn {
  padding: 8px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  flex: 1;
  min-width: 120px;
}

.debug-btn:hover {
  background: #0056b3;
}
</style>