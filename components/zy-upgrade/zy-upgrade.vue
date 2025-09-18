<template>
	<view class="zy-modal" :class="{show: dshow}">
		<view class="zy-dialog" style="background-color: transparent;">
			<view class="padding-top text-white" :class="'zy-upgrade-topbg-' + theme">
				<view><text class="zy-upgrade-title">{{$t("upgrade.discoverNewVersion")}}</text></view>
				<text class="flex-wrap">{{ version }}</text>
			</view>
			<view class="padding-xl bg-white text-left">
				<scroll-view style="max-height: 200rpx;" scroll-y="auto" v-if="!update_flag">
					<text v-html="update_tips"></text>
				</scroll-view>
				<view class="zy-progress radius striped active" v-if="update_flag">
					<view :class="'bg-' + theme" :style="'width: ' + update_process + '%;'">
						{{ parseInt(update_process) + '%' }}
					</view>
				</view>
			</view>
			<view class="zy-bar bg-white justify-end">
				<view class="action" v-if="!update_flag">
					<button class="zy-btn" :class="'bg-' + theme"
						@click="upgrade_checked">{{$t("upgrade.confirmUpgrade")}}</button>
					<button class="zy-btn margin-left" :class="'line-' + theme" v-if="!forceupgrade"
						@click="upgrade_cancel">{{$t("upgrade.cancelUpgrade")}}</button>
				</view>
				<view class="action text-center" v-if="update_flag && !forceupgrade">
					<button class="zy-btn" :class="'bg-' + theme"
						@click="upgrade_break">{{$t("upgrade.interruptUpgrade")}}</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		mapState,
	} from 'vuex';
	export default {
		name: 'ZyUpgrade',
		props: {
			theme: {
				//主题，目前支持green,pink,blue,yellow,red
				type: String,
				default: 'yellow',
			},
			updateurl: {
				//升级检测url，全路径
				type: String,
				default: ''
			},
			h5preview: {
				//H5界面下是否预览升级
				type: Boolean,
				default: false
			},
			oldversion: {
				//如果是H5，为了方便测试，可以传入一个旧版本号进来。
				type: String,
				default: ''
			},
			oldcode: {
				//如果是H5，为了方便测试，可以传一个旧版本的code进来。
				type: Number,
				default: 0
			},
			appstoreflag: {
				//是否启用appstore升级，如果启用，由服务端返回appstore的地址
				type: Boolean,
				default: false
			},
			noticeflag: {
				//是否通知主界面无需更新
				type: Boolean,
				default: false
			},
			autocheckupdate: {
				//是否页面截入时就判断升级
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				update_flag: false, //点击升级按钮后，显示进度条
				dshow: false,
				update_process: 0,
				downloadTask: [],
				updated2version: '',
				version_url: '',
				update_tips: '',
				forceupgrade: true,
				currentversion: this.oldversion,
				versionname: '',
				vesioncode: this.oldcode,
				wgt_flag: 0,
				downloadURL: '',
				wgt_url: '',
				size: 0, //开启gzip等情形下，获取不到安装包大小，可以服务端返回安装包大小
				tempFilePath: null
			};
		},
		mounted() {
			let app_flag = false;
			// #ifdef APP-PLUS
			app_flag = true;
			// #endif
			if ((this.h5preview || app_flag) && this.autocheckupdate) {
				console.log('检测升级');
				// 15s 根据手机性能设置 要是15s还没进index首页 整个app就会卡在加载页面
				setTimeout(() => {
					this.check_update(false);
				}, 2000)
			}
		},
		computed: {
			...mapState(['account']),
			version() {
				let retversion = '';
				retversion = this.currentversion + (this.currentversion != '' && this.updated2version != '' ? '->' : '') +
					this.updated2version;
				return retversion;
			}
		},
		methods: {
			/**
			 * @param {Boolern}  flag 表示主动检查更新时的弹窗
			 */
			//检测升级
			check_update(flag = false) {
				plus.runtime.getProperty(plus.runtime.appid, (widgetInfo) => {
					console.log(widgetInfo)
					this.currentversion = widgetInfo.version;
					this.versionname = widgetInfo.name;
					this.versioncode = widgetInfo.versionCode;
					this.getNewestVersion(flag)
				});
			},
			// 获取线上信息
			async getNewestVersion(flag) {
				console.log(this.api.upgradeInfo)
				let {
					data
				} = await this.beg.request({
					url: this.api.upgradeInfo,
					method: 'POST',
					data: {
						version: this.currentversion || '1.0.0'
					},

				})
				if (data &&  data.version) {
					console.log('1212-1', this.versioncode)
					console.log('1212-2', data.version.replace(/\./g, ""))
					console.log('1212', this.versioncode < data.version.replace(/\./g, ""))
					if (this.versioncode < data.version.replace(/\./g, "")) {
						this.updated2version = data.version
						this.update_tips = data.remark
						this.dshow = true;
						this.downloadURL = data.downloadURL
					} else {
						if (flag) {
							uni.showToast({
								title: this.$t("upgrade.noNewVersionFound"),
								icon: 'none'
							});
						}

					}
				}else {
					if (flag) {
						uni.showToast({
							title: this.$t("upgrade.noNewVersionFound"),
							icon: 'none'
						});
					}
				}
			},
			//点击开始升级按钮，开始升级
			upgrade_checked() {
				this.update_flag = true;
				this.updateversion();
			},
			//点击取消升级按钮，取消升级
			upgrade_cancel() {
				this.dshow = false;
			},
			//升级过程中，点击中断升级按钮，中断升级
			upgrade_break() {
				this.downloadTask.abort();
				this.update_flag = false;
			},
			//升级下载apk安装包的具体处理业务逻辑
			updateversion() {
				let platform = uni.getSystemInfoSync().platform;
				console.log('操作系统：', platform);
				if (platform == 'ios' && this.appstoreflag) {
					//如果启用ios appstore升级，则打开appstore
					that.dshow = false;
					console.log('跳转至appstore');
					plus.runtime.launchApplication({
							action: that.version_url
						},
						function(e) {
							uni.showToast({
								title: this.$t("upgrade.openAppStoreFailed"),
								icon: 'none'
							});
						}
					);
				} else {
					this.update_confirm = true;
					this.downloadTask = uni.downloadFile({
						url: this.downloadURL,
						success: (res) => {
							if (res.statusCode == 200) {
								this.tempFilePath = res.tempFilePath
							} else {
								uni.showToast({
									title: this.$t("upgrade.downloadFailedNetworkError"),
									icon: 'none'
								});
							}
						},
						fail: (e) => {
							this.update_flag = false;
							console.log('下载失败', e);
							uni.showToast({
								title: this.$t("upgrade.downloadFailedNetworkError"),
								icon: 'none'
							});
						},
						complete: (msg) => {
							console.log(msg)
						}
					});
					this.downloadTask.onProgressUpdate((res) => {
						this.update_process = res.progress;
						if (parseInt(this.update_process) == 100) {
							setTimeout(() => {
								this.intallApp()
							}, 1500)
						}
					});
				}
			},
			intallApp() {
				//开始安装
				plus.runtime.install(
					this.tempFilePath, {
						force: false
					},
					() => {
						console.log('install success...');
						plus.runtime.restart();
					},
					(e) => {
						console.error('install fail...', e);
						uni.showToast({
							title: this.$t("upgrade.upgradeFailed"),
							icon: 'none'
						});
					}
				);
			}
		}
	};
</script>

<style scoped>
	@import url('static/css/main.css');

	.zy-upgrade-topbg-green {
		background-image: url('static/images/green.png');
		background-size: 100% 100%;
		background-repeat: no-repeat;
		height: 290rpx;
	}

	.zy-upgrade-topbg-red {
		background-image: url('static/images/red.png');
		background-size: 100% 100%;
		background-repeat: no-repeat;
		height: 290rpx;
	}

	.zy-upgrade-topbg-pink {
		background-image: url('static/images/pink.png');
		background-size: 100% 100%;
		background-repeat: no-repeat;
		height: 290rpx;
	}

	.zy-upgrade-topbg-yellow {
		background-image: url('static/images/yellow.png');
		background-size: 100% 100%;
		background-repeat: no-repeat;
		height: 290rpx;
	}

	.zy-upgrade-topbg-blue {
		background-image: url('static/images/blue.png');
		background-size: 100% 100%;
		background-repeat: no-repeat;
		height: 290rpx;
	}

	.zy-upgrade-title {
		font-size: 50rpx;
		color: white;
	}
</style>