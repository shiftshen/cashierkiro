<template>
	<view class="page w100 h100">
		<view class="top bf mb5 f-x-bt p15 w100">
			<view class="flex f-y-c" @click="back">
				<u-icon name="arrow-leftward" color="#000" size="24"></u-icon>
				<text class="ml10 f20">{{$t('handover.handover_details')}}</text>
			</view>
			<view class="dfa">
				<tool @cT="changeTab"></tool>
			</view>
		</view>
		<view class="f-1 w100 p20 bf main">
			<view class="f-bt p20 bbtr">
				<view class="f-g-1">
					<view class="c9 f14">{{$t('handover.shift_start_time')}}</view>
					<view class="wei f34 c0 mt10" v-if="hdata.startTime">{{hdata.startTime.substr(11,8)}}</view>
					<view class="c0 mt10 f16">{{hdata.startTime}}</view>
				</view>
				<view class="f-g-1">
					<view class="c9 f14">{{$t('handover.handover_time')}}</view>
					<view class="wei f34 c0 mt10" v-if="hdata.endTime">{{hdata.endTime.substr(11,8)}}</view>
					<view class="c0 mt10 f16">{{hdata.endTime}}</view>
				</view>
				<view class="f-g-1">
					<view class="c9 f14">{{$t('handover.handover_person')}}</view>
					<view class="wei f34 c0 mt10">{{hdata.admin && hdata.admin.nickname}}</view>
				</view>
				<view class="f-g-1">
					<view class="c9 f14">{{$t('handover.settled_orders_count')}}</view>
					<view class="wei f34 c0 mt10">
						{{hdata.contents && hdata.contents.orderCount}}{{$t('handover.order')}}</view>
					<view class="mt10 f16 c9">{{$t('handover.unsettled_orders_not_included')}}</view>
				</view>
			</view>
			<!-- <view class="f-bt f-y-c p10">
				<view class="search flex f-g-1 f-y-c">
					<view class="tabs flex">
						<view class="itab p-10-20 mr10 f16 c0" :class="{'ctab' : tab == i}" v-for="(v,i) in tabs"
							:key="i" @click="changeTabs(v,i)">
							{{v.name}}
						</view>
					</view>
				</view>
			</view> -->
			<view class="bf p30 f-bt bbtr mt20">
				<view class="f-g-1" v-for="(v,i) in tj" :key="i">
					<view class="c9 f14">{{v.name}}</view>
					<view class="wei f24 c0 mt10">{{v.money}}</view>
				</view>
			</view>
			<view class="bf mt20">
				<view class="f-bt mb20">
					<view class="wei f20 c0">{{$t('handover.business_statistics')}}</view>
				</view>
				<uni-table ref="table" :loading="tbloading" border stripe :emptyText="$t('handover.no_details')">
					<uni-tr>
						<uni-th align="center">{{$t('handover.turnover')}}</uni-th>
						<uni-th align="center">{{$t('handover.business_income')}}</uni-th>
						<uni-th align="center">{{$t('handover.discount_amount')}}</uni-th>
						<uni-th align="center">{{$t('handover.valid_orders_count')}}</uni-th>
						<uni-th align="center">{{$t('handover.refund_orders')}}/{{$t('handover.amount')}}</uni-th>
						<uni-th align="center">{{$t('handover.stored_value_orders')}}/{{$t('handover.amount')}}</uni-th>
					</uni-tr>
					<uni-tr v-for="(row, i) in hdata.contents && hdata.contents.dataList" :key="i">
						<uni-td align="center">{{ row.sellMoney}}</uni-td>
						<uni-td align="center">{{ row.money}}</uni-td>
						<uni-td align="center">{{ row.discountMoney }}</uni-td>
						<uni-td align="center">{{ row.orderCount }}</uni-td>
						<uni-td align="center">{{ row.refundOrder }}/{{ row.refundMoney }}</uni-td>
						<uni-td align="center">{{ row.chuzhiOrder }}/{{ row.chuzhiMoney }}</uni-td>
					</uni-tr>
				</uni-table>
			</view>
			<view class="bf mt20">
				<view class="f-bt mb20">
					<view class="wei f20 c0">{{$t('handover.collection_statistics')}}</view>
				</view>
				<uni-table ref="table" :loading="tbloading" border stripe :emptyText="$t('handover.no_details')">
					<uni-tr>
						<uni-th align="center">{{$t('handover.collection_method')}}</uni-th>
						<uni-th align="center">{{$t('handover.collection_count')}}</uni-th>
						<uni-th align="center">{{$t('handover.collection_subtotal')}}</uni-th>
						<uni-th align="center">{{$t('handover.business_income')}}</uni-th>
					</uni-tr>
					<uni-tr v-for="(row, i) in hdata.contents && hdata.contents.payTrend" :key="i">
						<uni-td align="center">{{ row.name}}</uni-td>
						<uni-td align="center">{{ row.orderCount}}</uni-td>
						<uni-td align="center">{{ row.money }}</uni-td>
						<uni-td align="center">{{ row.sellMoney }}</uni-td>
					</uni-tr>
				</uni-table>
			</view>
			<view class="bf mt20">
				<view class="f-bt mb20">
					<view class="wei f20 c0">{{$t('handover.channel_statistics')}}</view>
				</view>
				<uni-table ref="table" :loading="tbloading" border stripe :emptyText="$t('handover.no_details')">
					<uni-tr>
						<uni-th align="center">{{$t('handover.order_channel')}}</uni-th>
						<uni-th align="center">{{$t('handover.turnover')}}</uni-th>
						<uni-th align="center">{{$t('handover.business_income')}}</uni-th>
						<uni-th align="center">{{$t('handover.discount_amount')}}</uni-th>
						<uni-th align="center">{{$t('handover.refund_amount')}}</uni-th>
					</uni-tr>
					<uni-tr v-for="(row, i) in hdata.contents && hdata.contents.summary" :key="i">
						<uni-td align="center">{{ row.name}}</uni-td>
						<uni-td align="center">{{ row.sellMoney}}</uni-td>
						<uni-td align="center">{{ row.money }}</uni-td>
						<uni-td align="center">{{ row.discountMoney }}</uni-td>
						<uni-td align="center">{{ row.refundMoney }}</uni-td>
					</uni-tr>
				</uni-table>
			</view>
			<!-- <view class="bf mt20">
				<view class="f-bt mb20">
					<view class="wei f20 c0">优惠统计</view>
				</view>
				<uni-table ref="table" :loading="tbloading" border stripe emptyText="暂无明细">
					<uni-tr>
						<uni-th align="center">优惠方式</uni-th>
						<uni-th align="center">优惠金额</uni-th>
						<uni-th align="center">订单数</uni-th>
					</uni-tr>
					<uni-tr v-for="(row, i) in hdata.contents && hdata.contents.discountTrend" :key="i">
						<uni-td align="center">{{ row.activityName}}</uni-td>
						<uni-td align="center">{{ row.money}}</uni-td>
						<uni-td align="center">{{ row.orderCount }}</uni-td>
					</uni-tr>
				</uni-table>
			</view> -->
			<view class="bf mt20">
				<view class="f-bt mb20">
					<view class="wei f20 c0">{{$t('handover.non_operating_income')}}</view>
				</view>
				<uni-table ref="table" :loading="tbloading" border stripe :emptyText="$t('handover.no_details')">
					<uni-tr>
						<uni-th align="center">{{$t('handover.order_type')}}</uni-th>
						<uni-th align="center">{{$t('handover.amount')}}</uni-th>
						<uni-th align="center">{{$t('handover.orders_count')}}</uni-th>
					</uni-tr>
					<uni-tr v-for="(row, i) in hdata.contents && hdata.contents.sellOut" :key="i">
						<uni-td align="center">{{ row.name}}</uni-td>
						<uni-td align="center">{{ row.money}}</uni-td>
						<uni-td align="center">{{ row.orderCount }}</uni-td>
					</uni-tr>
				</uni-table>
			</view>
			<view class="bf mt20 f-bt">
				<view class="f-g-1 mr30 bbtr p20 w50">
					<view class="mb20">
						<view class="wei f20 c0">{{$t('handover.order_statistics')}}</view>
					</view>
					<view class="f-bt mb10" v-if="hdata.contents">
						<view>{{$t('handover.settled_orders_count')}}</view>
						<view>{{hdata.contents.orderCount}}{{$t('handover.order')}}</view>
					</view>
				</view>
				<view class="f-g-1 bbtr p20 w50">
					<view class="mb20">
						<view class="wei f20 c0">{{$t('handover.sensitive_statistics_operation')}}</view>
					</view>
					<view class="f-bt mb10" v-for="(v,i) in hdata.contents && hdata.contents.warn" :key="i">
						<view class="f-g-1">{{v.name}}</view>
						<view class="w20 f-g-0">{{v.count}}{{$t('handover.order')}}</view>
						<view class="w20 f-g-0 f-x-e">
							<text v-if="v.money">฿{{v.money}}</text>
							<text v-else>-</text>
						</view>
					</view>
				</view>
			</view>
			<view class="bf mt20 f-bt">
				<view class="f-g-1 mr30 bbtr p20 w50">
					<view class="mb20">
						<view class="wei f20 c0">{{$t('handover.discount_statistics')}}</view>
					</view>
					<view class="f-bt mb10" v-for="(v,i) in  hdata.contents && hdata.contents.discountTrend" :key="i">
						<view class="f-g-1">{{v.name}}</view>
						<view class="w20 f-g-0">{{v.count}}{{$t('handover.order')}}</view>
						<view class="w20 f-g-0 f-x-e">฿{{v.money}}</view>
					</view>
				</view>
				<view class="f-g-1 bbtr p20 w50">
					<view class="mb20">
						<view class="wei f20 c0">{{$t('handover.store_unfinished_orders')}}</view>
					</view>
					<view class="f-bt mb10" v-for="(v,i) in hdata.contents && hdata.contents.unBill" :key="i">
						<view>{{v.name}}</view>
						<view>{{v.count}}{{$t('handover.order')}}</view>
						<view>฿{{v.money}}</view>
					</view>
				</view>
			</view>
		</view>
		<view class="w100 dbbtn f-x-e bf p20" v-if="state==0">
			<view class="w20 mr30">
				<u-button color="#4275F4" size="large" type="primary" :plain="true" :customStyle="{marginRight:'10px'}"
					@click="goRec">
					<text class="f18">{{$t('handover.handover')}}</text></u-button>
			</view>
			<view class="w20">
				<u-button color="#4275F4" size="large" :customStyle="{}" @click="goRecPrint">
					<text class="f18">{{$t('handover.handover_and_print_slip')}}</text></u-button>
			</view>
		</view>
		<u-modal :show="showRec" :showCancelButton="true" :buttonReverse="false" confirmColor="#fff"
			:confirmText="$t('handover.confirm_handover')" :cancelText="$t('handover.cancel')" width="300px" title=""
			:content='$t("handover.confirm_handover_and_logout")' @cancel="showRec = false" @confirm="cancel"></u-modal>
		<u-modal :show="showPrintRec" :showCancelButton="true" :buttonReverse="false" confirmColor="#fff"
			:confirmText="$t('handover.confirm_handover_and_print')" :cancelText="$t('handover.cancel')" width="300px"
			title="" :content="$t('handover.confirm_handover_and_print')" @cancel="showPrintRec = false" @confirm="printCancel"></u-modal>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	import tool from '@/components/tool/tool.vue'
	export default {
		components: {
			tool,
		},
		data() {
			return {
				tab: 0,
				tabs: [{
						name: this.$t('handover.handover_slip'),
						value: 2,
					},
					{
						name: '交班单(2023/10/17)',
						value: -1,
					},
					{
						name: '交班单(2023/10/18)',
						value: 7,
					},
					{
						name: '交班单(2023/10/19)',
						value: 15,
					},
					{
						name: '交班单(2023/10/20)',
						value: 30,
					},
					{
						name: '交班单(2023/10/21',
						value: 1,
					}
				],
				tj: [{
						name: this.$t('handover.total_collection'),
						money: '0.00',
					},
					{
						name: this.$t('handover.online_collection'),
						money: '0.00',
					},
					{
						name: this.$t('handover.cash_collection'),
						money: '0.00',
					},
					{
						name: this.$t('handover.balance_payment'),
						money: '0.00',
					},
					{
						name: this.$t('handover.stored_value_amount'),
						money: '0.00',
					}
				],
				tbloading: false,
				dataList: [],
				showRec: false,
				showPrintRec: false,
				hdata: {},
				state: '',
				id: '',
			}
		},
		computed: {
			...mapState({
				handOver: state => state.handOver,
			}),
		},
		onLoad(options) {
			if (options && options.id) {
				this.id = options.id
				this.state = options.state
				this.getHandOver(options.id)
			}
		},
		methods: {
			...mapMutations(["setHandOver", "setUserVip", "setVip"]),
			async getHandOver(id) {
				let {
					data
				} = await this.beg.request({
					url: `${this.api.handOver}/${id}`
				})
				this.hdata = data
				if (data && data.contents) {
					this.tj[0].money = data.contents.money
					this.tj[1].money = data.contents.onlineMoney
					this.tj[2].money = data.contents.cashMoney
					this.tj[3].money = data.contents.balanceMoney
					this.tj[4].money = data.contents.chuzhiMoney
				}
			},
			goRec() {
				this.showRec = true
			},
			goRecPrint() {
				this.showPrintRec = true
			},
			async cancel() {
				let {
					data,
					msg,
					code
				} = await this.beg.request({
					url: `${this.api.handOver}/${this.handOver.id}`,
					method: 'PUT',
				})
				uni.$u.toast(msg)
				if (code && code == 200) {
					setTimeout(() => {
						this.takeOut()
					}, 500)
				}
			},
			async printCancel() {
				let {
					data,
					msg,
					code
				} = await this.beg.request({
					url: `${this.api.handOver}/${this.handOver.id}`,
					method: 'PUT',
					data: {
						print: 1
					},
				})
				uni.$u.toast(msg)
				if (code && code == 200) {
					setTimeout(() => {
						this.takeOut()
					}, 500)
				}
			},
			takeOut() {
				this.showRec = false
				this.showPrintRec = false
				uni.removeStorageSync('token')
				uni.removeStorageSync('storeId')
				this.setHandOver('')
				this.setUserVip({})
				this.setVip({})
				uni.removeStorageSync('handOver')
				uni.reLaunch({
					url: `/pages/login/index`
				})
			},
			changeTab(item, index) {
				uni.navigateTo({
					url: `/pages/home/index?current=13&l_title='硬件管理'`
				})
			},
			back() {
				uni.navigateTo({
					url: '/pages/home/index'
				})
			},
			changeTabs(e) {

			},
		}
	}
</script>

<style>
	.page {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.search {
		.tabs {
			.itab {
				border: 1px solid #EBEAF0;
				border-radius: 4px;
			}

			.ctab {
				background: #E3EDFE;
				border: 1px solid #4275F4;
				color: #4275F4;
			}
		}
	}

	.main {
		padding-bottom: 100px;
	}

	.tm {
		background: #E3EDFE;
	}

	.bbtr {
		border: 1px solid #e0e0e0;
		border-radius: 5px;
	}

	.dbbtn {
		position: fixed;
		bottom: 0;
	}
</style>