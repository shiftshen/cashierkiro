<template>
	<u-overlay :show="show" :opacity="0.2" @click="close">
		<!-- <u-popup :show="allDesc" :round="10" :overlayOpacity="0.2" mode="top" @close="close"> -->
		<view class="reduce bf p15 f18 f-y-bt" @tap.stop>
			<view class="f-x-bt mb30 mt10">
				<view class="overflowlnr f-c f-g-1 wei f24">{{title}}</view>
				<!-- <text class="iconfont icon-cuowu wei5 c6 pl10" style="font-size: 19px;" @click="close"></text> -->
			</view>
			<view class="p2 main">
				<view class="flex">
					<view class="left">{{$t('member.coupon_name_seedel')}}：</view>
					<view>{{co.name}}</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.coupon_seedel')}}ID：</view>
					<view>{{form.sn}}</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.coupon_type_seedel')}}：</view>
					<view>
						<text v-if="co.type == 1">{{$t('member.voucher_seedel')}}</text>
						<text v-if="co.type == 2">{{$t('member.discount_coupon_seedel')}}</text>
						<text v-if="co.type == 3">{{$t('member.exchange_coupon_seedel')}}</text>
						<text v-if="co.type == 4">{{$t('member.shipping_coupon_seedel')}}</text>
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.coupon_content')}}：</view>
					<view>
						<view class="f-c f-y-e" v-if="co.type==1">
							<text class="">{{co.rule && co.rule.money}}</text>
							<text class="ml5">THB</text>
						</view>
						<view class="f-c f-y-e" v-else-if="co.type==2">
							<text class="">{{co.rule && co.rule.discount}}</text>
							<text class="ml5">{{$t('member.discount')}}</text>
						</view>
						<view class="f-c f-y-e" v-else-if="co.type==3">
							<text class="f30">{{$t('member.redeem_goods')}}</text>
						</view>
						<view class="f-c f-y-e" v-else-if="co.type==4">
							<text class="f30" v-if="co.rule && co.rule.disContent==1">{{$t('member.free_delivery')}}</text>
							<text class="f36" v-if="co.rule && co.rule.disContent==3">{{$t('member.instant_discount')}}{{co.rule.money}}THB</text>
						</view>
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.usage_threshold')}}：</view>
					<view class="">
						<span v-if="co.startSwitch==0">{{$t('member.unlimited')}}</span>
						<span v-else-if="co.startSwitch==1">{{$t('member.full')}}{{co.startMoney && parseFloat(co.startMoney)}}THB可用</span>
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.applicable_stores')}}：</view>
					<view>
						<text v-if="co.storeType == 1">{{$t('member.all_stores')}}</text>
						<text v-else-if="co.storeType == 2">{{$t('member.specified_stores_applicable')}}</text>
						<text v-else-if="co.storeType == 3">{{$t('member.specified_stores_not_applicable')}}</text>
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.applicable_goods')}}：</view>
					<view>
						<text v-if="co.goodsType == 1">{{$t('member.all_goods')}}</text>
						<text v-else-if="co.goodsType == 2">{{$t('member.specified_goods_applicable')}}</text>
						<text v-else-if="co.goodsType == 3">{{$t('member.specified_goods_not_applicable')}}</text>
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.use_scenario')}}：</view>
					<view>
						<text v-if="co.scenario && co.scenario.includes(2)">{{$t('member.self_pickup')}},</text>
						<text v-if="co.scenario && co.scenario.includes(1)">{{$t('member.takeaway')}}</text>
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.receiving_time')}}：</view>
					<view>{{form.created_at}}</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.source_of_acquisition')}}</view>
					<view>{{form.channelFormat}}</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.validity_period')}}</view>
					<view v-if="co.period && co.period.type"><text
							v-if="co.period.type == 1">{{co.period.timeArr.startTime}} ~ {{co.period.timeArr.endTime}}</text>
						<text v-if="co.period.type == 2">
							{{$t('member.receive_coupon')}}{{ co.period.day.value }}</text>
						<text v-if="co.period.type == 3">
							{{$t('member.receive_coupon')}}{{
							            co.period.day.value
							          }}{{$t('member.valid_within_hours')}}
						</text>
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.coupon_description')}}</view>
					<view v-if="co.body">
						{{co.body}}
					</view>
				</view>
				<view class="flex mt15">
					<view class="left">{{$t('member.coupon_status')}}</view>
					<view>
						<text v-if="form.state == 0">{{$t('member.expired')}}</text>
						<text v-if="form.state == 1">{{$t('member.to_be_used')}}</text>
						<text v-if="form.state == 2">{{$t('member.used')}}</text>
						<text v-if="form.state == 3">{{$t('member.invalidated')}}</text>
					</view>
				</view>
			</view>
			<view class="f-1 f-y-e">
				<!-- <u-button @click="close" class="mr20"><text class="c0">取消</text></u-button> -->
				<u-button color="#4275F4" @click="close"><text class="cf">{{$t('member.confirm')}}</text></u-button>
			</view>
		</view>
	</u-overlay>
