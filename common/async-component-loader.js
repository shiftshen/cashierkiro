/**
 * 异步组件加载器
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