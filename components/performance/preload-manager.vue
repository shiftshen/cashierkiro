<template>
  <view class="preload-manager">
    <view class="manager-header">
      <text class="title">智能预加载管理</text>
      <view class="status-controls">
        <switch :checked="config.enabled" @change="toggleEnabled" />
        <text class="status-text">{{ config.enabled ? '已启用' : '已禁用' }}</text>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-section">
      <text class="section-title">实时统计</text>
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-value">{{ stats.queueLength }}</text>
          <text class="stat-label">队列长度</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ stats.loadedCount }}</text>
          <text class="stat-label">已加载</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ stats.networkInfo.speed }}</text>
          <text class="stat-label">网络速度</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ stats.userBehaviorEntries }}</text>
          <text class="stat-label">行为记录</text>
        </view>
      </view>
    </view>

    <!-- 网络策略配置 -->
    <view class="config-section">
      <text class="section-title">网络策略</text>
      <view class="network-strategies">
        <view 
          v-for="(strategy, speed) in config.networkStrategies" 
          :key="speed"
          class="strategy-item"
          :class="{ active: stats.networkInfo.speed === speed }"
        >
          <view class="strategy-header">
            <text class="strategy-name">{{ getSpeedName(speed) }}</text>
            <text class="strategy-status">{{ stats.networkInfo.speed === speed ? '当前' : '' }}</text>
          </view>
          <view class="strategy-details">
            <text class="detail-item">并发数: {{ strategy.maxConcurrent }}</text>
            <text class="detail-item">阈值: {{ strategy.probabilityThreshold }}</text>
          </view>
          <view class="strategy-toggles">
            <view class="toggle-item">
              <text>页面预加载</text>
              <switch 
                :checked="strategy.enablePagePreload" 
                @change="updateStrategy(speed, 'enablePagePreload', $event.detail.value)"
              />
            </view>
            <view class="toggle-item">
              <text>图片预加载</text>
              <switch 
                :checked="strategy.enableImagePreload" 
                @change="updateStrategy(speed, 'enableImagePreload', $event.detail.value)"
              />
            </view>
            <view class="toggle-item">
              <text>API预加载</text>
              <switch 
                :checked="strategy.enableAPIPreload" 
                @change="updateStrategy(speed, 'enableAPIPreload', $event.detail.value)"
              />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 页面规则管理 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-title">页面预加载规则</text>
        <button @click="showAddPageRule = true" class="add-btn">添加规则</button>
      </view>
      <view class="rules-list">
        <view v-for="(rule, index) in config.pageRules" :key="index" class="rule-item">
          <view class="rule-content">
            <text class="rule-from">{{ rule.from }}</text>
            <text class="rule-arrow">→</text>
            <text class="rule-to">{{ rule.to }}</text>
            <text class="rule-probability">{{ (rule.probability * 100).toFixed(0) }}%</text>
          </view>
          <view class="rule-actions">
            <button @click="editPageRule(index)" class="edit-btn">编辑</button>
            <button @click="deletePageRule(index)" class="delete-btn">删除</button>
          </view>
        </view>
      </view>
    </view>

    <!-- API 规则管理 -->
    <view class="config-section">
      <view class="section-header">
        <text class="section-title">API 预加载规则</text>
        <button @click="showAddAPIRule = true" class="add-btn">添加规则</button>
      </view>
      <view class="api-rules-list">
        <view v-for="(rule, index) in config.apiRules" :key="index" class="api-rule-item">
          <view class="api-rule-header">
            <text class="trigger-page">{{ rule.trigger }}</text>
            <button @click="deleteAPIRule(index)" class="delete-btn">删除</button>
          </view>
          <view class="api-list">
            <view v-for="(api, apiIndex) in rule.apis" :key="apiIndex" class="api-item">
              <text class="api-url">{{ api.url }}</text>
              <text class="api-probability">{{ (api.probability * 100).toFixed(0) }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 行为分析 -->
    <view class="config-section">
      <text class="section-title">用户行为分析</text>
      <view class="behavior-config">
        <view class="config-item">
          <text>启用点击跟踪</text>
          <switch 
            :checked="config.behaviorAnalysis.trackClicks" 
            @change="updateBehaviorConfig('trackClicks', $event.detail.value)"
          />
        </view>
        <view class="config-item">
          <text>启用停留时间跟踪</text>
          <switch 
            :checked="config.behaviorAnalysis.trackStayTime" 
            @change="updateBehaviorConfig('trackStayTime', $event.detail.value)"
          />
        </view>
        <view class="config-item">
          <text>启用滚动跟踪</text>
          <switch 
            :checked="config.behaviorAnalysis.trackScrolling" 
            @change="updateBehaviorConfig('trackScrolling', $event.detail.value)"
          />
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions-section">
      <button @click="exportConfig" class="action-btn">导出配置</button>
      <button @click="showImportConfig = true" class="action-btn">导入配置</button>
      <button @click="resetConfig" class="action-btn danger">重置配置</button>
      <button @click="clearCache" class="action-btn">清理缓存</button>
    </view>

    <!-- 添加页面规则弹窗 -->
    <uni-popup ref="addPageRulePopup" type="center">
      <view class="popup-content">
        <text class="popup-title">添加页面规则</text>
        <view class="form-item">
          <text class="form-label">来源页面</text>
          <input v-model="newPageRule.from" placeholder="例: /pages/home/index" />
        </view>
        <view class="form-item">
          <text class="form-label">目标页面</text>
          <input v-model="newPageRule.to" placeholder="例: /pages/table/index" />
        </view>
        <view class="form-item">
          <text class="form-label">概率 (0-1)</text>
          <input v-model.number="newPageRule.probability" type="number" />
        </view>
        <view class="form-item">
          <text class="form-label">条件</text>
          <input v-model="newPageRule.condition" placeholder="例: business_flow" />
        </view>
        <view class="popup-actions">
          <button @click="cancelAddPageRule" class="cancel-btn">取消</button>
          <button @click="confirmAddPageRule" class="confirm-btn">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 导入配置弹窗 -->
    <uni-popup ref="importConfigPopup" type="center">
      <view class="popup-content">
        <text class="popup-title">导入配置</text>
        <textarea 
          v-model="importConfigText" 
          placeholder="粘贴配置 JSON..."
          class="config-textarea"
        ></textarea>
        <view class="popup-actions">
          <button @click="cancelImportConfig" class="cancel-btn">取消</button>
          <button @click="confirmImportConfig" class="confirm-btn">导入</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  name: 'PreloadManager',
  
  data() {
    return {
      config: {},
      stats: {},
      showAddPageRule: false,
      showAddAPIRule: false,
      showImportConfig: false,
      newPageRule: {
        from: '',
        to: '',
        probability: 0.8,
        condition: 'business_flow'
      },
      importConfigText: '',
      configManager: null,
      preloader: null
    }
  },
  
  async mounted() {
    await this.initManagers()
    this.loadConfig()
    this.startStatsUpdate()
  },
  
  methods: {
    // 初始化管理器
    async initManagers() {
      try {
        const configManagerModule = await import('@/common/preload-config-manager.js')
        const preloaderModule = await import('@/common/smart-resource-preloader.js')
        
        this.configManager = configManagerModule.default
        this.preloader = preloaderModule.default
      } catch (error) {
        console.error('初始化预加载管理器失败:', error)
        uni.showToast({
          title: '初始化失败',
          icon: 'error'
        })
      }
    },
    
    // 加载配置
    loadConfig() {
      if (this.configManager) {
        this.config = this.configManager.getConfig()
      }
    },
    
    // 开始统计更新
    startStatsUpdate() {
      this.updateStats()
      setInterval(() => {
        this.updateStats()
      }, 2000)
    },
    
    // 更新统计信息
    updateStats() {
      if (this.preloader) {
        this.stats = this.preloader.getStats()
      }
    },
    
    // 切换启用状态
    toggleEnabled(event) {
      const enabled = event.detail.value
      this.config.enabled = enabled
      this.configManager?.setEnabled(enabled)
      
      uni.showToast({
        title: enabled ? '预加载已启用' : '预加载已禁用',
        icon: 'success'
      })
    },
    
    // 更新网络策略
    updateStrategy(speed, key, value) {
      this.config.networkStrategies[speed][key] = value
      this.configManager?.updateConfig(this.config)
    },
    
    // 更新行为分析配置
    updateBehaviorConfig(key, value) {
      this.config.behaviorAnalysis[key] = value
      this.configManager?.updateConfig(this.config)
    },
    
    // 获取速度名称
    getSpeedName(speed) {
      const names = {
        'fast': '快速',
        'medium': '中等',
        'slow': '慢速',
        'very-slow': '极慢'
      }
      return names[speed] || speed
    },
    
    // 添加页面规则
    confirmAddPageRule() {
      if (!this.newPageRule.from || !this.newPageRule.to) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'error'
        })
        return
      }
      
      this.configManager?.addPageRule({ ...this.newPageRule })
      this.loadConfig()
      this.cancelAddPageRule()
      
      uni.showToast({
        title: '规则添加成功',
        icon: 'success'
      })
    },
    
    // 取消添加页面规则
    cancelAddPageRule() {
      this.showAddPageRule = false
      this.newPageRule = {
        from: '',
        to: '',
        probability: 0.8,
        condition: 'business_flow'
      }
    },
    
    // 编辑页面规则
    editPageRule(index) {
      // 这里可以实现编辑功能
      uni.showToast({
        title: '编辑功能待实现',
        icon: 'none'
      })
    },
    
    // 删除页面规则
    deletePageRule(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条规则吗？',
        success: (res) => {
          if (res.confirm) {
            this.configManager?.removeRule('page', index)
            this.loadConfig()
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 删除 API 规则
    deleteAPIRule(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条 API 规则吗？',
        success: (res) => {
          if (res.confirm) {
            this.configManager?.removeRule('api', index)
            this.loadConfig()
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 导出配置
    exportConfig() {
      if (this.configManager) {
        const configString = this.configManager.exportConfig()
        
        // 复制到剪贴板
        uni.setClipboardData({
          data: configString,
          success: () => {
            uni.showToast({
              title: '配置已复制到剪贴板',
              icon: 'success'
            })
          }
        })
      }
    },
    
    // 导入配置
    confirmImportConfig() {
      if (!this.importConfigText.trim()) {
        uni.showToast({
          title: '请输入配置内容',
          icon: 'error'
        })
        return
      }
      
      const success = this.configManager?.importConfig(this.importConfigText)
      if (success) {
        this.loadConfig()
        this.cancelImportConfig()
        uni.showToast({
          title: '配置导入成功',
          icon: 'success'
        })
      } else {
        uni.showToast({
          title: '配置格式错误',
          icon: 'error'
        })
      }
    },
    
    // 取消导入配置
    cancelImportConfig() {
      this.showImportConfig = false
      this.importConfigText = ''
    },
    
    // 重置配置
    resetConfig() {
      uni.showModal({
        title: '确认重置',
        content: '确定要重置为默认配置吗？这将清除所有自定义设置。',
        success: (res) => {
          if (res.confirm) {
            this.configManager?.resetToDefault()
            this.loadConfig()
            uni.showToast({
              title: '配置已重置',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 清理缓存
    clearCache() {
      uni.showModal({
        title: '确认清理',
        content: '确定要清理所有预加载缓存吗？',
        success: (res) => {
          if (res.confirm) {
            this.preloader?.cleanupCache()
            uni.showToast({
              title: '缓存已清理',
              icon: 'success'
            })
          }
        }
      })
    }
  }
}
</script>

<style lang=\"scss\" scoped>
.preload-manager {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.status-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-text {
  font-size: 14px;
  color: #666;
}

.stats-section, .config-section {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #2196F3;
  margin-bottom: 5px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.network-strategies {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.strategy-item {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  
  &.active {
    border-color: #2196F3;
    background: #f3f8ff;
  }
}

.strategy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.strategy-name {
  font-weight: bold;
  color: #333;
}

.strategy-status {
  font-size: 12px;
  color: #2196F3;
}

.strategy-details {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.detail-item {
  font-size: 12px;
  color: #666;
}

.strategy-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.rules-list, .api-rules-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-item, .api-rule-item {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px;
}

.rule-content {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.rule-from, .rule-to {
  font-size: 12px;
  color: #333;
}

.rule-arrow {
  color: #999;
}

.rule-probability {
  font-size: 12px;
  color: #2196F3;
  font-weight: bold;
}

.rule-actions {
  display: flex;
  gap: 8px;
}

.add-btn, .edit-btn, .delete-btn, .action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.add-btn {
  background: #4CAF50;
  color: white;
}

.edit-btn {
  background: #FF9800;
  color: white;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.action-btn {
  background: #2196F3;
  color: white;
  padding: 8px 16px;
  
  &.danger {
    background: #f44336;
  }
}

.behavior-config {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.popup-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
}

.popup-title {
  display: block;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.config-textarea {
  width: 100%;
  height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: #ccc;
  color: #333;
}

.confirm-btn {
  background: #2196F3;
  color: white;
}

.api-rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.trigger-page {
  font-weight: bold;
  color: #333;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.api-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.api-url {
  font-size: 12px;
  color: #666;
}

.api-probability {
  font-size: 12px;
  color: #2196F3;
  font-weight: bold;
}
</style>"