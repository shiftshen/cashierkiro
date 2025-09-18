<template>
	<u-overlay :show="show" :opacity="0.2" @click="close">
		<view class="reduce bf f18 f-y-bt" @tap.stop>
			<view class="dfbc p20">
				<view class="wei6 f24 f-c f-g-1">{{$t('goods-components.selectPickupNumber')}}</view>
				<text class="iconfont icon-cuowu" @click="close"></text>
			</view>
			<view class="p-0-20 f-1 number-container">
				<view class="f18 number-box" :class="[
			        selectvalue==number ? 'acreson_i' : '',
			        pickNos.includes(String(number)) ? 'disabled' : ''
			      ]" v-for="number in 30" :key="number" @click="selectNumber(number)">
					<view class="f28 wei6">{{ number }}</view>
				</view>
			</view>
			<view class="p20 f-e butt">
				<view class="mr15">
					<u-button @click="close"><text
							class="f18 wei6 p10">{{$t('goods-components.cancel')}}</text></u-button>
				</view>
				<view>
					<u-button @click="saveNumber" color="#4275F4" :disabled="this.selectvalue==0"><text
							class="f18 wei6 p10">{{$t('goods-components.confirm_discount')}}</text></u-button>
				</view>
			</view>
		</view>
	</u-overlay>
</template>

<script>
	export default {
		props: {

		},
		data() {
			return {
				show: false,
				selectvalue: 0,
				pickNos: [],
			}
		},
		methods: {
			async open(t) {
				
				let {
					data
				} = await this.beg.request({
					url: this.api.takeScreenList,
				})
				//console.log(data)
				this.pickNos = data
				console.log(this.pickNos)
				this.show = true
			},


			close() {
				this.show = false
			},
			selectNumber(number) {
				if (this.pickNos.some(num => Number(num) === number)) {
					return;
				}
				this.selectvalue = number
			},
			saveNumber() {
				if (this.selectvalue == 0) {
					uni.showToast({
						title: this.$t("goods-components.selectPickupNumber"),
						icon: 'none'
					})
					return
				}

				this.$emit('saveNumber', this.selectvalue)
				this.show = false
			}
		}
	}
</script>

<style lang="scss" scoped>
	.reduce {
		position: absolute;
		transform: translateX(-50%);
		top: 10vh;
		left: 50vw;

		height: 78.125vh;
		overflow: hidden;
		// overflow-y: scroll;
		border-radius: 10px;


		.butt {
			box-shadow: 0px 2px 20px 6px #ddd;
		}


	}

	.number-container {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		/* 设置项目之间的间隔 */
		padding: 10px;
		/* 给容器添加一些内边距 */
	}

	.acreson_i {
		border: 1px solid #fff;
		background: #4275F4;
		color: #fff;
	}
	.disabled {
		border: 1px solid #fff;
		background: red;
		color: #fff;
	}

	.number-box {
		width: 7.7vw;

		border: 1px solid #e6e6e6;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 5px;
	}

	@media (min-width: 1500px) and (max-width: 3280px) {
		.reduce {
			position: absolute;
			top: 80px;
			left: 50%;
			transform: translateX(-50%);

			height: calc(100vh - 150px);
			border-radius: 10px;
		}
	}
</style>