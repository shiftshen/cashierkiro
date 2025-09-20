<template>
  <view class="app-table-manager">
    <!-- APP环境下的餐桌管理 -->
    <!-- #ifdef APP-PLUS -->
    <view class="table-container">
      <view class="table-header">
        <text class="table-title">{{ title || '餐桌管理' }}</text>
        <view class="table-actions">
          <button class="action-btn" @click="refreshTables">刷新</button>
          <button class="action-btn" @click="addTable" v-if="canAdd">添加餐桌</button>
        </view>
      </view>
      
      <view class="table-content">
        <view class="table-grid">
          <view 
            class="table-item" 
            :class="getTableClass(table)"
            v-for="table in tables" 
            :key="table.id"
            @click="selectTable(table)"
          >
            <view class="table-number">{{ table.number || table.name }}</view>
            <view class="table-status">{{ getTableStatusText(table.status) }}</view>
            <view class="table-info" v-if="table.customerCount">
              <text>{{ table.customerCount }}人</text>
            </view>
            <view class="table-time" v-if="table.startTime">
              <text>{{ formatTime(table.startTime) }}</text>
            </view>
            <view class="table-actions-mini">
              <button class="mini-btn edit" @click.stop="editTable(table)" v-if="canEdit">编辑</button>
              <button class="mini-btn delete" @click.stop="deleteTable(table)" v-if="canDelete">删除</button>
            </view>
          </view>
        </view>
        
        <view class="empty-state" v-if="!tables || tables.length === 0">
          <text>暂无餐桌</text>
          <button class="add-first-btn" @click="addTable" v-if="canAdd">添加第一张餐桌</button>
        </view>
      </view>
      
      <view class="table-summary">
        <view class="summary-item">
          <text class="summary-label">总桌数:</text>
          <text class="summary-value">{{ tables.length }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">空闲:</text>
          <text class="summary-value">{{ getTableCountByStatus('available') }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">占用:</text>
          <text class="summary-value">{{ getTableCountByStatus('occupied') }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">预订:</text>
          <text class="summary-value">{{ getTableCountByStatus('reserved') }}</text>
        </view>
      </view>
    </view>
    <!-- #endif -->
    
    <!-- H5环境下使用原始组件 -->
    <!-- #ifdef H5 -->
    <slot></slot>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  name: 'AppTableManager',
  props: {
    title: {
      type: String,
      default: '餐桌管理'
    },
    tables: {
      type: Array,
      default: () => []
    },
    canAdd: {
      type: Boolean,
      default: true
    },
    canEdit: {
      type: Boolean,
      default: true
    },
    canDelete: {
      type: Boolean,
      default: true
    }
  },
  mounted() {
    console.log('餐桌管理器已加载，当前环境:', this.getCurrentPlatform());
  },
  methods: {
    getCurrentPlatform() {
      // #ifdef APP-PLUS
      return 'APP';
      // #endif
      // #ifdef H5
      return 'H5';
      // #endif
      return 'Unknown';
    },
    
    getTableClass(table) {
      const baseClass = 'table-card';
      const statusClass = `status-${table.status || 'available'}`;
      return `${baseClass} ${statusClass}`;
    },
    
    getTableStatusText(status) {
      const statusMap = {
        available: '空闲',
        occupied: '占用',
        reserved: '预订',
        cleaning: '清理中',
        maintenance: '维护中'
      };
      return statusMap[status] || '未知';
    },
    
    getTableCountByStatus(status) {
      return this.tables.filter(table => table.status === status).length;
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },
    
    selectTable(table) {
      this.$emit('tableSelected', table);
    },
    
    refreshTables() {
      this.$emit('refresh');
    },
    
    addTable() {
      this.$emit('addTable');
    },
    
    editTable(table) {
      this.$emit('editTable', table);
    },
    
    deleteTable(table) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除餐桌"${table.number || table.name}"吗？`,
        success: (res) => {
          if (res.confirm) {
            this.$emit('deleteTable', table);
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.app-table-manager {
  width: 100%;
  height: 100%;
}

.table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.table-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.table-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.table-item {
  position: relative;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.table-card.status-available {
  background: #d4edda;
  border: 2px solid #28a745;
}

.table-card.status-occupied {
  background: #f8d7da;
  border: 2px solid #dc3545;
}

.table-card.status-reserved {
  background: #fff3cd;
  border: 2px solid #ffc107;
}

.table-card.status-cleaning {
  background: #d1ecf1;
  border: 2px solid #17a2b8;
}

.table-card.status-maintenance {
  background: #e2e3e5;
  border: 2px solid #6c757d;
}

.table-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.table-status {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.table-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.table-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.table-actions-mini {
  display: flex;
  gap: 5px;
  margin-top: auto;
}

.mini-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
}

.mini-btn.edit {
  background: #28a745;
  color: white;
}

.mini-btn.delete {
  background: #dc3545;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.add-first-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.table-summary {
  display: flex;
  justify-content: space-around;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.summary-label {
  font-size: 12px;
  color: #666;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
</style>