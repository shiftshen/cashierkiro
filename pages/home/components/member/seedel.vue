<template>
	<view>
		<u-overlay :show="showExamine">
			<view class="mode f20 bf f-y-bt" style="width:1100px">
				<view class="p15 bd1 dfbc">
					<text>{{isCheck==1?$t('member.balance_seedel'):isCheck==2?$t('member.integral_seedel'):isCheck==3?$t('member.coupon_seedel'):$t('member.growth_value_seedel')}}</text>
					<text class="iconfont icon-cuowu" @click="showExamine=false"></text>
				</view>
				<view class="p15 f-1 f-y-bt">
					<view class="f-1">
						<uni-table v-if="isCheck===1" ref="table" :emptyText="$t('member.no_more_data_seedel')">
							<uni-tr class="bf5">
								<uni-th><text class="f18">{{$t('member.account_type_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.increase_seedel')}}/{{$t('member.deduct_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.account_balance_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.time_seedel')}}</text></uni-th>
								<uni-th width="200"><text class="f18">{{$t('member.remarks_seedel')}}</text></uni-th>
							</uni-tr>
							<uni-tr v-for="(item, index) in tableData" :key="index" style="height:55px">
								<uni-td><text class="f18">{{item.behaviorFormat}}</text></uni-td>
								<uni-td>
									<view class="f18">
										<view v-if="item.type == 0" style="color: #f56c6c">
											-{{ item.value }}
										</view>
										<view v-else style="color: #67c23a">+{{ item.value }}</view>
									</view>
								</uni-td>
								<uni-td><text class="f18">{{item.atLast}}</text></uni-td>
								<uni-td><text class="f18">{{item.updated_at}}</text></uni-td>
								<uni-td><text class="f18">{{item.notes}}</text></uni-td>
							</uni-tr>
						</uni-table>
						<uni-table v-if="isCheck===2" ref="table" :emptyText="$t('member.no_more_data_seedel')">
							<uni-tr class="bf5">
								<uni-th><text class="f18">{{$t('member.type_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.increase_seedel')}}/{{$t('member.deduct_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.account_balance_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.time_seedel')}}</text></uni-th>
								<uni-th width="200"><text class="f18">{{$t('member.remarks_seedel')}}</text></uni-th>
							</uni-tr>
							<uni-tr v-for="(item, index) in tableData" :key="index" style="height:55px">
								<uni-td><text class="f18">{{item.behaviorFormat}}</text></uni-td>
								<uni-td>
									<view class="f18">
										<view v-if="item.type == 0" style="color: #f56c6c">
											-{{ item.value }}
										</view>
										<view v-else style="color: #67c23a">+{{ item.value }}</view>
									</view>
								</uni-td>
								<uni-td><text class="f18">{{item.atLast}}</text></uni-td>
								<uni-td><text class="f18">{{item.updated_at}}</text></uni-td>
								<uni-td><text class="f18">{{item.notes}}</text></uni-td>
							</uni-tr>
						</uni-table>
						<uni-table v-if="isCheck===3" ref="table" :emptyText="$t('member.no_more_data_seedel')">
							<uni-tr class="bf5">
								<uni-th><text class="f18">ID</text></uni-th>
								<uni-th><text class="f18">{{$t('member.coupon_name')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.coupon_type')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.source_of_obtainment')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.time_of_obtainment')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.usage_status')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.validity_period')}}</text></uni-th>
							</uni-tr>
							<uni-tr v-for="(item, index) in tableData" :key="index" style="height:55px">
								<uni-td><text class="f18">{{item.sn}}</text></uni-td>
								<uni-td><text class="f18">{{item.coupon && item.coupon.name}}</text></uni-td>
								<uni-td>
									<view class="f18" v-if="item.coupon">
										<view v-if="item.coupon.type == 1">{{$t('member.voucher')}}</view>
										<view v-else-if="item.coupon.type == 2">{{$t('member.discount_coupon')}}</view>
										<view v-else-if="item.coupon.type == 3">{{$t('member.exchange_coupon')}}</view>
										<view v-else-if="item.coupon.type == 4">{{$t('member.shipping_coupon')}}</view>
									</view>
								</uni-td>
								<uni-td><text class="f18">{{item.channelFormat}}</text></uni-td>
								<uni-td><text class="f18">{{item.created_at}}</text></uni-td>
								<uni-td>
									<view class="f18">
										<view v-if="item.state == 0" style="color: #333">{{$t('member.expired')}}</view>
										<view v-else-if="item.state== 1" style="color: #67c23a">{{$t('member.to_be_used')}}</view>
										<view v-else-if="item.state == 2" style="color: #999">{{$t('member.used')}}</view>
										<view v-else-if="item.state == 3" style="color: #333">{{$t('member.voided')}}</view>
									</view>
								</uni-td>
								<uni-td>
									<view class="f18">
										<view>{{ item.startTime }}</view>
										<view>{{ item.endTime }}</view>
									</view>
								</uni-td>
							</uni-tr>
						</uni-table>
						<uni-table v-if="isCheck===4" ref="table" :emptyText="$t('member.no_more_data_seedel')">
							<uni-tr class="bf5">
								<uni-th><text class="f18">{{$t('member.channel_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.growth_value_change_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.current_growth_value_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.level_change_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.change_time_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.remarks_seedel')}}</text></uni-th>
							</uni-tr>
							<uni-tr v-for="(item, index) in tableData" :key="index" style="height:55px">
								<uni-td><text class="f18">{{item.behaviorFormat}}</text></uni-td>
								<uni-td>
									<view class="f18">
										<view v-if="item.type == 0" style="color: #f56c6c">
											-{{ item.value }}
										</view>
										<view v-else style="color: #67c23a">+{{ item.value }}</view>
									</view>
								</uni-td>
								<uni-td><text class="f18">{{item.atLast}}</text></uni-td>
								<uni-td>
									<view class="f18">
										 {{item.vipChange || '--'}}
									</view>
								</uni-td>
								<uni-td><text class="f18">{{item.updated_at}}</text></uni-td>
								<uni-td><text class="f18">{{item.notes}}</text></uni-td>
							</uni-tr>
						</uni-table>
						<uni-table v-if="isCheck===5" ref="table" :emptyText="$t('member.no_more_data_seedel')">
							<uni-tr class="bf5">
								<uni-th><text class="f18">{{$t('member.card_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.card_number_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.card_type_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.total_times_seedel')}}/{{$t('member.used_times_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.creation_time_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.expiration_time_seedel')}}</text></uni-th>
								<uni-th><text class="f18">{{$t('member.operation_seedel')}}</text></uni-th>
							</uni-tr>
							<uni-tr v-for="(item, index) in form.cardList" :key="index" style="height:55px">
								<uni-td><text class="f18">{{item.name}}</text></uni-td>
								<uni-td><text class="f18">{{item.cardNum}}</text></uni-td>
								<uni-td><text class="f18">{{item.type}}</text></uni-td>
								<uni-td><text class="f18">{{item.total}}</text></uni-td>
								<uni-td><text class="f18">{{item.creat_at}}</text></uni-td>
								<uni-td><text class="f18">{{item.due_time}}</text></uni-td>
								<uni-td></uni-td>
							</uni-tr>
						</uni-table>
						<view class="f-c mt20">
							<uni-pagination :current="queryForm.pageNo" :total="total" :pageSize="queryForm.pageSize"
								@change="change" :title="$t('member.title_text_seedel')" />
						</view>
					</view>
					<!-- <u-button v-if="isCheck===3" color=" #4275F4" text="发放优惠券" @click="changeDis"></u-button> -->
				</view>
			</view>
		</u-overlay>
	</view>
