<template>
	<view class="role-debug">
		<view class="debug-header">🔍 角色调试信息</view>
		<view class="debug-content">
			<view class="debug-item">
				<text class="label">当前标签:</text>
				<text class="value">{{ current }}</text>
			</view>
			<view class="debug-item">
				<text class="label">用户角色:</text>
				<text class="value">{{ JSON.stringify(role) }}</text>
			</view>
			<view class="debug-item">
				<text class="label">角色长度:</text>
				<text class="value">{{ role ? role.length : 0 }}</text>
			</view>
			<view class="debug-item">
				<text class="label">包含diandan:</text>
				<text class="value">{{ role && role.includes('diandan') }}</text>
			</view>
			<view class="debug-item">
				<text class="label">包含zhuotai:</text>
				<text class="value">{{ role && role.includes('zhuotai') }}</text>
			</view>
			<view class="debug-item">
				<text class="label">用户状态:</text>
				<text class="value">{{ userStatus }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { mapState } from 'vuex'

export default {
	name: 'RoleDebug',
	props: {
		current: {
			type: Number,
			default: 0
		}
	},
	computed: {
		...mapState({
			role: state => state.user?.roleData || [],
			userStatus: state => {
				return {
					hasUser: !!state.user,
					hasRoleData: !!(state.user && state.user.roleData),
					roleCount: state.user?.roleData?.length || 0
				}
			}
		})
	}
}
</script>

<style lang="scss" scoped>
.role-debug {
	background: #f0f0f0;
	padding: 15px;
	margin: 10px;
	border-radius: 8px;
	font-size: 12px;
}

.debug-header {
	font-weight: bold;
	margin-bottom: 10px;
	color: #333;
}

.debug-item {
	display: flex;
	margin-bottom: 5px;
	
	.label {
		width: 100px;
		color: #666;
	}
	
	.value {
		color: #333;
		font-weight: bold;
	}
}
</style>
</parameter>
</invoke>