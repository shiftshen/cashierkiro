/**
 * 商品分类预加载器
 * 登录后预加载所有分类的商品数据到本地
 */

class CategoryPreloader {
  constructor() {
    this.categoryCache = new Map() // 分类缓存
    this.goodsCache = new Map()    // 商品缓存
    this.isPreloading = false
    this.preloadProgress = {
      total: 0,
      completed: 0,
      current: ''
    }
    this.maxCategories = 20        // 最多预加载20个分类
    this.maxGoodsPerCategory = 600 // 每个分类最多600个商品 (20页*30个)
    this.pageSize = 30             // 每页30个商品
    this.cacheVersion = '1.0'      // 缓存版本
    this.cacheExpiry = 24 * 60 * 60 * 1000 // 24小时过期
  }

  /**
   * 初始化并开始全量预加载
   * @param {Object} api - API对象
   * @param {Object} beg - 请求对象
   * @param {Object} queryForm - 基础查询参数
   */
  async initFullPreload(api, beg, queryForm) {
    if (this.isPreloading) {
      console.log('⏳ 预加载正在进行中...')
      return
    }

    // 检查缓存是否过期
    if (this.isCacheExpired()) {
      console.log('🗑️ 缓存已过期，清空旧缓存')
      this.clearAllCache()
    }

    // 如果已有缓存且未过期，跳过预加载
    if (this.goodsCache.size > 0) {
      console.log('📦 使用现有缓存，跳过预加载')
      return
    }

    this.api = api
    this.beg = beg
    this.baseQuery = { ...queryForm }
    
    console.log('🚀 开始全量预加载商品分类和数据...')
    this.isPreloading = true

    try {
      // 第一步：加载所有分类
      const categories = await this.loadAllCategories()
      
      if (categories && categories.length > 0) {
        // 限制分类数量
        const limitedCategories = categories.slice(0, this.maxCategories)
        console.log(`📋 限制预加载分类数量: ${limitedCategories.length}/${categories.length}`)
        
        // 第二步：预加载每个分类的商品
        await this.preloadAllCategoryGoods(limitedCategories)
      }
      
      // 保存缓存时间戳
      this.saveCacheTimestamp()
      console.log('🎉 全量预加载完成！')
      
    } catch (error) {
      console.error('❌ 全量预加载失败:', error)
    } finally {
      this.isPreloading = false
    }
  }

  /**
   * 加载所有商品分类
   */
  async loadAllCategories() {
    try {
      console.log('📋 加载商品分类...')
      
      const response = await this.beg.request({
        url: this.api.inGoodsCategory,
        data: {
          pageNo: 1,
          pageSize: 999, // 获取所有分类
          state: this.baseQuery.state
        }
      })

      const categories = response.data?.list || []
      
      // 缓存分类数据
      this.categoryCache.set('all_categories', {
        data: categories,
        timestamp: Date.now()
      })

      console.log(`✅ 已加载 ${categories.length} 个商品分类`)
      return categories

    } catch (error) {
      console.error('加载分类失败:', error)
      return []
    }
  }

  /**
   * 预加载所有分类的商品
   * @param {Array} categories - 分类列表
   */
  async preloadAllCategoryGoods(categories) {
    this.preloadProgress.total = categories.length + 1 // +1 for "全部"
    this.preloadProgress.completed = 0

    // 预加载"全部"分类（categoryId为空）
    await this.preloadCategoryGoods(null, '全部')

    // 预加载每个具体分类
    for (const category of categories) {
      await this.preloadCategoryGoods(category.id, category.name)
    }
  }

