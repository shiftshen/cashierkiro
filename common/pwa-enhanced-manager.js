/**
 * 增强版PWA管理器
 * 实现应用安装、离线优先架构、后台同步和推送通知
 */

class PWAEnhancedManager {
    constructor(options = {}) {
        this.options = {
            enableInstallPrompt: options.enableInstallPrompt !== false,
            enableBackgroundSync: options.enableBackgroundSync !== false,
            enablePushNotifications: options.enablePushNotifications !== false,
            enableOfflineFirst: options.enableOfflineFirst !== false,
            syncRetryDelay: options.syncRetryDelay || 5000,
            maxSyncRetries: options.maxSyncRetries || 3,
            ...options
        };
        
        // PWA状态
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.installPromptEvent = null;
        this.registration = null;
        
        // 后台同步队列
        this.syncQueue = [];
        this.syncInProgress = false;
        
        // 推送通知
        this.pushSubscription = null;
        this.notificationPermission = 'default';
        
        // 离线数据队列
        this.offlineQueue = [];
        
        this.init();
    }
    
    /**
     * 初始化PWA管理器
     */
    async init() {
        console.log('🚀 PWA Enhanced Manager initializing...');
        
        // 注册Service Worker
        await this.registerServiceWorker();
        
        // 设置安装提示
        if (this.options.enableInstallPrompt) {
            this.setupInstallPrompt();
        }
        
        // 设置网络状态监听
        this.setupNetworkListeners();
        
        // 设置后台同步
        if (this.options.enableBackgroundSync) {
            this.setupBackgroundSync();
        }
        
        // 设置推送通知
        if (this.options.enablePushNotifications) {
            await this.setupPushNotifications();
        }
        
        // 设置离线优先
        if (this.options.enableOfflineFirst) {
            this.setupOfflineFirst();
        }
        
        // 检查是否已安装
        this.checkInstallStatus();
        
        console.log('✅ PWA Enhanced Manager initialized');
    }
    
