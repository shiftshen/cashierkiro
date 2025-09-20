// 主线程优化器
// 用于优化主线程性能，避免长时间阻塞

export default class MainThreadOptimizer {
  constructor() {
    this.taskQueue = [];
    this.isProcessing = false;
  }

  // 添加任务到队列
  addTask(task, priority = 0) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        task,
        priority,
        resolve,
        reject
      });
      
      // 按优先级排序
      this.taskQueue.sort((a, b) => b.priority - a.priority);
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  // 处理任务队列
  async processQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      const { task, resolve, reject } = this.taskQueue.shift();
      
      try {
        // 使用 setTimeout 让出主线程
        await new Promise(nextTick => setTimeout(nextTick, 0));
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  // 批量处理任务
  async batchProcess(tasks, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(task => this.addTask(task))
      );
      results.push(...batchResults);
      
      // 让出主线程
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }

  // 清空任务队列
  clear() {
    this.taskQueue = [];
    this.isProcessing = false;
  }
}

// 创建全局实例
const optimizer = new MainThreadOptimizer();

export { optimizer };