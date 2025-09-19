<template>
	<view class="pwa-status-monitor">
		<view class="monitor-header">
			<text class="title">📱 PWA 状态监控</text>
			<view class="status-indicator" :class="getOverallStatusClass()">
				{{ getOverallStatus() }}
			</view>
		</view>
		
		<!-- PWA功能状态 -->
		<view class="status-grid">
			<view class="status-card" :class="status.isInstalled ? 'status-success' : 'status-warning'">
				<view class="card-icon">📱</view>
				<view class="card-content">
					<text class="card-title">应用安装</text>
					<text class="card-status">{{ status.isInstalled ? '已安装' : '未安装' }}</text>
				</view>
				<button v-if="!status.isInstalled && status.hasInstallPrompt" 
					@click="promptInstall" class="card-action">
					安装
				</button>
			</view>
			
			<view class="status-card" :class="status.isOnline ? 'status-success' : 'status-danger'">
				<view class="card-icon">🌐</view>
				<view class="card-content">
					<text class="card-title">网络状态</text>
					<text class="card-status">{{ status.isOnline ? '在线' : '离线' }}</text>
				</view>
			</view>
			
			<view class="status-card" :class="status.serviceWorkerReady ? 'status-success' : 'status-warning'">
				<view class="card-icon">⚙️</view>
				<view class="card-content">
					<text class="card-title">Service Worker</text>
					<text class="card-status">{{ status.serviceWorkerReady ? '已激活' : '未激活' }}</text>
				</view>
			</view>
			
			<view class="status-card" :class="getNotificationStatusClass()">
				<view class="card-icon">🔔</view>
				<view class="card-content">
					<text class="card-title">推送通知</text>
					<text class="card-status">{{ getNotificationStatusText() }}</text>
				</view>
				<button v-if="status.notificationPermission === 'default'" 
					@click="requestNotificationPermission" class="card-action">
					启用
				</button>
			</view>
		</view>
		
		<!-- 同步队列状态 -->
		<view class="sync-status">
			<view class="section-title">🔄 同步状态</view>
			<view class="sync-grid">
				<view class="sync-item">
					<text class="sync-label">后台同步队列</text>
					<text class="sync-value">{{ status.syncQueueLength }} 项</text>
				</view>
				<view class="sync-item">
					<text class="sync-label">离线请求队列</text>
					<text class="sync-value">{{ status.offlineQueueLength }} 项</text>
				</view>
			</view>
			
			<view v-if="status.syncQueueLength > 0 || status.offlineQueueLength > 0" class="sync-actions">
				<button @click="triggerSync" class="btn btn-primary">立即同步</button>
				<button @click="clearQueues" class="btn btn-secondary">清空队列</button>
			</view>
		</view>
		
		<!-- 缓存状态 -->
		<view class="cache-status">
			<view class="section-title">💾 缓存状态</view>
			<view class="cache-info">
				<view class="cache-item">
					<text class="cache-label">静态资源缓存</text>
					<text class="cache-status-text" :class="cacheStatus.static ? 'text-success' : 'text-warning'">
						{{ cacheStatus.static ? '已缓存' : '未缓存' }}
					</text>
				</view>
				<view class="cache-item">
					<text class="cache-label">API响应缓存</text>
					<text class="cache-status-text" :class="cacheStatus.api ? 'text-success' : 'text-warning'">
						{{ cacheStatus.api ? '已缓存' : '未缓存' }}
					</text>
				</view>
				<view class="cache-item">
					<text class="cache-label">离线页面</text>
					<text class="cache-status-text" :class="cacheStatus.offline ? 'text-success' : 'text-warning'">
						{{ cacheStatus.offline ? '已缓存' : '未缓存' }}
					</text>
				</view>
			</view>
			
			<view class="cache-actions">
				<button @click="refreshCache" class="btn btn-primary">刷新缓存</button>
				<button @click="clearCache" class="btn btn-danger">清空缓存</button>
			</view>
		</view>
		
		<!-- 离线功能测试 -->
		<view class="offline-test">
			<view class="section-title">🧪 离线功能测试</view>
			<view class="test-actions">
				<button @click="testOfflineMode" class="btn btn-warning">模拟离线</button>
				<button @click="testCacheAccess" class="btn btn-info">测试缓存访问</button>
				<button @click="testBackgroundSync" class="btn btn-success">测试后台同步</button>
			</view>
			
			<view v-if="testResults.length > 0" class="test-results">
				<view class="results-title">测试结果:</view>
				<view v-for="(result, index) in testResults" :key="index" class="test-result">
					<text class="result-time">{{ formatTime(result.timestamp) }}</text>
					<text class="result-text" :class="result.success ? 'text-success' : 'text-danger'">
						{{ result.message }}
					</text>
				</view>
			</view>
		</view>
		
		<!-- PWA指标 -->
		<view class="pwa-metrics">
			<view class="section-title">📊 PWA 指标</view>
			<view class="metrics-grid">
				<view class="metric-item">
					<text class="metric-label">安装提示显示次数</text>
					<text class="metric-value">{{ metrics.installPromptShown }}</text>
				</view>
				<view class="metric-item">
					<text class="metric-label">安装成功次数</text>
					<text class="metric-value">{{ metrics.installSuccess }}</text>
				</view>
				<view class="metric-item">
					<text class="metric-label">离线访问次数</text>
					<text class="metric-value">{{ metrics.offlineAccess }}</text>
				</view>
				<view class="metric-item">
					<text class="metric-label">后台同步次数</text>
					<text class="metric-value">{{ metrics.backgroundSync }}</text>
				</view>
			</view>
		</view>
		
		<!-- 操作按钮 -->
		<view class="actions">
			<button @click="refreshStatus" class="btn btn-primary">刷新状态</button>
			<button @click="exportReport" class="btn btn-success">导出报告</button>
			<button @click="resetPWA" class="btn btn-danger">重置PWA</button>
		</view>
	</view>
