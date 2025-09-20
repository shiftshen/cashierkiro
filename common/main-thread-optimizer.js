/**
 * 主线程优化器
 * 优化主线程性能，避免阻塞UI
 */

class MainThreadOptimizer {
  constructor() {
    this.taskQueue = []
    this.isProcessing = false
    this.frameId = null
  }

  /**
   * 添加任务到队列
   * @param {Function} task - 要执行的任务
   * @param {Number} priority - 任务优先级(0-10, 数字越大优先级越高)
   */
  addTask(task, priority = 5) {
    // 将任务添加到队列并按优先级排序
    this.taskQueue.push({ task, priority, id: Date.now() + Math.random() })
    this.taskQueue.sort((a, b) => b.priority - a.priority)
    
    // 如果没有在处理任务，则开始处理
    if (!this.isProcessing) {
      this.processNextTask()
    }
  }

  /**
   * 处理下一个任务
   */
  processNextTask() {
    if (this.taskQueue.length === 0) {
      this.isProcessing = false
      return
    }

    this.isProcessing = true
    
    // 使用 requestIdleCallback 或 setTimeout 来避免阻塞主线程
    if (typeof requestIdleCallback !== 'undefined') {
      this.frameId = requestIdleCallback((deadline) => {
        this.executeTasks(deadline)
      })
    } else {
      this.frameId = setTimeout(() => {
        this.executeTasks({ timeRemaining: () => 10 })
      }, 0)
    }
  }

  /**
   * 执行任务
   * @param {Object} deadline - 时间信息
   */
  executeTasks(deadline) {
    // 在每一帧中执行尽可能多的任务，但不超过5ms
    while (this.taskQueue.length > 0 && deadline.timeRemaining() > 5) {
      const taskItem = this.taskQueue.shift()
      if (taskItem && typeof taskItem.task === 'function') {
        try {
          taskItem.task()
        } catch (error) {
          console.error('任务执行失败:', error)
        }
      }
    }

    // 如果还有任务，继续处理
    if (this.taskQueue.length > 0) {
      this.processNextTask()
    } else {
      this.isProcessing = false
    }
  }

  /**
   * 清空任务队列
   */
  clearTasks() {
    this.taskQueue = []
    this.isProcessing = false
    
    if (this.frameId) {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(this.frameId)
      } else {
        clearTimeout(this.frameId)
      }
      this.frameId = null
    }
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态信息
   */
  getQueueStatus() {
    return {
      queueLength: this.taskQueue.length,
      isProcessing: this.isProcessing
    }
  }

  /**
   * 分批处理大量数据
   * @param {Array} data - 要处理的数据
   * @param {Function} processor - 数据处理函数
   * @param {Number} batchSize - 每批处理的数据量
   * @param {Function} onComplete - 完成回调
   */
  processInBatches(data, processor, batchSize = 100, onComplete) {
    if (!Array.isArray(data) || typeof processor !== 'function') {
      console.error('无效的参数')
      return
    }

    let index = 0
    const total = data.length
    const results = []

    const processBatch = () => {
      const batchEnd = Math.min(index + batchSize, total)
      const batch = data.slice(index, batchEnd)

      // 处理当前批次
      batch.forEach(item => {
        try {
          const result = processor(item)
          results.push(result)
        } catch (error) {
          console.error('批次处理失败:', error)
        }
      })

      index = batchEnd

      // 如果还有数据需要处理，继续
      if (index < total) {
        this.addTask(processBatch, 1)
      } else {
        // 全部处理完成
        if (typeof onComplete === 'function') {
          onComplete(results)
        }
      }
    }

    // 开始处理
    this.addTask(processBatch, 1)
  }
}

// 导出单例
export default new MainThreadOptimizer()