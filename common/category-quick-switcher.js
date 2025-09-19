/**
 * 分类快速切换器
 * 专门优化分类切换速度的轻量级缓存
 */

class CategoryQuickSwitcher {
  constructor() {
    this.categoryCache = new Map()
    this.isInitialized = false
    this.pageSize = 30
  }

  /**
   * 初始化快速切换器
   * @param {Object} api - API对象
   * @param {Object} beg - 请求对象
   * @param {Object} baseQuery - 基础查询参数
   */
  async init(api, beg, baseQuery) {
    if (this.isInitialized) return

    this.api = api
    this.beg = beg
    this.baseQuery = { ...baseQuery }
    
    console.log('🚀 初始化分类快速切换器...')
    
    // 立即预加载前几个分类的第一页
    await this.preloadTopCategories()
    
    this.isInitialized = true
    console.log('✅ 分类快速切换器初始化完成')
  }

  /**
   * 预加载热门分类的第一页
   */
  async preloadTopCategories() {
    try {
      // 获取分类列表
      const categories = await this.getCategories()
      
      // 预加载前5个分类的第一页 + "全部"分类
      const topCategories = [null, ...categories.slice(0, 5)] // null表示"全部"
      
      const promises = topCategories.map(category => 
        this.loadCategoryFirstPage(category?.id || null, category?.name || '全部')
      )
      
      await Promise.all(promises)
      console.log(`⚡ 已预加载 ${topCategories.length} 个热门分类`)
      
    } catch (error) {
      console.error('预加载热门分类失败:', error)
    }
  }

  /**
   * 获取分类列表
   */
  async getCategories() {
    try {
      const response = await this.beg.request({
        url: this.api.inGoodsCategory,
        data: {
          pageNo: 1,
          pageSize: 20, // 只获取前20个分类
          state: this.baseQuery.state
        }
      })
      
      return response.data?.list || []
    } catch (error) {
      console.error('获取分类列表失败:', error)
      return []
    }
  }

  /**
   * 加载分类的第一页数据
   * @param {String} categoryId - 分类ID
   * @param {String} categoryName - 分类名称
   */
  async loadCategoryFirstPage(categoryId, categoryName) {
    try {
      const cacheKey = this.getCacheKey(categoryId)
      
      // 如果已缓存，跳过
      if (this.categoryCache.has(cacheKey)) {
        return
      }

      const queryData = {
        ...this.baseQuery,
        categoryId: categoryId,
        pageNo: 1,
        pageSize: this.pageSize
      }

      const response = await this.beg.request({
        url: this.api.inStoreGoodsList,
        data: queryData
      })

      const pageData = {
        list: response.data?.list || [],
        total: response.data?.total || 0,
        categoryId,
        categoryName,
        timestamp: Date.now()
      }

      this.categoryCache.set(cacheKey, pageData)
      console.log(`📦 已缓存分类 "${categoryName}" 第一页 (${pageData.list.length} 项)`)

    } catch (error) {
      console.error(`加载分类 ${categoryName} 失败:`, error)
    }
  }

  /**
   * 快速获取分类数据
   * @param {String} categoryId - 分类ID
   * @param {Number} pageNo - 页码
   */
  async getQuickData(categoryId, pageNo = 1) {
    const cacheKey = this.getCacheKey(categoryId)
    
    // 如果是第一页且已缓存，立即返回
    if (pageNo === 1 && this.categoryCache.has(cacheKey)) {
      const cachedData = this.categoryCache.get(cacheKey)
      console.log(`⚡ 快速切换分类缓存命中: ${cachedData.categoryName}`)
      return cachedData
    }

    // 如果未缓存或不是第一页，异步加载并缓存第一页
    if (pageNo === 1 && !this.categoryCache.has(cacheKey)) {
      // 立即开始加载，但不等待
      this.loadCategoryFirstPage(categoryId, `分类_${categoryId || '全部'}`)
    }

    return null
  }

  /**
   * 预加载指定分类
   * @param {String} categoryId - 分类ID
   * @param {String} categoryName - 分类名称
   */
  async preloadCategory(categoryId, categoryName) {
    await this.loadCategoryFirstPage(categoryId, categoryName)
  }

  /**
   * 获取缓存键
   * @param {String} categoryId - 分类ID
   */
  getCacheKey(categoryId) {
    return `quick_${categoryId || 'all'}`
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.categoryCache.clear()
    this.isInitialized = false
    console.log('🗑️ 分类快速切换器缓存已清空')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.categoryCache.size,
      isInitialized: this.isInitialized,
      cachedCategories: Array.from(this.categoryCache.keys())
    }
  }

  /**
   * 检查分类是否已缓存
   * @param {String} categoryId - 分类ID
   */
  isCached(categoryId) {
    const cacheKey = this.getCacheKey(categoryId)
    return this.categoryCache.has(cacheKey)
  }
}

// 创建全局实例
const categoryQuickSwitcher = new CategoryQuickSwitcher()

export default categoryQuickSwitcher