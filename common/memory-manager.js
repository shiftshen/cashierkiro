/**
 * 内存管理器
 * 实现内存泄漏检测、预防和自动清理功能
 */

class MemoryManager {
    constructor(options = {}) {
        this.options = {
            maxMemoryUsage: options.maxMemoryUsage || 100 * 1024 * 1024, // 100MB
            checkInterval: options.checkInterval || 30000, // 30秒
            warningThreshold: options.warningThreshold || 0.8, // 80%
            criticalThreshold: options.criticalThreshold || 0.9, // 90%
            enableAutoCleanup: options.enableAutoCleanup !== false,
            enableLeakDetection: options.enableLeakDetection !== false,
            ...options
        };
        
        // 内存监控数据
        this.memoryStats = {
            current: 0,
            peak: 0,
            average: 0,
            samples: [],
            leaks: [],
            cleanups: 0
        };
        
        // 对象引用跟踪
        this.objectRegistry = new WeakMap();
        this.componentRegistry = new Map();
        this.listenerRegistry = new Map();
        this.timerRegistry = new Set();
        
        // 大对象管理
        this.largeObjects = new Map();
        this.objectPool = new Map();
        
        // 内存压力监控
        this.pressureObserver = null;
        this.isUnderPressure = false;
        
        this.init();
    }
    
    /**
     * 初始化内存管理器
     */
    init() {
        console.log('🧠 Memory Manager initialized');
        
        // 启动内存监控
        this.startMemoryMonitoring();
        
        // 设置内存压力监控
        this.setupMemoryPressureObserver();
        
        // 注册全局错误处理
        this.setupErrorHandling();
        
        // 监听页面可见性变化
        this.setupVisibilityChangeHandler();
        
        // 设置定期清理
        if (this.options.enableAutoCleanup) {
            this.startAutoCleanup();
        }
    }
    
