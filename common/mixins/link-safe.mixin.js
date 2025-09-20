/**
 * 链接安全处理Mixin
 * 为所有组件提供安全的链接和图片处理方法
 */

import { previewImage, openExternalLink, fixImageUrl } from '@/common/utils/link-handler.js'

export default {
  methods: {
    // 安全的图片预览
    $previewImage(urls, current = 0) {
      previewImage(urls, current)
    },
    
    // 安全的外部链接打开
    $openLink(url) {
      openExternalLink(url)
    },
    
    // 修复图片URL
    $fixImageUrl(url) {
      return fixImageUrl(url)
    },
    
    // 处理图片点击事件
    handleImageClick(url, urls = null) {
      if (urls && Array.isArray(urls)) {
        const index = urls.indexOf(url)
        this.$previewImage(urls, index >= 0 ? index : 0)
      } else {
        this.$previewImage([url], 0)
      }
    },
    
    // 处理链接点击事件
    handleLinkClick(url, event = null) {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }
      this.$openLink(url)
    }
  }
}