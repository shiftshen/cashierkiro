// 称重管理器
// 用于处理电子秤相关功能

export default class WeightManager {
  constructor() {
    this.isConnected = false;
    this.currentWeight = 0;
    this.callbacks = [];
    this.config = {
      minWeight: 0.001, // 最小重量 (kg)
      maxWeight: 50,    // 最大重量 (kg)
      precision: 3,     // 精度 (小数点后位数)
      timeout: 5000     // 超时时间 (ms)
    };
  }

  // 初始化称重设备
  async init(config = {}) {
    try {
      this.config = { ...this.config, ...config };
      
      // #ifdef APP-PLUS
      // 在APP环境下初始化串口连接
      const serialPort = uni.requireNativePlugin('Fvv-UniSerialPort');
      if (serialPort) {
        await this.initSerialPort(serialPort);
      }
      // #endif
      
      // #ifdef H5
      // 在H5环境下使用模拟数据
      this.initMockWeight();
      // #endif
      
      this.isConnected = true;
      console.log('Weight manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Weight manager initialization failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // 初始化串口连接 (APP环境)
  async initSerialPort(serialPort) {
    return new Promise((resolve, reject) => {
      serialPort.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      }, (result) => {
        if (result.success) {
          this.startWeightReading(serialPort);
          resolve(result);
        } else {
          reject(new Error('Failed to open serial port'));
        }
      });
    });
  }

  // 开始读取重量数据
  startWeightReading(serialPort) {
    serialPort.onReceive((data) => {
      try {
        const weight = this.parseWeightData(data);
        this.updateWeight(weight);
      } catch (error) {
        console.error('Failed to parse weight data:', error);
      }
    });
  }

  // 解析重量数据
  parseWeightData(data) {
    // 这里需要根据实际的电子秤协议来解析数据
    // 示例：假设数据格式为 "WEIGHT:1.234KG"
    const weightMatch = data.match(/WEIGHT:([\d.]+)KG/);
    if (weightMatch) {
      return parseFloat(weightMatch[1]);
    }
    return 0;
  }

  // 初始化模拟重量 (H5环境)
  initMockWeight() {
    // 在H5环境下使用模拟数据进行测试
    setInterval(() => {
      const mockWeight = (Math.random() * 2).toFixed(3);
      this.updateWeight(parseFloat(mockWeight));
    }, 1000);
  }

  // 更新重量
  updateWeight(weight) {
    if (weight >= this.config.minWeight && weight <= this.config.maxWeight) {
      this.currentWeight = parseFloat(weight.toFixed(this.config.precision));
      this.notifyCallbacks(this.currentWeight);
    }
  }

  // 获取当前重量
  getCurrentWeight() {
    return this.currentWeight;
  }

  // 获取稳定重量
  async getStableWeight(timeout = this.config.timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let lastWeight = 0;
      let stableCount = 0;
      const requiredStableCount = 5; // 需要连续5次相同读数才认为稳定

      const checkStability = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Weight reading timeout'));
          return;
        }

        if (Math.abs(this.currentWeight - lastWeight) < 0.001) {
          stableCount++;
          if (stableCount >= requiredStableCount) {
            resolve(this.currentWeight);
            return;
          }
        } else {
          stableCount = 0;
        }

        lastWeight = this.currentWeight;
        setTimeout(checkStability, 100);
      };

      checkStability();
    });
  }

  // 添加重量变化回调
  onWeightChange(callback) {
    this.callbacks.push(callback);
  }

  // 移除重量变化回调
  removeWeightChangeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // 通知所有回调
  notifyCallbacks(weight) {
    this.callbacks.forEach(callback => {
      try {
        callback(weight);
      } catch (error) {
        console.error('Weight callback error:', error);
      }
    });
  }

  // 清零
  tare() {
    this.currentWeight = 0;
    this.notifyCallbacks(0);
  }

  // 断开连接
  disconnect() {
    this.isConnected = false;
    this.callbacks = [];
    console.log('Weight manager disconnected');
  }

  // 检查连接状态
  isDeviceConnected() {
    return this.isConnected;
  }
}

// 创建全局实例
const weightManager = new WeightManager();

export { weightManager };