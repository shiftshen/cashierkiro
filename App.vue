<script>
	import Vue from 'vue'
	import Socket from "@/common/socket.js"
	import site from '@/custom/siteroot.js';
	import i18n from '@/locale/index.js'
	
	// 安全的原生插件加载
	let plug = null;
	// #ifdef APP-PLUS
	try {
		plug = uni.requireNativePlugin("Html5app-TwoDisplay");
	} catch (error) {
		console.warn('Native plugin Html5app-TwoDisplay not available:', error);
	}
	// #endif
	
	export default {
		onLaunch: function() {
			// APP环境下的屏幕设置
			// #ifdef APP-PLUS
			try {
				if (plus && plus.screen) {
					plus.screen.lockOrientation('landscape-primary');
				}
				if (plus && plus.navigator) {
					plus.navigator.setFullscreen(true);
				}
			} catch (error) {
				console.warn('APP screen setup failed:', error);
			}
			// #endif
			
			// 获取系统信息并设置设备类型
			this.initDeviceType();
			
			// 初始化Socket连接
			this.getSocket();

			// APP环境下显示副屏
			// #ifdef APP-PLUS
			this.initSecondaryDisplay();
			// #endif
		},
		onShow: function() {
			// 应用显示时的处理
			console.log('App onShow');
		},
		onHide: function() {
			// 应用隐藏时的处理
			console.log('App onHide');
		},
		methods: {
			// 初始化设备类型检测
			initDeviceType() {
				uni.getSystemInfo({
					success: (res) => {
						console.log("屏幕尺寸：", res.windowWidth, res.windowHeight);
						
						// 设备类型判断
						let deviceType = 'mobile';
						if (res.windowWidth >= 1024) {
							deviceType = 'desktop';
						} else if (res.windowWidth >= 768) {
							deviceType = 'tablet';
						}
						
						// 存储设备信息
						uni.setStorageSync('deviceInfo', {
							type: deviceType,
							width: res.windowWidth,
							height: res.windowHeight,
							platform: res.platform
						});
						
						console.log('设备类型：', deviceType);
					},
					fail: (error) => {
						console.error('获取系统信息失败：', error);
					}
				});
			},
			
			// 初始化副屏显示
			initSecondaryDisplay() {
				// #ifdef APP-PLUS
				try {
					if (plug && plug.showSecondaryDisplay) {
						plug.showSecondaryDisplay({
							url: '/hybrid/html/web/index.html'
						}, (result) => {
							console.log('副屏显示结果：', result);
						});
					}
				} catch (error) {
					console.warn('副屏初始化失败：', error);
				}
				// #endif
			},
			
			// Socket连接初始化
			getSocket() {
				try {
					const socketConfig = {
						url: site.socketUrl || 'wss://www.vdamo.com/ws'
					};
					const socket = new Socket(socketConfig);
					Vue.prototype.$socket = socket;
					console.log('Socket连接已初始化');
				} catch (error) {
					console.error('Socket初始化失败：', error);
				}
			},
			
			// 音频播放（兼容H5和APP）
			playAudio(audioPath) {
				// #ifdef H5
				try {
					const audio = new Audio(audioPath);
					audio.play().catch(error => {
						console.warn('H5音频播放失败：', error);
					});
				} catch (error) {
					console.warn('H5音频初始化失败：', error);
				}
				// #endif
				
				// #ifdef APP-PLUS
				try {
					const innerAudioContext = uni.createInnerAudioContext();
					innerAudioContext.src = audioPath;
					innerAudioContext.play();
					innerAudioContext.onError((error) => {
						console.warn('APP音频播放失败：', error);
					});
				} catch (error) {
					console.warn('APP音频初始化失败：', error);
				}
				// #endif
			}
		}
	}
</script>

<style lang="scss">
	/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
	@import "uni_modules/uview-ui/index.scss";
	@import url("./common/styles/index.css");
	
	/* 全局样式 */
	page {
		background-color: #f5f5f5;
	}
	
	/* 响应式设计 */
	@media screen and (max-width: 768px) {
		.container {
			padding: 10px;
		}
	}
	
	@media screen and (min-width: 769px) and (max-width: 1024px) {
		.container {
			padding: 20px;
		}
	}
	
	@media screen and (min-width: 1025px) {
		.container {
			padding: 30px;
		}
	}
</style>