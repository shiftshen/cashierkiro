/**
 * 称重管理器
 * 处理称重商品的本地计算和数据管理
 */

class WeightManager {
  constructor() {
    // 缓存商品信息
    this.productCache = new Map()
    // 本地计算结果缓存
    this.calculationCache = new Map()
  }

  /**
   * 缓存商品信息
   * @param {Object} product - 商品信息
   */
  cacheProduct(product) {
    if (product && product.id) {
      this.productCache.set(product.id, { ...product })
      console.log(`📦 缓存商品信息: ${product.name || product.id}`)
    }
  }

  /**
   * 获取缓存的商品信息
   * @param {String|Number} productId - 商品ID
   * @returns {Object|null} 商品信息
   */
  getCachedProduct(productId) {
    return this.productCache.get(productId) || null
  }

  /**
   * 处理称重数据
   * @param {Number} weight - 称重重量(g)
   * @param {Object} product - 商品信息
   * @param {Object} context - 上下文信息
   * @returns {Object} 处理结果
   */
  processWeight(weight, product, context = {}) {
    try {
      // 参数验证
      if (!weight || weight <= 0) {
        throw new Error('无效的称重数据')
      }

      if (!product) {
        throw new Error('缺少商品信息')
      }

      // 缓存商品信息
      this.cacheProduct(product)

      // 计算单价(分/克)
      const pricePerGram = this.calculatePricePerGram(product)
      
      // 计算金额(分)
      const amount = Math.round(weight * pricePerGram)
      
      // 计算数量(用于购物车)
      const quantity = Math.round(weight * 100) // 转换为内部数量单位

      // 生成处理结果
      const result = {
        weight: weight,
        pricePerGram: pricePerGram,
        amount: amount,
        quantity: quantity,
        product: { ...product },
        context: { ...context },
        timestamp: Date.now()
      }

      // 缓存计算结果
      const cacheKey = `${product.id}_${weight}`
      this.calculationCache.set(cacheKey, result)

      console.log(`⚖️ 称重计算完成: ${weight}g -> ${amount}分`)
      return result

    } catch (error) {
      console.error('称重处理失败:', error)
      return {
        error: error.message,
        weight: weight,
        product: product
      }
    }
  }

  /**
   * 计算单价(分/克)
   * @param {Object} product - 商品信息
   * @returns {Number} 单价(分/克)
   */
  calculatePricePerGram(product) {
    try {
      // 获取商品价格(元)
      const price = parseFloat(product.price) || 0
      
      // 转换为分
      const priceInCents = price * 100
      
      // 默认按1000克计算单价(1kg)
      const baseWeight = 1000
      
      // 计算每克价格(分/克)
      return priceInCents / baseWeight
    } catch (error) {
      console.error('计算单价失败:', error)
      return 0
    }
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.productCache.clear()
    this.calculationCache.clear()
    console.log('🧹 称重管理器缓存已清理')
  }

  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计信息
   */
  getCacheStats() {
    return {
      productCacheSize: this.productCache.size,
      calculationCacheSize: this.calculationCache.size
    }
  }
}

// 导出单例
export default new WeightManager()