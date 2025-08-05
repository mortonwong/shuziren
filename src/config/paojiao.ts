/**
 * 泡椒云API配置
 * 请在泡椒云后台获取您的AppKey和AppSecret
 * 文档地址: https://docs.paojiaoyun.com/
 */

export const PAOJIAO_CONFIG = {
  // API服务器配置
  host: 'api.paojiaoyun.com',
  protocol: 'http',
  
  // 应用密钥配置 - 请替换为您的实际密钥
  appKey: 'd28fqcjdqusq9crvst40',
  appSecret: '4frI2bczY1A7KWEeYv3CWvIak573096H',
  
  // 心跳检测配置
  heartbeatInterval: 60000, // 60秒心跳间隔
  
  // API端点配置
  endpoints: {
    login: '/v1/card/login',
    heartbeat: '/v1/card/heartbeat',
    logout: '/v1/card/logout'
  },
  
  // 获取完整的API基础URL
  get baseUrl() {
    return `${this.protocol}://${this.host}`
  }
}

// 验证配置是否完整
export function validateConfig(): boolean {
  return !!(PAOJIAO_CONFIG.appKey && 
           PAOJIAO_CONFIG.appSecret && 
           PAOJIAO_CONFIG.appKey !== 'your_app_key_here' &&
           PAOJIAO_CONFIG.appSecret !== 'your_app_secret_here')
}

// 获取配置状态
export function getConfigStatus(): { valid: boolean; message: string } {
  if (!PAOJIAO_CONFIG.appKey || PAOJIAO_CONFIG.appKey === 'your_app_key_here') {
    return { valid: false, message: '请配置AppKey' }
  }
  
  if (!PAOJIAO_CONFIG.appSecret || PAOJIAO_CONFIG.appSecret === 'your_app_secret_here') {
    return { valid: false, message: '请配置AppSecret' }
  }
  
  return { valid: true, message: '配置正常' }
}