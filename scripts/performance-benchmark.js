#!/usr/bin/env node
/**
 * 性能基准测试脚本
 * 建立性能基准线，创建自动化测试套件
 */

const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
    constructor() {
        this.benchmarks = new Map();
        this.results = [];
        this.baseline = null;
        
        this.loadBaseline();
    }
    
    /**
     * 加载基准线数据
     */
    loadBaseline() {
        const baselinePath = 'performance-baseline.json';
        if (fs.existsSync(baselinePath)) {
            try {
                this.baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
                console.log('📊 Loaded performance baseline');
            } catch (error) {
                console.error('Failed to load baseline:', error);
            }
        }
    }
    
    /**
     * 保存基准线数据
     */
    saveBaseline() {
        const baselineData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            benchmarks: Object.fromEntries(this.benchmarks),
            environment: this.getEnvironmentInfo()
        };
        
        fs.writeFileSync('performance-baseline.json', JSON.stringify(baselineData, null, 2));
        console.log('💾 Saved performance baseline');
    }
    
    /**
     * 注册基准测试
     */
    registerBenchmark(name, testFunction, options = {}) {
        this.benchmarks.set(name, {
            name,
            testFunction,
            options: {
                iterations: 10,
                warmup: 3,
                timeout: 30000,
                ...options
            }
        });
    }
    
    /**
     * 运行单个基准测试
     */
    async runBenchmark(name) {
        const benchmark = this.benchmarks.get(name);
        if (!benchmark) {
            throw new Error(`Benchmark '${name}' not found`);
        }
        
        console.log(`🏃 Running benchmark: ${name}`);
        
        const { testFunction, options } = benchmark;
        const results = [];
        
        // 预热
        console.log(`  🔥 Warming up (${options.warmup} iterations)...`);
        for (let i = 0; i < options.warmup; i++) {
            await testFunction();
        }
        
        // 正式测试
        console.log(`  📏 Testing (${options.iterations} iterations)...`);
        for (let i = 0; i < options.iterations; i++) {
            const startTime = performance.now();
            
            try {
                await Promise.race([
                    testFunction(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), options.timeout)
                    )
                ]);
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                results.push(duration);
                
            } catch (error) {
                console.error(`  ❌ Iteration ${i + 1} failed:`, error.message);
                results.push(null);
            }
        }
        
        // 计算统计数据
        const validResults = results.filter(r => r !== null);
        const stats = this.calculateStats(validResults);
        
        const result = {
            name,
            timestamp: new Date().toISOString(),
            iterations: options.iterations,
            validIterations: validResults.length,
            ...stats
        };
        
        console.log(`  ✅ Completed: ${stats.mean.toFixed(2)}ms (±${stats.stdDev.toFixed(2)})`);
        
        return result;
    }
    
    /**
     * 运行所有基准测试
     */
    async runAllBenchmarks() {
        console.log('🚀 Starting performance benchmark suite...\n');
        
        const results = [];
        
        for (const [name] of this.benchmarks) {
            try {
                const result = await this.runBenchmark(name);
                results.push(result);
                
                // 与基准线比较
                if (this.baseline && this.baseline.benchmarks[name]) {
                    this.compareWithBaseline(result, this.baseline.benchmarks[name]);
                }
                
            } catch (error) {
                console.error(`❌ Benchmark '${name}' failed:`, error);
                results.push({
                    name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log(''); // 空行分隔
        }
        
        this.results = results;
        this.generateReport();
        
        return results;
    }
    
    /**
     * 与基准线比较
     */
    compareWithBaseline(current, baseline) {
        const improvement = ((baseline.mean - current.mean) / baseline.mean) * 100;
        
        if (improvement > 5) {
            console.log(`  🎉 Performance improved by ${improvement.toFixed(1)}%`);
        } else if (improvement < -10) {
            console.log(`  ⚠️  Performance degraded by ${Math.abs(improvement).toFixed(1)}%`);
        } else {
            console.log(`  ✅ Performance stable (${improvement.toFixed(1)}% change)`);
        }
    }
    
    /**
     * 计算统计数据
     */
    calculateStats(values) {
        if (values.length === 0) {
            return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
        }
        
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return { mean, median, min, max, stdDev };
    }
    
    /**
     * 生成测试报告
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            environment: this.getEnvironmentInfo(),
            summary: this.generateSummary(),
            results: this.results,
            baseline: this.baseline
        };
        
        // 保存详细报告
        const reportPath = `performance-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // 生成HTML报告
        this.generateHTMLReport(report);
        
        console.log(`📊 Performance report saved: ${reportPath}`);
    }
    
    /**
     * 生成摘要
     */
    generateSummary() {
        const validResults = this.results.filter(r => !r.error);
        const totalTests = this.results.length;
        const passedTests = validResults.length;
        const failedTests = totalTests - passedTests;
        
        let improvements = 0;
        let degradations = 0;
        
        if (this.baseline) {
            validResults.forEach(result => {
                const baseline = this.baseline.benchmarks[result.name];
                if (baseline) {
                    const change = ((baseline.mean - result.mean) / baseline.mean) * 100;
                    if (change > 5) improvements++;
                    else if (change < -10) degradations++;
                }
            });
        }
        
        return {
            totalTests,
            passedTests,
            failedTests,
            improvements,
            degradations,
            averagePerformance: validResults.length > 0 
                ? validResults.reduce((sum, r) => sum + r.mean, 0) / validResults.length 
                : 0
        };
    }
    
    /**
     * 生成HTML报告
     */
    generateHTMLReport(report) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Performance Benchmark Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007aff; }
        .metric-label { color: #666; margin-top: 5px; }
        .results { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .result-header { background: #f8f9fa; padding: 15px; font-weight: bold; border-bottom: 1px solid #dee2e6; }
        .result-item { padding: 15px; border-bottom: 1px solid #dee2e6; }
        .result-item:last-child { border-bottom: none; }
        .result-name { font-weight: bold; margin-bottom: 5px; }
        .result-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; }
        .stat { text-align: center; }
        .stat-value { font-weight: bold; }
        .stat-label { font-size: 12px; color: #666; }
        .improvement { color: #28a745; }
        .degradation { color: #dc3545; }
        .stable { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Performance Benchmark Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Environment: ${report.environment.platform} ${report.environment.version}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.summary.totalTests}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.passedTests}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.failedTests}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.improvements}</div>
            <div class="metric-label">Improvements</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.degradations}</div>
            <div class="metric-label">Degradations</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.averagePerformance.toFixed(2)}ms</div>
            <div class="metric-label">Avg Performance</div>
        </div>
    </div>
    
    <div class="results">
        <div class="result-header">Benchmark Results</div>
        ${report.results.map(result => `
            <div class="result-item">
                <div class="result-name">${result.name}</div>
                ${result.error ? `
                    <div style="color: #dc3545;">Error: ${result.error}</div>
                ` : `
                    <div class="result-stats">
                        <div class="stat">
                            <div class="stat-value">${result.mean.toFixed(2)}ms</div>
                            <div class="stat-label">Mean</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${result.median.toFixed(2)}ms</div>
                            <div class="stat-label">Median</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${result.min.toFixed(2)}ms</div>
                            <div class="stat-label">Min</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${result.max.toFixed(2)}ms</div>
                            <div class="stat-label">Max</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">±${result.stdDev.toFixed(2)}ms</div>
                            <div class="stat-label">Std Dev</div>
                        </div>
                    </div>
                `}
            </div>
        `).join('')}
    </div>
</body>
</html>
        `;
        
        fs.writeFileSync('performance-report.html', html);
        console.log('📄 HTML report saved: performance-report.html');
    }
    
    /**
     * 获取环境信息
     */
    getEnvironmentInfo() {
        return {
            platform: process.platform,
            version: process.version,
            arch: process.arch,
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        };
    }
    
    /**
     * 设置基准线
     */
    setBaseline() {
        console.log('📏 Setting new performance baseline...');
        
        // 将当前结果设为基准线
        const baselineData = {};
        this.results.forEach(result => {
            if (!result.error) {
                baselineData[result.name] = result;
            }
        });
        
        this.baseline = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            benchmarks: baselineData,
            environment: this.getEnvironmentInfo()
        };
        
        this.saveBaseline();
    }
}

// 创建基准测试实例
const benchmark = new PerformanceBenchmark();

// 注册基准测试
benchmark.registerBenchmark('dom-manipulation', async () => {
    // DOM操作性能测试
    const container = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        element.textContent = `Item ${i}`;
        container.appendChild(element);
    }
    container.remove();
});

benchmark.registerBenchmark('array-processing', async () => {
    // 数组处理性能测试
    const array = Array.from({ length: 10000 }, (_, i) => i);
    const result = array
        .filter(x => x % 2 === 0)
        .map(x => x * 2)
        .reduce((sum, x) => sum + x, 0);
    return result;
});

benchmark.registerBenchmark('json-parsing', async () => {
    // JSON解析性能测试
    const data = { items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` })) };
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);
    return parsed;
});

benchmark.registerBenchmark('async-operations', async () => {
    // 异步操作性能测试
    const promises = Array.from({ length: 10 }, () => 
        new Promise(resolve => setTimeout(resolve, Math.random() * 10))
    );
    await Promise.all(promises);
});

// 如果直接运行此脚本
if (require.main === module) {
    (async () => {
        try {
            console.log('🚀 Starting performance benchmark suite...\n');
            
            const results = await benchmark.runAllBenchmarks();
            
            console.log('\n📊 Benchmark Summary:');
            console.log(`Total tests: ${results.length}`);
            console.log(`Passed: ${results.filter(r => !r.error).length}`);
            console.log(`Failed: ${results.filter(r => r.error).length}`);
            
            // 询问是否设置为新基准线
            if (!benchmark.baseline) {
                console.log('\n📏 No baseline found. Setting current results as baseline...');
                benchmark.setBaseline();
            }
            
        } catch (error) {
            console.error('❌ Benchmark suite failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = PerformanceBenchmark;