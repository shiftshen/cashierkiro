/**
 * Network Security Configuration Tool
 * Handle HTTP cleartext traffic and mixed content issues in APP environment
 */

/**
 * 初始化网络安全配置
 */
export function initNetworkSecurity() {
  // #ifdef APP-PLUS
  if (window.plus) {
    plus.ready(() => {
      console.log('🔒 初始化APP网络安全配置');
      
      // 配置网络安全策略
      configureNetworkSecurity();
      
      // 处理HTTP明文传输
      handleCleartextTraffic();
    });
  }
  // #endif
}

/**
 * 配置网络安全策略
 */
function configureNetworkSecurity() {
  // #ifdef APP-PLUS
  try {
    // 允许特定域名的HTTP访问
    const allowedDomains = [
      'oss.zcwcloud.com',
      'api.zcwcloud.com',
      'cdn.zcwcloud.com',
      'localhost',
      '127.0.0.1',
      '192.168.',
      '10.0.'
    ];
    
    // 存储允许的域名列表
    uni.setStorageSync('allowed_http_domains', allowedDomains);
    
    console.log('✅ 网络安全策略配置完成');
  } catch (error) {
    console.error('❌ 网络安全策略配置失败:', error);
  }
  // #endif
}

/**
 * 处理HTTP明文传输
 */
function handleCleartextTraffic() {
  // #ifdef APP-PLUS
  try {
    // 检查Android版本
    if (plus.os.name === 'Android') {
      const version = parseInt(plus.os.version);
      
      if (version >= 9) {
        console.warn('⚠️ Android 9+ 检测到，HTTP明文传输可能被阻止');
        
        // 提供解决方案提示
        console.log('💡 解决方案：');
        console.log('1. 在manifest.json中配置网络安全');
        console.log('2. 使用HTTPS替代HTTP');
        console.log('3. 配置网络安全配置文件');
      }
    }
  } catch (error) {
    console.error('❌ HTTP明文传输处理失败:', error);
  }
  // #endif
}

/**
 * 检查URL是否允许HTTP访问
 */
export function isHttpAllowed(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // HTTPS总是允许的
  if (url.startsWith('https://')) {
    return true;
  }
  
  // 检查HTTP URL是否在允许列表中
  if (url.startsWith('http://')) {
    try {
      const allowedDomains = uni.getStorageSync('allowed_http_domains') || [];
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      return allowedDomains.some(domain => {
        if (domain.endsWith('.')) {
          return hostname.startsWith(domain);
        }
        return hostname === domain || hostname.includes(domain);
      });
    } catch (error) {
      console.error('URL检查失败:', error);
      return false;
    }
  }
  
  return true;
}

/**
 * 修复URL以支持网络安全策略
 */
export function fixUrlForSecurity(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  // #ifdef APP-PLUS
  // 在APP环境下处理HTTP URL
  if (url.startsWith('http://')) {
    // 检查是否允许HTTP访问
    if (!isHttpAllowed(url)) {
      console.warn('⚠️ HTTP URL可能被阻止:', url);
      
      // 尝试转换为HTTPS
      const httpsUrl = url.replace('http://', 'https://');
      console.log('🔄 尝试使用HTTPS:', httpsUrl);
      return httpsUrl;
    }
  }
  // #endif
  
  return url;
}

/**
 * 安全的网络请求包装器
 */
export function safeRequest(options) {
  if (!options || !options.url) {
    return Promise.reject(new Error('无效的请求选项'));
  }
  
  // 修复URL
  options.url = fixUrlForSecurity(options.url);
  
  // 添加错误处理
  const originalFail = options.fail;
  options.fail = (error) => {
    console.error('网络请求失败:', error);
    
    // 检查是否是网络安全相关错误
    if (error && error.errMsg) {
      if (error.errMsg.includes('cleartext') || 
          error.errMsg.includes('mixed content') ||
          error.errMsg.includes('net::ERR_CLEARTEXT_NOT_PERMITTED')) {
        console.error('❌ 网络安全策略阻止了请求');
        console.log('💡 建议使用HTTPS或配置网络安全策略');
      }
    }
    
    if (originalFail) {
      originalFail(error);
    }
  };
  
  return uni.request(options);
}

/**
 * 获取网络安全状态
 */
export function getNetworkSecurityStatus() {
  const status = {
    platform: '',
    version: '',
    httpsSupported: true,
    cleartextAllowed: false,
    recommendations: []
  };
  
  // #ifdef APP-PLUS
  if (plus.os) {
    status.platform = plus.os.name;
    status.version = plus.os.version;
    
    if (plus.os.name === 'Android') {
      const version = parseInt(plus.os.version);
      if (version >= 9) {
        status.cleartextAllowed = false;
        status.recommendations.push('配置网络安全策略允许HTTP明文传输');
        status.recommendations.push('使用HTTPS替代HTTP请求');
      } else {
        status.cleartextAllowed = true;
      }
    } else if (plus.os.name === 'iOS') {
      status.cleartextAllowed = true;
      status.recommendations.push('iOS默认允许HTTP，但建议使用HTTPS');
    }
  }
  // #endif
  
  // #ifdef H5
  status.platform = 'H5';
  status.cleartextAllowed = location.protocol === 'http:';
  if (location.protocol === 'https:') {
    status.recommendations.push('HTTPS环境下，HTTP资源可能被阻止');
  }
  // #endif
  
  return status;
}