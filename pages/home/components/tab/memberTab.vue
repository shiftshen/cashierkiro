<template>
	<view class="tabs">
		<u-tabs :list="list1" @click="handTabs" :current="current" lineColor="#4275F4" :activeStyle="{fontWeight: 'bold',color:'#000'}"></u-tabs>
	</view>
</template>

<script>
	export default ({
		components: {},
		data() {
			return {
				list1: [{
					name:  this.$t('tab.member_information'),
					value: 'userInfo',
				}, {
					name: this.$t('tab.coupons'),
					value: 'couponInfo',
				}, {
					name: this.$t('tab.stored_value_change_details'),
					value: 'valueInfo',
				}, {
					name: this.$t('tab.points_details'),
					value: 'integralInfo',
				}, {
					name:  this.$t('tab.membership_card_information'),
					value: 'cardInfo',
				}],
				current: 0,
			}
		},
		methods: {
			handTabs(e) {
				this.$emit('handTabs',e)
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
	}
</style>