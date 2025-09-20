/**
 * APP兼容性工具函数
 * 解决APP环境下的兼容性问题
 */

// 检测当前运行环境
export function getCurrentPlatform() {
  // #ifdef APP-PLUS
  return 'app';
  // #endif
  
  // #ifdef H5
  return 'h5';
  // #endif
  
  // #ifdef MP-WEIXIN
  return 'mp-weixin';
  // #endif
  
  return 'unknown';
}

// 检查组件是否在当前环境下兼容
export function isComponentCompatible(componentName) {
  const platform = getCurrentPlatform();
  
  // 不兼容APP的组件列表
  const appIncompatibleComponents = [
    // 已移除所有不兼容组件
  ];
  
  if (platform === 'app' && appIncompatibleComponents.includes(componentName)) {
    return false;
  }
  
  return true;
}

// 获取组件的替代方案
export function getComponentFallback(componentName) {
  const fallbacks = {
    // 统一使用兼容性组件
  };
  
  return fallbacks[componentName] || componentName;
}

// 设备类型检测优化（减少重复检测）
let _cachedDeviceInfo = null;
let _lastDetectionTime = 0;
const DETECTION_CACHE_TIME = 5000; // 5秒缓存

export function getDeviceInfo() {
  const now = Date.now();
  
  // 如果缓存有效，直接返回
  if (_cachedDeviceInfo && (now - _lastDetectionTime) < DETECTION_CACHE_TIME) {
    return _cachedDeviceInfo;
  }
  
  try {
    const systemInfo = uni.getSystemInfoSync();
    _cachedDeviceInfo = {
      platform: systemInfo.platform,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      pixelRatio: systemInfo.pixelRatio,
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      statusBarHeight: systemInfo.statusBarHeight,
      safeArea: systemInfo.safeArea,
      safeAreaInsets: systemInfo.safeAreaInsets,
      deviceType: getDeviceType(systemInfo.screenWidth),
      isApp: getCurrentPlatform() === 'app',
      isH5: getCurrentPlatform() === 'h5'
    };
    
    _lastDetectionTime = now;
    console.log('设备信息检测:', _cachedDeviceInfo);
    
    return _cachedDeviceInfo;
  } catch (error) {
    console.error('设备信息检测失败:', error);
    return {
      platform: 'unknown',
      deviceType: 'mobile',
      isApp: false,
      isH5: false
    };
  }
}

// 根据屏幕宽度判断设备类型
function getDeviceType(screenWidth) {
  if (screenWidth >= 1200) {
    return 'pc';
  } else if (screenWidth >= 768) {
    return 'pad';
  } else {
    return 'mobile';
  }
}

// 清除设备信息缓存
export function clearDeviceInfoCache() {
  _cachedDeviceInfo = null;
  _lastDetectionTime = 0;
}

// APP环境下的安全方法调用
export function safeCall(fn, fallback = () => {}) {
  try {
    if (typeof fn === 'function') {
      return fn();
    }
    return fallback();
  } catch (error) {
    console.warn('方法调用失败，使用fallback:', error);
    return fallback();
  }
}

// 检查原生插件是否可用
export function isNativePluginAvailable(pluginName) {
  // #ifdef APP-PLUS
  try {
    const plugin = uni.requireNativePlugin(pluginName);
    return plugin !== null && plugin !== undefined;
  } catch (error) {
    console.warn(`原生插件 ${pluginName} 不可用:`, error);
    return false;
  }
  // #endif
  
  return false;
}

// 模块加载检查
export function checkModuleCompatibility() {
  const platform = getCurrentPlatform();
  const incompatibleModules = [];
  
  if (platform === 'app') {
    // 所有组件已兼容
        solution: '使用app-chart组件替代'
      });
    }
    
    // 检查原生插件
    const requiredPlugins = ['Html5app-TwoDisplay', 'Fvv-UniSerialPort'];
    requiredPlugins.forEach(pluginName => {
      if (!isNativePluginAvailable(pluginName)) {
        incompatibleModules.push({
          name: pluginName,
          reason: '原生插件未正确配置或不可用',
          solution: '检查manifest.json中的nativePlugins配置'
        });
      }
    });
  }
  
  return incompatibleModules;
}

// 打印兼容性报告
export function printCompatibilityReport() {
  const platform = getCurrentPlatform();
  const deviceInfo = getDeviceInfo();
  const incompatibleModules = checkModuleCompatibility();
  
  console.log('=== APP兼容性报告 ===');
  console.log('当前平台:', platform);
  console.log('设备信息:', deviceInfo);
  
  if (incompatibleModules.length > 0) {
    console.warn('发现不兼容模块:', incompatibleModules);
    incompatibleModules.forEach(module => {
      console.warn(`- ${module.name}: ${module.reason}`);
      console.warn(`  解决方案: ${module.solution}`);
    });
  } else {
    console.log('所有模块兼容性检查通过');
  }
  
  console.log('==================');
}