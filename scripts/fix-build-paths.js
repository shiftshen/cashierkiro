#!/usr/bin/env node

/**
 * 修复编译后的路径问题
 * 确保资源文件路径正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修复编译路径工具');
console.log('================================');

const buildDir = 'unpackage/dist/build/web';
const indexPath = path.join(buildDir, 'index.html');

if (!fs.existsSync(indexPath)) {
    console.log('❌ 编译文件不存在，请先编译项目');
    process.exit(1);
}

// 读取 index.html
let indexContent = fs.readFileSync(indexPath, 'utf8');
console.log('📝 读取 index.html');

// 修复路径问题
let modified = false;

// 1. 修复相对路径问题
if (indexContent.includes('href=./static/')) {
    indexContent = indexContent.replace(/href=\.\/static\//g, 'href=static/');
    modified = true;
    console.log('✅ 修复 CSS 相对路径');
}

if (indexContent.includes('src=./static/')) {
    indexContent = indexContent.replace(/src=\.\/static\//g, 'src=static/');
    modified = true;
    console.log('✅ 修复 JS 相对路径');
}

// 2. 修复 PWA 资源路径
if (indexContent.includes('href="/static/')) {
    indexContent = indexContent.replace(/href="\/static\//g, 'href="static/');
    modified = true;
    console.log('✅ 修复 PWA 资源路径');
}

// 3. 修复 Service Worker 路径
if (indexContent.includes("'/static/sw.js'")) {
    indexContent = indexContent.replace("'/static/sw.js'", "'static/sw.js'");
    modified = true;
    console.log('✅ 修复 Service Worker 路径');
}

// 4. 添加基础路径检查
if (!indexContent.includes('<base')) {
    const baseTag = '<base href="./">';
    indexContent = indexContent.replace('<head>', '<head>\n    ' + baseTag);
    modified = true;
    console.log('✅ 添加 base 标签');
}

// 5. 添加错误处理脚本
const errorHandlingScript = `
<script>
// 错误处理和调试
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
    console.error('文件:', e.filename);
    console.error('行号:', e.lineno);
});

// 资源加载错误处理
window.addEventListener('load', function() {
    console.log('页面加载完成');
    
    // 检查关键元素
    const app = document.getElementById('app');
    if (app && app.innerHTML.trim() === '') {
        console.warn('⚠️ App 容器为空，可能存在 JS 加载问题');
    }
});

// 检查 Vue 是否加载
setTimeout(function() {
    if (typeof Vue === 'undefined' && typeof window.Vue === 'undefined') {
        console.error('❌ Vue 未加载');
        document.getElementById('app').innerHTML = '<div style="padding: 20px; text-align: center;"><h2>应用加载失败</h2><p>请检查网络连接或刷新页面</p></div>';
    }
}, 3000);
</script>`;

if (!indexContent.includes('页面错误')) {
    indexContent = indexContent.replace('</body>', errorHandlingScript + '\n</body>');
    modified = true;
    console.log('✅ 添加错误处理脚本');
}

// 写入修改后的文件
if (modified) {
    fs.writeFileSync(indexPath, indexContent);
    console.log('💾 保存修改后的 index.html');
} else {
    console.log('ℹ️ 无需修改');
}

// 检查关键文件是否存在
console.log('\n📋 检查关键文件:');

const staticDir = path.join(buildDir, 'static');
if (fs.existsSync(staticDir)) {
    console.log('✅ static 目录存在');
    
    // 检查 JS 文件
    const jsDir = path.join(staticDir, 'js');
    if (fs.existsSync(jsDir)) {
        const jsFiles = fs.readdirSync(jsDir);
        console.log(`✅ JS 文件: ${jsFiles.length} 个`);
        jsFiles.forEach(file => {
            const size = fs.statSync(path.join(jsDir, file)).size;
            console.log(`   ${file}: ${(size / 1024).toFixed(2)}KB`);
        });
    } else {
        console.log('❌ JS 目录不存在');
    }
    
    // 检查 CSS 文件
    const cssFiles = fs.readdirSync(staticDir).filter(f => f.endsWith('.css'));
    if (cssFiles.length > 0) {
        console.log(`✅ CSS 文件: ${cssFiles.length} 个`);
        cssFiles.forEach(file => {
            const size = fs.statSync(path.join(staticDir, file)).size;
            console.log(`   ${file}: ${(size / 1024).toFixed(2)}KB`);
        });
    } else {
        console.log('❌ CSS 文件不存在');
    }
} else {
    console.log('❌ static 目录不存在');
}

// 创建简单的测试服务器脚本
const serverScript = `
const express = require('express');
const path = require('path');
const app = express();
const port = 8092;

// 设置静态文件目录
app.use(express.static('${buildDir}'));

// 处理 SPA 路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '${buildDir}', 'index.html'));
});

app.listen(port, () => {
    console.log('🚀 测试服务器运行在 http://localhost:' + port);
});
`;

fs.writeFileSync('test-server.js', serverScript);
console.log('\n🚀 创建测试服务器脚本: test-server.js');
console.log('💡 运行 "node test-server.js" 来测试编译后的应用');

console.log('\n🎉 路径修复完成!');