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
      
      // 显示成功提示
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
    const info = safeStorage.getInfo();
    const keys = info.keys || [];
    
    keys.forEach(key => {
      if (key.includes('store_goods_list_') || 
          key.includes('goods_') || 
          key.includes('category_')) {
        safeStorage.remove(key);
      }
    });
  }

  /**
   * 清理分类缓存
   */
  async clearCategoryCache() {
    const info = safeStorage.getInfo();
    const keys = info.keys || [];
    
    keys.forEach(key => {
      if (key.includes('category_') || key.includes('goods_category')) {
        safeStorage.remove(key);
      }
    });
  }

  /**
   * 清理餐桌缓存
   */
  async clearTableCache() {
    const info = safeStorage.getInfo();
    const keys = info.keys || [];
    
    keys.forEach(key => {
      if (key.includes('table_') || key.includes('desk_')) {
        safeStorage.remove(key);
      }
    });
  }

  /**
   * 清理会员缓存
   */
  async clearMemberCache() {
    const info = safeStorage.getInfo();
    const keys = info.keys || [];
    
    keys.forEach(key => {
      if (key.includes('member_') || key.includes('user_')) {
        safeStorage.remove(key);
      }
    });
  }

  /**
   * 清理所有缓存
   */
  async clearAllCache() {
    const info = safeStorage.getInfo();
    const keys = info.keys || [];
    const preserveKeys = ['token', 'storeId', 'uniacid', 'user', 'config'];
    
    keys.forEach(key => {
      if (!preserveKeys.includes(key)) {
        safeStorage.remove(key);
      }
    });
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const info = safeStorage.getInfo();
    const keys = info.keys || [];
    
    const stats = {
      totalKeys: keys.length,
      goodsKeys: 0,
      categoryKeys: 0,
      tableKeys: 0,
      memberKeys: 0,
      otherKeys: 0,
      totalSize: 0
    };

    keys.forEach(key => {
      try {
        const data = safeStorage.get(key);
        if (data) {
          const size = JSON.stringify(data).length;
          stats.totalSize += size;

          if (key.includes('goods_') || key.includes('store_goods_list_')) {
            stats.goodsKeys++;
          } else if (key.includes('category_')) {
            stats.categoryKeys++;
          } else if (key.includes('table_') || key.includes('desk_')) {
            stats.tableKeys++;
          } else if (key.includes('member_') || key.includes('user_')) {
            stats.memberKeys++;
          } else {
            stats.otherKeys++;
          }
        }
      } catch (error) {
        console.warn(`Failed to read cache key ${key}:`, error);
      }
    });

    return stats;
  }

  /**
   * 自动清理过期缓存
   */
  async autoCleanExpiredCache() {
    console.log('🔄 开始自动清理过期缓存...');
    
    try {
      const info = safeStorage.getInfo();
      const keys = info.keys || [];
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      
      keys.forEach(key => {
        try {
          const data = safeStorage.get(key);
          if (data && data.timestamp && (now - data.timestamp > maxAge)) {
            safeStorage.remove(key);
            console.log(`🗑️ 清理过期缓存: ${key}`);
          }
        } catch (error) {
          console.warn(`Failed to check cache expiry for ${key}:`, error);
        }
      });
      
      console.log('✅ 自动清理完成');
      
    } catch (error) {
      console.error('❌ 自动清理失败:', error);
    }
  }
}

// 创建全局实例
const cacheManager = new CacheManager();

export default cacheManager;