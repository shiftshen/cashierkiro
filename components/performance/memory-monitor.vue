<template>
	<view class="memory-monitor">
		<view class="monitor-header">
			<text class="title">🧠 内存监控</text>
			<view class="actions">
				<button @click="toggleAutoRefresh" :class="['btn', autoRefresh ? 'btn-success' : 'btn-secondary']">
					{{ autoRefresh ? '自动刷新' : '手动刷新' }}
				</button>
				<button @click="forceCleanup" class="btn btn-warning">强制清理</button>
				<button @click="exportData" class="btn btn-primary">导出数据</button>
			</view>
		</view>
		
		<!-- 内存使用概览 -->
		<view class="memory-overview">
			<view class="memory-card" :class="getMemoryStatusClass()">
				<view class="card-header">
					<text class="card-title">当前内存使用</text>
					<text class="card-status">{{ getMemoryStatus() }}</text>
				</view>
				<view class="card-content">
					<view class="memory-value">{{ formatSize(stats.current) }}</view>
					<view class="memory-details">
						<text>峰值: {{ formatSize(stats.peak) }}</text>
						<text>平均: {{ formatSize(stats.average) }}</text>
					</view>
				</view>
			</view>
			
			<view class="stats-grid">
				<view class="stat-item">
					<text class="stat-label">组件数量</text>
					<text class="stat-value">{{ stats.components }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">事件监听器</text>
					<text class="stat-value">{{ stats.listeners }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">定时器</text>
					<text class="stat-value">{{ stats.timers }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">大对象</text>
					<text class="stat-value">{{ stats.largeObjects }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">清理次数</text>
					<text class="stat-value">{{ stats.cleanups }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">内存压力</text>
					<text class="stat-value" :class="stats.isUnderPressure ? 'text-danger' : 'text-success'">
						{{ stats.isUnderPressure ? '是' : '否' }}
					</text>
				</view>
			</view>
		</view>
		
		<!-- 内存使用趋势图 -->
		<view class="memory-chart">
			<view class="chart-header">
				<text class="chart-title">内存使用趋势</text>
				<view class="chart-controls">
					<text 
						v-for="period in chartPeriods" 
						:key="period.key"
						:class="['period-tab', { active: activePeriod === period.key }]"
						@click="activePeriod = period.key"
					>
						{{ period.label }}
					</text>
				</view>
			</view>
			<view class="chart-container">
				<canvas ref="memoryChart" class="memory-canvas"></canvas>
			</view>
		</view>
		
		<!-- 内存泄漏检测 -->
		<view class="leak-detection">
			<view class="section-title">
				<text>🚨 内存泄漏检测</text>
				<text class="leak-count">{{ stats.leaks ? stats.leaks.length : 0 }} 个泄漏</text>
			</view>
			<view v-if="stats.leaks && stats.leaks.length > 0" class="leak-list">
				<view v-for="(leak, index) in stats.leaks" :key="index" class="leak-item">
					<view class="leak-header">
						<text class="leak-type">{{ getLeakTypeLabel(leak.type) }}</text>
						<text class="leak-time">{{ formatTime(leak.detectedAt) }}</text>
					</view>
					<view class="leak-details">
						<text v-if="leak.component">组件: {{ leak.component }}</text>
						<text v-if="leak.event">事件: {{ leak.event }}</text>
						<text v-if="leak.size">大小: {{ formatSize(leak.size) }}</text>
						<text v-if="leak.count">数量: {{ leak.count }}</text>
					</view>
				</view>
			</view>
			<view v-else class="no-leaks">
				<text>✅ 未检测到内存泄漏</text>
			</view>
		</view>
		
		<!-- 大对象管理 -->
		<view class="large-objects">
			<view class="section-title">📦 大对象管理</view>
			<view v-if="largeObjects.length > 0" class="objects-list">
				<view v-for="obj in largeObjects" :key="obj.key" class="object-item">
					<view class="object-header">
						<text class="object-key">{{ obj.key }}</text>
						<text class="object-size">{{ formatSize(obj.estimatedSize) }}</text>
					</view>
					<view class="object-details">
						<text>创建时间: {{ formatTime(obj.createTime) }}</text>
						<text>最后访问: {{ obj.lastAccessTime ? formatTime(obj.lastAccessTime) : '未访问' }}</text>
						<text>状态: {{ obj.accessed ? '已访问' : '未访问' }}</text>
					</view>
					<view class="object-actions">
						<button @click="accessObject(obj.key)" class="btn-small btn-primary">访问</button>
						<button @click="removeObject(obj.key)" class="btn-small btn-danger">删除</button>
					</view>
				</view>
			</view>
			<view v-else class="no-objects">
				<text>📭 暂无大对象</text>
			</view>
		</view>
		
		<!-- 内存优化建议 -->
		<view class="optimization-suggestions">
			<view class="section-title">💡 优化建议</view>
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
import memoryManager from '@/common/memory-manager.js'

export default {
	name: 'MemoryMonitor',
	data() {
		return {
			stats: {},
			largeObjects: [],
			autoRefresh: true,
			refreshInterval: null,
			activePeriod: '1h',
			chartPeriods: [
				{ key: '5m', label: '5分钟' },
				{ key: '1h', label: '1小时' },
				{ key: '6h', label: '6小时' },
				{ key: '24h', label: '24小时' }
			],
			suggestions: [],
			chartInstance: null
		}
	},
	mounted() {
		this.refreshStats();
		this.loadLargeObjects();
		this.generateSuggestions();
		this.initChart();
		
		if (this.autoRefresh) {
			this.startAutoRefresh();
		}
		
		// 监听内存压力事件
		window.addEventListener('memoryPressure', this.handleMemoryPressure);
	},
	beforeDestroy() {
		this.stopAutoRefresh();
		window.removeEventListener('memoryPressure', this.handleMemoryPressure);
		
		if (this.chartInstance) {
			this.chartInstance.destroy();
		}
	},
	methods: {
		refreshStats() {
			try {
				this.stats = memoryManager.getStats();
			} catch (error) {
				console.error('Failed to refresh memory stats:', error);
			}
		},
		
		loadLargeObjects() {
			try {
				this.largeObjects = Array.from(memoryManager.largeObjects.entries()).map(([key, obj]) => ({
					key,
					...obj
				}));
			} catch (error) {
				console.error('Failed to load large objects:', error);
			}
		},
		
		generateSuggestions() {
			const suggestions = [];
			
			// 基于统计数据生成建议
			if (this.stats.components > 100) {
				suggestions.push({
					id: 'too_many_components',
					icon: '⚠️',
					title: '组件数量过多',
					description: `当前有${this.stats.components}个组件，建议优化组件生命周期管理`,
					action: 'cleanup_components'
				});
			}
			
			if (this.stats.listeners > 200) {
				suggestions.push({
					id: 'too_many_listeners',
					icon: '👂',
					title: '事件监听器过多',
					description: `当前有${this.stats.listeners}个监听器，建议检查是否有未清理的监听器`,
					action: 'cleanup_listeners'
				});
			}
			
			if (this.stats.timers > 50) {
				suggestions.push({
					id: 'too_many_timers',
					icon: '⏰',
					title: '定时器过多',
					description: `当前有${this.stats.timers}个定时器，建议检查是否有未清理的定时器`,
					action: 'cleanup_timers'
				});
			}
			
			if (this.stats.largeObjects > 20) {
				suggestions.push({
					id: 'too_many_large_objects',
					icon: '📦',
					title: '大对象过多',
					description: `当前有${this.stats.largeObjects}个大对象，建议清理未使用的对象`,
					action: 'cleanup_large_objects'
				});
			}
			
			if (this.stats.isUnderPressure) {
				suggestions.push({
					id: 'memory_pressure',
					icon: '🔥',
					title: '内存压力过高',
					description: '系统检测到内存压力，建议立即进行清理',
					action: 'force_cleanup'
				});
			}
			
			// 检查内存增长趋势
			if (this.stats.samples && this.stats.samples.length >= 5) {
				const recent = this.stats.samples.slice(-5);
				const growthRate = (recent[4].used - recent[0].used) / recent[0].used;
				
				if (growthRate > 0.3) {
					suggestions.push({
						id: 'memory_growth',
						icon: '📈',
						title: '内存增长过快',
						description: '检测到内存使用量快速增长，可能存在内存泄漏',
						action: 'detect_leaks'
					});
				}
			}
			
			this.suggestions = suggestions;
		},
		
		initChart() {
			// 这里应该初始化图表库（如Chart.js）
			// 由于uni-app环境限制，这里使用简化实现
			console.log('Memory chart initialized');
		},
		
		toggleAutoRefresh() {
			this.autoRefresh = !this.autoRefresh;
			
			if (this.autoRefresh) {
				this.startAutoRefresh();
			} else {
				this.stopAutoRefresh();
			}
		},
		
		startAutoRefresh() {
			this.refreshInterval = setInterval(() => {
				this.refreshStats();
				this.loadLargeObjects();
				this.generateSuggestions();
			}, 5000);
		},
		
		stopAutoRefresh() {
			if (this.refreshInterval) {
				clearInterval(this.refreshInterval);
				this.refreshInterval = null;
			}
		},
		
		forceCleanup() {
			try {
				memoryManager.aggressiveCleanup();
				
				setTimeout(() => {
					this.refreshStats();
					this.loadLargeObjects();
					this.generateSuggestions();
				}, 1000);
				
				uni.showToast({
					title: '清理完成',
					icon: 'success'
				});
			} catch (error) {
				console.error('Force cleanup failed:', error);
				uni.showToast({
					title: '清理失败',
					icon: 'error'
				});
			}
		},
		
		accessObject(key) {
			try {
				memoryManager.accessLargeObject(key);
				this.loadLargeObjects();
				
				uni.showToast({
					title: '对象已访问',
					icon: 'success'
				});
			} catch (error) {
				console.error('Access object failed:', error);
			}
		},
		
		removeObject(key) {
			try {
				memoryManager.unregisterLargeObject(key);
				this.loadLargeObjects();
				
				uni.showToast({
					title: '对象已删除',
					icon: 'success'
				});
			} catch (error) {
				console.error('Remove object failed:', error);
			}
		},
		
		applySuggestion(suggestion) {
			try {
				switch (suggestion.action) {
					case 'cleanup_components':
						// 清理组件
						break;
					case 'cleanup_listeners':
						// 清理监听器
						break;
					case 'cleanup_timers':
						// 清理定时器
						break;
					case 'cleanup_large_objects':
						memoryManager.cleanupLargeObjects();
						break;
					case 'force_cleanup':
						this.forceCleanup();
						return;
					case 'detect_leaks':
						memoryManager.detectMemoryLeaks();
						break;
				}
				
				setTimeout(() => {
					this.refreshStats();
					this.loadLargeObjects();
					this.generateSuggestions();
				}, 1000);
				
				uni.showToast({
					title: '建议已应用',
					icon: 'success'
				});
			} catch (error) {
				console.error('Apply suggestion failed:', error);
				uni.showToast({
					title: '应用失败',
					icon: 'error'
				});
			}
		},
		
		exportData() {
			const data = {
				timestamp: new Date().toISOString(),
				stats: this.stats,
				largeObjects: this.largeObjects,
				suggestions: this.suggestions
			};
			
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `memory-report-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		},
		
		handleMemoryPressure(event) {
			uni.showToast({
				title: '检测到内存压力',
				icon: 'loading',
				duration: 2000
			});
			
			// 刷新统计数据
			setTimeout(() => {
				this.refreshStats();
				this.generateSuggestions();
			}, 2000);
		},
		
		getMemoryStatus() {
			if (this.stats.isUnderPressure) return '压力过高';
			
			const usage = this.stats.current / (150 * 1024 * 1024); // 假设150MB限制
			if (usage > 0.9) return '使用过高';
			if (usage > 0.7) return '使用较高';
			return '正常';
		},
		
		getMemoryStatusClass() {
			const status = this.getMemoryStatus();
			switch (status) {
				case '压力过高':
				case '使用过高':
					return 'status-danger';
				case '使用较高':
					return 'status-warning';
				default:
					return 'status-success';
			}
		},
		
		getLeakTypeLabel(type) {
			const labels = {
				component: '组件泄漏',
				listener: '监听器泄漏',
				timers: '定时器泄漏',
				large_object: '大对象泄漏'
			};
			return labels[type] || type;
		},
		
		formatSize(bytes) {
			if (!bytes) return '0 B';
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
.memory-monitor {
	padding: 20px;
	background: #f5f5f5;
	min-height: 100vh;
}

.monitor-header {
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

.memory-overview {
	display: grid;
	grid-template-columns: 1fr 2fr;
	gap: 20px;
	margin-bottom: 30px;
}

.memory-card {
	background: white;
	border-radius: 8px;
	padding: 20px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	
	&.status-success {
		border-left: 4px solid #28a745;
	}
	
	&.status-warning {
		border-left: 4px solid #ffc107;
	}
	
	&.status-danger {
		border-left: 4px solid #dc3545;
	}
	
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
		
		.card-title {
			font-weight: bold;
			color: #333;
		}
		
		.card-status {
			font-size: 12px;
			padding: 2px 8px;
			border-radius: 12px;
			background: #f0f0f0;
			color: #666;
		}
	}
	
	.memory-value {
		font-size: 32px;
		font-weight: bold;
		color: #007aff;
		margin-bottom: 10px;
	}
	
	.memory-details {
		display: flex;
		gap: 20px;
		font-size: 14px;
		color: #666;
	}
}

.stats-grid {
	background: white;
	border-radius: 8px;
	padding: 20px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 15px;
}

.stat-item {
	text-align: center;
	
	.stat-label {
		display: block;
		font-size: 12px;
		color: #666;
		margin-bottom: 5px;
	}
	
	.stat-value {
		font-size: 20px;
		font-weight: bold;
		color: #333;
		
		&.text-danger {
			color: #dc3545;
		}
		
		&.text-success {
			color: #28a745;
		}
	}
}

.memory-chart, .leak-detection, .large-objects, .optimization-suggestions {
	background: white;
	border-radius: 8px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15px;
	
	.chart-title {
		font-weight: bold;
		color: #333;
	}
	
	.chart-controls {
		display: flex;
		gap: 10px;
	}
}

.period-tab {
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

.chart-container {
	height: 200px;
	position: relative;
}

.memory-canvas {
	width: 100%;
	height: 100%;
}

.section-title {
	font-size: 18px;
	font-weight: bold;
	color: #333;
	margin-bottom: 15px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	.leak-count {
		font-size: 12px;
		background: #dc3545;
		color: white;
		padding: 2px 8px;
		border-radius: 12px;
	}
}

.leak-list, .objects-list, .suggestions-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.leak-item, .object-item, .suggestion-item {
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 15px;
	
	.leak-header, .object-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		
		.leak-type, .object-key {
			font-weight: bold;
			color: #333;
		}
		
		.leak-time, .object-size {
			font-size: 12px;
			color: #666;
		}
	}
	
	.leak-details, .object-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 5px;
		margin-bottom: 10px;
		font-size: 12px;
		color: #666;
	}
	
	.object-actions {
		display: flex;
		gap: 10px;
	}
}

.suggestion-item {
	display: flex;
	align-items: center;
	
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

.no-leaks, .no-objects {
	text-align: center;
	padding: 40px;
	color: #666;
	font-size: 16px;
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
	}
	
	&.btn-success {
		background: #28a745;
		color: white;
	}
	
	&.btn-warning {
		background: #ffc107;
		color: black;
	}
	
	&.btn-danger {
		background: #dc3545;
		color: white;
	}
	
	&.btn-secondary {
		background: #6c757d;
		color: white;
	}
}

.btn-small {
	padding: 4px 8px;
	font-size: 12px;
}
</style>