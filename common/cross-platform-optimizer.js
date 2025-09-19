/**
 * 跨平台性能优化器
 * 针对不同平台和设备进行专项优化
 */

class CrossPlatformOptimizer {
    constructor() {
        this.platform = this.detectPlatform();
        this.deviceInfo = this.getDeviceInfo();
        this.optimizations = new Map();
        
        this.init();
    }
    
    init() {
        console.log('🚀 Cross Platform Optimizer initializing...');
        console.log('Platform:', this.platform);
        console.log('Device Info:', this.deviceInfo);
        
        // 应用平台特定优化
        this.applyPlatformOptimizations();
        
        // 应用设备特定优化
        this.applyDeviceOptimizations();
        
        console.log('✅ Cross Platform Optimizer initialized');
    }
    
    detectPlatform() {
        const userAgent = navigator.userAgent;
        
        if (/Android/i.test(userAgent)) {
            return {
                type: 'android',
                version: this.getAndroidVersion(userAgent),
                webview: this.detectAndroidWebView(userAgent)
            };
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            return {
                type: 'ios',
                version: this.getIOSVersion(userAgent),
                webview: 'wkwebview' // iOS 8+ 默认使用 WKWebView
            };
        } else if (/Windows/i.test(userAgent)) {
            return {
                type: 'windows',
                version: this.getWindowsVersion(userAgent)
            };
        } else if (/Mac/i.test(userAgent)) {
            return {
                type: 'macos',
                version: this.getMacOSVersion(userAgent)
            };
        } else {
            return {
                type: 'unknown',
                version: 'unknown'
            };
        }
    }
    
