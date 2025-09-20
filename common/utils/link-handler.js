/**
 * APP环境下的链接处理工具
 * 防止外链顶替当前WebView，导致主页框架消失
 */

// 全局拦截外链点击事件
export function initLinkHandler() {
  // #ifdef H5
  // 防止重复绑定
  if (typeof window !== 'undefined' && window._linkHandlerInitialized) {
    return;
  }
  // #endif
  
  // #ifdef APP-PLUS
  // APP环境下检查全局标记
  if (typeof global !== 'undefined' && global._linkHandlerInitialized) {
    return;
  }
  // #endif
  
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    
    const href = a.getAttribute('href');
    if (!href) return;
    
    // 检查是否为外部链接
    if (/^https?:\/\//i.test(href)) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔗 拦截外链点击:', href);
      
      // #ifdef APP-PLUS
      // APP环境下使用系统浏览器打开
      if (window.plus && plus.runtime) {
        plus.runtime.openURL(href);
        return;
      }
      // #endif
      
      // H5环境下在新窗口打开
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, true);
  
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window._linkHandlerInitialized = true;
  }
  // #endif
  
  // #ifdef APP-PLUS
  if (typeof global !== 'undefined') {
    global._linkHandlerInitialized = true;
  }
  // #endif
  
  console.log('✅ 链接处理器已初始化');
}

// 安全的图片预览
export function previewImage(urls, current = 0) {
  if (!Array.isArray(urls)) {
    urls = [urls];
  }
  
  // 过滤掉无效的URL
  const validUrls = urls.filter(url => url && typeof url === 'string');
  
  if (validUrls.length === 0) {
    console.warn('没有有效的图片URL');
    return;
  }
  
  uni.previewImage({
    urls: validUrls,
    current: typeof current === 'number' ? current : validUrls.indexOf(current),
    success: () => {
      console.log('图片预览成功');
    },
    fail: (error) => {
      console.error('图片预览失败:', error);
      // 降级处理：尝试在新窗口打开
      const url = validUrls[current] || validUrls[0];
      if (url) {
        // #ifdef APP-PLUS
        if (window.plus && plus.runtime) {
          plus.runtime.openURL(url);
          return;
        }
        // #endif
        window.open(url, '_blank');
      }
    }
  });
}

// 安全的外部链接打开
export function openExternalLink(url) {
  if (!url || typeof url !== 'string') {
    console.warn('无效的链接URL:', url);
    return;
  }
  
  console.log('🌐 打开外部链接:', url);
  
  // #ifdef APP-PLUS
  if (window.plus && plus.runtime) {
    plus.runtime.openURL(url);
    return;
  }
  // #endif
  
  window.open(url, '_blank', 'noopener,noreferrer');
}

// 检查链接是否为外部链接
export function isExternalLink(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  return /^https?:\/\//i.test(url);
}

// 修复混合内容问题的图片URL
export function fixImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  // #ifdef APP-PLUS
  // APP环境下，如果是HTTP图片且当前页面是HTTPS，尝试转换为HTTPS
  if (url.startsWith('http://') && location.protocol === 'https:') {
    console.warn('检测到混合内容图片，尝试转换为HTTPS:', url);
    return url.replace('http://', 'https://');
  }
  // #endif
  
  return url;
}