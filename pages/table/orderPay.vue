<template>
	<view class="f-y-bt w100v o-h">
		<tTop type="oAfter" :form="form" @fetchData="fetchData"></tTop>
		<view class="f-1 bf f-bt">
			<view class="left br1 f-y-bt f18">
				<view class="user p15 bd1">
					<vipUser mode="tableOrder" @rfuser="checkuser"></vipUser>
				</view>
				<leftGoods mode='tableOrder' type="oAfter" :carList="form" :batch="batch" :actgood="actgood"
					:checkInfo="form" :params="params" @hItem="handItem" @chooseGood="chooseGood" @clearAll="clearAll">
				</leftGoods>
				<view class="f-c l-h1 p10">
					<u-button color="#4275F4" :disabled="form.payType==1"
						:customStyle="{color:'#fff',width:`${pc?'150px':'10.9809vw'}`,height:`${pc?'55px':'7.1614vh'}`,marginRight:`${pc?'15px':'1.0980vw'}`}"
						@click="addMenu">
						<text class="f20 wei6">{{$t('table.add_dish')}}</text></u-button>
					<u-button
						:customStyle="{color:'#000',width:`${pc?'175px':'12.8111vw'}`,height:`${pc?'55px':'7.1614vh'}`}"
						@click="dyyjd">
						<text class="f20 wei6">{{$t('table.print_pre_bill')}}</text></u-button>
				</view>
			</view>
			<leftCz mode='tableOrder' type="oAfter" :carList="form" :selectItem="selectItem" :list="list"
				@hItem="handItem" @cDis="cancelDis" @handRemark="handRemark" @handBatch="handBatch"
				@handAllDesc="handAllDesc" @handRescind="handRescind" @gDis="handDis" @gGift="handGift"
				@gRefund="handRefund" @turntable="turntable" @combine="combine" @backTb="handBackTb"
				@clearTb="handClearTb">
			</leftCz>
			<payInfo ref="rightOrderRef" :form="form" :iniordermoney="iniordermoney" @init="init" @checkOut="fetchData"
				@ck="checkuser" @cpOut="cpOut">
			</payInfo>
		</view>
		<goodsReduce ref="reduceRef" :v="form" :selectItem="selectItem" @cMonry="changeGive" />
		<giftDish ref="giftRef" :v="form" :selectItem="selectItem" @cGift="changeGive" />
		<refundDish ref="refundRef" :v="form" :selectItem="selectItem" @cRefund="changeGive" />
		<backTable ref="backTableRef" :v="form" @save="pullpack"></backTable>
		<u-modal :show="rescind" :showCancelButton="true" width="300px" title=" " :cancelText="$t('modal.cancelText')"
			:confirmText="$t('modal.confirmText')" :content="$t('table.confirm_cancel_whole_order')" confirmColor="#000"
			@cancel="rescind=false" @confirm="pullpack"></u-modal>
		<u-modal :show="clearTbShow" :showCancelButton="true" width="300px" title=" "
			:cancelText="$t('modal.cancelText')" :confirmText="$t('modal.confirmText')"
			:content="$t('table.confirm_clear_table')" confirmColor="#fff" @cancel="clearTbShow=false"
			@confirm="pullClear"></u-modal>
	</view>
</template>

