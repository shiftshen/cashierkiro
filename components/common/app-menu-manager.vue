<template>
  <view class="app-menu-manager">
    <!-- APP环境下的菜单管理 -->
    <!-- #ifdef APP-PLUS -->
    <view class="menu-container">
      <view class="menu-header">
        <text class="menu-title">{{ title || '菜单管理' }}</text>
        <view class="menu-actions">
          <button class="action-btn" @click="refreshMenu">刷新</button>
          <button class="action-btn" @click="addItem" v-if="canAdd">添加</button>
        </view>
      </view>
      
      <view class="menu-content">
        <view class="menu-categories" v-if="categories && categories.length">
          <view 
            class="category-item" 
            :class="{ active: selectedCategory === category.id }"
            v-for="category in categories" 
            :key="category.id"
            @click="selectCategory(category)"
          >
            <text class="category-name">{{ category.name }}</text>
            <text class="category-count">({{ category.count || 0 }})</text>
          </view>
        </view>
        
        <view class="menu-items">
          <view 
            class="menu-item" 
            v-for="item in filteredItems" 
            :key="item.id"
            @click="selectItem(item)"
          >
            <view class="item-image" v-if="item.image">
              <image :src="item.image" mode="aspectFill" />
            </view>
            <view class="item-info">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-price" v-if="item.price">￥{{ item.price }}</text>
              <text class="item-desc" v-if="item.description">{{ item.description }}</text>
            </view>
            <view class="item-actions">
              <button class="edit-btn" @click.stop="editItem(item)">编辑</button>
              <button class="delete-btn" @click.stop="deleteItem(item)" v-if="canDelete">删除</button>
            </view>
          </view>
        </view>
        
        <view class="empty-state" v-if="!filteredItems || filteredItems.length === 0">
          <text>暂无菜单项</text>
          <button class="add-first-btn" @click="addItem" v-if="canAdd">添加第一个菜单项</button>
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
  name: 'AppMenuManager',
  props: {
    title: {
      type: String,
      default: '菜单管理'
    },
    categories: {
      type: Array,
      default: () => []
    },
    items: {
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
  data() {
    return {
      selectedCategory: null
    };
  },
  computed: {
    filteredItems() {
      if (!this.items) return [];
      if (!this.selectedCategory) return this.items;
      return this.items.filter(item => item.categoryId === this.selectedCategory);
    }
  },
  mounted() {
    console.log('菜单管理器已加载，当前环境:', this.getCurrentPlatform());
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
    
    selectCategory(category) {
      this.selectedCategory = this.selectedCategory === category.id ? null : category.id;
      this.$emit('categorySelected', category);
    },
    
    selectItem(item) {
      this.$emit('itemSelected', item);
    },
    
    refreshMenu() {
      this.$emit('refresh');
    },
    
    addItem() {
      this.$emit('addItem', { categoryId: this.selectedCategory });
    },
    
    editItem(item) {
      this.$emit('editItem', item);
    },
    
    deleteItem(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${item.name}"吗？`,
        success: (res) => {
          if (res.confirm) {
            this.$emit('deleteItem', item);
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.app-menu-manager {
  width: 100%;
  height: 100%;
}

.menu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.menu-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.menu-actions {
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

.menu-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.menu-categories {
  width: 200px;
  background: #f5f5f5;
  border-right: 1px solid #eee;
  overflow-y: auto;
}

.category-item {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-item.active {
  background: #007bff;
  color: white;
}

.category-name {
  font-size: 14px;
}

.category-count {
  font-size: 12px;
  opacity: 0.7;
}

.menu-items {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
}

.menu-item:hover {
  background: #f0f0f0;
}

.item-image {
  width: 60px;
  height: 60px;
  margin-right: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.item-image image {
  width: 100%;
  height: 100%;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.item-price {
  font-size: 14px;
  color: #e74c3c;
  font-weight: bold;
}

.item-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.item-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.edit-btn {
  background: #28a745;
  color: white;
}

.delete-btn {
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
</style>