    /**
     * 启动内存监控
     */
    startMemoryMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.collectMemoryStats();
            this.detectMemoryLeaks();
            this.checkMemoryPressure();
        }, this.options.checkInterval);
    }
    
    /**
     * 收集内存统计信息
     */
    collectMemoryStats() {
        try {
            let memoryInfo = {};
            
            // 获取内存信息
            if (performance.memory) {
                memoryInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            } else {
                // 估算内存使用
                memoryInfo = this.estimateMemoryUsage();
            }
            
            this.memoryStats.current = memoryInfo.used;
            this.memoryStats.peak = Math.max(this.memoryStats.peak, memoryInfo.used);
            
            // 保存样本数据
            this.memoryStats.samples.push({
                timestamp: Date.now(),
                used: memoryInfo.used,
                total: memoryInfo.total,
                limit: memoryInfo.limit
            });
            
            // 保持最近100个样本
            if (this.memoryStats.samples.length > 100) {
                this.memoryStats.samples.shift();
            }
            
            // 计算平均值
            const recentSamples = this.memoryStats.samples.slice(-10);
            this.memoryStats.average = recentSamples.reduce((sum, sample) => sum + sample.used, 0) / recentSamples.length;
            
            // 检查内存使用情况
            const usageRatio = memoryInfo.used / memoryInfo.limit;
            if (usageRatio > this.options.criticalThreshold) {
                this.handleCriticalMemoryUsage(memoryInfo);
            } else if (usageRatio > this.options.warningThreshold) {
                this.handleWarningMemoryUsage(memoryInfo);
            }
            
        } catch (error) {
            console.error('Memory stats collection failed:', error);
        }
    }
    
    /**
     * 估算内存使用量
     */
    estimateMemoryUsage() {
        let estimatedSize = 0;
        
        // 估算DOM节点数量
        const domNodes = document.querySelectorAll('*').length;
        estimatedSize += domNodes * 1000; // 每个节点约1KB
        
        // 估算组件数量
        estimatedSize += this.componentRegistry.size * 10000; // 每个组件约10KB
        
        // 估算大对象
        for (const [key, obj] of this.largeObjects) {
            estimatedSize += obj.estimatedSize || 0;
        }
        
        return {
            used: estimatedSize,
            total: estimatedSize * 1.5,
            limit: this.options.maxMemoryUsage
        };
    }
    
    /**
     * 检测内存泄漏
     */
    detectMemoryLeaks() {
        if (!this.options.enableLeakDetection) return;
        
        try {
            // 检查组件泄漏
            this.detectComponentLeaks();
            
            // 检查事件监听器泄漏
            this.detectListenerLeaks();
            
            // 检查定时器泄漏
            this.detectTimerLeaks();
            
            // 检查大对象泄漏
            this.detectLargeObjectLeaks();
            
        } catch (error) {
            console.error('Memory leak detection failed:', error);
        }
    }
    
    /**
     * 检测组件泄漏
     */
    detectComponentLeaks() {
        const now = Date.now();
        const leakThreshold = 5 * 60 * 1000; // 5分钟
        
        for (const [id, component] of this.componentRegistry) {
            if (component.destroyed && (now - component.destroyTime) > leakThreshold) {
                this.memoryStats.leaks.push({
                    type: 'component',
                    id,
                    component: component.name,
                    destroyTime: component.destroyTime,
                    detectedAt: now
                });
                
                console.warn(`🚨 Component leak detected: ${component.name} (${id})`);
                this.componentRegistry.delete(id);
            }
        }
    }
    
    /**
     * 检测事件监听器泄漏
     */
    detectListenerLeaks() {
        const now = Date.now();
        const leakThreshold = 10 * 60 * 1000; // 10分钟
        
        for (const [id, listener] of this.listenerRegistry) {
            if (listener.removed && (now - listener.removeTime) > leakThreshold) {
                this.memoryStats.leaks.push({
                    type: 'listener',
                    id,
                    event: listener.event,
                    removeTime: listener.removeTime,
                    detectedAt: now
                });
                
                console.warn(`🚨 Event listener leak detected: ${listener.event} (${id})`);
                this.listenerRegistry.delete(id);
            }
        }
    }
    
    /**
     * 检测定时器泄漏
     */
    detectTimerLeaks() {
        // 检查是否有未清理的定时器
        const activeTimers = Array.from(this.timerRegistry);
        if (activeTimers.length > 50) {
            console.warn(`🚨 Too many active timers: ${activeTimers.length}`);
            
            this.memoryStats.leaks.push({
                type: 'timers',
                count: activeTimers.length,
                detectedAt: Date.now()
            });
        }
    }
    
    /**
     * 检测大对象泄漏
     */
    detectLargeObjectLeaks() {
        const now = Date.now();
        const leakThreshold = 15 * 60 * 1000; // 15分钟
        
        for (const [key, obj] of this.largeObjects) {
            if ((now - obj.createTime) > leakThreshold && !obj.accessed) {
                this.memoryStats.leaks.push({
                    type: 'large_object',
                    key,
                    size: obj.estimatedSize,
                    createTime: obj.createTime,
                    detectedAt: now
                });
                
                console.warn(`🚨 Large object leak detected: ${key} (${this.formatSize(obj.estimatedSize)})`);
                this.largeObjects.delete(key);
            }
        }
    }
    
    /**
     * 检查内存压力
     */
    checkMemoryPressure() {
        const samples = this.memoryStats.samples.slice(-5);
        if (samples.length < 5) return;
        
        // 检查内存增长趋势
        const growthRate = (samples[4].used - samples[0].used) / samples[0].used;
        if (growthRate > 0.2) { // 20%增长
            this.isUnderPressure = true;
            this.handleMemoryPressure();
        } else {
            this.isUnderPressure = false;
        }
    }
    
    /**
     * 处理内存压力
     */
    handleMemoryPressure() {
        console.warn('🔥 Memory pressure detected, starting cleanup...');
        
        // 清理缓存
        this.clearCaches();
        
        // 清理大对象
        this.cleanupLargeObjects();
        
        // 强制垃圾回收
        this.forceGarbageCollection();
        
        // 通知应用
        this.notifyMemoryPressure();
    }
    
    /**
     * 处理警告级内存使用
     */
    handleWarningMemoryUsage(memoryInfo) {
        console.warn('⚠️ High memory usage detected:', this.formatSize(memoryInfo.used));
        
        // 轻量级清理
        this.lightCleanup();
    }
    
    /**
     * 处理临界级内存使用
     */
    handleCriticalMemoryUsage(memoryInfo) {
        console.error('🚨 Critical memory usage detected:', this.formatSize(memoryInfo.used));
        
        // 激进清理
        this.aggressiveCleanup();
        
        // 通知用户
        this.notifyCriticalMemory();
    }
    
    /**
     * 注册组件
     */
    registerComponent(component, name) {
        const id = this.generateId();
        this.componentRegistry.set(id, {
            name: name || component.constructor.name,
            instance: component,
            createTime: Date.now(),
            destroyed: false
        });
        
        // 添加销毁钩子
        if (component.$on) {
            component.$on('hook:beforeDestroy', () => {
                this.unregisterComponent(id);
            });
        }
        
        return id;
    }
    
    /**
     * 注销组件
     */
    unregisterComponent(id) {
        const component = this.componentRegistry.get(id);
        if (component) {
            component.destroyed = true;
            component.destroyTime = Date.now();
            
            // 延迟删除，用于泄漏检测
            setTimeout(() => {
                this.componentRegistry.delete(id);
            }, 60000);
        }
    }
    
    /**
     * 注册事件监听器
     */
    registerListener(element, event, handler, options) {
        const id = this.generateId();
        this.listenerRegistry.set(id, {
            element,
            event,
            handler,
            options,
            createTime: Date.now(),
            removed: false
        });
        
        element.addEventListener(event, handler, options);
        
        return id;
    }
    
    /**
     * 注销事件监听器
     */
    unregisterListener(id) {
        const listener = this.listenerRegistry.get(id);
        if (listener && !listener.removed) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
            listener.removed = true;
            listener.removeTime = Date.now();
            
            // 延迟删除，用于泄漏检测
            setTimeout(() => {
                this.listenerRegistry.delete(id);
            }, 60000);
        }
    }
    
    /**
     * 注册定时器
     */
    registerTimer(timerId) {
        this.timerRegistry.add(timerId);
        return timerId;
    }
    
    /**
     * 注销定时器
     */
    unregisterTimer(timerId) {
        this.timerRegistry.delete(timerId);
    }
    
    /**
     * 注册大对象
     */
    registerLargeObject(key, obj, estimatedSize) {
        this.largeObjects.set(key, {
            object: obj,
            estimatedSize: estimatedSize || this.estimateObjectSize(obj),
            createTime: Date.now(),
            accessed: false
        });
    }
    
    /**
     * 访问大对象
     */
    accessLargeObject(key) {
        const obj = this.largeObjects.get(key);
        if (obj) {
            obj.accessed = true;
            obj.lastAccessTime = Date.now();
            return obj.object;
        }
        return null;
    }
    
    /**
     * 注销大对象
     */
    unregisterLargeObject(key) {
        this.largeObjects.delete(key);
    }
    
    /**
     * 对象池管理
     */
    getPooledObject(type, factory) {
        if (!this.objectPool.has(type)) {
            this.objectPool.set(type, []);
        }
        
        const pool = this.objectPool.get(type);
        if (pool.length > 0) {
            return pool.pop();
        }
        
        return factory();
    }
    
    /**
     * 回收对象到池
     */
    recycleObject(type, obj) {
        if (!this.objectPool.has(type)) {
            this.objectPool.set(type, []);
        }
        
        const pool = this.objectPool.get(type);
        if (pool.length < 10) { // 限制池大小
            // 重置对象状态
            if (typeof obj.reset === 'function') {
                obj.reset();
            }
            pool.push(obj);
        }
    }
    
    /**
     * 轻量级清理
     */
    lightCleanup() {
        // 清理过期的缓存项
        if (window.cacheManager && typeof window.cacheManager.cleanup === 'function') {
            window.cacheManager.cleanup();
        }
        
        // 清理未使用的大对象
        const now = Date.now();
        for (const [key, obj] of this.largeObjects) {
            if (!obj.accessed && (now - obj.createTime) > 5 * 60 * 1000) {
                this.largeObjects.delete(key);
            }
        }
        
        this.memoryStats.cleanups++;
    }
    
    /**
     * 激进清理
     */
    aggressiveCleanup() {
        // 执行轻量级清理
        this.lightCleanup();
        
        // 清理所有缓存
        this.clearCaches();
        
        // 清理对象池
        this.objectPool.clear();
        
        // 清理大对象
        this.cleanupLargeObjects();
        
        // 强制垃圾回收
        this.forceGarbageCollection();
        
        this.memoryStats.cleanups++;
    }
    
    /**
     * 清理缓存
     */
    clearCaches() {
        // 清理各种缓存
        if (window.cacheManager) {
            window.cacheManager.clear();
        }
        
        // 清理图片缓存
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
    }
    
    /**
     * 清理大对象
     */
    cleanupLargeObjects() {
        const now = Date.now();
        const threshold = 2 * 60 * 1000; // 2分钟
        
        for (const [key, obj] of this.largeObjects) {
            if (now - obj.createTime > threshold) {
                this.largeObjects.delete(key);
            }
        }
    }
    
    /**
     * 强制垃圾回收
     */
    forceGarbageCollection() {
        if (window.gc) {
            window.gc();
        } else {
            // 创建大量临时对象触发GC
            const temp = [];
            for (let i = 0; i < 100000; i++) {
                temp.push({});
            }
            temp.length = 0;
        }
    }
    
    /**
     * 设置内存压力监控
     */
    setupMemoryPressureObserver() {
        if ('MemoryPressureObserver' in window) {
            this.pressureObserver = new MemoryPressureObserver((entries) => {
                for (const entry of entries) {
                    if (entry.level === 'critical') {
                        this.handleMemoryPressure();
                    }
                }
            });
            this.pressureObserver.observe();
        }
    }
    
    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message && event.error.message.includes('memory')) {
                console.error('Memory-related error detected:', event.error);
                this.handleMemoryPressure();
            }
        });
    }
    
    /**
     * 设置页面可见性变化处理
     */
    setupVisibilityChangeHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时进行清理
                setTimeout(() => {
                    if (document.hidden) {
                        this.lightCleanup();
                    }
                }, 30000); // 30秒后清理
            }
        });
    }
    
    /**
     * 启动自动清理
     */
    startAutoCleanup() {
        setInterval(() => {
            if (!this.isUnderPressure) {
                this.lightCleanup();
            }
        }, 5 * 60 * 1000); // 每5分钟清理一次
    }
    
    /**
     * 通知内存压力
     */
    notifyMemoryPressure() {
        // 发送自定义事件
        window.dispatchEvent(new CustomEvent('memoryPressure', {
            detail: {
                current: this.memoryStats.current,
                peak: this.memoryStats.peak,
                average: this.memoryStats.average
            }
        }));
    }
    
    /**
     * 通知临界内存
     */
    notifyCriticalMemory() {
        // 显示用户提示
        if (uni && uni.showToast) {
            uni.showToast({
                title: '内存使用过高，正在优化...',
                icon: 'loading',
                duration: 3000
            });
        }
    }
    
    /**
     * 估算对象大小
     */
    estimateObjectSize(obj) {
        const jsonString = JSON.stringify(obj);
        return jsonString.length * 2; // 估算为字符串长度的2倍
    }
    
    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * 格式化大小
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    /**
     * 获取内存统计
     */
    getStats() {
        return {
            ...this.memoryStats,
            components: this.componentRegistry.size,
            listeners: this.listenerRegistry.size,
            timers: this.timerRegistry.size,
            largeObjects: this.largeObjects.size,
            isUnderPressure: this.isUnderPressure
        };
    }
    
    /**
     * 销毁内存管理器
     */
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.pressureObserver) {
            this.pressureObserver.disconnect();
        }
        
        this.componentRegistry.clear();
        this.listenerRegistry.clear();
        this.timerRegistry.clear();
        this.largeObjects.clear();
        this.objectPool.clear();
    }
}

// 创建全局实例
const memoryManager = new MemoryManager({
    maxMemoryUsage: 150 * 1024 * 1024, // 150MB
    enableAutoCleanup: true,
    enableLeakDetection: true
});

// 扩展全局对象
window.memoryManager = memoryManager;

// 重写定时器函数以自动注册
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;
const originalClearTimeout = window.clearTimeout;
const originalClearInterval = window.clearInterval;

window.setTimeout = function(callback, delay, ...args) {
    const timerId = originalSetTimeout.call(this, (...callbackArgs) => {
        memoryManager.unregisterTimer(timerId);
        callback.apply(this, callbackArgs);
    }, delay, ...args);
    
    memoryManager.registerTimer(timerId);
    return timerId;
};

window.setInterval = function(callback, delay, ...args) {
    const timerId = originalSetInterval.call(this, callback, delay, ...args);
    memoryManager.registerTimer(timerId);
    return timerId;
};

window.clearTimeout = function(timerId) {
    memoryManager.unregisterTimer(timerId);
    return originalClearTimeout.call(this, timerId);
};

window.clearInterval = function(timerId) {
    memoryManager.unregisterTimer(timerId);
    return originalClearInterval.call(this, timerId);
};

export default memoryManager;