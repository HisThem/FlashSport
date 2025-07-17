# GitHub Actions CI 配置文档

本项目配置了完整的持续集成工作流，包括代码质量检查、自动化测试和构建验证。

## 🔄 工作流概览

### 1. 后端 CI (`backend-ci.yml`)
- **触发条件**: 
  - Push 到 `main` 或 `develop` 分支，且修改了 `backend/` 目录
  - 对上述分支的 Pull Request
- **功能**:
  - ESLint 代码检查
  - 单元测试和覆盖率报告
  - 构建应用
  - 上传构建产物

### 2. 前端 CI (`frontend-ci.yml`)
- **触发条件**: 
  - Push 到 `main` 或 `develop` 分支，且修改了 `frontend/` 目录
  - 对上述分支的 Pull Request
- **功能**:
  - ESLint 代码检查
  - 构建验证
  - 上传构建产物

### 3. 全栈 CI (`full-stack-ci.yml`)
- **触发条件**: 
  - Push 到 `main` 分支
  - 对 `main` 分支的 Pull Request
- **功能**:
  - 智能检测变更的模块
  - 并行执行前后端 CI
  - 安全扫描
  - 依赖审查

### 4. 代码质量检查 (`code-quality.yml`)
- **触发条件**: 
  - Push 到 `main` 或 `develop` 分支
  - Pull Request
- **功能**:
  - ESLint 检查
  - 测试覆盖率
  - CodeQL 安全分析
  - 许可证检查
  - 性能测试

## 🔧 配置说明

### Node.js 版本

目前配置支持 Node.js 18.x 和 20.x 版本。可以在工作流文件中的 `strategy.matrix.node-version` 部分修改。

### 构建产物

- 后端构建产物会上传到 GitHub Actions artifacts，保存 7 天
- 前端构建产物会上传到 GitHub Actions artifacts，保存 7 天

### 测试配置

- 后端支持单元测试、覆盖率测试和 E2E 测试
- 前端支持构建验证，可以添加单元测试和 E2E 测试

## 📋 依赖管理

### Dependabot 配置

项目配置了 Dependabot 自动更新依赖：
- 前后端 npm 依赖每周一检查
- GitHub Actions 每月检查
- 忽略主版本更新（需要手动审查）

### 安全扫描

- CodeQL 自动扫描安全漏洞
- npm audit 检查依赖安全性
- 依赖审查（PR 时）

## 🎯 使用建议

### 分支策略

建议采用以下分支策略：
- `main`: 主分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支

### 提交规范

建议使用约定式提交规范：
```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或工具变动
```

### Pull Request

- 创建 PR 时会自动运行 CI 检查
- 使用提供的 PR 模板
- 确保所有检查通过后再合并

## 🚀 快速开始

1. Fork 并 clone 仓库
2. 推送代码触发工作流
3. 查看 Actions 页面监控执行状态

## 📞 故障排除

### 常见问题

1. **构建失败**: 检查 Node.js 版本和依赖
2. **测试失败**: 确保所有测试用例正确
3. **权限错误**: 确保 GITHUB_TOKEN 有足够权限

### 调试技巧

- 查看 Actions 日志定位问题
- 本地运行相同命令验证
- 参考官方文档和社区解决方案

---

如有问题，请创建 Issue 或联系维护者。
