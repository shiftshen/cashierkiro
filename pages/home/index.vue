<template>
	<view class="w100v h100v f-bt f20 o-h">
		<view class="left cc">
			<view class="p15 f-c">
				<image :src="storeInfo && storeInfo.applyImage || avatar" class="avatarwh"></image>
			</view>
			<view class="tab f-c-c m1010" :class="current==item.id?'acTab':''" v-for="(item,index) in tabs" :key="index"
				@click="changeTab(item,index)" v-if="role.includes(item.role) || item.role =='gengduo'">
				<text class="iconfont navIcon" :class="item.icon"></text>
				<view class="mt5 f14">{{item.name}}</view>
			</view>
		</view>
		<view class="right f-1 f-y-bt">
			<view class="top bf mb5 f-x-bt p15">
				<pTab v-if="current>=2 && current<=5 || current==15 || current==61" :current="current"
					@handTabs="handTabs"></pTab>
				<view v-else class="">{{l_title}}</view>
				<view class="dfa">
					<tool @cT="changeTab" :version="version"></tool>
					<!-- <text class="ml25 iconfont icon-paiduijiaohao" style="font-size:28px"></text>
					<text class="ml25 iconfont icon-lianxi2hebing_dayin" style="font-size:28px"
						@click="isType=true"></text>
					<text class="ml25 iconfont icon-xiaoxi" style="font-size:29px" @click="isNotice=true"></text>
					<text class="ml25 iconfont icon-gerenzhongxin-xuanzhong" style="font-size:24px"
						@click="isCenter=true"></text> -->
				</view>
			</view>
			<!-- <view v-else class="top bf f-x-bt p15 mb5">
				<view class="">
					<text class="p-0-10" :class="current==i?'cfd wei6':''" v-for="(v,i) in ['小票打印机','云喇叭','标签打印机']" :key="i"
						@click="current=i">{{v}}</text>
					<u-tabs :list="[{name: '小票打印机'}, {name: '云喇叭'}, {name: '标签打印机'}, ]" lineWidth="20" lineHeight="7"
						:lineColor="`url(${lineBg}) 100% 100%`"
						:activeStyle="{color: '#303133',fontWeight: 'bold',transform: 'scale(1.05)'}"
						:inactiveStyle="{color: '#606266',transform: 'scale(1)'}"
						itemStyle="padding-right: 1.4641vw;font-size:1.4641vw; height: 4.4270vh">
					</u-tabs>
				</view>
				<view class="">
					<text class="pl20 iconfont icon-paiduijiaohao" style="font-size:1.7569vw"></text>
					<text class="pl20 iconfont icon-lianxi2hebing_dayin" style="font-size:1.7569vw"
						@click="isType=true"></text>
					<text class="pl20 iconfont icon-xiaoxi" style="font-size:1.7569vw" @click="isNotice=true"></text>
					<text class="pl20 iconfont icon-gerenzhongxin-xuanzhong" style="font-size:1.6373vw"
						@click="isCenter=true"></text>
				</view>
			</view> -->
			<view class="f-1">
				<!-- 调试信息组件 -->
				<role-debug v-if="showDebug" :current="current" />
				
				<!-- 主要内容区域 - 修复角色检查逻辑 -->
				<billing v-if="current==0" ref="billingRef" @openOver="getOpen" />
				<desk v-if="current==1" ref="deskRef" @openOver="getOpen" />
				<callOrder v-if="current==2 && (role.includes('jiaohao') || role.length === 0)" ref="callRef" />
				<reconciliation v-if="current==3 && (role.includes('duizhang') || role.length === 0)" ref="recontionRef" />
				<order v-if="current==4 && (role.includes('dingdan') || role.length === 0)" ref="orderRef" />
				<member v-if="current==5" ref="memberRef" />
				<verification v-if="current==6 && (role.includes('diandan') || role.length === 0)" @cT="changeTab" ref="verificationRef" />
				<goods v-if="current==7 && (role.includes('goods') || role.length === 0)" ref="goodsRef" />
				<staffs v-if="current==8 && (role.includes('diandan') || role.length === 0)" />
				<refund v-if="current==9 && (role.includes('diandan') || role.length === 0)" />
				<shift v-if="current==10 && (role.includes('jiaoban') || role.length === 0)" ref="shiftRef" />
				<information v-if="current==11 && (role.includes('diandan') || role.length === 0)" />
				<setup v-if="current==12 && (role.includes('diandan') || role.length === 0)" />
				<print v-if="current==13 && (role.includes('yingjian') || role.length === 0)" ref="printRef" />
				<setGoods v-if="current==15 && (role.includes('xitong') || role.length === 0)" ref="setGoodsRef" />
				<verificationdl v-if="current==61 && (role.includes('diandan') || role.length === 0)" ref="verificationdlRef" />
				
				<!-- 如果没有匹配的组件显示，显示提示信息 -->
				<view v-if="!hasMatchingComponent" class="no-content-warning">
					<view class="warning-icon">⚠️</view>
					<view class="warning-text">当前页面内容未加载</view>
					<view class="warning-details">
						<text>当前标签: {{ current }}</text><br>
						<text>用户角色: {{ JSON.stringify(role) }}</text><br>
						<text>请检查权限设置或刷新页面</text>
					</view>
					<view class="warning-actions">
						<button @click="refreshPage" class="refresh-btn">刷新页面</button>
						<button @click="showDebug = !showDebug" class="debug-btn">
							{{ showDebug ? '隐藏' : '显示' }}调试信息
						</button>
					</view>
				</view>
			</view>
		</view>

		<typer :isType="isType" @closeType="isType=false" />
		<notice :isNotice="isNotice" @closeNotice="isNotice=false" />
		<center :isCenter="isCenter" @closeCenter="isCenter=false" />
		<openShare ref='openRef' @save="openSave" />
		
		<!-- PWA管理器 (暂时禁用) -->
		<!-- <pwa-manager /> -->
		
		<!-- 性能监控面板 (开发模式) -->
		<performance-dashboard v-if="showPerformanceDashboard" @close="showPerformanceDashboard = false" />
		<view v-if="show">
			<u-popup :show="isMore" mode="left" @close="isMore=false">
				<view class="mode f20">
					<view class="p20 f20">{{$t("home.cashier")}}1212</view>
					<view class="pl20">
						<view class="f-c-c mr10 mb10 item bf5" v-for="(item,index) in moreData.list1" :key="index"
							@click="clickItem(item,index)" v-if="role.includes(item.role)">
							<text class="iconfont mb10" :class="item.icon" style="font-size: 24px;"></text>
							<text>{{item.title}}</text>
						</view>
					</view>
					<view class="p20 f20">{{$t("home.management")}}</view>
					<view class="pl20">
						<view class="f-c-c mr10 mb10 item bf5" v-for="(item,index) in moreData.list2" :key="index"
							@click="clickItem(item,index)" v-if="role.includes(item.role)">
							<text class="iconfont mb10" :class="item.icon" style="font-size: 24px;"></text>
							<text>{{item.title}}</text>
						</view>
					</view>
					<!-- <view class="p20 f20">数据</view>
					<view class="pl20">
						<view class="f-c-c mr10 mb10 item bf5" v-for="(item,index) in moreData.list3" :key="index"
							@click="clickItem(item,index)">
							<text class="iconfont mb10" :class="item.icon" style="font-size: 24px;"></text>
							<text>{{item.title}}</text>
						</view>
					</view> -->
					<view class="p20 f20">{{$t("home.settings")}}</view>
					<view class="pl20">
						<view class="f-c-c mr10 mb10 item bf5" v-for="(item,index) in moreData.list4" :key="index"
							@click="clickItem(item,index)" v-if="role.includes(item.role)">
							<text class="iconfont mb10" :class="item.icon" style="font-size: 24px;"></text>
							<text>{{item.title}}</text>
						</view>
					</view>
				</view>
			</u-popup>

		</view>

		<!-- 自动升级 热更新 自动更新 -->
		<!-- #ifdef APP-PLUS -->
		<zy-upg @close="DataUp = false" v-if="DataUp"></zy-upg>
		<!-- #endif -->
	</view>
