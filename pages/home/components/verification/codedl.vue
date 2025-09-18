<template>
	<view class="">
		<u-popup :show="show" :round="10" :closeable="true" mode="center" @close="close">
			<view class="cash">
				<view class="f-c f-y-c pt20">
					<view class="tac wei6 f24">{{$t('verification.voucher_info')}}</view>
				</view>
				<view class="p20 f16">
					<view class="f-bt mb20">
						<view class="f-g-0 c9 pr10">{{$t('verification.voucher_code')}}:</view>
						<view class="f-g-1">{{code}}</view>
					</view>
					<block
						v-if="addForm.data && addForm.data.certificates && addForm.data.certificates.length && addForm.data.certificates[0]">
						<view class="f-bt mb20">
							<view class="f-g-0 c9 pr10">{{$t('verification.package_name')}}:</view>
							<view class="f-g-1" v-if="addForm.data.certificates[0].sku">
								{{ addForm.data.certificates[0].sku.title }}
							</view>
						</view>
						<view class="f-bt mb20">
							<view class="f-g-0 c9 pr10">{{$t('verification.original_amount')}}:</view>
							<view class="f-g-1"
								v-if="addForm.data.certificates[0].amount && addForm.data.certificates[0].amount.original_amount">
								฿{{ addForm.data.certificates[0].amount.original_amount/100 }}</view>
						</view>
						<view class="f-bt mb20">
							<view class="f-g-0 c9 pr10">{{$t('verification.actual_payment_amount')}}:</view>
							<view class="f-g-1"
								v-if="addForm.data.certificates[0].amount && addForm.data.certificates[0].amount.pay_amount">
								฿{{ addForm.data.certificates[0].amount.pay_amount/100}}</view>
						</view>
						<view class="f-bt mb20">
							<view class="f-g-0 c9 pr10">{{$t('verification.discount_amount')}}:</view>
							<view class="f-g-1"
								v-if="addForm.data.certificates[0].amount && addForm.data.certificates[0].amount.payment_discount_amount">
								฿{{ addForm.data.certificates[0].amount.payment_discount_amount/100 }}</view>
						</view>
					</block>
				</view>
			</view>
			<view class="f-1 f-y-e mt30 p20">
				<u-button @click="close" class="mr20 qx">{{$t('verification.cancel')}}</u-button>
				<u-button color="#4275F4" @click="sureAdd"><text class="cf">{{$t('verification.confirm_verification')}}</text></u-button>
			</view>
		</u-popup>
		<u-modal :show="rescind" :showCancelButton="true" width="300px" title=" " :content="$t('verification.confirm_verification_package')"
			confirmColor="#fff" @cancel="rescind=false,show = true" @confirm="save"></u-modal>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	export default {
		props: {

		},
		components: {

		},
		data() {
			return {
				show: false,
				code: '',
				order_type: '',
				addForm: {},
				focus: false,
				rescind: false,
			}
		},
		computed: {
			...mapState({
				storeId: state => state.storeId,
			}),
		},
		methods: {
			open(c, t, v) {
				this.code = c
				this.order_type = t
				this.addForm = v
				this.show = true
			},
			hide() {
				this.focus = true
				var interval = setInterval(function() {
					uni.hideKeyboard()
				}, 60);
				setTimeout(() => {
					clearInterval(interval)
				}, 2000)
			},
			close() {
				this.code = ''
				this.order_type = ''
				this.addForm = {}
				this.show = false
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
							that.value = res.result
							that.$emit('changeValue', res.result)
						} else {
							uni.hideLoading()
						}
					},
					complete: function(res) {
						uni.hideLoading()
					}
				})
			},
			sureAdd(e) {
				this.show = false
				this.rescind = true
			},
			async save() {
				let {
					msg,
					data,
					code,
					status,
				} = await this.beg.request({
					url: this.api.verify,
					method: 'POST',
					data: {
						code: this.code,
						order_type: this.order_type,
						verify_data: this.addForm,
						storeId: this.storeId
					}
				})
				if(code && code==200){
					uni.$u.toast(msg || status || data)
					this.$emit('cb')
					this.rescind = false
				}else{
					this.rescind = false
					this.show = true
					uni.$u.toast(msg || status || data)
				}
			},
			doneAdd() {
				if (this.value <= 0) {
					return uni.$u.toast(this.$t('verification.please_enter_more_than'))
				}
				this.$emit('changeValue', this.value)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.cash {
		width: 450px;
		// height: 416px;

		/deep/.u-input {
			padding: 9px !important;
		}

		/deep/.ljt-keyboard-body {
			border: 1px solid #e5e5e5;

			.ljt-keyboard-number-body {
				width: 450px !important;
				height: 275px !important;
			}

			.ljt-number-btn-ac {
				// width: 100px !important;
			}

			.ljt-number-btn-confirm-2 {
				// width: 100px !important;
				background: #4275F4 !important;
			}
		}

		/deep/.u-input__content__field-wrapper__field {
			font-size: 22px !important;
			font-weight: bold;
		}

		.zchy {
			background: #f0f0f0;
		}
	}

	@media (min-width: 500px) and (max-width: 900px) {
		.cash {
			/deep/.ljt-keyboard-body {
				.ljt-keyboard-number-body {
					height: 150px !important;
				}
			}
		}
	}
</style>