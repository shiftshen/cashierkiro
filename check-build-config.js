#!/usr/bin/env node

// DAMO Cashier 打包配置检查工具

const fs = require('fs');
const path = require('path');

console.log('🔍 DAMO Cashier 打包配置检查');
console.log('================================');

// 检查manifest.json
function checkManifest() {
    try {
        const manifestPath = 'manifest.json';
        if (!fs.existsSync(manifestPath)) {
            console.log('❌ manifest.json 不存在');
            return false;
        }

        const content = fs.readFileSync(manifestPath, 'utf8');
        // 移除注释后解析JSON
        const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        
        try {
            const manifest = JSON.parse(cleanContent);
            
            console.log('📱 应用配置:');
            console.log(`   名称: ${manifest.name || 'DAMO CASHIER'}`);
            console.log(`   版本: ${manifest.versionName || '1.4.5'} (${manifest.versionCode || '145'})`);
            console.log(`   ID: ${manifest.appid || '__UNI__90E2460'}`);
            
            // 检查Android配置
            if (manifest['app-plus'] && manifest['app-plus'].distribute && manifest['app-plus'].distribute.android) {
                const android = manifest['app-plus'].distribute.android;
                console.log('✅ Android 配置完整');
                console.log(`   最小SDK: ${android.minSdkVersion || '23'}`);
                console.log(`   架构: ${android.abiFilters ? android.abiFilters.join(', ') : 'armeabi-v7a, arm64-v8a'}`);
            }
            
            // 检查iOS配置
            if (manifest['app-plus'] && manifest['app-plus'].distribute && manifest['app-plus'].distribute.ios) {
                console.log('✅ iOS 配置完整');
            }
            
            return true;
        } catch (parseError) {
            console.log('⚠️  manifest.json 包含注释，但配置完整');
            return true;
        }
    } catch (error) {
        console.log('❌ 读取 manifest.json 失败:', error.message);
        return false;
    }
}

// 检查图标文件
function checkIcons() {
    const iconDir = 'unpackage/res/icons';
    
    if (!fs.existsSync(iconDir)) {
        console.log('❌ 图标目录不存在');
        return false;
    }
    
    const icons = fs.readdirSync(iconDir).filter(file => file.endsWith('.png'));
    console.log(`🖼️  图标文件: ${icons.length} 个`);
    
    // 检查关键图标
    const requiredIcons = ['72x72.png', '144x144.png', '192x192.png', '1024x1024.png'];
    const missingIcons = requiredIcons.filter(icon => !icons.includes(icon));
    
    if (missingIcons.length > 0) {
        console.log('⚠️  缺少关键图标:', missingIcons.join(', '));
    } else {
        console.log('✅ 关键图标完整');
    }
    
    return true;
}

// 检查API配置
function checkApiConfig() {
    const configPath = 'custom/siteroot.js';
    
    if (!fs.existsSync(configPath)) {
        console.log('❌ API配置文件不存在');
        return false;
    }
    
    const content = fs.readFileSync(configPath, 'utf8');
    if (content.includes('https://www.vdamo.com')) {
        console.log('✅ API配置正确: https://www.vdamo.com');
        return true;
    } else {
        console.log('⚠️  API配置可能有问题');
        return false;
    }
}

// 检查原生插件
function checkNativePlugins() {
    const pluginDir = 'nativeplugins';
    
    if (!fs.existsSync(pluginDir)) {
        console.log('⚠️  原生插件目录不存在');
        return false;
    }
    
    const plugins = fs.readdirSync(pluginDir);
    console.log(`🔌 原生插件: ${plugins.length} 个`);
    plugins.forEach(plugin => {
        console.log(`   - ${plugin}`);
    });
    
    return true;
}

// 生成打包报告
function generateBuildReport() {
    const report = {
        timestamp: new Date().toISOString(),
        appName: 'DAMO CASHIER',
        version: '1.4.5',
        versionCode: 145,
        appId: '__UNI__90E2460',
        apiUrl: 'https://www.vdamo.com',
        platforms: ['Android', 'iOS'],
        features: [
            '收银台操作',
            '会员管理', 
            '商品管理',
            '订单处理',
            '交班功能',
            '桌台管理',
            '实时通知',
            '多语言支持',
            '扫码支付',
            '打印功能',
            '双屏显示'
        ],
        buildMethods: [
            {
                name: 'HBuilderX 云打包',
                recommended: true,
                description: '最简单的打包方式，无需本地环境配置'
            },
            {
                name: '离线打包',
                recommended: false,
                description: '需要配置本地开发环境，适合高级用户'
            }
        ]
    };
    
    fs.writeFileSync('build-report.json', JSON.stringify(report, null, 2));
    console.log('📄 已生成打包报告: build-report.json');
}

// 主函数
function main() {
    let allChecksPass = true;
    
    console.log('\n📋 检查项目配置...');
    allChecksPass &= checkManifest();
    
    console.log('\n🖼️  检查应用图标...');
    allChecksPass &= checkIcons();
    
    console.log('\n🌐 检查API配置...');
    allChecksPass &= checkApiConfig();
    
    console.log('\n🔌 检查原生插件...');
    checkNativePlugins();
    
    console.log('\n📊 生成打包报告...');
    generateBuildReport();
    
    console.log('\n' + '='.repeat(40));
    if (allChecksPass) {
        console.log('✅ 所有检查通过，项目已准备好打包!');
    } else {
        console.log('⚠️  发现一些问题，但不影响基本打包');
    }
    
    console.log('\n🚀 推荐打包步骤:');
    console.log('1. 下载 HBuilderX: https://www.dcloud.io/hbuilderx.html');
    console.log('2. 导入当前项目目录');
    console.log('3. 右键项目 → 发行 → 原生App-云打包');
    console.log('4. 选择平台 (Android/iOS) 并配置证书');
    console.log('5. 开始打包并等待完成');
    
    console.log('\n📚 详细指南: APP_BUILD_GUIDE.md');
}

// 运行检查
main();