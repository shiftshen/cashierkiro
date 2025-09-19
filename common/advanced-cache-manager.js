/**
 * 高级缓存管理器
 * 实现多级缓存架构：内存缓存 + 本地存储 + 网络缓存
 */

class AdvancedCacheManager {
    constructor(options = {}) {
        this.options = {
            maxMemorySize: options.maxMemorySize || 50 * 1024 * 1024, // 50MB
            maxStorageSize: options.maxStorageSize || 200 * 1024 * 1024, // 200MB
            defaultTTL: options.defaultTTL || 24 * 60 * 60 * 1000, // 24小时
            compressionThreshold: options.compressionThreshold || 1024, // 1KB
            enableCompression: options.enableCompression !== false,
            enableAnalytics: options.enableAnalytics !== false,
            ...options
        };
        
        // 内存缓存
        this.memoryCache = new Map();
        this.memoryCacheSize = 0;
        this.memoryAccessCount = new Map();
        
        // 缓存统计
        this.stats = {
            memoryHits: 0,
            storageHits: 0,
            networkHits: 0,
            misses: 0,
            evictions: 0,
            compressions: 0
        };
        
        // 缓存策略配置
        this.strategies = new Map();
        this.setupDefaultStrategies();
        
        // 预热队列
        this.preloadQueue = [];
        this.isPreloading = false;
        
        // 定期清理
        this.startCleanupTimer();
        
        console.log('🚀 Advanced Cache Manager initialized');
    }
    
    /**
     * 设置默认缓存策略
     */
    setupDefaultStrategies() {
        // 用户数据 - 高优先级，长期缓存
        this.strategies.set('user', {
            priority: 10,
            ttl: 7 * 24 * 60 * 60 * 1000, // 7天
            maxSize: 1024 * 1024, // 1MB
            compression: false,
            preload: true
        });
        
        // 商品数据 - 中优先级，中期缓存
        this.strategies.set('goods', {
            priority: 8,
            ttl: 2 * 60 * 60 * 1000, // 2小时
            maxSize: 5 * 1024 * 1024, // 5MB
            compression: true,
            preload: true
        });
        
        // 订单数据 - 中优先级，短期缓存
        this.strategies.set('orders', {
            priority: 7,
            ttl: 30 * 60 * 1000, // 30分钟
            maxSize: 2 * 1024 * 1024, // 2MB
            compression: true,
            preload: false
        });
        
        // 桌台状态 - 高优先级，短期缓存
        this.strategies.set('tables', {
            priority: 9,
            ttl: 5 * 60 * 1000, // 5分钟
            maxSize: 512 * 1024, // 512KB
            compression: false,
            preload: true
        });
        
        // 图片资源 - 低优先级，长期缓存
        this.strategies.set('images', {
            priority: 5,
            ttl: 30 * 24 * 60 * 60 * 1000, // 30天
            maxSize: 10 * 1024 * 1024, // 10MB
            compression: false,
            preload: false
        });
        
        // API响应 - 中优先级，短期缓存
        this.strategies.set('api', {
            priority: 6,
            ttl: 10 * 60 * 1000, // 10分钟
            maxSize: 1024 * 1024, // 1MB
            compression: true,
            preload: false
        });
    }
    