</template>

<script>
	// #ifdef APP-PLUS
	const plug = uni.requireNativePlugin("Html5app-TwoDisplay");

	// ZyUpg 组件将在components中异步加载
	// #endif
	import i18n from '@/locale/index.js'
	// 核心组件立即加载
	import tool from '@/components/tool/tool.vue'
	import pTab from './components/tab/pTab.vue'
	
	// 工具组件立即加载（小文件）
	import typer from '@/components/tool/typer.vue';
	import notice from '@/components/tool/notice.vue';
	import center from '@/components/tool/center.vue';
	import openShare from '@/components/other/openShare.vue'
	
	// 导入异步组件加载器 (暂时禁用)
	// import { createAsyncComponent } from '@/common/async-component-loader.js'
	
	// PWA管理器 (暂时禁用)
	// import PWAManager from '@/components/pwa/pwa-manager.vue'
	import site from '@/custom/siteroot.js';
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	export default {
		components: {
			// 核心组件立即加载
			tool,
			pTab,
			typer,
			notice,
			center,
			openShare,
			// PWAManager,
			
			// 性能监控组件 (按需加载)
			PerformanceDashboard: () => import('@/components/performance/performance-dashboard.vue'),
			
			// 调试组件
			RoleDebug: () => import('@/components/debug/role-debug.vue'),
			
			// 业务组件直接导入
			billing: () => import('./components/billing.vue'),
			desk: () => import('./components/desk.vue'),
			order: () => import('./components/order.vue'),
			member: () => import('./components/member.vue'),
			callOrder: () => import('./components/callOrder.vue'),
			reconciliation: () => import('./components/reconciliation.vue'),
			verification: () => import('./components/verification.vue'),
			goods: () => import('./components/goods.vue'),
			setGoods: () => import('./components/setGoods.vue'),
			staffs: () => import('./components/staffs.vue'),
			refund: () => import('./components/refund.vue'),
			shift: () => import('./components/shift.vue'),
			information: () => import('./components/information.vue'),
			setup: () => import('./components/setup.vue'),
			print: () => import('./components/print.vue'),
			recharge: () => import('./components/recharge.vue'),
			verificationdl: () => import('./components/verificationdl.vue'),

			// #ifdef APP-PLUS
			ZyUpg: () => import("@/components/zy-upgrade/zy-upgrade.vue"),
			// #endif
		},
		computed: {
			...mapState({
				storeInfo: state => state.storeInfo,
				role: state => {
					// 调试信息
					console.log('用户信息:', state.user);
					console.log('角色数据:', state.user?.roleData);
					
					// 如果没有角色数据，提供默认权限
					const roleData = state.user?.roleData || [];
					if (roleData.length === 0) {
						console.warn('用户角色为空，使用默认权限');
						// 提供基本权限，确保至少能看到订单页面
						return ['diandan', 'zhuotai'];
					}
					return roleData;
				},
			}),
			// 检查是否有匹配的组件
			hasMatchingComponent() {
				const componentMap = {
					0: 'diandan',
					1: 'zhuotai', 
					2: 'jiaohao',
					3: 'duizhang',
					4: 'dingdan',
					5: 'huiyuan',
					6: 'diandan',
					7: 'goods',
					8: 'diandan',
					9: 'diandan',
					10: 'jiaoban',
					11: 'diandan',
					12: 'diandan',
					13: 'yingjian',
					15: 'xitong',
					61: 'diandan'
				};
				
				const requiredRole = componentMap[this.current];
				return !requiredRole || this.role.includes(requiredRole) || this.role.length === 0;
			}
		},
		data() {
			return {
				DataUp: true,
				version: "1.3.3",
				show: false,
				isMore: false,
				// 性能监控面板显示状态
				showPerformanceDashboard: false,
				// 调试模式
				showDebug: false,
				isType: false, //打印机
				isNotice: false, //消息
				isCenter: false, //个人中心
				current: 0,
				id: 0,
				lineBg: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAOCAYAAABdC15GAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFxSURBVHgBzZNRTsJAEIb/WTW+lpiY+FZPIDew3ABP4GJ8hxsI9zBpOYHeQDwBPQI+mRiRvpLojtPdYhCorQqF/6GdbGd2vvwzBXZcNAt4oj1ANeUoAT5iqkUjbEFLHNmhD1YPEvpZ3ghkGlVDCkc94/BmHMq998I5ONiY1ZBfpKAyuOtgAc5yOEDmYEWNh32BHF91sGHZHmwW4azciN9aQwnz3SJEgOmte+R2tdLprTYoa50mvuomlLpD4Y3oQZnov6D2RzCqI93bWOHaEmAGqQUyRBlZR1WfarcD/EJ2z8DtzDGvsMCwpm8XOCfDUsVOCYhiqRxI/CTQo4UOvjzO7Pow18vfywneuUHHUUxLn55lLw5JFpZ8bEUcY8oXdOLWiHLTxvoGpLqoUmy6dBT15o/ox3znpoycAmxUsiJTbs1cmxeVKp+0zmFIS7bGWiVghC7Vwse8jFKAX9eljh4ggKLLv7uaQvG9/F59Oo2SouxPu7OTCxN/s8wAAAAASUVORK5CYII=",
				l_title: this.$t("home.order"),
				avatar: "data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjREMEQwRkY0RjgwNDExRUE5OTY2RDgxODY3NkJFODMxIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjREMEQwRkY1RjgwNDExRUE5OTY2RDgxODY3NkJFODMxIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NEQwRDBGRjJGODA0MTFFQTk5NjZEODE4Njc2QkU4MzEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NEQwRDBGRjNGODA0MTFFQTk5NjZEODE4Njc2QkU4MzEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYG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",
				tabs: [{
						id: 0,
						name: this.$t("home.order"),
						icon: 'icon-caogaoxiang',
						role: 'diandan',
					}, {
						id: 1,
						name: this.$t("home.table"),
						icon: 'icon-CJ',
						role: 'zhuotai',
					}, {
						id: 2,
						name: this.$t("home.call_number"),
						icon: 'icon-paiduijiaohao',
						role: 'jiaohao',
					},
					// {
					// 	id: 3,
					// 	name: '充值',
					// 	icon: 'icon-chongzhi'
					// },
					{
						id: 4,
						name: this.$t("home.order_management"),
						icon: 'icon-dingdan',
						role: 'dingdan',
					}, {
						id: 5,
						name: this.$t("home.member"),
						icon: 'icon-huiyuan',
						role: 'huiyuan',
					},
					{
						id: 3,
						name: this.$t("home.reconciliation"),
						icon: 'icon-chongzhi',
						role: 'duizhang',
					},
					// {
					// 	id: 6,
					// 	name: '核销',
					// 	icon: 'icon-youhuiquan'
					// },
					{
						id: -1,
						name: this.$t("home.more"),
						icon: 'icon-gengduo',
						role: 'gengduo',
					}
				],
				moreData: {
					list1: [{
							id: 0,
							icon: 'icon-caogaoxiang',
							title: this.$t("home.order"),
							role: 'diandan',
						}, {
							id: 1,
							icon: 'icon-CJ',
							title: this.$t("home.table"),
							role: 'zhuotai',
						}, {
							id: 2,
							icon: 'icon-paiduijiaohao',
							title: this.$t("home.call_number"),
							role: 'jiaohao',
						},
						{
							id: 6,
							icon: 'icon-youhuiquan',
							title: this.$t("home.verification"),
							role: 'diandan',
						},
						// {
						// 	id: 3,
						// 	icon: 'icon-chongzhi',
						// 	title: '充值'
						// },
						// {
						// 	id: 6,
						// 	icon: 'icon-12jiaobanbiao',
						// 	title: '交班'
						// },
					],
					list2: [
						// {
						// 	id: 7,
						// 	icon: 'icon-shangpinguanli',
						// 	title: this.$t("home.product_management"),
						// 	role: 'goods',
						// }, {
						// 	id: 5,
						// 	icon: 'icon-huiyuanguanli',
						// 	title: this.$t("home.member_management"),
						// 	role: 'huiyuan',
						// },
						// {
						// 	id: 8,
						// 	icon: 'icon-yuangongguanli',
						// 	title: '员工管理'
						// },
						// {
						// 	id: 4,
						// 	icon: 'icon-dingdanguanli',
						// 	title: this.$t("home.order_management"),
						// 	role: 'dingdan',
						// },
						// {
						// 	id: 9,
						// 	icon: 'icon-yuangongguanli',
						// 	title: '退款维权'
						// },
						{
							id: 10,
							icon: 'icon-12jiaobanbiao',
							title: this.$t("home.shift_records"),
							role: 'jiaoban',
						},
					],
					list3: [{
						id: 11,
						icon: 'icon-fenxi',
						title: this.$t("home.sales_data"),
						role: 'duizhang',
					}],
					list4: [
						// 	{
						// 	id: 12,
						// 	icon: 'icon-dianpu',
						// 	title: '收款设置'
						// },
						{
							id: 13,
							icon: 'icon-dayin',
							title: this.$t("home.hardware_management"),
							role: 'yingjian',
						},
						// {
						// 	id: 14,
						// 	icon: 'icon-mn_kuaidiyuan',
						// 	title: '配送员'
						// }, 
						{
							id: 15,
							icon: 'icon-mn_kuaidiyuan',
							title: this.$t("home.system_settings"),
							role: 'xitong',
						},
					],
				}
			}
		},
		onLoad(option) {
			console.log('页面加载，用户角色:', this.role);
			console.log('页面选项:', option);
			
			if (option && option.current) {
				this.current = option.current
				this.l_title = option.l_title
				this.id = option.id
				this.changeInit(+option.current)
			} else {
				console.log('1212')
				this.init()
			}
			var that = this;
			if (uni.getSystemInfoSync().platform === 'android' || uni.getSystemInfoSync().platform === 'ios') {
				// 获取版本信息
				plus.runtime.getProperty(plus.runtime.appid, function(inf) {
					console.log('当前应用版本：' + inf.version);
					that.version = inf.version
				});
			} else {
				console.log('此API仅适用于APP环境');
			}

			this.getReasonConfig()
			this.getOpen()
			// this.getProfix()
		},
		methods: {
			...mapMutations(["setConfig", "setHandOver", "setUser"]),
			// 刷新页面方法
			refreshPage() {
				location.reload();
			},
			init() {
				this.$nextTick(() => {
					// 在 DOM 更新完成后访问 $refs
					console.log('1212', this.$refs['billingRef']);
					if (this.$refs['billingRef']) {
						this.$refs['billingRef'].init();
					}
				});

				// this.$nextTick(() => {
				//  this.$refs['billingRef'].init())
				// });

			},
			changeInit(t) {
				console.log(t)
				if (t > 0) {
					// #ifdef APP-PLUS
					plug.sndMsgToHtml({
						type: 0,
						eventtype: "refreshadimage",
						uniacid: uni.getStorageSync('uniacid'),
						storeId: uni.getStorageSync('storeId'),
						token: uni.getStorageSync('token')
					});
					// #endif
				}
				switch (t) {
					case 0:
						this.$nextTick(() => this.$refs['billingRef'].init())
						break;
					case 1:
						this.$nextTick(() => this.$refs['deskRef'].init())
						break;
					case 2:
						this.$nextTick(() => this.$refs['callRef'].init())
						break;
					case 3:
						this.$nextTick(() => this.$refs['recontionRef'].init())
						break;
					case 4:
						this.$nextTick(() => this.$refs['orderRef'].init())
						break;
					case 5:
						this.$nextTick(() => this.$refs['memberRef'].init())
						break;
					case 61:
						this.$nextTick(() => this.$refs['verificationdlRef'].init())
						break;
					case 7:
						this.$nextTick(() => this.$refs['goodsRef'].init())
						break;
					case 10:
						this.$nextTick(() => this.$refs['shiftRef'].init())
						break;
					case 13:
						this.$nextTick(() => this.$refs['printRef'].init())
						break;
					case 15:
						this.$nextTick(() => this.$refs['setGoodsRef'].init())
						break;
				}
			},
			handTabs(e) {
				if (this.current == 2) {
					this.$refs['callRef'].handTabs(e)
				} else if (this.current == 3) {
					this.$refs['recontionRef'].handTabs(e)
				} else if (this.current == 4) {
					this.$refs['orderRef'].handTabs(e)
				} else if (this.current == 5) {
					this.$refs['memberRef'].handTabs(e)
				} else if (this.current == 15) {
					this.$refs['setGoodsRef'].handTabs(e)
				} else if (this.current == 61) {
					this.$refs['verificationdlRef'].handTabs(e)
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
			changeTab(item, index) {
				if (item.id == -1) {
					// this.current = item.id
					this.show = true
					this.isMore = true

					this.l_title = this.$t("home.system_settings")
					this.current = 15
					this.changeInit(15)
				} else {
					this.l_title = item.name
					this.current = item.id
					this.show = false
				}
				if (item.id >= 0) this.changeInit(item.id)
			},
			clickItem(item, index) {
				if (item.id == 16) {
					uni.navigateTo({
						url: '/pages/handover/index'
					})
				} else {
					this.l_title = item.title
					this.current = item.id
					this.changeInit(item.id)
				}
				this.show = false
			},
			async getOpen() {
				console.log(this.api.handStarting)
				let {
					data
				} = await this.beg.request({
					url: this.api.handStarting
				})
				if (data) {
					this.setHandOver(data)
				} else {
					this.setHandOver({})
					this.$nextTick(() => this.$refs['openRef'].open())
				}
			},
			async getProfix() {
				let {
					data
				} = await this.beg.request({
					url: this.api.profix
				})
				if (data) {
					this.setUser(data)
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	.top {
		height: 7.1614vh;

		::v-deep(.u-tabs__wrapper__nav__item__text) {
			// font-size: 20px !important;
		}
	}

	// ::v-deep(.u-button) {
	// 	span {
	// 		color: #000;
	// 	}
	// }


	.left {
		// width: 80px;
		width: 5.8565vw;
		height: 100vh;
		background: #ECEBF0;
		overflow: scroll;

		.tab {
			padding: 22rpx 0;
			border-radius: 6px;
			color: #7E808C;

			.navIcon {
				font-size: 1.6105vw;
			}
		}

		.acTab {
			background: #4275F4;
			color: #fff;
		}

		.avatarwh {
			width: 3.6603vw;
			height: 3.6603vw;
			border-radius: 50%;
		}
	}

	.right {
		background: #eff0f4;
		overflow: hidden;
		overflow-y: scroll;
	}

	// ::v-deep(.u-transition) {
	// 	// left: 80px !important;
	// 	left: 5.8565vw !important;
	// }

	.mode {
		max-height: 100vh;
		// width: 350px;
		width: 25.6222vw;
		overflow-y: auto;

		.item {
			display: inline-flex;
			// width: 90px;
			width: 6.5885vw;
			height: 90px;
			border-radius: 5px;
		}
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.top {
			height: 55px;

			::v-deep(.u-tabs__wrapper__nav__item__text) {
				font-size: 20px !important;
			}
		}

		.left {
			width: 80px;
			height: 100vh;

			.tab {
				padding: 11px 0;

				.navIcon {
					font-size: 22px;
				}
			}

			.avatarwh {
				width: 50px;
				height: 50px;
				border-radius: 50%;
			}
		}

		.right {
			background: #eff0f4;
			overflow: hidden;
		}

		// ::v-deep(.u-transition) {
		// 	left: 80px !important;
		// }

		.mode {
			max-height: 100vh;
			width: 350px;
			overflow-y: auto;

			.item {
				display: inline-flex;
				width: 90px;
				height: 90px;
				border-radius: 5px;
			}
		}
	}
	
	// 警告信息样式
	.no-content-warning {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		text-align: center;
		background: #fff8e1;
		border: 2px dashed #ffc107;
		border-radius: 12px;
		margin: 20px;
		
		.warning-icon {
			font-size: 48px;
			margin-bottom: 16px;
		}
		
		.warning-text {
			font-size: 18px;
			font-weight: bold;
			color: #f57c00;
			margin-bottom: 12px;
		}
		
		.warning-details {
			font-size: 14px;
			color: #666;
			line-height: 1.5;
			margin-bottom: 20px;
		}
		
		.warning-actions {
			display: flex;
			gap: 12px;
			
			button {
				padding: 8px 16px;
				border: none;
				border-radius: 6px;
				cursor: pointer;
				font-size: 14px;
				
				&.refresh-btn {
					background: #007aff;
					color: white;
					
					&:hover {
						background: #0056cc;
					}
				}
				
				&.debug-btn {
					background: #f0f0f0;
					color: #333;
					
					&:hover {
						background: #e0e0e0;
					}
				}
			}
		}
	}
</style>