<template>
  <view class="virtual-table-list">
    <virtual-list
      :items="tables"
      :item-height="tableItemHeight"
      :visible-count="visibleCount"
      :height="containerHeight"
      :buffer-size="bufferSize"
      key-field="id"
      @scroll="handleScroll"
      @loadMore="handleLoadMore"
      :loading="loading"
    >
      <template #default="{ item, index }">
        <view 
          class="table-item"
          :class="getTableClass(item)"
          @click="handleTableClick(item, index)"
        >
          <view class="table-header">
            <view class="table-name">{{ item.name }}</view>
            <view 
              v-if="item.scan === 1" 
              class="scan-badge"
              :style="{ color: getStatusColor(item.state) }"
            >
              扫码
            </view>
          </view>
          
          <view class="table-content">
            <view v-if="item.state === 1" class="table-status">
              待下单
            </view>
            <view v-else-if="item.order && item.order.money" class="table-amount">
              ฿{{ item.order.money }}
            </view>
          </view>
          
          <view class="table-footer">
            <view class="people-info">
              <text class="iconfont icon-wode"></text>
              {{ item.people || 0 }}/{{ item.type.max }}
            </view>
            <view v-if="item.minutes" class="time-info">
              <text class="iconfont icon-shalou"></text>
              {{ item.minutes }}分钟
            </view>
          </view>
          
          <!-- 选中状态 -->
          <view v-if="selectedTableId === item.id" class="selected-overlay">
            <view class="selected-icon">
              <text class="iconfont icon-duigou"></text>
            </view>
          </view>
        </view>
      </template>
      
      <template #loading>
        <view class="loading-container">
          <text>加载更多餐桌...</text>
        </view>
      </template>
    </virtual-list>
  </view>
</template>

<script>
import VirtualList from './virtual-list.vue'

export default {
  name: 'VirtualTableList',
  components: {
    VirtualList
  },
  
  props: {
    // 餐桌数据
    tables: {
      type: Array,
      default: () => []
    },
    // 容器高度
    containerHeight: {
      type: [Number, String],
      default: 'calc(100vh - 200px)'
    },
    // 每个餐桌项的高度
    tableItemHeight: {
      type: Number,
      default: 160
    },
    // 可视区域显示的餐桌数量
    visibleCount: {
      type: Number,
      default: 8
    },
    // 缓冲区大小
    bufferSize: {
      type: Number,
      default: 3
    },
    // 选中的餐桌ID
    selectedTableId: {
      type: [String, Number],
      default: null
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  methods: {
    // 获取餐桌样式类
    getTableClass(table) {
      const classes = ['table-card']
      
      switch (table.state) {
        case 1:
          classes.push('status-order') // 待下单 - 绿色
          break
        case 2:
          classes.push('status-settle') // 待结账 - 红色
          break
        case 3:
          classes.push('status-machine') // 待清台 - 蓝色
          break
        case 4:
          classes.push('status-prepare') // 预结账 - 橙色
          break
        default:
          classes.push('status-free') // 空桌 - 灰色
      }
      
      if (this.selectedTableId === table.id) {
        classes.push('selected')
      }
      
      return classes
    },
    
    // 获取状态颜色
    getStatusColor(state) {
      const colors = {
        1: '#3E9949', // 绿色
        2: '#FF4C54', // 红色
        3: '#2979ff', // 蓝色
        4: '#DC6523'  // 橙色
      }
      return colors[state] || '#666'
    },
    
    // 处理餐桌点击
    handleTableClick(table, index) {
      this.$emit('tableClick', table, index)
    },
    
    // 处理滚动
    handleScroll(scrollInfo) {
      this.$emit('scroll', scrollInfo)
    },
    
    // 处理加载更多
    handleLoadMore() {
      this.$emit('loadMore')
    },
    
    // 滚动到指定餐桌
    scrollToTable(tableId) {
      const index = this.tables.findIndex(table => table.id === tableId)
      if (index !== -1) {
        this.$refs.virtualList.scrollToIndex(index)
      }
    },
    
    // 刷新列表
    refresh() {
      this.$refs.virtualList.refresh()
    }
  }
}
</script>

<style lang="scss" scoped>
.virtual-table-list {
  width: 100%;
  height: 100%;
}

.table-item {
  position: relative;
  margin: 8px;
  border-radius: 10px;
  padding: 15px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
  }
}

.table-card {
  border-left: 4px solid #ddd;
  
  &.status-free {
    border-left-color: #ddd;
    background: #f9f9f9;
  }
  
  &.status-order {
    border-left-color: #3E9949;
    background: #f0f9f0;
  }
  
  &.status-settle {
    border-left-color: #FF4C54;
    background: #fff0f0;
  }
  
  &.status-machine {
    border-left-color: #2979ff;
    background: #f0f4ff;
  }
  
  &.status-prepare {
    border-left-color: #DC6523;
    background: #fff4f0;
  }
  
  &.selected {
    border: 2px solid #4275F4;
    box-shadow: 0 4px 12px rgba(66, 117, 244, 0.3);
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.table-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.scan-badge {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
}

.table-content {
  margin-bottom: 10px;
  min-height: 20px;
}

.table-status {
  font-size: 16px;
  color: #666;
}

.table-amount {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 6px;
  margin: -5px -5px 0 -5px;
}

.people-info,
.time-info {
  display: flex;
  align-items: center;
  
  .iconfont {
    margin-right: 4px;
    font-size: 14px;
  }
}

.selected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(66, 117, 244, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 10px;
}

.selected-icon {
  width: 24px;
  height: 24px;
  background: #4275F4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .iconfont {
    color: #fff;
    font-size: 14px;
  }
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

/* 响应式设计 */
@media (min-width: 1500px) and (max-width: 3280px) {
  .table-item {
    margin: 10px;
  }
  
  .table-name {
    font-size: 18px;
  }
  
  .table-status,
  .table-amount {
    font-size: 18px;
  }
}
</style>