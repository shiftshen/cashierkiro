<template>
  <view class="app-chart-container">
    <!-- APP环境下使用简化的图表显示 -->
    <!-- #ifdef APP-PLUS -->
    <view class="chart-fallback">
      <view class="chart-title" v-if="title">{{ title }}</view>
      <view class="chart-data" v-if="chartData && chartData.series">
        <view class="data-item" v-for="(item, index) in chartData.series" :key="index">
          <view class="data-label">{{ item.name || `系列${index + 1}` }}</view>
          <view class="data-value">{{ formatValue(item.data) }}</view>
        </view>
      </view>
      <view class="chart-placeholder" v-else>
        <text>图表数据加载中...</text>
      </view>
    </view>
    <!-- #endif -->
    
    <!-- H5环境下使用Canvas绘制图表 -->
    <!-- #ifdef H5 -->
    <canvas 
      v-if="showChart"
      :canvas-id="canvasId"
      :id="canvasId"
      class="chart-canvas"
      @touchstart="handleTouch"
    ></canvas>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  name: 'AppChart',
  props: {
    type: {
      type: String,
      default: 'pie'
    },
    opts: {
      type: Object,
      default: () => ({})
    },
    chartData: {
      type: Object,
      default: () => ({})
    },
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      showChart: true,
      canvasId: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  },
  mounted() {
    // #ifdef APP-PLUS
    console.log('APP环境：使用简化图表显示');
    // #endif
    
    // #ifdef H5
    console.log('H5环境：使用完整图表组件');
    // #endif
  },
  methods: {
    formatValue(data) {
      if (Array.isArray(data)) {
        return data.reduce((sum, item) => {
          return sum + (typeof item === 'object' ? item.value || 0 : item || 0);
        }, 0);
      }
      return data || 0;
    },
    getIndex(e) {
      this.$emit('getIndex', e);
    }
  }
};
</script>

<style scoped>
.app-chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.chart-fallback {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  color: #333;
}

.chart-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.data-label {
  font-size: 14px;
  color: #666;
}

.data-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.chart-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
</style>