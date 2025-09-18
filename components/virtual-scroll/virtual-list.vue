<template>
  <view class="virtual-list" @scroll="handleScroll" :scroll-y="true" :style="containerStyle">
    <!-- 占位容器，撑开总高度 -->
    <view class="virtual-phantom" :style="{ height: totalHeight + 'px' }"></view>
    
    <!-- 可视区域内容 -->
    <view class="virtual-content" :style="{ transform: `translateY(${offset}px)` }">
      <view
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, index)"
        class="virtual-item"
        :style="getItemStyle(index)"
      >
        <slot :item="item" :index="item.originalIndex" :virtualIndex="index"></slot>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="virtual-loading">
      <slot name="loading">
        <text>加载中...</text>
      </slot>
    </view>
  </view>
</template>

<script>
/**
 * 虚拟滚动列表组件
 * 适用于大量数据的高性能渲染
 */
export default {
  name: 'VirtualList',
  props: {
    // 数据列表
    items: {
      type: Array,
      default: () => []
    },
    // 每项高度（固定高度模式）
    itemHeight: {
      type: Number,
      default: 60
    },
    // 可视区域显示的项目数量
    visibleCount: {
      type: Number,
      default: 10
    },
    // 缓冲区大小（上下各渲染多少项）
    bufferSize: {
      type: Number,
      default: 5
    },
    // 容器高度
    height: {
      type: [Number, String],
      default: '400px'
    },
    // 获取项目唯一key的函数
    keyField: {
      type: String,
      default: 'id'
    },
    // 是否启用动态高度
    dynamicHeight: {
      type: Boolean,
      default: false
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      scrollTop: 0,
      containerHeight: 0,
      itemHeights: [], // 动态高度模式下存储每项的高度
      estimatedHeight: 60 // 动态高度模式下的预估高度
    }
  },
  
  computed: {
    // 容器样式
    containerStyle() {
      return {
        height: typeof this.height === 'number' ? this.height + 'px' : this.height,
        overflow: 'hidden',
        position: 'relative'
      }
    },
    
    // 总高度
    totalHeight() {
      if (this.dynamicHeight) {
        return this.getDynamicTotalHeight()
      }
      return this.items.length * this.itemHeight
    },
    
    // 开始索引
    startIndex() {
      if (this.dynamicHeight) {
        return this.getDynamicStartIndex()
      }
      const index = Math.floor(this.scrollTop / this.itemHeight)
      return Math.max(0, index - this.bufferSize)
    },
    
    // 结束索引
    endIndex() {
      if (this.dynamicHeight) {
        return this.getDynamicEndIndex()
      }
      const index = Math.min(
        this.startIndex + this.visibleCount + this.bufferSize * 2,
        this.items.length
      )
      return index
    },
    
    // 可见项目
    visibleItems() {
      return this.items.slice(this.startIndex, this.endIndex).map((item, index) => ({
        ...item,
        originalIndex: this.startIndex + index
      }))
    },
    
    // 偏移量
    offset() {
      if (this.dynamicHeight) {
        return this.getDynamicOffset()
      }
      return this.startIndex * this.itemHeight
    }
  },
  
  mounted() {
    this.initContainer()
  },
  
  methods: {
    // 初始化容器
    initContainer() {
      this.$nextTick(() => {
        const query = uni.createSelectorQuery().in(this)
        query.select('.virtual-list').boundingClientRect(rect => {
          if (rect) {
            this.containerHeight = rect.height
          }
        }).exec()
      })
    },
    
    // 处理滚动事件
    handleScroll(e) {
      const { scrollTop } = e.detail
      this.scrollTop = scrollTop
      
      // 触发滚动事件
      this.$emit('scroll', {
        scrollTop,
        startIndex: this.startIndex,
        endIndex: this.endIndex
      })
      
      // 检查是否需要加载更多
      this.checkLoadMore()
    },
    
    // 检查是否需要加载更多
    checkLoadMore() {
      const threshold = 100 // 距离底部100px时触发
      const distanceToBottom = this.totalHeight - this.scrollTop - this.containerHeight
      
      if (distanceToBottom <= threshold && !this.loading) {
        this.$emit('loadMore')
      }
    },
    
    // 获取项目key
    getItemKey(item, index) {
      if (this.keyField && item[this.keyField] !== undefined) {
        return item[this.keyField]
      }
      return item.originalIndex || index
    },
    
    // 获取项目样式
    getItemStyle(index) {
      const style = {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0
      }
      
      if (this.dynamicHeight) {
        // 动态高度模式
        style.height = this.getItemHeight(this.startIndex + index) + 'px'
      } else {
        // 固定高度模式
        style.height = this.itemHeight + 'px'
      }
      
      return style
    },
    
    // 获取项目高度（动态高度模式）
    getItemHeight(index) {
      return this.itemHeights[index] || this.estimatedHeight
    },
    
    // 设置项目高度（动态高度模式）
    setItemHeight(index, height) {
      this.$set(this.itemHeights, index, height)
    },
    
    // 获取动态总高度
    getDynamicTotalHeight() {
      let total = 0
      for (let i = 0; i < this.items.length; i++) {
        total += this.getItemHeight(i)
      }
      return total
    },
    
    // 获取动态开始索引
    getDynamicStartIndex() {
      let height = 0
      for (let i = 0; i < this.items.length; i++) {
        const itemHeight = this.getItemHeight(i)
        if (height + itemHeight > this.scrollTop) {
          return Math.max(0, i - this.bufferSize)
        }
        height += itemHeight
      }
      return 0
    },
    
    // 获取动态结束索引
    getDynamicEndIndex() {
      const startIndex = this.getDynamicStartIndex()
      let height = this.getDynamicOffset()
      let endIndex = startIndex
      
      for (let i = startIndex; i < this.items.length; i++) {
        height += this.getItemHeight(i)
        endIndex = i
        if (height > this.scrollTop + this.containerHeight + this.bufferSize * this.estimatedHeight) {
          break
        }
      }
      
      return Math.min(endIndex + 1, this.items.length)
    },
    
    // 获取动态偏移量
    getDynamicOffset() {
      let offset = 0
      for (let i = 0; i < this.startIndex; i++) {
        offset += this.getItemHeight(i)
      }
      return offset
    },
    
    // 滚动到指定索引
    scrollToIndex(index) {
      let scrollTop = 0
      
      if (this.dynamicHeight) {
        for (let i = 0; i < index; i++) {
          scrollTop += this.getItemHeight(i)
        }
      } else {
        scrollTop = index * this.itemHeight
      }
      
      // 使用uni-app的滚动API
      uni.pageScrollTo({
        scrollTop: scrollTop,
        duration: 300
      })
    },
    
    // 刷新列表
    refresh() {
      this.scrollTop = 0
      if (this.dynamicHeight) {
        this.itemHeights = []
      }
      this.$emit('refresh')
    },
    
    // 更新项目高度（供外部调用）
    updateItemHeight(index, height) {
      if (this.dynamicHeight) {
        this.setItemHeight(index, height)
      }
    }
  },
  
  watch: {
    items: {
      handler() {
        // 数据变化时重新计算
        this.$nextTick(() => {
          this.initContainer()
        })
      },
      deep: true
    }
  }
}
</script>

<style lang="scss" scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.virtual-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.virtual-item {
  box-sizing: border-box;
}

.virtual-loading {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
}
</style>