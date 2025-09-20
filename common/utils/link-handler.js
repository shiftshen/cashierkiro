/**
 * APP环境下的链接处理工具
 * 防止外链顶替当前WebView，导致主页框架消失
 */

// 全局拦截外链点击事件
export function initLinkHandler() {
  console.log('[LinkHandler] 开始初始化链接处理器');
  
  // #ifdef H5
  // H5环境下使用DOM事件监听
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // 防止重复绑定
    if (window._linkHandlerInitialized) {
      console.log('[LinkHandler] H5环境已初始化，跳过');
      return;
    }
    
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      
      const href = a.getAttribute('href');
      if (!href) return;
      
      // 检查是否为外部链接
      if (/^https?:\/\//i.test(href)) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[LinkHandler] 拦截外链点击:', href);
        
        // H5环境下在新窗口打开
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }, true);
    
    window._linkHandlerInitialized = true;
    console.log('[LinkHandler] H5环境链接处理器初始化完成');
  }
  // #endif
  
  // #ifdef APP-PLUS
  // APP环境下不使用DOM事件，只设置标记
  if (typeof global !== 'undefined') {
    if (global._linkHandlerInitialized) {
      console.log('[LinkHandler] APP环境已初始化，跳过');
      return;
    }
    global._linkHandlerInitialized = true;
    console.log('[LinkHandler] APP环境链接处理器初始化完成（仅设置标记）');
  }
  // #endif
}

// 安全的图片预览
export function previewImage(urls, current = 0) {
  if (!Array.isArray(urls)) {
    urls = [urls];
  }
  
  // 过滤掉无效的URL
  const validUrls = urls.filter(url => url && typeof url === 'string');
  
  if (validUrls.length === 0) {
    console.warn('[LinkHandler] 没有有效的图片URL');
    return;
  }
  
  console.log('[LinkHandler] 预览图片:', validUrls);
  
  uni.previewImage({
    urls: validUrls,
    current: typeof current === 'number' ? current : validUrls.indexOf(current),
    success: () => {
      console.log('[LinkHandler] 图片预览成功');
    },
    fail: (error) => {
      console.error('[LinkHandler] 图片预览失败:', error);
      // 降级处理：尝试在新窗口打开
      const url = validUrls[current] || validUrls[0];
      if (url) {
        openExternalLink(url);
      }
    }
  });
}

// 安全的外部链接打开
export function openExternalLink(url) {
  if (!url || typeof url !== 'string') {
    console.warn('[LinkHandler] 无效的链接URL:', url);
    return;
  }
  
  console.log('[LinkHandler] 打开外部链接:', url);
  
  // #ifdef APP-PLUS
  if (typeof plus !== 'undefined' && plus.runtime) {
    plus.runtime.openURL(url);
    return;
  }
  // #endif
  
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  // #endif
  
  console.warn('[LinkHandler] 无法打开链接，环境不支持');
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
  if (url.startsWith('http://')) {
    console.warn('[LinkHandler] 检测到HTTP图片，建议使用HTTPS:', url);
    // 可以选择性地转换为HTTPS，但要确保目标服务器支持
    // return url.replace('http://', 'https://');
  }
  // #endif
  
  return url;
}

// 为模板提供的点击处理方法
export function handleLinkClick(url, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  if (isExternalLink(url)) {
    openExternalLink(url);
  } else {
    // 内部链接使用uni.navigateTo等方法处理
    console.log('[LinkHandler] 内部链接:', url);
  }
}