    /**
     * 注册Service Worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', this.registration);
                
                // 监听更新
                this.registration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate();
                });
                
                // 监听消息
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event);
                });
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        }
    }
    
    /**
     * 设置安装提示
     */
    setupInstallPrompt() {
        // 监听安装提示事件
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.installPromptEvent = event;
            this.showInstallBanner();
        });
        
        // 监听安装完成事件
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallBanner();
            this.showInstallSuccessMessage();
            this.trackInstallEvent();
        });
    }
    
    /**
     * 显示安装横幅
     */
    showInstallBanner() {
        // 检查是否应该显示安装提示
        if (this.shouldShowInstallPrompt()) {
            this.createInstallBanner();
        }
    }
    
    /**
     * 创建安装横幅
     */
    createInstallBanner() {
        // 避免重复创建
        if (document.getElementById('pwa-install-banner')) return;
        
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-icon">📱</div>
                <div class="banner-text">
                    <div class="banner-title">安装应用</div>
                    <div class="banner-desc">添加到主屏幕，获得更好的体验</div>
                </div>
                <div class="banner-actions">
                    <button class="banner-btn banner-btn-install">安装</button>
                    <button class="banner-btn banner-btn-close">×</button>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-banner {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideUp 0.3s ease-out;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .banner-content {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            }
            
            .banner-icon {
                font-size: 32px;
            }
            
            .banner-text {
                flex: 1;
            }
            
            .banner-title {
                font-weight: bold;
                color: #333;
                margin-bottom: 4px;
            }
            
            .banner-desc {
                font-size: 14px;
                color: #666;
            }
            
            .banner-actions {
                display: flex;
                gap: 8px;
            }
            
            .banner-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .banner-btn-install {
                background: #007aff;
                color: white;
            }
            
            .banner-btn-install:hover {
                background: #0056cc;
            }
            
            .banner-btn-close {
                background: #f0f0f0;
                color: #666;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @media (max-width: 768px) {
                .pwa-install-banner {
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(banner);
        
        // 绑定事件
        banner.querySelector('.banner-btn-install').addEventListener('click', () => {
            this.promptInstall();
        });
        
        banner.querySelector('.banner-btn-close').addEventListener('click', () => {
            this.hideInstallBanner();
            this.markInstallPromptDismissed();
        });
        
        // 自动隐藏
        setTimeout(() => {
            if (document.getElementById('pwa-install-banner')) {
                this.hideInstallBanner();
            }
        }, 30000); // 30秒后自动隐藏
    }
    
    /**
     * 隐藏安装横幅
     */
    hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }
    
    /**
     * 提示安装
     */
    async promptInstall() {
        if (this.installPromptEvent) {
            try {
                const result = await this.installPromptEvent.prompt();
                console.log('Install prompt result:', result);
                
                if (result.outcome === 'accepted') {
                    this.trackInstallAccepted();
                } else {
                    this.trackInstallDismissed();
                }
                
                this.installPromptEvent = null;
                this.hideInstallBanner();
                
            } catch (error) {
                console.error('Install prompt failed:', error);
            }
        }
    }
    
    /**
     * 检查是否应该显示安装提示
     */
    shouldShowInstallPrompt() {
        // 检查是否已安装
        if (this.isInstalled) return false;
        
        // 检查是否已经拒绝过
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) return false; // 7天内不再显示
        }
        
        // 检查访问次数
        const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0');
        if (visitCount < 3) return false; // 至少访问3次后才显示
        
        return true;
    }
    
    /**
     * 标记安装提示已拒绝
     */
    markInstallPromptDismissed() {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
    
    /**
     * 显示安装成功消息
     */
    showInstallSuccessMessage() {
        if (uni && uni.showToast) {
            uni.showToast({
                title: '应用安装成功！',
                icon: 'success',
                duration: 3000
            });
        }
    }
    
    /**
     * 设置网络状态监听
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleNetworkOnline();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleNetworkOffline();
        });
    }
    
    /**
     * 处理网络连接
     */
    async handleNetworkOnline() {
        console.log('🌐 Network online');
        
        // 显示在线提示
        this.showNetworkStatus('online');
        
        // 处理离线队列
        await this.processOfflineQueue();
        
        // 触发后台同步
        if (this.options.enableBackgroundSync) {
            await this.triggerBackgroundSync();
        }
        
        // 发送网络状态事件
        window.dispatchEvent(new CustomEvent('networkOnline'));
    }
    
    /**
     * 处理网络断开
     */
    handleNetworkOffline() {
        console.log('📴 Network offline');
        
        // 显示离线提示
        this.showNetworkStatus('offline');
        
        // 发送网络状态事件
        window.dispatchEvent(new CustomEvent('networkOffline'));
    }
    
    /**
     * 显示网络状态
     */
    showNetworkStatus(status) {
        const isOnline = status === 'online';
        const message = isOnline ? '网络已连接' : '网络已断开，进入离线模式';
        const icon = isOnline ? 'success' : 'none';
        
        if (uni && uni.showToast) {
            uni.showToast({
                title: message,
                icon: icon,
                duration: 2000
            });
        }
    }
    
    /**
     * 设置后台同步
     */
    setupBackgroundSync() {
        // 监听后台同步事件
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                // 注册后台同步
                this.registerBackgroundSync(registration);
            });
        }
    }
    
    /**
     * 注册后台同步
     */
    async registerBackgroundSync(registration) {
        try {
            await registration.sync.register('background-sync');
            console.log('✅ Background sync registered');
        } catch (error) {
            console.error('❌ Background sync registration failed:', error);
        }
    }
    
    /**
     * 触发后台同步
     */
    async triggerBackgroundSync() {
        if (!this.syncInProgress && this.syncQueue.length > 0) {
            this.syncInProgress = true;
            
            try {
                await this.processSyncQueue();
            } catch (error) {
                console.error('Background sync failed:', error);
            } finally {
                this.syncInProgress = false;
            }
        }
    }
    
    /**
     * 处理同步队列
     */
    async processSyncQueue() {
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                await this.syncItem(item);
                console.log('✅ Synced item:', item.id);
            } catch (error) {
                console.error('❌ Sync failed for item:', item.id, error);
                
                // 重新加入队列重试
                if (item.retryCount < this.options.maxSyncRetries) {
                    item.retryCount = (item.retryCount || 0) + 1;
                    this.syncQueue.push(item);
                }
            }
        }
    }
    
    /**
     * 同步单个项目
     */
    async syncItem(item) {
        switch (item.type) {
            case 'order':
                return await this.syncOrder(item.data);
            case 'payment':
                return await this.syncPayment(item.data);
            case 'user_data':
                return await this.syncUserData(item.data);
            default:
                throw new Error(`Unknown sync type: ${item.type}`);
        }
    }
    
    /**
     * 添加到同步队列
     */
    addToSyncQueue(type, data) {
        const item = {
            id: this.generateId(),
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0
        };
        
        this.syncQueue.push(item);
        
        // 如果在线，立即尝试同步
        if (this.isOnline) {
            this.triggerBackgroundSync();
        }
        
        return item.id;
    }
    
    /**
     * 设置推送通知
     */
    async setupPushNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            // 检查通知权限
            this.notificationPermission = Notification.permission;
            
            if (this.notificationPermission === 'default') {
                await this.requestNotificationPermission();
            }
            
            if (this.notificationPermission === 'granted') {
                await this.subscribeToPush();
            }
        }
    }
    
    /**
     * 请求通知权限
     */
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                await this.subscribeToPush();
            } else {
                console.log('❌ Notification permission denied');
            }
        } catch (error) {
            console.error('Notification permission request failed:', error);
        }
    }
    
    /**
     * 订阅推送通知
     */
    async subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // 检查是否已订阅
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                this.pushSubscription = existingSubscription;
                return;
            }
            
            // 创建新订阅
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.options.vapidPublicKey || '')
            });
            
            this.pushSubscription = subscription;
            
            // 发送订阅信息到服务器
            await this.sendSubscriptionToServer(subscription);
            
            console.log('✅ Push subscription created');
            
        } catch (error) {
            console.error('Push subscription failed:', error);
        }
    }
    
    /**
     * 发送订阅信息到服务器
     */
    async sendSubscriptionToServer(subscription) {
        try {
            // 这里应该发送到实际的服务器
            console.log('Sending subscription to server:', subscription);
            
            // 模拟API调用
            // await fetch('/api/push-subscription', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(subscription)
            // });
            
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }
    
    /**
     * 设置离线优先
     */
    setupOfflineFirst() {
        // 拦截网络请求
        this.interceptNetworkRequests();
        
        // 设置离线页面
        this.setupOfflinePage();
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.processOfflineQueue();
            }
        });
    }
    
    /**
     * 拦截网络请求
     */
    interceptNetworkRequests() {
        // 重写fetch函数
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            try {
                // 如果离线，检查缓存
                if (!this.isOnline) {
                    const cachedResponse = await this.getCachedResponse(url);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // 如果是POST请求，添加到离线队列
                    if (options.method === 'POST' || options.method === 'PUT') {
                        this.addToOfflineQueue(url, options);
                        throw new Error('Request queued for offline processing');
                    }
                }
                
                // 在线时正常请求
                const response = await originalFetch(url, options);
                
                // 缓存GET请求的响应
                if (options.method !== 'POST' && options.method !== 'PUT' && response.ok) {
                    this.cacheResponse(url, response.clone());
                }
                
                return response;
                
            } catch (error) {
                // 网络错误时的处理
                if (!this.isOnline) {
                    const cachedResponse = await this.getCachedResponse(url);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                }
                
                throw error;
            }
        };
    }
    
    /**
     * 添加到离线队列
     */
    addToOfflineQueue(url, options) {
        const item = {
            id: this.generateId(),
            url,
            options,
            timestamp: Date.now()
        };
        
        this.offlineQueue.push(item);
        
        // 保存到本地存储
        localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));
        
        console.log('📦 Added to offline queue:', url);
    }
    
    /**
     * 处理离线队列
     */
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) {
            // 从本地存储加载
            const stored = localStorage.getItem('pwa-offline-queue');
            if (stored) {
                this.offlineQueue = JSON.parse(stored);
            }
        }
        
        if (this.offlineQueue.length === 0) return;
        
        console.log(`📤 Processing ${this.offlineQueue.length} offline requests...`);
        
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        for (const item of queue) {
            try {
                await fetch(item.url, item.options);
                console.log('✅ Processed offline request:', item.url);
            } catch (error) {
                console.error('❌ Failed to process offline request:', item.url, error);
                // 重新加入队列
                this.offlineQueue.push(item);
            }
        }
        
        // 更新本地存储
        localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));
    }
    
    /**
     * 获取缓存响应
     */
    async getCachedResponse(url) {
        if ('caches' in window) {
            try {
                const cache = await caches.open('pwa-cache-v1');
                return await cache.match(url);
            } catch (error) {
                console.error('Failed to get cached response:', error);
            }
        }
        return null;
    }
    
    /**
     * 缓存响应
     */
    async cacheResponse(url, response) {
        if ('caches' in window) {
            try {
                const cache = await caches.open('pwa-cache-v1');
                await cache.put(url, response);
            } catch (error) {
                console.error('Failed to cache response:', error);
            }
        }
    }
    
    /**
     * 设置离线页面
     */
    setupOfflinePage() {
        // 预缓存离线页面
        if ('caches' in window) {
            caches.open('pwa-cache-v1').then(cache => {
                cache.addAll([
                    '/offline.html',
                    '/static/css/offline.css',
                    '/static/js/offline.js'
                ]);
            });
        }
    }
    
    /**
     * 检查安装状态
     */
    checkInstallStatus() {
        // 检查是否在独立模式运行
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
        }
        
        // 检查是否从主屏幕启动
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
        }
        
        // 增加访问计数
        const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0') + 1;
        localStorage.setItem('pwa-visit-count', visitCount.toString());
    }
    
    /**
     * 处理Service Worker更新
     */
    handleServiceWorkerUpdate() {
        console.log('🔄 Service Worker update available');
        
        // 显示更新提示
        this.showUpdatePrompt();
    }
    
    /**
     * 显示更新提示
     */
    showUpdatePrompt() {
        if (uni && uni.showModal) {
            uni.showModal({
                title: '应用更新',
                content: '发现新版本，是否立即更新？',
                success: (res) => {
                    if (res.confirm) {
                        this.applyUpdate();
                    }
                }
            });
        }
    }
    
    /**
     * 应用更新
     */
    async applyUpdate() {
        if (this.registration && this.registration.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
    
    /**
     * 处理Service Worker消息
     */
    handleServiceWorkerMessage(event) {
        const { type, payload } = event.data;
        
        switch (type) {
            case 'CACHE_UPDATED':
                console.log('📦 Cache updated:', payload);
                break;
            case 'BACKGROUND_SYNC':
                this.triggerBackgroundSync();
                break;
            case 'PUSH_RECEIVED':
                this.handlePushMessage(payload);
                break;
        }
    }
    
    /**
     * 处理推送消息
     */
    handlePushMessage(payload) {
        console.log('📬 Push message received:', payload);
        
        // 显示通知
        if (this.notificationPermission === 'granted') {
            new Notification(payload.title, {
                body: payload.body,
                icon: payload.icon || '/static/icons/icon-192x192.png',
                badge: '/static/icons/badge-72x72.png',
                tag: payload.tag,
                data: payload.data
            });
        }
    }
    
    /**
     * 工具方法
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // 模拟同步方法
    async syncOrder(data) {
        console.log('Syncing order:', data);
        // 实际实现中应该调用真实的API
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    async syncPayment(data) {
        console.log('Syncing payment:', data);
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    async syncUserData(data) {
        console.log('Syncing user data:', data);
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 跟踪方法
    trackInstallEvent() {
        console.log('📊 App installed');
    }
    
    trackInstallAccepted() {
        console.log('📊 Install prompt accepted');
    }
    
    trackInstallDismissed() {
        console.log('📊 Install prompt dismissed');
    }
    
    /**
     * 获取PWA状态
     */
    getStatus() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            hasInstallPrompt: !!this.installPromptEvent,
            notificationPermission: this.notificationPermission,
            hasPushSubscription: !!this.pushSubscription,
            syncQueueLength: this.syncQueue.length,
            offlineQueueLength: this.offlineQueue.length,
            serviceWorkerReady: !!this.registration
        };
    }
}

// 创建全局实例
const pwaEnhancedManager = new PWAEnhancedManager({
    enableInstallPrompt: true,
    enableBackgroundSync: true,
    enablePushNotifications: true,
    enableOfflineFirst: true
});

// 导出
export default pwaEnhancedManager;