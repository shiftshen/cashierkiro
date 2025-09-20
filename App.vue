<script>
	import Vue from 'vue'
	import Socket from "@/common/socket.js"
	import site from '@/custom/siteroot.js';
	import i18n from '@/locale/index.js'
	// #ifdef APP-PLUS
	const plug = uni.requireNativePlugin("Html5app-TwoDisplay");
	// #endif
	export default {
		onLaunch: function() {
			// #ifdef APP-PLUS
			plus.screen.lockOrientation('landscape-primary');
			plus.navigator.setFullscreen(true);
			// #endif
			uni.getSystemInfo({
				success: (res) => {
					// console.log("屏幕尺寸：", res.windowWidth, res.windowHeight)
					Vue.prototype.phone = false
					Vue.prototype.cash = false
					Vue.prototype.pad = false
					Vue.prototype.pc = false
					if (res.windowWidth > 0 && res.windowWidth <= 500) {
						Vue.prototype.phone = true
					} else if (res.windowWidth > 500 && res.windowWidth <= 1150) {
						Vue.prototype.pad = true
					} else if (res.windowWidth > 1150 && res.windowWidth <= 1500) {
						Vue.prototype.cash = true
					} else if (res.windowWidth > 1500 && res.windowWidth <= 3280) {
						Vue.prototype.pc = true
					}
				}
			});
			this.getSocket()

			// #ifdef APP-PLUS
			var url = site.screenurl + "?type=0&lang=" + i18n.locale;
			plug.showWebUrl({
				url: url
			}, ret => {});
			// #endif
		},
		onShow: function() {
			// 应用显示时的处理
			console.log('App onShow');
		},
		onHide: function() {},
		methods: {
			getSocket() {
				uni.$on('socketInit', this.socketMsg);
				this.createInnerAudio()
				let token = uni.getStorageSync('token'),
					storeId = uni.getStorageSync('storeId'),
					uniacid = uni.getStorageSync('uniacid');
				if (token && storeId && uniacid) {
					this.socketMsg()
				}
			},
			createInnerAudio() {
				this.bgAudioMannager = uni.createInnerAudioContext();
				this.bgAudioMannager.title = '订单提醒';
				console.log('rm', this.bgAudioMannager)
			},
			socketMsg() {
				// #ifdef APP-PLUS
				let sroot = site.siteroot
				// #endif
				// #ifndef APP-PLUS 
				let sroot = site.siteroot
				// #endif
				console.log(sroot)
				let wsUrl = sroot.replace(/(https|http)/, 'wss');
				console.log(wsUrl)
				let chatConfig = {}
				chatConfig.url = `${wsUrl}/ws`
				this.socket = new Socket(chatConfig)
				var addNum = 0,
					voiceList = [],
					autoText = this.bgAudioMannager
				//console.log('msrm', this.bgAudioMannager)
				let voiceNum = 0;
				this.socket.onMessage((msg) => {
					console.log('ping', msg)
					// console.log('ping', msg.msg)
					if (msg.type && msg.type == 'voice') {
						if (msg.msg) {
							console.log('voice1', msg.msg)
							var msgs = msg.msg
							voiceNum = msgs.num
							console.log(voiceNum)
							autoText.src = msgs.voiceUrl
							autoText.onCanplay(a => {
								if (voiceNum > 0) {
									voiceNum--; // 在这里减少播放次数
									autoText.play();
									// console.log('play21', msgs);
									// console.log('当前剩余播放次数1:', voiceNum);
								}
							});
							autoText.onEnded((res) => {
								//console.log('当前剩余播放次数2:', voiceNum);
								if (voiceNum > 0) {
									autoText.play()
									voiceNum--
								} else {
									// #ifdef H5
									autoText.destroy()
									autoText = uni.createInnerAudioContext()
									// #endif
								}
							})
							autoText.onError((res) => {
								console.log('errMsg', res.errMsg);
								console.log('errCode', res.errCode);
							});
						}
					} else if (msg.type && msg.type == 'mqttvoice') {
						console.log('mqttvoice', msg)
					}
				})
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