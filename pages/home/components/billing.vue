<template>
	<view class="f-y-bt h100 billing_media">
		<view class="f-1 f-bt">
			<view class="left br1 f-y-bt f20 bf left_media">
				<view class="user p15 bd1">
					<vipUser @clearAll="clearAll" mode="fastOrder" @rfuser="checkOut"></vipUser>
				</view>
				<leftGoods :carList="carList" :batch="batch" :actgood="actgood" :checkInfo="checkInfo" :params="params"
					@hItem="handItem" @dItem="handDel" @chooseGood="chooseGood" @clearAll="clearAll" @allPack="allPack">
				</leftGoods>
				<view v-if="!isOrder" class="p15 f-c isOrder_media">
					<!-- <u-button class="mr5" type="error" :customStyle="{width:`${pc?'100px':'7.3206vw'}`,height:`${pc?'60px':'7.8125vh'}`}"
						:disabled="list.length==0" @click="payType(1)">
						<view class="f-c-c l-h1">
							<view class="iconfont icon-licai mb5"></view>
							<view class="f14">现金支付</view>
						</view>
					</u-button> -->
					<u-button color="#3c9cff" class="mr5" type="primary"
						:customStyle="{width:`${pc?'100px':'7.3206vw'}`,height:`${pc?'60px':'7.8125vh'}`}"
						:disabled="list.length==0" @click="payType(2)">
						<view class="f-c-c l-h1">
							<view class="iconfont icon-saoma mb5"></view>
							<view class="f14">{{$t("home.scanPayment")}}</view>
						</view>
					</u-button>
					<!-- <u-button class="mr5" :customStyle="{color:'#000',width:`${pc?'100px':'7.3206vw'}`,height:`${pc?'60px':'7.8125vh'}`}"
						:disabled="list.length==0" @click="takeOrder">
						<view class="f-c-c l-h1">

							<view class="f14">更多支付</view>
						</view>
					</u-button> -->
					<u-button color="#4275F4" @click="selectpickNo" :disabled="list.length==0"
						:customStyle="{color:'#fff',width:`${pc?'250px':'18.3016vw'}`,height:`${pc?'60px':'7.8125vh'}`}">
						<view class="f18 f-bt f-1 f-y-c l-h1">
							<view class="">{{$t("home.checkoutItems")}}{{goodsNum>0?goodsNum:'' }}</view>
							<view class="tar f22 f-c-xc" v-if="carList.money">
								<view class="l-h1">฿{{carList.money}}</view>
								<view v-if="carList.sellMoney>carList.money" class="cd f14 mt5"
									style="text-decoration: line-through;">
									฿{{carList.sellMoney}}
								</view>
							</view>
						</view>
					</u-button>
				</view>
				<view v-else class="p15 f-c">
					<u-button v-if="setpickNo>0" color="#3c9cff" class="mr5" type="primary"
						:customStyle="{width:`${pc?'100px':'7.3206vw'}`,height:`${pc?'60px':'7.8125vh'}`}"
						@click="selectpickNo">
						<view>
							{{$t('goods-components.pick_up_number')}}：{{setpickNo}}
						</view>
					</u-button>
					<u-button color="#4275F4" :customStyle="{color:'#000',height:`${pc?'60px':'7.8125vh'}`}"
						@click="rOrder">
						<text class="f20 wei6">{{$t("home.returnToOrder")}}</text></u-button>
				</view>
			</view>
			<leftCz v-if="!isOrder" :selectItem="selectItem" :carList="carList" :list="list" @hItem="handItem"
				@handItemDel="handItemDel" @cDis="cancelDis" @handRemark="handRemark" @handBatch="handBatch"
				@handAllDesc="handAllDesc" @handRescind="handRescind" @gDis="handDis" @gGift="handGift"
				@handPack="handPack" @handDeposit="handDeposit" @handUpOrder="handUpOrder" @handEditNum="handEditNum">
			</leftCz>
			<rightOrder v-if="isOrder" ref="rightOrderRef" mode="fastOrder" :pl="params" :pickNo="setpickNo"
				:form="payInfo" @init="init" @checkOut="rfCheckOut" @ck="checkOut" @cpOut="cpOut" @cInit="cInit">
			</rightOrder>
			<rightGoods v-else ref="rightGoodRef" :queryForm="queryForm" :total="total" :list="list"
				:dataList="dataList" :classfiy="classfiy" @search="search" @handcar="handcar" @change="change"
				@changeKind="changeKind" @addCar="addCar">
			</rightGoods>
		</view>
		<goodsReduce ref="reduceRef" :v="form" :selectItem="selectItem" @cMonry="changeMonry" />
		<giftDish ref="giftRef" :v="form" :selectItem="selectItem" @cGift="changeNumber" />
		<takeOrder ref="takeRef" :list="depositList" @checkOut="checkOut" />
		<wholenote ref="wholenoteRef" @returnRemark="returnRemark" @itemRemark="itemRemark" />
		<u-toast ref="uToast"></u-toast>
		<u-modal :show="showDel" :title="$t('home.confirmClearCart')" width="300px" :showCancelButton="true"
			confirmColor="#fff" :cancelText="$t('modal.cancelText')" :confirmText="$t('modal.confirmText')"
			@cancel="showDel=false" @close="showDel=false" @confirm="delCar" ref="uModal"></u-modal>
		<cash ref="cashRef" @changeMoney="changeMoney" />
		<scan ref="scanRef" @savePay="savePay" />
		<goodsNum ref="goodsNumRef" @changeValue="changeValue" :tx="$t('goods-components.change_quantity')"></goodsNum>
		<pickNo ref="pickNoRef" @saveNumber="saveNumber"></pickNo>
	</view>
