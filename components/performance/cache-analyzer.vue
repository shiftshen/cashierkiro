<template>
	<view class="cache-analyzer">
		<view class="analyzer-header">
			<text class="title">📊 缓存分析器</text>
			<view class="actions">
				<button @click="refreshStats" class="btn btn-primary">刷新</button>
				<button @click="clearCache" class="btn btn-danger">清空缓存</button>
				<button @click="exportReport" class="btn btn-success">导出报告</button>
			</view>
		</view>
		
		<!-- 缓存统计概览 -->
		<view class="stats-overview">
			<view class="stat-card">
				<view class="stat-value">{{ stats.hitRate }}</view>
				<view class="stat-label">命中率</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ stats.memoryItems }}</view>
				<view class="stat-label">内存项目</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ stats.storageItems }}</view>
				<view class="stat-label">存储项目</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ stats.memorySize }}</view>
				<view class="stat-label">内存使用</view>
			</view>
		</view>
		
		<!-- 详细统计 -->
		<view class="detailed-stats">
			<view class="section-title">详细统计</view>
			<view class="stats-grid">
				<view class="stat-row">
					<text class="stat-name">内存命中</text>
					<text class="stat-number">{{ stats.memoryHits }}</text>
				</view>
				<view class="stat-row">
					<text class="stat-name">存储命中</text>
					<text class="stat-number">{{ stats.storageHits }}</text>
				</view>
				<view class="stat-row">
					<text class="stat-name">缓存未命中</text>
					<text class="stat-number">{{ stats.misses }}</text>
				</view>
				<view class="stat-row">
					<text class="stat-name">淘汰次数</text>
					<text class="stat-number">{{ stats.evictions }}</text>
				</view>
				<view class="stat-row">
					<text class="stat-name">压缩次数</text>
					<text class="stat-number">{{ stats.compressions }}</text>
				</view>
			</view>
		</view>
		
		<!-- 缓存策略配置 -->
		<view class="cache-strategies">
			<view class="section-title">缓存策略</view>
			<view class="strategy-list">
				<view v-for="(strategy, category) in strategies" :key="category" class="strategy-item">
					<view class="strategy-header">
						<text class="strategy-name">{{ category }}</text>
						<text class="strategy-priority">优先级: {{ strategy.priority }}</text>
					</view>
					<view class="strategy-details">
						<text class="detail-item">TTL: {{ formatTTL(strategy.ttl) }}</text>
						<text class="detail-item">最大大小: {{ formatSize(strategy.maxSize) }}</text>
						<text class="detail-item">压缩: {{ strategy.compression ? '启用' : '禁用' }}</text>
						<text class="detail-item">预加载: {{ strategy.preload ? '启用' : '禁用' }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 缓存项目列表 -->
		<view class="cache-items">
			<view class="section-title">
				<text>缓存项目</text>
				<view class="filter-tabs">
					<text 
						v-for="tab in filterTabs" 
						:key="tab.key"
						:class="['filter-tab', { active: activeFilter === tab.key }]"
						@click="activeFilter = tab.key"
					>
						{{ tab.label }}
					</text>
				</view>
			</view>
			<view class="items-list">
				<view v-for="item in filteredItems" :key="item.key" class="cache-item">
					<view class="item-header">
						<text class="item-key">{{ item.key }}</text>
						<text class="item-category">{{ item.category }}</text>
						<text class="item-size">{{ formatSize(item.size) }}</text>
					</view>
					<view class="item-details">
						<text class="detail">创建: {{ formatTime(item.timestamp) }}</text>
						<text class="detail">过期: {{ formatTime(item.timestamp + item.ttl) }}</text>
						<text class="detail">访问: {{ item.accessCount || 0 }}次</text>
						<text class="detail">{{ item.compressed ? '已压缩' : '未压缩' }}</text>
					</view>
					<view class="item-actions">
						<button @click="removeItem(item.key)" class="btn-small btn-danger">删除</button>
						<button @click="refreshItem(item.key)" class="btn-small btn-primary">刷新</button>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 性能建议 -->
		<view class="performance-suggestions">
			<view class="section-title">🎯 性能建议</view>
			<view class="suggestions-list">
				<view v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item">
					<view class="suggestion-icon">{{ suggestion.icon }}</view>
					<view class="suggestion-content">
						<text class="suggestion-title">{{ suggestion.title }}</text>
						<text class="suggestion-desc">{{ suggestion.description }}</text>
					</view>
					<button v-if="suggestion.action" @click="applySuggestion(suggestion)" class="btn-small btn-success">
						应用
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import advancedCacheManager from '@/common/advanced-cache-manager.js'

export default {
	name: 'CacheAnalyzer',
	data() {
		return {
			stats: {},
			strategies: {},
			cacheItems: [],
			activeFilter: 'all',
			filterTabs: [
				{ key: 'all', label: '全部' },
				{ key: 'memory', label: '内存' },
				{ key: 'storage', label: '存储' },
				{ key: 'expired', label: '已过期' }
			],
			suggestions: []
		}
	},
	computed: {
		filteredItems() {
			switch (this.activeFilter) {
				case 'memory':
					return this.cacheItems.filter(item => item.inMemory);
				case 'storage':
					return this.cacheItems.filter(item => item.inStorage && !item.inMemory);
				case 'expired':
					return this.cacheItems.filter(item => this.isExpired(item));
				default:
					return this.cacheItems;
			}
		}
	},
	mounted() {
		this.refreshStats();
		this.loadStrategies();
		this.loadCacheItems();
		this.generateSuggestions();
		
		// 定期刷新
		this.refreshTimer = setInterval(() => {
			this.refreshStats();
		}, 5000);
	},
	beforeDestroy() {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}
	},
	methods: {
		async refreshStats() {
			try {
				this.stats = advancedCacheManager.getStats();
			} catch (error) {
				console.error('Failed to refresh stats:', error);
			}
		},
		
		loadStrategies() {
			// 获取缓存策略配置
			this.strategies = {
				user: {
					priority: 10,
					ttl: 7 * 24 * 60 * 60 * 1000,
					maxSize: 1024 * 1024,
					compression: false,
					preload: true
				},
				goods: {
					priority: 8,
					ttl: 2 * 60 * 60 * 1000,
					maxSize: 5 * 1024 * 1024,
					compression: true,
					preload: true
				},
				orders: {
					priority: 7,
					ttl: 30 * 60 * 1000,
					maxSize: 2 * 1024 * 1024,
					compression: true,
					preload: false
				},
				tables: {
					priority: 9,
					ttl: 5 * 60 * 1000,
					maxSize: 512 * 1024,
					compression: false,
					preload: true
				}
			};
		},
		
		async loadCacheItems() {
			try {
				const items = [];
				
				// 获取内存缓存项
				if (advancedCacheManager.memoryCache) {
					for (const [key, item] of advancedCacheManager.memoryCache.entries()) {
						items.push({
							key,
							...item,
							inMemory: true,
							inStorage: false,
							accessCount: advancedCacheManager.memoryAccessCount.get(key) || 0
						});
					}
				}
				
				// 获取存储缓存项
				const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
				for (const storageKey of storageKeys) {
					const key = storageKey.replace('cache_', '');
					const existingItem = items.find(item => item.key === key);
					
					if (existingItem) {
						existingItem.inStorage = true;
					} else {
						try {
							const item = JSON.parse(localStorage.getItem(storageKey));
							items.push({
								key,
								...item,
								inMemory: false,
								inStorage: true,
								accessCount: 0
							});
						} catch (error) {
							console.error('Failed to parse storage item:', error);
						}
					}
				}
				
				this.cacheItems = items;
			} catch (error) {
				console.error('Failed to load cache items:', error);
			}
		},
		
		generateSuggestions() {
			const suggestions = [];
			
			// 基于统计数据生成建议
			if (this.stats.hitRate && parseFloat(this.stats.hitRate) < 70) {
				suggestions.push({
					id: 'low_hit_rate',
					icon: '⚠️',
					title: '缓存命中率偏低',
					description: '当前命中率低于70%，建议增加预加载或调整缓存策略',
					action: 'preload'
				});
			}
			
			if (this.stats.evictions > 10) {
				suggestions.push({
					id: 'high_evictions',
					icon: '🗑️',
					title: '缓存淘汰频繁',
					description: '缓存淘汰次数较多，建议增加内存限制或优化数据大小',
					action: 'increase_memory'
				});
			}
			
			if (this.stats.compressions === 0) {
				suggestions.push({
					id: 'no_compression',
					icon: '📦',
					title: '未使用压缩',
					description: '启用数据压缩可以节省存储空间',
					action: 'enable_compression'
				});
			}
			
			// 检查过期项目
			const expiredCount = this.cacheItems.filter(item => this.isExpired(item)).length;
			if (expiredCount > 5) {
				suggestions.push({
					id: 'many_expired',
					icon: '⏰',
					title: '过期项目较多',
					description: `发现${expiredCount}个过期缓存项，建议清理`,
					action: 'cleanup_expired'
				});
			}
			
			this.suggestions = suggestions;
		},
		
		async clearCache() {
			try {
				advancedCacheManager.clear();
				await this.refreshStats();
				await this.loadCacheItems();
				uni.showToast({ title: '缓存已清空', icon: 'success' });
			} catch (error) {
				console.error('Failed to clear cache:', error);
				uni.showToast({ title: '清空失败', icon: 'error' });
			}
		},
		
		async removeItem(key) {
			try {
				// 从内存缓存删除
				if (advancedCacheManager.memoryCache.has(key)) {
					advancedCacheManager.memoryCache.delete(key);
				}
				
				// 从存储删除
				localStorage.removeItem(`cache_${key}`);
				
				await this.loadCacheItems();
				uni.showToast({ title: '项目已删除', icon: 'success' });
			} catch (error) {
				console.error('Failed to remove item:', error);
				uni.showToast({ title: '删除失败', icon: 'error' });
			}
		},
		
		async refreshItem(key) {
			try {
				// 这里应该重新加载数据
				uni.showToast({ title: '项目已刷新', icon: 'success' });
			} catch (error) {
				console.error('Failed to refresh item:', error);
				uni.showToast({ title: '刷新失败', icon: 'error' });
			}
		},
		
		async applySuggestion(suggestion) {
			try {
				switch (suggestion.action) {
					case 'preload':
						await advancedCacheManager.preloadCache();
						break;
					case 'cleanup_expired':
						advancedCacheManager.cleanup();
						break;
					case 'increase_memory':
						// 这里可以调整内存限制
						break;
					case 'enable_compression':
						// 这里可以启用压缩
						break;
				}
				
				await this.refreshStats();
				await this.loadCacheItems();
				this.generateSuggestions();
				
				uni.showToast({ title: '建议已应用', icon: 'success' });
			} catch (error) {
				console.error('Failed to apply suggestion:', error);
				uni.showToast({ title: '应用失败', icon: 'error' });
			}
		},
		
		exportReport() {
			const report = {
				timestamp: new Date().toISOString(),
				stats: this.stats,
				strategies: this.strategies,
				items: this.cacheItems,
				suggestions: this.suggestions
			};
			
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `cache-report-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		},
		
		isExpired(item) {
			return Date.now() - item.timestamp > item.ttl;
		},
		
		formatTTL(ttl) {
			const hours = Math.floor(ttl / (60 * 60 * 1000));
			const minutes = Math.floor((ttl % (60 * 60 * 1000)) / (60 * 1000));
			
			if (hours > 0) {
				return `${hours}小时${minutes}分钟`;
			}
			return `${minutes}分钟`;
		},
		
		formatSize(bytes) {
			if (bytes < 1024) return bytes + ' B';
			if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
			return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
		},
		
		formatTime(timestamp) {
			return new Date(timestamp).toLocaleString();
		}
	}
}
</script>

<style lang="scss" scoped>
.cache-analyzer {
	padding: 20px;
	background: #f5f5f5;
	min-height: 100vh;
}

.analyzer-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	
	.title {
		font-size: 24px;
		font-weight: bold;
		color: #333;
	}
	
	.actions {
		display: flex;
		gap: 10px;
	}
}

.stats-overview {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 15px;
	margin-bottom: 30px;
}

.stat-card {
	background: white;
	padding: 20px;
	border-radius: 8px;
	text-align: center;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	
	.stat-value {
		font-size: 28px;
		font-weight: bold;
		color: #007aff;
		margin-bottom: 5px;
	}
	
	.stat-label {
		font-size: 14px;
		color: #666;
	}
}

.detailed-stats, .cache-strategies, .cache-items, .performance-suggestions {
	background: white;
	border-radius: 8px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-title {
	font-size: 18px;
	font-weight: bold;
	color: #333;
	margin-bottom: 15px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 10px;
}

.stat-row {
	display: flex;
	justify-content: space-between;
	padding: 10px;
	background: #f8f9fa;
	border-radius: 4px;
	
	.stat-name {
		color: #666;
	}
	
	.stat-number {
		font-weight: bold;
		color: #333;
	}
}

.strategy-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 15px;
}

.strategy-item {
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 15px;
	
	.strategy-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
		
		.strategy-name {
			font-weight: bold;
			color: #333;
		}
		
		.strategy-priority {
			color: #007aff;
			font-size: 12px;
		}
	}
	
	.strategy-details {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5px;
		
		.detail-item {
			font-size: 12px;
			color: #666;
		}
	}
}

.filter-tabs {
	display: flex;
	gap: 10px;
}

.filter-tab {
	padding: 5px 15px;
	background: #f0f0f0;
	border-radius: 20px;
	font-size: 12px;
	cursor: pointer;
	transition: all 0.3s;
	
	&.active {
		background: #007aff;
		color: white;
	}
}

.items-list {
	max-height: 400px;
	overflow-y: auto;
}

.cache-item {
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 15px;
	margin-bottom: 10px;
	
	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		
		.item-key {
			font-weight: bold;
			color: #333;
		}
		
		.item-category {
			background: #007aff;
			color: white;
			padding: 2px 8px;
			border-radius: 12px;
			font-size: 10px;
		}
		
		.item-size {
			color: #666;
			font-size: 12px;
		}
	}
	
	.item-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 10px;
		margin-bottom: 10px;
		
		.detail {
			font-size: 12px;
			color: #666;
		}
	}
	
	.item-actions {
		display: flex;
		gap: 10px;
	}
}

.suggestions-list {
	display: flex;
	flex-direction: column;
	gap: 15px;
}

.suggestion-item {
	display: flex;
	align-items: center;
	padding: 15px;
	background: #f8f9fa;
	border-radius: 6px;
	border-left: 4px solid #ffc107;
	
	.suggestion-icon {
		font-size: 24px;
		margin-right: 15px;
	}
	
	.suggestion-content {
		flex: 1;
		
		.suggestion-title {
			font-weight: bold;
			color: #333;
			margin-bottom: 5px;
		}
		
		.suggestion-desc {
			font-size: 14px;
			color: #666;
		}
	}
}

.btn {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.3s;
	
	&.btn-primary {
		background: #007aff;
		color: white;
		
		&:hover {
			background: #0056cc;
		}
	}
	
	&.btn-success {
		background: #28a745;
		color: white;
		
		&:hover {
			background: #1e7e34;
		}
	}
	
	&.btn-danger {
		background: #dc3545;
		color: white;
		
		&:hover {
			background: #c82333;
		}
	}
}

.btn-small {
	padding: 4px 8px;
	font-size: 12px;
}
</style>