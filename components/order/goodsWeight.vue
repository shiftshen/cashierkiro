<template>
	<view class="f27">
		<u-popup :show="show" :round="10" :closeable="true" mode="center" @close="close">
			<view class="cash">
				<view class="f-c f-y-c pt20">
					<view class="tac wei6 f24">{{$t('goods-components.weighed_goods')}}</view>
				</view>

				<view class="item-container">
					<view class="item-box">
						<text>{{$t('goods-components.weight')}}(100g)</text>
					</view>
					<view class="weight-box" style="color: red;font-weight: bold;">
						<text>{{weight}}</text>
					</view>
				</view>

				<view class="item-container">
					<view class="item-box">
						<text>{{$t('goods-components.unit_price')}}(THB/{{this.component}}g)</text>
					</view>
					<view class="total-price">
						<text>{{avgprice}}</text>
					</view>
				</view>

				<view class="item-container">
					<view class="item-box">
						<text>{{$t('goods-components.total_amount')}}(THB)</text>
					</view>
					<view class="total-price">
						<text>{{totalprice}}</text>
					</view>
				</view>
				<keybored type="digit" :point="3" v-model="weight"
					:confirmText="$t('goods-components.confirm_change_quantity')" @doneClear="doneClear"
					@doneAdd="doneAdd" @input="cInput">
				</keybored>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import keybored from '@/components/liujto-keyboard/keybored.vue';
	// #ifdef APP-PLUS
	const serialPort = uni.requireNativePlugin('Fvv-UniSerialPort')
	// #endif
	export default {
		props: {
			tx: {
				type: String,
				default: ''
			},
		},
		inject: {
			getSomeData: {
				from: 'getSomeData',
				default: () => () => ({})
			}
		},
		components: {
			keybored,
		},
		data() {
			return {
				show: false,
				weight: '',
				type: '',
				state: '',
				focus: false,
				avgprice: 0,
				totalprice: 0,
				component: 1,
				goods: {},
			}
		},
		watch: {
			weight: {
				handler(newValue) {
					this.calculateTotal(newValue);
				},
				immediate: true // 确保组件创建时就执行一次
			}
		},
		methods: {
			calculateTotal(newWeight) {
				console.log(newWeight)
				const weightNum = parseFloat(newWeight) || 0;
				const priceNum = parseFloat(this.avgprice) || 0;
				this.totalprice = (weightNum * (priceNum)).toFixed(2);
			},
			open(v) {
				this.goods = v
				console.log(v)
				this.avgprice = parseFloat(v.price) || 0
				this.component = parseFloat(v.component) || 1
				// if(v && v.num) this.value = v.num
				this.show = true
				// #ifdef APP-PLUS
				if (serialPort) {
					serialPort.setPath('/dev/ttyS4')
					serialPort.setBaudRate('9600')
					serialPort.open(res => {
						if (!res.status) {
							// uni.showToast({
							// 	title: res.msg,
							// 	duration: 2000,
							// 	icon: "none"
							// });
							return
						}
						serialPort.onMessageASCII(rec => {
							//console.log(rec);
							// 使用正则表达式删除ASCII控制字符
							let output = rec.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // 删除ASCII控制字符
							// 使用正则表达式提取可能包含负数的数字部分
							let numberString = output.match(/-?\d+\.\d+/); // 匹配可能包含负号的数字和小数点
							let letterString = output.match(/[a-zA-Z]+/); // 匹配字母部分
							this.state = letterString[0]
							if (numberString && letterString[0] == 'S') {
								let floatValue = parseFloat(numberString[0]); // 将提取出的数字部分转换为浮点类型
								//console.log(floatValue); // 输出 -0.256
								if (floatValue > 0) {
									this.weight = floatValue * 1000 / 100;
								}
							} else {
								this.weight = 0;
								this.totalprice = 0
								//console.log("未找到匹配的数字部分");
							}
						}, send => {
							//this.addMessage("send",send)
						})

					})
				}
				// #endif
			},
			hide() {
				// #ifdef APP-PLUS
				if (serialPort) {
					serialPort.close();
				}
				// #endif

				this.focus = true
				var interval = setInterval(function() {
					uni.hideKeyboard()
				}, 60);
				setTimeout(() => {
					clearInterval(interval)
				}, 2000)
			},
			close() {
				// #ifdef APP-PLUS
				if (serialPort) {
					serialPort.close();
				}
				// #endif
				this.weight = ''
				this.show = false
			},
			doneClear() {
				this.weight = ''
			},
			cInput(e) {
				this.value = e
			},
			zc() {
				this.$emit('zc')
			},
			doneAdd() {
				if (this.weight <= 0) {
					return uni.$u.toast(this.$t('goods-components.pleaseweight'))
				}

				console.log(this.component)
				var newweight = this.weight * this.component
				this.$emit('changeValue', {
					newweight: newweight,
					weight: this.weight,
					avgprice: this.avgprice,
					price: this.totalprice,
					name: this.goods.name,
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.cash {
		width: 550px;
		// height: 416px;

		::v-deep(.u-input) {
			padding: 9px !important;
		}

		::v-deep(.ljt-keyboard-body) {
			border: 1px solid #e5e5e5;

			.ljt-keyboard-number-body {
				width: 550px !important;
				height: 275px !important;
			}

			.ljt-number-btn-ac {
				// width: 100px !important;
			}

			.ljt-number-btn-confirm-2 {
				// width: 100px !important;
				background: #4275F4 !important;
			}
		}

		::v-deep(.u-input__content__field-wrapper__field) {

			font-weight: bold;
		}

		.zchy {
			background: #f0f0f0;
		}
	}

	@media (min-width: 550px) and (max-width: 900px) {
		.cash {
			::v-deep(.ljt-keyboard-body) {
				.ljt-keyboard-number-body {
					height: 150px !important;
				}
			}
		}
	}

	.item-container {
		display: flex;
		justify-content: space-between;
		/* 两端对齐 */
		align-items: center;
		/* 垂直居中 */
		padding: 10px;

		margin-bottom: 5px;
		/* 项目间距 */

	}

	.item-box {
		/* 左侧文字样式 */

		color: #333;
	}

	.total-price {
		/* 右侧数值样式 */

		color: #333;
		font-weight: bold;
		/* 可选：加粗显示 */
	}


	.weight-box {
		min-width: 150px;
		padding: 5px 10px;
		border: 1px solid #ddd;
		/* 四周边框 */
		border-radius: 4px;
		/* 圆角 */
		text-align: center;
		cursor: pointer;
		background-color: #fff;
		/* 白色背景 */
		min-height: 36px;

	}
</style>