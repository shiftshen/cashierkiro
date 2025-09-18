<template>
	<u-overlay :show="show" :opacity="0.2" @click="close">
		<view class="reduce bf f18 f-y-bt" @tap.stop>
			<view class="dfbc p20">
				<view class="f-c f-g-1 wei f24">{{$t('pay-components.freeOf_confirm')}}</view>
				<!-- <text class="iconfont icon-cuowu" @click="close"></text> -->
			</view>
			<view class="p-0-20">
				<view class="m15 c9 f14">{{$t('pay-components.freeOf_reason')}}<text class="cf5 pl5 wei6 f15">*</text></view>
				<creason :list="getReasonConfig" @getRemark="getRemark" />
			</view>
			<view class="p20 f-e butt">
				<view class="mr15">
					<u-button @click="close"><text class="f18 wei6 p10">{{$t('pay-components.freeOf_cancel')}}</text></u-button>
				</view>
				<view>
					<u-button @click="saveOrder" color="#4275F4"><text class="f18 wei6 p10">{{$t('pay-components.freeOf_and_checkout')}}</text></u-button>
				</view>
			</view>
		</view>
		<u-toast ref="uToast"></u-toast>
	</u-overlay>
</template>

<script>
	import creason from '@/components/other/creason.vue';
		import i18n from '@/locale/index.js'
	import {
		mapState,
	} from 'vuex'
	export default {
		props: {

		},
		components: {
			creason,
		},
		data() {
			return {
				show: false,
				current: 0,
				currItem: {},
				list: [],
			}
		},
		computed: {
			...mapState({
				reasonConfig: state => state.config.reasonConfig,
			}),
			getReasonConfig() {
			  const locale = i18n.locale;
			  if (locale === 'en') {
				return this.reasonConfig && this.reasonConfig.en_orderFree || []
			  } else if (locale === 'th') {
			    	return this.reasonConfig && this.reasonConfig.th_orderFree || []
			  } else {
			    	return this.reasonConfig && this.reasonConfig.orderFree || []
			  }
			},
		},
		methods: {
			open() {
				this.show = true
			},
			close() {
				this.show = false
			},
			getRemark(e) {
				this.resons = e
			},
			async saveOrder() {
				if (this.resons && this.resons.length > 0) {
					this.$emit('save',this.resons)
				} else {
					uni.showToast({
						title: this.$t('pay-components.freeOf_enter_reason'),
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.reduce {
		position: absolute;
		transform: translateX(-50%);
		top: 25vh;
		left: 50vw;
		width: 36.6032vw;
		// height: 39.0625vh;
		border-radius: 10px;

		.reson_i {
			position: relative;
			display: inline-flex;
			flex-direction: column;
			justify-content: space-between;
			border: 1px solid #e6e6e6;
			width: 160px;
			height: 120px;

			.r_gou {
				display: none;
				position: absolute;
				top: 0px;
				right: 0px;
				width: 0;
				height: 0;
				border-top: 10px solid #4275F4;
				border-right: 10px solid #4275F4;
				border-left: 10px solid transparent;
				border-bottom: 10px solid transparent;
			}

			.icon-duigou {
				display: none;
				position: absolute;
				top: -2px;
				right: -2px;
				transform: scale(0.6);
			}
		}

		.acreson_i {
			border: 1px solid #FD8906;
			background: #fff9dd;

			.r_gou,
			.icon-duigou {
				display: block;
			}
		}
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.reduce {
			position: absolute;
			top: 80px;
			left: 50%;
			transform: translateX(-50%);
			width: 500px;
			// height: 300px;
			border-radius: 10px;
		}
	}
</style>