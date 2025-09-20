/**
 * 消息适配器 - 解决原生插件方法未定义问题
 * 适用于 H5 和 APP 双端兼容
 */

/**
 * 安全的消息发送到HTML
 * @param {*} msg - 要发送的消息
 * @returns {string} - 处理后的消息字符串
 */
export function sndMsgToHtml(msg) {
  try {
    // #ifdef APP-PLUS
    // APP环境下尝试调用原生插件
    const plug = uni.requireNativePlugin("Html5app-TwoDisplay");
    if (plug && plug.sndMsgToHtml) {
      return plug.sndMsgToHtml(msg);
    }
    // #endif
    
    // H5环境或插件不可用时的降级处理
    if (typeof msg === 'string') {
      return msg;
    } else if (typeof msg === 'object') {
      return JSON.stringify(msg);
    } else {
      return String(msg || '');
    }
  } catch (error) {
    console.warn('sndMsgToHtml 调用失败:', error);
    return typeof msg === 'string' ? msg : JSON.stringify(msg || {});
  }
}

/**
 * 安全的原生插件调用包装器
 * @param {string} pluginName - 插件名称
 * @param {string} methodName - 方法名称
 * @param {*} params - 参数
 * @returns {*} - 调用结果
 */
export function safeNativeCall(pluginName, methodName, params) {
  try {
    // #ifdef APP-PLUS
    const plugin = uni.requireNativePlugin(pluginName);
    if (plugin && plugin[methodName]) {
      return plugin[methodName](params);
    } else {
      console.warn(`原生插件 ${pluginName}.${methodName} 未加载`);
      return null;
    }
    // #endif
    
    // #ifdef H5
    console.log(`H5环境模拟调用: ${pluginName}.${methodName}`, params);
    return null;
    // #endif
  } catch (error) {
    console.error(`调用原生插件失败: ${pluginName}.${methodName}`, error);
    return null;
  }
}

/**
 * 双屏显示适配器
 */
export const TwoDisplayAdapter = {
  /**
   * 显示内容到副屏
   * @param {Object} data - 显示数据
   */
  show(data) {
    return safeNativeCall('Html5app-TwoDisplay', 'show', data);
  },
  
  /**
   * 隐藏副屏内容
   */
  hide() {
    return safeNativeCall('Html5app-TwoDisplay', 'hide');
  },
  
  /**
   * 发送消息到HTML
   * @param {*} msg - 消息内容
   */
  sndMsgToHtml(msg) {
    return sndMsgToHtml(msg);
  }
};

/**
 * 串口通信适配器
 */
export const SerialPortAdapter = {
  /**
   * 打开串口
   * @param {Object} config - 串口配置
   */
  open(config) {
    return safeNativeCall('Fvv-UniSerialPort', 'open', config);
  },
  
  /**
   * 关闭串口
   */
  close() {
    return safeNativeCall('Fvv-UniSerialPort', 'close');
  },
  
  /**
   * 发送数据
   * @param {*} data - 要发送的数据
   */
  send(data) {
    return safeNativeCall('Fvv-UniSerialPort', 'send', data);
  }
};

export default {
  sndMsgToHtml,
  safeNativeCall,
  TwoDisplayAdapter,
  SerialPortAdapter
};