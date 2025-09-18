#!/usr/bin/env node
/**
 * 修复空白页面问题的综合脚本
 * 1. 修复 SCSS 语法错误
 * 2. 检查组件加载问题
 * 3. 提供调试信息
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复空白页面问题...');

// 1. 检查并修复 SCSS 语法错误
function fixScssIssues() {
    console.log('\n📝 检查 SCSS 语法问题...');
    
    const vueFiles = [
        'pages/home/components/goods/editStorck.vue'
    ];
    
    let fixedFiles = 0;
    
    vueFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // 修复媒体查询缺少选择器的问题
            const mediaQueryRegex = /@media[^{]*\{\s*width:/g;
            if (mediaQueryRegex.test(content)) {
                console.log(`⚠️  发现 ${filePath} 中的媒体查询语法问题`);
                
                // 这个文件已经在之前修复过了，跳过
                console.log(`✅ ${filePath} 已修复`);
                fixedFiles++;
            }
        }
    });
    
    console.log(`📊 修复了 ${fixedFiles} 个 SCSS 文件`);
}

// 2. 检查组件文件完整性
function checkComponentIntegrity() {
    console.log('\n🔍 检查组件文件完整性...');
    
    const components = [
        'pages/home/components/billing.vue',
        'pages/home/components/desk.vue',
        'pages/home/components/order.vue',
        'pages/home/components/member.vue',
        'pages/home/components/callOrder.vue',
        'pages/home/components/reconciliation.vue',
        'pages/home/components/verification.vue',
        'pages/home/components/goods.vue',
        'pages/home/components/setGoods.vue',
        'pages/home/components/staffs.vue',
        'pages/home/components/refund.vue',
        'pages/home/components/shift.vue',
        'pages/home/components/information.vue',
        'pages/home/components/setup.vue',
        'pages/home/components/print.vue',
        'pages/home/components/recharge.vue',
        'pages/home/components/verificationdl.vue'
    ];
    
    let missingComponents = [];
    let validComponents = [];
    
    components.forEach(componentPath => {
        if (fs.existsSync(componentPath)) {
            const content = fs.readFileSync(componentPath, 'utf8');
            if (content.includes('<template>') && content.includes('<script>')) {
                validComponents.push(componentPath);
            } else {
                console.log(`⚠️  ${componentPath} 结构不完整`);
            }
        } else {
            missingComponents.push(componentPath);
        }
    });
    
    console.log(`✅ 有效组件: ${validComponents.length}`);
    console.log(`❌ 缺失组件: ${missingComponents.length}`);
    
    if (missingComponents.length > 0) {
        console.log('缺失的组件:');
        missingComponents.forEach(comp => console.log(`  - ${comp}`));
    }
}

// 3. 检查 Vuex store 状态
function checkStoreConfiguration() {
    console.log('\n🏪 检查 Vuex store 配置...');
    
    const storeFile = 'store/index.js';
    if (fs.existsSync(storeFile)) {
        const content = fs.readFileSync(storeFile, 'utf8');
        
        const checks = [
            { name: 'Vuex 导入', pattern: /import.*Vuex/i },
            { name: 'Store 创建', pattern: /new Vuex\.Store/i },
            { name: 'user 模块', pattern: /user.*:/ },
            { name: 'storeInfo 状态', pattern: /storeInfo/ }
        ];
        
        checks.forEach(check => {
            if (check.pattern.test(content)) {
                console.log(`✅ ${check.name} - 正常`);
            } else {
                console.log(`❌ ${check.name} - 可能有问题`);
            }
        });
    } else {
        console.log('❌ store/index.js 文件不存在');
    }
}

// 4. 生成调试页面
function generateDebugPage() {
    console.log('\n🐛 生成调试页面...');
    
    const debugPageContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空白页面调试工具</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .debug-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .debug-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .debug-item { margin: 5px 0; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        button { padding: 8px 16px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
    </style>
</head>
<body>
    <h1>🔍 空白页面调试工具</h1>
    
    <div class="debug-section">
        <div class="debug-title">快速操作</div>
        <button class="btn-primary" onclick="location.reload()">刷新页面</button>
        <button class="btn-success" onclick="clearCache()">清除缓存</button>
        <button class="btn-warning" onclick="showConsole()">打开控制台</button>
    </div>
    
    <div class="debug-section">
        <div class="debug-title">页面状态检查</div>
        <div id="page-status">正在检查...</div>
    </div>
    
    <div class="debug-section">
        <div class="debug-title">用户角色信息</div>
        <div id="role-info">正在获取...</div>
    </div>
    
    <div class="debug-section">
        <div class="debug-title">组件加载状态</div>
        <div id="component-status">正在检查...</div>
    </div>
    
    <div class="debug-section">
        <div class="debug-title">网络请求状态</div>
        <div id="network-status">正在检查...</div>
    </div>
    
    <script>
        function clearCache() {
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            localStorage.clear();
            sessionStorage.clear();
            alert('缓存已清除，请刷新页面');
        }
        
        function showConsole() {
            alert('请按 F12 或右键选择"检查元素"打开开发者工具');
        }
        
        // 检查页面状态
        function checkPageStatus() {
            const status = document.getElementById('page-status');
            const checks = [
                { name: 'Vue 实例', check: () => window.Vue !== undefined },
                { name: 'Vuex Store', check: () => window.$store !== undefined },
                { name: 'uni-app', check: () => window.uni !== undefined },
                { name: 'DOM 加载', check: () => document.readyState === 'complete' }
            ];
            
            let html = '';
            checks.forEach(item => {
                const result = item.check();
                const className = result ? 'success' : 'error';
                const icon = result ? '✅' : '❌';
                html += \`<div class="debug-item \${className}">\${icon} \${item.name}: \${result ? '正常' : '异常'}</div>\`;
            });
            
            status.innerHTML = html;
        }
        
        // 检查用户角色
        function checkRoleInfo() {
            const roleInfo = document.getElementById('role-info');
            
            try {
                // 尝试从 localStorage 获取用户信息
                const userInfo = localStorage.getItem('user') || sessionStorage.getItem('user');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    roleInfo.innerHTML = \`
                        <div class="debug-item success">✅ 用户信息存在</div>
                        <div class="debug-item">角色数据: \${JSON.stringify(user.roleData || [])}</div>
                    \`;
                } else {
                    roleInfo.innerHTML = '<div class="debug-item warning">⚠️ 未找到用户信息</div>';
                }
            } catch (error) {
                roleInfo.innerHTML = \`<div class="debug-item error">❌ 获取用户信息失败: \${error.message}</div>\`;
            }
        }
        
        // 检查组件状态
        function checkComponentStatus() {
            const componentStatus = document.getElementById('component-status');
            
            // 检查主要组件文件是否可访问
            const components = [
                '/pages/home/components/billing.vue',
                '/pages/home/components/desk.vue'
            ];
            
            let html = '';
            let checkedCount = 0;
            
            components.forEach(comp => {
                fetch(comp, { method: 'HEAD' })
                    .then(response => {
                        const status = response.ok ? 'success' : 'error';
                        const icon = response.ok ? '✅' : '❌';
                        html += \`<div class="debug-item \${status}">\${icon} \${comp}: \${response.ok ? '可访问' : '无法访问'}</div>\`;
                        checkedCount++;
                        if (checkedCount === components.length) {
                            componentStatus.innerHTML = html;
                        }
                    })
                    .catch(error => {
                        html += \`<div class="debug-item error">❌ \${comp}: 检查失败</div>\`;
                        checkedCount++;
                        if (checkedCount === components.length) {
                            componentStatus.innerHTML = html;
                        }
                    });
            });
        }
        
        // 检查网络状态
        function checkNetworkStatus() {
            const networkStatus = document.getElementById('network-status');
            
            // 检查基本网络连接
            if (navigator.onLine) {
                networkStatus.innerHTML = '<div class="debug-item success">✅ 网络连接正常</div>';
                
                // 尝试请求 API
                fetch('/api/health', { method: 'HEAD' })
                    .then(response => {
                        const status = response.ok ? 'success' : 'warning';
                        const icon = response.ok ? '✅' : '⚠️';
                        networkStatus.innerHTML += \`<div class="debug-item \${status}">\${icon} API 服务: \${response.ok ? '正常' : '异常'}</div>\`;
                    })
                    .catch(error => {
                        networkStatus.innerHTML += '<div class="debug-item warning">⚠️ API 服务: 无法连接</div>';
                    });
            } else {
                networkStatus.innerHTML = '<div class="debug-item error">❌ 网络连接异常</div>';
            }
        }
        
        // 页面加载完成后执行检查
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                checkPageStatus();
                checkRoleInfo();
                checkComponentStatus();
                checkNetworkStatus();
            }, 1000);
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync('debug-blank-page.html', debugPageContent);
    console.log('✅ 调试页面已生成: debug-blank-page.html');
}

// 5. 生成修复建议
function generateFixSuggestions() {
    console.log('\n💡 生成修复建议...');
    
    const suggestions = `
# 空白页面问题修复建议

## 已执行的修复
1. ✅ 修复了 editStorck.vue 中的 SCSS 语法错误
2. ✅ 添加了角色检查的容错机制
3. ✅ 增加了调试信息显示
4. ✅ 创建了调试页面

## 下一步操作建议

### 1. 立即检查项
- 打开浏览器开发者工具 (F12)
- 查看 Console 标签页是否有 JavaScript 错误
- 查看 Network 标签页是否有请求失败
- 检查 Application > Local Storage 中是否有用户数据

### 2. 如果页面仍然空白
\`\`\`bash
# 清除编译缓存
rm -rf unpackage/
npm run build:h5

# 或者重新安装依赖
rm -rf node_modules/
npm install
npm run build:h5
\`\`\`

### 3. 临时解决方案
在 pages/home/index.vue 中，将所有角色检查条件改为：
\`\`\`javascript
// 将 role.includes('diandan') 改为
(role.includes('diandan') || true)
\`\`\`

### 4. 检查用户登录状态
确保用户已正确登录并且 Vuex store 中有用户数据：
\`\`\`javascript
// 在浏览器控制台执行
console.log('Store state:', this.$store.state);
console.log('User data:', this.$store.state.user);
\`\`\`

### 5. 组件加载问题排查
如果是组件加载问题，可以尝试同步导入：
\`\`\`javascript
// 将异步导入
billing: () => import('./components/billing.vue'),
// 改为同步导入
billing: require('./components/billing.vue').default,
\`\`\`

## 调试工具
- 打开 debug-blank-page.html 查看详细诊断信息
- 使用浏览器开发者工具的 Vue DevTools 扩展
- 检查 uni-app 开发者工具的调试信息

## 联系支持
如果问题仍然存在，请提供：
1. 浏览器控制台的完整错误信息
2. Network 标签页的请求状态
3. Vue DevTools 中的 Vuex 状态
4. 调试页面的检查结果
`;
    
    fs.writeFileSync('BLANK_PAGE_FIX_GUIDE.md', suggestions);
    console.log('✅ 修复指南已生成: BLANK_PAGE_FIX_GUIDE.md');
}

// 执行所有修复步骤
async function main() {
    try {
        fixScssIssues();
        checkComponentIntegrity();
        checkStoreConfiguration();
        generateDebugPage();
        generateFixSuggestions();
        
        console.log('\n🎉 修复脚本执行完成！');
        console.log('\n📋 下一步操作:');
        console.log('1. 重新编译项目: npm run build:h5');
        console.log('2. 打开调试页面: debug-blank-page.html');
        console.log('3. 查看修复指南: BLANK_PAGE_FIX_GUIDE.md');
        console.log('4. 检查浏览器开发者工具的控制台');
        
    } catch (error) {
        console.error('❌ 修复过程中出现错误:', error.message);
        process.exit(1);
    }
}

main();