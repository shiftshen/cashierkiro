/**
 * 页面加载检测脚本
 * 在浏览器控制台中运行，帮助诊断页面刷新问题
 */

(function() {
    console.log('🔍 页面加载检测器启动');
    console.log('='.repeat(40));
    
    // 检测页面基本信息
    console.log('📋 页面基本信息:');
    console.log('- URL:', window.location.href);
    console.log('- 用户代理:', navigator.userAgent);
    console.log('- 页面标题:', document.title);
    
    // 检测Vue实例
    setTimeout(() => {
        console.log('\n🔍 Vue实例检测:');
        
        // 尝试获取Vue实例
        const app = document.querySelector('#app');
        if (app && app.__vue__) {
            const vue = app.__vue__;
            console.log('✅ Vue实例已找到');
            console.log('- 当前标签:', vue.current);
            console.log('- 用户角色:', vue.role);
            console.log('- 标签列表:', vue.tabs);
            
            // 检测组件状态
            console.log('\n🔍 组件状态检测:');
            const refMap = {
                0: 'billingRef',
                1: 'deskRef', 
                2: 'callRef',
                3: 'recontionRef',
                4: 'orderRef',
                5: 'memberRef',
                6: 'verificationRef',
                7: 'goodsRef',
                10: 'shiftRef',
                13: 'printRef',
                15: 'setGoodsRef',
                61: 'verificationdlRef'
            };
            
            Object.entries(refMap).forEach(([id, refName]) => {
                const ref = vue.$refs[refName];
                const status = ref ? '✅ 已加载' : '❌ 未加载';
                console.log(`- ${refName} (标签${id}): ${status}`);
            });
            
        } else {
            console.log('❌ Vue实例未找到');
            console.log('可能的原因:');
            console.log('1. 页面还在加载中');
            console.log('2. JavaScript错误导致Vue初始化失败');
            console.log('3. 资源加载失败');
        }
        
        // 检测错误
        console.log('\n🔍 错误检测:');
        const errors = window.console.errors || [];
        if (errors.length > 0) {
            console.log('发现错误:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        } else {
            console.log('✅ 暂无JavaScript错误');
        }
        
        // 提供修复建议
        console.log('\n🛠️ 修复建议:');
        console.log('1. 如果Vue实例未找到，请刷新页面 (Ctrl+F5)');
        console.log('2. 如果组件未加载，请点击其他菜单再返回');
        console.log('3. 如果仍有问题，请清除浏览器缓存');
        console.log('4. 检查浏览器控制台的Network标签页，确认资源加载正常');
        
    }, 2000);
    
    // 监听页面加载事件
    window.addEventListener('load', () => {
        console.log('📱 页面加载完成事件触发');
    });
    
    // 监听DOM内容加载事件
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM内容加载完成');
    });
    
    console.log('🎯 检测器已启动，2秒后显示详细结果...');
})();

// 导出检测函数供手动调用
window.detectPageStatus = function() {
    console.log('🔄 手动检测页面状态...');
    
    const app = document.querySelector('#app');
    if (app && app.__vue__) {
        const vue = app.__vue__;
        console.log('当前页面状态:');
        console.log('- 标签:', vue.current);
        console.log('- 标题:', vue.l_title);
        console.log('- 角色:', vue.role);
        
        // 尝试强制初始化
        console.log('🔧 尝试强制初始化...');
        vue.changeInit(vue.current);
        
        return vue;
    } else {
        console.log('❌ Vue实例不可用');
        return null;
    }
};

console.log('💡 提示: 可以在控制台运行 detectPageStatus() 手动检测页面状态');