<template>
	<view class="f-y-bt h100">
		<view class="main f-1 f-bt bf">
			<view class="left br1">
				<view class="p10 bd1 tac">{{$t("refund.refund_protection")}}</view>
				<view class="p-10-15 bd1">
					<u--input :placeholder="$t("refund.search_order_number")" prefixIcon="search"
						prefixIconStyle="font-size: 22px;color: #909399"></u--input>
				</view>
				<view v-if="list&&list.length>0" class="f-1 list">
					<view :class="isItem==item.id?'isItem':''" class="p20" v-for="(item,index) in list" :key="index"
						@click="clickItem(item,index)">
						<view class="mb20">{{$t("refund.refund_number")}}：{{item.orderSn}}</view>
						<view class="dfa f18 mb10">
							<view style="margin-right:65px;">{{$t("refund.order_amount")}}：<text class="cf5 f20">฿{{item.amount}}</text></view>
							<view>{{$t("refund.refund_amount")}}：<text class="cf5 f20">฿{{item.refund}}</text></view>
						</view>
						<view class="f18">{{$t("refund.refund_status")}}：{{item.status==0?$t("refund.apply_for_protection"):$t("refund.protection_ended")}} ({{$t('refund.refund_and_return')}})</view>
					</view>
				</view>
				<view v-else class="f-1 f-c-c" style="overflow-y:auto">
					<u-empty mode="car" icon="http://cdn.uviewui.com/uview/empty/car.png">
					</u-empty>
				</view>
			</view>
			<view class="f-1">
				<view class="p10 bd1 tac">{{$t("refund.order_details")}}</view>
				<view class="dfa" style="height:59px;background: #eff0f4;">
					<view :class="tab2==index?'bf':''" class="tac" v-for="(item,index) in tabs2" :key="index"
						style="width:115px;height:59px;line-height: 59px;" @click="tab2=index">{{item}}</view>
				</view>
				<view v-if="tab2==0" class="p-20-30 f18">
					<view class="p10">
						<view class="dfa mb15">
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.buyer")}}：</view>
								<view>{{itemForm.buyer?itemForm.buyer:'-'}}</view>
							</view>
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.refund_application_number")}}：</view>
								<view>{{itemForm.orderSn}}</view>
							</view>
						</view>
						<view class="dfa mb15">
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.application_time")}}：</view>
								<view>{{itemForm.creat_at}}</view>
							</view>
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.protection_type")}}：</view>
								<view>{{itemForm.type=='refund'?$t("refund.refund"):'-'}}</view>
							</view>
						</view>
						<view class="dfa mb15">
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.refund_method")}}：</view>
								<view>{{itemForm.state==1?$t("refund.proactive_refund"):'-'}}</view>
							</view>
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.refund_to_balance")}}：</view>
								<view>฿{{itemForm.refund}}</view>
							</view>
						</view>
						<view class="dfa mb15">
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.refund_reason")}}：</view>
								<view>{{itemForm.reason?itemForm.reason:'--'}}</view>
							</view>
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.refund_description")}}：</view>
								<view>{{itemForm.instructions?itemForm.instructions:'--'}}</view>
							</view>
						</view>
						<view class="dfa mb15">
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.merchant_refund_description")}}：</view>
								<view>{{itemForm.merchant?itemForm.merchant:'--'}}</view>
							</view>
							<view class="w50 dfa">
								<view class="tar" style="width:130px">{{$t("refund.refund_status")}}：</view>
								<view>{{itemForm.status==0?$t("refund.apply_for_protection"):$t("refund.protection_ended")}}</view>
							</view>
						</view>
					</view>
				</view>
				<view v-if="tab2==1" class="p15 f18">
					<view class="bf5 tabel_h dfbc">
						<view class="w55">{{$t("refund.product")}}（THB）</view>
						<view class="f-1 dfbc">
							<view>{{$t("refund.price")}}</view>
							<view>{{$t("refund.quantity")}}</view>
							<view>{{$t("refund.subtotal")}}（THB）</view>
							<view>{{$t("refund.status")}}</view>
						</view>
					</view>
					<view class="tabel_i dfbc bd1" v-for="(item,index) in itemForm.goods" :key="index">
						<view class="w55 dfa">
							<!-- <u--image :src="item.img" width="50px" height="50px" shape="square"></u--image> -->
							<text class="pl10">{{item.name}}</text>
						</view>
						<view class="f-1 dfbc">
							<view>{{item.price}}</view>
							<view>{{item.num}}</view>
							<view>{{item.subtotal}}</view>
							<view>{{item.status==0?$t("refund.apply_for_protection"):$t("refund.protection_ended")}}</view>
						</view>
					</view>
				</view>
				<view v-if="tab2==2" class="p-20-30 f18 tal">
					<u-steps :current="itemForm.schedule.length" direction="column">
						<view v-for="(item,index) in itemForm.schedule" :key="index" style="display:flex">
							<text class="pr10 pt10">{{item.time}}</text>
							<u-steps-item :title="item.title" :desc="item.desc"></u-steps-item>
						</view>
					</u-steps>
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
				tab2: 0,
				isItem: 0,
				tabs2: [this.$t("refund.basic_information"),this.$t("refund.product_information"), this.$t("refund.order_log")],
				//takeOut  fastfood  cash  value
				itemForm: {},
				list: [{
						id: 0,
						orderSn: '202308091545102789455',
						amount: '59.00',
						refund: '59.00',
						state: 1, //退款方式
						buyer: this.$t("refund.retail_customer"),
						creat_at: '2023-08-09 14:40:06',
						type: 'refund',
						reason: '',
						instructions: '',
						merchant: '',
						status: 1, //维权结束1  申请维权0
						goods: [{
							name: '',
							price: '142.00',
							img: '',
							num: 2,
							subtotal: '284.00',
							status: 0,
						}],
						schedule: [{
							title:this.$t("refund.buyer_applies_for_refund"),
							time: '2023-08-05',
							desc: '09:10:43'
						}, ]
					},
					 
				]
			}
		},
		created: function() {
			this.itemForm = this.list[0]
		},
		methods: {
			sectionChange(e) {
				this.tab = e
			},
			clickItem(item, index) {
				this.isItem = item.id
				this.itemForm = item
			}
		}
	})
</script>

<style lang="scss" scoped>
	.main {
		.left {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			width: 500px;

			/deep/.u-input {
				background: #f5f5f5;
			}

			/deep/.u-subsection {
				height: 35px;

				.u-subsection__item__text {
					span {
						color: #000;
						font-size: 16px !important;
					}
				}
			}

			.list {
				overflow-y: auto;
			}

			.isItem {
				background: #fff6cd;
			}
		}

		.tabel_h {
			padding: 0 10px 0 38px;
			height: 56px;
		}

		.tabel_i {
			padding: 10px 10px 10px 38px;
			height: 70px;
		}
	}
</style>