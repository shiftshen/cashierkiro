import { sndMsgToHtml } from '@/common/utils/msg-adapter.js';

export default {
  data() {
    return {
      pc: false,
      pad: false
    };
  },
  created() {
    const noop = () => {};
    
    // 基础方法兜底
    this.openSave = this.openSave || noop;
    this.changeLanguage = this.changeLanguage || noop;
    this.fetchData = this.fetchData || noop;
    this.changeType = this.changeType || noop;
    
    // 原生插件方法兜底
    this.sndMsgToHtml = this.sndMsgToHtml || sndMsgToHtml;
    
    // 设备类型检测
    this.detectDeviceType();
  },
  methods: {
    /**
     * 检测设备类型
     */
    detectDeviceType() {
      try {
        const systemInfo = uni.getSystemInfoSync();
        const { screenWidth, screenHeight, platform } = systemInfo;
        
        // 判断是否为平板
        this.pad = screenWidth >= 768 || screenHeight >= 768;
        
        // 判断是否为PC（H5环境下的大屏设备）
        // #ifdef H5
        this.pc = screenWidth >= 1024;
        // #endif
        
        // #ifdef APP-PLUS
        this.pc = false; // APP环境下不是PC
        // #endif
        
        console.log('设备类型检测:', { 
          pc: this.pc, 
          pad: this.pad, 
          screenWidth, 
          screenHeight, 
          platform 
        });
      } catch (error) {
        console.warn('设备类型检测失败:', error);
        this.pc = false;
        this.pad = false;
      }
    },
    
    /**
     * 安全的原生插件调用
     */
    safePluginCall(pluginName, methodName, params) {
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
  }
};