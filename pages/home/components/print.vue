<template>
	<view class="f-y-bt h100 bf p10" style="background: #eff0f4">
		<view class="main f-1 f-bt f16">
			<view class="f-g-0 f-y-bt left bf">
				<view class="lwrap f-g-1 p10">
					<block>
						<view class="list mb10 p10" :class="current == -1 ? 'lcur':''" @click="clickCashierItem()">
							<view class="f-bt">
								<view class="f-g-1">CashierPrint</view>
								<view class="f-g-1 f-x-e">
									<u-switch v-model="cashierprint" @change="changeCashier()" :inactiveValue="2"
										:activeValue="1" size="20" activeColor="#4275F4"></u-switch>
								</view>
							</view>
							<view class="c6 flex f14 mt5">
								{{$t('print.device_type')}}
								<view class="flex">
									<view>CashierPrint</view>
								</view>
							</view>
							<view class="c6 flex f14 mt5">

							</view>
							<view class="c6 flex f14 mt5">
							</view>
							<view class="c6 f-bt f14 mt5 f-y-c">
								<view class="flex">
									<view>--</view>
								</view>
								<view class="f14">
								</view>
							</view>
						</view>
					</block>
					<block v-if="list&&list.length>0">
						<view class="list mb10 p10" :class="current == i ? 'lcur':''" v-for="(row,i) in list" :key="i"
							@click="clickItem(row,i)">
							<view class="f-bt">
								<view class="f-g-1">{{ row.config && row.config.name }}</view>
								<view class="f-g-1 f-x-e">
									<u-switch v-model="row.display" :inactiveValue="2" :activeValue="1"
										@change="changePri(row)" size="20" activeColor="#4275F4"></u-switch>
									<!-- <u-tag text="已开启" plain color="#4275F4" v-if="row.display==1"> </u-tag>
										<u-tag text="已关闭" plain v-if="row.display==2"></u-tag> -->
								</view>
							</view>
							<view class="c6 flex f14 mt5">
								{{$t('print.device_type')}}
								<view class="flex">
									<view v-if="row.type == 1">{{$t('print.cloud_ticket_printer')}}</view>
									<view v-if="row.type == 2">{{$t('print.cloud_label_printer')}}</view>
									<view v-if="row.type == 3">{{$t('print.cloud_voice_box')}}</view>
								</view>
							</view>
							<view class="c6 flex f14 mt5">
								{{$t('print.device')}}：
								<view class="flex">
									<view v-if="row.vendor == 'esLink'">{{ row.config && row.config.ylyNum }}</view>
									<view v-if="row.vendor == 'feie'">{{ row.config && row.config.feNum }}</view>
									<view v-if="row.vendor == 'spyun'">
										{{ row.config && row.config.spySn }}
									</view>
									<view v-if="row.vendor == 'daqu'">
										{{ row.config && row.config.daquSn }}
									</view>
									<view v-if="row.vendor == 'jiabo'">
										{{ row.config && row.config.jiabodeviceID }}
									</view>
									<view v-if="row.vendor == 'xinye'">
										{{ row.config && row.config.xinyeNo }}
									</view>
									<view v-if="row.vendor == 'yunlaba'">
										{{ row.config && row.config.sn }}
									</view>
								</view>
							</view>
							<view class="c6 flex f14 mt5">
								{{$t('print.device_purpose')}}：
								<view v-if="row.rule && row.rule.scene.includes(1)">
									{{$t('print.delivery')}}/{{$t('print.in_store')}}
								</view>
							</view>
							<view class="c6 f-bt f14 mt5 f-y-c">
								<view class="flex">
									<view class="flex">
										<view v-if="row.vendor == 'esLink'">{{$t('print.easy_cloud')}}</view>
										<view v-if="row.vendor == 'spyun'">{{$t('print.shangpeng_cloud')}}</view>
										<view v-if="row.vendor == 'daqu'">{{$t('print.daqv_cloud')}}</view>
										<view v-if="row.vendor == 'jiabo'">{{$t('print.jiabo_cloud')}}</view>
										<view v-if="row.vendor == 'xinye' && row.type == 1">{{$t('print.xinye_ticket')}}
										</view>
										<view v-if="row.vendor == 'xinye' && row.type == 2">{{$t('print.xinye_label')}}
										</view>
										<view v-if="row.vendor == 'feie' && row.type == 1">{{$t('print.feie')}}</view>
										<view v-if="row.vendor == 'feie' && row.type == 2">{{$t('print.feie_label')}}
										</view>
										<view v-if="row.vendor == 'yunlaba' && row.type == 3">
											{{$t('print.cloud_speaker')}}
										</view>
										/
									</view>
									<view v-if="row.vendor == 'feie' && row.config && row.config.printer_size == 1">58mm
									</view>
									<view v-else-if="row.vendor == 'feie' && row.config &&row.config.printer_size == 2">
										80mm
									</view>
									<view v-else>--</view>
								</view>
								<view class="f14">
									<image v-if="row.type==1" src="@/static/imgs/rec3.jpg" mode="widthFix" class="icon">
									</image>
									<image v-if="row.type==2" src="@/static/imgs/rec1.jpg" mode="widthFix" class="icon">
									</image>
									<image v-if="row.type==3" src="@/static/imgs/rec2.jpg" mode="widthFix" class="icon">
									</image>
								</view>
							</view>
						</view>
					</block>
					<view class="h100" v-else>
						<empty :txt="$t('print.no_printer')" t="dd" />
					</view>
				</view>
				<view class="bf p-10-0 l_bot f-g-0">
					<view class="bf p10 mb10">
						<u-button color="#4275F4" @click="device">{{$t('print.add_device')}}</u-button>
					</view>
					<uni-pagination :prevText="$t('common.prevText')" :nextText="$t('common.nextText')"
						:current="queryForm.pageNo" :total="total" @change="change" showIcon />
				</view>
			</view>
			<view class="f-bt f-g-1 right ml10 bf">

			</view>
		</view>
		<addDevice ref="addDeviceRef" @addDevice="addDevice" />
		<addDeviceInfo ref="addDeviceInfoRef" @fetchData="fetchData" />
	</view>