</template>

<script>
	export default {
		props: {
			form: {
				type: Object,
				default: {},
			}
		},
		components: {

		},
		data() {
			return {
				showExamine: false,
				isCheck: 1,
				rules: {
					// value: [{
					// 	required: true,
					// 	message: '请输入修改内容',
					// 	trigger: ['change', 'blur'],
					// }],
					notes: [{
						required: true,
						message: this.$t('member.please_enter_remarks'),
						trigger: ['blur', 'change']
					}]
				},
				total: 0,
				queryForm: {
					pageNo: 1,
					pageSize: 10,
				},
				tableData: [],
			}
		},
		onReady() {
			this.$refs.uForm.setRules(this.rules)
		},
		methods: {
			async open(t) {
				this.isCheck = t
				await this.getTable(t)
				this.showExamine = true
			},
			async getTable(t) {
				let url = ''
				if (t == 1) {
					url = `${this.api.userAccountLog}/balance`
				} else if (t == 2) {
					url = `${this.api.userAccountLog}/integral`
				} else if (t == 3) {
					url = this.api.getCReceive
				} else if(t == 4){
					url = `${this.api.userAccountLog}/exp`
				}
				this.queryForm.userId = this.form.id;
				const {
					data: {
						list,
						pageNo,
						pageSize,
						total
					},
				} = await this.beg.request({
					url,
					data: this.queryForm
				})
				this.tableData = list;
				this.total = total;
				this.queryForm.pageNo = pageNo;
				this.queryForm.pageSize = pageSize;
			},
			change(e) {
				this.queryForm.pageNo = e.current;
				this.getTable(this.isCheck)
			},
			close() {
				this.showExamine = false
			},
			save() {
				this.$refs.uForm.validate().then(res => {
					this.$emit('save', this.bForm)
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.mode {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 750px;
		border-radius: 5px;

		::v-deep(.u-form-item__body__left__content__label) {
			justify-content: flex-end !important;
		}

		::v-deep(.u-input) {
			padding: 3px 9px !important;
		}

		::v-deep(.uni-select__input-box) {
			height: 32px !important;
		}

		::v-deep(.uni-calendar__content) {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			width: 400px;
			border-radius: 10px;

			.uni-datetime-picker--btn {
				background: #4275F4 !important;
				color: #000 !important;
			}

			.uni-calendar-item--checked {
				background: #4275F4 !important;

				.uni-calendar-item--checked-text {
					color: #000 !important;
				}
			}
		}
	}
</style>