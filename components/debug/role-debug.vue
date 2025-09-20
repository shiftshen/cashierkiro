<template>
  <view class="role-debug-panel" v-if="showDebug">
    <view class="debug-header">
      <text class="debug-title">角色权限调试面板</text>
      <button class="close-btn" @click="closeDebug">关闭</button>
    </view>
    
    <view class="debug-content">
      <view class="debug-section">
        <text class="section-title">当前页面信息</text>
        <view class="info-item">
          <text class="label">页面ID:</text>
          <text class="value">{{ current }}</text>
        </view>
      </view>
      
      <view class="debug-section">
        <text class="section-title">用户角色信息</text>
        <view class="info-item">
          <text class="label">角色数量:</text>
          <text class="value">{{ userRoles.length }}</text>
        </view>
        <view class="roles-list">
          <view 
            v-for="(role, index) in userRoles" 
            :key="index" 
            class="role-item"
            :class="{ 'active-role': isActiveRole(role) }"
          >
            {{ role }}
          </view>
        </view>
      </view>
      
      <view class="debug-section">
        <text class="section-title">页面权限映射</text>
        <view class="mapping-info">
          <view 
            v-for="(mapping, pageId) in pageRoleMapping" 
            :key="pageId"
            class="mapping-item"
            :class="{ 'current-page': pageId == current }"
          >
            <text class="page-id">页面{{ pageId }}:</text>
            <text class="required-role">{{ mapping.role }}</text>
          </view>
        </view>
      </view>
      
      <view class="debug-actions">
        <button class="action-btn" @click="refreshRoles">刷新角色信息</button>
        <button class="action-btn" @click="clearRoleCache">清除角色缓存</button>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'RoleDebug',
  props: {
    current: {
      type: [Number, String],
      default: 0
    },
    showDebug: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 页面ID到角色的映射
      pageRoleMapping: {
        0: { role: 'diandan', name: '订单' },
        1: { role: 'zhuotai', name: '餐桌' },
        2: { role: 'jiaohao', name: '叫号' },
        3: { role: 'duizhang', name: '对账' },
        4: { role: 'dingdan', name: '订单管理' },
        5: { role: 'huiyuan', name: '会员' },
        6: { role: 'diandan', name: '核销' },
        7: { role: 'goods', name: '商品' },
        8: { role: 'diandan', name: '员工管理' },
        9: { role: 'diandan', name: '退款维权' },
        10: { role: 'jiaoban', name: '交班' },
        11: { role: 'diandan', name: '信息' },
        12: { role: 'diandan', name: '设置' },
        13: { role: 'yingjian', name: '打印' },
        15: { role: 'xitong', name: '系统设置' },
        61: { role: 'diandan', name: '核销' }
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.user
    }),
    userRoles() {
      const roleData = this.user?.roleData || []
      // 如果没有角色数据，提供默认权限
      if (roleData.length === 0) {
        return ['diandan', 'zhuotai']
      }
      return roleData
    }
  },
  methods: {
    closeDebug() {
      this.$emit('update:showDebug', false)
    },
    isActiveRole(role) {
      return this.userRoles.includes(role)
    },
    refreshRoles() {
      // 触发角色信息刷新
      this.$store.dispatch('refreshUserRoles')
      uni.showToast({
        title: '角色信息已刷新',
        icon: 'success'
      })
    },
    clearRoleCache() {
      // 清除角色缓存
      uni.removeStorageSync('userRoles')
      uni.removeStorageSync('roleData')
      uni.showToast({
        title: '角色缓存已清除',
        icon: 'success'
      })
    }
  }
}
</script>

<style scoped>
.role-debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 300px;
  max-height: 80vh;
  background: #fff;
  border: 2px solid #4275F4;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
  font-family: 'Monaco', 'Consolas', monospace;
}

.debug-header {
  background: #4275F4;
  color: white;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-title {
  font-size: 14px;
  font-weight: bold;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.debug-content {
  padding: 10px;
  overflow-y: auto;
  max-height: calc(80vh - 40px);
}

.debug-section {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.section-title {
  font-weight: bold;
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
}

.label {
  color: #666;
}

.value {
  color: #4275F4;
  font-weight: bold;
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.role-item {
  background: #f0f0f0;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.active-role {
  background: #4275F4;
  color: white;
}

.mapping-info {
  font-size: 11px;
}

.mapping-item {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px dashed #eee;
}

.current-page {
  background: #e8f4ff;
  padding: 3px;
  border-radius: 3px;
}

.page-id {
  color: #666;
}

.required-role {
  color: #4275F4;
  font-weight: bold;
}

.debug-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 6px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.action-btn:active {
  background: #e0e0e0;
}
</style>