</template>

<script>
	import addDevice from './print/addDevice.vue';
	import addDeviceInfo from './print/addDeviceInfo.vue';
	import empty from '@/components/other/empty.vue';
	export default ({
		components: {
			addDevice,
			empty,
			addDeviceInfo,
		},
		data() {
			return {
				queryForm: {
					pageNo: 1,
					pageSize: 10,
				},
				total: 0,
				cashierprint: uni.getStorageSync('cashierprint') || 1,
				show: false,
				showDetail: false,
				current: -1,
				isItem: 0,
				itemForm: {},
				form: {},
				list: [],
				tabs: [{
					name: this.$t('print.ticket_printer')
				}, {
					name: this.$t('print.cloud_speaker')
				}, {
					name: this.$t('print.label_printer')
				}, ]
			}
		},
		methods: {
			init() {
				this.fetchData()
			},
			async fetchData() {
				let {
					data: {
						list,
						pageNo,
						pageSize,
						total
					},
				} = await this.beg.request({
					url: this.api.hardware,
					data: this.queryForm,
				})
				this.list = list ? list : []
				this.total = total
			},
			change(e) {
				this.queryForm.pageNo = e.current;
				this.fetchData()
			},
			clickItem(item, index) {
				this.isItem = item.id
				this.current = index
				// if (this.tabval == 'selfRef' || this.tabval == 'sideRef' || this.tabval == 'inStoreRef') {
				// 	this.orderDl(this.tabval == 'selfRef' || this.tabval == 'sideRef' ? item.id : item.orderSn)
				// } else {
				// 	this.itemForm = item
				// }
			},
			clickCashierItem() {
				this.current = -1
			},
			changeCashier(e) {
				//console.log(this.cashierprint)
				this.$store.commit('setCashierPrint', this.cashierprint)
				// #ifdef APP-PLUS
				if (this.cashierprint != 1) {
					const cashierPrint = uni.requireNativePlugin('CashierPrint')
					if (cashierPrint != null) {
						cashierPrint.closePort({}, res => {
							console.log(res)
						});
					}
				}
				// #endif

			},
			async changePri(v) {
				let {
					msg
				} = await this.beg.request({
					url: this.api.changePrint,
					method: "POST",
					data: {
						id: v.id
					}
				})
				this.fetchData()
				uni.$u.toast(msg)
			},
			clickTab(index) {
				console.log(index);
				this.show = true
				if (index == 0) {
					this.form = {
						...this.itemForm
					}
					this.showDetail = true
				}
			},
			device() {
				this.$refs['addDeviceRef'].open()
			},
			addDevice(v) {
				// this.$refs['addDeviceRef'].close()
				this.$refs['addDeviceInfoRef'].open(v)
			},
		}
	})
</script>

<style lang="scss" scoped>
	.main {
		.left {
			width: 29.2825vw;
			border-radius: 8px;

			.lwrap {
				height: 74.5098vh;
				overflow: hidden;
				overflow-y: scroll;

				.list {
					background: #fff;
					border: 2px solid #EBEAF0;
					border-left: 6px solid #4275F4;
					// padding: 2px 2px 2px 6px;
					// background: #EBEAF0;
					border-radius: 10px;
					position: relative;
					overflow: hidden;

					.wab {
						border-radius: 10px;
						// background: #EBEAF0;
					}

					.icon {
						width: 30px;
						height: 30px;
						border-radius: 50%;
					}
				}

				.lcur {
					// background: #4275F4;
					background: #E3EDFE;
					border: 2px solid #4275F4;
					border-left: 6px solid #4275F4;
					border-color: #4275F4;
				}

				// .lcurWab{
				// 	background: #E3EDFE;
				// }
				.lline {
					position: absolute;
					height: 100%;
					top: 0;
					left: 0;
					width: 4px;
					background: #4275F4;
				}
			}
		}

		.right {
			border-radius: 8px;

			.goods {
				width: 25.6222vw;
				height: 80.0312vh;
				overflow: hidden;
				overflow-y: scroll;
				border: 1px solid #e6e6e6;
			}

			.order {
				height: 71.6145vh;
				overflow: hidden;
				overflow-y: scroll;
				border: 1px solid #e6e6e6;

				.fg0 {
					width: 5.8565vw;
				}

				.tit {
					// background: #e6e6e6;
				}
			}
		}

		.bbae6 {
			border-bottom: 2px dotted #e6e6e6;
		}

		.line {
			width: 2px;
			height: 18px;
			margin: 0 10px;
			background: #e6e6e6;
		}

	}

	.l_bot {
		// border-top: 1px solid #ddd;
		white-space: nowrap;
		overflow: hidden;
		overflow-x: scroll;
	}

	/deep/.uni-pagination {
		.page--active {
			background: #4275F4 !important;
			color: #fff !important;
		}
	}

	.btn {
		box-shadow: 0px 0px 10px 0px #e6e6e6;
	}
</style>