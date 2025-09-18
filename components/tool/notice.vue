<template>
	<u-overlay :show="isNotice" @click="close">
		<view class="typer f-y-bt bf bs10 c0" @tap.stop>
			<view class="bd1 p20" style="padding-bottom: 0px;">
				<u-tabs :current="current" :list="list" lineColor="#4275F4" lineWidth="35px" :scrollable="false"
					:itemStyle="{fontSize:'18px',color:'#000'}" :activeStyle="{fontWeight:'bold'}"></u-tabs>
			</view>
			<!-- <view class="f-1 f-c-c p20 c9 f16">没有更多消息了</view> -->
			<view class="f-1">
				<view class="f-bt bd1 p20" v-for="(item,index) in notData" :key="index" style="height:150px">
					<view class="f-c-c" style="width:50px;height:50px;border-radius:25px;background:#4275F4;">
						<text class="iconfont icon-xiaoxi cf" style="font-size:50px;"></text>
					</view>
					<view class="ml15 f-1 f-y-bt">
						<view class="">
							<view class="f20 mb10">{{item.title}}</view>
							<view class="f16">{{$t('tool-components.table_number')}}：{{item.orderNum}},{{$t('tool-components.total')}}{{item.goodsNum}}{{$t('tool-components.dishes')}}</view>
						</view>
						<view class="f-x-bt">
							<view class="f14 c9">{{$t('tool-components.just_now')}}</view>
							<view v-if="item.type=='notice'" class="">
								<u-button color="#4275F4" text="" :customStyle="{width:'90px',height:'35px'}"
									@click="getNotice(item,index)">
									<text class="c0">{{$t('tool-components.i_know')}}</text></u-button>
							</view>
							<view v-else class="dfa">
								<u-button :text="$t('tool-components.reject_order')" :customStyle="{width:'90px',height:'35px'}"
									@click="reject(item,index)"></u-button>
								<u-button color="#4275F4" :customStyle="{marginLeft:'10px',width:'90px',height:'35px'}"
									@click="takeOrder(item,index)">
									<text class="c0">{{$t('tool-components.accept_order')}}</text></u-button>
							</view>
						</view>
					</view>
				</view>
			</view>
			<u-modal :show="show" :showCancelButton="true" width="250px" title=" " :cancelText="$t('tool-components.cancel')" :content="$t('tool-components.confirm_reject_order')"
				@confirm="confirm" @cancel="show=false"></u-modal>
		</view>
	</u-overlay>
</template>

<script>
	export default {
		props: {

		},
		data() {
			return {
				isNotice:false,
				show: false,
				current: 0,
				acIndex: 0,
				list: [{
					name: this.$t('tool-components.takeaway'),
				}, {
					name: this.$t('tool-components.dine_in'),
				}, {
					name: this.$t('tool-components.system')
				}, {
					name: this.$t('tool-components.announcement')
				}],
				notData: [{
					type: 'notice',
					title: this.$t('tool-components.call_waiter'),
					create_at: this.$t('tool-components.just_now'),
				}, {
					type: 'order',
					title: this.$t('tool-components.new_customer_order'),
					create_at: this.$t('tool-components.just_now'),
					orderNum: '10',
					goodsNum: 9
				}, {
					type: 'order',
					title: this.$t('tool-components.please_process_in_time'),
					create_at: this.$t('tool-components.just_now'),
					orderNum: '1',
					goodsNum: 6
				}]
			}
		},
		methods: {
			open() {
				this.isNotice = true
			},
			close() {
				this.isNotice = false
			},
			getNotice(item, index) {
				this.notData.splice(index, 1)
			},
			//接单
			takeOrder(item, index) {
				this.notData.splice(index, 1)
			},
			//拒单
			reject(item, index) {
				this.acIndex = index
				this.show = true
			},
			//取消
			confirm() {
				this.notData.splice(this.acIndex, 1)
				this.show = false
			}
		}
	}
</script>

<style lang="scss" scoped>
	.typer {
		position: fixed;
		right: 0;
		width: 500px;
		height: 100vh;

		::v-deep(.u-tabs) {
			.u-tabs__wrapper__nav__item {
				padding-bottom: 15px;
			}

			.u-tabs__wrapper__nav__line {
				bottom: 0px;
			}

			.u-tabs__wrapper__nav__item__text {
				font-size: 18px;
			}
		}

		::v-deep(.u-modal__content) {
			text-align: center;
		}
	}
</style>