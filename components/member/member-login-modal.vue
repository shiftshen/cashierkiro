<template>
	<view class="member-login-modal" v-if="visible" @click.self="close">
		<view class="modal-content">
			<view class="modal-header">
				<text class="modal-title">👑 会员登录</text>
				<text class="close-btn" @click="close">×</text>
			</view>
			
			<view class="modal-body">
				<view class="scan-section">
					<view class="scan-title">扫码登录</view>
					<view class="scan-area" @click="openCamera">
						<text class="scan-icon">📷</text>
						<text class="scan-text">点击使用相机扫描会员码</text>
					</view>
				</view>
				
				<view class="divider">
					<text>或</text>
				</view>
				
				<view class="input-section">
					<view class="input-group">
						<text class="input-label">会员手机号/卡号/后四位</text>
						<input 
							class="input-field" 
							v-model="inputValue" 
							placeholder="请输入会员信息"
							@input="onInput"
						/>
					</view>
					
					<view class="number-pad">
						<view class="number-row" v-for="(row, rowIndex) in numberPad" :key="rowIndex">
							<view 
								class="number-btn" 
								v-for="(num, numIndex) in row" 
								:key="numIndex"
								@click="inputNumber(num)"
							>
								{{ num }}
							</view>
						</view>
					</view>
				</view>
				
				<view class="member-info" v-if="memberInfo">
					<view class="info-header">会员信息</view>
					<view class="info-item">
						<text class="info-label">姓名:</text>
						<text class="info-value">{{ memberInfo.name }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">手机:</text>
						<text class="info-value">{{ memberInfo.phone }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">余额:</text>
						<text class="info-value">¥{{ memberInfo.balance }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">积分:</text>
						<text class="info-value">{{ memberInfo.points }}</text>
					</view>
				</view>
			</view>
			
			<view class="modal-footer">
				<button class="btn btn-cancel" @click="close">取消</button>
				<button class="btn btn-confirm" @click="confirm" :disabled="!memberInfo">确认登录</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'MemberLoginModal',
	props: {
		visible: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			inputValue: '',
			memberInfo: null,
			numberPad: [
				['1', '2', '3'],
				['4', '5', '6'],
				['7', '8', '9'],
				['清空', '0', '删除']
			],
			mockMembers: [
				{ id: 1, phone: '13800138001', name: '张三', balance: 500.00, points: 1200 },
				{ id: 2, phone: '13800138002', name: '李四', balance: 300.50, points: 800 },
				{ id: 3, phone: '13800138003', name: '王五', balance: 1000.00, points: 2500 }
			]
		}
	},
	watch: {
		inputValue(newVal) {
			this.searchMember(newVal);
		}
	},
	methods: {
		inputNumber(num) {
			if (num === '清空') {
				this.inputValue = '';
			} else if (num === '删除') {
				this.inputValue = this.inputValue.slice(0, -1);
			} else {
				this.inputValue += num;
			}
		},
		
		onInput() {
			this.searchMember(this.inputValue);
		},
		
		searchMember(value) {
			if (!value) {
				this.memberInfo = null;
				return;
			}
			
			let member = null;
			
			// 尝试不同的搜索方式
			if (value.length === 11 && value.startsWith('1')) {
				// 手机号
				member = this.mockMembers.find(m => m.phone === value);
			} else if (value.length <= 4) {
				// 后四位或卡号
				member = this.mockMembers.find(m => m.phone.slice(-4) === value.padStart(4, '0'));
			} else if (value.length > 4) {
				// 可能是部分手机号
				member = this.mockMembers.find(m => m.phone.includes(value));
			}
			
			this.memberInfo = member;
		},
		
		openCamera() {
			// 模拟扫码
			uni.showModal({
				title: '扫码功能',
				content: '扫码功能需要在真实设备上使用。\n\n测试用会员信息:\n手机号: 13800138001\n后四位: 8001',
				showCancel: false,
				success: () => {
					// 模拟扫码成功
					this.inputValue = '8001';
				}
			});
		},
		
		confirm() {
			if (this.memberInfo) {
				this.$emit('memberLogin', this.memberInfo);
				this.close();
			}
		},
		
		close() {
			this.inputValue = '';
			this.memberInfo = null;
			this.$emit('close');
		}
	}
}
</script>

<style lang="scss" scoped>
.member-login-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.modal-content {
	background: white;
	border-radius: 12px;
	width: 90%;
	max-width: 500px;
	max-height: 80vh;
	overflow: hidden;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px;
	border-bottom: 1px solid #eee;
	
	.modal-title {
		font-size: 18px;
		font-weight: bold;
		color: #333;
	}
	
	.close-btn {
		font-size: 24px;
		color: #999;
		cursor: pointer;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.modal-body {
	padding: 20px;
	max-height: 60vh;
	overflow-y: auto;
}

.scan-section {
	text-align: center;
	margin-bottom: 20px;
	
	.scan-title {
		font-size: 16px;
		color: #333;
		margin-bottom: 15px;
	}
	
	.scan-area {
		border: 2px dashed #007aff;
		border-radius: 8px;
		padding: 30px;
		cursor: pointer;
		transition: all 0.3s;
		
		&:hover {
			background: #f0f8ff;
		}
		
		.scan-icon {
			font-size: 32px;
			display: block;
			margin-bottom: 10px;
		}
		
		.scan-text {
			color: #007aff;
			font-size: 14px;
		}
	}
}

.divider {
	text-align: center;
	margin: 20px 0;
	position: relative;
	
	&::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #eee;
	}
	
	text {
		background: white;
		padding: 0 15px;
		color: #999;
		font-size: 14px;
	}
}

.input-section {
	.input-group {
		margin-bottom: 20px;
		
		.input-label {
			display: block;
			font-size: 14px;
			color: #333;
			margin-bottom: 8px;
		}
		
		.input-field {
			width: 100%;
			padding: 12px;
			border: 1px solid #ddd;
			border-radius: 6px;
			font-size: 16px;
			box-sizing: border-box;
		}
	}
}

.number-pad {
	display: grid;
	gap: 10px;
	margin-bottom: 20px;
}

.number-row {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 10px;
}

.number-btn {
	background: #f8f9fa;
	border: 1px solid #ddd;
	border-radius: 6px;
	padding: 15px;
	text-align: center;
	font-size: 18px;
	cursor: pointer;
	transition: all 0.3s;
	
	&:hover {
		background: #e9ecef;
	}
	
	&:active {
		background: #dee2e6;
	}
}

.member-info {
	background: #f8f9fa;
	border-radius: 8px;
	padding: 15px;
	margin-bottom: 20px;
	
	.info-header {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		margin-bottom: 10px;
	}
	
	.info-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
		
		.info-label {
			color: #666;
		}
		
		.info-value {
			color: #333;
			font-weight: bold;
		}
	}
}

.modal-footer {
	display: flex;
	gap: 15px;
	padding: 20px;
	border-top: 1px solid #eee;
}

.btn {
	flex: 1;
	padding: 12px;
	border: none;
	border-radius: 6px;
	font-size: 16px;
	cursor: pointer;
	transition: all 0.3s;
	
	&.btn-cancel {
		background: #f8f9fa;
		color: #666;
		
		&:hover {
			background: #e9ecef;
		}
	}
	
	&.btn-confirm {
		background: #007aff;
		color: white;
		
		&:hover {
			background: #0056cc;
		}
		
		&:disabled {
			background: #ccc;
			cursor: not-allowed;
		}
	}
}
</style>