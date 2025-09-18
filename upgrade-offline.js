#!/usr/bin/env node

// DAMO Cashier 离线功能升级脚本

const fs = require('fs');
const path = require('path');

console.log('🚀 开始升级 DAMO Cashier 离线功能...');
console.log('=====================================');

// 检查必要文件
const requiredFiles = [
  'common/request.js',
  'store/index.js', 
  'App.vue',
  'pages/home/index.vue',
  'package.json'
];

console.log('📋 检查必要文件...');
let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('❌ 缺少必要文件，请确保在项目根目录运行此脚本');
  process.exit(1);
}

// 检查是否已安装 localforage
console.log('\n📦 检查依赖...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasLocalforage = packageJson.dependencies?.localforage || packageJson.devDependencies?.localforage;

if (!hasLocalforage) {
  console.log('⚠️  需要安装 localforage 依赖');
  console.log('请运行: npm install localforage');
  console.log('然后重新运行此升级脚本');
  process.exit(1);
} else {
  console.log('✅ localforage 依赖已安装');
}

// 备份原文件
console.log('\n💾 备份原文件...');
const backupDir = 'backup_' + Date.now();
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const filesToBackup = ['common/request.js', 'store/index.js', 'App.vue'];
for (const file of filesToBackup) {
  if (fs.existsSync(file)) {
    const backupPath = path.join(backupDir, file.replace('/', '_'));
    fs.copyFileSync(file, backupPath);
    console.log(`📁 已备份: ${file} -> ${backupPath}`);
  }
}

// 修改 common/request.js
console.log('\n🔧 升级 request.js...');
if (fs.existsSync('common/request-offline.js')) {
  // 重命名原文件
  if (fs.existsSync('common/request.js')) {
    fs.renameSync('common/request.js', 'common/request-original.js');
  }
  // 使用新的离线版本
  fs.renameSync('common/request-offline.js', 'common/request.js');
  console.log('✅ request.js 已升级为离线版本');
} else {
  console.log('❌ 找不到 common/request-offline.js 文件');
}

// 修改 store/index.js 添加离线状态
console.log('\n🔧 升级 Vuex Store...');
let storeContent = fs.readFileSync('store/index.js', 'utf8');

// 检查是否已经添加了离线状态
if (!storeContent.includes('isOnline')) {
  // 添加离线管理器导入
  if (!storeContent.includes('offline-manager')) {
    storeContent = storeContent.replace(
      "import beg from '@/common/request';",
      "import beg from '@/common/request';\nimport offlineManager from '@/common/offline-manager.js'"
    );
  }

  // 添加离线状态到 state
  const stateMatch = storeContent.match(/state:\s*{([^}]+)}/s);
  if (stateMatch) {
    const stateContent = stateMatch[1];
    const newStateContent = stateContent + `,
    
    // 离线状态管理
    isOnline: navigator.onLine,
    offlineQueue: [],
    syncStatus: 'idle' // idle, syncing, success, error`;
    
    storeContent = storeContent.replace(stateMatch[0], `state: {${newStateContent}}`);
  }

  // 添加离线相关 mutations
  const mutationsMatch = storeContent.match(/mutations:\s*{([^}]+)}/s);
  if (mutationsMatch) {
    const mutationsContent = mutationsMatch[1];
    const newMutationsContent = mutationsContent + `,
    
    // 离线相关 mutations
    SET_ONLINE_STATUS(state, status) {
      state.isOnline = status
    },
    SET_SYNC_STATUS(state, status) {
      state.syncStatus = status
    },
    ADD_TO_OFFLINE_QUEUE(state, item) {
      state.offlineQueue.push(item)
    },
    REMOVE_FROM_OFFLINE_QUEUE(state, id) {
      state.offlineQueue = state.offlineQueue.filter(item => item.id !== id)
    }`;
    
    storeContent = storeContent.replace(mutationsMatch[0], `mutations: {${newMutationsContent}}`);
  }

  // 添加离线相关 actions
  const actionsMatch = storeContent.match(/actions:\s*{([^}]+)}/s);
  if (actionsMatch) {
    const actionsContent = actionsMatch[1];
    const newActionsContent = actionsContent + `,
    
    // 初始化离线管理
    initOfflineManager({ commit }) {
      // 监听网络状态变化
      uni.$on('network-online', () => {
        commit('SET_ONLINE_STATUS', true)
        commit('SET_SYNC_STATUS', 'syncing')
      })
      
      uni.$on('network-offline', () => {
        commit('SET_ONLINE_STATUS', false)
      })
      
      uni.$on('sync-success', (data) => {
        commit('SET_SYNC_STATUS', 'success')
        setTimeout(() => {
          commit('SET_SYNC_STATUS', 'idle')
        }, 3000)
      })
    }`;
    
    storeContent = storeContent.replace(actionsMatch[0], `actions: {${newActionsContent}}`);
  }

  fs.writeFileSync('store/index.js', storeContent);
  console.log('✅ Vuex Store 已升级');
} else {
  console.log('✅ Vuex Store 已包含离线状态');
}