  /**
   * 预加载单个分类的所有商品
   * @param {String} categoryId - 分类ID
   * @param {String} categoryName - 分类名称
   */
  async preloadCategoryGoods(categoryId, categoryName) {
    try {
      this.preloadProgress.current = categoryName
      console.log(`📦 预加载分类: ${categoryName}`)

      const allGoods = []
      let pageNo = 1
      let hasMore = true

      // 分页加载该分类的所有商品
      while (hasMore && allGoods.length < this.maxGoodsPerCategory) {
        const queryData = {
          ...this.baseQuery,
          categoryId: categoryId,
          pageNo: pageNo,
          pageSize: this.pageSize // 每页30个商品
        }

        const response = await this.beg.request({
          url: this.api.inStoreGoodsList,
          data: queryData
        })

        const pageGoods = response.data?.list || []
        const total = response.data?.total || 0

        allGoods.push(...pageGoods)

        // 检查是否还有更多数据
        hasMore = pageGoods.length > 0 && allGoods.length < total
        pageNo++

        // 避免无限循环，限制最大页数
        if (pageNo > 20) { // 最多20页，每页30个 = 600个商品
          console.warn(`⚠️ 分类 ${categoryName} 页数过多，停止加载`)
          break
        }
      }

      // 缓存该分类的所有商品
      const cacheKey = this.getCategoryCacheKey(categoryId)
      this.goodsCache.set(cacheKey, {
        categoryId,
        categoryName,
        goods: allGoods,
        total: allGoods.length,
        timestamp: Date.now(),
        pages: this.splitIntoPages(allGoods)
      })

      this.preloadProgress.completed++
      console.log(`✅ ${categoryName}: ${allGoods.length} 个商品已缓存`)

    } catch (error) {
      console.error(`❌ 预加载分类 ${categoryName} 失败:`, error)
      this.preloadProgress.completed++
    }
  }

  /**
   * 检查缓存是否过期
   */
  isCacheExpired() {
    try {
      const timestamp = uni.getStorageSync('goods_cache_timestamp')
      if (!timestamp) return true
      
      const now = Date.now()
      const age = now - timestamp
      return age > this.cacheExpiry
    } catch (error) {
      return true
    }
  }

  /**
   * 保存缓存时间戳
   */
  saveCacheTimestamp() {
    try {
      uni.setStorageSync('goods_cache_timestamp', Date.now())
      uni.setStorageSync('goods_cache_version', this.cacheVersion)
    } catch (error) {
      console.error('保存缓存时间戳失败:', error)
    }
  }

  /**
   * 清理过期缓存
   */
  clearExpiredCache() {
    if (this.isCacheExpired()) {
      this.clearAllCache()
      console.log('🗑️ 已清理过期缓存')
    }
  }

  /**
   * 将商品列表分页
   * @param {Array} goods - 商品列表
   * @param {Number} pageSize - 每页大小
   */
  splitIntoPages(goods, pageSize = 30) {
    const pages = new Map()
    
    for (let i = 0; i < goods.length; i += pageSize) {
      const pageNo = Math.floor(i / pageSize) + 1
      const pageGoods = goods.slice(i, i + pageSize)
      
      pages.set(pageNo, {
        list: pageGoods,
        pageNo,
        total: goods.length
      })
    }
    
    return pages
  }

  /**
   * 获取分类的商品数据
   * @param {String} categoryId - 分类ID
   * @param {Number} pageNo - 页码
   */
  getCategoryGoods(categoryId, pageNo = 1) {
    const cacheKey = this.getCategoryCacheKey(categoryId)
    const categoryData = this.goodsCache.get(cacheKey)
    
    if (!categoryData) {
      console.log(`📭 分类 ${categoryId} 未缓存`)
      return null
    }

    const pageData = categoryData.pages.get(pageNo)
    if (!pageData) {
      console.log(`📭 分类 ${categoryId} 第 ${pageNo} 页未缓存`)
      return null
    }

    console.log(`📖 从缓存获取分类 ${categoryData.categoryName} 第 ${pageNo} 页`)
    return pageData
  }

  /**
   * 获取所有分类列表
   */
  getAllCategories() {
    const cached = this.categoryCache.get('all_categories')
    if (cached) {
      console.log('📖 从缓存获取分类列表')
      return cached.data
    }
    return null
  }