</template>

<script>
import pwaEnhancedManager from '@/common/pwa-enhanced-manager.js'

export default {
	name: 'PWAStatusMonitor',
	data() {
		return {
			status: {
				isInstalled: false,
				isOnline: true,
				hasInstallPrompt: false,
				notificationPermission: 'default',
				hasPushSubscription: false,
				syncQueueLength: 0,
				offlineQueueLength: 0,
				serviceWorkerReady: false
			},
			cacheStatus: {
				static: false,
				api: false,
				offline: false
			},
			testResults: [],
			metrics: {
				installPromptShown: 0,
				installSuccess: 0,
				offlineAccess: 0,
				backgroundSync: 0
			},
			refreshTimer: null
		}
	},
	mounted() {
		this.refreshStatus();
		this.loadMetrics();
		this.checkCacheStatus();
		
		// 定期刷新状态
		this.refreshTimer = setInterval(() => {
			this.refreshStatus();
		}, 10000);
		
		// 监听PWA事件
		this.setupEventListeners();
	},
	beforeDestroy() {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}
	},
	methods: {
		refreshStatus() {
			try {
				this.status = pwaEnhancedManager.getStatus();
			} catch (error) {
				console.error('Failed to refresh PWA status:', error);
			}
		},
		
		loadMetrics() {
			try {
				const stored = localStorage.getItem('pwa-metrics');
				if (stored) {
					this.metrics = { ...this.metrics, ...JSON.parse(stored) };
				}
			} catch (error) {
				console.error('Failed to load PWA metrics:', error);
			}
		},
		
		saveMetrics() {
			try {
				localStorage.setItem('pwa-metrics', JSON.stringify(this.metrics));
			} catch (error) {
				console.error('Failed to save PWA metrics:', error);
			}
		},
		
		async checkCacheStatus() {
			if ('caches' in window) {
				try {
					const cacheNames = await caches.keys();
					
					this.cacheStatus.static = cacheNames.some(name => name.includes('pwa'));
					this.cacheStatus.api = cacheNames.some(name => name.includes('runtime'));
					this.cacheStatus.offline = cacheNames.some(name => name.includes('offline'));
				} catch (error) {
					console.error('Failed to check cache status:', error);
				}
			}
		},
		
		setupEventListeners() {
			// 监听网络状态变化
			window.addEventListener('online', () => {
				this.status.isOnline = true;
				this.addTestResult('网络已连接', true);
			});
			
			window.addEventListener('offline', () => {
				this.status.isOnline = false;
				this.addTestResult('网络已断开', false);
				this.metrics.offlineAccess++;
				this.saveMetrics();
			});
			
			// 监听PWA事件
			window.addEventListener('beforeinstallprompt', () => {
				this.status.hasInstallPrompt = true;
				this.metrics.installPromptShown++;
				this.saveMetrics();
			});
			
			window.addEventListener('appinstalled', () => {
				this.status.isInstalled = true;
				this.metrics.installSuccess++;
				this.saveMetrics();
				this.addTestResult('应用安装成功', true);
			});
		},
		
		async promptInstall() {
			try {
				await pwaEnhancedManager.promptInstall();
				this.addTestResult('安装提示已显示', true);
			} catch (error) {
				console.error('Install prompt failed:', error);
				this.addTestResult('安装提示失败: ' + error.message, false);
			}
		},
		
		async requestNotificationPermission() {
			try {
				await pwaEnhancedManager.requestNotificationPermission();
				this.refreshStatus();
				this.addTestResult('通知权限请求完成', true);
			} catch (error) {
				console.error('Notification permission request failed:', error);
				this.addTestResult('通知权限请求失败: ' + error.message, false);
			}
		},
		
		async triggerSync() {
			try {
				await pwaEnhancedManager.triggerBackgroundSync();
				this.metrics.backgroundSync++;
				this.saveMetrics();
				this.addTestResult('后台同步已触发', true);
				
				setTimeout(() => {
					this.refreshStatus();
				}, 2000);
			} catch (error) {
				console.error('Background sync failed:', error);
				this.addTestResult('后台同步失败: ' + error.message, false);
			}
		},
		
		clearQueues() {
			try {
				// 清空同步队列
				pwaEnhancedManager.syncQueue = [];
				pwaEnhancedManager.offlineQueue = [];
				
				// 清空本地存储
				localStorage.removeItem('pwa-offline-queue');
				
				this.refreshStatus();
				this.addTestResult('队列已清空', true);
			} catch (error) {
				console.error('Clear queues failed:', error);
				this.addTestResult('清空队列失败: ' + error.message, false);
			}
		},
		
		async refreshCache() {
			try {
				if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
					navigator.serviceWorker.controller.postMessage({ type: 'REFRESH_CACHE' });
					this.addTestResult('缓存刷新请求已发送', true);
				} else {
					this.addTestResult('Service Worker 未激活', false);
				}
				
				setTimeout(() => {
					this.checkCacheStatus();
				}, 2000);
			} catch (error) {
				console.error('Refresh cache failed:', error);
				this.addTestResult('缓存刷新失败: ' + error.message, false);
			}
		},
		
		async clearCache() {
			try {
				if ('caches' in window) {
					const cacheNames = await caches.keys();
					await Promise.all(cacheNames.map(name => caches.delete(name)));
					
					this.checkCacheStatus();
					this.addTestResult('缓存已清空', true);
				}
			} catch (error) {
				console.error('Clear cache failed:', error);
				this.addTestResult('清空缓存失败: ' + error.message, false);
			}
		},
		
		testOfflineMode() {
			// 模拟离线模式
			this.addTestResult('开始离线模式测试...', true);
			
			// 测试缓存访问
			setTimeout(() => {
				this.testCacheAccess();
			}, 1000);
		},
		
		async testCacheAccess() {
			try {
				if ('caches' in window) {
					const cache = await caches.open('test-cache');
					await cache.put('/test', new Response('test'));
					const response = await cache.match('/test');
					
					if (response) {
						this.addTestResult('缓存访问测试成功', true);
					} else {
						this.addTestResult('缓存访问测试失败', false);
					}
					
					await caches.delete('test-cache');
				} else {
					this.addTestResult('浏览器不支持缓存API', false);
				}
			} catch (error) {
				console.error('Cache access test failed:', error);
				this.addTestResult('缓存访问测试失败: ' + error.message, false);
			}
		},
		
		async testBackgroundSync() {
			try {
				// 添加测试数据到同步队列
				pwaEnhancedManager.addToSyncQueue('test', { message: 'test sync' });
				
				this.addTestResult('测试数据已添加到同步队列', true);
				this.refreshStatus();
			} catch (error) {
				console.error('Background sync test failed:', error);
				this.addTestResult('后台同步测试失败: ' + error.message, false);
			}
		},
		
		exportReport() {
			const report = {
				timestamp: new Date().toISOString(),
				status: this.status,
				cacheStatus: this.cacheStatus,
				metrics: this.metrics,
				testResults: this.testResults
			};
			
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `pwa-report-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		},
		
		async resetPWA() {
			try {
				// 清空所有缓存
				await this.clearCache();
				
				// 清空队列
				this.clearQueues();
				
				// 重置指标
				this.metrics = {
					installPromptShown: 0,
					installSuccess: 0,
					offlineAccess: 0,
					backgroundSync: 0
				};
				this.saveMetrics();
				
				// 清空测试结果
				this.testResults = [];
				
				// 刷新状态
				this.refreshStatus();
				this.checkCacheStatus();
				
				this.addTestResult('PWA已重置', true);
			} catch (error) {
				console.error('Reset PWA failed:', error);
				this.addTestResult('PWA重置失败: ' + error.message, false);
			}
		},
		
		addTestResult(message, success) {
			this.testResults.unshift({
				timestamp: Date.now(),
				message,
				success
			});
			
			// 保持最近20条结果
			if (this.testResults.length > 20) {
				this.testResults = this.testResults.slice(0, 20);
			}
		},
		
		getOverallStatus() {
			if (this.status.isInstalled && this.status.serviceWorkerReady && this.status.isOnline) {
				return '优秀';
			} else if (this.status.serviceWorkerReady) {
				return '良好';
			} else {
				return '需要改进';
			}
		},
		
		getOverallStatusClass() {
			const status = this.getOverallStatus();
			switch (status) {
				case '优秀': return 'status-excellent';
				case '良好': return 'status-good';
				default: return 'status-poor';
			}
		},
		
		getNotificationStatusText() {
			switch (this.status.notificationPermission) {
				case 'granted': return '已授权';
				case 'denied': return '已拒绝';
				default: return '未设置';
			}
		},
		
		getNotificationStatusClass() {
			switch (this.status.notificationPermission) {
				case 'granted': return 'status-success';
				case 'denied': return 'status-danger';
				default: return 'status-warning';
			}
		},
		
		formatTime(timestamp) {
			return new Date(timestamp).toLocaleTimeString();
		}
	}
}
</script>

<style lang="scss" scoped>
.pwa-status-monitor {
	padding: 20px;
	background: #f5f5f5;
	min-height: 100vh;
}

.monitor-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30px;
	
	.title {
		font-size: 24px;
		font-weight: bold;
		color: #333;
	}
	
	.status-indicator {
		padding: 6px 16px;
		border-radius: 20px;
		font-size: 14px;
		font-weight: bold;
		
		&.status-excellent {
			background: #d4edda;
			color: #155724;
		}
		
		&.status-good {
			background: #fff3cd;
			color: #856404;
		}
		
		&.status-poor {
			background: #f8d7da;
			color: #721c24;
		}
	}
}

.status-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
	margin-bottom: 30px;
}

.status-card {
	background: white;
	border-radius: 8px;
	padding: 20px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	display: flex;
	align-items: center;
	gap: 15px;
	
	&.status-success {
		border-left: 4px solid #28a745;
	}
	
	&.status-warning {
		border-left: 4px solid #ffc107;
	}
	
	&.status-danger {
		border-left: 4px solid #dc3545;
	}
	
	.card-icon {
		font-size: 32px;
	}
	
	.card-content {
		flex: 1;
		
		.card-title {
			display: block;
			font-weight: bold;
			color: #333;
			margin-bottom: 5px;
		}
		
		.card-status {
			font-size: 14px;
			color: #666;
		}
	}
	
	.card-action {
		padding: 6px 12px;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
	}
}

.sync-status, .cache-status, .offline-test, .pwa-metrics {
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
}

.sync-grid, .metrics-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 15px;
	margin-bottom: 15px;
}

.sync-item, .metric-item {
	display: flex;
	justify-content: space-between;
	padding: 10px;
	background: #f8f9fa;
	border-radius: 4px;
	
	.sync-label, .metric-label {
		color: #666;
	}
	
	.sync-value, .metric-value {
		font-weight: bold;
		color: #333;
	}
}

.cache-info {
	margin-bottom: 15px;
}

.cache-item {
	display: flex;
	justify-content: space-between;
	padding: 8px 0;
	border-bottom: 1px solid #eee;
	
	&:last-child {
		border-bottom: none;
	}
	
	.cache-label {
		color: #666;
	}
	
	.cache-status-text {
		font-weight: bold;
		
		&.text-success {
			color: #28a745;
		}
		
		&.text-warning {
			color: #ffc107;
		}
	}
}

.sync-actions, .cache-actions, .test-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.test-results {
	margin-top: 15px;
	max-height: 200px;
	overflow-y: auto;
	
	.results-title {
		font-weight: bold;
		margin-bottom: 10px;
		color: #333;
	}
}

.test-result {
	display: flex;
	gap: 10px;
	padding: 8px;
	background: #f8f9fa;
	border-radius: 4px;
	margin-bottom: 5px;
	
	.result-time {
		font-size: 12px;
		color: #999;
		min-width: 80px;
	}
	
	.result-text {
		flex: 1;
		font-size: 14px;
		
		&.text-success {
			color: #28a745;
		}
		
		&.text-danger {
			color: #dc3545;
		}
	}
}

.actions {
	display: flex;
	gap: 15px;
	justify-content: center;
	flex-wrap: wrap;
}

.btn {
	padding: 10px 20px;
	border: none;
	border-radius: 6px;
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
	
	&.btn-warning {
		background: #ffc107;
		color: black;
		
		&:hover {
			background: #e0a800;
		}
	}
	
	&.btn-danger {
		background: #dc3545;
		color: white;
		
		&:hover {
			background: #c82333;
		}
	}
	
	&.btn-info {
		background: #17a2b8;
		color: white;
		
		&:hover {
			background: #138496;
		}
	}
	
	&.btn-secondary {
		background: #6c757d;
		color: white;
		
		&:hover {
			background: #545b62;
		}
	}
}
</style>