<template>
	<u-overlay :show="show" :opacity="0.2" @click="close">
		<view class="reduce bf p15 f18 f-y-bt" @tap.stop>
			<view class="f-x-bt mb30 mt10">
				<view class="overflowlnr f-c f-g-1 wei f24">{{title}}</view>
			</view>
			<view class="p2 main">
				<view class="form f-1 f16">
					<view class="f-bt bb1 pb10 f-y-c">
						<view class="f-g-0">{{$t('print.device_type')}}<text class="cf5f">*</text></view>
						<view class="f-g-1 f-x-e">
							<view class="sw">
								<uni-data-select v-model="form.vendor"
									:localdata="type==1 ? dates : type==2 ? dates2 : dates3" :placeholder="$t('print.please_select_device_type')"
									@change="handDate" :clear="false"></uni-data-select>
							</view>
						</view>
					</view>
					<block v-if="form.vendor == 'esLink'">
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_name')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_name')" v-model="form.config.name"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.terminal_number')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_terminal_number')" v-model="form.config.ylyNum"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_secret')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_secret')" v-model="form.config.ylyKey"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">ID<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_application')" v-model="form.config.ylyId"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.application_secret')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_application_secret')" v-model="form.config.ylySecretKey"
									inputAlign='right'></u--input>
							</view>
						</view>
					</block>
					<block v-if="form.vendor == 'feie'">
						<view class="f-bt bb1 pb10 f-y-c" v-if="type==1">
							<view class="f-g-0">{{$t('print.paper_size')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<view class="f-y-c" style="height: 36px;">
									<u-radio-group v-model="form.config.printer_size" @change="groupChange">
										<u-radio name="1" :customStyle="{marginRight: '15px'}"
											labelSize="18">58mm</u-radio>
										<u-radio name="2" labelSize="18">80mm</u-radio>
									</u-radio-group>
								</view>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_name')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_name')" v-model="form.config.name"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.feie_printer_number')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_feie_printer_number')" v-model="form.config.feNum"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.feie_cloud_account')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_feie_cloud_account')" v-model="form.config.feAcc"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">UKEY<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input placeholder="UKEY" v-model="form.config.feUkey"
									inputAlign='right'></u--input>
							</view>
						</view>
					</block>
					<block v-if="form.vendor == 'spyun'">
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_name')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_name')" v-model="form.config.name"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.printer_number')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_printer_number')" v-model="form.config.spySn"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">KEY<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input placeholder="KEY" v-model="form.config.spyKey"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">ID<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_application')" v-model="form.config.spyAppid"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.application_secret')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_application_secret')" v-model="form.config.spyAppsecret"
									inputAlign='right'></u--input>
							</view>
						</view>
					</block>
					<block v-if="form.vendor == 'daqu'">
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_name')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_name')" v-model="form.config.name"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.printer_number')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_printer_number')" v-model="form.config.daquSn"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.printer_secret')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_printer_secret')" v-model="form.config.daquKey"
									inputAlign='right'></u--input>
							</view>
						</view>
					</block>
					<block v-if="form.vendor == 'jiabo'">
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_name')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_name')" v-model="form.config.name"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.printer_number')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_printer_number')" v-model="form.config.jiabodeviceID"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.merchant_code')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_merchant_code')" v-model="form.config.jiaboCode"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.application_secret')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input placeholder="$t('print.please_enter_application_secret')" v-model="form.config.jiaboKey"
									inputAlign='right'></u--input>
							</view>
						</view>
					</block>
					<block v-if="form.vendor == 'xinye'">
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_name')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_name')" v-model="form.config.name"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.printer_number')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_printer_number')" v-model="form.config.xinyeNo"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.developer')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_developer')" v-model="form.config.xinyeUser"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.developer_secret')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_developer_secret')" v-model="form.config.userKEY"
									inputAlign='right'></u--input>
							</view>
						</view>
					</block>
					<block v-if="type == 3">
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device_name')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input :placeholder="$t('print.please_enter_device_name')" v-model="form.config.name"
									inputAlign='right'></u--input>
							</view>
						</view>
						<view class="f-bt bb1 pb10 f-y-c mt10">
							<view class="f-g-0">{{$t('print.device')}}<text class="cf5f">*</text></view>
							<view class="f-g-1 f-x-e">
								<u--input placeholder="SN" v-model="form.config.sn" inputAlign='right'></u--input>
							</view>
						</view>
					</block>
				</view>
			</view>
			<view class="f-1 f-y-e">
				<u-button @click="close" class="mr20"><text class="c0">{{$t('print.cancel')}}</text></u-button>
				<u-button color="#4275F4" @click="save" :disabled="btnloading"><text class="cf">{{$t('print.confirm')}}</text></u-button>
			</view>
		</view>
	</u-overlay>
