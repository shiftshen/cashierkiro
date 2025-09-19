<template>
	<view class="f-y-bt h100">
		<view class="right f-1 p10">
			<view class="f-x-bt mb15">
				<view class="tabs bs6 f-bt">
					<view :class="tab==index?'istab':''" class="tab tac f16" v-for="(item,index) in tabs" :key="index"
						@click="changeTab(item,index)">{{item.name}}</view>
				</view>
			</view>
			
			<!-- 餐桌列表 -->
			<view class="tables">
				<view class="table mr15 mb15 bf pt15 f-y-bt"
					:class="v.state==0?'bf c0':v.state==1?'b23 cf':v.state==2?'bb3 cf':v.state==3?'b2e cf':v.state==4?'bdb cf':'bf c0'"
					v-for="(v,i) in tabelList" :key="i" @click="clickItem(v,i)">
					<view class="f-bt">
						<view class="p-0-15 f16 mb15 t-o-e">{{v.name}}</view>
						<view class="p-0-15 sm f14 mr10" v-if="v.scan==1"
							:style="{color:v.state==2?'#FF4C54':v.state==1?'#3E9949':v.state==3?'#2979ff':v.state==4?'#DC6523':''}">
							{{$t('desk.scan_code')}}
						</view>
					</view>
					<view v-if="v.state==1" class="p-0-15 f16 mb15">{{$t('desk.pending_order')}}</view>
					<view v-else-if="v.order && v.order.money" class="p-0-15 f16 mb15">฿{{v.order.money}}</view>
					<view class="p10 f-x-bt f14 bottom" style="background: rgba(#000,.3)">
						<view class="f-y-c">
							<text class="iconfont icon-wode" style="font-size: 14px;"></text>
							{{ v.people || 0 }}/{{v.type.max}}
						</view>
						<view v-if="v.minutes" class="nowrap f-y-c">
							<text class="iconfont icon-shalou" style="font-size: 14px;"></text>
							{{v.minutes}}{{$t('desk.minutes')}}
						</view>
					</view>
				</view>
			</view>
			
			<!-- 底部统计 -->
			<view class="p-15-13 f-x-bt bs6 bf kinds">
				<view :class="kind==index?'isKind wei6':''" class="kind f16 tac" v-for="(item,index) in nav"
					:key="index" @click="changeKind(item,index)">
					<view :class="item.color"
						style="width: 12px;height:12px;border-radius: 3px;margin-right: 5px;border:1px solid #ddd">
					</view>
					<view class="">{{item.title}}</view>({{item.num}})
				</view>
			</view>
		</view>
		<share ref="shareRef" @save="confirm" />
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	import share from '../../table/components/share.vue';
	
	export default {
		components: {
			share,
		},
		data() {
			return {
				tab: 0,
				kind: 0,
				select: '',
				selects: [{
					value: 0,
					text: this.$t('desk.table_operations')
				}],
				nav: [{
					title: this.$t('desk.all'),
					num: 0,
					color: 'bg0',
					state: '',
				}, {
					title: this.$t('desk.free_table'),
					num: 0,
					color: 'bf',  // 白色 (state=0)
					state: 'free',
				}, {
					title: this.$t('desk.pending_order'),
					num: 0,
					color: 'b23', // 绿色 (state=1)
					state: 'order',
				}, {
					title: this.$t('desk.pending_settlement'),
					num: 0,
					color: 'bb3', // 红色 (state=2)
					state: 'settle',
				}, {
					title: this.$t('desk.pre_settled'),
					num: 0,
					color: 'bdb', // 灰色 (state=4)
					state: 'prepare',
				}, {
					title: this.$t('desk.pending_clearance'),
					num: 0,
					color: 'b2e', // 橙色 (state=3)
					state: 'machine',
				}],
				act: 0,
				current: 0,
				list: [],
				tabs: [],
				tabelList: [],
				dataList: [],
				areaId: '',
				state: '',
				tabelConunt: {},
				form: {},
				value: 0,
				dsq: null,
			}
		},
		computed: {
			...mapState({
				handOver: state => state.handOver,
			}),
		},
		destroyed() {
			clearInterval(this.dsq)
		},
		methods: {
			...mapMutations(["setConfig", "setHandOver", "setUser"]),
			
			init() {
				this.fetchData()
				this.dsq = setInterval(() => {
					if (this.tabs && this.tabs.length) {
						this.getTableList()
						this.getTableConunt()
					}
				}, 3000)
			},
			
			async fetchData() {
				try {
					const {
						data: {
							list
						}
					} = await this.beg.request({
						url: this.api.tableArea,
						data: {
							pageSize: 999
						}
					})
					list.unshift({
						id: "",
						name: this.$t('desk.all')
					})
					this.tabs = list ? list : []
					if (list && list.length) {
						this.areaId = list[0].id
						this.getTableList()
						this.getTableConunt()
					}
				} catch (error) {
					console.error('获取区域数据失败:', error)
				}
			},
			
			async getTableList() {
				try {
					const {
						data: {
							list
						}
					} = await this.beg.request({
						url: this.api.inTabel,
						data: {
							areaId: this.areaId,
							state: this.state,
							pageSize: 999,
						}
					})
					this.tabelList = list ? list : []
				} catch (error) {
					console.error('获取餐桌列表失败:', error)
				}
			},
			
			async getTableConunt() {
				try {
					const {
						data
					} = await this.beg.request({
						url: this.api.tCount,
						data: {
							areaId: this.areaId,
							state: this.state,
						}
					})
					this.tabelConunt = data
					this.nav[0].num = data.allCount
					this.nav[1].num = data.freeCount
					this.nav[2].num = data.orderCount
					this.nav[3].num = data.settleCount
					this.nav[4].num = data.prepareCount
					this.nav[5].num = data.machineCount
				} catch (error) {
					console.error('获取餐桌统计失败:', error)
				}
			},
			
			changeTab(v, i) {
				this.tab = i
				this.areaId = v.id
				this.getTableList()
				this.getTableConunt()
			},
			
			clickItem(v, i) {
				console.log('点击餐桌:', v)
				if (!this.handOver.id) {
					console.log('需要先开班')
					return this.$emit('openOver')
				}
				this.form = v
				if (v.state == 0 && v.diningType == 4) {
					this.value = v.type.max
					this.$refs['shareRef'].open('open', v)
				} else if (v.state == 1 || v.state == 0 && v.diningType == 5) {
					uni.reLaunch({
						url: `/pages/table/index?id=${this.form.id}`
					})
				} else if (v.state == 2 || v.state == 3 || v.state == 4) {
					uni.navigateTo({
						url: `/pages/table/orderPay?id=${this.form.orderSn}`
					})
				}
				this.clear()
			},
			
			changeKind(v, i) {
				this.kind = i
				this.state = v.state
				this.getTableList()
				this.getTableConunt()
			},
			
			async confirm(e) {
				if (+e) {
					await this.beg.request({
						url: `${this.api.inTabel}/${this.form.id}`,
						method: 'PUT',
						data: {
							people: +e
						}
					})
					this.$refs['shareRef'].close()
					uni.navigateTo({
						url: `/pages/table/index?id=${this.form.id}`
					})
					this.fetchData()
				} else {
					this.$refs['shareRef'].close()
					uni.$u.toast(this.$t('desk.please_enter_correct_number_of_diners'));
				}
			},
			
			clear() {
				clearInterval(this.dsq)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.right {
		position: relative;

		.tabs {
			height: 40px;
			line-height: 38px;
			background: #fff;
			color: #000;

			.tab {
				display: inline-block;
				width: 6.2215vw;
			}

			.istab {
				background: #4275F4;
				color: #fff;
			}
		}

		.tables {
			max-height: calc(100vh - 130px);
			padding-bottom: 70px;
			overflow-y: auto;
		}

		.table {
			display: inline-flex;
			width: 12.0058vw;
			height: 20.8333vh;
			border-radius: 10px;

			.bottom {
				background-color: rgba(#000, .1);
				border-bottom-left-radius: 10px;
				border-bottom-right-radius: 10px;
			}
		}

		.kinds {
			position: absolute;
			bottom: 20px;
			left: 50%;
			transform: translateX(-50%);
			box-shadow: 0px 0px 10px 5px rgba(#000, .1);

			.kind {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 130px;
				height: 35px;
				border-radius: 5px;
			}

			.isKind {
				background: #d5d5d9;
			}
		}

		.sm {
			background: #fff;
			padding: 2rpx 6rpx;
			border-radius: 6rpx;
			height: 24px;
			white-space: nowrap;
		}
	}

	// 底部统计颜色指示器 - 严格按照系统标准
	.bg0 { background-color: #374151 !important; } // 全部 - 黑色
	.bf { background-color: #10b981 !important; }  // 空桌 - 绿色 (state=0) - VIP01应该是这个
	.b23 { background-color: #ef4444 !important; } // 待点餐 - 红色 (state=1) - A01应该是这个
	.bb3 { background-color: #f97316 !important; } // 待结账 - 橙色 (state=2)
	.bdb { background-color: #64748b !important; } // 已预结 - 灰色 (state=4)
	.b2e { background-color: #3b82f6 !important; } // 待清台 - 蓝色 (state=3)
	
	// 餐桌状态颜色 - 根据实际显示效果
	.c0 { color: #666 !important; }     // 默认文字颜色 (用于白色背景)
	.cf { color: #fff !important; }     // 白色文字 (用于彩色背景)

	// 餐桌状态颜色 - 与底部图例完全一致
	.table {
		// 空桌 - 绿色 (state=0 或 空桌)
		&.bf {
			background-color: #10b981 !important;
			color: white !important;
		}
		
		// 待点餐 - 红色 (state=1)
		&.b23 {
			background-color: #ef4444 !important;
			color: white !important;
		}
		
		// 待结账 - 橙色 (state=2)
		&.bb3 {
			background-color: #f97316 !important;
			color: white !important;
		}
		
		// 待清台 - 灰色 (state=3)
		&.b2e {
			background-color: #64748b !important;
			color: white !important;
		}
		
		// 已预结 - 蓝色 (state=4)
		&.bdb {
			background-color: #3b82f6 !important;
			color: white !important;
		}
		
		// 默认颜色 (c0表示空桌的默认样式)
		&.c0 {
			background-color: #f8fafc !important;
			color: #374151 !important;
			border: 1px solid #d1d5db !important;
		}
		
		// 白色文字样式
		&.cf {
			color: white !important;
			
			.p-0-15, .f16, .f14 {
				color: white !important;
			}
		}
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.right {
			.tabs {
				.tab {
					width: 100px;
				}
			}

			.table {
				width: 164px;
				height: 160px;
			}
		}
	}
</style>