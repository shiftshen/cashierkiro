<template>
	<u-popup :show="fqps" :safeAreaInsetBottom="false" round="10" @close="fqps=false" @open="fqps=true" mode="center">
		<view class="psw">
			<view class="flex p-10-0">
				<view class="f-g-0">{{$t('order.delivery_address')}}</view>
				<view class="ml10 mr15" v-if="rows.address">
					<view class="wei">
						{{ rows.address.address }} {{ rows.address.description }}
					</view>
					<view class="mt5 f12">
						{{ rows.address.contact }}（{{ rows.address.call }}）{{
				              rows.address.mobile
				            }}
					</view>
				</view>
			</view>
			<view class="flex p-10-0">
				<view class="f-g-0">{{$t('order.delivery_method')}}</view>
				<view class="ml10 mr15 f-g-1">
					<u-radio-group v-model="psform.deliveryType" @change="changeType" placement="column"
						iconColor="#fff" labelSize='14'>
						<view class="mb5" v-if="rows.deliveryStoreRule && rows.deliveryStoreRule.deliveryType==1">
							<u-radio activeColor="#4275F4" :label="$t('order.platform_delivery')" :name="1"></u-radio>
						</view>
						<view class="mb5"><u-radio activeColor="#4275F4" :label="$t('order.store_self_delivery')" :name="2"></u-radio></view>
					</u-radio-group>
				</view>
			</view>
			<view class="flex p-10-0">
				<view class="f-g-0">{{$t('order.delivery_channel')}}</view>
				<view class="ml10 mr15 f-g-1">
					<u-radio-group v-model="psform.channel" placement="column" labelSize='14' iconColor="#fff">
						<view class="mb5" v-if="psform.deliveryType == 2">
							<u-radio activeColor="#4275F4" :label="$t('order.store_self_delivery')" :name="0"></u-radio>
						</view>
						<view class="mb5"
							v-if="fhChannel.includes(1) && (rows.deliveryStoreRule && rows.deliveryStoreRule.deliveryType==2 || psform.deliveryType==1)">
							<u-radio activeColor="#4275F4" :label="mytName" :name="1"></u-radio>
						</view>
						<view class="mb5"
							v-if="fhChannel.includes(2) && (rows.deliveryStoreRule && rows.deliveryStoreRule.deliveryType==2 || psform.deliveryType==1)">
							<u-radio activeColor="#4275F4" :label="mKName" :name="2"></u-radio>
						</view>
						<view class="mb5" v-if="psform.deliveryType == 2 && fhChannel.includes(3)"><u-radio
								activeColor="#4275F4" :label="wsbName" :name="3"></u-radio>
						</view>
					</u-radio-group>
				</view>
			</view>
			<view class="mt20">
				<u-button type="primary" color="#4275F4" customStyle="color:'#fff'" @click="save"><text
						class="cf">{{$t('modal.confirmText')}}</text></u-button>
			</view>
		</view>
	</u-popup>
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
				fqps: false,
				title: this.$t('order.initiate_delivery'),
				psform: {
					deliveryType: 1,
					channel: 1,
				},
				storeInfo: {},
				rows: {},
				mytName: "",
				mKName: "",
				wsbName: "",
				fhChannel: [],
			}
		},
		computed: {
			...mapState({
				reasonConfig: state => state.config.reasonConfig,
			}),
		},
		methods: {
			// 添加缺失的 changeType 方法
			changeType(value) {
				console.log('配送方式改变:', value);
				// 当配送方式改变时，重置配送渠道
				if (value === 1) {
					// 平台配送
					this.psform.channel = 1;
				} else if (value === 2) {
					// 商家自配送
					this.psform.channel = 0;
				}
			},
			open(row) {
				let {
					deliverySetting
				} = uni.getStorageSync('setInfo')
				this.mytName = deliverySetting.appId || "";
				this.mKName = deliverySetting.appId2 || "";
				this.wsbName = deliverySetting.wsbName || "";
				let info = uni.getStorageSync('storeInfo')
				if (info) {
					this.storeInfo = info;
				}
				if (row.deliveryStoreRule.channel.includes(1)) {
					this.psform.channel = 1;
				} else if (row.deliveryStoreRule.channel.includes(2)) {
					this.psform.channel = 2;
				} else if (row.deliveryStoreRule.channel.includes(3)) {
					this.psform.channel = 3;
				} else {
					this.psform.channel = null;
				}
				this.psform.deliveryType = row.deliveryType
				this.fhChannel = row.deliveryStoreRule && row.deliveryStoreRule.channel
				this.rows = row;
				this.fqps = true
			},
			close() {
				this.desc = ''
				this.fqps = false
			},
			async save() {
				if (!this.psform.channel && String(this.psform.channel) !== '0') {
					return uni.$u.toast(this.$t('order.please_select_delivery_channel'))
				}
				let {
					msg
				} = await this.beg.request({
					url: `${this.api.delivery}/${this.rows.id}`,
					method: "POST",
					data: this.psform,
				})
				this.$emit('psChannel')
				uni.$u.toast(msg)
				this.fqps = false
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

	.psw {
		padding: 30rpx;
		font-size: 28rpx;
		width: 650rpx;
	}
</style>