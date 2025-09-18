#!/usr/bin/env node

/**
 * 字体和图标优化工具
 * 分析和优化iconfont使用，减少字体文件大小
 */

const fs = require('fs');
const path = require('path');

console.log('🔤 DAMO Cashier 字体图标优化工具');
console.log('================================');

// 分析字体文件
function analyzeFontFiles() {
  console.log('📊 分析字体文件...');
  
  const fontDirs = ['common/icons', 'common/icon'];
  const fontAnalysis = {};
  
  fontDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const fontFiles = files.filter(file => /\.(ttf|woff|woff2)$/.test(file));
      
      fontAnalysis[dir] = {
        files: [],
        totalSize: 0
      };
      
      fontFiles.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        const fileInfo = {
          name: file,
          size: stat.size,
          sizeKB: (stat.size / 1024).toFixed(2)
        };
        
        fontAnalysis[dir].files.push(fileInfo);
        fontAnalysis[dir].totalSize += stat.size;
      });
      
      fontAnalysis[dir].totalSizeKB = (fontAnalysis[dir].totalSize / 1024).toFixed(2);
    }
  });
  
  return fontAnalysis;
}

// 分析图标使用情况
function analyzeIconUsage() {
  console.log('\\n🔍 分析图标使用情况...');
  
  const usedIcons = new Set();
  const iconDefinitions = new Map();
  
  // 读取图标定义
  const cssFiles = ['common/icons/iconfont.css', 'common/icon/iconfont.css'];
  
  cssFiles.forEach(cssFile => {
    if (fs.existsSync(cssFile)) {
      const content = fs.readFileSync(cssFile, 'utf8');
      const iconMatches = content.match(/\\.icon-([^:]+):before/g);
      
      if (iconMatches) {
        iconMatches.forEach(match => {
          const iconName = match.match(/\\.icon-([^:]+):/)[1];
          iconDefinitions.set(iconName, cssFile);
        });
      }
    }
  });
  
  // 扫描Vue文件中的图标使用
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.vue')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 查找icon-xxx类名
        const iconMatches = content.match(/icon-[a-zA-Z0-9_-]+/g);
        if (iconMatches) {
          iconMatches.forEach(iconClass => {
            const iconName = iconClass.replace('icon-', '');
            usedIcons.add(iconName);
          });
        }
      }
    });
  }
  
  // 扫描pages和components目录
  ['pages', 'components'].forEach(dir => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    }
  });
  
  return {
    defined: iconDefinitions,
    used: usedIcons,
    unused: Array.from(iconDefinitions.keys()).filter(icon => !usedIcons.has(icon))
  };
}

// 生成优化建议
function generateOptimizationSuggestions(fontAnalysis, iconUsage) {
  console.log('\\n💡 优化建议:');
  console.log('================================');
  
  // 字体文件分析
  console.log('📦 字体文件分析:');
  Object.entries(fontAnalysis).forEach(([dir, analysis]) => {
    console.log(`\\n   ${dir}:`);
    console.log(`   总大小: ${analysis.totalSizeKB}KB`);
    
    analysis.files.forEach(file => {
      console.log(`     ${file.name}: ${file.sizeKB}KB`);
    });
  });
  
  // 图标使用分析
  console.log(`\\n🎨 图标使用分析:`);
  console.log(`   已定义图标: ${iconUsage.defined.size} 个`);
  console.log(`   实际使用: ${iconUsage.used.size} 个`);
  console.log(`   未使用: ${iconUsage.unused.length} 个`);
  
  if (iconUsage.unused.length > 0) {
    console.log(`\\n⚠️  未使用的图标 (前10个):`);
    iconUsage.unused.slice(0, 10).forEach(icon => {
      console.log(`     icon-${icon}`);
    });
    
    if (iconUsage.unused.length > 10) {
      console.log(`     ... 还有 ${iconUsage.unused.length - 10} 个未使用图标`);
    }
  }
  
  // 优化建议
  console.log(`\\n🚀 优化建议:`);
  
  // 1. 字体格式优化
  console.log('1. 字体格式优化:');
  console.log('   - 优先使用 woff2 格式 (压缩率最高)');
  console.log('   - 移除 ttf 格式 (体积最大)');
  console.log('   - 保留 woff 作为兼容性后备');
  
  // 2. 图标精简
  if (iconUsage.unused.length > 0) {
    const reductionPercent = Math.round((iconUsage.unused.length / iconUsage.defined.size) * 100);
    console.log(`\\n2. 图标精简:`);
    console.log(`   - 移除 ${iconUsage.unused.length} 个未使用图标`);
    console.log(`   - 预计减少字体文件大小 ${reductionPercent}%`);
  }
  
  // 3. 重复字体处理
  if (Object.keys(fontAnalysis).length > 1) {
    console.log(`\\n3. 重复字体处理:`);
    console.log('   - 发现多套字体文件，建议合并');
    console.log('   - 统一使用一套图标字体');
  }
  
  // 4. SVG图标替代
  console.log(`\\n4. SVG图标替代:`);
  console.log('   - 考虑将常用图标转换为SVG组件');
  console.log('   - SVG支持多色彩和更好的缩放');
  console.log('   - 可以按需加载，减少初始包大小');
}