</template>

<script>
	// #ifdef APP-PLUS

	const plug = uni.requireNativePlugin("Html5app-TwoDisplay");
	// #endif

	import goodsReduce from '@/components/goods/goodsReduce.vue';
	import giftDish from '@/components/goods/giftDish.vue';
	import wholenote from '@/components/other/wholenote.vue';
	import takeOrder from './billing/takeOrder.vue';
	import vipUser from '@/components/user/vipUser.vue';
	import leftGoods from '@/components/order/leftGoods.vue'
	import leftCz from '@/components/order/leftcz.vue';
	import rightOrder from '@/components/pay/payInfo.vue';
	import rightGoods from './billing/rightGoods.vue';
	import cash from '@/components/pay/cash.vue';
	import scan from '@/components/pay/scan.vue';
	import goodsNum from '@/components/goods/goodsNum.vue';
	import i18n from '@/locale/index.js'
	import pickNo from './billing/pickNo.vue';
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	import {
		playAudo,
	} from "@/common/handutil.js"
	export default ({
		components: {
			goodsReduce,
			giftDish,
			wholenote,
			takeOrder,
			vipUser,
			leftGoods,
			leftCz,
			rightOrder,
			rightGoods,
			cash,
			scan,
			goodsNum,
			pickNo
		},
		data() {
			return {
				isOrder: false,
				batch: false, //批量操作
				actgood: 0,
				goodsNum: 0,
				depositList: [],
				selectItem: {},
				queryForm: {
					diningType: 6,
					pageNo: 1,
					pageSize: 30,
					categoryId: null,
					state: null,
					keyword: '',
				},
				classfiy: [],
				form: {},
				dataList: [],
				loading: '',
				total: 0,
				carList: {},
				list: [],
				params: {
					notes: '',
					// packaging: 0,
					userId: 0,
					couponId: 0,
				},
				checkInfo: {},
				cOderList: [],
				payInfo: {},
				showDel: false,
				pay: {
					name: '',
					money: '',
					payType: 0,
					authCode: 0,
					payUserId: 0,
				},
				setpickNo: 0,
				addnum: false,
			}
		},
		computed: {
			...mapState({
				storeId: state => state.storeId,
				vipInfo: state => state.vipInfo,
				handOver: state => state.handOver,
			}),
		},
		// watch: {
		// 	selectItem(val) {
		// 		this.selectItem = val
		// 	}
		// },
		methods: {
			...mapMutations(["setVip"]),
			...mapMutations(["setConfig"]),
			
			// 使用称重管理器处理称重数据
			async processWeightWithManager(weightData, product) {
				try {
					// 动态导入称重管理器
					const weightManager = await import('@/common/weight-manager.js').then(m => m.default)
					
					// 缓存商品信息
					weightManager.cacheProduct(product)
					
					// 本地计算称重结果
					const result = weightManager.processWeight(
						weightData.weight,
						product,
						{
							storeId: this.$store.state.store?.id,
							storeName: this.$store.state.store?.name,
							tableName: '',
							enablePrint: true,
							diningType: this.form.diningType,
							userId: this.vipInfo?.id || this.params.userId
						}
					)
					
					console.log('⚖️ 称重计算完成:', result)
					
					// 可选：显示称重结果给用户
					this.showWeightResult(result)
					
				} catch (error) {
					console.error('称重处理失败:', error)
					uni.showToast({
						title: '称重计算失败',
						icon: 'none'
					})
				}
			},
			
			// 显示称重结果
			showWeightResult(result) {
				const message = `重量: ${result.weight}kg\n单价: ¥${result.unitPrice}\n总价: ¥${result.totalPrice}`
				
				// 可以在这里添加UI显示逻辑
				console.log('称重结果:', message)
				
				// 可选：显示toast提示
				uni.showToast({
					title: `称重完成: ¥${result.totalPrice}`,
					icon: 'success',
					duration: 2000
				})
			},
			
			async init() {
				this.setVip({})
				console.log('34')
				this.form.diningType = 6
				this.form.storeId = this.storeId
				this.form.id = 0
				
				// 设置性能优化
				await this.setupOptimizedSearch()
				
				this.cashieSetting()
				this.getCategory()
				// this.getCar()
				this.checkOut()
				this.isOrder = false
			},
			setplug(eventtype) {
				// #ifdef APP-PLUS
				var plugdata = {
					eventtype: eventtype,
					type: 1,
					lang: i18n.locale,
					uniacid: uni.getStorageSync('uniacid'),
					storeId: uni.getStorageSync('storeId'),
					token: uni.getStorageSync('token'),
					diningType: this.form.diningType,
					tableId: this.form.id,
					userId: this.vipInfo && this.vipInfo.id || this.params.userId,
				}
				plug.sndMsgToHtml(plugdata);
				// #endif
			},
			async cashieSetting() {
				let {
					data
				} = await this.beg.request({
					url: this.api.config,
					data: {
						ident: 'cashieSetting'
					}
				})
				if (data && data.ident) {
					this.setConfig({
						name: 'cashieSetting',
						data,
					})
				}
			},
			async getCategory() {
				this.loading = true
				let {
					data: {
						list,
						total
					},
				} = await this.beg.request({
					url: this.api.inGoodsCategory,
					data: {
						pageNo: 1,
						pageSize: 999,
						state: this.queryForm.state
					},
				})
				this.classfiy = list ? list : []
				this.classfiy.unshift({
					name: this.$t('home.all'),
					id: '',
				})
				// if (list && list.length) {
				// 	this.queryForm.catId = list[0].id
				// }
				await this.fetchData()
				this.loading = false
			},
			async fetchData() {
				const cacheKey = `store_goods_list_${this.form.storeId}_${JSON.stringify(this.queryForm)}`
				const cachedData = uni.getStorageSync(cacheKey)
				// 如果有缓存，直接使用缓存数据
				if (cachedData) {
					console.log('我读取的缓存数据')
					this.total = cachedData.total
					this.dataList = cachedData.list
					return
				}
				let {
					data: {
						list,
						pageNo,
						pageSize,
						total
					},
				} = await this.beg.request({
					url: this.api.inStoreGoodsList,
					data: this.queryForm,
				})
				this.total = total
				this.dataList = list ? list : [];
				// 将数据存入缓存
				const cacheData = {
					list: this.dataList,
					total: this.total
				}
				try {
					uni.setStorageSync(cacheKey, cacheData)
				} catch (e) {
					console.error('缓存数据失败：', e)
				}
			},
			// async getCar() {
			// 	let {
			// 		data
			// 	} = await this.beg.request({
			// 		url: this.api.cart,
			// 		data: {
			// 			diningType: this.form.diningType,
			// 			storeId: this.form.storeId,
			// 			tableId: this.form.id,
			// 		}
			// 	})
			// 	this.carList.generalGoods = data.goodsList ? data.goodsList : []
			// 	if (data.goodsList && data.goodsList.length) {
			// 		this.checkOut()
			// 	}else{
			// 		this.actgood = 0
			// 		this.selectItem = {}
			// 		this.list = []
			// 		this.carList = {}
			// 	}
			// 	// this.carList = data ? data : {},
			// 	// this.list = data ? data.goodsList : []
			// },
			// 优化搜索功能 - 使用防抖
			async setupOptimizedSearch() {
				try {
					const optimizer = await import('@/common/main-thread-optimizer.js').then(m => m.default)
					this.debouncedSearch = optimizer.createDebouncedSearch(async (keyword) => {
						this.queryForm.keyword = keyword
						await this.fetchData()
					}, 300)
				} catch (error) {
					console.error('搜索优化器加载失败:', error)
				}
			},
			
			search(n) {
				if (this.debouncedSearch) {
					this.debouncedSearch(n)
				} else {
					// 降级到普通搜索
					this.queryForm.keyword = n
					this.fetchData()
				}
			},
			//切换种类
			changeKind(v, i) {
				this.queryForm.pageNo = 1
				this.queryForm.categoryId = v.id
				this.fetchData()
			},
			change(e) {
				this.queryForm.pageNo = e.current;
				this.fetchData()
			},
			async handcar(p) {
				try {
					let {
						data,
						code,
					} = await this.beg.request({
						url: this.api.cart,
						method: 'POST',
						data: {
							spuId: p.g.spuId,
							specMd5: p.g.specSwitch ? p.g.specInfo && p.g.specInfo.specMd5 : p.g.specMd5 ||
								p.g.singleSpec.specMd5,
							attrData: p.g.specMd5 ? p.g.attrData || {} : (p.g.specSwitch || p.g
								.attrSwitch || p.g
								.materialSwitch) ? {
								spec: p.g.specSwitch && p.g.ggdata ? p.g.ggdata : '',
								attr: p.g.attribute,
								matal: p.g.jldata,
								material: p.g.material,
							} : {},
							setMealData: p.g.type == 2 && p.g.setMealData ? p.g.setMealData : [],
							num: p.addwz,
							storeId: this.form.storeId,
							tableId: this.form.id,
							diningType: this.form.diningType,
							userId: this.vipInfo && this.vipInfo.id || this.params.userId,
							isTemp: p.g.isTemp || 0,
							tempIndex: p.g.tempIndex || 0,
							carttype:1,
						}
					})
					// if (data && data.cart) {
					// 	this.checkOut()
					// }

					if (data && data.cart) {
						// this.selectItem.num = p.addwz>0 ? this.selectItem.num + 1 : this.selectItem.num = p.addwz
						this.carList = data.cart
						let sList = data.cart.goodsList && data.cart.goodsList.length && data.cart.goodsList
						this.goodsNum = data.cart.goodsCount
						if (sList && sList.length) {

							var seleinfo = sList[0]
							if (!this.addnum) {
								var seleinfo = sList.find(v => v.spuId == p.g.id)
								if (!seleinfo) {
									seleinfo = sList[0]
								}
								this.selectItem = seleinfo
							} else {
								var info = sList.find(v => v.id == this.selectItem.id)
								if (!info) {
									this.selectItem = sList[0]
								}
							}
							this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? sList.find(v => v
								.id ==
								this.selectItem.id) : sList[0]
							this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id :
								sList[0].id
							// this.selectItem = sList[0]
							// this.actgood = sList[0].id
							this.list = data.cart.goodsList
							
							// #ifdef APP-PLUS
							if (this.$store.state.cashierprint == 1 && p.weight) {
								var seleitem = sList.find(v => v.spuId == p.g.id)
								if (seleitem) {
									// 使用新的称重管理器进行本地计算
									this.processWeightWithManager(p.weight, seleitem)
								}
							}
							// #endif
							
							
						} else {
							this.actgood = 0
							this.selectItem = {}
							this.list = []
						}
					}
				} catch (e) {
					console.log(e)
				}
				this.setplug("order")
			},
			async selectpickNo() {
				console.log(this.carList.goodsList)
				if (!this.handOver.id) {
					return this.$emit('openOver')
				}
				//const hasWeightGoods = this.carList.generalGoods.some(goods => goods.weightSwitch === 1);
				const hasWeightGoods = this.carList.goodsList.some(item => item.goods && item.goods
					.weightSwitch === 1);
				if (hasWeightGoods) {
					this.$refs['pickNoRef'].open()
				} else {
					await this.takeOrder()
				}
			},
			async saveNumber(num) {
				console.log(num)
				this.setpickNo = num
				if (!this.isOrder) {
					await this.takeOrder()
				}

			},
			//下单
			async takeOrder() {
				//เลขที่สั่ง
				// console.log('1212')
				// return;

				if (this.list && this.list.length > 0) {
					this.isOrder = true
					await this.checkOut()
					this.$nextTick(() => this.$refs['rightOrderRef'].getWays())
					//this.setplug("payorder")

				} else {
					uni.showToast({
						title: this.$t("home.selectItemsFirst"),
						icon: 'none'
					})
				}
			},
			async rOrder() {
				let {
					data
				} = await this.beg.request({
					url: this.api.cancelDiscount,
					method: 'POST',
					data: {
						diningType: this.form.diningType,
						storeId: this.form.storeId,
						tableId: this.form.id,
						type: 'all',
					}
				})
				this.setplug("order")
				this.rfCheckOut(data)
				this.isOrder = false

			},
			rfCheckOut(data) {
				this.payInfo = {
					...this.form,
					...data
				}

				this.carList = data ? data : {}
				let sList = data.goodsList && data.goodsList.length && data.goodsList
				if (sList && sList.length) {
					this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? sList.find(v => v.id == this
						.selectItem.id) : sList[0]
					this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id : sList[0].id
					this.list = data.goodsList
				} else {
					this.actgood = 0
					this.selectItem = {}
					this.list = []
				}

			},
			async checkOut(p) {
				let {
					data
				} = await this.beg.request({
					url: this.api.checkout,
					data: {
						diningType: this.form.diningType,
						storeId: this.form.storeId,
						tableId: this.form.id,
						// packaging: this.params.packaging,
						userId: this.vipInfo && this.vipInfo.id || this.params.userId,
						// couponId: this.params.couponId,
						notes: this.params.notes,
						check: 'false',
					}
				})
				//console.log(11, data)
				// this.checkInfo = data ? data : {},
				this.payInfo = {
					...this.form,
					...data
				}

				this.goodsNum = data.goodsNum
				// this.selectItem.num = p.addwz>0 ? this.selectItem.num + 1 : this.selectItem.num = p.addwz
				this.carList = data ? data : {}
				this.carList.pickAll = data && data.packaging ? [1] : []
				let sList = data.goodsList && data.goodsList.length && data.goodsList
				if (sList && sList.length) {
					var seleinfo = sList[0]
					if (!this.selectItem) {
						this.selectItem = sList[0]
						this.selectItem.id = seleinfo.id
					}
					this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? sList.find(v => v.id == this
						.selectItem.id) : sList[0]
					this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id : sList[0]
						.id
					this.list = data.goodsList
				} else {
					this.actgood = 0
					this.selectItem = {}
					this.list = []
				}
				if (this.isOrder) {
					this.setplug("payorder")
				} else {
					this.setplug("order")
				}

			},
			async cpOut(e) {
				this.params.couponId = e
				let {
					data
				} = await this.beg.request({
					url: this.api.cCoupon,
					method: 'POST',
					data: {
						diningType: this.form.diningType,
						storeId: this.form.storeId,
						tableId: this.form.id,
						couponId: e || this.params.couponId,
						userId: this.vipInfo && this.vipInfo.id || this.params.userId,
						notes: this.params.notes,
					}
				})
				this.payInfo = {
					...this.form,
					...data
				}
				this.carList = data ? data : {}
				this.carList.pickAll = data && data.packaging ? [1] : []
				let sList = data.goodsList && data.goodsList.length && data.goodsList
				if (sList && sList.length) {
					this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? sList.find(v => v.id == this
						.selectItem.id) : sList[0]
					this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id : sList[0]
						.id
					this.list = data.goodsList
				} else {
					this.actgood = 0
					this.selectItem = {}
					this.list = []
				}
			},
			handBatch(e) {
				this.batch = e
			},
			//整单打包
			async allPack(e) {
				let {
					data
				} = await this.beg.request({
					url: this.api.goodsPackAll,
					method: 'POST',
					data: {
						type: !e.includes(1) ? 'back' : '',
						tableId: this.form.id,
						storeId: this.form.storeId,
						diningType: this.form.diningType,
					},
				})
				this.checkOut()
			},
			async handPack() {
				let ids = []
				ids.push(this.selectItem && this.selectItem.id)
				let {
					data
				} = await this.beg.request({
					url: this.api.goodsPack,
					method: 'POST',
					data: {
						ids,
						type: this.selectItem && this.selectItem.pack ? 'back' : '',
					}
				})
				this.checkOut()
			},
			clearAll() {
				if (this.carList.goodsList.length == 0) {
					uni.showToast({
						title: this.$t("home.emptyCart"),
						icon: 'none',
						duration: 800
					});

				} else {
					this.showDel = true
					this.setplug("order")
				}
			},
			//选择商品
			chooseGood(item, index) {
				console.log(11, item)
				this.actgood = item.id
				this.selectItem = item
			},
			async delCar() {
				let {
					msg
				} = await this.beg.request({
					url: this.api.clearCart,
					method: 'DELETE',
					data: {
						tableId: this.form.id,
						storeId: this.form.storeId,
						diningType: this.form.diningType,
					}
				})
				uni.showToast({
					title: msg,
					icon: 'none'
				});
				this.checkOut()
				this.showDel = false


			},
			async handItem(p) {
				if (p.g.num < 1) {
					this.selectItem = {}
				}
				if (p.g.discountType && p.g.discountType <= 3) {
					let {
						data,
						code,
					} = await this.beg.request({
						url: this.api.give,
						method: 'POST',
						data: {
							goods: [{
								id: p.g.id,
								num: p.addwz
							}],
							type: 'give',
							storeId: this.form.storeId,
							tableId: this.form.id,
							diningType: this.form.diningType,
						}
					})
					if (code && code == 200) {
						this.selectItem.num = p.addwz > 0 ? this.selectItem.num + 1 : this.selectItem.num - 1
						this.checkOut()
					}
				} else {
					this.addnum = true
					this.handcar(p)
				}
			},
			handDel(p) {
				this.selectItem = {}
				this.handcar(p)
			},
			async handItemDel(p) {
				let {
					msg,
					code,
					data
				} = await this.beg.request({
					url: `${this.api.cart}/${p.g.id}`,
					method: 'DELETE'
				})
				uni.$u.toast(msg)
				if (code && code == 200) {
					this.selectItem = {}
					this.checkOut()
				}
			},
			async cancelDis(p) {
				let {
					data
				} = await this.beg.request({
					url: this.api.give,
					method: 'POST',
					data: {
						goods: [{
							id: p.g.id,
							num: p.addwz
						}],
						type: 'back',
						storeId: this.form.storeId,
						tableId: this.form.id,
						diningType: this.form.diningType,
					}
				})
				this.checkOut(p)
			},
			handRemark(t) {
				this.$refs['wholenoteRef'].open(t)
			},
			handAllDesc(t) {
				this.$refs['wholenoteRef'].open(t)
			},
			//整单备注
			returnRemark(e, t) {
				if (t == 1) {
					this.params.notes = e.join('，')
					this.allRemark()
				} else {
					this.params.notes = e
				}
				this.$refs['wholenoteRef'].close()
			},
			async allRemark(e) {
				let {
					data
				} = await this.beg.request({
					url: this.api.goodsAllRemark,
					method: 'POST',
					data: {
						notes: this.params.notes,
						tableId: this.form.id,
						storeId: this.form.storeId,
						diningType: this.form.diningType,
					},
				})
				this.checkOut()
			},
			async itemRemark(e, t) {
				let ids = [],
					notes = t == 1 ? e.join('，') : e
				ids.push(this.selectItem && this.selectItem.id)
				let {
					data
				} = await this.beg.request({
					url: this.api.goodsNotes,
					method: 'POST',
					data: {
						ids,
						notes,
					}
				})
				this.checkOut()
				this.$refs['wholenoteRef'].close()
			},
			handRescind() {
				this.rescind = true
			},
			handDis() {
				this.$refs['reduceRef'].open()
			},
			handGift() {
				this.$refs['giftRef'].open()
			},
			async changeMonry(e) {
				let {
					data,
					msg,
					code,
				} = await this.beg.request({
					url: this.api.give,
					method: 'POST',
					data: e
				})
				uni.showToast({
					title: msg,
					icon: 'none'
				})
				if (code && code == 200 && this.selectItem.num == e.goods[0].num) {
					this.selectItem = {}
					this.checkOut()
					this.$refs['reduceRef'].close()
				} else {
					this.$refs['reduceRef'].close()
					this.checkOut()
				}
			},
			async changeNumber(e) {
				let {
					data,
					msg,
					code
				} = await this.beg.request({
					url: this.api.give,
					method: 'POST',
					data: e
				})
				uni.showToast({
					title: msg,
					icon: 'none'
				})
				if (code && code == 200 && this.selectItem.num == e.goods[0].num) {
					this.selectItem = {}
					this.checkOut()
					this.$refs['giftRef'].close()
				} else {
					this.$refs['giftRef'].close()
					this.checkOut()
				}
			},
			payType(t) {
				if (!this.handOver.id) {
					return this.$emit('openOver')
				}
				if (t == 1) {
					this.pay.payType = 'cash'
					this.pay.name = this.$t("home.cashPayment")
					this.$refs['cashRef'].open(this.carList.money)
				} else if (t == 2) {
					this.pay.payType = 'authCode'
					this.pay.name = this.$t("home.scanPayment")
					this.$refs['scanRef'].open(this.carList.money)
					if (i18n.locale == 'th') {
						playAudo('../../static/auto/th_fukuanma.wav')
					} else if (i18n.locale == 'en') {
						playAudo('../../static/auto/en_fukuanma.wav')
					} else {
						playAudo('../../static/auto/fukuanma.mp3')
					}
				}
			},
			changeMoney(e) {
				this.pay.money = e
				this.savePay()
			},
			async savePay(e) {
				if (e) {
					this.pay.authCode = e
					this.loading = true
				}
				this.pay.diningType = this.form.diningType
				this.pay.tableId = this.form.id
				let {
					msg,
					data
				} = await this.beg.request({
					url: this.api.inOrder,
					method: 'POST',
					data: this.pay
				})
				this.loading = false
				uni.$u.toast(msg)
				this.setVip({})
				this.$refs['scanRef'].close()
				if (data) {
					this.init()
					this.cInit()
				}


			},
			cInit() {
				this.params.notes = ''
				console.log('1212')
				// if (cashierPrint == null) {
				// 	console.log('注册 插件失败')
				// }
				// cashierPrint.testAsyncFunc({
				// 	name: '1212',
				// 	age: 18
				// }, res => {
				// 	console.log(res)
				// });
			},
			async handDeposit() {
				let {
					data,
					msg,
				} = await this.beg.request({
					url: this.api.goodsFreeze,
					method: 'POST'
				})
				uni.$u.toast(msg)
				this.checkOut()
			},
			handUpOrder() {
				this.$refs['takeRef'].open()
			},
			handEditNum() {
				if (this.selectItem && this.selectItem.num) {
					this.$refs['goodsNumRef'].open(this.selectItem)
				}
			},
			async changeValue(e) {
				let num = Number(e) - Number(this.selectItem.num)
				await this.handItem({
					g: this.selectItem,
					addwz: num
				})
				this.$refs['goodsNumRef'].close()
			},
			async addCar(v) {
				let {
					data
				} = await this.beg.request({
					url: this.api.ctemp,
					method: 'POST',
					data: {
						tableId: this.form.id,
						storeId: this.form.storeId,
						diningType: this.form.diningType,
						isTemp: 1,
						tempIndex: 0,
						num: v.num,
						name: v.name,
						price: v.price,
						notes: v.notes,
					},
				})
				this.$refs['rightGoodRef'].closeAdd()
				this.checkOut()
			}
		}
	})
</script>

<style lang="scss" scoped>
	.left {
		width: 30vw;
		border-radius: 0 6px 0 0;

		/deep/.u-button {
			span {
				color: #fff;
			}
		}
	}

	.u-popup {
		flex: 0;
	}

	.icon-licai,
	.icon-saoma {
		font-size: 1.6105vw !important;
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.left {
			width: 400px;
		}

		.icon-licai,
		.icon-saoma {
			font-size: 22px !important;
		}
	}

	@media (min-width: 500px) and (max-width: 900px) {
		.isOrder_media {
			/deep/.u-button--normal {
				padding: 0 !important;
			}
		}
	}
</style>