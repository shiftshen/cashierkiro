/**
 * 全局缓存管理器
 * 统一管理所有缓存的清理和更新
 */

// 安全的存储操作封装
const safeStorage = {
  getInfo() {
    try {
      return uni.getStorageInfoSync();
    } catch (error) {
      console.warn('getStorageInfoSync failed:', error);
      return { keys: [] };
    }
  },
  
  get(key) {
    try {
      return uni.getStorageSync(key);
    } catch (error) {
      console.warn(`getStorageSync failed for key ${key}:`, error);
      return null;
    }
  },
  
  remove(key) {
    try {
      uni.removeStorageSync(key);
      return true;
    } catch (error) {
      console.warn(`removeStorageSync failed for key ${key}:`, error);
      return false;
    }
  }
};

class CacheManager {
  constructor() {
    this.cacheTypes = {
      GOODS: 'goods',
      CATEGORY: 'category',
      TABLE: 'table',
      MEMBER: 'member',
      ALL: 'all'
    };
  }

  /**
   * 清理指定类型的缓存
   * @param {String} type - 缓存类型
   */
  async clearCache(type = 'all') {
    console.log(`🗑️ 开始清理缓存: ${type}`);
    
    try {
      switch (type) {
        case this.cacheTypes.GOODS:
          await this.clearGoodsCache();
          break;
        case this.cacheTypes.CATEGORY:
          await this.clearCategoryCache();
          break;
        case this.cacheTypes.TABLE:
          await this.clearTableCache();
          break;
        case this.cacheTypes.MEMBER:
          await this.clearMemberCache();
          break;
        case this.cacheTypes.ALL:
        default:
          await this.clearAllCache();
          break;
      }
      
      uni.showToast({
        title: '缓存清理完成',
        icon: 'success',
        duration: 2000
      });
      
      console.log('✅ 缓存清理完成');
      
    } catch (error) {
      console.error('❌ 缓存清理失败:', error);
      
      uni.showToast({
        title: '缓存清理失败',
        icon: 'error',
        duration: 2000
      });
    }
  }

  /**
   * 清理商品缓存
   */
  async clearGoodsCache() {
    const storageInfo = safeStorage.getInfo();
    const keys = storageInfo.keys || [];
    
    for (const key of keys) {
      if (key.includes('goods_') || key.includes('product_')) {
        safeStorage.remove(key);
      }
    }
  }

  /**
   * 清理分类缓存
   */
  async clearCategoryCache() {
    const storageInfo = safeStorage.getInfo();
    const keys = storageInfo.keys || [];
    
    for (const key of keys) {
      if (key.includes('category_') || key.includes('goods_category')) {
        safeStorage.remove(key);
      }
    }
  }

  /**
   * 清理餐桌缓存
   */
  async clearTableCache() {
    const storageInfo = safeStorage.getInfo();
    const keys = storageInfo.keys || [];
    
    for (const key of keys) {
      if (key.includes('table_') || key.includes('desk_')) {
        safeStorage.remove(key);
      }
    }
  }

  /**
   * 清理会员缓存
   */
  async clearMemberCache() {
    const storageInfo = safeStorage.getInfo();
    const keys = storageInfo.keys || [];
    
    for (const key of keys) {
      if (key.includes('member_') || key.includes('user_')) {
        safeStorage.remove(key);
      }
    }
  }

  /**
   * 清理所有缓存
   */
  async clearAllCache() {
    const storageInfo = safeStorage.getInfo();
    const keys = storageInfo.keys || [];
    
    // 保留重要的系统数据
    const preserveKeys = [
      'user_info', 'token', 'storeInfo', 'storeId', 'store',
      'vipInfo', 'vipUserInfo', 'siteroot', 'handOver', 'cashierprint'
    ];
    
    for (const key of keys) {
      if (!preserveKeys.includes(key)) {
        safeStorage.remove(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const storageInfo = safeStorage.getInfo();
    const keys = storageInfo.keys || [];
    const stats = {
      totalKeys: keys.length,
      totalSize: 0,
      categories: {
        goods: 0,
        category: 0,
        table: 0,
        member: 0,
        other: 0
      }
    };

    for (const key of keys) {
      try {
        const data = safeStorage.get(key);
        if (data) {
          const size = JSON.stringify(data).length;
          stats.totalSize += size;
          
          if (key.includes('goods_') || key.includes('product_')) {
            stats.categories.goods++;
          } else if (key.includes('category_')) {
            stats.categories.category++;
          } else if (key.includes('table_') || key.includes('desk_')) {
            stats.categories.table++;
          } else if (key.includes('member_') || key.includes('user_')) {
            stats.categories.member++;
          } else {
            stats.categories.other++;
          }
        }
      } catch (error) {
        console.warn(`Failed to read cache key ${key}:`, error);
      }
    }

    return stats;
  }

  /**
   * 自动清理过期缓存
   */
  async autoCleanExpiredCache() {
    console.log('🔄 开始自动清理过期缓存...');
    
    const storageInfo = safeStorage.getInfo();
    const keys = storageInfo.keys || [];
    const now = Date.now();
    
    for (const key of keys) {
      if (key.endsWith('_cache_time')) {
        try {
          const data = safeStorage.get(key);
          if (data && typeof data === 'object' && data.expireTime) {
            if (now > data.expireTime) {
              safeStorage.remove(key);
              console.log(`🗑️ 清理过期缓存: ${key}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to check cache expiry for ${key}:`, error);
        }
      }
    }
  }
}

// 创建全局实例
const cacheManager = new CacheManager();

// 导出便捷方法
export const clearCache = (type) => cacheManager.clearCache(type);
export const getCacheStats = () => cacheManager.getCacheStats();
export const autoCleanExpiredCache = () => cacheManager.autoCleanExpiredCache();

export default cacheManager;