// 创建SVG图标组件示例
function createSVGIconExample() {
  console.log('\\n🎨 创建SVG图标组件示例...');
  
  const svgIconComponent = `<template>
  <view class="svg-icon" :style="iconStyle" @click="handleClick">
    <!-- 加号图标 -->
    <svg v-if="name === 'add'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" :fill="color"/>
    </svg>
    
    <!-- 减号图标 -->
    <svg v-else-if="name === 'minus'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" :fill="color"/>
    </svg>
    
    <!-- 用户图标 -->
    <svg v-else-if="name === 'user'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" :fill="color"/>
    </svg>
    
    <!-- 时间图标 -->
    <svg v-else-if="name === 'time'" viewBox="0 0 24 24" :width="size" :height="size">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" :fill="color"/>
      <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" :fill="color"/>
    </svg>
    
    <!-- 默认图标 -->
    <svg v-else viewBox="0 0 24 24" :width="size" :height="size">
      <circle cx="12" cy="12" r="10" :fill="color"/>
    </svg>
  </view>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    color: {
      type: String,
      default: '#333'
    }
  },
  
  computed: {
    iconStyle() {
      return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: this.size + 'px',
        height: this.size + 'px'
      }
    }
  },
  
  methods: {
    handleClick() {
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
.svg-icon {
  cursor: pointer;
  transition: opacity 0.2s;
}

.svg-icon:hover {
  opacity: 0.8;
}
</style>`;

  fs.writeFileSync('components/common/svg-icon.vue', svgIconComponent);
  console.log('✅ 已创建SVG图标组件: components/common/svg-icon.vue');
}

// 创建字体优化脚本
function createFontOptimizationScript() {
  console.log('\\n🔧 创建字体优化脚本...');
  
  const optimizationScript = `#!/usr/bin/env node

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
  const lines = content.split('\\n');
  const optimizedLines = [];
  let skipBlock = false;
  
  lines.forEach(line => {
    // 检查是否是图标定义开始
    const iconMatch = line.match(/\\.icon-([^:]+):/);
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
  const optimizedContent = optimizedLines.join('\\n');
  fs.writeFileSync(cssFile + '.optimized', optimizedContent);
  
  console.log(\`✅ 优化完成: \${cssFile}.optimized\`);
}

// 执行优化
console.log('🔤 开始字体优化...');
optimizeIconFont('common/icons/iconfont.css');
optimizeIconFont('common/icon/iconfont.css');
console.log('🎉 字体优化完成!');
`;

  fs.writeFileSync('scripts/optimize-font-subset.js', optimizationScript);
  console.log('✅ 已创建字体优化脚本: scripts/optimize-font-subset.js');
}

// 生成字体加载优化建议
function generateFontLoadingOptimization() {
  console.log('\\n⚡ 字体加载优化建议:');
  console.log('================================');
  
  console.log('1. 字体预加载:');
  console.log('   在HTML头部添加:');
  console.log('   <link rel="preload" href="/common/icons/iconfont.woff2" as="font" type="font/woff2" crossorigin>');
  
  console.log('\\n2. 字体显示策略:');
  console.log('   在CSS中添加:');
  console.log('   font-display: swap; /* 立即显示后备字体，字体加载完成后替换 */');
  
  console.log('\\n3. 字体子集化:');
  console.log('   - 使用fonttools或其他工具创建字体子集');
  console.log('   - 只包含实际使用的字符和图标');
  
  console.log('\\n4. 渐进式加载:');
  console.log('   - 核心图标使用内联SVG');
  console.log('   - 次要图标使用字体文件');
  console.log('   - 装饰性图标延迟加载');
}

// 主函数
function main() {
  const fontAnalysis = analyzeFontFiles();
  const iconUsage = analyzeIconUsage();
  
  generateOptimizationSuggestions(fontAnalysis, iconUsage);
  createSVGIconExample();
  createFontOptimizationScript();
  generateFontLoadingOptimization();
  
  console.log('\\n🎉 字体图标优化分析完成!');
  console.log('\\n📋 下一步行动:');
  console.log('1. 审查未使用的图标列表');
  console.log('2. 运行字体优化脚本');
  console.log('3. 测试SVG图标组件');
  console.log('4. 实施字体加载优化');
  console.log('5. 验证优化效果');
}

main();