</template>

<script>
	import keybored from '@/components/liujto-keyboard/keybored.vue';
	import {
		mapState,
	} from 'vuex'
	export default {
		props: {

		},
		components: {
			keybored,
		},
		data() {
			return {
				show: false,
				title: this.$t('member.coupon_details'),
				form: {},
				co: {},
			}
		},
		computed: {
			...mapState({
				reasonConfig: state => state.config.reasonConfig,
			}),
		},
		methods: {
			open(t) {
				this.form = t
				this.co = t && t.coupon
				this.show = true
			},
			close() {
				this.show = false
			},
			save() {
				if (this.desc) this.resons.push(this.desc)
				if (this.type == 'remark') {
					this.$emit('itemRemark', this.resons, 1)
				} else {
					this.$emit('returnRemark', this.resons, 1)
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	::v-deep(.u-transition) {
		background-color: rgba(0, 0, 0, 0.1) !important;
	}

	::v-deep(.u-modal) {
		.u-modal__content {
			justify-content: flex-start;
		}

		.u-modal__button-group__wrapper__text {
			color: #000 !important;
		}
	}

	.reduce {
		position: absolute;
		// top: 7.1614vh;
		// left: 36.6032vw;
		// width: 28.5505vw;
		// height: calc(100vh - 7.1614vh);
		// border-radius: 10px;
		// box-shadow: 5px 0px 10px 0px #ccc;

		transform: translateX(-50%);
		top: 20vh;
		left: 50vw;
		width: 43.9238vw;
		height: 59.0833vh;
		border-radius: 10px;

		.tabs {
			display: inline-flex;
			border-radius: 6px;
			background: #eeeeee;

			.tab_i {
				padding: 8px 15px;
			}
		}

		.dis {
			padding: 8px 0;
			width: 23%;
			border: 1px solid #e6e6e6;
		}

		.key {
			::v-deep(.ljt-keyboard-body) {
				border-radius: 10px;
				border: 1px solid #e5e5e5;

				.ljt-keyboard-number-body {
					width: 360px !important;
					height: 275px !important;
				}

				.ljt-number-btn-ac {
					width: 90px !important;
				}

				.ljt-number-btn-confirm-2 {
					width: 100px !important;
					background: #4275F4 !important;

					span {
						color: #000;
					}
				}
			}
		}

		.reson_i {
			position: relative;
			display: inline-block;
			border: 1px solid #e6e6e6;
			padding: 8px 15px;

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
			border: 1px solid #fff;
			background: #4275F4;
			color: #fff;

			.r_gou,
			.icon-duigou {
				display: block;
			}
		}
	}

	.main {
		height: 65.1041vh;
		overflow: hidden;
		overflow-y: scroll;
		padding-bottom: 20px;

		.left {
			width: 110px;
			text-align: right;
		}
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.reduce {
			top: 20%;
			left: 50%;
			transform: translateX(-50%);
			width: 800px;
			height: 600px;
			border-radius: 10px;
		}

		.main {
			height: 500px;
		}
	}
</style>