</template>

<script>
	import {
		mapState,
	} from 'vuex'
	export default {
		props: {

		},
		components: {

		},
		data() {
			return {
				show: false,
				title: this.$t('print.add_new_device'),
				type: 1,
				form: {
					vendor: "feie",
					config: {
						name: "",
						ylyNum: "",
						ylyKey: "",
						ylyId: "",
						ylySecretKey: "",

						feNum: "",
						feAcc: "",
						feUkey: "",
						printer_size: "1",

						spName: '',
						spNum: '',
						spKey: '',
						spId: '',
						spSecretKey: '',

						daquSn: '',
						daquKey: '',

						jiabodeviceID: '',
						jiaboCode: '',
						jiaboKey: '',

						xinyeNo: '',
						xinyeUser: '',
						userKEY: '',
					},
				},
				dates: [{
						value: 'esLink',
						text: 'esLink'
					},
					{
						value: 'feie',
						text: 'feie'
					},
					{
						value: 'spyun',
						text: 'spyun'
					},
					{
						value: 'daqu',
						text: 'daqu'
					},
					{
						value: 'jiabo',
						text: 'jiabo'
					},
					{
						value: 'xinye',
						text: 'xinye'
					}
				],
				dates2: [{
						value: 'feie',
						text: 'feie'
					},
					{
						value: 'xinye',
						text: 'xinye'
					},
				],
				dates3: [{
					value: 'yunlaba',
					text: 'yunlaba'
				}],
				btnloading:false,
			}
		},
		computed: {

		},
		methods: {
			async open(v, id) {
				this.type = v.value;
				this.title =
					this.type == 1 ?
					this.$t('print.hardware_binding') :
					this.type == 2 ?
					this.$t('print.cloud_label_printer'):
					this.$t('print.cloud_voice_box');
				if (this.type == 1) {
					this.form.vendor = 'esLink'
				} else if (this.type == 2) {
					this.form.vendor = 'feie'
				} else if (this.type == 3) {
					this.form.vendor = 'yunlaba'
				}
				if (id) await fetchData(id);
				this.show = true
			},
			close() {
				this.form.config = {}
				this.show = false
			},
			async fetchData() {
				let {
					data
				} = await this.beg.request({
					url: this.api.hardware
				})
				this.form = Object.assign(this.form, data);
			},
			handDate(e) {
				this.form.vendor = e
			},
			groupChange(n) {
				this.form.confg.printer_size = e
			},
			async save() {
				this.form.type = this.type;
				if(this.type == 1 && this.form.vendor =='esLink'){
					if(!this.form.config.name) return uni.$u.toast(this.$t('print.please_enter_device_name'))
					if(!this.form.config.ylyNum) return uni.$u.toast(this.$t('print.please_enter_terminal_number'))
					if(!this.form.config.ylyKey) return uni.$u.toast(this.$t('print.please_enter_device_secret'))
					if(!this.form.config.ylyId) return uni.$u.toast(this.$t('print.please_enter_application'))
					if(!this.form.config.ylySecretKey) return uni.$u.toast(this.$t('print.please_enter_application_secret'))
				}else if(this.type == 1 && this.form.vendor =='feie' || this.type == 2 && this.form.vendor =='feie'){
					if(this.type == 1 && !this.form.config.printer_size) return uni.$u.toast(this.$t('print.paper_size'))
					if(!this.form.config.name) return uni.$u.toast(this.$t('print.please_enter_device_name'))
					if(!this.form.config.feNum) return uni.$u.toast(this.$t('print.please_enter_feie_printer_number'))
					if(!this.form.config.feAcc) return uni.$u.toast(this.$t('print.please_enter_feie_cloud_account'))
					if(!this.form.config.feUkey) return uni.$u.toast('please enter UKEY')
				}else if(this.type == 1 && this.form.vendor =='spyun'){
					if(!this.form.config.name) return uni.$u.toast(this.$t('print.please_enter_device_name'))
					if(!this.form.config.spySn) return uni.$u.toast(this.$t('print.please_enter_printer_number'))
					if(!this.form.config.spyKey) return uni.$u.toast('please enter KEY')
					if(!this.form.config.spyAppid) return uni.$u.toast(this.$t('print.please_enter_application'))
					if(!this.form.config.spyAppsecret) return uni.$u.toast(this.$t('print.please_enter_application_secret'))
				}else if(this.type == 1 && this.form.vendor =='daqu'){
					if(!this.form.config.name) return uni.$u.toast(this.$t('print.please_enter_device_name'))
					if(!this.form.config.daquSn) return uni.$u.toast(this.$t('print.please_enter_printer_number'))
					if(!this.form.config.daquKey) return uni.$u.toast(this.$t('print.please_enter_printer_secret'))
				}else if(this.type == 1 && this.form.vendor =='jiabo'){
					if(!this.form.config.name) return uni.$u.toast(this.$t('print.please_enter_device_name'))
					if(!this.form.config.jiabodeviceID) return uni.$u.toast(this.$t('print.please_enter_printer_number'))
					if(!this.form.config.jiaboCode) return uni.$u.toast(this.$t('print.please_enter_merchant_code'))
					if(!this.form.config.jiaboKey) return uni.$u.toast(this.$t('print.please_enter_application'))
				}else if(this.type == 1 && this.form.vendor =='xinye' || this.type == 2 && this.form.vendor =='xinye'){
					if(!this.form.config.name) return uni.$u.toast(this.$t('print.please_enter_device_name'))
					if(!this.form.config.xinyeNo) return uni.$u.toast(this.$t('print.please_enter_printer_number'))
					if(!this.form.config.xinyeUser) return uni.$u.toast(this.$t('print.please_enter_developer'))
					if(!this.form.config.userKEY) return uni.$u.toast(this.$t('print.please_enter_developer_secret'))
				}else if(this.type == 3){
					if(!this.form.config.name) return uni.$u.toast(this.$t('print.please_enter_device_name'))
					if(!this.form.config.sn) return uni.$u.toast('please enter SN')
				}
				this.btnloading = true
				const {
					msg,
					code
				} = await this.beg.request({
					url: this.form.id ? `${this.api.hardware}/${this.form.id}` : this.api.hardware,
					method: this.form.id ? 'PUT' : 'POST',
					data: this.form
				})
				uni.$u.toast(msg)
				setTimeout(() => {
					this.btnloading = false
				}, 500)
				if (code && code == 200) {
					this.show = false
					this.$emit('fetchData')
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	::v-deep(.u-transition) {
		background-color: rgba(0, 0, 0, 0.1) !important;
	}

	::v-deep(.u-modal) {
		.u-modal__content {
			justify-content: flex-start;
		}

		.u-modal__button-group__wrapper__text {
			color: #000 !important;
		}
	}

	.reduce {
		position: absolute;
		transform: translateX(-50%);
		top: 18vh;
		left: 50vw;
		width: 43.9238vw;
		height: 65vh;
		border-radius: 10px;
	}

	.main {
		height: 58.1041vh;
		overflow: hidden;
		overflow-y: scroll;
		padding-bottom: 20px;

		.form {
			.sw {
				width: 14.1288vw;
			}

			.iw {
				width: 19.3997vw;
			}

			::v-deep(.u-input) {
				border: none !important;
			}
		}
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.reduce {
			top: 20%;
			left: 50%;
			transform: translateX(-50%);
			width: 600px;
			height: 600px;
			border-radius: 10px;
		}

		.main {
			height: 500px;

			.form {
				.sw {
					width: 193px;
				}

				.iw {
					width: 265px;
				}
			}
		}
	}
</style>