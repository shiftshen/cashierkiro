<template>
	<view class="f-y-bt w100v o-h">
		<tTop :form="form" @getTableInfo="getTableInfo" @search="search"></tTop>
		<view class="f-1 bf f-bt">
			<view class="left br1 f-y-bt f18">
				<view class="user p15 bd1">
					<vipUser mode="tableOrder" @rfuser='checkOut'></vipUser>
				</view>
				<leftGoods mode='tableOrder' :ad="addGoods" :prentcarList="prentcarList" :carList="carList"
					:batch="batch" :actgood="actgood" :checkInfo="checkInfo" :params="params" @hItem="handItem"
					@dItem="handDel" @chooseGood="chooseGood" @clearAll="clearAll"></leftGoods>
				<view class="f-c l-h1 p10">
					<u-button
						:customStyle="{color:'#000',width:`${pc?'175px':'12.8111vw'}`,height:`${pc?'50px':'7.1614vh'}`,marginRight:`${pc?'15px':'1.0980vw'}`}"
						@click="settleAcc" :disabled="!list.length">
						<text class="f20 wei6">{{$t("table.order_and_checkout")}}</text>
					</u-button>
					<u-button color="#4275F4" @click="takeOrder"
						:customStyle="{color:'#fff',width:`${pc?'175px':'12.8111vw'}`,height:`${pc?'50px':'7.1614vh'}`}"
						:disabled="!list.length">
						<text class="f20 wei6">{{$t("table.place_order")}}</text>
					</u-button>
				</view>
			</view>
			<leftCz mode="tableOrder" :selectItem="selectItem" :carList="carList" :list="list" @hItem="handItem"
				@handItemDel="handItemDel" @cDis="cancelDis" @handRemark="handRemark" @handBatch="handBatch"
				@handAllDesc="handAllDesc" @handRescind="handRescind" @gDis="handDis" @gGift="handGift"
				@turntable="turntable" @handPack="handPack" @handEditNum="handEditNum"></leftCz>
			<rightGoods ref="rightGoodRef" :queryForm="queryForm" :total="total" :list="list" :dataList="dataList"
				:classfiy="classfiy" @handcar="handcar" @change="change" @changeKind="changeKind" @addCar="addCar">
			</rightGoods>
		</view>
		<wholenote ref="wholenoteRef" @returnRemark="returnRemark" @itemRemark="itemRemark" />
		<goodsReduce ref="reduceRef" :v="form" :selectItem="selectItem" @cMonry="changeMonry" />
		<giftDish ref="giftRef" :v="form" :selectItem="selectItem" @cGift="changeNumber" />
		<u-modal :show="rescind" :showCancelButton="true" width="300px" title=" "
			:content="$t('table.confirm_cancel_table')" confirmColor="#fff" @cancel="rescind=false"
			@confirm="pullpack"></u-modal>
		<u-modal :show="showDel" :title="$t('table.confirm_clear_cart')" width="300px" :showCancelButton="true"
			confirmColor="#fff" :cancelText="$t('table.cancel')" @cancel="showDel=false" @close="showDel=false"
			@confirm="delCar" ref="uModal"></u-modal>
		<!-- <wholenote :allDesc="allDesc" @closeDesc="allDesc=false" @returnRemark="returnRemark" /> -->
		<u-modal :show="recharge" width="300px" title=" " :content="$t('table.activate_to_use')" confirmColor="#fff"
			@confirm="recharge=false"></u-modal>
		<serviceCharge :service="service" @closeService="service=false" />
		<!-- <share :share="share" @closeShare="share=false" /> -->
		<!-- <addDish :addDish="addDish" @closeAdd="addDish=false" /> -->
		<goodsNum ref="goodsNumRef" @changeValue="changeValue" :tx="$t('goods-components.change_quantity')"></goodsNum>

	</view>
</template>

