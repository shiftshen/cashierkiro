<template>
	<view class="">
		<u-popup :show="shows" :round="10" mode="center">
			<view class="cash">
				<view class="f-c f-y-c pt20">
					<view class="tac wei6 f24">{{$t("user-components.member_registration")}}</view>
				</view>
				<view class="p20">
					<u--form class="mb10" ref="addRef" :model="addForm" :labelWidth="100" :rules="addRules"
						:labelStyle="{fontSize:`${pc?'18px':'1.3177vw'}`,textAlign:'right'}">
						<u-form-item label="" prop="name" ref="item1">
							<view class="f-bt f-y-c">
								<view class="" style="width:230px">
									<u--input v-model="addForm.realname" border="surround" :placeholder="$t('user-components.please_enter_name')"
										:customStyle="{height: '42px'}"></u--input>
								</view>
								<view class="flex">
									<view v-for="(v, i) in sexList" :key="i" class="sexv f-c f20 ml10"
										:class="svcurr==v.value ? 'sv' :''" @click="handVal(v)">{{v.text}}</view>
									<!-- <u-radio-group v-model="addForm.sex" placement="row" size="20" activeColor="#4275F4"
										iconColor="#fff" iconSize="18">
										<u-radio :customStyle="{marginRight: '15px'}" v-for="(item, index) in sexList"
											:key="index" :label="item.text" :name="item.value" labelSize="18">
										</u-radio>
									</u-radio-group> -->
								</view>
							</view>
						</u-form-item>
						<u-form-item label="" prop="mobile" ref="item1">
							<view class="" style="width:400px">
								<u--input v-model="addForm.mobile" border="surround" type="number"
									:placeholder="$t('user-components.please_enter_mobile_number')" :customStyle="{height: '42px'}"></u--input>
							</view>
						</u-form-item>
						<!-- <u-form-item label="" prop="sex" ref="item1">
							<view class="" style="width:230px">
								<u-radio-group v-model="addForm.sex" placement="row" size="20" activeColor="#4275F4"
									iconColor="#fff" iconSize="18">
									<u-radio :customStyle="{marginRight: '15px'}" v-for="(item, index) in sexList"
										:key="index" :label="item.text" :name="item.value" labelSize="18">
									</u-radio>
								</u-radio-group>
							</view>
						</u-form-item> -->
						<u-form-item label="" prop="birthday" ref="item1">
							<view class="f-1" style="width:400px" @click="show = true">
								<u--input v-model="addForm.birthday" border="surround" disabled="disabled"
									:placeholder="$t('user-components.please_select_birthday')" :customStyle="{height: '42px'}"></u--input>
							</view>
							<!-- <view class="f18 c6" style="width:230px" @click="show = true">
								{{addForm.birthday || '请选择生日'}}
							</view> -->
						</u-form-item>
					</u--form>
					<view class="f-1 f-y-e mt30">
						<u-button @click="close" class="mr20 qx">{{$t('user-components.cancel')}}</u-button>
						<u-button color="#4275F4" @click="sureAdd"><text class="cf">{{$t('user-components.confirm_registration')}}</text></u-button>
					</view>
				</view>
			</view>
			<u-datetime-picker :show="show" v-model="value1" mode="date" @confirm="maskClick" @cancel="show = false"
				confirmColor="#4275F4" :minDate="23592663"></u-datetime-picker>
		</u-popup>
	</view>
</template>

<script>
	import {
		sj,
	} from "@/common/handutil.js"
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	export default {
		props: {
			isVip: {
				type: Boolean,
				default: false
			},
		},
		data() {
			return {
				shows: false,
				sexList: [{
					value: 1,
					text: this.$t('user-components.male')
				}, {
					value: 2,
					text: this.$t('user-components.female')
				}],
				svcurr: 1,
				addRules: {
					mobile: [{
						required: true,
						message:this.$t('user-components.mobile_number_cannot_be_empty'),
						trigger: ['blur', 'change'],
					}, {
						validator: (rule, value, callback) => {
							if (value) {
								return this.$u.test.mobile(value);
							} else {
								return true
							}
						},
						message: this.$t('user-components.incorrect_mobile_number'),
						trigger: ['blur'],
					}],
				},
				addForm: {
					mobile: "",
					realname: "",
					sex: 1,
					birthday: '',
				},
				show: false,
				value1: Number(new Date()),
				t:'',
			}
		},
		methods: {
			...mapMutations(["setUserVip"]),
			open(t) {
				if(t) this.t = t
				this.shows = true
			},
			maskClick(e) {
				let date = e.value
				this.addForm.birthday = this.timestampToTime(date)
				this.show = false
			},
			handVal(v) {
				this.svcurr = v.value
				this.addForm.sex = v.value
			},
			timestampToTime(timestamp) {
				var date = new Date(timestamp);
				var Y = date.getFullYear() + "-";
				var M =
					(date.getMonth() + 1 < 10 ?
						"0" + (date.getMonth() + 1) :
						date.getMonth() + 1) + "-";
				var D = (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " ";
				var h = date.getHours() + ":";
				var m = date.getMinutes() + ":";
				var s = date.getSeconds();
				return Y + M + D;
			},
			sureAdd() {
				this.$refs.addRef.validate().then(async res => {
					let that = this
					this.addForm.nickname = `用户_${sj()}`;
					let {
						msg,
						data,
					} = await this.beg.request({
						url: this.api.cMember,
						method: 'POST',
						data: this.addForm
					})
					if(data && this.t=='addMember'){
						this.setUserVip(data)
					}
					that.$emit('fetchData')
					uni.$u.toast(msg)
					this.showState = false
					this.close()
				})
			},
			close() {
				this.shows = false
				this.addForm = {}

			},
		}
	}
</script>

<style lang="scss" scoped>
	.cash {
		width: 450px;

		.sexv {
			width: 75px;
			height: 42px;
			background: #EDEDED;
			color: #000;
			border-radius: 5px;
		}

		.sv {
			background: #4275F4;
			color: #fff;
		}
	}
</style>