// 修改 App.vue 添加离线管理初始化
console.log('\n🔧 升级 App.vue...');
let appContent = fs.readFileSync('App.vue', 'utf8');

if (!appContent.includes('offline-manager')) {
  // 添加离线管理器导入
  const scriptMatch = appContent.match(/<script>([^]*?)<\/script>/);
  if (scriptMatch) {
    let scriptContent = scriptMatch[1];
    
    // 添加导入
    if (!scriptContent.includes('offline-manager')) {
      scriptContent = scriptContent.replace(
        "import i18n from '@/locale/index.js'",
        "import i18n from '@/locale/index.js'\n\timport offlineManager from '@/common/offline-manager.js'"
      );
    }

    // 在 onLaunch 中添加初始化代码
    if (scriptContent.includes('onLaunch: function()')) {
      scriptContent = scriptContent.replace(
        'this.getSocket()',
        `this.getSocket()
			
			// 初始化离线管理
			this.$store.dispatch('initOfflineManager')
			
			// 定期清理过期缓存
			setInterval(() => {
				offlineManager.clearExpiredCache()
			}, 300000) // 5分钟清理一次`
      );
    }

    const newAppContent = appContent.replace(scriptMatch[0], `<script>${scriptContent}</script>`);
    fs.writeFileSync('App.vue', newAppContent);
    console.log('✅ App.vue 已升级');
  }
} else {
  console.log('✅ App.vue 已包含离线管理');
}

// 生成升级报告
console.log('\n📊 生成升级报告...');
const report = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  upgradedFiles: [
    'common/request.js -> 离线版本',
    'store/index.js -> 添加离线状态管理',
    'App.vue -> 添加离线管理初始化'
  ],
  newFiles: [
    'common/offline-manager.js -> 离线管理器',
    'components/offline-status.vue -> 离线状态组件',
    'OFFLINE_UPGRADE_GUIDE.md -> 升级指南'
  ],
  backupLocation: backupDir,
  nextSteps: [
    '1. 在需要的页面添加 <offline-status /> 组件',
    '2. 测试离线功能',
    '3. 根据需要调整缓存策略',
    '4. 部署到生产环境'
  ]
};

fs.writeFileSync('offline-upgrade-report.json', JSON.stringify(report, null, 2));

console.log('\n🎉 离线功能升级完成!');
console.log('=====================================');
console.log('✅ 已升级的文件:');
report.upgradedFiles.forEach(file => console.log(`   - ${file}`));
console.log('\n📁 新增的文件:');
report.newFiles.forEach(file => console.log(`   - ${file}`));
console.log(`\n💾 原文件备份位置: ${backupDir}/`);
console.log('\n📖 下一步操作:');
report.nextSteps.forEach(step => console.log(`   ${step}`));
console.log('\n📚 详细文档: OFFLINE_UPGRADE_GUIDE.md');
console.log('\n🚀 现在可以测试离线功能了!');