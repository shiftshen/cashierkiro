/**
 * 智能预加载 Vue 插件
 * 自动集成到 Vue 应用中，跟踪用户行为并智能预加载资源
 */

import smartResourcePreloader from '@/common/smart-resource-preloader.js'

const SmartPreloaderPlugin = {
  install(Vue, options = {}) {
    // 配置选项
    const config = {
      enableBehaviorTracking: true,
      enableAutoPreload: true,
      debugMode: false,
      ...options
    }

    // 添加到 Vue 原型
    Vue.prototype.$preloader = smartResourcePreloader

    // 全局混入，自动跟踪页面访问
    Vue.mixin({
      data() {
        return {
          _pageEnterTime: 0
        }
      },

      mounted() {
        if (config.enableBehaviorTracking) {
          this._pageEnterTime = Date.now()
          this.trackPageVisit()
          this.setupClickTracking()
        }
      },

      beforeDestroy() {
        if (config.enableBehaviorTracking && this._pageEnterTime) {
          const stayTime = Date.now() - this._pageEnterTime
          this.trackStayTime(stayTime)
        }
      },

      methods: {
        // 跟踪页面访问
        trackPageVisit() {
          const pagePath = this.$route?.path || this.$mp?.page?.route
          if (pagePath) {
            smartResourcePreloader.trackPageVisit(pagePath)
            
            if (config.debugMode) {
              console.log('📊 页面访问跟踪:', pagePath)
            }
          }
        },

        // 跟踪停留时间
        trackStayTime(stayTime) {
          const pagePath = this.$route?.path || this.$mp?.page?.route
          if (pagePath && stayTime > 1000) { // 至少停留1秒
            smartResourcePreloader.trackStayTime(pagePath, stayTime)
            
            if (config.debugMode) {
              console.log('⏱️ 停留时间跟踪:', pagePath, stayTime + 'ms')
            }
          }
        },

        // 设置点击跟踪
        setupClickTracking() {
          if (!config.enableBehaviorTracking) return

          this.$nextTick(() => {
            const clickableElements = this.$el?.querySelectorAll('button, .clickable, [data-preload]')
            
            clickableElements?.forEach(element => {
              element.addEventListener('click', (event) => {
                this.handleElementClick(event, element)
              })
            })
          })
        },

        // 处理元素点击
        handleElementClick(event, element) {
          const targetPage = element.getAttribute('data-target-page') || 
                           element.getAttribute('data-preload') ||
                           this.inferTargetPage(element)

          if (targetPage) {
            smartResourcePreloader.trackClick(element, targetPage)
            
            if (config.debugMode) {
              console.log('🖱️ 点击跟踪:', element.tagName, targetPage)
            }
          }
        },

        // 推断目标页面
        inferTargetPage(element) {
          // 基于元素内容和类名推断目标页面
          const text = element.textContent?.toLowerCase() || ''
          const className = element.className?.toLowerCase() || ''

          if (text.includes('桌台') || className.includes('table')) {
            return '/pages/table/index'
          }
          if (text.includes('收银') || className.includes('cashier')) {
            return '/pages/home/index'
          }
          if (text.includes('支付') || className.includes('pay')) {
            return '/pages/table/orderPay'
          }
          if (text.includes('设置') || className.includes('setting')) {
            return '/pages/home/components/setup'
          }

          return null
        },

        // 手动预加载资源
        preloadResource(type, resource, options = {}) {
          smartResourcePreloader.preload(type, resource, options)
          
          if (config.debugMode) {
            console.log('🔄 手动预加载:', type, resource)
          }
        },

        // 预加载页面
        preloadPage(pagePath, probability = 0.8) {
          this.preloadResource('page', pagePath, { probability, reason: 'manual' })
        },

        // 预加载图片
        preloadImage(imagePath, probability = 0.7) {
          this.preloadResource('image', imagePath, { probability, reason: 'manual' })
        },

        // 预加载 API 数据
        preloadAPI(apiPath, probability = 0.9) {
          this.preloadResource('api', apiPath, { probability, reason: 'manual' })
        }
      }
    })

    // 全局指令：v-preload
    Vue.directive('preload', {
      bind(el, binding) {
        const { value, modifiers } = binding
        
        // 设置预加载属性
        if (typeof value === 'string') {
          el.setAttribute('data-preload', value)
        } else if (typeof value === 'object') {
          el.setAttribute('data-preload', value.resource || '')
          el.setAttribute('data-preload-type', value.type || 'page')
          el.setAttribute('data-preload-probability', value.probability || '0.8')
        }

        // 鼠标悬停预加载
        if (modifiers.hover) {
          el.addEventListener('mouseenter', () => {
            const resource = el.getAttribute('data-preload')
            const type = el.getAttribute('data-preload-type') || 'page'
            const probability = parseFloat(el.getAttribute('data-preload-probability')) || 0.8

            if (resource) {
              smartResourcePreloader.preload(type, resource, { 
                probability, 
                reason: 'hover' 
              })
            }
          })
        }

        // 立即预加载
        if (modifiers.immediate) {
          const resource = el.getAttribute('data-preload')
          const type = el.getAttribute('data-preload-type') || 'page'
          const probability = parseFloat(el.getAttribute('data-preload-probability')) || 0.8

          if (resource) {
            smartResourcePreloader.preload(type, resource, { 
              probability, 
              reason: 'immediate' 
            })
          }
        }
      }
    })

    // 全局组件：PreloadLink
    Vue.component('PreloadLink', {
      props: {
        to: {
          type: String,
          required: true
        },
        preloadType: {
          type: String,
          default: 'page'
        },
        probability: {
          type: Number,
          default: 0.8
        },
        preloadOn: {
          type: String,
          default: 'hover', // hover, click, immediate
          validator: value => ['hover', 'click', 'immediate'].includes(value)
        }
      },

      mounted() {
        if (this.preloadOn === 'immediate') {
          this.triggerPreload()
        }
      },

      methods: {
        triggerPreload() {
          smartResourcePreloader.preload(this.preloadType, this.to, {
            probability: this.probability,
            reason: this.preloadOn
          })
        },

        handleMouseEnter() {
          if (this.preloadOn === 'hover') {
            this.triggerPreload()
          }
        },

        handleClick() {
          if (this.preloadOn === 'click') {
            this.triggerPreload()
          }
          
          // 执行导航
          this.$emit('click')
        }
      },

      render(h) {
        return h('view', {
          class: 'preload-link',
          on: {
            mouseenter: this.handleMouseEnter,
            click: this.handleClick
          }
        }, this.$slots.default)
      }
    })

    // 添加全局方法
    Vue.prototype.$getPreloaderStats = () => {
      return smartResourcePreloader.getStats()
    }

    Vue.prototype.$exportBehaviorData = () => {
      return smartResourcePreloader.exportBehaviorData()
    }

    Vue.prototype.$cleanupPreloaderCache = () => {
      smartResourcePreloader.cleanupCache()
    }

    // 开发模式下的调试工具
    if (config.debugMode && process.env.NODE_ENV === 'development') {
      // 添加到全局对象以便调试
      window.__SMART_PRELOADER__ = smartResourcePreloader
      
      // 定期输出统计信息
      setInterval(() => {
        const stats = smartResourcePreloader.getStats()
        console.log('📊 预加载器统计:', stats)
      }, 30000) // 每30秒输出一次
    }

    console.log('🚀 智能预加载插件已安装')
  }
}

export default SmartPreloaderPlugin