#!/usr/bin/env node

/**
 * 代码分割和懒加载优化脚本
 * 分析和优化uni-app的代码分割策略
 */

const fs = require('fs');
const path = require('path');

console.log('📦 DAMO Cashier 代码分割优化工具');
console.log('================================');

// 分析页面组件大小
function analyzePageComponents() {
  console.log('📊 分析页面组件大小...');
  
  const pagesDir = 'pages';
  const componentSizes = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.vue')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const size = content.length;
        const lines = content.split('\\n').length;
        
        componentSizes.push({
          path: filePath,
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          lines: lines,
          isPage: filePath.includes('/index.vue') || filePath.includes('/login/') || filePath.includes('/table/'),
          category: getComponentCategory(filePath)
        });
      }
    });
  }
  
  scanDirectory(pagesDir);
  
  // 按大小排序
  componentSizes.sort((a, b) => b.size - a.size);
  
  return componentSizes;
}

// 获取组件分类
function getComponentCategory(filePath) {
  if (filePath.includes('login')) return 'auth';
  if (filePath.includes('home')) return 'core';
  if (filePath.includes('table')) return 'table';
  if (filePath.includes('handover')) return 'management';
  if (filePath.includes('components')) return 'component';
  return 'other';
}

// 分析第三方库使用
function analyzeThirdPartyLibraries() {
  console.log('\\n📚 分析第三方库使用...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  const heavyLibraries = [];
  const lightLibraries = [];
  
  Object.keys(dependencies).forEach(lib => {
    // 根据已知的库大小进行分类
    const heavyLibs = ['echarts', 'moment', 'lodash', 'xlsx', 'pdf', 'chart'];
    const isHeavy = heavyLibs.some(heavy => lib.toLowerCase().includes(heavy));
    
    if (isHeavy) {
      heavyLibraries.push(lib);
    } else {
      lightLibraries.push(lib);
    }
  });
  
  return { heavyLibraries, lightLibraries };
}

// 生成代码分割建议
function generateCodeSplittingRecommendations(componentSizes, libraries) {
  console.log('\\n💡 代码分割建议:');
  console.log('================================');
  
  // 大型组件建议
  const largeComponents = componentSizes.filter(c => c.size > 10000);
  if (largeComponents.length > 0) {
    console.log('🔍 大型组件优化建议:');
    largeComponents.slice(0, 5).forEach(comp => {
      console.log(`   ${comp.path}: ${comp.sizeKB}KB (${comp.lines}行)`);
      
      if (comp.lines > 500) {
        console.log(`     建议: 拆分为多个子组件`);
      }
      if (comp.category === 'core') {
        console.log(`     建议: 核心组件，考虑预加载`);
      } else {
        console.log(`     建议: 非核心组件，使用懒加载`);
      }
    });
  }
  
  // 第三方库建议
  if (libraries.heavyLibraries.length > 0) {
    console.log('\\n📦 第三方库优化建议:');
    libraries.heavyLibraries.forEach(lib => {
      console.log(`   ${lib}:`);
      
      if (lib.includes('echarts')) {
        console.log(`     建议: 按需引入图表组件`);
        console.log(`     方案: import { BarChart } from 'echarts/charts'`);
      } else if (lib.includes('moment')) {
        console.log(`     建议: 替换为 dayjs (更轻量)`);
      } else if (lib.includes('lodash')) {
        console.log(`     建议: 按需引入工具函数`);
        console.log(`     方案: import debounce from 'lodash/debounce'`);
      } else {
        console.log(`     建议: 考虑按需加载或异步导入`);
      }
    });
  }
}

// 创建懒加载组件示例
function createLazyLoadingExamples() {
  console.log('\\n🚀 懒加载实现示例:');
  console.log('================================');
  
  // 创建异步组件加载器
  const asyncComponentLoader = `
// common/async-component-loader.js
/**
 * 异步组件加载器
 * 支持加载状态和错误处理
 */

export function createAsyncComponent(importFunc, options = {}) {
  return {
    component: importFunc,
    loading: options.loading || {
      template: '<view class="loading">加载中...</view>'
    },
    error: options.error || {
      template: '<view class="error">加载失败</view>'
    },
    delay: options.delay || 200,
    timeout: options.timeout || 10000
  }
}

// 使用示例
export const AsyncBilling = () => createAsyncComponent(
  () => import('@/pages/home/components/billing.vue'),
  {
    loading: { template: '<view class="loading">收银台加载中...</view>' }
  }
)

export const AsyncDesk = () => createAsyncComponent(
  () => import('@/pages/home/components/desk.vue'),
  {
    loading: { template: '<view class="loading">餐桌管理加载中...</view>' }
  }
)
`;

  fs.writeFileSync('common/async-component-loader.js', asyncComponentLoader);
  console.log('✅ 已创建异步组件加载器: common/async-component-loader.js');
  
  // 创建图表懒加载示例
  const chartLazyLoader = `
// common/chart-lazy-loader.js
/**
 * 图表组件懒加载
 * 按需加载echarts组件
 */

class ChartLazyLoader {
  constructor() {
    this.loadedCharts = new Set()
    this.echarts = null
  }

  async loadEcharts() {
    if (this.echarts) return this.echarts

    try {
      // 只加载核心echarts
      const echarts = await import('echarts/core')
      
      // 按需加载渲染器
      const { CanvasRenderer } = await import('echarts/renderers')
      
      // 注册渲染器
      echarts.use([CanvasRenderer])
      
      this.echarts = echarts
      console.log('📊 Echarts核心已加载')
      return echarts
    } catch (error) {
      console.error('Echarts加载失败:', error)
      throw error
    }
  }

  async loadChart(chartType) {
    if (this.loadedCharts.has(chartType)) {
      return this.echarts
    }

    const echarts = await this.loadEcharts()

    try {
      switch (chartType) {
        case 'bar':
          const { BarChart } = await import('echarts/charts')
          const { GridComponent, TooltipComponent } = await import('echarts/components')
          echarts.use([BarChart, GridComponent, TooltipComponent])
          break
          
        case 'line':
          const { LineChart } = await import('echarts/charts')
          const { GridComponent: GridComp, TooltipComponent: TooltipComp } = await import('echarts/components')
          echarts.use([LineChart, GridComp, TooltipComp])
          break
          
        case 'pie':
          const { PieChart } = await import('echarts/charts')
          const { TooltipComponent: TooltipComp2, LegendComponent } = await import('echarts/components')
          echarts.use([PieChart, TooltipComp2, LegendComponent])
          break
          
        default:
          console.warn('未知的图表类型:', chartType)
      }
      
      this.loadedCharts.add(chartType)
      console.log(\`📊 \${chartType}图表组件已加载\`)
      return echarts
    } catch (error) {
      console.error(\`\${chartType}图表加载失败:\`, error)
      throw error
    }
  }
}

export default new ChartLazyLoader()
`;

  fs.writeFileSync('common/chart-lazy-loader.js', chartLazyLoader);
  console.log('✅ 已创建图表懒加载器: common/chart-lazy-loader.js');
}

// 创建页面预加载配置
function createPagePreloadConfig() {
  console.log('\\n⚡ 创建页面预加载配置...');
  
  const preloadConfig = {
    "preloadRule": {
      "pages/home/index": {
        "network": "all",
        "packages": ["pages/table"]
      },
      "pages/login/index": {
        "network": "wifi",
        "packages": ["pages/home"]
      }
    },
    "optimization": {
      "subPackages": true,
      "treeShaking": {
        "enable": true
      }
    }
  };
  
  // 读取现有的pages.json
  const pagesJson = JSON.parse(fs.readFileSync('pages.json', 'utf8'));
  
  // 合并预加载配置
  Object.assign(pagesJson, preloadConfig);
  
  // 写回pages.json
  fs.writeFileSync('pages.json', JSON.stringify(pagesJson, null, 2));
  console.log('✅ 已更新 pages.json 预加载配置');
}

// 生成优化后的组件引用示例
function generateOptimizedComponentUsage() {
  console.log('\\n🔧 生成优化后的组件使用示例...');
  
  const optimizedHomeIndex = `
<!-- pages/home/index.vue 优化示例 -->
<template>
  <view class="home-container">
    <!-- 核心组件立即加载 -->
    <tool v-if="showTool" />
    
    <!-- 非核心组件懒加载 -->
    <component 
      :is="currentComponent" 
      v-if="currentComponent"
      @openOver="getOpen"
    />
    
    <!-- 加载状态 -->
    <view v-if="componentLoading" class="loading-container">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
import { createAsyncComponent } from '@/common/async-component-loader.js'

export default {
  components: {
    // 核心工具组件立即加载
    tool: () => import('@/components/tool/tool.vue'),
    
    // 业务组件懒加载
    billing: createAsyncComponent(
      () => import('./components/billing.vue'),
      { delay: 100 }
    ),
    desk: createAsyncComponent(
      () => import('./components/desk.vue'),
      { delay: 100 }
    ),
    callOrder: createAsyncComponent(
      () => import('./components/callOrder.vue'),
      { delay: 200 }
    )
  },
  
  data() {
    return {
      current: 0,
      currentComponent: null,
      componentLoading: false,
      showTool: true
    }
  },
  
  methods: {
    async changeTab(item, index) {
      this.componentLoading = true
      this.current = index
      
      try {
        // 根据tab动态加载对应组件
        switch(index) {
          case 0:
            this.currentComponent = 'billing'
            break
          case 1:
            this.currentComponent = 'desk'
            break
          case 2:
            this.currentComponent = 'callOrder'
            break
          default:
            this.currentComponent = null
        }
        
        // 等待组件加载完成
        await this.$nextTick()
        
      } catch (error) {
        console.error('组件加载失败:', error)
        uni.showToast({
          title: '页面加载失败',
          icon: 'none'
        })
      } finally {
        this.componentLoading = false
      }
    }
  }
}
</script>
`;

  fs.writeFileSync('examples/optimized-home-index.vue', optimizedHomeIndex);
  console.log('✅ 已创建优化示例: examples/optimized-home-index.vue');
}

// 主函数
function main() {
  const componentSizes = analyzePageComponents();
  const libraries = analyzeThirdPartyLibraries();
  
  console.log(`\n📊 组件分析结果:`);
  console.log(`   总组件数: ${componentSizes.length}`);
  console.log(`   大型组件: ${componentSizes.filter(c => c.size > 10000).length} 个`);
  console.log(`   页面组件: ${componentSizes.filter(c => c.isPage).length} 个`);
  
  console.log(`\n📚 依赖库分析:`);
  console.log(`   重型库: ${libraries.heavyLibraries.length} 个`);
  console.log(`   轻量库: ${libraries.lightLibraries.length} 个`);
  
  generateCodeSplittingRecommendations(componentSizes, libraries);
  createLazyLoadingExamples();
  createPagePreloadConfig();
  generateOptimizedComponentUsage();
  
  console.log('\\n🎉 代码分割优化分析完成!');
  console.log('\\n📋 实施步骤:');
  console.log('1. 使用 common/async-component-loader.js 实现组件懒加载');
  console.log('2. 参考 examples/optimized-home-index.vue 优化主页面');
  console.log('3. 使用 common/chart-lazy-loader.js 优化图表加载');
  console.log('4. 验证 pages.json 预加载配置');
  console.log('5. 测试组件加载性能');
}

main();