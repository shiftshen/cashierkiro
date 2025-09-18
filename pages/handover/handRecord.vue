<template>
	<view class="page w100 h100">
		<view class="top bf mb5 f-x-bt p15 w100">
			<view class="flex f-y-c" @click="back">
				<u-icon name="arrow-leftward" color="#000" size="24"></u-icon>
				<text class="ml10 f20">{{$t('handover.shift_record')}}</text>
			</view>
			<view class="dfa">
				<tool @cT="changeTab"></tool>
			</view>
		</view>
		<view class="f-1 w100 p20 bf">
			<view class="tabs">
				<u-tabs :list="list1" @click="handTabs" :current="current" lineColor="#4275F4"
					:activeStyle="{fontWeight: 'bold',color:'#000'}"></u-tabs>
			</view>
			<view class="f-bt f-y-c p10">
				<view class="search flex f-g-1 f-y-c">
					<view class="tabs flex">
						<view class="itab p-10-20 mr10 f16 c0" :class="{'ctab' : tab == i}" v-for="(v,i) in tabs"
							:key="i" @click="changeTab(v,i)">
							{{v.name}}
						</view>
					</view>
				</view>
			</view>
			<view class="main f-1 f-bt f16">
				<view class="topList mt20 f-g-1 f-y-bt">
					<uni-table ref="table" :loading="tbloading" border stripe :emptyText="$t('handover.no_details')" v-if="current==0">
						<uni-tr>
							<uni-th align="center">{{$t('handover.shift_number')}}</uni-th>
							<uni-th align="center">{{$t('handover.shift')}}</uni-th>
							<uni-th align="center">{{$t('handover.handover_person')}}</uni-th>
							<uni-th align="center">{{$t('handover.handover_mode')}}</uni-th>
							<uni-th align="center">{{$t('handover.shift_start_time')}}</uni-th>
							<uni-th align="center">{{$t('handover.handover_time')}}</uni-th>
							<uni-th align="center">{{$t('handover.shift_collection')}}</uni-th>
							<uni-th align="center">{{$t('handover.handover_exception')}}</uni-th>
							<uni-th align="center">{{$t('handover.operation')}}</uni-th>
						</uni-tr>
						<uni-tr v-for="(row, i) in dataList" :key="i">
							<uni-td align="center">{{ row.id}}</uni-td>
							<uni-td align="center">{{ row.name}}</uni-td>
							<uni-td align="center">{{ row.sales }}</uni-td>
							<uni-td align="center">{{ row.sellMoney }}</uni-td>
							<uni-td align="center">{{ row.stime }}</uni-td>
							<uni-td align="center">{{ row.etime }}</uni-td>
							<uni-td align="center">{{ row.money }}</uni-td>
							<uni-td align="center">{{ row.yic }}</uni-td>
							<uni-td align="center">
								<text class="cf5f mr10" @click.stop="handDel(row)">{{$t('handover.reprint_handover_slip')}}</text>
								<text class="cf06" style="color: #4275F4;" @click.stop="handDl(row)">{{$t('handover.view_details')}}</text>
							</uni-td>
						</uni-tr>
					</uni-table>
					<uni-table ref="table" :loading="tbloading" border stripe :emptyText="$t('handover.no_details')" v-if="current==1">
						<uni-tr>
							<uni-th align="center">{{$t('handover.shift_number')}}</uni-th>
							<uni-th align="center">{{$t('handover.shift')}}</uni-th>
							<uni-th align="center">{{$t('handover.not_handover_person')}}</uni-th>
							<uni-th align="center">{{$t('handover.shift_start_time')}}</uni-th>
							<uni-th align="center">{{$t('handover.shift_collection')}}</uni-th>
							<uni-th align="center">{{$t('handover.operation')}}</uni-th>
						</uni-tr>
						<uni-tr v-for="(row, i) in dataList" :key="i">
							<uni-td align="center">{{ row.id}}</uni-td>
							<uni-td align="center">{{ row.name}}</uni-td>
							<uni-td align="center">{{ row.sales }}</uni-td>
							<uni-td align="center">{{ row.stime }}</uni-td>
							<uni-td align="center">{{ row.money }}</uni-td>
							<uni-td align="center">
								<text class="cf5f mr10" @click.stop="handDel(row)">{{$t('handover.go_handover')}}</text>
							</uni-td>
						</uni-tr>
					</uni-table>
					<view class="mt10 pagona"><uni-pagination show-icon  :prevText="$t('common.prevText')" :nextText="$t('common.nextText')"  :page-size="queryForm.pageSize"
							:current="queryForm.pageNo" :total="total" @change="change" /></view>
				</view>
			</view>
			<u-calendar :show="showCalendar" color="#4275F4" mode="range" @confirm="confirm" @close="showCalendar=false"
				:minDate="calendar.minDate"></u-calendar>
		</view>
	</view>
