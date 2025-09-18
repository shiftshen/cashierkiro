<template>
	<view class="right f-1 p15 bf f16 f-y-bt">
		<uni-table ref="table" border stripe :emptyText="$t('setgoods.no_details')">
			<uni-tr>
				<uni-th align="center">{{$t('setgoods.reminder_scenario')}}</uni-th>
				<uni-th align="center">{{$t('setgoods.number_of_prompts')}}</uni-th>
				<uni-th align="center">{{$t('setgoods.prompt_voice')}}</uni-th>
				<uni-th align="center">{{$t('setgoods.operation')}}</uni-th>
			</uni-tr>
			<uni-tr v-for="(row, i) in tableData" :key="i">
				<uni-td>
					{{row.name}}
				</uni-td>
				<uni-td>
					<view>
						<u-radio-group v-model="row.num" size="18" iconSize="18" iconColor="#fff" activeColor="#4275F4"
							@change="changeState(row)">
							<u-radio :customStyle="{marginRight: '30px'}" label="1" name="1" />
							<u-radio :customStyle="{marginRight: '30px'}" label="3" name="3" />
							<u-radio :customStyle="{marginRight: '30px'}" :label="$t('setgoods.loop_prompt')" name="999" />
							<u-radio :label="$t('setgoods.no_prompt')" name="0" />
						</u-radio-group>
					</view>
				</uni-td>
				<uni-td align="center">{{$t('setgoods.classic_female_version')}}</uni-td>
				<uni-td align="center">
					<text class="cf06" style="color: #4275F4;" @click.stop="audition(row)">{{$t('setgoods.audition')}}</text>
				</uni-td>
			</uni-tr>
		</uni-table>
		<audio ref="audioRef"></audio>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations,
	} from 'vuex'
	export default {
		components: {},
		data() {
			return {
				tableData: [],
				audioRef: null,
			}
		},
		methods: {
			...mapMutations(["setConfig"]),

			async fetchData() {
				let {
					data
				} = await this.beg.request({
					url: this.api.voiceMessage
				})
				this.tableData = data ? data : [],
					this.audios = uni.createInnerAudioContext();
			},
			async changeState(e) {
				let {
					msg
				} = await this.beg.request({
					url: `${this.api.voiceMessage}/${e.id}`,
					method: 'PUT',
					data: {
						num: e.num,
						voicType: e.voicType,
						url: e.voiceUrl
					}
				})
				uni.$u.toast(msg)
				this.fetchData()
			},
			audition(row) {
				this.audios.src = row.voiceUrl
				this.audios.onCanplay(a => {
					this.audios.play()
				});
			},
		}
	}
</script>

<style lang="scss" scoped>
	/deep/.uni-table-tr {
	  height: 50px;
	}
</style>