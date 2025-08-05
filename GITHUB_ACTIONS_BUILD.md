# GitHub Actions 跨平台构建指南

## 概述

本项目已配置 GitHub Actions 工作流，可以在云端自动构建 Windows、macOS 和 Linux 版本的 Electron 应用，无需在本地安装 Wine 或其他跨平台工具。

## 工作流说明

### 1. 构建工作流 (`.github/workflows/build.yml`)

**触发条件：**
- 推送代码到 `main` 分支
- 创建 Pull Request
- 手动触发

**功能：**
- 在 Windows、macOS、Linux 三个平台上并行构建应用
- 自动上传构建产物作为 Artifacts
- 构建产物保留 30 天

### 2. 发布工作流 (`.github/workflows/release.yml`)

**触发条件：**
- 创建新的 GitHub Release

**功能：**
- 自动构建所有平台的安装包
- 将构建产物自动上传到 Release 页面

## 使用方法

### 方法一：自动构建（推荐）

1. **推送代码触发构建**
   ```bash
   git add .
   git commit -m "你的提交信息"
   git push origin main
   ```

2. **查看构建结果**
   - 访问 GitHub 仓库的 "Actions" 标签页
   - 点击最新的工作流运行
   - 在 "Artifacts" 部分下载构建产物

### 方法二：手动触发构建

1. 访问 GitHub 仓库的 "Actions" 标签页
2. 点击 "Build Electron App" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支并点击 "Run workflow"

### 方法三：创建 Release 发布

1. **创建 Release**
   - 访问 GitHub 仓库的 "Releases" 页面
   - 点击 "Create a new release"
   - 设置标签版本（如 `v1.0.0`）
   - 填写发布说明
   - 点击 "Publish release"

2. **自动构建和发布**
   - GitHub Actions 会自动触发构建
   - 构建完成后，安装包会自动上传到 Release 页面

## 构建产物说明

### Windows
- `*.exe` - 安装程序
- `*.msi` - MSI 安装包（如果配置）
- `*.zip` - 便携版（如果配置）

### macOS
- `*.dmg` - macOS 磁盘映像
- `*.zip` - 压缩包版本

### Linux
- `*.AppImage` - AppImage 格式
- `*.deb` - Debian 包
- `*.rpm` - RPM 包（如果配置）

## 优势

✅ **无需本地环境**：不需要在 Mac 上安装 Wine 或其他工具  
✅ **自动化**：代码推送后自动构建  
✅ **并行构建**：三个平台同时构建，节省时间  
✅ **免费**：GitHub Actions 对公开仓库免费  
✅ **可靠性**：使用 GitHub 的云基础设施  
✅ **版本管理**：与 Git 标签和 Release 完美集成  

## 注意事项

1. **构建时间**：云端构建通常需要 5-15 分钟
2. **网络依赖**：需要稳定的网络连接下载依赖
3. **配额限制**：GitHub Actions 有使用配额限制
4. **代码签名**：如需代码签名，需要额外配置证书

## 故障排除

### 构建失败
1. 检查 Actions 日志中的错误信息
2. 确保 `package.json` 中的构建脚本正确
3. 检查 `electron-builder.json5` 配置

### 依赖问题
1. 确保 `package.json` 中的依赖版本兼容
2. 检查是否有平台特定的依赖问题

### 权限问题
1. 确保仓库有正确的 Actions 权限
2. 检查 `GITHUB_TOKEN` 权限设置

## 本地构建（备选方案）

如果需要本地构建，仍可使用以下命令：

```bash
# 构建当前平台
npm run build

# 构建 Windows 版本（需要 Wine）
npm run build:win

# 构建 macOS 版本
npm run build:mac

# 构建 Linux 版本
npm run build:linux
```

## 总结

GitHub Actions 提供了一个完美的解决方案来解决跨平台构建问题。通过云端构建，你可以：
- 避免复杂的本地环境配置
- 获得一致的构建结果
- 实现完全自动化的发布流程

推荐使用 GitHub Actions 作为主要的构建和发布方式！