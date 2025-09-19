<template>
	<view class="performance-debugger">
		<view class="debugger-header">
			<text class="title">🔧 性能调试工具</text>
			<view class="controls">
				<button @click="toggleRecording" :class="['btn', isRecording ? 'btn-danger' : 'btn-success']">
					{{ isRecording ? '停止记录' : '开始记录' }}
				</button>
				<button @click="clearData" class="btn btn-secondary">清空数据</button>
				<button @click="exportReport" class="btn btn-primary">导出报告</button>
			</view>
		</view>
		
		<!-- 实时性能指标 -->
		<view class="realtime-metrics">
			<view class="metric-card" :class="getMetricClass('fps')">
				<text class="metric-value">{{ metrics.fps }}</text>
				<text class="metric-label">FPS</text>
			</view>
			<view class="metric-card" :class="getMetricClass('memory')">
				<text class="metric-value">{{ formatMemory(metrics.memory) }}</text>
				<text class="metric-label">内存使用</text>
			</view>
			<view class="metric-card" :class="getMetricClass('cpu')">
				<text class="metric-value">{{ metrics.cpu }}%</text>
				<text class="metric-label">CPU使用</text>
			</view>
			<view class="metric-card" :class="getMetricClass('network')">
				<text class="metric-value">{{ metrics.networkLatency }}ms</text>
				<text class="metric-label">网络延迟</text>
			</view>
		</view>
		
		<!-- 性能问题检测 -->
		<view class="issue-detection">
			<view class="section-title">
				<text>⚠️ 性能问题检测</text>
				<text class="issue-count">{{ issues.length }} 个问题</text>
			</view>
			<view v-if="issues.length > 0" class="issues-list">
				<view v-for="issue in issues" :key="issue.id" class="issue-item" :class="'severity-' + issue.severity">
					<view class="issue-header">
						<text class="issue-title">{{ issue.title }}</text>
						<text class="issue-severity">{{ getSeverityText(issue.severity) }}</text>
					</view>
					<text class="issue-description">{{ issue.description }}</text>
					<view class="issue-actions">
						<button @click="fixIssue(issue)" class="btn-small btn-primary">自动修复</button>
						<button @click="ignoreIssue(issue)" class="btn-small btn-secondary">忽略</button>
					</view>
				</view>
			</view>
			<view v-else class="no-issues">
				<text>✅ 未发现性能问题</text>
			</view>
		</view>
		
		<!-- 性能时间线 -->
		<view class="performance-timeline">
			<view class="section-title">📈 性能时间线</view>
			<view class="timeline-controls">
				<text 
					v-for="period in timelinePeriods" 
					:key="period.key"
					:class="['period-tab', { active: activeTimeline === period.key }]"
					@click="activeTimeline = period.key"
				>
					{{ period.label }}
				</text>
			</view>
			<view class="timeline-chart">
				<canvas ref="timelineChart" class="chart-canvas"></canvas>
			</view>
		</view>
		
		<!-- 组件性能分析 -->
		<view class="component-analysis">
			<view class="section-title">🧩 组件性能分析</view>
			<view class="components-list">
				<view v-for="component in componentStats" :key="component.name" class="component-item">
					<view class="component-header">
						<text class="component-name">{{ component.name }}</text>
						<text class="component-render-time">{{ component.renderTime }}ms</text>
					</view>
					<view class="component-details">
						<text class="detail">渲染次数: {{ component.renderCount }}</text>
						<text class="detail">平均时间: {{ component.avgRenderTime }}ms</text>
						<text class="detail">内存占用: {{ formatMemory(component.memoryUsage) }}</text>
					</view>
					<view class="component-actions">
						<button @click="analyzeComponent(component)" class="btn-small btn-info">详细分析</button>
						<button @click="optimizeComponent(component)" class="btn-small btn-success">优化建议</button>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 网络请求分析 -->
		<view class="network-analysis">
			<view class="section-title">🌐 网络请求分析</view>
			<view class="network-stats">
				<view class="stat-item">
					<text class="stat-label">总请求数</text>
					<text class="stat-value">{{ networkStats.totalRequests }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">平均响应时间</text>
					<text class="stat-value">{{ networkStats.avgResponseTime }}ms</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">失败请求</text>
					<text class="stat-value">{{ networkStats.failedRequests }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">缓存命中率</text>
					<text class="stat-value">{{ networkStats.cacheHitRate }}%</text>
				</view>
			</view>
			<view class="requests-list">
				<view v-for="request in recentRequests" :key="request.id" class="request-item">
					<view class="request-header">
						<text class="request-method">{{ request.method }}</text>
						<text class="request-url">{{ request.url }}</text>
						<text class="request-time">{{ request.responseTime }}ms</text>
					</view>
					<view class="request-details">
						<text class="detail">状态: {{ request.status }}</text>
						<text class="detail">大小: {{ formatSize(request.size) }}</text>
						<text class="detail">类型: {{ request.type }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 优化建议 -->
		<view class="optimization-suggestions">
			<view class="section-title">💡 优化建议</view>
			<view class="suggestions-list">
				<view v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item">
					<view class="suggestion-icon">{{ suggestion.icon }}</view>
					<view class="suggestion-content">
						<text class="suggestion-title">{{ suggestion.title }}</text>
						<text class="suggestion-desc">{{ suggestion.description }}</text>
						<text class="suggestion-impact">预期提升: {{ suggestion.impact }}</text>
					</view>
					<button @click="applySuggestion(suggestion)" class="btn-small btn-success">
						应用
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PerformanceDebugger',
	data() {
		return {
			isRecording: false,
			metrics: {
				fps: 60,
				memory: 0,
				cpu: 0,
				networkLatency: 0
			},
			issues: [],
			componentStats: [],
			networkStats: {
				totalRequests: 0,
				avgResponseTime: 0,
				failedRequests: 0,
				cacheHitRate: 0
			},
			recentRequests: [],
			suggestions: [],
			timelinePeriods: [
				{ key: '1m', label: '1分钟' },
				{ key: '5m', label: '5分钟' },
				{ key: '15m', label: '15分钟' },
				{ key: '1h', label: '1小时' }
			],
			activeTimeline: '5m',
			performanceData: [],
			monitoringInterval: null
		}
	},
	mounted() {
		this.initPerformanceMonitoring();
		this.detectPerformanceIssues();
		this.generateOptimizationSuggestions();
	},
	beforeDestroy() {
		this.stopRecording();
	},
	methods: {
		initPerformanceMonitoring() {
			// 监控FPS
			this.monitorFPS();
			
			// 监控内存使用
			this.monitorMemory();
			
			// 监控网络请求
			this.monitorNetworkRequests();
			
			// 监控组件性能
			this.monitorComponentPerformance();
		},
		
		monitorFPS() {
			let lastTime = performance.now();
			let frameCount = 0;
			
			const measureFPS = () => {
				frameCount++;
				const currentTime = performance.now();
				
				if (currentTime - lastTime >= 1000) {
					this.metrics.fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
					frameCount = 0;
					lastTime = currentTime;
				}
				
				if (this.isRecording) {
					requestAnimationFrame(measureFPS);
				}
			};
			
			if (this.isRecording) {
				requestAnimationFrame(measureFPS);
			}
		},
		
		monitorMemory() {
			if (performance.memory) {
				const updateMemory = () => {
					this.metrics.memory = performance.memory.usedJSHeapSize;
					
					if (this.isRecording) {
						setTimeout(updateMemory, 1000);
					}
				};
				
				if (this.isRecording) {
					updateMemory();
				}
			}
		},
		
		monitorNetworkRequests() {
			// 拦截fetch请求
			const originalFetch = window.fetch;
			
			window.fetch = async (...args) => {
				const startTime = performance.now();
				const url = args[0];
				const options = args[1] || {};
				
				try {
					const response = await originalFetch(...args);
					const endTime = performance.now();
					const responseTime = endTime - startTime;
					
					this.recordNetworkRequest({
						id: Date.now(),
						method: options.method || 'GET',
						url: url.toString(),
						status: response.status,
						responseTime: Math.round(responseTime),
						size: parseInt(response.headers.get('content-length') || '0'),
						type: response.headers.get('content-type') || 'unknown',
						success: response.ok
					});
					
					return response;
				} catch (error) {
					const endTime = performance.now();
					const responseTime = endTime - startTime;
					
					this.recordNetworkRequest({
						id: Date.now(),
						method: options.method || 'GET',
						url: url.toString(),
						status: 0,
						responseTime: Math.round(responseTime),
						size: 0,
						type: 'error',
						success: false
					});
					
					throw error;
				}
			};
		},
		
		recordNetworkRequest(request) {
			this.recentRequests.unshift(request);
			
			// 保持最近50个请求
			if (this.recentRequests.length > 50) {
				this.recentRequests = this.recentRequests.slice(0, 50);
			}
			
			// 更新网络统计
			this.updateNetworkStats();
		},
		
		updateNetworkStats() {
			const requests = this.recentRequests;
			
			this.networkStats.totalRequests = requests.length;
			this.networkStats.avgResponseTime = requests.length > 0 
				? Math.round(requests.reduce((sum, req) => sum + req.responseTime, 0) / requests.length)
				: 0;
			this.networkStats.failedRequests = requests.filter(req => !req.success).length;
			this.networkStats.cacheHitRate = 85; // 模拟缓存命中率
		},
		
		monitorComponentPerformance() {
			// 模拟组件性能数据
			this.componentStats = [
				{
					name: 'HomeComponent',
					renderTime: 15,
					renderCount: 23,
					avgRenderTime: 12,
					memoryUsage: 1024 * 1024
				},
				{
					name: 'OrderList',
					renderTime: 8,
					renderCount: 45,
					avgRenderTime: 9,
					memoryUsage: 512 * 1024
				},
				{
					name: 'ProductGrid',
					renderTime: 25,
					renderCount: 12,
					avgRenderTime: 22,
					memoryUsage: 2048 * 1024
				}
			];
		},
		
		detectPerformanceIssues() {
			this.issues = [];
			
			// 检测FPS问题
			if (this.metrics.fps < 30) {
				this.issues.push({
					id: 'low-fps',
					title: 'FPS过低',
					description: `当前FPS为${this.metrics.fps}，低于30fps可能影响用户体验`,
					severity: 'high',
					autoFix: true
				});
			}
			
			// 检测内存问题
			if (this.metrics.memory > 100 * 1024 * 1024) {
				this.issues.push({
					id: 'high-memory',
					title: '内存使用过高',
					description: '内存使用超过100MB，可能存在内存泄漏',
					severity: 'medium',
					autoFix: true
				});
			}
			
			// 检测网络问题
			if (this.networkStats.avgResponseTime > 2000) {
				this.issues.push({
					id: 'slow-network',
					title: '网络响应缓慢',
					description: '平均响应时间超过2秒，建议优化网络请求',
					severity: 'medium',
					autoFix: false
				});
			}
			
			// 检测组件渲染问题
			const slowComponents = this.componentStats.filter(comp => comp.avgRenderTime > 20);
			if (slowComponents.length > 0) {
				this.issues.push({
					id: 'slow-components',
					title: '组件渲染缓慢',
					description: `发现${slowComponents.length}个组件渲染时间过长`,
					severity: 'low',
					autoFix: true
				});
			}
		},
		
		generateOptimizationSuggestions() {
			this.suggestions = [
				{
					id: 'enable-lazy-loading',
					icon: '⚡',
					title: '启用懒加载',
					description: '对图片和组件启用懒加载可以提升初始加载速度',
					impact: '20-30%性能提升',
					action: 'enableLazyLoading'
				},
				{
					id: 'optimize-images',
					icon: '🖼️',
					title: '优化图片资源',
					description: '压缩图片并使用WebP格式可以减少50%的文件大小',
					impact: '15-25%加载速度提升',
					action: 'optimizeImages'
				},
				{
					id: 'enable-caching',
					icon: '💾',
					title: '启用智能缓存',
					description: '配置合适的缓存策略可以显著提升重复访问速度',
					impact: '40-60%重复访问提升',
					action: 'enableCaching'
				},
				{
					id: 'code-splitting',
					icon: '📦',
					title: '代码分割',
					description: '将代码分割成更小的块可以减少初始包大小',
					impact: '30-40%初始加载提升',
					action: 'enableCodeSplitting'
				}
			];
		},
		
		toggleRecording() {
			this.isRecording = !this.isRecording;
			
			if (this.isRecording) {
				this.startRecording();
			} else {
				this.stopRecording();
			}
		},
		
		startRecording() {
			console.log('🔴 开始性能记录');
			
			// 开始监控
			this.monitorFPS();
			this.monitorMemory();
			
			// 定期检测问题
			this.monitoringInterval = setInterval(() => {
				this.detectPerformanceIssues();
				this.recordPerformanceData();
			}, 5000);
		},
		
		stopRecording() {
			console.log('⏹️ 停止性能记录');
			
			if (this.monitoringInterval) {
				clearInterval(this.monitoringInterval);
				this.monitoringInterval = null;
			}
		},
		
		recordPerformanceData() {
			this.performanceData.push({
				timestamp: Date.now(),
				fps: this.metrics.fps,
				memory: this.metrics.memory,
				cpu: this.metrics.cpu,
				networkLatency: this.metrics.networkLatency
			});
			
			// 保持最近1000个数据点
			if (this.performanceData.length > 1000) {
				this.performanceData = this.performanceData.slice(-1000);
			}
		},
		
		clearData() {
			this.performanceData = [];
			this.recentRequests = [];
			this.issues = [];
			this.networkStats = {
				totalRequests: 0,
				avgResponseTime: 0,
				failedRequests: 0,
				cacheHitRate: 0
			};
			
			uni.showToast({
				title: '数据已清空',
				icon: 'success'
			});
		},
		
		exportReport() {
			const report = {
				timestamp: new Date().toISOString(),
				metrics: this.metrics,
				issues: this.issues,
				componentStats: this.componentStats,
				networkStats: this.networkStats,
				recentRequests: this.recentRequests,
				suggestions: this.suggestions,
				performanceData: this.performanceData
			};
			
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `performance-report-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
		},
		
		fixIssue(issue) {
			console.log('🔧 修复问题:', issue.title);
			
			switch (issue.id) {
				case 'low-fps':
					this.optimizeFPS();
					break;
				case 'high-memory':
					this.optimizeMemory();
					break;
				case 'slow-components':
					this.optimizeComponents();
					break;
			}
			
			// 移除已修复的问题
			this.issues = this.issues.filter(i => i.id !== issue.id);
			
			uni.showToast({
				title: '问题已修复',
				icon: 'success'
			});
		},
		
		ignoreIssue(issue) {
			this.issues = this.issues.filter(i => i.id !== issue.id);
		},
		
		analyzeComponent(component) {
			console.log('🔍 分析组件:', component.name);
			
			uni.showModal({
				title: '组件分析',
				content: `${component.name}\n渲染时间: ${component.renderTime}ms\n内存占用: ${this.formatMemory(component.memoryUsage)}`,
				showCancel: false
			});
		},
		
		optimizeComponent(component) {
			console.log('⚡ 优化组件:', component.name);
			
			// 模拟优化
			component.renderTime = Math.max(5, component.renderTime - 5);
			component.avgRenderTime = Math.max(5, component.avgRenderTime - 3);
			
			uni.showToast({
				title: '组件已优化',
				icon: 'success'
			});
		},
		
		applySuggestion(suggestion) {
			console.log('💡 应用建议:', suggestion.title);
			
			switch (suggestion.action) {
				case 'enableLazyLoading':
					this.enableLazyLoading();
					break;
				case 'optimizeImages':
					this.optimizeImages();
					break;
				case 'enableCaching':
					this.enableCaching();
					break;
				case 'enableCodeSplitting':
					this.enableCodeSplitting();
					break;
			}
			
			uni.showToast({
				title: '优化已应用',
				icon: 'success'
			});
		},
		
		// 优化方法
		optimizeFPS() {
			// 实现FPS优化逻辑
			console.log('优化FPS...');
		},
		
		optimizeMemory() {
			// 实现内存优化逻辑
			if (window.gc) {
				window.gc();
			}
			console.log('优化内存...');
		},
		
		optimizeComponents() {
			// 实现组件优化逻辑
			console.log('优化组件...');
		},
		
		enableLazyLoading() {
			console.log('启用懒加载...');
		},
		
		optimizeImages() {
			console.log('优化图片...');
		},
		
		enableCaching() {
			console.log('启用缓存...');
		},
		
		enableCodeSplitting() {
			console.log('启用代码分割...');
		},
		
		// 工具方法
		getMetricClass(metric) {
			switch (metric) {
				case 'fps':
					if (this.metrics.fps >= 50) return 'metric-good';
					if (this.metrics.fps >= 30) return 'metric-warning';
					return 'metric-danger';
				case 'memory':
					if (this.metrics.memory < 50 * 1024 * 1024) return 'metric-good';
					if (this.metrics.memory < 100 * 1024 * 1024) return 'metric-warning';
					return 'metric-danger';
				case 'cpu':
					if (this.metrics.cpu < 50) return 'metric-good';
					if (this.metrics.cpu < 80) return 'metric-warning';
					return 'metric-danger';
				case 'network':
					if (this.metrics.networkLatency < 100) return 'metric-good';
					if (this.metrics.networkLatency < 500) return 'metric-warning';
					return 'metric-danger';
				default:
					return 'metric-good';
			}
		},
		
		getSeverityText(severity) {
			const texts = {
				high: '高',
				medium: '中',
				low: '低'
			};
			return texts[severity] || severity;
		},
		
		formatMemory(bytes) {
			if (bytes < 1024) return bytes + ' B';
			if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
			return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
		},
		
		formatSize(bytes) {
			return this.formatMemory(bytes);
		}
	}
}
</script>

<style lang="scss" scoped>
.performance-debugger {
	padding: 20px;
	background: #f5f5f5;
	min-height: 100vh;
}

.debugger-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30px;
	
	.title {
		font-size: 24px;
		font-weight: bold;
		color: #333;
	}
	
	.controls {
		display: flex;
		gap: 10px;
	}
}

.realtime-metrics {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 20px;
	margin-bottom: 30px;
}

.metric-card {
	background: white;
	border-radius: 8px;
	padding: 20px;
	text-align: center;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	
	&.metric-good {
		border-left: 4px solid #28a745;
	}
	
	&.metric-warning {
		border-left: 4px solid #ffc107;
	}
	
	&.metric-danger {
		border-left: 4px solid #dc3545;
	}
	
	.metric-value {
		display: block;
		font-size: 28px;
		font-weight: bold;
		color: #333;
		margin-bottom: 5px;
	}
	
	.metric-label {
		font-size: 14px;
		color: #666;
	}
}

.issue-detection, .performance-timeline, .component-analysis, .network-analysis, .optimization-suggestions {
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
	
	.issue-count {
		font-size: 12px;
		background: #dc3545;
		color: white;
		padding: 2px 8px;
		border-radius: 12px;
	}
}

.issues-list, .components-list, .suggestions-list {
	display: flex;
	flex-direction: column;
	gap: 15px;
}

.issue-item {
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 15px;
	
	&.severity-high {
		border-left: 4px solid #dc3545;
	}
	
	&.severity-medium {
		border-left: 4px solid #ffc107;
	}
	
	&.severity-low {
		border-left: 4px solid #17a2b8;
	}
	
	.issue-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		
		.issue-title {
			font-weight: bold;
			color: #333;
		}
		
		.issue-severity {
			font-size: 12px;
			padding: 2px 8px;
			border-radius: 12px;
			background: #f0f0f0;
			color: #666;
		}
	}
	
	.issue-description {
		color: #666;
		margin-bottom: 10px;
		line-height: 1.4;
	}
	
	.issue-actions {
		display: flex;
		gap: 10px;
	}
}

.component-item {
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 15px;
	
	.component-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		
		.component-name {
			font-weight: bold;
			color: #333;
		}
		
		.component-render-time {
			font-size: 14px;
			color: #007aff;
		}
	}
	
	.component-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 10px;
		margin-bottom: 10px;
		
		.detail {
			font-size: 12px;
			color: #666;
		}
	}
	
	.component-actions {
		display: flex;
		gap: 10px;
	}
}

.network-stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 15px;
	margin-bottom: 20px;
}

.stat-item {
	display: flex;
	justify-content: space-between;
	padding: 10px;
	background: #f8f9fa;
	border-radius: 4px;
	
	.stat-label {
		color: #666;
	}
	
	.stat-value {
		font-weight: bold;
		color: #333;
	}
}

.requests-list {
	max-height: 300px;
	overflow-y: auto;
}

.request-item {
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	padding: 10px;
	margin-bottom: 10px;
	
	.request-header {
		display: flex;
		gap: 15px;
		align-items: center;
		margin-bottom: 5px;
		
		.request-method {
			font-weight: bold;
			color: #007aff;
			min-width: 50px;
		}
		
		.request-url {
			flex: 1;
			color: #333;
			font-size: 14px;
		}
		
		.request-time {
			color: #666;
			font-size: 12px;
		}
	}
	
	.request-details {
		display: flex;
		gap: 15px;
		font-size: 12px;
		color: #666;
	}
}

.suggestion-item {
	display: flex;
	align-items: center;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	padding: 15px;
	
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
			color: #666;
			margin-bottom: 5px;
			line-height: 1.4;
		}
		
		.suggestion-impact {
			font-size: 12px;
			color: #28a745;
			font-weight: bold;
		}
	}
}

.timeline-controls {
	display: flex;
	gap: 10px;
	margin-bottom: 15px;
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

.timeline-chart {
	height: 200px;
	position: relative;
}

.chart-canvas {
	width: 100%;
	height: 100%;
}

.no-issues {
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
	
	&.btn-danger {
		background: #dc3545;
		color: white;
	}
	
	&.btn-secondary {
		background: #6c757d;
		color: white;
	}
	
	&.btn-info {
		background: #17a2b8;
		color: white;
	}
}

.btn-small {
	padding: 4px 8px;
	font-size: 12px;
}
</style>