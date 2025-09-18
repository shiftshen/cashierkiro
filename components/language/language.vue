<template>
	<u-popup :show="show" mode="center" :round="10" @close="show=false" @open="show=true" :closeOnClickOverlay="true"
		:zIndex="10070">
		<view class="p15 c0 f16" style="width: 300px;">
			<view class="dfbc pb10 br-b">
				<text class="wei f12"></text>
			</view>
			<view class="dfbc bb1 p-10-0">
				<u-radio-group v-model="radioVal" placement='column' iconColor="#000" iconPlacement='right'
					@change="radioChange">
					<block>
						<u-radio :activeColor="subColor" :name="key" :labelSize="18" :iconSize="14"
							:customStyle="{marginBottom: '10rpx'}" v-for='(label, key) in languages' :key='key'>
							<view class="flex f-y-c">
								<view>{{label}}</view>
							</view>
						</u-radio>
					</block>
				</u-radio-group>
			</view>
			<view class="ljzf">
				<u-button :text="$t('modal.confirm')" :color="subColor" @click="switchLanguage">
				</u-button>
			</view>
		</view>
	</u-popup>
</template>

<script>
 
	export default {
		name: 'language',
		components: {

		},
		props: {
			visible: {
				type: Boolean,
				default: false,
			},
		},
		data() {
			return {
				loading: false,
				subColor: uni.getStorageSync('subject_color'),
				show: false,
				languages: {
					en: this.$t('modal.english'),
					zh: this.$t('modal.chinese'),
					th: this.$t('modal.thai')
				},
				radioVal: uni.getStorageSync('language') || 'en',
			}
		},
		computed: {},
		methods: {
			async open() {
				console.log('2322')
				this.$nextTick(() => {
					// 这里可以放任何需要在语言切换后重新渲染的逻辑
					this.show = true
					this.refreshPopup()
				});
			},
			refreshPopup() {
				this.languages = {
					en: this.$t('modal.english'),
					zh: this.$t('modal.chinese'),
					th: this.$t('modal.thai')
				};

			},
			close() {
				this.loading = false
				this.show = false
			},
			radioChange(e) {
				console.log(e)
				this.radioVal = e
			},
			switchLanguage() {
				if (this.radioVal) {

					this.$i18n.locale = this.radioVal;
					console.log(this.radioVal)
					this.loading = false
					this.show = false
					uni.setStorageSync('language', this.radioVal);
					uni.setLocale(this.radioVal);
					var selectvalue = this.$t('modal.english')
					if (this.radioVal === 'zh') {
						selectvalue = this.$t('modal.chinese')
						uni.setLocale('zh-Hans');
					} else if (this.radioVal === 'th') {
						selectvalue = this.$t('modal.thai')
						uni.setLocale('th');
					} else {
						uni.setLocale('en');
					}
					this.$emit('changeLanguage', selectvalue)

			 

				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	::v-deep(.u-button__text) {
		font-size: 17px !important;
		font-weight: 700 !important;
	}

	.waywh {
		width: 22px;
		height: 22px;
		border-radius: 50%;
	}
</style>