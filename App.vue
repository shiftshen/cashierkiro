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
		
		methods: {
			// 初始化设备类型检测
			initDeviceType() {
				uni.getSystemInfo({
					success: (res) => {
						console.log("屏幕尺寸：", res.windowWidth, res.windowHeight);
						
						// 重置所有设备类型标志
						Vue.prototype.phone = false;
						Vue.prototype.cash = false;
						Vue.prototype.pad = false;
						Vue.prototype.pc = false;
						
						// 根据屏幕宽度设置设备类型
						const width = res.windowWidth;
						if (width > 0 && width <= 500) {
							Vue.prototype.phone = true;
						} else if (width > 500 && width <= 1150) {
							Vue.prototype.pad = true;
						} else if (width > 1150 && width <= 1500) {
							Vue.prototype.cash = true;
						} else if (width > 1500 && width <= 3280) {
							Vue.prototype.pc = true;
						}
						
						// 设置全局设备信息
						Vue.prototype.$deviceInfo = {
							width: width,
							height: res.windowHeight,
							platform: res.platform,
							system: res.system
						};
					},
					fail: (error) => {
						console.error('获取系统信息失败:', error);
						// 设置默认值
						Vue.prototype.pc = true;
					}
				});
			},
			
			// 初始化副屏显示
			initSecondaryDisplay() {
				// #ifdef APP-PLUS
				try {
					if (plug && site.screenurl) {
						const url = site.screenurl + "?type=0&lang=" + i18n.locale;
						plug.showWebUrl({
							url: url
						}, (ret) => {
							console.log('Secondary display result:', ret);
						});
					}
				} catch (error) {
					console.warn('Secondary display initialization failed:', error);
		onShow: function() {
			// 应用显示时的处理
			console.log('App onShow');
		},
		
		onHide: function() {
=======
				}
				// #endif
			},
		
		onShow: function() {
			// 应用显示时的处理
			console.log('App onShow');
		},
		
		onHide: function() {
=======
		onShow: function() {
			// 应用显示时的处理
			console.log('App onShow');
		},
		
		onHide: function() {
			// 应用隐藏时的处理
			console.log('App onHide');
		},
		
		methods: {
			// Socket连接初始化
			getSocket() {
				try {
					uni.$on('socketInit', this.socketMsg);
					this.createInnerAudio();
					
					// 安全获取存储数据
					const token = this.safeGetStorage('token');
					const storeId = this.safeGetStorage('storeId');
					const uniacid = this.safeGetStorage('uniacid');
					
					if (token && storeId && uniacid) {
						this.socketMsg();
					}
				} catch (error) {
					console.error('Socket initialization failed:', error);
				}
			},
			
			// 安全的存储获取方法
			safeGetStorage(key) {
				try {
					return uni.getStorageSync(key) || null;
				} catch (error) {
					console.warn(`Failed to get storage ${key}:`, error);
					return null;
				}
			},
			
			// 创建音频上下文
			createInnerAudio() {
				try {
					this.bgAudioMannager = uni.createInnerAudioContext();
					this.bgAudioMannager.title = '订单提醒';
					console.log('Audio context created:', this.bgAudioMannager);
				} catch (error) {
					console.error('Failed to create audio context:', error);
					this.bgAudioMannager = null;
				}
			},
			
			// Socket消息处理
			socketMsg() {
				try {
					const sroot = site.siteroot;
					if (!sroot) {
						console.error('Site root not configured');
						return;
					}
					
					console.log('Site root:', sroot);
					const wsUrl = sroot.replace(/(https|http)/, 'wss');
					console.log('WebSocket URL:', wsUrl);
					
					const chatConfig = {
						url: `${wsUrl}/ws`
					};
					
					this.socket = new Socket(chatConfig);
					this.setupSocketMessageHandler();
				} catch (error) {
					console.error('Socket message setup failed:', error);
				}
			},
			
			// 设置Socket消息处理器
			setupSocketMessageHandler() {
				if (!this.socket) return;
				
				let voiceNum = 0;
				const autoText = this.bgAudioMannager;
				
				this.socket.onMessage((msg) => {
					console.log('Socket message received:', msg);
					
					try {
						if (msg.type === 'voice' && msg.msg) {
							this.handleVoiceMessage(msg.msg, autoText, voiceNum);
						} else if (msg.type === 'mqttvoice') {
							console.log('MQTT voice message:', msg);
						}
					} catch (error) {
						console.error('Message handling error:', error);
					}
				});
			},
			
			// 处理语音消息
			handleVoiceMessage(msgData, audioContext, voiceNum) {
				if (!audioContext || !msgData) return;
				
				try {
					console.log('Processing voice message:', msgData);
					voiceNum = msgData.num || 1;
					console.log('Voice play count:', voiceNum);
					
					audioContext.src = msgData.voiceUrl;
					
					audioContext.onCanplay(() => {
						if (voiceNum > 0) {
							voiceNum--;
							audioContext.play();
							console.log('Playing audio, remaining plays:', voiceNum);
						}
					});
					
					audioContext.onEnded(() => {
						console.log('Audio ended, remaining plays:', voiceNum);
						if (voiceNum > 0) {
							audioContext.play();
							voiceNum--;
						} else {
							// H5环境下重新创建音频上下文
							// #ifdef H5
							try {
								audioContext.destroy();
								this.createInnerAudio();
							} catch (error) {
								console.warn('Audio context recreation failed:', error);
							}
							// #endif
						}
					});
					
					audioContext.onError((res) => {
						console.error('Audio error:', res.errMsg, res.errCode);
					});
				} catch (error) {
					console.error('Voice message handling error:', error);
				}
			}
		},
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "@/uni_modules/uview-ui/index.scss";
	@import "./common/icons/iconfont.css";
	@import "./common/icon/iconfont.css";
	@import './common/styles/index.css';
	@import './common/styles/my.css';
	@import "./common/styles/media.css";

	$pc: "(min-width: 1500px) and (max-width: 3280px)";
	$cash: "(min-width: 1150px) and (max-width: 1500px)";
	$pad: "(min-width: 500px) and (max-width: 1150px)";
	$phone: "(min-width: 0px) and (max-width: 500px)";

	page {
		width: 100%;
		height: 100vh;
		max-height: 100vh;
		box-sizing: border-box;
	}

	/* #ifdef H5 */
	uni-page-head {
		display: none;
	}

	/* #endif */
</style>