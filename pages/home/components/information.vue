<template>
	<view class="f-y-bt h100">
		<view class="right f-1 p20 bf">
			<view class="mb20 wei6">{{$t('information.business_data')}}</view>
			<view style="width:480px;">
				<u-subsection mode="subsection" activeColor="#4275F4" :list="tabs" :current="tab"
					@change="changeTab"></u-subsection>
			</view>
			<view class="mt20 mb20 wei6">{{$t('information.offline_cashier')}}</view>
			<view class="cashes">
				<view class="c_item p15" v-for="(item,index) in cashes" :key="index">
					<view class="mb10">{{item.title}}</view>
					<view class="wei6 f24">{{item.num}}</view>
					<view class="tar cfd f18 mt15" @click="detail(item,index)">{{$t('information.view_details')}}</view>
				</view>
			</view>
			<view class="mt5 mb20 wei6">{{$t('information.online_mall')}}</view>
			<view class="cashes">
				<view class="c_item p15" v-for="(item,index) in onlines" :key="index">
					<view class="mb10">{{item.title}}</view>
					<view class="wei6 f24">{{item.num}}</view>
					<view class="tar cfd f18 mt15" @click="detail(item,index)">{{$t('information.view_details')}}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default ({
		components: {},
		data() {
			return {
				tab: 0,
				tabs: [this.$t('information.today'), this.$t('information.yesterday'), this.$t('information.within_days'), this.$t('information.within_days_2'), this.$t('information.custom')],
				cashes: [{
					title: this.$t('information.estimated_revenue'),
					num: '0.00',
				}, {
					title: this.$t('information.order_amount'),
					num: '0.00',
				}, {
					title: this.$t('information.order_quantity'),
					num: 0,
				}, {
					title: this.$t('information.card_issuance_amount'),
					num: '0.00',
				}, {
					title: this.$t('information.card_issuance_quantity'),
					num: 0,
				}, {
					title: this.$t('information.member_recharge_amount'),
					num: '0.00',
				}, {
					title: this.$t('information.member_recharge_quantity'),
					num: 0,
				}, {
					title: this.$t('information.member_refund_amount'),
					num: '0.00',
				}, {
					title: this.$t('information.member_refund_quantity'),
					num: 0,
				}, {
					title: this.$t('information.store_order_members'),
					num: 0,
				}, {
					title: this.$t('information.member_balance_consumption_amount'),
					num: '0.00',
				}],
				onlines: [{
					title: this.$t('information.mall_orders'),
					num: '0.00',
				}, {
					title: this.$t('information.refund_protection'),
					num: '0.00',
				}]
			}
		},
		created: function() {},
		methods: {
			changeTab(e) {
				this.tab = e
			},
			detail(item, index) {

			}
		}
	})
</script>

<style lang="scss" scoped>
	.right {
		height: 100vh;
		overflow-y: auto;

		/deep/.u-subsection {
			height: 40px;
			border-radius: 6px;

			span {
				font-size: 18px;
				color: #000;
			}
		}

		.cashes {
			display: flex;
			flex-wrap: wrap;

			.c_item {
				margin-right: 15px;
				margin-bottom: 15px;
				width: 238px;
				height: 128px;
				border-radius: 5px;
				border: 1px solid #ddd;
			}
		}
	}
</style>