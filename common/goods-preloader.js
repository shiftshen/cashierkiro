/**
 * 商品数据预加载器
 * 登录后预加载商品数据，提升翻页速度
 */

class GoodsPreloader {
  constructor() {
    this.cache = new Map()
    this.preloadQueue = []
    this.isPreloading = false
    this.maxCachePages = 20 // 增加缓存页数，支持全部预加载
    this.preloadDistance = 2 // 预加载前后2页
    this.totalPages = 10 // 总页数，默认8页
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
    
    console.log('🚀 开始预加载所有商品数据...')
    
    // 先加载第1页获取总页数
    const firstPage = await this.loadPage(1)
    if (firstPage && firstPage.total) {
      // 计算总页数
      const pageSize = queryForm.pageSize || 30
      this.totalPages = Math.ceil(firstPage.total / pageSize)
      console.log(`📊 检测到总共 ${this.totalPages} 页商品数据`)
    }
    
    // 预加载所有页面
    const allPages = Array.from({length: this.totalPages}, (_, i) => i + 1)
    await this.preloadAllPages(allPages)
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
   * 预加载所有页面 (分批进行，避免并发过多)
   * @param {Array} pages - 页码数组
   */
  async preloadAllPages(pages) {
    if (this.isPreloading) return
    
    this.isPreloading = true
    console.log(`🔄 开始预加载全部 ${pages.length} 页数据...`)
    
    try {
      const batchSize = 3 // 每批3页，避免并发过多
      let loadedCount = 0
      
      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize)
        const promises = batch.map(pageNo => this.loadPage(pageNo))
        
        await Promise.all(promises)
        loadedCount += batch.length
        
        console.log(`📦 已预加载 ${loadedCount}/${pages.length} 页`)
        
        // 小延迟，避免请求过于密集
        if (i + batchSize < pages.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      console.log(`🎉 全部商品数据预加载完成！共 ${pages.length} 页`)
      console.log('📱 应用现在完全支持离线浏览商品')
      
    } catch (error) {
      console.error('批量预加载失败:', error)
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
      
      // 限制缓存大小 (但允许缓存所有页面)
      if (this.cache.size > this.maxCachePages && this.cache.size > this.totalPages) {
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
      
      // 重新预加载所有页面
      setTimeout(async () => {
        console.log('🔄 查询条件变化，重新预加载所有数据...')
        
        // 先加载第1页获取新的总页数
        const firstPage = await this.loadPage(1)
        if (firstPage && firstPage.total) {
          const pageSize = newQueryForm.pageSize || 30
          this.totalPages = Math.ceil(firstPage.total / pageSize)
          console.log(`📊 新查询条件下共 ${this.totalPages} 页数据`)
        }
        
        // 预加载所有页面
        const allPages = Array.from({length: this.totalPages}, (_, i) => i + 1)
        await this.preloadAllPages(allPages)
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

  /**
   * 检查离线可用性
   */
  checkOfflineAvailability() {
    const totalCached = this.cache.size
    const offlineRate = (totalCached / this.totalPages) * 100
    
    const status = {
      totalPages: this.totalPages,
      cachedPages: totalCached,
      offlineRate: Math.round(offlineRate),
      isFullyOffline: totalCached >= this.totalPages,
      missingPages: []
    }
    
    // 检查缺失的页面
    for (let i = 1; i <= this.totalPages; i++) {
      const cacheKey = this.getCacheKey(i)
      if (!this.cache.has(cacheKey)) {
        status.missingPages.push(i)
      }
    }
    
    return status
  }

  /**
   * 显示离线状态
   */
  showOfflineStatus() {
    const status = this.checkOfflineAvailability()
    
    console.log('📱 离线可用性状态:')
    console.log(`   总页数: ${status.totalPages}`)
    console.log(`   已缓存: ${status.cachedPages} 页`)
    console.log(`   离线率: ${status.offlineRate}%`)
    console.log(`   完全离线: ${status.isFullyOffline ? '✅ 是' : '❌ 否'}`)
    
    if (status.missingPages.length > 0) {
      console.log(`   缺失页面: ${status.missingPages.join(', ')}`)
    }
    
    return status
  }
}

// 创建全局实例
const goodsPreloader = new GoodsPreloader()

export default goodsPreloader