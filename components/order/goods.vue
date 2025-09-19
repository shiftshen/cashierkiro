<template>
	<view class="f-1 f-y-bt">
		<view class="r_cont pl15">
			<view class="r_item p5 f-c-c" :class="{'productShow2':cashieSetting.productShow==2}" @click="handAddDish">
				<view class="f-c-c f-g-1">
					<view class="iconfont icon-jia f30"></view>
					<view class="c3 mt10">
						{{$t('order-components.add_temporary_dish')}}
					</view>
				</view>
			</view>
			<block v-if="cashieSetting && cashieSetting.productShow==2">
				<view :class="list.some(f=>f.spuId==v.id)?'check':''" class="r_item p5 productShow2"
					v-for="(v, i) in dataList" :key="i" @click.stop="handcar({g: v,addwz: 1})">
					<view class="f-bt f18">
						<image class="f-g-0 mr10 logo" :src="v.logo" lazy-load mode="aspectFill"></image>
						<view class="f-y-bt f18 f-g-1">
							<view class="f18 mb5 wordall2">{{v.name}}</view>
							<view class="labels" v-if="v.discounts && v.discounts.length">
								<view class="label goodlb" :style="{color:'#FF3131',borderColor:'#FF3131'}"
									v-for="(lv,li) in v.discounts" :key="li">{{lv.discountLabel}}</view>
							</view>
							<view>
								<view v-if="v.isSpec" class="mb5 c0 f18 overflowlnr">
									<text>
										<text class="f12">฿</text>
										<text class="f18">{{v.price}}</text>
										<text class="f12 ml5">{{$t('order-components.per')}}</text>
									</text>
								</view>
								<view v-else class="mb5 c0 f18 overflowlnr">
									<text class="f12">฿</text>
									<text class="f18">{{v.price}}</text>
								</view>
							</view>
						</view>
					</view>
					<view v-if="list.some(s=>s.spuId==v.id)" class="badge">
						<u-badge type="error"  :value="getDisplayNum(v.id)"  bgColor="#4275F4"></u-badge>
					</view>
					<view v-if='v.goodsInventory==0' class="ysq f-c cf w100 f18 p-a">{{$t('order-components.sold_out')}}
					</view>
				</view>
			</block>
			<block v-else>
				<view :class="list.some(f=>f.spuId==v.id)?'check':''" class="r_item p5" v-for="(v, i) in dataList"
					:key="i" @click.stop="handcar({g: v,addwz: 1})">
					<view class="flex f18 wordall2">{{v.name}}</view>
					<view class="labels" v-if="v.discounts && v.discounts.length">
						<view class="label goodlb" :style="{color:'#FF3131',borderColor:'#FF3131'}"
							v-for="(lv,li) in v.discounts" :key="li">{{lv.discountLabel}}</view>
					</view>
					<view class="dfa f18 mt5 l-h1">
						<view>
							<view v-if="v.isSpec" class="mb5 c0 f18 overflowlnr">
								<text>
									<text class="f12">฿</text>
									<text class="f18">{{v.price}}</text>
									<text class="ml5">{{$t('order-components.per')}}</text>
								</text>
							</view>
							<view v-else class="mb5 c0 f18 overflowlnr">
								<text class="f12">฿</text>
								<text class="f18">{{v.price}}</text>
							</view>
						</view>
					</view>
					<view v-if="list.some(s=>s.spuId==v.id)" class="badge">
						<u-badge type="error" :value="getDisplayNum(v.id)"  bgColor="#4275F4"></u-badge>
					</view>
					<view v-if='v.goodsInventory==0' class="ysq f-c cf w100 f16 p-a">{{$t('order-components.sold_out')}}
					</view>
				</view>
			</block>
		</view>
		<view class="pagona mt10 f-c-xc l-h1">
			<uni-pagination :current="queryForm.pageNo" :prevText="$t('common.prevText')"
				:nextText="$t('common.nextText')" :total="total" :pageSize="queryForm.pageSize" @change="change"
				:title="$t('order-components.title_text')" />
		</view>
		<product-modal ref="productModal" :product="product" :visible="productModalVisible"
			@add-to-cart="addToCart"></product-modal>

		<goodsWeight ref="goodsWeight" @changeValue="changeWeightValue"></goodsWeight>
	</view>
</template>

