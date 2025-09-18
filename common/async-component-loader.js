/**
 * 异步组件加载器
 * 兼容 Vue 2 的异步组件语法
 */
export function createAsyncComponent(importFunc, options = {}) {
  // Vue 2 异步组件语法
  return () => ({
    component: importFunc(),
    loading: {
      template: '<view class="async-loading" style="padding: 20px; text-align: center; color: #999;">加载中...</view>'
    },
    error: {
      template: '<view class="async-error" style="padding: 20px; text-align: center; color: #f44336;">组件加载失败</view>'
    },
    delay: options.delay || 200,
    timeout: options.timeout || 10000
  })
}