    /**
     * 获取缓存数据
     */
    async get(key, category = 'default') {
        const startTime = performance.now();
        
        try {
            // 1. 检查内存缓存
            const memoryResult = this.getFromMemory(key);
            if (memoryResult !== null) {
                this.stats.memoryHits++;
                this.updateAccessCount(key);
                this.logCacheHit('memory', key, performance.now() - startTime);
                return memoryResult;
            }
            
            // 2. 检查本地存储
            const storageResult = await this.getFromStorage(key);
            if (storageResult !== null) {
                this.stats.storageHits++;
                // 提升到内存缓存
                this.setToMemory(key, storageResult, category);
                this.logCacheHit('storage', key, performance.now() - startTime);
                return storageResult;
            }
            
            // 3. 缓存未命中
            this.stats.misses++;
            this.logCacheMiss(key, performance.now() - startTime);
            return null;
            
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    /**
     * 设置缓存数据
     */
    async set(key, data, category = 'default', options = {}) {
        const strategy = this.strategies.get(category) || this.strategies.get('api');
        const finalOptions = { ...strategy, ...options };
        
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
                ttl: finalOptions.ttl || this.options.defaultTTL,
                category,
                size: this.calculateSize(data),
                compressed: false
            };
            
            // 压缩大数据
            if (finalOptions.compression && cacheItem.size > this.options.compressionThreshold) {
                cacheItem.data = await this.compressData(data);
                cacheItem.compressed = true;
                this.stats.compressions++;
            }
            
            // 设置到内存缓存
            this.setToMemory(key, cacheItem, category);
            
            // 设置到本地存储
            await this.setToStorage(key, cacheItem);
            
            console.log(`📦 Cached ${key} (${category}): ${this.formatSize(cacheItem.size)}`);
            
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }
    
    /**
     * 从内存缓存获取
     */
    getFromMemory(key) {
        const item = this.memoryCache.get(key);
        if (!item) return null;
        
        // 检查过期
        if (this.isExpired(item)) {
            this.memoryCache.delete(key);
            this.memoryCacheSize -= item.size;
            return null;
        }
        
        return this.extractData(item);
    }
    
    /**
     * 设置到内存缓存
     */
    setToMemory(key, item, category) {
        // 检查内存限制
        if (this.memoryCacheSize + item.size > this.options.maxMemorySize) {
            this.evictMemoryCache(item.size);
        }
        
        // 删除旧数据
        if (this.memoryCache.has(key)) {
            const oldItem = this.memoryCache.get(key);
            this.memoryCacheSize -= oldItem.size;
        }
        
        this.memoryCache.set(key, item);
        this.memoryCacheSize += item.size;
        this.memoryAccessCount.set(key, (this.memoryAccessCount.get(key) || 0) + 1);
    }
    
    /**
     * 从本地存储获取
     */
    async getFromStorage(key) {
        try {
            const stored = localStorage.getItem(`cache_${key}`);
            if (!stored) return null;
            
            const item = JSON.parse(stored);
            
            // 检查过期
            if (this.isExpired(item)) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            
            return this.extractData(item);
            
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }
    
    /**
     * 设置到本地存储
     */
    async setToStorage(key, item) {
        try {
            // 检查存储限制
            const itemSize = JSON.stringify(item).length;
            if (itemSize > this.options.maxStorageSize) {
                console.warn(`Item too large for storage: ${key}`);
                return;
            }
            
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                await this.evictStorageCache();
                // 重试一次
                try {
                    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
                } catch (retryError) {
                    console.error('Storage set retry failed:', retryError);
                }
            } else {
                console.error('Storage set error:', error);
            }
        }
    }
    
    /**
     * 内存缓存淘汰策略 (LRU + 优先级)
     */
    evictMemoryCache(requiredSize) {
        const items = Array.from(this.memoryCache.entries()).map(([key, item]) => ({
            key,
            item,
            accessCount: this.memoryAccessCount.get(key) || 0,
            priority: this.strategies.get(item.category)?.priority || 1,
            lastAccess: item.timestamp
        }));
        
        // 按优先级和访问频率排序
        items.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            if (a.accessCount !== b.accessCount) return a.accessCount - b.accessCount;
            return a.lastAccess - b.lastAccess;
        });
        
        let freedSize = 0;
        for (const { key, item } of items) {
            this.memoryCache.delete(key);
            this.memoryAccessCount.delete(key);
            this.memoryCacheSize -= item.size;
            freedSize += item.size;
            this.stats.evictions++;
            
            if (freedSize >= requiredSize) break;
        }
        
