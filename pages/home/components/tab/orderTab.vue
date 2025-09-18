<template>
	<view class="tabs">
		<u-tabs :list="list1" @click="handTabs" :current="current" lineColor="#4275F4"
			:activeStyle="{fontWeight: 'bold',color:'#000'}"></u-tabs>
	</view>
</template>

<script>
	export default ({
		components: {},
		data() {
			return {
				list1: [{
					name: this.$t('tab.in_store_order'),
					value: 'inStoreRef',
				}, {
					name:  this.$t('tab.self_pickup_order'),
					value: 'selfRef',
				}, {
					name: this.$t('tab.self_operated_takeaway'),
					value: 'sideRef',
				}, {
					name: this.$t('tab.payment_order'),
					value: 'billRef',
				}, {
					name: this.$t('tab.stored_value_order'),
					value: 'valueRef',
				}, {
					name: this.$t('tab.points_mall'),
					value: 'integralRef',
				}],
				current: 0,
			}
		},
		methods: {
			handTabs(e) {
				this.$emit('handTabs', e)
			},
		}
	})
</script>

<style lang="scss" scoped>
	.tabs {
		.tab_i {
			display: inline-block;
			background: #f5f5f5;
			border: 1px solid #e5e5e5;
		}

		.curr {
			background: #4275F4;
			color: #000;
			border: 1px solid #4275F4;
		}

		// ::v-deep(.u-tabs__wrapper__nav__item__text) {
		// 	font-weight: bold;
		// }
	}
</style>