<script>
	// #ifdef APP-PLUS
	const plug = uni.requireNativePlugin("Html5app-TwoDisplay");
	// #endif
	import i18n from '@/locale/index.js'
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	import serviceCharge from './components/serviceCharge.vue';
	import goodsReduce from '@/components/goods/goodsReduce.vue';
	import giftDish from '@/components/goods/giftDish.vue';
	import wholenote from '@/components/other/wholenote.vue';
	import tTop from './components/tTop.vue'
	import vipUser from '@/components/user/vipUser.vue';
	import leftGoods from '@/components/order/leftGoods.vue'
	import leftCz from '@/components/order/leftcz.vue';
	import rightGoods from './components/rightGoods.vue';
	import goodsNum from '@/components/goods/goodsNum.vue';
	import site from '@/custom/siteroot.js';
	import {
		throttle
	} from '@/common/handutil.js'
	import goodsPreloader from '@/common/goods-preloader.js'
	export default {
		components: {
			serviceCharge,
			goodsReduce,
			giftDish,
			wholenote,
			tTop,
			vipUser,
			leftGoods,
			leftCz,
			rightGoods,
			goodsNum,
		},

		data() {
			return {
				batch: false, //批量操作
				recharge: false, //团购券
				service: false, //服务费
				share: false, //拼桌
				rescind: false, //撤台
				kind: 0,
				actgood: 0,
				id: 0,
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
				preloaderInitialized: false, // 预加载器初始化标志
				carList: {},
				prentcarList: {},
				list: [],
				params: {
					notes: '',
					packaging: 0,
					userId: 0,
				},
				checkInfo: {},
				cOderList: [],
				showDel: false,
				addGoods: '',
				seleccarid: 0,
				addnum: false,
			}
		},
		provide() {
			return {
				getSomeData: () => this.form
			};
		},
		computed: {
			...mapState({
				vipInfo: state => state.vipInfo,
			}),
		},
		async onLoad(option) {
			if (option) {
				this.id = option.id
				await this.getTableInfo()
				if (option.addGoods) {
					this.addGoods = option.addGoods
				}
				this.init()
			}
		},
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
							storeId: this.form.storeId,
							storeName: this.$store.state.store?.name,
							tableName: this.form.name,
							enablePrint: true,
							diningType: this.form.diningType,
							tableId: this.form.id,
							userId: this.vipInfo?.id || this.params.userId
						}
					)
					
					console.log('⚖️ 餐桌称重计算完成:', result)
					
				} catch (error) {
					console.error('餐桌称重处理失败:', error)
					uni.showToast({
						title: '称重计算失败',
						icon: 'none'
					})
				}
			},
			init() {
				this.setVip({})
				this.getCategory()

				// this.getCar()
				this.checkOut()

				this.cashieSetting()
				this.getReasonConfig()
			},
			setplug() {
				// #ifdef APP-PLUS
				var plugdata = {
					eventtype: "order",
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
			async getTableInfo() {
				let {
					data
				} = await this.beg.request({
					url: `${this.api.inTabel}/${this.id}`,
				})
				console.log(data)
				this.form = data ? data : {},
					this.checkOut()
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
				console.log('12-12', list[0])
				this.classfiy = list ? list : []
				if (list && list.length > 0) {
					this.queryForm.categoryId = list[0].id
					this.$refs['rightGoodRef'].kind = 1
				}

				this.classfiy.unshift({
					name: this.$t('table.all'),
					id: '',
				})

				await this.fetchData()
				this.loading = false
			},
			async fetchData() {
				// 初始化预加载器
				if (!this.preloaderInitialized) {
					await goodsPreloader.init(this.queryForm, this.api, this.beg)
					this.preloaderInitialized = true
				}

				// 尝试从预加载器获取数据
				try {
					const pageData = await goodsPreloader.getPage(this.queryForm.pageNo || 1)
					if (pageData) {
						this.total = pageData.total
						this.dataList = pageData.list
						console.log('📦 使用预加载数据')
						return
					}
				} catch (error) {
					console.error('预加载器获取数据失败:', error)
				}

				// 降级到原始缓存逻辑
				const cacheKey = `store_goods_list_${this.form.storeId}_${JSON.stringify(this.queryForm)}`
				const cachedData = uni.getStorageSync(cacheKey)
				if (cachedData) {
					console.log('📖 使用本地缓存数据')
					this.total = cachedData.total
					this.dataList = cachedData.list
					return
				}

				// 最后降级到网络请求
				console.log('🌐 从服务器获取数据')
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
			async getReasonConfig() {
				let {
					data
				} = await this.beg.request({
					url: this.api.config,
					data: {
						ident: 'reasonConfig'
					}
				})
				this.setConfig({
					name: 'reasonConfig',
					data,
				})
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
			// 	if (data.goodsList && data.goodsList.length || this.addGoods==1) {
			// 		this.checkOut()
			// 	}
			// },
			search(n) {
				this.queryForm.pageNo = 1
				this.queryForm.keyword = n
				this.fetchData()
			},
			changeKind(v, i) {
				this.queryForm.pageNo = 1
				this.queryForm.categoryId = v.id
				
				// 更新预加载器查询条件
				if (this.preloaderInitialized) {
					goodsPreloader.updateQuery(this.queryForm)
				}
				
				this.fetchData()
			},
			async change(e) {
				this.queryForm.pageNo = e.current;
				
				// 使用预加载器获取数据
				try {
					const pageData = await goodsPreloader.getPage(e.current)
					if (pageData) {
						this.dataList = pageData.list
						this.total = pageData.total
						console.log(`⚡ 快速加载第 ${e.current} 页 (${pageData.list.length} 项)`)
					} else {
						// 预加载器失败，降级到原始方法
						await this.fetchData()
					}
				} catch (error) {
					console.error('预加载获取失败，使用原始方法:', error)
					await this.fetchData()
				}
			},
			async handcar(p) {
				console.log('12-3', p)
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
								p.g
								.singleSpec.specMd5,
							attrData: p.g.specMd5 ? p.g.attrData || {} : (p.g.specSwitch || p.g.attrSwitch || p
								.g
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
							carttype: 1,
						}
					})
					// if (data && data.cart) {
					// 	this.checkOut()
					// }
					// this.selectItem.num = p.addwz>0 ? this.selectItem.num + 1 : this.selectItem.num - 1
					if (data && data.cart) {
						this.carList = data.cart
						let sList = data.cart.goodsList && data.cart.goodsList.length && data.cart.goodsList
						if (sList && sList.length) {
							// if (this.addGoods == 1) {
							// 	//...data.prentGoods, 
							// 	this.list = [...data.goodsList]

							// 	this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? 
							// 	sList.find(v => v.id == this.selectItem.id) : sList[0]
							// 	this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id :sList[0].id

							// } else {
							// 	this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? sList.find(v => v
							// 		.id ==
							// 		this.selectItem.id) : sList[0]
							// 	this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id :
							// 		sList[0].id
							// 	this.list = data.goodsList
							// }
							// console.log(p.g.id)
							// console.log('3434', this.seleccarid)
							// console.log('1212', this.selectItem.id)
							var seleinfo = sList[0]
							//console.log(this.addnum)
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
							this.list = data.cart.goodsList

							this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ?
								sList.find(v => v.id == this.selectItem.id) : sList[0]
							this.actgood = this.selectItem.id &&
								this.selectItem.num >= 1 ? this.selectItem.id : sList[0].id

							this.addnum = false

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
							this.seleccarid = 0
							this.addnum = false
						}
					}
					this.setplug()

		 
					console.log('12-4', data.cart)

				} catch (e) {
					console.log(e)
				}
			},
			settleAcc: throttle(async function(e) {
				//await this.checkOut()
				let {
					data
				} = await this.beg.request({
					url: this.api.inOrder,
					mask: "Please wait...",
					method: 'POST',
					data: {
						diningType: this.form.diningType,
						tableId: this.form.id,
					}
				})
				this.orderInfo = data
				this.setVip({})
				if (data && (data.prentOrderSn || data.orderSn)) {
					uni.redirectTo({
						url: `/pages/table/orderPay?id=${data.prentOrderSn || data.orderSn}`
					})
				}
			}, 500),
			takeOrder: throttle(async function(e) {
				console.log('takeOrder')
				let {
					data
				} = await this.beg.request({
					url: this.api.inOrder,
					method: 'POST',
					mask: "Please wait...",
					data: {
						diningType: this.form.diningType,
						tableId: this.form.id,
					}
				})
				this.orderInfo = data
				this.setplug()

				this.setVip({})
				if (data && (data.prentOrderSn || data.orderSn)) {
					uni.reLaunch({
						url: `/pages/home/index?current=1`
					})
				}

			}, 500),
			async checkOut() {
				if (this.vipInfo && this.vipInfo.id) {
					this.params.userId = this.vipInfo.id
				} else {
					this.params.userId = 0
				}
				let {
					data
				} = await this.beg.request({
					url: this.api.checkout,
					data: {
						diningType: this.form.diningType,
						storeId: this.form.storeId,
						tableId: this.form.id,
						packaging: this.params.packaging,
						userId: this.params.userId,
						notes: this.params.notes,
						check: 'false',
					}
				})
				this.carList = data ? data : {}
				this.prentcarList = data ? data : {},
					console.log('1212--12', this.prentcarList)
				let sList = data.goodsList && data.goodsList.length && data.goodsList
				if (sList && sList.length) {
					// if (this.addGoods == 1) {
					// 	this.list = [...data.goodsList]

					// 	this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? sList.find(v => v.id == this
					// 		.selectItem.id) : sList[0]
					// 	this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id : sList[0]
					// 		.id

					// } else {
					// 	this.selectItem = this.selectItem.id && this.selectItem.num >= 1 ? sList.find(v => v.id == this
					// 		.selectItem.id) : sList[0]
					// 	this.actgood = this.selectItem.id && this.selectItem.num >= 1 ? this.selectItem.id : sList[0]
					// 		.id
					// 	this.list = data.goodsList
					// }
					var seleinfo = sList[0]
					if (!this.selectItem) {
						this.selectItem = sList[0]
						this.selectItem = seleinfo
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
				if (data.prentOrder && data.prentOrder.notes) {
					this.params.notes = data.prentOrder.notes
				}
				this.setplug()
			},
			clearAll() {
				if (this.carList.goodsList.length == 0) {
					uni.showToast({
						title: this.$t('table.no_cart_data'),
						icon: 'none',
						duration: 800
					});
				} else {
					this.showDel = true
					this.setplug()
				}
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
			chooseGood(item, index) {
				console.log(11, item)
				this.actgood = item.id
				this.selectItem = item
				this.seleccarid = item.id
			},
			async handItem(p) {
				console.log(p)
				if (p.g.num < 1) {
					this.selectItem = {}
				}
				if (p.g.discountType && p.g.discountType <= 3) {
					let {
						data,
						code
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
					// this.selectItem = {}
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
				this.checkOut()
			},
			handRemark(t) {
				this.$refs['wholenoteRef'].open(t)
			},
			handAllDesc(t) {
				this.$refs['wholenoteRef'].open(t)
			},
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
			async pullpack() {
				let {
					msg,
					code
				} = await this.beg.request({
					url: `${this.api.backTb}/${this.form.id}`,
					method: 'POST'
				})
				uni.showToast({
					title: msg,
					icon: 'none',
					duration: 2000
				})
				if (code && code == 200) {
					this.rescind = false
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/home/index?current=1'
						})
					}, 800)
				}
			},
			turntable() {
				uni.navigateTo({
					url: `/pages/table/table?id=${this.id}&t=turntable`
				})
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
			combine() {
				uni.navigateTo({
					url: `/pages/table/combineMultiple?id=${this.id}&t=parallel`
				})
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
			},
			handEditNum(g) {
				console.log(this.selectItem)
				if (this.selectItem && this.selectItem.num) {
					this.$refs['goodsNumRef'].open(this.selectItem)
				}
			},
			async changeValue(e) {
				let num = Number(e) - Number(this.selectItem.num)
				//handItem(p) 
				await this.handItem({
					g: this.selectItem,
					addwz: num
				})
				this.$refs['goodsNumRef'].close()
			},
		}
	}
</script>

<style lang="scss" scoped>
	::v-deep(.u-modal__button-group__wrapper--confirm) {
		background: #4275F4;
	}

	::v-deep(.u-modal__content__text) {
		font-size: 16px !important;
		color: #000 !important;
	}

	.left {
		width: 29.2825vw;
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.left {
			width: 400px;
		}
	}
</style>