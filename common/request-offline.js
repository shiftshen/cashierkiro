import config from '@/custom/config.js';
import site from '@/custom/siteroot.js';
import api from '@/api';
import i18n from '@/locale/index.js'
import offlineManager from './offline-manager.js'

// 可缓存的接口列表 - 这些接口的数据可以离线查看
const CACHEABLE_APIS = [
  '/channel/store/goods',           // 商品列表
  '/channel/store/goods/category',  // 商品分类
  '/channel/member',                // 会员信息
  '/channel/statistics',            // 统计数据
  '/channel/apply',                 // 店铺信息
  '/channel/profix',                // 用户信息
  '/channel/handover/starting'      // 交班信息
]

// 离线可操作的接口 - 这些操作可以离线执行，联网后同步
const OFFLINE_OPERATIONS = [
  '/channel/inStore/order',         // 下单
  '/channel/inStore/cart',          // 购物车操作
  '/channel/inStore/checkout',      // 结账
  '/channel/order',                 // 订单操作
  '/channel/member/changeIntegral', // 积分变更
  '/channel/member/changeBalance',  // 余额变更
  '/channel/inStore/order/pay',     // 支付
  '/channel/handover'               // 交班
]

// 缓存时间配置 (毫秒)
const CACHE_TTL = {
  '/channel/store/goods': 3600000,           // 商品列表 1小时
  '/channel/store/goods/category': 7200000,  // 商品分类 2小时
  '/channel/member': 1800000,                // 会员信息 30分钟
  '/channel/statistics': 900000,             // 统计数据 15分钟
  '/channel/apply': 7200000,                 // 店铺信息 2小时
  '/channel/profix': 3600000,                // 用户信息 1小时
  '/channel/handover/starting': 300000       // 交班信息 5分钟
}

export default {
  request: async function(option) {
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

    const fullUrl = site.siteroot + option.url
    const cacheKey = `${option.url}_${JSON.stringify(option.data || {})}`
    
    // 检查接口类型
    const isCacheable = CACHEABLE_APIS.some(api => option.url.includes(api))
    const isOfflineOperation = OFFLINE_OPERATIONS.some(api => option.url.includes(api))
    
    // 如果离线且是可缓存接口，尝试返回缓存数据
    if (!offlineManager.isOnline && isCacheable) {
      const cachedData = await offlineManager.getCachedData(cacheKey)
      if (cachedData) {
        if (option.mask) {
          uni.hideLoading();
        }
        console.log('🔄 返回缓存数据:', option.url)
        
        // 添加缓存标识
        cachedData.fromCache = true
        return cachedData
      } else {
        // 没有缓存数据，返回错误
        if (option.mask) {
          uni.hideLoading();
        }
        return {
          code: 500,
          msg: '离线模式下暂无缓存数据',
          data: null,
          offline: true
        }
      }
    }
    
    // 如果离线且是可离线操作，添加到队列
    if (!offlineManager.isOnline && isOfflineOperation) {
      const queueId = await offlineManager.addToQueue({
        type: 'api_request',
        url: fullUrl,
        method: option.method || 'GET',
        data: option.data,
        header: {
          contentType: config.contentType,
          appType: 'cashier',
          lang: i18n.locale,
          uniacid: uni.getStorageSync('uniacid'),
          storeId: uni.getStorageSync('storeId'),
          Authorization: `Bearer ${uni.getStorageSync('token')}`,
        },
        originalOption: option
      })
      
      if (option.mask) {
        uni.hideLoading();
      }
      
      // 触发队列更新事件
      uni.$emit('queue-updated')
      
      // 显示离线提示
      uni.showToast({
        title: '已保存到离线队列',
        icon: 'success',
        duration: 2000
      })
      
      // 返回离线响应
      return {
        code: 200,
        msg: '已添加到离线队列，联网后自动同步',
        data: { 
          offline: true, 
          queueId,
          timestamp: Date.now()
        },
        offline: true
      }
    }

    // 在线请求
    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        data: option.data ? option.data : {},
        method: option.method ? option.method : 'GET',
        header: {
          contentType: config.contentType,
          appType: 'cashier',
          lang: i18n.locale,
          uniacid: uni.getStorageSync('uniacid'),
          storeId: uni.getStorageSync('storeId'),
          Authorization: `Bearer ${uni.getStorageSync('token')}`,
        },
        complete: async (res) => {
          if (option.mask) {
            uni.hideLoading();
          }
          
          if (res?.data?.code == 200) {
            // 缓存成功响应的数据
            if (isCacheable && offlineManager.isOnline) {
              const ttl = CACHE_TTL[option.url] || 3600000 // 默认1小时
              await offlineManager.cacheData(cacheKey, res.data, ttl)
              console.log('💾 数据已缓存:', option.url)
            }
            resolve(res.data)
          } else {
            if (res?.data?.code == 400) {
              resolve(res.data)
              config.tokenErrorMessage(res.data.msg || res.msg)
            } else if (res?.data?.code == 401) {
              config.tokenErrorMessage(res.data.msg || res.msg)
              uni.removeStorageSync('token')
              uni.removeStorageSync('storeId')
              uni.reLaunch({
                url: `/pages/login/index`
              })
            } else {
              // 网络错误时，如果是可缓存接口，尝试返回缓存
              if (isCacheable) {
                const cachedData = await offlineManager.getCachedData(cacheKey)
                if (cachedData) {
                  console.log('🔄 网络错误，返回缓存数据:', option.url)
                  cachedData.fromCache = true
                  resolve(cachedData)
                  return
                }
              }
              config.tokenErrorMessage(res.data?.msg || res.msg || '网络请求失败')
            }
          }
        }
      });
    })
  }
}