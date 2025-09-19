import config from '@/custom/config.js';
import site from '@/custom/siteroot.js';
import api from '@/api';
import i18n from '@/locale/index.js'

export default {
  request: async function(option) {
    // APP环境下的简化版本，避免兼容性问题
    if (option.mask) {
      uni.showLoading({
        title: option.mask == 1 ? 'Loading...' : option.mask,
        mask: true
      });
    }
    
    var option = option || {};
    if (!option.url) {
      return false;
    }
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: site.siteroot + option.url,
        data: option.data ? option.data : {},
        method: option.method ? option.method : 'GET',
        header: {
          contentType: config.contentType,
          appType: 'cashier',
          lang: i18n.locale,
          uniacid: (function() {
            try {
              return (function() {
            try {
              return uni.getStorageSync('uniacid')
            } catch (error) {
              console.warn('Storage operation failed:', error)
              return null
            }
          })(),
          storeId: (function() {
            try {
              return (function() {
            try {
              return uni.getStorageSync('storeId')
            } catch (error) {
              console.warn('Storage operation failed:', error)
              return null
            }
          })(),
          Authorization: `Bearer ${(function() {
            try {
              return (function() {
            try {
              return uni.getStorageSync('token')
            } catch (error) {
              console.warn('Storage operation failed:', error)
              return null
            }
          })()}`,
        },
        complete: (res) => {
          if (option.mask) {
            uni.hideLoading();
          }
          
          if (res?.data?.code == 200) {
            resolve(res.data)
          } else {
            if (res?.data?.code == 400) {
              resolve(res.data)
              config.tokenErrorMessage(res.data.msg || res.msg)
            } else if (res?.data?.code == 401) {
              config.tokenErrorMessage(res.data.msg || res.msg)
              (function() {
            try {
              return (function() {
            try {
              return uni.removeStorageSync('token')
            } catch (error) {
              console.warn('Storage operation failed:', error)
              return null
            }
          })()
              (function() {
            try {
              return (function() {
            try {
              return uni.removeStorageSync('storeId')
            } catch (error) {
              console.warn('Storage operation failed:', error)
              return null
            }
          })()
              uni.reLaunch({
                url: `/pages/login/index`
              })
            } else {
              config.tokenErrorMessage(res.data?.msg || res.msg || '网络请求失败')
            }
          }
        }
      });
    })
  }
}