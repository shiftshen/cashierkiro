<template>
	<view class="f-y-bt h100">
		<view class="right f-1 p10">
			<view class="f-x-bt mb15">
				<view class="tabs bs6 f-bt">
					<view :class="tab==index?'istab':''" class="tab tac f16" v-for="(item,index) in tabs" :key="index"
						@click="changeTab(item,index)">{{item.name}}</view>
				</view>
				<!-- <view style="width: 250px;">
					<uni-data-select v-model="select" :localdata="selects" @change="change"></uni-data-select>
				</view> -->
			</view>
			<!-- 使用虚拟滚动优化大列表渲染 -->
			<virtual-table-list
				:tables="tabelList"
				:container-height="'calc(100vh - 200px)'"
				:table-item-height="160"
				:visible-count="8"
				:buffer-size="3"
				:selected-table-id="selectedTableId"
				:loading="tableLoading"
				@tableClick="clickItem"
				@scroll="handleTableScroll"
				@loadMore="handleLoadMore"
				ref="virtualTableList"
			/>
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
		<!-- <cash ref="codeRef" :t='2' tx="开台" @changeMoney="confirm" /> -->
		<share ref="shareRef" @save="confirm" />
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	// import cash from '@/components/pay/cash.vue';
	import share from '../../table/components/share.vue';
	import VirtualTableList from '@/components/virtual-scroll/virtual-table-list.vue';
	export default ({
		components: {
			// cash,
			share,
			VirtualTableList,
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
				//empty空桌台 order待下单 account待结账 accounted已预结 cleared待清台
				nav: [{
					title: this.$t('desk.all'),
					num: 0,
					color: 'bg0',
					state: '',
				}, {
					title: this.$t('desk.free_table'),
					num: 0,
					color: 'bf',
					state: 'free',
				}, {
					title: this.$t('desk.pending_order'),
					num: 0,
					color: 'b23',
					state: 'order',
				}, {
					title: this.$t('desk.pending_settlement'),
					num: 0,
					color: 'bb3',
					state: 'settle',
				}, {
					title: this.$t('desk.pre_settled'),
					num: 0,
					color: 'bdb',
					state: 'prepare',
				}, {
					title: this.$t('desk.pending_clearance'),
					num: 0,
					color: 'b2e',
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
				// 虚拟滚动相关
				selectedTableId: null,
				tableLoading: false,
			}
		},
		computed: {
			...mapState({
				handOver: state => state.handOver,
			}),
		},
		destroyed() {
			// 停止智能轮询
			if (this.smartPolling) {
				this.smartPolling.stopPolling('tableStatus')
				this.smartPolling.stopPolling('tableCount')
			}
		},
		methods: {
			init() {
				this.fetchData()
				this.setupSmartPolling()
			},
			
			// 设置智能轮询
			setupSmartPolling() {
				// 导入智能轮询管理器
				import('@/common/smart-polling-manager.js').then(module => {
					this.smartPolling = module.default
					
					// 创建餐桌状态轮询
					this.smartPolling.createPolling('tableStatus', async () => {
						if (this.tabs && this.tabs.length) {
							await this.getTableList()
						}
					}, {
						activeInterval: 10000,   // 活跃时10秒
						inactiveInterval: 30000, // 非活跃时30秒
						offlineInterval: 60000   // 离线时60秒
					})
					
					// 创建餐桌统计轮询
					this.smartPolling.createPolling('tableCount', async () => {
						if (this.tabs && this.tabs.length) {
							await this.getTableConunt()
						}
					}, {
						activeInterval: 15000,   // 活跃时15秒
						inactiveInterval: 45000, // 非活跃时45秒
						offlineInterval: 90000   // 离线时90秒
					})
					
					// 启动轮询
					this.smartPolling.startPolling('tableStatus')
					this.smartPolling.startPolling('tableCount')
					
					console.log('🚀 餐桌智能轮询已启动')
				})
			},
			async fetchData() {
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
					
					// 增量更新逻辑
					const newTables = list ? list : []
					const changes = this.detectTableChanges(this.tabelList, newTables)
					
					if (changes.length > 0) {
						console.log(`📊 餐桌状态更新: ${changes.length} 个桌台发生变化`)
						this.tabelList = newTables
						
						// 可选：通知其他组件桌台状态变化
						uni.$emit('tableStatusChanged', {
							changes,
							total: newTables.length,
							areaId: this.areaId
						})
					} else {
						console.log('📊 餐桌状态无变化')
					}
				} catch (error) {
					console.error('获取餐桌列表失败:', error)
					// 网络错误时保持现有数据，不清空列表
				}
			},
			
			// 检测餐桌状态变化
			detectTableChanges(oldTables, newTables) {
				const changes = []
				
				// 创建旧数据的映射
				const oldTableMap = new Map()
				oldTables.forEach(table => {
					oldTableMap.set(table.id, table)
				})
				
				// 检查新数据中的变化
				newTables.forEach(newTable => {
					const oldTable = oldTableMap.get(newTable.id)
					
					if (!oldTable) {
						// 新增的桌台
						changes.push({
							type: 'added',
							table: newTable
						})
					} else if (this.hasTableChanged(oldTable, newTable)) {
						// 状态发生变化的桌台
						changes.push({
							type: 'updated',
							table: newTable,
							oldTable: oldTable,
							changedFields: this.getChangedFields(oldTable, newTable)
						})
					}
				})
				
				// 检查被删除的桌台
				oldTables.forEach(oldTable => {
					const exists = newTables.find(t => t.id === oldTable.id)
					if (!exists) {
						changes.push({
							type: 'removed',
							table: oldTable
						})
					}
				})
				
				return changes
			},
			
			// 检查桌台是否发生变化
			hasTableChanged(oldTable, newTable) {
				const keyFields = ['state', 'people', 'minutes', 'scan', 'order']
				
				for (const field of keyFields) {
					if (field === 'order') {
						// 特殊处理订单对象
						const oldMoney = oldTable.order?.money || 0
						const newMoney = newTable.order?.money || 0
						if (oldMoney !== newMoney) return true
					} else {
						if (oldTable[field] !== newTable[field]) return true
					}
				}
				
				return false
			},
			
			// 获取变化的字段
			getChangedFields(oldTable, newTable) {
				const changes = {}
				const keyFields = ['state', 'people', 'minutes', 'scan', 'order']
				
				keyFields.forEach(field => {
					if (field === 'order') {
						const oldMoney = oldTable.order?.money || 0
						const newMoney = newTable.order?.money || 0
						if (oldMoney !== newMoney) {
							changes[field] = { old: oldMoney, new: newMoney }
						}
					} else {
						if (oldTable[field] !== newTable[field]) {
							changes[field] = { old: oldTable[field], new: newTable[field] }
						}
					}
				})
				
				return changes
			},
			async getTableConunt() {
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
			},
			changeTab(v, i) {
				this.tab = i
				this.areaId = v.id
				this.getTableList()
				this.getTableConunt()
			},
			clickItem(v, i) {
				console.log('餐桌点击:', v)
				
				// 设置选中状态
				this.selectedTableId = v.id
				
				if(!this.handOver.id){
					console.log('需要交班')
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
				// uni.reLaunch({
				// 	url: `/pages/table/index?id=${v.id}&name=${v.name}&num=${v.people}`
				// })
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
					uni.$u.toast( this.$t('desk.please_enter_correct_number_of_diners'));
				}
			},
			clear(){
				clearInterval(this.dsq)
			},
			
			// 虚拟滚动相关方法
			handleTableScroll(scrollInfo) {
				// 处理滚动事件，可以用于性能监控
				console.log('餐桌列表滚动:', scrollInfo)
			},
			
			handleLoadMore() {
				// 处理加载更多餐桌
				console.log('加载更多餐桌')
				// 这里可以实现分页加载逻辑
			},
			
			// 滚动到指定餐桌
			scrollToTable(tableId) {
				if (this.$refs.virtualTableList) {
					this.$refs.virtualTableList.scrollToTable(tableId)
				}
			},
			
			// 刷新餐桌列表
			refreshTableList() {
				if (this.$refs.virtualTableList) {
					this.$refs.virtualTableList.refresh()
				}
				this.getTableList()
			}
		}
	})
</script>

<style lang="scss" scoped>
	.right {
		position: relative;

		.tabs {
			// width: 380px;
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

		/deep/.uni-select {
			height: 40px;
			background: #fff;

			.uni-select__input-placeholder {
				font-size: 18px !important;
			}

			.uni-select__selector-item {
				font-size: 18px !important;
			}

			.uni-select__input-text {
				font-size: 18px !important;
			}
		}

		.tables {
			max-height: calc(100vh - 130px);
			padding-bottom: 70px;
			overflow-y: auto;
		}

		.table {
			display: inline-flex;
			// width: 166px;
			// height: 160px;
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