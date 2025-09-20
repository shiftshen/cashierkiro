/**
 * 搜索优化器 - 提供防抖搜索功能
 */

/**
 * 创建防抖搜索函数
 * @param {Function} fn - 真正的搜索函数
 * @param {number} wait - 防抖延时 ms
 * @returns {Function} 防抖后的搜索函数
 */
function debounce(fn, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      fn(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function createDebouncedSearch(fn, wait = 300) {
  return debounce(async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("debounced search error:", e);
    }
  }, wait);
}

export default { 
  createDebouncedSearch 
};