</template>

<script>
	import tool from '@/components/tool/tool.vue'
	export default {
		components: {
			tool,
		},
		data() {
			return {
				list1: [{
					name: this.$t('handover.shift_record'),
					value: 'all',
				}, {
					name: this.$t('handover.not_handover_record'),
					value: 'making',
				}],
				current: 0,
				tbloading: false,
				time: [],
				tab: 0,
				tabs: [{
						name: this.$t('handover.today'),
						value: 2,
					},
					{
						name: this.$t('handover.yesterday'),
						value: -1,
					},
					{
						name: `7${this.$t('handover.within_days')}`,
						value: 7,
					},
					{
						name: `15${this.$t('handover.within_days')}`,
						value: 15,
					},
					{
						name: `30${this.$t('handover.within_days')}`,
						value: 30,
					},
					{
						name: this.$t('handover.custom'),
						value: 1,
					}
				],
				dataList: [{
				}],
				queryForm: {
					timeType: 2,
					scene: '',
					pageNo: 1,
					pageSize: 10,
				},
				total: 0,
				showCalendar: false,
				calendar: {
					minDate: '',
					maxDate: '',
					defaultDate: '',
					monthNum: 13,
				},
			}
		},
		methods: {
			handTabs(e) {
				this.current = e.index
				// this.$emit('handTabs',e)
			},
			fetchData() {
				this.fetchNewOrder()
				this.chooseTimed()
			},
			async fetchNewOrder() {
				let {
					data
				} = await this.beg.request({
					url: this.api.sNewOrder,
					data: this.queryForm
				})
				this.newData = data
				this.cashes[0].num = data.discountMoney
				this.cashes[1].num = data.orderCount
				// this.cashes[2].num = data.newMember
				this.cashes[2].num = data.storedValueMoney
				this.cashes[2].number = data.storedValueOrder
				this.cashes[3].num = data.refundMoney
				this.cashes[3].number = data.refundOrder
				this.cashes[4].num = data.boxMoney
				this.cashes[5].num = data.deliveryMoney
				this.cashes[6].num = data.money
				this.summary = data.summary
				this.payTrend = data.payTrend
				this.discountTrend = data.discountTrend
				this.sellOut = data.sellOut
				this.orderTrend = data.orderTrend
				this.goodsCat = data.goodsCat
				this.getServerData(data)
			},
			changeTab(v, i) {
				this.queryForm.pageNo = 1
				this.tab = i
				this.queryForm.timeType = v.value
				if (v.value == 1) return this.showCalendar = true
				this.queryForm.startTime = ''
				this.queryForm.endTime = ''
				// this.fetchData()
			},
			confirm(e) {
				if (e && e.length) {
					this.time[0] = e[0]
					this.time[1] = e[e.length - 1]
				}
				this.queryForm.startTime = this.time[0]
				this.queryForm.endTime = this.time[1]
				this.fetchData()
				this.showCalendar = false
			},
			chooseTimed() {
				let date = new Date();
				let year = date.getFullYear();
				let month = String(date.getMonth() + 1);
				let day = String(date.getDate());
				month = month.padStart(2, '0');
				day = day.padStart(2, '0');
				this.calendar.maxDate = year + '-' + month + '-' + day;
				this.calendar.defaultDate = year + '-' + month + '-' + day;

				let nowTime = date.getTime();
				let preTime = nowTime - 60 * 24 * 60 * 60 * 1000;
				let preDate = new Date(preTime);
				let preYear = preDate.getFullYear();
				let preMonth = String(preDate.getMonth() + 1);
				let preDay = String(preDate.getDate());
				preMonth = preMonth.padStart(2, '0');
				preDay = preDay.padStart(2, '0');
				this.calendar.minDate = preYear + '-' + preMonth + '-' + preDay;
			},
			back() {
				uni.navigateBack({
					delta: 1
				})
			},
			changeTab(item, index) {
				uni.navigateTo({
					url: `/pages/home/index?current=13&l_title='硬件管理'`
				})
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
</style>