<script>

	// 安全的性能监控
	let pageStartTime = Date.now();
	
	function logPerformance(message, data) {
		console.log('🚀 [性能]', message, data || '');
	}
	
	// 简单缓存（仅在支持的环境中使用）
	function safeSetCache(key, data) {
		try {
			if (typeof uni !== 'undefined' && uni.setStorageSync) {
				uni.setStorageSync('perf_' + key, JSON.stringify({
					data: data,
					time: Date.now()
				}));
			}
		} catch (e) {
			// 忽略缓存错误
		}
	}
	
	function safeGetCache(key) {
		try {
			if (typeof uni !== 'undefined' && uni.getStorageSync) {
				const cached = uni.getStorageSync('perf_' + key);
				if (cached) {
					const parsed = JSON.parse(cached);
					// 5分钟缓存
					if (Date.now() - parsed.time < 300000) {
						logPerformance('缓存命中', key);
						return parsed.data;
					}
				}
			}
		} catch (e) {
			// 忽略缓存错误
		}
		return null;
	}
	
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	import tTop from './components/tTop.vue'
	import vipUser from '@/components/user/vipUser.vue';
	import leftGoods from '@/components/order/leftGoods.vue'
	import leftCz from '@/components/order/leftcz.vue';
	import payInfo from '@/components/pay/payInfo.vue';
	import goodsReduce from '@/components/goods/goodsReduce.vue';
	import giftDish from '@/components/goods/giftDish.vue';
	import refundDish from '@/components/goods/refundDish.vue';
	import backTable from '@/components/goods/backTable.vue';
	import EscPosUtil from '@/lib/EscPosUtil.js';

	// #ifdef APP-PLUS
	const plug = uni.requireNativePlugin("Html5app-TwoDisplay");
	// #endif

	export default {
		components: {
			tTop,
			vipUser,
			leftGoods,
			leftCz,
			payInfo,
			goodsReduce,
			giftDish,
			refundDish,
			backTable,
		},
		data() {
			return {
				id: '',
				classfiy: [],
				form: {},
				dataList: [],
				loading: '',
				total: 0,
				carList: {},
				list: [],
				params: {
					notes: '',
					packaging: 0,
					userId: 0,
				},
				cOderList: [],
				batch: false,
				actgood: 0,
				checkInfo: {},
				selectItem: {},
				rescind: false,
				clearTbShow: false,
				ordercoupon: {},
				iniordermoney: 0,
			}
		},
		computed: {
			...mapState({
				vipInfo: state => state.vipInfo
			}),
		},
		async onLoad(option) {
				pageStartTime = Date.now();
				logPerformance('页面开始加载');
			if (option && option.id) {
				this.id = option.id
				await this.fetchData()

				//await this.getCoupon()

			}
			this.getReasonConfig()
			this.$nextTick(() => {
					this.$refs['rightOrderRef'].getWays();
					setTimeout(() => {
						const loadTime = Date.now() - pageStartTime;
						logPerformance('页面加载完成', loadTime + 'ms');
					}, 100);
				})
		},
		computed: {
			...mapState({
				storeId: state => state.storeId,
			}),
		},
		methods: {
			...mapMutations(["setVip"]),
			...mapMutations(["setConfig"]),
			async fetchData() {
				logPerformance('开始获取订单数据');
				let {
					data
				} = await this.beg.request({
					url: `${this.api.inStoreOrder}/${this.id}`,
					data: {
						storeId: this.storeId

					},
				})
				this.form = data ? data : {};
				//console.log(this.form)



				this.iniordermoney = data.money
				this.form.goodsList = data.subGoods ? data.subGoods : []
				let sList = data.subGoods && data.subGoods.length && data.subGoods
				if (sList && sList.length) {
					this.selectItem = this.selectItem.spuId && this.selectItem.num >= 1 ? sList.find(v => v.spuId ==
						this.selectItem.spuId) : sList[0]
					this.actgood = this.selectItem.spuId && this.selectItem.num >= 1 ? this.selectItem.id : sList[0].id
					this.list = sList
				} else {
					this.actgood = 0
					this.selectItem = {}
					this.list = []
				}

				this.setplug("tablepayorder")
				if (this.form.userId) {
					console.log(this.form.userId)
					await this.getuserinfo(this.form.userId)
					await this.getCoupon(this.form.userId)
				} else {
					this.setVip({});
				logPerformance('订单数据处理完成');
				}
			},
			async getuserinfo(userid) {
				let {
					data
				} = await this.beg.request({
					url: this.api.cMember,
					data: {
						userid: userid
					},
				})
				if (data && data.list.length) {
					//console.log(data.list[0])
					this.setVip(data.list[0])
				
				}
			},
			async getCoupon(userid) {
				let {
					data
				} = await this.beg.request({
					url: `${this.api.orderCoupon}`,
					data: {
						id: this.id,
						storeId: this.storeId,
						userid: userid
					},
				})
				this.ordercoupon = data
				//rightOrderRef
				this.$refs["rightOrderRef"].ordercoupon = data
				//newvipcoupon
				if (data.vipDiscount) {
					this.$refs["rightOrderRef"].vipcouponmoney = parseFloat(data.vipDiscount.money)
					this.$refs["rightOrderRef"].vipcoupon = data.vipDiscount
					//this.form.money = Math.max(0, parseFloat(this.form.money) - parseFloat(data.vipDiscount.money));
					this.form.money = Math.max(0, parseFloat(this.form.money) - parseFloat(data.vipDiscount.money)).toFixed(2);
					console.log(this.form.money)
					if(parseFloat(this.form.vatValue)>0){
						// this.form.taxIncluded= Math.max(0, parseFloat(this.form.money) *parseFloat(this.form.vatValue)).toFixed(2);

						this.form.taxIncluded = (parseFloat(this.form.money) / (1 + parseFloat(this.form.vatValue)) * parseFloat(this.form.vatValue)).toFixed(2);
					}
				
					if (this.$refs["rightOrderRef"].pay.money) {
						console.log('121')
						this.$refs["rightOrderRef"].pay.money = this.form.money;
					}
				}
				if(data.coupons &&data.coupons.true &&data.coupons.true.length>0){
					console.log(data.coupons.true[0])
					this.$refs["rightOrderRef"].payorder(data.coupons.true[0])
				}
			},
			setplug(eventtype) {
				// #ifdef APP-PLUS
				var plugdata = {
					eventtype: eventtype,
					type: 1,
					token: uni.getStorageSync('token'),
					uniacid: uni.getStorageSync('uniacid'),
					storeId: this.storeId,
					orderid: this.id,
				}
				try {
					if (plug && plug.sndMsgToHtml) {
						plug.sndMsgToHtml(plugdata);
					} else {
						console.warn('原生插件 Html5app-TwoDisplay 未加载');
					}
				} catch (error) {
					console.error('调用原生插件失败:', error);
				}
				// #endif
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
			addMenu() {
				uni.redirectTo({
					url: `/pages/table/index?id=${this.form.tableId}&addGoods=1`
				})
			},
			async dyyjd() {
				let {
					msg
				} = await this.beg.request({
					url: `${this.api.printOrder}/${this.form.id}`,
					method: "POST",
					data: {
						scene: 6,
						orderSn: this.form.orderSn,
						tableId: this.form.tableId
					}
				})
				this.fetchData()
				uni.$u.toast(msg)
			},
			init() {
				setTimeout(() => {
					uni.reLaunch({
						url: `/pages/home/index?current=1`
					})
				}, 800)
			},
			chooseGood(item, index) {
				this.actgood = item.id
				this.selectItem = item
			},
			handDis() {
				this.$refs['reduceRef'].open()
			},
			handGift() {
				this.$refs['giftRef'].open()
			},
			handRefund() {
				this.$refs['refundRef'].open()
			},
			checkuser() {
				// console.log('vipinfo21323')
				// console.log('vipinfo', this.$store.state.vipInfo.id)
				var userid = this.$store.state.vipInfo.id
				console.log(userid)
				this.$refs["rightOrderRef"].couponmoney = 0
				this.$refs["rightOrderRef"].vipcoupon = {}
				this.$refs["rightOrderRef"].vipcouponmoney = 0
				this.form.money =this.iniordermoney
				
				
				this.getCoupon(userid)
			},
			async changeGive(e) {
				let {
					data,
					msg
				} = await this.beg.request({
					url: `${this.api.giveOrder}/${this.form.orderSn}`,
					method: 'POST',
					data: e
				})
				uni.showToast({
					title: msg,
					icon: 'none'
				})
				if (e.type == 'discount' || e.type == 'sub') {
					this.$refs['reduceRef'].close()
				} else if (e.type == 'give') {
					this.$refs['giftRef'].close()
				} else if (e.type == 'backFood') {
					this.$refs['refundRef'].close()
				}
				this.fetchData()
			},
			async cancelDis(p) {
				let {
					data
				} = await this.beg.request({
					url: `${this.api.giveOrder}/${this.form.orderSn}`,
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
				this.fetchData()
			},
			turntable() {
				uni.navigateTo({
					url: `/pages/table/table?id=${this.form.tableId}&t=turntable`
				})
			},
			cpOut(e) {
				console.log(e)
			},
			combine() {
				uni.navigateTo({
					url: `/pages/table/combineMultiple?id=${this.form.tableId}&t=parallel`
				})
			},
			handBackTb() {
				this.$refs['backTableRef'].open()
				// this.rescind = true
			},
			async pullpack(e) {
				let {
					msg,
					code
				} = await this.beg.request({
					url: `${this.api.backTb}/${this.form.tableId}`,
					data: {
						notes: e
					},
					method: 'POST'
				})
				uni.showToast({
					title: msg,
					icon: 'none',
					duration: 2000
				})
				if (code && code == 200) {
					this.$refs['backTableRef'].close()
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/home/index?current=1'
						})
					}, 800)
				}
			},
			handClearTb() {
				this.clearTbShow = true
			},
			async pullClear() {
				let {
					msg,
					code
				} = await this.beg.request({
					url: `${this.api.inStoreComplete}/${this.form.id}`,
					method: "POST",
					data: {
						scene: this.form.scene
					}
				})
				uni.$u.toast(msg)
				if (code && code == 200) {
					this.clearTbShow = false
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/home/index?current=1'
						})
					}, 800)
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	.left {
		width: 29.2825vw;
	}

	::v-deep(.u-modal__button-group__wrapper--confirm) {
		background: #4275F4;
	}

	::v-deep(.u-modal__content__text) {
		font-size: 16px !important;
		color: #000 !important;
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.left {
			width: 400px;
		}
	}
</style>