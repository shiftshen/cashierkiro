#!/usr/bin/env node
/**
 * 部署和监控脚本
 * 部署优化后的应用并配置性能监控
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
    constructor(options = {}) {
        this.options = {
            environment: options.environment || 'production',
            enableMonitoring: options.enableMonitoring !== false,
            enableAlerts: options.enableAlerts !== false,
            ...options
        };
        
        this.deploymentConfig = this.loadDeploymentConfig();
        this.monitoringConfig = this.loadMonitoringConfig();
    }
    
    /**
     * 加载部署配置
     */
    loadDeploymentConfig() {
        const configPath = 'deployment.config.js';
        if (fs.existsSync(configPath)) {
            return require(path.resolve(configPath));
        }
        
        return {
            production: {
                buildCommand: 'npm run build:prod',
                outputDir: 'dist',
                serverPath: '/var/www/cashier',
                backupDir: '/var/backups/cashier'
            },
            staging: {
                buildCommand: 'npm run build:staging',
                outputDir: 'dist',
                serverPath: '/var/www/cashier-staging',
                backupDir: '/var/backups/cashier-staging'
            }
        };
    }
    
    /**
     * 加载监控配置
     */
    loadMonitoringConfig() {
        return {
            metrics: {
                performance: {
                    fcp: { threshold: 2000, alert: true },
                    lcp: { threshold: 4000, alert: true },
                    fid: { threshold: 300, alert: true },
                    cls: { threshold: 0.25, alert: true }
                },
                resources: {
                    memory: { threshold: 100 * 1024 * 1024, alert: true },
                    cpu: { threshold: 80, alert: true },
                    network: { threshold: 5000, alert: false }
                },
                errors: {
                    jsErrors: { threshold: 10, alert: true },
                    networkErrors: { threshold: 5, alert: true },
                    crashRate: { threshold: 0.01, alert: true }
                }
            },
            alerts: {
                email: process.env.ALERT_EMAIL || 'admin@example.com',
                webhook: process.env.ALERT_WEBHOOK,
                slack: process.env.SLACK_WEBHOOK
            }
        };
    }
    
    /**
     * 执行部署
     */
    async deploy() {
        console.log('🚀 Starting deployment process...');
        
        try {
            // 1. 预部署检查
            await this.preDeploymentChecks();
            
            // 2. 构建应用
            await this.buildApplication();
            
            // 3. 运行测试
            await this.runTests();
            
            // 4. 创建备份
            await this.createBackup();
            
            // 5. 部署应用
            await this.deployApplication();
            
            // 6. 配置监控
            if (this.options.enableMonitoring) {
                await this.setupMonitoring();
            }
            
            // 7. 验证部署
            await this.verifyDeployment();
            
            // 8. 发送通知
            await this.sendDeploymentNotification(true);
            
            console.log('✅ Deployment completed successfully!');
            
        } catch (error) {
            console.error('❌ Deployment failed:', error);
            
            // 回滚
            await this.rollback();
            
            // 发送失败通知
            await this.sendDeploymentNotification(false, error);
            
            throw error;
        }
    }
    
    /**
     * 预部署检查
     */
    async preDeploymentChecks() {
        console.log('🔍 Running pre-deployment checks...');
        
        // 检查环境变量
        const requiredEnvVars = ['NODE_ENV', 'API_URL'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
        
        // 检查依赖
        if (!fs.existsSync('package.json')) {
            throw new Error('package.json not found');
        }
        
        // 检查Git状态
        try {
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            if (gitStatus.trim() && this.options.environment === 'production') {
                console.warn('⚠️ Warning: Working directory has uncommitted changes');
            }
        } catch (error) {
            console.warn('⚠️ Warning: Could not check Git status');
        }
        
        console.log('✅ Pre-deployment checks passed');
    }
    
    /**
     * 构建应用
     */
    async buildApplication() {
        console.log('🔨 Building application...');
        
        const config = this.deploymentConfig[this.options.environment];
        if (!config) {
            throw new Error(`No configuration found for environment: ${this.options.environment}`);
        }
        
        try {
            // 清理旧的构建文件
            if (fs.existsSync(config.outputDir)) {
                execSync(`rm -rf ${config.outputDir}`);
            }
            
            // 执行构建
            execSync(config.buildCommand, { stdio: 'inherit' });
            
            // 验证构建输出
            if (!fs.existsSync(config.outputDir)) {
                throw new Error('Build output directory not found');
            }
            
            console.log('✅ Application built successfully');
            
        } catch (error) {
            throw new Error(`Build failed: ${error.message}`);
        }
    }
    
    /**
     * 运行测试
     */
    async runTests() {
        console.log('🧪 Running tests...');
        
        try {
            // 运行单元测试
            execSync('npm test', { stdio: 'inherit' });
            
            // 运行性能测试
            execSync('node scripts/performance-benchmark.js', { stdio: 'inherit' });
            
            console.log('✅ All tests passed');
            
        } catch (error) {
            throw new Error(`Tests failed: ${error.message}`);
        }
    }
    
    /**
     * 创建备份
     */
    async createBackup() {
        console.log('💾 Creating backup...');
        
        const config = this.deploymentConfig[this.options.environment];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(config.backupDir, `backup-${timestamp}`);
        
        try {
            // 创建备份目录
            execSync(`mkdir -p ${config.backupDir}`);
            
            // 备份当前版本
            if (fs.existsSync(config.serverPath)) {
                execSync(`cp -r ${config.serverPath} ${backupPath}`);
                console.log(`✅ Backup created: ${backupPath}`);
            } else {
                console.log('ℹ️ No existing deployment to backup');
            }
            
        } catch (error) {
            console.warn('⚠️ Backup creation failed:', error.message);
        }
    }
    
    /**
     * 部署应用
     */
    async deployApplication() {
        console.log('📦 Deploying application...');
        
        const config = this.deploymentConfig[this.options.environment];
        
        try {
            // 创建服务器目录
            execSync(`mkdir -p ${config.serverPath}`);
            
            // 复制构建文件
            execSync(`cp -r ${config.outputDir}/* ${config.serverPath}/`);
            
            // 设置权限
            execSync(`chmod -R 755 ${config.serverPath}`);
            
            console.log('✅ Application deployed successfully');
            
        } catch (error) {
            throw new Error(`Deployment failed: ${error.message}`);
        }
    }
    
    /**
     * 设置监控
     */
    async setupMonitoring() {
        console.log('📊 Setting up monitoring...');
        
        // 创建监控配置文件
        const monitoringScript = this.generateMonitoringScript();
        const monitoringPath = path.join(this.deploymentConfig[this.options.environment].serverPath, 'monitoring.js');
        
        fs.writeFileSync(monitoringPath, monitoringScript);
        
        // 创建性能监控HTML
        const monitoringHTML = this.generateMonitoringHTML();
        const htmlPath = path.join(this.deploymentConfig[this.options.environment].serverPath, 'monitoring.html');
        
        fs.writeFileSync(htmlPath, monitoringHTML);
        
        console.log('✅ Monitoring configured');
    }
    
    /**
     * 生成监控脚本
     */
    generateMonitoringScript() {
        return `
// Performance Monitoring Script
(function() {
    const config = ${JSON.stringify(this.monitoringConfig, null, 2)};
    
    class PerformanceMonitor {
        constructor() {
            this.metrics = {};
            this.init();
        }
        
        init() {
            this.observePerformance();
            this.observeErrors();
            this.observeResources();
            this.startReporting();
        }
        
        observePerformance() {
            // Core Web Vitals
            if ('PerformanceObserver' in window) {
                // FCP, LCP
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            this.recordMetric('fcp', entry.startTime);
                        } else if (entry.entryType === 'largest-contentful-paint') {
                            this.recordMetric('lcp', entry.startTime);
                        }
                    }
                }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
                
                // FID
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric('fid', entry.processingStart - entry.startTime);
                    }
                }).observe({ entryTypes: ['first-input'] });
                
                // CLS
                new PerformanceObserver((list) => {
                    let clsValue = 0;
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.recordMetric('cls', clsValue);
                }).observe({ entryTypes: ['layout-shift'] });
            }
        }
        
        observeErrors() {
            window.addEventListener('error', (event) => {
                this.recordError('js', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                this.recordError('promise', {
                    reason: event.reason
                });
            });
        }
        
        observeResources() {
            if (performance.memory) {
                setInterval(() => {
                    this.recordMetric('memory', performance.memory.usedJSHeapSize);
                }, 30000);
            }
        }
        
        recordMetric(name, value) {
            this.metrics[name] = value;
            
            // Check thresholds
            const threshold = config.metrics.performance[name]?.threshold;
            if (threshold && value > threshold) {
                this.sendAlert('performance', name, value, threshold);
            }
        }
        
        recordError(type, details) {
            if (!this.metrics.errors) this.metrics.errors = {};
            if (!this.metrics.errors[type]) this.metrics.errors[type] = [];
            
            this.metrics.errors[type].push({
                timestamp: Date.now(),
                ...details
            });
            
            // Check error thresholds
            const threshold = config.metrics.errors[type + 'Errors']?.threshold;
            if (threshold && this.metrics.errors[type].length > threshold) {
                this.sendAlert('error', type, this.metrics.errors[type].length, threshold);
            }
        }
        
        sendAlert(category, metric, value, threshold) {
            const alertData = {
                timestamp: new Date().toISOString(),
                category,
                metric,
                value,
                threshold,
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            // Send to monitoring endpoint
            fetch('/api/monitoring/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertData)
            }).catch(console.error);
        }
        
        startReporting() {
            setInterval(() => {
                this.sendMetrics();
            }, 60000); // Report every minute
        }
        
        sendMetrics() {
            const reportData = {
                timestamp: new Date().toISOString(),
                metrics: this.metrics,
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            fetch('/api/monitoring/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData)
            }).catch(console.error);
        }
    }
    
    // Initialize monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new PerformanceMonitor());
    } else {
        new PerformanceMonitor();
    }
})();
        `;
    }
    
    /**
     * 生成监控HTML页面
     */
    generateMonitoringHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Performance Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 32px; font-weight: bold; color: #007aff; }
        .metric-label { color: #666; margin-top: 5px; }
        .status-good { border-left: 4px solid #28a745; }
        .status-warning { border-left: 4px solid #ffc107; }
        .status-danger { border-left: 4px solid #dc3545; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Performance Monitoring Dashboard</h1>
        <p>Real-time performance metrics for the cashier application</p>
    </div>
    
    <div class="metrics-grid">
        <div class="metric-card status-good">
            <div class="metric-value" id="fcp-value">-</div>
            <div class="metric-label">First Contentful Paint (ms)</div>
        </div>
        <div class="metric-card status-good">
            <div class="metric-value" id="lcp-value">-</div>
            <div class="metric-label">Largest Contentful Paint (ms)</div>
        </div>
        <div class="metric-card status-good">
            <div class="metric-value" id="fid-value">-</div>
            <div class="metric-label">First Input Delay (ms)</div>
        </div>
        <div class="metric-card status-good">
            <div class="metric-value" id="cls-value">-</div>
            <div class="metric-label">Cumulative Layout Shift</div>
        </div>
        <div class="metric-card status-good">
            <div class="metric-value" id="memory-value">-</div>
            <div class="metric-label">Memory Usage (MB)</div>
        </div>
        <div class="metric-card status-good">
            <div class="metric-value" id="errors-value">-</div>
            <div class="metric-label">JavaScript Errors</div>
        </div>
    </div>
    
    <div class="chart-container">
        <h3>Performance Trends</h3>
        <canvas id="performance-chart" width="800" height="400"></canvas>
    </div>
    
    <script>
        // Simple monitoring dashboard
        class MonitoringDashboard {
            constructor() {
                this.metrics = {};
                this.init();
            }
            
            init() {
                this.loadMetrics();
                setInterval(() => this.loadMetrics(), 30000);
            }
            
            async loadMetrics() {
                try {
                    const response = await fetch('/api/monitoring/current');
                    const data = await response.json();
                    this.updateDisplay(data);
                } catch (error) {
                    console.error('Failed to load metrics:', error);
                }
            }
            
            updateDisplay(data) {
                if (data.fcp) {
                    document.getElementById('fcp-value').textContent = Math.round(data.fcp);
                }
                if (data.lcp) {
                    document.getElementById('lcp-value').textContent = Math.round(data.lcp);
                }
                if (data.fid) {
                    document.getElementById('fid-value').textContent = Math.round(data.fid);
                }
                if (data.cls) {
                    document.getElementById('cls-value').textContent = data.cls.toFixed(3);
                }
                if (data.memory) {
                    document.getElementById('memory-value').textContent = Math.round(data.memory / 1024 / 1024);
                }
                if (data.errors) {
                    document.getElementById('errors-value').textContent = data.errors.length || 0;
                }
            }
        }
        
        new MonitoringDashboard();
    </script>
</body>
</html>
        `;
    }
    
    /**
     * 验证部署
     */
    async verifyDeployment() {
        console.log('✅ Verifying deployment...');
        
        const config = this.deploymentConfig[this.options.environment];
        
        // 检查文件是否存在
        const requiredFiles = ['index.html', 'static/js', 'static/css'];
        for (const file of requiredFiles) {
            const filePath = path.join(config.serverPath, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file not found: ${file}`);
            }
        }
        
        // 检查监控文件
        if (this.options.enableMonitoring) {
            const monitoringPath = path.join(config.serverPath, 'monitoring.js');
            if (!fs.existsSync(monitoringPath)) {
                throw new Error('Monitoring script not found');
            }
        }
        
        console.log('✅ Deployment verification passed');
    }
    
    /**
     * 回滚
     */
    async rollback() {
        console.log('🔄 Rolling back deployment...');
        
        const config = this.deploymentConfig[this.options.environment];
        
        try {
            // 查找最新的备份
            const backups = fs.readdirSync(config.backupDir)
                .filter(name => name.startsWith('backup-'))
                .sort()
                .reverse();
            
            if (backups.length === 0) {
                throw new Error('No backups available for rollback');
            }
            
            const latestBackup = path.join(config.backupDir, backups[0]);
            
            // 删除当前部署
            execSync(`rm -rf ${config.serverPath}`);
            
            // 恢复备份
            execSync(`cp -r ${latestBackup} ${config.serverPath}`);
            
            console.log(`✅ Rolled back to: ${backups[0]}`);
            
        } catch (error) {
            console.error('❌ Rollback failed:', error.message);
        }
    }
    
    /**
     * 发送部署通知
     */
    async sendDeploymentNotification(success, error = null) {
        const message = success 
            ? `✅ Deployment to ${this.options.environment} completed successfully`
            : `❌ Deployment to ${this.options.environment} failed: ${error?.message}`;
        
        console.log('📧 Sending deployment notification...');
        console.log(message);
        
        // 这里可以集成实际的通知服务
        // 例如：Slack、邮件、钉钉等
    }
    
    /**
     * 生成部署报告
     */
    generateDeploymentReport() {
        const report = {
            timestamp: new Date().toISOString(),
            environment: this.options.environment,
            version: this.getVersion(),
            config: this.deploymentConfig[this.options.environment],
            monitoring: this.options.enableMonitoring,
            alerts: this.options.enableAlerts
        };
        
        fs.writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
        console.log('📊 Deployment report saved: deployment-report.json');
    }
    
    /**
     * 获取版本信息
     */
    getVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version;
        } catch (error) {
            return 'unknown';
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const args = process.argv.slice(2);
    const environment = args[0] || 'production';
    
    const deployment = new DeploymentManager({
        environment,
        enableMonitoring: true,
        enableAlerts: true
    });
    
    deployment.deploy()
        .then(() => {
            console.log('🎉 Deployment process completed!');
            deployment.generateDeploymentReport();
        })
        .catch((error) => {
            console.error('💥 Deployment process failed:', error);
            process.exit(1);
        });
}

module.exports = DeploymentManager;