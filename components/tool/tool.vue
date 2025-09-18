<template>
	<view class="dfa">
		<u-icon v-if="ltype==0" @click="openlanguage" size="15rpx" :name="require('@/static/imgs/language.png')"></u-icon>
		<u-icon v-else  @click="openlanguage" size="15rpx" :name="require('@/static/imgs/language2.png')"></u-icon>
		<text class="ml30 iconfont icon-lianxi2hebing_dayin" @click="handType" v-if="role.includes('yingjian')"></text>
		<!-- <text class="ml30 iconfont icon-xiaoxi" @click="handNotice"></text> -->
		<text class="ml30 iconfont icon-gerenzhongxin-xuanzhong mr10" @click="handCenter"></text>
		<typer ref="typeRef" @cT="changeTab" />
		<notice ref="noticeRef" />
		<center ref="centerRef" :version="version" />
		<language ref="language" @changeLanguage="changeLanguage"></language>
	</view>
</template>

<script>
  import language from '@/components/language/language.vue'
	import typer from '@/components/tool/typer.vue';
	import notice from '@/components/tool/notice.vue';
	import center from '@/components/tool/center.vue';
	import {
		mapState
	} from 'vuex'
	export default {
		components: {
			typer,
			notice,
			center,
			language
		},
		props: {
			ltype: {
				type: Number,
				default: 0
			},
			version:{
				type: String ,
				default: ''
			},
		},
		data() {
			return {
				name: '',
				num: '',
			}
		},
		computed: {
			...mapState({
				role: state => state.user.roleData || [],
			}),
		},
		methods: {
			openlanguage() {
				this.$refs['language'].open()
			},
			handType() {
				this.$refs['typeRef'].open()
			},
			handNotice() {
				this.$refs['noticeRef'].open()
			},
			handCenter() {
				this.$refs['centerRef'].open()
			},
			changeTab(v,i){
				this.$emit('cT',v,i)
			},
		}
	}
</script>

<style lang="scss" scoped>
	.icon-paiduijiaohao,
	.icon-lianxi2hebing_dayin,
	.icon-xiaoxi {
		font-size: 2.4890vw !important;
	}

	.icon-gerenzhongxin-xuanzhong {
		font-size: 2.1961vw !important;
	}

	@media (min-width: 1500px) and (max-width: 3280px) {

		.icon-paiduijiaohao,
		.icon-lianxi2hebing_dayin,
		.icon-xiaoxi {
			font-size: 34px !important;
		}

		.icon-gerenzhongxin-xuanzhong {
			font-size: 30px !important;
		}
	}
</style>