<template>
	<view class="f-bt userInfo f-1 f18">
		<view class="f-g-0 left p20 bs5 f-y-bt">
			<view>
				<view class="f-c-c">
					<image :src="form.avatar" class="icon"></image>
					<view class="vip bs6 f-c t-o-e p-0-5">{{form.vip && form.vip.name}}</view>
					<view class="mt10 wei">{{form.mobile}}</view>
				</view>
				<view class="ban bs6 p10 mt20">
					<view class="flex">
						<view class="f-g-0">{{$t('member.balance')}}：</view>
						<view class="f-g-1 flex" style="color: #4275F4;">
							<view>฿{{form.account && form.account.balance||'0.00'}}</view>
							<view class="ml5" @click="handEdit('balance')" v-if="role.includes('tiaozhengyue')"><u-icon name="edit-pen"></u-icon></view>
						</view>
					</view>
					<view class="flex mt10">
						<view class="f-g-0">{{$t('member.integral')}}：</view>
						<view class="f-g-1 flex" style="color: #4275F4;">
							<view>{{form.account && form.account.integral||0}}</view>
							<view class="ml5" @click="handEdit('integral')" v-if="role.includes('tiaozhengjifen')"><u-icon name="edit-pen"></u-icon></view>
						</view>
					</view>
					<view class="flex mt10">
						<view class="f-g-0">{{$t('member.growth_value')}}：</view>
						<view class="f-g-1" style="color: #4275F4;">{{form.account && form.account.exp || 0}}</view>
					</view>
				</view>
				<view class="mt20">
					<view class="flex">
						<view>{{$t('member.membership_card_number')}}：</view>
						<view>{{form.vipCard||'--'}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.nickname')}}：</view>
						<view>{{form.nickname}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.name')}}：</view>
						<view>{{form.realname}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.gender')}}：</view>
						<view>{{form.sexFormat}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.birthday')}}：</view>
						<view>{{form.birthday}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.registration_store')}}：</view>
						<view>{{form.registerStore && form.registerStore.name||'--'}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.registration_channel')}}：</view>
						<view>{{form.scoreFormat||'--'}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.registration_time')}}：</view>
						<view>{{form.created_at}}</view>
					</view>
					<view class="flex mt10">
						<view>{{$t('member.tags')}}：</view>
						<view>
							<text v-for="(item,index) in form.label" :key="index">
								{{item.title}}
								<block v-if="index<form.label.length-1">,</block>
							</text>
						</view>
					</view>
				</view>
			</view>
			<view class="mt20">
				<u-button color="#4275F4" :customStyle="{height:`${pc?'48px':'6.25vh'}`}" @click="cMember"><text
						class="wei6 f18">{{$t('member.switch_member')}}</text></u-button>
			</view>
		</view>
		<view class="f-g-1 right f-y-bt ml10 f18">
			<view class="f-bt f-1">
				<view class="f-g-1 f-1" style="overflow-y: scroll;">
					<view class="f22 wei">{{$t('member.select_recharge_amount')}}</view>
					<!-- <view class="f-bt mt20">
						<view class="f18">充值方式：</view>
						<u-radio-group v-model="formCz.recharge" size="22" iconSize="18" iconColor="#000"
							activeColor="#4275F4">
							<u-radio :customStyle="{marginRight: '20px'}" label="充值套餐" :name="0" />
							<u-radio label="自定义金额" :name="1" v-if="valSet.topUpPrice==1" />
						</u-radio-group>
					</view>
					<view class="f-bt mt20 f-y-c" v-if="formCz.recharge==1">
						<view class="f18 f-g-0">充值金额：</view>
						<view class="f-x-ad f-g-1 pr50">
							<u--input placeholder="请输入充值金额" border="surround" v-model="formCz.money"
								type="number"></u--input>
						</view>
					</view> -->
					<view class="mt20 flex f-w" v-if="formCz.recharge==0">
						<view :class="aIdx==index?'ismoney':''" class="m_item f-c-c mr15 f-g-0 mb15 p-0-10"
							v-for="(item,index) in dataList" :key="index" @click="change(index)">
							<view class="wei6 f24 mb10">{{item.amount}}THB</view>
							<view class="f16 c6">
								{{$t('member.accounted_for')}}{{ Number(item.rule && item.rule.balanceGive) + Number(item.amount) }}THB</view>
							<view class="posi-a scjl" v-if="aIdx==index && item.first==0">{{$t('member.first_recharge_reward')}}</view>
						</view>
					</view>
					<view class="f22 wei mt20">{{$t('member.select_payment_method')}}</view>
					<view class="ways mt20">
						<view class="way f-c-c mb50" v-for="(item,index) in ways" :key="index" @click="saveRecharge">
							<image :src="item.img" mode="aspectFit" class="waywh"></image>
							<view class="f16 mt5">{{item.title}}</view>
						</view>
					</view>
				</view>
				<view class="f-g-1 f-1 bl1 pl10 f-y-bt">
					<view>
						<view class="f22 wei">{{$t('member.bill_details')}}</view>
						<view class="f-g-1 mt20" v-if="xzrule.rule">
							<view class="f-bt">
								<view class="f-g-0">{{$t('member.recharge_amount')}}</view>
								<view class="f-g-1 f-x-e">{{formCz.recharge==0 ? xzrule.amount : formCz.money}}</view>
							</view>
							<view class="p10 mt10" style="padding-right: 0;" v-if="formCz.recharge==0">
								<view class="f-bt c6" v-if="xzrule.rule.balanceSwitch==1">
									<view class="f-g-0">{{$t('member.give_amount')}}：{{$t('member.amount')}}</view>
									<view class="f-g-1 f-x-e">฿{{xzrule.rule.balanceGive}}</view>
								</view>
								<view class="f-bt mt10 c6" v-if="xzrule.rule.integralSwitch==1">
									<view class="f-g-0">{{$t('member.give_points')}}：{{$t('member.integral')}}</view>
									<view class="f-g-1 f-x-e">{{xzrule.rule.integralGive}}</view>
								</view>
								<view class="f-bt mt10 c6" v-if="xzrule.rule.couponSwitch==1">
									<view class="f-g-0">{{$t('member.give_coupon')}}：{{$t('member.coupon_seedel')}}</view>
									<view class="f-g-1 f-x-e">
										<view>
											<view v-if="xzrule.rule.couponGive">
												<block v-for="(v,i) in xzrule.rule.couponGive" :key='i'>
													{{v.name}} <text class=""
														:style="{color:'#4275F4'}">x{{v.num}}</text>
												</block>
											</view>
										</view>
									</view>
								</view>
								<view class="f-bt mt10 c6" v-if="xzrule.rule.levelSwitch==1">
									<view class="f-g-0">{{$t('member.give_coupon')}}：{{$t('member.membership_level_upgrade_to')}}</view>
									<view class="f-g-1 f-x-e">{{xzrule.rule.levelGive}}</view>
								</view>
							</view>
							<view class="f-bt mt20">
								<view class="f-g-0">{{$t('member.payable_amount')}}</view>
								<view class="f-g-1 f-x-e wei f24" style="color: #4275F4;">฿{{formCz.recharge==0 ? xzrule.amount : formCz.money}}
								</view>
							</view>
						</view>
					</view>
					<view>
						<u-button color="#4275F4" :customStyle="{height:`${pc?'48px':'6.25vh'}`}"
							:disabled="formCz.recharge==1 && formCz.money<=0" @click="saveRecharge"><text
								class="wei6 f18">{{$t('member.confirm_recharge')}}</text></u-button>
					</view>
				</view>
			</view>
			<!-- <view class="f-g-1">
				<view class="flex f-x-e dbbu p10">
					<view class="">
						<u-button color="#4275F4" :customStyle="{height:`${pc?'42px':'5.4687vh'}`}"
							@click="addMember"><text class="wei6 f16">立即充值</text></u-button>
					</view>
				</view>
			</view> -->
		</view>
		<scan ref="scanRef" @savePay="savePay" />
		<editBalance ref="balanceRef" :form="form" @handeditBe="handeditBe" @handeditIl="handeditIl"></editBalance>
		<editIntegral ref="integralRef" :form="form" @save="handeditIl"></editIntegral>
	</view>
</template>

<script>
	import {
		mapState
	} from 'vuex'
	import scan from '@/components/pay/scan.vue';
	import editBalance from '../member/editBalances.vue'
	import editIntegral from '../member/editIntegral.vue'
	export default {
		props: {
			form: {
				type: Object,
				default: {},
			}
		},
		components: {
			scan,
			editBalance,
			editIntegral,
		},
		data() {
			return {
				formCz: {
					recharge: 0,
					money: '',
				},
				queryForm: {
					pageNo: 1,
					pageSize: 999,
				},
				dataList: [],
				aIdx: 0,
				xzrule: {},
				valSet: {},
				pay: {
					id: 0,
					money: 0,
					userId: 0,
					payType: 'authCode',
					authCode: 0,
				},
				ways: [
					// {
					// 	img: require('@/static/imgs/way4.png'),
					// 	title: '现金-人民币',
					// 	value: 'cash',
					// },
					{
						img: require('@/static/imgs/way5.png'),
						title: this.$t('member.scan_to_pay'),
						value: 'authCode',
					},
				],
			}
		},
		computed: {
			...mapState({
				role: state => state.user.roleData || [],
			}),
		},
		methods: {
			async fetchData() {
				this.getSetConfig()
				this.queryForm.userId = this.form && this.form.id || 0
				let {
					data
				} = await this.beg.request({
					url: this.api.storedValueList,
					data: this.queryForm
				})
				this.dataList = data ? data : []
				if (data.length) {
					this.aIdx = 0
					this.xzrule = data[0]
				}
			},
			async getSetConfig() {
				let {
					data
				} = await this.beg.request({
					url: this.api.config,
					data: {
						ident: 'storageVal'
					}
				})
				this.valSet = data
			},
			change(v) {
				this.aIdx = v
				if (v == -1) {
					this.focus = true
				} else {
					this.focus = false
					this.xzrule = this.dataList[v]
				}
			},
			saveRecharge() {
				if (this.formCz.recharge == 1 && !this.formCz.money) {
					return uni.showToast({
						title:this.$t('member.please_enter_recharge_amount'),
						icon: 'none',
						duration: 800
					});
				}
				if (this.formCz.money && this.formCz.money < this.valSet.minPrice) {
					return uni.showToast({
						title: `${$t('member.minimum_recharge')}${this.valSet.minPrice}THB！`,
						icon: 'none',
						duration: 800
					});
				}
				let money = this.formCz.recharge == 1 ? +this.formCz.money : this.xzrule.amount
				this.$refs['scanRef'].open(money)
			},
			cMember() {
				this.$emit('cMember')
			},
			async savePay(e) {
				if (e) {
					this.pay.authCode = e
					this.loading = true
				}
				this.pay.money = this.formCz.recharge == 1 ? +this.formCz.money : this.xzrule.amount
				this.pay.id = this.formCz.recharge == 1 ? 0 : this.dataList[this.aIdx].id
				this.pay.userId = this.form.id
				let {
					msg,
					data
				} = await this.beg.request({
					url: this.api.valueRecharge,
					method: 'POST',
					data: this.pay
				})
				this.$refs['scanRef'].close()
				this.loading = false
				uni.$u.toast(msg)
				if (data) {
					this.$emit('fetchData')
				}
			},
			handEdit(t) {
				if (t == 'balance') {
					this.$refs['balanceRef'].open('balance')
				} else if (t == 'integral') {
					this.$refs['balanceRef'].open('integral')
				}
			},
			async handeditIl(e) {
				let {
					data,
					msg,
				} = await this.beg.request({
					url: `${this.api.changeIntegral}/${this.form.id}`,
					method: 'POST',
					data: e
				})
				uni.$u.toast(msg)
				this.$refs['balanceRef'].close()
				this.$emit('fetchData')
			},
			async handeditBe(e) {
				let {
					data,
					msg,
				} = await this.beg.request({
					url: `${this.api.changeBalance}/${this.form.id}`,
					method: 'POST',
					data: e
				})
				uni.$u.toast(msg)
				this.$refs['balanceRef'].close()
				this.$emit('fetchData')
			},
		}
	}
</script>

<style lang="scss" scoped>
	.userInfo {
		height: calc(100vh - 85px);

		.left {
			border: 1px solid #e5e5e5;
			width: 330px;
			overflow-y: scroll;

			.icon {
				width: 60px;
				height: 60px;
				border-radius: 50%;
			}

			.vip {
				width: 50px;
				height: 25px;
				// background: linear-gradient(to right, #E4E7EA, #D2DCE4);
				background: #E2ECFE;
				color: #4275F4;
				flex-wrap: nowrap;
			}

			.ban {
				background: #f5f5f5;
			}
		}

		.right {
			.m_item {
				position: relative;
				width: 145px;
				height: 100px;
				border: 1px solid #ddd;
				border-radius: 3px;
			}

			.ismoney {
				color: #4275F4;
				// background: rgba(#fff9eb, .4);
				background: #E2ECFE;
				border: 1px solid #4275F4;
			}

			.scjl {
				background: #4275F4;
				position: absolute;
				top: 0;
				right: 0;
				font-size: 20rpx;
				color: #fff;
				padding: 4rpx 6rpx;
			}

			// .rCon{
			// 	height: calc(100vh - 206px);
			// 	overflow: auto;
			// }
			// .dbbu{
			// 	box-shadow: 5px 0px 10px 0px #ccc;
			// }
		}
		
		.ways {
			display: flex;
			flex-wrap: wrap;
		
			.way {
				width: 33.3%;
			}
		
			.waywh {
				width: 5.1244vw;
				height: 9.1145vh
			}
		}
	}
	@media (min-width: 500px) and (max-width: 900px) {
		.userInfo { 
			.right{
				.m_item {
					width: auto;
					height: auto;
				}
			}
		}
	}
</style>