    getDeviceInfo() {
        return {
            memory: navigator.deviceMemory || this.estimateMemory(),
            cores: navigator.hardwareConcurrency || 4,
            connection: this.getConnectionInfo(),
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio || 1
            },
            performance: this.estimateDevicePerformance()
        };
    }
    
    applyPlatformOptimizations() {
        switch (this.platform.type) {
            case 'android':
                this.applyAndroidOptimizations();
                break;
            case 'ios':
                this.applyIOSOptimizations();
                break;
            case 'windows':
                this.applyWindowsOptimizations();
                break;
            case 'macos':
                this.applyMacOSOptimizations();
                break;
        }
    }
    
    applyAndroidOptimizations() {
        console.log('🤖 Applying Android optimizations...');
        
        // Android WebView 优化
        if (this.platform.webview === 'system') {
            this.optimizations.set('android-webview', {
                // 禁用硬件加速的某些功能以避免兼容性问题
                disableHardwareAcceleration: true,
                // 减少动画复杂度
                reduceAnimations: true,
                // 优化滚动性能
                optimizeScrolling: true
            });
        }
        
        // Android 版本特定优化
        if (this.platform.version < 7.0) {
            this.optimizations.set('android-legacy', {
                // 旧版本 Android 优化
                disableComplexCSS: true,
                reduceJSComplexity: true,
                limitConcurrentRequests: 2
            });
        }
        
        // 内存优化
        if (this.deviceInfo.memory < 2) {
            this.optimizations.set('android-low-memory', {
                aggressiveGC: true,
                reduceImageQuality: true,
                limitCacheSize: true
            });
        }
        
        this.applyAndroidSpecificCSS();
        this.applyAndroidScrollOptimization();
    }
    
    applyIOSOptimizations() {
        console.log('🍎 Applying iOS optimizations...');
        
        // iOS Safari 优化
        this.optimizations.set('ios-safari', {
            // 优化 touch 事件
            optimizeTouchEvents: true,
            // 防止缩放
            preventZoom: true,
            // 优化滚动
            enableMomentumScrolling: true
        });
        
        // iOS 版本特定优化
        if (this.platform.version < 12.0) {
            this.optimizations.set('ios-legacy', {
                // 旧版本 iOS 优化
                disableIntersectionObserver: true,
                fallbackToSetTimeout: true
            });
        }
        
        this.applyIOSSpecificCSS();
        this.applyIOSViewportOptimization();
    }
    
    applyWindowsOptimizations() {
        console.log('🪟 Applying Windows optimizations...');
        
        this.optimizations.set('windows', {
            // Windows 特定优化
            enableDirectWrite: true,
            optimizeForTouch: this.isTouchDevice(),
            enableHardwareAcceleration: true
        });
    }
    
    applyMacOSOptimizations() {
        console.log('🖥️ Applying macOS optimizations...');
        
        this.optimizations.set('macos', {
            // macOS 特定优化
            enableRetina: true,
            optimizeForTrackpad: true,
            enableHardwareAcceleration: true
        });
    }
    
    applyDeviceOptimizations() {
        // 基于设备性能的优化
        if (this.deviceInfo.performance === 'low') {
            this.applyLowEndDeviceOptimizations();
        } else if (this.deviceInfo.performance === 'high') {
            this.applyHighEndDeviceOptimizations();
        }
        
        // 基于网络连接的优化
        this.applyNetworkOptimizations();
        
        // 基于内存的优化
        this.applyMemoryOptimizations();
    }
    
    applyLowEndDeviceOptimizations() {
        console.log('📱 Applying low-end device optimizations...');
        
        this.optimizations.set('low-end-device', {
            // 减少动画
            reduceAnimations: true,
            // 降低图片质量
            reduceImageQuality: true,
            // 限制并发请求
            limitConcurrentRequests: 2,
            // 禁用复杂效果
            disableComplexEffects: true,
            // 启用虚拟滚动
            enableVirtualScrolling: true
        });
        
        // 应用低端设备CSS
        this.applyLowEndDeviceCSS();
    }
    
    applyHighEndDeviceOptimizations() {
        console.log('🚀 Applying high-end device optimizations...');
        
        this.optimizations.set('high-end-device', {
            // 启用高级功能
            enableAdvancedFeatures: true,
            // 预加载更多资源
            aggressivePreloading: true,
            // 使用 Web Workers
            enableWebWorkers: true,
            // 启用硬件加速
            enableHardwareAcceleration: true
        });
    }
    
    applyNetworkOptimizations() {
        const connection = this.deviceInfo.connection;
        
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            this.optimizations.set('slow-network', {
                // 慢网络优化
                aggressiveCompression: true,
                reduceImageQuality: true,
                deferNonCriticalResources: true,
                enableOfflineMode: true
            });
        } else if (connection.effectiveType === '4g') {
            this.optimizations.set('fast-network', {
                // 快网络优化
                enablePreloading: true,
                higherImageQuality: true,
                enablePrefetch: true
            });
        }
    }
    
    applyMemoryOptimizations() {
        const memory = this.deviceInfo.memory;
        
        if (memory < 2) {
            this.optimizations.set('low-memory', {
                aggressiveGC: true,
                limitCacheSize: 50 * 1024 * 1024, // 50MB
                reduceImageCache: true,
                enableLazyLoading: true
            });
        } else if (memory >= 8) {
            this.optimizations.set('high-memory', {
                largeCacheSize: 500 * 1024 * 1024, // 500MB
                enablePrefetch: true,
                keepMoreInMemory: true
            });
        }
    }
    
    applyAndroidSpecificCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Android 特定优化 */
            * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
            }
            
            /* Android 滚动优化 */
            .scroll-container {
                -webkit-overflow-scrolling: touch;
                overflow-scrolling: touch;
            }
            
            /* Android 字体渲染优化 */
            body {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
            }
        `;
        document.head.appendChild(style);
    }
    
    applyIOSSpecificCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* iOS 特定优化 */
            * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
            }
            
            /* iOS 滚动优化 */
            .scroll-container {
                -webkit-overflow-scrolling: touch;
                overflow-scrolling: touch;
            }
            
            /* iOS 输入框优化 */
            input, textarea {
                -webkit-appearance: none;
                border-radius: 0;
            }
            
            /* iOS 安全区域适配 */
            .safe-area {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
            }
        `;
        document.head.appendChild(style);
    }
    
    applyLowEndDeviceCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* 低端设备优化 */
            * {
                will-change: auto !important;
            }
            
            .animation {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            
            .shadow {
                box-shadow: none !important;
            }
            
            .gradient {
                background: #f0f0f0 !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    applyAndroidScrollOptimization() {
        // Android 滚动性能优化
        if (this.platform.type === 'android') {
            document.addEventListener('touchstart', function() {}, { passive: true });
            document.addEventListener('touchmove', function() {}, { passive: true });
        }
    }
    
    applyIOSViewportOptimization() {
        // iOS viewport 优化
        if (this.platform.type === 'ios') {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
                );
            }
        }
    }
    
    // 工具方法
    getAndroidVersion(userAgent) {
        const match = userAgent.match(/Android (\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }
    
    getIOSVersion(userAgent) {
        const match = userAgent.match(/OS (\d+)_(\d+)/);
        return match ? parseFloat(`${match[1]}.${match[2]}`) : 0;
    }
    
    getWindowsVersion(userAgent) {
        if (userAgent.includes('Windows NT 10.0')) return 10;
        if (userAgent.includes('Windows NT 6.3')) return 8.1;
        if (userAgent.includes('Windows NT 6.2')) return 8;
        if (userAgent.includes('Windows NT 6.1')) return 7;
        return 0;
    }
    
    getMacOSVersion(userAgent) {
        const match = userAgent.match(/Mac OS X (\d+)_(\d+)/);
        return match ? parseFloat(`${match[1]}.${match[2]}`) : 0;
    }
    
    detectAndroidWebView(userAgent) {
        if (userAgent.includes('wv')) return 'system';
        if (userAgent.includes('Chrome')) return 'chrome';
        return 'unknown';
    }
    
    estimateMemory() {
        // 基于设备信息估算内存
        const screen = window.screen;
        const pixelCount = screen.width * screen.height * (window.devicePixelRatio || 1);
        
        if (pixelCount > 2000000) return 4; // 高分辨率设备通常有更多内存
        if (pixelCount > 1000000) return 2;
        return 1;
    }
    
    getConnectionInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        
        return {
            effectiveType: '4g', // 默认假设
            downlink: 10,
            rtt: 100,
            saveData: false
        };
    }
    
    estimateDevicePerformance() {
        let score = 0;
        
        // 基于内存
        score += this.deviceInfo.memory * 25;
        
        // 基于CPU核心数
        score += this.deviceInfo.cores * 10;
        
        // 基于屏幕分辨率
        const pixelCount = this.deviceInfo.screen.width * this.deviceInfo.screen.height;
        if (pixelCount > 2000000) score += 20;
        else if (pixelCount > 1000000) score += 10;
        
        // 基于平台
        if (this.platform.type === 'ios' && this.platform.version >= 12) score += 20;
        if (this.platform.type === 'android' && this.platform.version >= 8) score += 15;
        
        if (score >= 80) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }
    
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    // 获取优化配置
    getOptimization(key) {
        return this.optimizations.get(key);
    }
    
    getAllOptimizations() {
        return Object.fromEntries(this.optimizations);
    }
    
    // 动态调整优化
    adjustOptimizations(performanceData) {
        if (performanceData.fps < 30) {
            this.optimizations.set('performance-boost', {
                reduceAnimations: true,
                disableComplexEffects: true,
                enableVirtualScrolling: true
            });
        }
        
        if (performanceData.memory > 100 * 1024 * 1024) {
            this.optimizations.set('memory-pressure', {
                aggressiveGC: true,
                clearUnusedCache: true,
                reduceImageCache: true
            });
        }
    }
    
    // 获取平台信息
    getPlatformInfo() {
        return {
            platform: this.platform,
            deviceInfo: this.deviceInfo,
            optimizations: this.getAllOptimizations()
        };
    }
}

// 创建全局实例
const crossPlatformOptimizer = new CrossPlatformOptimizer();

export default crossPlatformOptimizer;