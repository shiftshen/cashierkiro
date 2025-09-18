#!/usr/bin/env node

/**
 * 字体文件优化脚本
 * 移除未使用的图标，减少字体文件大小
 */

const fs = require('fs');

// 已使用的图标列表 (需要根据实际分析结果更新)
const usedIcons = [
  'jiahao1', 'jianhao', 'wode', 'shalou', 'duigou',
  'shaixuan', 'shouji', 'licai', 'icon_cut'
  // 添加更多实际使用的图标...
];

// 优化CSS文件
function optimizeIconFont(cssFile) {
  if (!fs.existsSync(cssFile)) return;
  
  const content = fs.readFileSync(cssFile, 'utf8');
  const lines = content.split('\n');
  const optimizedLines = [];
  let skipBlock = false;
  
  lines.forEach(line => {
    // 检查是否是图标定义开始
    const iconMatch = line.match(/\.icon-([^:]+):/);
    if (iconMatch) {
      const iconName = iconMatch[1];
      skipBlock = !usedIcons.includes(iconName);
    }
    
    // 如果不在跳过块中，保留这行
    if (!skipBlock) {
      optimizedLines.push(line);
    }
    
    // 检查块结束
    if (line.includes('}') && skipBlock) {
      skipBlock = false;
    }
  });
  
  // 写回优化后的内容
  const optimizedContent = optimizedLines.join('\n');
  fs.writeFileSync(cssFile + '.optimized', optimizedContent);
  
  console.log(`✅ 优化完成: ${cssFile}.optimized`);
}

// 执行优化
console.log('🔤 开始字体优化...');
optimizeIconFont('common/icons/iconfont.css');
optimizeIconFont('common/icon/iconfont.css');
console.log('🎉 字体优化完成!');
