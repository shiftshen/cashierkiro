/**
 * Socket 适配器
 * 提供与旧 Socket 类兼容的接口，内部使用优化的 WebSocketManager
 */

import webSocketManager from './websocket-manager.js'

export default class Socket {
  constructor(config) {
    this.$config = config
    this.connectionId = `socket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.$cb = null
    this.sTask = null
    this._timeOutHeartBeat = null
    
    this.init()
  }

  async init() {
    try {
      console.log('🔌 初始化 Socket 连接:', this.$config.url)
      
      // 使用 WebSocketManager 创建连接
      const connection = await webSocketManager.createConnection(this.connectionId, {
        url: this.$config.url,
        autoReconnect: true,
        heartbeatInterval: 10000, // 保持与原来的10秒心跳一致
        maxReconnectAttempts: 10
      })
      
      this.sTask = {
        // 兼容原有接口
        send: (options) => {
          return webSocketManager.sendMessage(this.connectionId, options.data, {
            queueIfDisconnected: true
          }).then(() => {
            options.success && options.success()
          }).catch((error) => {
            options.fail && options.fail(error)
          })
        },
        
        onOpen: (callback) => {
          // WebSocketManager 已经处理了连接打开
          // 这里立即调用回调，因为连接已经建立
          setTimeout(callback, 0)
        },
        
        onClose: (callback) => {
          webSocketManager.onMessage(this.connectionId, {
            close: callback
          })
        },
        
        onError: (callback) => {
          webSocketManager.onMessage(this.connectionId, {
            error: callback
          })
        },
        
        onMessage: (callback) => {
          webSocketManager.onMessage(this.connectionId, {
            message: (data) => {
              callback({ data })
            }
          })
        }
      }
      
      console.log('✅ Socket 连接创建成功')
      
    } catch (error) {
      console.error('❌ Socket 连接创建失败:', error)
      
      // 降级到原始实现
      this.initFallback()
    }
  }

  // 降级实现
  initFallback() {
    console.log('🔄 使用降级 Socket 实现')
    
    let o = {
      url: `${this.$config.url}?Authorization=${`Bearer ${uni.getStorageSync('token')}`}&uniacid=${uni.getStorageSync('uniacid')}&storeId=${uni.getStorageSync('storeId')}`,
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
        uniacid: uni.getStorageSync('uniacid'),
        storeid: uni.getStorageSync('storeId'),
        apptype: 'cashier',
      },
      success: (res) => {
        console.log('创建socket成功', res)
      },
      fail: (err) => {
        console.log('创建socket失败：', err)
      },
    }
    
    this.sTask = uni.connectSocket(o)
    this._onSocketOpened()
  }

  _reconnect() {
    if (webSocketManager.getConnectionState(this.connectionId) !== 'not_found') {
      // 使用 WebSocketManager 的重连机制
      console.log('🔄 使用 WebSocketManager 重连')
      return
    }
    
    // 降级重连
    this.init()
    this.onMessage(this.$cb)
  }

  onMessage(cb) {
    this.$cb = cb
    
    if (webSocketManager.getConnectionState(this.connectionId) !== 'not_found') {
      // 使用 WebSocketManager 的消息处理
      webSocketManager.onMessage(this.connectionId, {
        message: (data) => {
          if (data === 'success') {
            return
          }
          
          try {
            const ms = typeof data === 'string' ? JSON.parse(data) : data
            if (ms.msgType !== 'login') {
              cb(ms)
            }
          } catch (error) {
            // 如果不是 JSON，直接传递
            cb(data)
          }
        }
      })
    } else {
      // 降级消息处理
      this.sTask.onMessage(res => {
        if (res.data === 'success') {
          return
        }
        
        try {
          const ms = JSON.parse(res.data)
          if (ms.msgType !== 'login') {
            cb(ms)
          }
        } catch (error) {
          cb(res.data)
        }
      })
    }
  }

  _reset() {
    clearTimeout(this._timeOutHeartBeat)
    return this
  }

  _start() {
    // WebSocketManager 已经处理心跳，这里保持兼容性
    if (webSocketManager.getConnectionState(this.connectionId) !== 'not_found') {
      return this
    }
    
    // 降级心跳实现
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
    
    return this
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
      if (code === 1006) {
        console.log('服务未开启')
      }
    })
    
    this.sTask.onError(res => {
      console.log(res)
    })
  }

  sendMsg(content, type) {
    let message = this.user || {}
    // message.msgType = type
    // message.content = content
    message = JSON.stringify(message)
    console.log('msg:', message)
    
    if (webSocketManager.getConnectionState(this.connectionId) !== 'not_found') {
      // 使用 WebSocketManager 发送
      webSocketManager.sendMessage(this.connectionId, message)
        .then(() => {
          console.log('发送成功')
        })
        .catch((error) => {
          console.log('发送失败：', error)
        })
    } else {
      // 降级发送
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
  }

  close() {
    this._reset()
    
    if (webSocketManager.getConnectionState(this.connectionId) !== 'not_found') {
      // 使用 WebSocketManager 关闭
      webSocketManager.closeConnection(this.connectionId)
    } else {
      // 降级关闭
      uni.closeSocket({
        success: res => {
          console.log(res)
        }
      })
    }
  }

  // 新增方法：获取连接统计
  getStats() {
    return webSocketManager.getConnectionStats(this.connectionId)
  }

  // 新增方法：获取连接状态
  getState() {
    return webSocketManager.getConnectionState(this.connectionId)
  }

  // 新增方法：手动重连
  reconnect() {
    if (webSocketManager.getConnectionState(this.connectionId) !== 'not_found') {
      return webSocketManager.reconnect(this.connectionId)
    } else {
      return this._reconnect()
    }
  }
}