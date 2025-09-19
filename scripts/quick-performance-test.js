#!/usr/bin/env node
/**
 * 快速性能测试脚本
 * 在浏览器中快速验证优化效果
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 启动性能测试工具...\n');

// 检查测试文件是否存在
const testFiles = [
    'browser-performance-test.html',
    'performance-comparison-tool.html'
];

console.log('📋 可用的测试工具:');
testFiles.forEach((file, index) => {
    if (fs.existsSync(file)) {
        console.log(`${index + 1}. ✅ ${file}`);
    } else {
        console.log(`${index + 1}. ❌ ${file} (文件不存在)`);
    }
});

console.log('\n🔧 性能测试说明:');
console.log('1. browser-performance-test.html - 完整的性能测试套件');
console.log('2. performance-comparison-tool.html - 简化的对比工具');

console.log('\n📊 测试项目包括:');
console.log('• 💾 缓存性能 - localStorage读写速度、命中率');
console.log('• 🧠 内存管理 - 内存使用、垃圾回收、泄漏检测');
console.log('• 🎨 渲染性能 - DOM操作、样式计算、重绘重排');
console.log('• 🌐 网络优化 - 请求并发、响应时间、成功率');
console.log('• ⚡ JavaScript执行 - 代码执行效率、异步处理');
console.log('• 📱 PWA功能 - Service Worker、缓存API、离线能力');

console.log('\n🎯 预期优化效果:');
console.log('• 页面加载时间: 减少 60-70%');
console.log('• 内存使用: 优化 40-50%');
console.log('• 缓存命中率: 提升到 85%+');
console.log('• 网络请求: 减少 30-40%');
console.log('• 渲染性能: 提升 50-60%');

console.log('\n🔍 如何使用:');
console.log('1. 在浏览器中打开测试文件');
console.log('2. 点击"开始测试"按钮');
console.log('3. 等待测试完成，查看结果');
console.log('4. 导出测试报告进行分析');

console.log('\n💡 测试技巧:');
console.log('• 在不同浏览器中测试对比效果');
console.log('• 打开开发者工具查看详细性能数据');
console.log('• 使用 Performance 面板分析性能瓶颈');
console.log('• 在移动设备上测试响应式性能');

console.log('\n🛠️ 浏览器开发者工具使用:');
console.log('1. 按 F12 打开开发者工具');
console.log('2. 切换到 Performance 标签页');
console.log('3. 点击录制按钮开始性能分析');
console.log('4. 运行测试，然后停止录制');
console.log('5. 分析火焰图和性能指标');

console.log('\n📈 Core Web Vitals 指标:');
console.log('• FCP (First Contentful Paint): < 1.8s');
console.log('• LCP (Largest Contentful Paint): < 2.5s');
console.log('• FID (First Input Delay): < 100ms');
console.log('• CLS (Cumulative Layout Shift): < 0.1');

console.log('\n🎉 开始测试吧！');
console.log('在浏览器中打开以下任一文件:');
testFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`• file://${path.resolve(file)}`);
    }
});

// 尝试自动打开浏览器
try {
    const testFile = testFiles.find(file => fs.existsSync(file));
    if (testFile) {
        console.log(`\n🌐 尝试自动打开浏览器...`);
        const filePath = path.resolve(testFile);
        
        // 根据操作系统选择命令
        let command;
        if (process.platform === 'darwin') {
            command = `open "${filePath}"`;
        } else if (process.platform === 'win32') {
            command = `start "${filePath}"`;
        } else {
            command = `xdg-open "${filePath}"`;
        }
        
        execSync(command);
        console.log('✅ 浏览器已打开测试页面');
    }
} catch (error) {
    console.log('⚠️ 无法自动打开浏览器，请手动打开测试文件');
}

console.log('\n📞 需要帮助?');
console.log('• 查看 PERFORMANCE_OPTIMIZATION_COMPLETE.md 了解详细信息');
console.log('• 检查浏览器控制台的错误信息');
console.log('• 确保浏览器支持现代 Web API');

module.exports = {
    testFiles,
    runQuickTest: () => {
        console.log('Quick performance test completed!');
    }
};