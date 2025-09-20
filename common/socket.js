export default class Socket {
	constructor(config) {
		this.$config = config || {};
		this.sTask = null;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;
		this.reconnectInterval = 3000;
		this.isConnecting = false;
		this.init();
	}

	// 安全获取存储数据
	safeGetStorage(key) {
		try {
			return uni.getStorageSync(key) || '';
		} catch (error) {
			console.warn(`Failed to get storage ${key}:`, error);
			return '';
		}
	}

	init() {
		if (this.isConnecting) {
			console.log('Socket connection already in progress');
			return;
		}

		this.isConnecting = true;
		
		try {
			console.log('Initializing socket connection:', this.$config.url);
			
			const token = this.safeGetStorage('token');
			const uniacid = this.safeGetStorage('uniacid');
			const storeId = this.safeGetStorage('storeId');
			
			if (!token || !uniacid || !storeId) {
				console.warn('Missing authentication data for socket connection');
				this.isConnecting = false;
				return;
			}

			const socketOptions = {
				url: `${this.$config.url}?Authorization=Bearer%20${encodeURIComponent(token)}&uniacid=${encodeURIComponent(uniacid)}&storeId=${encodeURIComponent(storeId)}`,
				header: {
					'Authorization': `Bearer ${token}`,
					'uniacid': uniacid,
					'storeid': storeId,
					'apptype': 'cashier',
				},
				success: (res) => {
					console.log('Socket创建成功', res);
					this.reconnectAttempts = 0;
				},
				fail: (err) => {
					console.error('Socket创建失败：', err);
					this.isConnecting = false;
					this.handleConnectionError();
				},
			};

			this.sTask = uni.connectSocket(socketOptions);
			this._onSocketOpened();
		} catch (error) {
			console.error('Socket initialization error:', error);
			this.isConnecting = false;
			this.handleConnectionError();
		}
	}

	// 处理连接错误
	handleConnectionError() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
			setTimeout(() => {
				this._reconnect();
			}, this.reconnectInterval);
		} else {
			console.error('Max reconnection attempts reached');
		}
	}

	_reconnect() {
		this.init()
		this.onMessage(this.$cb)
	}

	onMessage(cb) {
		this.$cb = cb
		this.sTask.onMessage(res => {
			if (res.data === 'success') {
			} else {
				const ms = JSON.parse(res.data)
				if (ms.msgType !== 'login') {
					cb(ms)
				}
			}
		})
	}

	_reset() {
		clearTimeout(this._timeOutHeartBeat)
		return this
	}

	_start() {
		this._timeOutHeartBeat = setInterval(() => {
			this.sTask.send({
				data: 'heartbeat',
				success: res => {
					// console.log('心跳检测')
				},
				fail: err => {
					// console.log(err)
					this._reconnect()
				}
			})
		}, 10000)
	}

	_onSocketOpened() {
		this.sTask.onOpen(res => {
			// console.log('连接成功：', res)
			//发送登录信息
			// this.sendMsg('', 'login')
			//心跳检测
			this._reset()._start()
		})
		this.sTask.onClose(res => {
			console.log('连接失败', res)
			const code = res.code
			if (code === 1006)
				console.log('服务未开启')
		})
		this.sTask.onError(res => {
			console.log(res)
		})
	}

	sendMsg(content, type) {
		let message = this.user
		// message.msgType = type
		// message.content = content
		message = JSON.stringify(message)
		console.log('msg:', message)
		this.sTask.send({
			data: message,
			success: res => {
				// console.log('发送成功：',res)
			},
			fail: err => {
				console.log('发送失败：', err)
			}
		})
	}

	close() {
		this._reset()
		uni.closeSocket({
			success: res => {
				console.log(res)
			}
		})
	}
}
