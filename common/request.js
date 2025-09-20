import config from '@/custom/config.js';
import site from '@/custom/siteroot.js';
import api from '@/api';
import i18n from '@/locale/index.js';

// 安全的存储操作封装
const safeStorage = {
  get(key) {
    try {
      return uni.getStorageSync(key) || null;
    } catch (error) {
      console.warn('Storage get operation failed:', error);
      return null;
    }
  },
  
  set(key, value) {
    try {
      uni.setStorageSync(key, value);
      return true;
    } catch (error) {
      console.warn('Storage set operation failed:', error);
      return false;
    }
  },
  
  remove(key) {
    try {
      uni.removeStorageSync(key);
      return true;
    } catch (error) {
      console.warn('Storage remove operation failed:', error);
      return false;
    }
  }
};

export default {
  request: function(option) {
    // 参数验证
    option = option || {};
    if (!option.url) {
      console.error('Request URL is required');
      return Promise.reject(new Error('Request URL is required'));
    }

    // 显示加载提示
    if (option.mask) {
      uni.showLoading({
        title: option.mask === 1 ? 'Loading...' : option.mask,
        mask: true
      });
    }
    
    // 获取存储的认证信息
    const uniacid = safeStorage.get('uniacid');
    const storeId = safeStorage.get('storeId');
    const token = safeStorage.get('token');
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: site.siteroot + option.url,
        data: option.data || {},
        method: option.method || 'GET',
        header: {
          'Content-Type': config.contentType,
          'appType': 'cashier',
          'lang': i18n.locale,
          'uniacid': uniacid,
          'storeId': storeId,
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (option.mask) {
            uni.hideLoading();
          }
          
          // 处理响应
          if (res.statusCode === 200 && res.data) {
            if (res.data.code === 200) {
              resolve(res.data);
            } else if (res.data.code === 400) {
              resolve(res.data);
              config.tokenErrorMessage(res.data.msg || '请求失败');
            } else if (res.data.code === 401) {
              // 处理认证失败
              config.tokenErrorMessage(res.data.msg || '认证失败，请重新登录');
              safeStorage.remove('token');
              safeStorage.remove('storeId');
              uni.reLaunch({
                url: '/pages/login/index'
              });
              reject(new Error('Authentication failed'));
            } else {
              const errorMsg = res.data.msg || '请求失败';
              config.tokenErrorMessage(errorMsg);
              reject(new Error(errorMsg));
            }
          } else {
            const errorMsg = '服务器响应异常';
            config.tokenErrorMessage(errorMsg);
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          if (option.mask) {
            uni.hideLoading();
          }
          
          console.error('Request failed:', err);
          const errorMsg = err.errMsg || '网络请求失败';
          config.tokenErrorMessage(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }
};