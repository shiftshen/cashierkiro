<template>
	<view class="f-y-bt h100">
		<view class="right f-1 p15 bf f20 f-y-bt">
			<view class="mb20 f20">{{$t('setup.receipt_setting')}}</view>
			<u--form labelPosition="left" labelAlign="right" :model="form" ref="uForm" labelWidth="210px">
				<u-form-item :label="$t('setup.discount_reduction')" prop="reduce" ref="item1">
					<u-radio-group v-model="form.reduce" size="22" iconSize="18" iconColor="#000" activeColor="#4275F4">
						<u-radio :customStyle="{marginRight: '20px'}" :label="$t('setup.enable')" :name="1" />
						<u-radio :label="$t('setup.disable')" :name="0" />
					</u-radio-group>
				</u-form-item>
				<u-form-item :label="$t('setup.points_deduction')" prop="integral" ref="item1">
					<u-radio-group v-model="form.integral" size="22" iconSize="18" iconColor="#000"
						activeColor="#4275F4">
						<u-radio :customStyle="{marginRight: '20px'}" :label="$t('setup.enable')" :name="1" />
						<u-radio :label="$t('setup.disable')" :name="0" />
					</u-radio-group>
				</u-form-item>
				<view class="mb15 f16 c9" style="padding-left: 190px;">{{$t('setup.points_deduction_requires_platform_activation')}}</view>
				<u-form-item :label="$t('setup.use_balance')" prop="balance" ref="item1">
					<u-radio-group v-model="form.balance" size="22" iconSize="18" iconColor="#000"
						activeColor="#4275F4">
						<u-radio :customStyle="{marginRight: '20px'}" :label="$t('setup.enable')" :name="1" />
						<u-radio :label="$t('setup.disable')" :name="0" />
					</u-radio-group>
				</u-form-item>
				<u-form-item v-if="form.balance==1" :label="$t('setup.balance_security_verification')" prop="verify" ref="item1">
					<u-radio-group v-model="form.verify" size="22" iconSize="18" iconColor="#000" activeColor="#4275F4">
						<u-radio :customStyle="{marginRight: '20px'}" :label="$t('setup.enable')" :name="1" />
						<u-radio :label="$t('setup.disable')" :name="0" />
					</u-radio-group>
				</u-form-item>
				<view v-if="form.balance==1" class="mb15 f16 c9" style="padding-left: 190px;">{{$t('setup.direct_balance_deduction_after_closing')}}
				</view>
				<u-form-item v-if="form.balance==1&&form.verify==1" :label="$t('setup.phone_verification')" prop="phone" ref="item1">
					<u-radio-group v-model="form.phone" size="22" iconSize="18" iconColor="#000" activeColor="#4275F4">
						<u-radio :customStyle="{marginRight: '20px'}" :label="$t('setup.enable')" :name="1" />
						<u-radio :label="$t('setup.disable')" :name="0" />
					</u-radio-group>
				</u-form-item>
				<view v-if="form.balance==1&&form.verify==1" class="mb15 f16 c9" style="padding-left: 190px;">
					{{$t('setup.use_balance_security_verification_with_sms')}}
				</view>
				<u-form-item :label="$t('setup.payment_method')" prop="way" ref="item1">
					<u-checkbox-group v-model="form.way" size="22" iconSize="18" iconColor="#000" activeColor="#4275F4">
						<u-checkbox :customStyle="{marginRight: '20px'}" :label="$t('setup.payment_code')" labelSize="20" :name="0" />
						<u-checkbox :customStyle="{marginRight: '20px'}" :label="$t('setup.cash_payment')" labelSize="20" :name="1" />
						<u-checkbox :customStyle="{marginRight: '20px'}" :label="$t('setup.personal_wechat')" labelSize="20" :name="2" />
						<u-checkbox :customStyle="{marginRight: '20px'}" :label="$t('setup.personal_alipay')" labelSize="20" :name="3" />
						<u-checkbox :label="$t('setup.card_swipe')" labelSize="20" :name="4" />
					</u-checkbox-group>
				</u-form-item>
				<view class="mb15 f16 c9" style="padding-left: 190px;">{{$t('setup.scan_member_wechat_or_alipay_for_payment')}}</view>
			</u--form>
			<view class="f-1 f-y-e">
				<u-button color="#4275F4" :text="$t('setup.save')" :customStyle="{width:'100px'}" @click="save"></u-button>
			</view>
		</view>
	</view>
</template>

<script>
	export default ({
		components: {},
		data() {
			return {
				form: {
					reduce: 0,
					integral: 0,
					balance: 1,
					verify: 1,
					phone: 1,
					way: [0, 1, 2, 3, 4]
				}
			}
		},
		methods: {
			//保存
			save() {}
		}
	})
</script>

<style lang="scss" scoped>
	.right {
		::v-deep(.u-form) {
			.u-form-item {
				margin-bottom: 10px;
			}

			.u-form-item__body__left__content__label {
				padding-right: 15px;
				font-size: 20px;
			}

			.u-radio__text {
				font-size: 20px !important;
			}
		}

		::v-deep(.u-button) {
			span {
				color: #000;
			}
		}
	}
</style>