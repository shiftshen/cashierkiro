# 🔄 开发工作流程规范

## 🎯 目标
建立安全、高效的开发流程，避免直接向生产仓库提交未测试代码。

## 🌳 分支管理策略

### 分支结构
```
main (生产分支)
├── develop (开发主分支)
├── feature/* (功能分支)
├── bugfix/* (bug修复分支)
├── hotfix/* (紧急修复分支)
└── release/* (发布分支)
```

### 分支说明
- **main**: 生产环境代码，只接受经过测试的合并
- **develop**: 开发主分支，集成所有功能
- **feature/***: 新功能开发分支
- **bugfix/***: bug修复分支
- **hotfix/***: 生产环境紧急修复
- **release/***: 发布准备分支

## 🔧 开发流程

### 1. 功能开发流程
```bash
# 1. 从develop创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/功能名称

# 2. 开发和提交
git add .
git commit -m "feat: 添加新功能描述"

# 3. 推送到远程
git push origin feature/功能名称

# 4. 创建Pull Request到develop分支
# 5. 代码审查通过后合并
# 6. 删除功能分支
```

### 2. Bug修复流程
```bash
# 1. 从develop创建修复分支
git checkout develop
git pull origin develop
git checkout -b bugfix/bug描述

# 2. 修复和提交
git add .
git commit -m "fix: 修复具体问题描述"

# 3. 推送和合并（同功能开发）
```

### 3. 紧急修复流程
```bash
# 1. 从main创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/紧急修复描述

# 2. 修复和提交
git add .
git commit -m "hotfix: 紧急修复描述"

# 3. 同时合并到main和develop
git checkout main
git merge hotfix/紧急修复描述
git checkout develop
git merge hotfix/紧急修复描述
```

## 📝 提交信息规范

### 提交类型
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 提交格式
```
<类型>(<范围>): <描述>

<详细说明>

<相关Issue>
```

### 示例
```bash
git commit -m "feat(login): 添加记住密码功能

- 添加记住密码复选框
- 实现本地存储加密
- 添加自动填充逻辑

Closes #123"
```

## 🧪 测试流程

### 1. 本地测试
```bash
# 启动开发服务器
npm run dev

# 运行单元测试
npm run test

# 运行E2E测试
npm run test:e2e
```

### 2. 集成测试
- 在develop分支进行集成测试
- 确保所有功能正常工作
- 验证APP和H5兼容性

### 3. 生产测试
- 在release分支进行生产环境测试
- 使用真实数据进行完整测试
- 性能和稳定性测试

## 🚀 发布流程

### 1. 准备发布
```bash
# 1. 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.4.6

# 2. 更新版本号
# 修改package.json中的version
# 更新CHANGELOG.md

# 3. 最终测试
npm run test
npm run build

# 4. 提交发布准备
git add .
git commit -m "chore: 准备发布v1.4.6"
```

### 2. 发布到生产
```bash
# 1. 合并到main
git checkout main
git merge release/v1.4.6

# 2. 创建标签
git tag -a v1.4.6 -m "发布版本v1.4.6"

# 3. 推送到远程
git push origin main
git push origin v1.4.6

# 4. 合并回develop
git checkout develop
git merge release/v1.4.6

# 5. 删除发布分支
git branch -d release/v1.4.6
```

## 🛡️ 代码审查规范

### 审查检查点
- [ ] 代码符合项目规范
- [ ] 功能实现正确
- [ ] 测试覆盖充分
- [ ] 性能影响评估
- [ ] 安全性检查
- [ ] 兼容性验证

### 审查流程
1. 创建Pull Request
2. 自动化测试通过
3. 至少一人代码审查
4. 解决审查意见
5. 合并到目标分支

## 🔒 安全规范

### 敏感信息处理
- 不提交密码、密钥等敏感信息
- 使用环境变量管理配置
- 定期检查提交历史

### 权限管理
- main分支设置保护规则
- 要求Pull Request审查
- 限制直接推送权限

## 📊 质量保证

### 自动化检查
```bash
# 代码格式检查
npm run lint

# 类型检查
npm run type-check

# 安全检查
npm audit

# 依赖检查
npm outdated
```

### 持续集成
- 自动运行测试套件
- 自动构建验证
- 自动部署到测试环境

## 🔧 开发环境配置

### 本地开发设置
```bash
# 1. 克隆仓库
git clone https://github.com/shiftshen/cashierkiro.git
cd cashierkiro

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env.local
# 编辑.env.local设置本地配置

# 4. 启动开发服务器
npm run dev
```

### 开发工具推荐
- **IDE**: HBuilderX (UniApp官方)
- **版本控制**: Git + GitHub Desktop
- **API测试**: Postman
- **调试工具**: Chrome DevTools

## 📱 移动端测试

### H5测试
```bash
# 启动H5开发服务器
npm run dev:h5

# 在浏览器中测试
# Chrome DevTools模拟移动设备
```

### APP测试
```bash
# 使用HBuilderX编译APP
# 1. 打开HBuilderX
# 2. 导入项目
# 3. 运行 -> 运行到手机或模拟器
# 4. 真机调试测试
```

## 🐛 问题处理流程

### Bug报告
1. 在GitHub Issues创建bug报告
2. 使用bug模板填写详细信息
3. 分配优先级和负责人
4. 跟踪修复进度

### 紧急问题处理
1. 立即创建hotfix分支
2. 快速修复并测试
3. 紧急发布到生产环境
4. 事后分析和改进

## 📈 性能监控

### 关键指标
- 页面加载时间
- API响应时间
- 内存使用情况
- 崩溃率统计

### 监控工具
- 性能分析工具
- 错误监控系统
- 用户行为分析

---

**建立日期**: 2025年9月21日  
**最后更新**: 2025年9月21日  
**维护团队**: 技术开发团队