  /**
   * 搜索商品
   * @param {String} keyword - 搜索关键词
   * @param {String} categoryId - 分类ID（可选）
   */
  searchGoods(keyword, categoryId = null) {
    if (!keyword || keyword.trim() === '') {
      return []
    }

    const searchTerm = keyword.toLowerCase().trim()
    const results = []

    // 确定搜索范围
    const categoriesToSearch = categoryId 
      ? [this.getCategoryCacheKey(categoryId)]
      : Array.from(this.goodsCache.keys())

    categoriesToSearch.forEach(cacheKey => {
      const categoryData = this.goodsCache.get(cacheKey)
      if (categoryData) {
        const matchedGoods = categoryData.goods.filter(goods => 
          goods.name?.toLowerCase().includes(searchTerm) ||
          goods.description?.toLowerCase().includes(searchTerm) ||
          goods.code?.toLowerCase().includes(searchTerm)
        )
        results.push(...matchedGoods)
      }
    })

    console.log(`🔍 搜索 "${keyword}" 找到 ${results.length} 个商品`)
    return results
  }

  /**
   * 获取分类缓存键
   * @param {String} categoryId - 分类ID
   */
  getCategoryCacheKey(categoryId) {
    return categoryId ? `category_${categoryId}` : 'category_all'
  }

  /**
   * 获取预加载进度
   */
  getPreloadProgress() {
    return {
      ...this.preloadProgress,
      percentage: this.preloadProgress.total > 0 
        ? Math.round((this.preloadProgress.completed / this.preloadProgress.total) * 100)
        : 0,
      isPreloading: this.isPreloading
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const stats = {
      categoriesCount: this.categoryCache.size,
      goodsCategoriesCount: this.goodsCache.size,
      totalGoods: 0,
      cacheSize: 0,
      categories: []
    }

    this.goodsCache.forEach((categoryData, key) => {
      stats.totalGoods += categoryData.goods.length
      stats.categories.push({
        key,
        name: categoryData.categoryName,
        goodsCount: categoryData.goods.length,
        pagesCount: categoryData.pages.size
      })
    })

    return stats
  }

  /**
   * 清空所有缓存
   */
  clearAllCache() {
    this.categoryCache.clear()
    this.goodsCache.clear()
    
    // 清理本地存储
    try {
      uni.removeStorageSync('goods_cache_timestamp')
      uni.removeStorageSync('goods_cache_version')
      
      // 清理所有商品相关的缓存
      const keys = uni.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.includes('store_goods_list_') || key.includes('category_')) {
          uni.removeStorageSync(key)
        }
      })
    } catch (error) {
      console.error('清理本地存储失败:', error)
    }
    
    console.log('🗑️ 所有分类缓存已清空')
  }

  /**
   * 刷新指定分类
   * @param {String} categoryId - 分类ID
   */
  async refreshCategory(categoryId) {
    const cacheKey = this.getCategoryCacheKey(categoryId)
    this.goodsCache.delete(cacheKey)
    
    // 重新加载该分类
    const categoryName = categoryId ? `分类_${categoryId}` : '全部'
    await this.preloadCategoryGoods(categoryId, categoryName)
  }

  /**
   * 检查是否已完成预加载
   */
  isPreloadComplete() {
    return !this.isPreloading && this.goodsCache.size > 0
  }

  /**
   * 获取热门商品（基于缓存数据）
   * @param {Number} limit - 返回数量限制
   */
  getPopularGoods(limit = 20) {
    const allGoods = []
    
    this.goodsCache.forEach(categoryData => {
      allGoods.push(...categoryData.goods)
    })

    // 简单的热门算法：按价格和名称排序
    const popularGoods = allGoods
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, limit)

    console.log(`🔥 获取热门商品 ${popularGoods.length} 个`)
    return popularGoods
  }
}

// 创建全局实例
const categoryPreloader = new CategoryPreloader()

export default categoryPreloader