        console.log(`🗑️ Evicted ${freedSize} bytes from memory cache`);
    }
    
    /**
     * 本地存储淘汰策略
     */
    async evictStorageCache() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        const items = [];
        
        for (const key of keys) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                items.push({
                    key: key.replace('cache_', ''),
                    storageKey: key,
                    item,
                    priority: this.strategies.get(item.category)?.priority || 1,
                    age: Date.now() - item.timestamp
                });
            } catch (error) {
                // 删除损坏的缓存项
                localStorage.removeItem(key);
            }
        }
        
        // 按优先级和年龄排序
        items.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return b.age - a.age;
        });
        
        // 删除一半的缓存项
        const toDelete = items.slice(0, Math.floor(items.length / 2));
        for (const { storageKey } of toDelete) {
            localStorage.removeItem(storageKey);
        }
        
        console.log(`🗑️ Evicted ${toDelete.length} items from storage cache`);
    }
    
    /**
     * 缓存预热
     */
    async preloadCache(preloadList = []) {
        if (this.isPreloading) return;
        this.isPreloading = true;
        
        console.log('🔥 Starting cache preload...');
        
        const defaultPreloads = [
            { key: 'user_profile', category: 'user', loader: () => this.loadUserProfile() },
            { key: 'goods_list', category: 'goods', loader: () => this.loadGoodsList() },
            { key: 'table_status', category: 'tables', loader: () => this.loadTableStatus() }
        ];
        
        const allPreloads = [...defaultPreloads, ...preloadList];
        
        for (const { key, category, loader } of allPreloads) {
            try {
                // 检查是否已缓存
                const cached = await this.get(key, category);
                if (cached) continue;
                
                // 加载数据
                const data = await loader();
                if (data) {
                    await this.set(key, data, category);
                }
                
                // 避免阻塞主线程
                await new Promise(resolve => setTimeout(resolve, 10));
                
            } catch (error) {
                console.error(`Preload failed for ${key}:`, error);
            }
        }
        
        this.isPreloading = false;
        console.log('✅ Cache preload completed');
    }
    
    /**
     * 数据压缩
     */
    async compressData(data) {
        try {
            const jsonString = JSON.stringify(data);
            // 简单的压缩实现 (实际项目中可以使用 pako 等库)
            return btoa(jsonString);
        } catch (error) {
            console.error('Compression failed:', error);
            return data;
        }
    }
    
    /**
     * 数据解压
     */
    async decompressData(compressedData) {
        try {
            const jsonString = atob(compressedData);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Decompression failed:', error);
            return compressedData;
        }
    }
    
    /**
     * 提取缓存数据
     */
    async extractData(item) {
        if (item.compressed) {
            return await this.decompressData(item.data);
        }
        return item.data;
    }
    
    /**
     * 检查是否过期
     */
    isExpired(item) {
        return Date.now() - item.timestamp > item.ttl;
    }
    
    /**
     * 计算数据大小
     */
    calculateSize(data) {
        return JSON.stringify(data).length;
    }
    
    /**
     * 格式化大小显示
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    /**
     * 更新访问计数
     */
    updateAccessCount(key) {
        const count = this.memoryAccessCount.get(key) || 0;
        this.memoryAccessCount.set(key, count + 1);
    }
    
    /**
     * 记录缓存命中
     */
    logCacheHit(type, key, duration) {
        if (this.options.enableAnalytics) {
            console.log(`🎯 Cache ${type} hit: ${key} (${duration.toFixed(2)}ms)`);
        }
    }
    
    /**
     * 记录缓存未命中
     */
    logCacheMiss(key, duration) {
        if (this.options.enableAnalytics) {
            console.log(`❌ Cache miss: ${key} (${duration.toFixed(2)}ms)`);
        }
    }
    
    /**
     * 获取缓存统计
     */
    getStats() {
        const total = this.stats.memoryHits + this.stats.storageHits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.memoryHits + this.stats.storageHits) / total * 100).toFixed(2) : 0;
        
        return {
            ...this.stats,
            total,
            hitRate: `${hitRate}%`,
            memorySize: this.formatSize(this.memoryCacheSize),
            memoryItems: this.memoryCache.size,
            storageItems: Object.keys(localStorage).filter(key => key.startsWith('cache_')).length
        };
    }
    
    /**
     * 清理过期缓存
     */
    cleanup() {
        // 清理内存缓存
        for (const [key, item] of this.memoryCache.entries()) {
            if (this.isExpired(item)) {
                this.memoryCache.delete(key);
                this.memoryAccessCount.delete(key);
                this.memoryCacheSize -= item.size;
            }
        }
        
        // 清理本地存储缓存
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        for (const key of keys) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if (this.isExpired(item)) {
                    localStorage.removeItem(key);
                }
            } catch (error) {
                localStorage.removeItem(key);
            }
        }
        
        console.log('🧹 Cache cleanup completed');
    }
    
    /**
     * 启动定期清理
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000); // 每5分钟清理一次
    }
    
    /**
     * 清空所有缓存
     */
    clear() {
        this.memoryCache.clear();
        this.memoryAccessCount.clear();
        this.memoryCacheSize = 0;
        
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        for (const key of keys) {
            localStorage.removeItem(key);
        }
        
        console.log('🗑️ All caches cleared');
    }
    
    // 模拟数据加载器 (实际项目中应该调用真实的API)
    async loadUserProfile() {
        // 模拟API调用
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ id: 1, name: 'User', role: ['admin'] });
            }, 100);
        });
    }
    
    async loadGoodsList() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([{ id: 1, name: 'Product 1' }, { id: 2, name: 'Product 2' }]);
            }, 200);
        });
    }
    
    async loadTableStatus() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([{ id: 1, status: 'available' }, { id: 2, status: 'occupied' }]);
            }, 150);
        });
    }
}

// 创建全局实例
const advancedCacheManager = new AdvancedCacheManager({
    maxMemorySize: 50 * 1024 * 1024, // 50MB
    maxStorageSize: 200 * 1024 * 1024, // 200MB
    enableAnalytics: true
});

export default advancedCacheManager;