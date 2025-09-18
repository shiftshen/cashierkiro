<template>
	<view class="userInfo f-1 f14">
		<uni-table ref="table" border stripe :emptyText="$t('member.value_info')">
			<uni-tr>
				<!-- <uni-th align="center">券ID</uni-th> -->
				<uni-th align="center">{{$t('member.coupon_name')}}</uni-th>
				<uni-th align="center">{{$t('member.coupon_type')}}</uni-th>
				<!-- <uni-th align="center">获得来源</uni-th> -->
				<uni-th align="center">{{$t('member.time_of_obtainment')}}</uni-th>
				<uni-th align="center">{{$t('member.usage_status')}}</uni-th>
				<uni-th align="center">{{$t('member.validity_period')}}</uni-th>
				<uni-th align="center">{{$t('member.operation')}}</uni-th>
			</uni-tr>
			<uni-tr v-for="(row, i) in list" :key="i">
				<!-- <uni-td>{{ row.sn }}</uni-td> -->
				<uni-td>
					<view class="name">{{ row.coupon && row.coupon.name }}</view>
				</uni-td>
				<uni-td align="center">
					<view v-if="row.coupon && row.coupon.type" class="flex f-c">
						<u-tag :text="$t('member.voucher')" plain size="mini" v-if="row.coupon.type == 1"></u-tag>
						<u-tag :text="$t('member.discount_coupon')" plain type="warning" size="mini" v-if="row.coupon.type == 2"></u-tag>
						<u-tag :text="$t('member.exchange_coupon')" plain type="success" size="mini" v-if="row.coupon.type == 3"></u-tag>
						<u-tag :text="$t('member.shipping_coupon')" plain type="error" size="mini" v-if="row.coupon.type == 4"></u-tag>
					</view>
				</uni-td>
				<!-- <uni-td align="center">{{ row.channelFormat }}</uni-td> -->
				<uni-td align="center">{{ row.created_at }}</uni-td>
				<uni-td align="center">
					<view class="flex f-c">
						<u-tag :text="$t('member.expired')" plain type="error" size="mini" v-if="row.state == 0"></u-tag>
						<u-tag :text="$t('member.to_be_used')" plain type="warning" size="mini" v-if="row.state == 1"></u-tag>
						<u-tag :text="$t('member.used')" plain type="success" size="mini" v-if="row.state == 2"></u-tag>
						<u-tag :text="$t('member.voided')" plain type="error" size="mini" v-if="row.state == 3"></u-tag>
					</view>
				</uni-td>
				<uni-td align="center">
					<view>{{ row.startTime }}</view>
					<view>{{ row.endTime }}</view>
				</uni-td>
				<uni-td align="center">
					<text class="cf5f mr10" @click.stop="handDel(row)" v-if="row.state==1">{{$t('member.void')}}</text>
					<text class="cf06" style="color: #4275F4;" @click.stop="handDl(row)">{{$t('member.view')}}</text>
				</uni-td>
			</uni-tr>
		</uni-table>
		<view class="mt10"><uni-pagination show-icon :prevText="$t('common.prevText')" :nextText="$t('common.nextText')" :page-size="queryForm.pageSize" :current="queryForm.pageNo"
				:total="total" @change="change" /></view>
		<couponInfodl ref="couponInfodlRef" />
		<u-modal :show="rescind" :showCancelButton="true" width="300px" title=" " :cancelText="$t('modal.cancelText')" :confirmText="$t('modal.confirmText')" :content="$t('member.confirm_void_coupon')"
			confirmColor="#fff" @cancel="rescind=false" @confirm="save"></u-modal>
	</view>
</template>

<script>
	import couponInfodl from './couponInfodl';
	export default {
		props: {
			form: {
				type: Object,
				default: {},
			}
		},
		components: {
			couponInfodl,
		},
		data() {
			return {
				total: 0,
				queryForm: {
					pageNo: 1,
					pageSize: 10,
				},
				list: [],
				rescind: false,
				row: {},
			}
		},
		methods: {
			async fetchData() {
				this.queryForm.userId = this.form.id;
				const {
					data: {
						list,
						total,
						pageNo,
						pageSize
					}
				} = await this.beg.request({
					url: this.api.getCReceive,
					data: this.queryForm,
				})
				this.list = list ? list : [];
				this.total = total;
				this.queryForm.pageNo = pageNo;
				this.queryForm.pageSize = pageSize;
			},
			change(e) {
				this.queryForm.pageNo = e.current;
				this.fetchData()
			},
			handDel(row) {
				this.rescind = true
				this.row = row
				// uni.showModal({
				// 	title: '温馨提示',
				// 	content: '你确定要作废当前优惠券吗',
				// 	success: async (res) => {
				// 		if (res.confirm) {
				// 			let {
				// 				msg
				// 			} = await this.beg.request({
				// 				url: `${this.api.getCReceive}/${row.id}`,
				// 				method: "delete",
				// 			})
				// 			this.fetchData()
				// 			uni.$u.toast(msg)
				// 		}
				// 	}
				// });
			},
			async save() {
				let {
					msg
				} = await this.beg.request({
					url: `${this.api.getCReceive}/${this.row.id}`,
					method: "delete",
				})
				this.fetchData()
				uni.$u.toast(msg)
				this.rescind = false
			},
			handDl(row) {
				this.$refs['couponInfodlRef'].open(row)
			},
		}
	}
</script>

<style lang="scss" scoped>
	.userInfo {
		height: calc(100vh - 120px);
		overflow: hidden;
		overflow-y: scroll;
	}

	/deep/.uni-pagination {
		.page--active {
			background: #4275F4 !important;
			color: #fff !important;
		}
	}

	/deep/.u-modal__button-group__wrapper--confirm {
		background: #4275F4;
	}

	.uni-table-th {
		color: #000;
	}
</style>