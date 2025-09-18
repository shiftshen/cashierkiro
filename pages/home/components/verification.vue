<template>
	<view class="f-y-bt h100">
		<view class="main f-1 f-c-c bf">
			<view class="f20 mb20">{{$t('verification.query_verification_code')}}</view>
			<view class="dfa mb20">
				<view class="selecthx">
					<uni-data-select v-model="order_type" :localdata="classfiy" :clear="false"
						:placeholder="$t('verification.please_select_order_source')"></uni-data-select>
				</view>
				<view style="width:550px" class="srinput">
					<u--input :placeholder="$t('verification.please_enter_or_scan_verification_code')" fontSize="18px" border="surround" v-model="code"
						style="height:55px" type="text"></u--input>
				</view>
				<u-button color="#4275F4" style="width: 100px;height:55px" @click="search"><text
						class="f20 wei6 cf">{{$t('verification.search')}}</text></u-button>
			</view>
			<view class="f16 c9">{{$t('verification.note_barcode_scanner_cursor')}}</view>
			<view class="f18 f-c f-y-c l-h1 mt5" style="color: #4275F4;" @click="handScan">
				<view class="mr5">{{$t('verification.click_to_use_camera')}}</view>
				<u-icon name="scan" color="#4275F4" size="20"></u-icon>
			</view>
			<view class="f20 mb50 mt20" style="color:#FD8906" @click="hxdl">{{$t('verification.verification_record')}}</view>
		</view>
		<codedl ref="codedlRef" @changeValue="changeValue" @cb="hxcg"></codedl>
	</view>
</template>

<script>
	import codedl from './verification/codedl.vue';
	export default ({
		components: {
			codedl,
		},
		data() {
			return {
				order_type: 1,
				classfiy: [{
						value: 1,
						text: this.$t('verification.douyin_verification')
					},
					{
						value: 2,
						text: this.$t('verification.kuaishou_verification')
					},
				],
				code: '',
			}
		},
		methods: {
			async search() {
				if (this.code) {
					let {
						msg,
						data,
						code,
					} = await this.beg.request({
						url: this.api.prepare,
						method: 'POST',
						data: {
							code: this.code,
							order_type: this.order_type,
						}
					})
					if (code && code == 200) {
						if (data && data.data) {
							this.$refs['codedlRef'].open(this.code, this.order_type, data)
						} else {
							uni.$u.toast(data && data.extra && data.extra.description)
						}
					} else {
						uni.$u.toast(msg || status || data)
					}
				} else {
					uni.$u.toast(this.$t('verification.please_enter_verification_code'))
				}
			},
			hxdl() {
				this.$emit('cT', {
					id: 61,
					icon: 'icon-dayin',
					name: this.$t('verification.verification_record')
				}, 61)
			},
			hxcg() {
				this.code = ''
				this.$refs['codedlRef'].close()
			},
			handScan() {
				var that = this
				uni.scanCode({
					onlyFromCamera: true,
					success: function(res) {
						uni.showLoading({
							title: 'loading...'
						})
						if (res.result) {
							that.code = res.result
							that.search()
						} else {
							uni.hideLoading()
						}
					},
					complete: function(res) {
						uni.hideLoading()
					}
				})
			},
		}
	})
</script>

<style lang="scss" scoped>
	// /deep/.u-button {
	// 	span {
	// 		color: #000;
	// 	}
	// }

	// .main {
	// 	.left {
	// 		display: flex;
	// 		flex-direction: column;
	// 		justify-content: space-between;
	// 		width: 500px;

	// 		/deep/.u-input {
	// 			background: #f5f5f5;
	// 		}

	// 		.list {
	// 			max-height: calc(100vh - 215px);
	// 			overflow-y: auto;
	// 		}

	// 		.isItem {
	// 			background: #fffbe7;
	// 		}
	// 	}
	// }

	.main {
		.selecthx {
			height: 100%;

			/deep/ .uni-stat__select {
				height: 100%;
			}

			/deep/ .uni-select {
				height: 100%;
			}

			/deep/ .uni-stat__actived {
				height: 100%;
			}

			/deep/ .uni-select__input-box {
				height: 100%;
			}
		}

		.srinput {}
	}
</style>