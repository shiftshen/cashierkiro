<template>
  <view class="svg-icon" :style="iconStyle" @click="handleClick">
    <!-- 加号图标 -->
    <svg v-if="name === 'add'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" :fill="color"/>
    </svg>
    
    <!-- 减号图标 -->
    <svg v-else-if="name === 'minus'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" :fill="color"/>
    </svg>
    
    <!-- 用户图标 -->
    <svg v-else-if="name === 'user'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" :fill="color"/>
    </svg>
    
    <!-- 时间图标 -->
    <svg v-else-if="name === 'time'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" :fill="color"/>
      <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" :fill="color"/>
    </svg>
    
    <!-- 默认图标 -->
    <svg v-else viewBox="0 0 24 24" :width="size" :height="size">
      <circle cx="12" cy="12" r="10" :fill="color"/>
    </svg>
  </view>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    color: {
      type: String,
      default: '#333'
    }
  },
  
  computed: {
    iconStyle() {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: this.size + 'px',
        height: this.size + 'px'
      }
    }
  },
  
  methods: {
    handleClick() {
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
.svg-icon {
  cursor: pointer;
  transition: opacity 0.2s;
}

.svg-icon:hover {
  opacity: 0.8;
}
</style>