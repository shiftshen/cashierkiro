/**
 * UView UI APP兼容性修复
 * 解决 _compatibilityReported 未定义的问题
 */

// 在APP环境下初始化全局兼容性标记
// #ifdef APP-PLUS
if (typeof global !== 'undefined') {
  global._compatibilityReported = false;
}
// #endif

// 在H5环境下初始化window兼容性标记
// #ifdef H5
if (typeof window !== 'undefined') {
  window._compatibilityReported = false;
}
// #endif

/**
 * 修复UView组件的兼容性问题
 */
export function fixUViewCompatibility() {
  try {
    // #ifdef APP-PLUS
    // 为APP环境提供兼容性标记
    if (typeof global !== 'undefined' && typeof global._compatibilityReported === 'undefined') {
      global._compatibilityReported = false;
    }
    
    // 修复Vue实例上的兼容性检查
    const originalCreated = uni.$u?.config?.created;
    if (originalCreated && typeof originalCreated === 'function') {
      uni.$u.config.created = function() {
        try {
          return originalCreated.call(this);
        } catch (e) {
          console.warn('UView兼容性检查跳过:', e.message);
        }
      };
    }
    // #endif
    
    // #ifdef H5
    // 为H5环境提供兼容性标记
    if (typeof window !== 'undefined' && typeof window._compatibilityReported === 'undefined') {
      window._compatibilityReported = false;
    }
    // #endif
    
    console.log('UView兼容性修复已应用');
  } catch (error) {
    console.warn('UView兼容性修复失败:', error);
  }
}

/**
 * 安全的组件创建包装器
 */
export function safeComponentCreated(originalCreated) {
  return function() {
    try {
      if (typeof originalCreated === 'function') {
        return originalCreated.call(this);
      }
    } catch (error) {
      // 忽略兼容性相关错误
      if (error.message && error.message.includes('_compatibilityReported')) {
        console.warn('组件兼容性检查跳过:', this.$options.name || 'Unknown');
        return;
      }
      // 其他错误继续抛出
      throw error;
    }
  };
}

// 自动应用修复
fixUViewCompatibility();