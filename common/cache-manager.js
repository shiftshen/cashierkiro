/**
 * 全局缓存管理器
 * 统一管理所有缓存的清理和更新
 */

import categoryPreloader from './category-preloader.js'
import goodsPreloader from './goods-preloader.js'

class CacheManager {
  constructor() {
    this.cacheTypes = {
      GOODS: 'goods',
      CATEGORY: 'category', 
      TABLE: 'table',
      MEMBER: 'member',
      ALL: 'all'
    }
  }

  /**
   * 清理指定类型的缓存
   * @param {String} type - 缓存类型
   */
  async clearCache(type = 'all') {
    console.log(`🗑️ 开始清理缓存: ${type}`)
    
    try {
      switch (type) {
        case this.cacheTypes.GOODS:
          await this.clearGoodsCache()
          break
          
        case this.cacheTypes.CATEGORY:
          await this.clearCategoryCache()
          break
          
        case this.cacheTypes.TABLE:
          await this.clearTableCache()
          break
          
        case this.cacheTypes.MEMBER:
          await this.clearMemberCache()
          break
          
        case this.cacheTypes.ALL:
        default:
          await this.clearAllCache()
          break
      }
      
      // 显示成功提示
      uni.showToast({
        title: '缓存清理完成',
        icon: 'success',
        duration: 2000
      })
      
      console.log('✅ 缓存清理完成')
      
    } catch (error) {
      console.error('❌ 缓存清理失败:', error)
      
      uni.showToast({
        title: '缓存清理失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  /**
   * 清理商品缓存
   */
  async clearGoodsCache() {
    // 清理预加载器缓存
    goodsPreloader.clearCache()
    categoryPreloader.clearAllCache()
    
    // 清理本地存储中的商品缓存
    const keys = (function() {
          try {
            const info = uni.getStorageInfoSync()
            return info.keys || []
          } catch (error) {
            console.warn('getStorageInfoSync failed:', error)
            return []
          }
        })()
    keys.forEach(key => {
      if (key.includes('store_goods_list_') || 
          key.includes('goods_') || 
          key.includes('category_')) {
        try {
          uni.removeStorageSync(key)
        } catch (error) {
          console.warn('Storage operation failed:', error)
        }
      }
    })
  }

  /**
   * 清理分类缓存
   */
  async clearCategoryCache() {
    categoryPreloader.clearAllCache()
    
    const keys = (function() {
          try {
            const info = uni.getStorageInfoSync()
            return info.keys || []
          } catch (error) {
            console.warn('getStorageInfoSync failed:', error)
            return []
          }
        })()
    keys.forEach(key => {
      if (key.includes('category_') || key.includes('goods_category')) {
        try {
          uni.removeStorageSync(key)
        } catch (error) {
          console.warn('Storage operation failed:', error)
        }
      }
    })
  }

  /**
   * 清理餐桌缓存
   */
  async clearTableCache() {
    const keys = (function() {
          try {
            const info = uni.getStorageInfoSync()
            return info.keys || []
          } catch (error) {
            console.warn('getStorageInfoSync failed:', error)
            return []
          }
        })()
    keys.forEach(key => {
      if (key.includes('table_') || key.includes('desk_')) {
        try {
          uni.removeStorageSync(key)
        } catch (error) {
          console.warn('Storage operation failed:', error)
        }
      }
    })
  }

  /**
   * 清理会员缓存
   */
  async clearMemberCache() {
    const keys = (function() {
          try {
            const info = uni.getStorageInfoSync()
            return info.keys || []
          } catch (error) {
            console.warn('getStorageInfoSync failed:', error)
            return []
          }
        })()
    keys.forEach(key => {
      if (key.includes('member_') || key.includes('user_')) {
        try {
          uni.removeStorageSync(key)
        } catch (error) {
          console.warn('Storage operation failed:', error)
        }
      }
    })
  }

  /**
   * 清理所有缓存
   */
  async clearAllCache() {
    // 清理预加载器
    goodsPreloader.clearCache()
    categoryPreloader.clearAllCache()
    
    // 清理所有本地存储（保留重要数据）
    const keys = (function() {
          try {
            const info = uni.getStorageInfoSync()
            return info.keys || []
          } catch (error) {
            console.warn('getStorageInfoSync failed:', error)
            return []
          }
        })()
    const preserveKeys = ['token', 'storeId', 'uniacid', 'user', 'config']
    
    keys.forEach(key => {
      if (!preserveKeys.includes(key)) {
        try {
          uni.removeStorageSync(key)
        } catch (error) {
          console.warn('Storage operation failed:', error)
        }
      }
    })
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const keys = (function() {
          try {
            const info = uni.getStorageInfoSync()
            return info.keys || []
          } catch (error) {
            console.warn('getStorageInfoSync failed:', error)
            return []
          }
        })()
    const stats = {
      totalKeys: keys.length,
      goodsKeys: 0,
      categoryKeys: 0,
      tableKeys: 0,
      memberKeys: 0,
      otherKeys: 0,
      totalSize: 0
    }

    keys.forEach(key => {
      try {
        const data = uni.getStorageSync(key)
        const size = JSON.stringify(data).length
        stats.totalSize += size

        if (key.includes('goods_') || key.includes('store_goods_list_')) {
          stats.goodsKeys++
        } else if (key.includes('category_')) {
          stats.categoryKeys++
        } else if (key.includes('table_') || key.includes('desk_')) {
          stats.tableKeys++
        } else if (key.includes('member_') || key.includes('user_')) {
          stats.memberKeys++
        } else {
          stats.otherKeys++
        }
      } catch (error) {
        // 忽略读取错误的键
      }
    })

    return stats
  }

  /**
   * 检查缓存健康状态
   */
  checkCacheHealth() {
    const stats = this.getCacheStats()
    const health = {
      status: 'healthy',
      issues: [],
      recommendations: []
    }

    // 检查缓存大小
    if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
      health.status = 'warning'
      health.issues.push('缓存大小超过50MB')
      health.recommendations.push('建议清理部分缓存')
    }

    // 检查键数量
    if (stats.totalKeys > 1000) {
      health.status = 'warning'
      health.issues.push('缓存键数量过多')
      health.recommendations.push('建议清理旧缓存')
    }

    return health
  }

  /**
   * 自动清理过期缓存
   */
  async autoCleanExpiredCache() {
    console.log('🔄 开始自动清理过期缓存...')
    
    try {
      // 检查并清理过期的商品缓存
      categoryPreloader.clearExpiredCache()
      
      // 清理超过7天的旧缓存
      const keys = (function() {
          try {
            const info = uni.getStorageInfoSync()
            return info.keys || []
          } catch (error) {
            console.warn('getStorageInfoSync failed:', error)
            return []
          }
        })()
      const now = Date.now()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天
      
      keys.forEach(key => {
        try {
          const data = uni.getStorageSync(key)
          if (data && data.timestamp && (now - data.timestamp > maxAge)) {
            uni.removeStorageSync(key)
            console.log(`🗑️ 清理过期缓存: ${key}`)
          }
        } catch (error) {
          // 忽略错误
        }
      })
      
      console.log('✅ 自动清理完成')
      
    } catch (error) {
      console.error('❌ 自动清理失败:', error)
    }
  }

  /**
   * 启动定期清理
   */
  startPeriodicCleanup() {
    // 每小时检查一次
    setInterval(() => {
      this.autoCleanExpiredCache()
    }, 60 * 60 * 1000)
    
    console.log('⏰ 定期缓存清理已启动')
  }
}

// 创建全局实例
const cacheManager = new CacheManager()

// 启动定期清理
cacheManager.startPeriodicCleanup()

export default cacheManager