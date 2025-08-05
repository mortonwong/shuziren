# 泡椒云卡密验证配置说明

## 配置步骤

### 1. 获取API密钥

1. 访问 [泡椒云官网](https://www.paojiaoyun.com/)
2. 注册并登录账户
3. 进入开发者后台
4. 创建应用并获取 `AppKey` 和 `AppSecret`

### 2. 配置密钥

编辑文件 `src/config/paojiao.ts`，将以下占位符替换为您的实际密钥：

```typescript
export const PAOJIAO_CONFIG = {
  // ...
  
  // 应用密钥配置 - 请替换为您的实际密钥
  appKey: 'your_app_key_here',     // 替换为您的AppKey
  appSecret: 'your_app_secret_here', // 替换为您的AppSecret
  
  // ...
}
```

### 3. 验证配置

配置完成后，启动应用：

```bash
npm run dev
```

进入数字人功能页面，如果配置正确，您将看到卡密验证组件正常显示。

## 功能说明

### 卡密验证流程

1. **验证卡密**：用户输入卡密进行验证
2. **自动心跳**：验证成功后自动开始心跳检测
3. **状态显示**：实时显示验证状态、剩余时间等信息
4. **功能控制**：未验证时锁定数字人功能，验证后解锁

### 状态管理

- 验证状态自动保存到本地存储
- 页面刷新后自动恢复验证状态
- 支持手动退出登录

### 安全特性

- 使用标准MD5签名算法
- 支持设备ID绑定
- 自动处理时间戳和随机数

## 故障排除

### 常见问题

1. **MD5算法错误**
   - ✅ 已修复：使用纯JavaScript MD5实现替代Web Crypto API
   - 错误信息：`Algorithm: Unrecognized name`

2. **testConnection方法不存在错误**
   - 问题：`TypeError: cardAuth.api.testConnection is not a function`
   - 原因：组件中使用了`useCardAuthStore()`创建新实例，而不是使用已初始化的实例
   - ✅ 已修复：直接导入并使用`cardAuth`实例，确保使用已初始化的API对象

3. **配置无效**
   - 检查 `AppKey` 和 `AppSecret` 是否正确
   - 确认已替换占位符文本

4. **网络错误**
   - 检查网络连接
   - 确认泡椒云服务状态
   - 使用"测试连接"按钮诊断网络问题

5. **验证失败**
   - 检查卡密是否有效
   - 确认卡密未过期
   - 检查设备绑定限制

### 测试步骤

1. **配置API密钥**
   ```typescript
   // 在 src/config/paojiao.ts 中配置
   appKey: 'your_actual_app_key',
   appSecret: 'your_actual_app_secret',
   ```

2. **测试卡密验证**
   - 启动应用：`npm run dev`
   - 访问数字人功能页面
   - 点击"验证卡密"按钮
   - 输入有效的卡密进行测试

3. **验证功能**
   - 验证成功后应显示绿色状态
   - 自动开始心跳检测
   - 数字人功能解锁可用

### 调试信息

打开浏览器开发者工具，查看控制台输出获取详细错误信息。

## API文档

更多API详情请参考：[泡椒云开发文档](https://docs.paojiaoyun.com/)