<script>
	import ProductModal from './productModal.vue'
	import goodsWeight from './goodsWeight.vue'

	import {
		mapState
	} from 'vuex'
	export default {
		components: {
			ProductModal,
			goodsWeight
		},
		props: {
			dataList: {
				type: Array,
				default: []
			},
			list: {
				type: Array,
				default: []
			},
			queryForm: {
				type: Object,
				default: {}
			},
			total: {
				type: Number,
				default: 0
			},
		},
		data() {
			return {
				carList: {},
				product: {},
				productModalVisible: false,
				imageCache: uni.getStorageSync('imageCache') || {},
				selectitme: {},

			}
		},
		computed: {
			...mapState({
				storeId: state => state.storeId,
				cashieSetting: state => state.config.cashieSetting,
			}),
		},
		methods: {
			getDisplayNum(spuId) {
				const item = this.list.find(f => f.spuId === spuId);
				console.log(item)
				if (item) {
					return item.goods.weightSwitch==1 ? (item.num / 100) : item.num;
				}
				return 0; // 如果找不到对应的项，可以返回一个默认值，比如0
			},
			async handcar(e) {
				if (e.g.goodsInventory == 0) return
				
				if (e.g.weightSwitch == 1) {
					this.selectitme = e
					console.log(e)
					this.$refs['goodsWeight'].open(e.g)
					return;
				}
				if (e.g.isSpec) {
					let res = await this.beg.request({
						url: `${this.api.storeGoods}/${e.g.id}`,
						data: {
							storeId: this.storeId,
							diningType: this.queryForm.diningType,
						}
					})
					this.product = res.data
					this.productModalVisible = true
					this.$refs['productModal'].open(e.g, this.storeId)
				} else {
					e.g.spuId = e.g.id
					this.$emit('handcar', e)
				}
			},
			addToCart(e) {
				e.g.spuId = e.g.id
				this.$emit('handcar', e)
			},
			change(e) {
				this.$emit('change', e)
			},
			handAddDish() {
				this.$emit('addDish')
			},
			changeWeightValue(obj) {
				console.log(obj)
				//this.$emit('handcar', e)
				//

				var p = {
					g: this.selectitme.g,
					addwz: obj.newweight,
					weight: obj
				}
				console.log('32323',this.selectitme)
				
				p.g.spuId = this.selectitme.g.id
				this.$emit('handcar', p)
				this.$refs['goodsWeight'].close()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.r_cont {
		max-height: calc(100vh - 190px);
		overflow: auto;
		align-items: flex-start;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;

		.r_item {
			position: relative;
			display: inline-flex;
			flex-direction: column;
			justify-content: space-between;
			margin-right: 20rpx;
			margin-bottom: 20rpx;
			width: 10.5202vw;
			height: 13.6718vh;
			border: 2rpx solid #e6e6e6;
			border-radius: 0.4392vw;
			overflow: hidden;

			.badge {
				position: absolute;
				top: 0px;
				right: 0px;

				::v-deep(.u-badge) {
					line-height: 16px;
					font-size: 14px;
					// width: 1.4641vw;
					// height: 1.4641vw;
					border-radius: 50%;
					display: flex;
					flex-direction: row;
					justify-content: center;
					align-items: center;
				}
			}
		}

		.productShow2 {
			width: 14.6412vw;
			height: 14.9739vh;

			.logo {
				width: 6.5885vw;
				height: 11.7187vh;
				border-radius: 6px;
			}
		}

		.check {
			border: 1px solid #4275F4;
		}
	}

	.pagona {
		box-shadow: 0 0 8px 0 #ddd;
		height: 50px;

		::v-deep(.uni-pagination) {
			.page--active {
				display: inline-block;
				// width: 30px;
				// height: 30px;
				width: 2.1961vw;
				height: 3.9062vh;
				background: #4275F4 !important;
				color: #fff !important;
			}

			.is-phone-hide {
				// width: 30px;
				// height: 30px;
				width: 2.1961vw;
				height: 3.9062vh;
			}

			.uni-pagination__total {
				// font-size: 20px;
				font-size: 1.1641vw;
				width: auto;
				display: -webkit-box;
				display: -webkit-flex;
				display: flex;
				align-items: center;
			}

			span {
				// font-size: 20px;
				font-size: 1.1641vw;
			}
		}
	}

	.u-popup {
		flex: 0;
	}

	.labels {
		display: flex;
		font-size: 10px;
		margin-bottom: 3px;
		overflow: hidden;
		// height: 46rpx;
		flex-wrap: wrap;

		.label {
			// max-width: 50%;
			padding: 2px 5px;
			margin-right: 5px;
			// margin-bottom: 10rpx;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			border-radius: 2px;
		}

		.goodlb {
			font-size: 10px;
			padding: 1px 2px;
			border: 2rpx solid #BABABA;
			color: #BABABA;
			margin-bottom: 4px;
		}
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.r_cont {
			max-height: calc(100vh - 190px);
			overflow: auto;

			.r_item {
				margin-right: 10px;
				margin-bottom: 10px;
				width: 156px;
				height: 105px;
				border: 1px solid #e6e6e6;
				border-radius: 10px;

				.badge {
					position: absolute;
					top: 0px;
					right: 0px;

					::v-deep(.u-badge) {
						line-height: 16px;
						font-size: 14px;
						// width: 20px;
						// height: 20px;
						border-radius: 50%;
						display: flex;
						flex-direction: row;
						justify-content: center;
						align-items: center;
					}
				}
			}

			.productShow2 {
				width: 200px;
				height: 115px;

				.logo {
					width: 90px;
					height: 90px;
					border-radius: 6px;
				}
			}

			.check {
				border: 1px solid #4275F4;
			}
		}

		.pagona {
			box-shadow: 0 0 8px 0 #ddd;
			height: 50px;

			::v-deep(.uni-pagination) {
				.page--active {
					width: 30px;
					height: 30px;
				}

				.is-phone-hide {
					width: 30px;
					height: 30px;
				}

				.uni-pagination__total {
					font-size: 20px;
					width: auto;
				}

				span {
					font-size: 20px;
				}
			}
		}
	}
</style>