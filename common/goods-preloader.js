/**
 * 商品数据预加载器
 * 登录后预加载商品数据，提升翻页速度
 */

class GoodsPreloader {
  constructor() {
    this.cache = new Map()
    this.preloadQueue = []
    this.isPreloading = false
    this.maxCachePages = 10 // 最多缓存10页
    this.preloadDistance = 2 // 预加载前后2页
  }

  /**
   * 初始化预加载
   * @param {Object} queryForm - 查询参数
   * @param {Object} api - API对象
   * @param {Object} beg - 请求对象
   */
  async init(queryForm, api, beg) {
    this.queryForm = { ...queryForm }
    this.api = api
    this.beg = beg
    
    console.log('🚀 开始预加载商品数据...')
    
    // 预加载前3页数据
    await this.preloadPages([1, 2, 3])
  }

  /**
   * 预加载指定页面
   * @param {Array} pages - 页码数组
   */
  async preloadPages(pages) {
    if (this.isPreloading) return
    
    this.isPreloading = true
    
    try {
      const promises = pages.map(pageNo => this.loadPage(pageNo))
      await Promise.all(promises)
      console.log(`✅ 预加载完成: 页面 ${pages.join(', ')}`)
    } catch (error) {
      console.error('预加载失败:', error)
    } finally {
      this.isPreloading = false
    }
  }

  /**
   * 加载单页数据
   * @param {Number} pageNo - 页码
   */
  async loadPage(pageNo) {
    const cacheKey = this.getCacheKey(pageNo)
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const queryData = {
        ...this.queryForm,
        pageNo
      }

      const response = await this.beg.request({
        url: this.api.inStoreGoodsList,
        data: queryData,
      })

      const pageData = {
        list: response.data.list || [],
        total: response.data.total || 0,
        pageNo,
        timestamp: Date.now()
      }

      // 存入缓存
      this.cache.set(cacheKey, pageData)
      
      // 限制缓存大小
      if (this.cache.size > this.maxCachePages) {
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }

      console.log(`📦 已缓存第 ${pageNo} 页数据 (${pageData.list.length} 项)`)
      return pageData

    } catch (error) {
      console.error(`加载第 ${pageNo} 页失败:`, error)
      return null
    }
  }

  /**
   * 获取页面数据
   * @param {Number} pageNo - 页码
   */
  async getPage(pageNo) {
    const cacheKey = this.getCacheKey(pageNo)
    
    // 先从缓存获取
    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey)
      console.log(`🔄 从缓存获取第 ${pageNo} 页数据`)
      
      // 异步预加载相邻页面
      this.preloadAdjacentPages(pageNo)
      
      return cachedData
    }

    // 缓存未命中，立即加载
    console.log(`🌐 从服务器加载第 ${pageNo} 页数据`)
    const pageData = await this.loadPage(pageNo)
    
    // 预加载相邻页面
    this.preloadAdjacentPages(pageNo)
    
    return pageData
  }

  /**
   * 预加载相邻页面
   * @param {Number} currentPage - 当前页码
   */
  preloadAdjacentPages(currentPage) {
    const pagesToPreload = []
    
    // 预加载前后页面
    for (let i = 1; i <= this.preloadDistance; i++) {
      const prevPage = currentPage - i
      const nextPage = currentPage + i
      
      if (prevPage > 0) {
        pagesToPreload.push(prevPage)
      }
      
      pagesToPreload.push(nextPage)
    }
    
    // 过滤已缓存的页面
    const uncachedPages = pagesToPreload.filter(page => {
      const cacheKey = this.getCacheKey(page)
      return !this.cache.has(cacheKey)
    })
    
    if (uncachedPages.length > 0) {
      // 异步预加载，不阻塞当前操作
      setTimeout(() => {
        this.preloadPages(uncachedPages)
      }, 100)
    }
  }

  /**
   * 更新查询参数
   * @param {Object} newQueryForm - 新的查询参数
   */
  updateQuery(newQueryForm) {
    // 如果查询条件变化，清空缓存
    if (JSON.stringify(this.queryForm) !== JSON.stringify(newQueryForm)) {
      this.clearCache()
      this.queryForm = { ...newQueryForm }
      
      // 重新预加载前几页
      setTimeout(() => {
        this.preloadPages([1, 2, 3])
      }, 100)
    }
  }

  /**
   * 获取缓存键
   * @param {Number} pageNo - 页码
   */
  getCacheKey(pageNo) {
    const queryStr = JSON.stringify({
      ...this.queryForm,
      pageNo
    })
    return `goods_${btoa(queryStr).replace(/[^a-zA-Z0-9]/g, '')}`
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear()
    console.log('🗑️ 商品缓存已清空')
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      maxCachePages: this.maxCachePages,
      cachedPages: Array.from(this.cache.keys()),
      isPreloading: this.isPreloading
    }
  }

  /**
   * 强制刷新指定页面
   * @param {Number} pageNo - 页码
   */
  async refreshPage(pageNo) {
    const cacheKey = this.getCacheKey(pageNo)
    this.cache.delete(cacheKey)
    return await this.loadPage(pageNo)
  }
}

// 创建全局实例
const goodsPreloader = new GoodsPreloader()

export default goodsPreloader