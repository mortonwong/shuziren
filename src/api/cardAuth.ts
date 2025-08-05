/**
 * 泡椒云卡密验证API服务
 */

import CryptoJS from 'crypto-js'

export interface CardAuthConfig {
  appKey: string
  appSecret: string
  baseUrl?: string
}

export interface CardLoginParams {
  app_key: string
  card: string
  device_id: string
  timestamp: number
  nonce: string
  sign: string
}

export interface CardLoginResponse {
  code: number
  message: string
  result?: {
    card_type?: string
    expires?: string
    expires_ts?: number
    server_time?: number
    [key: string]: any
  }
  nonce?: string
  sign?: string
}

export interface CardHeartbeatParams {
  app_key: string
  card: string
  device_id: string
  timestamp: number
  nonce: string
  sign: string
}

export interface CardLogoutParams {
  app_key: string
  card: string
  device_id: string
  timestamp: number
  nonce: string
  sign: string
}

/**
 * 泡椒云卡密验证API类
 */
export class CardAuthAPI {
  private config: CardAuthConfig

  constructor(config: CardAuthConfig) {
    this.config = {
      baseUrl: 'https://api.paojiaoyun.com',
      ...config
    }
  }

  /**
   * 生成MD5哈希
   */
  private async calculateMD5(text: string): Promise<string> {
    // 使用纯JavaScript MD5实现，因为Web Crypto API不支持MD5
    return this.md5(text)
  }

  /**
   * MD5哈希算法实现
   */
  private md5(str: string): string {
    return CryptoJS.MD5(str).toString()
  }

  /**
   * 计算签名
   */
  private async calculateSign(
    method: string,
    path: string,
    params: Record<string, any>
  ): Promise<string> {
    const host = new URL(this.config.baseUrl!).host
    
    // 排除sign参数，按键名排序参数
    const filteredParams = { ...params }
    delete filteredParams.sign
    
    const sortedKeys = Object.keys(filteredParams).sort()
    const queryString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&')
    
    // 根据泡椒云文档：sign = md5(http_method + host + path + params + app_secret)
    const signString = `${method}${host}${path}${queryString}${this.config.appSecret}`
    
    console.log('签名计算详情:', {
      method,
      host,
      path,
      queryString,
      appSecret: this.config.appSecret,
      signString
    })
    
    return this.md5(signString)
  }

  /**
   * 生成随机字符串
   */
  private generateNonce(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 发送API请求（带重试机制）
   */
  private async request<T>(
    method: string,
    path: string,
    params: Record<string, any>,
    retryCount: number = 3
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const url = `${this.config.baseUrl}${path}`
        
        // 添加公共参数
        const requestParams: Record<string, any> = {
          ...params,
          app_key: this.config.appKey,
          timestamp: Math.floor(Date.now() / 1000),
          nonce: this.generateNonce()
        }
        
        // 计算签名
        requestParams.sign = await this.calculateSign(method, path, requestParams)
        
        console.log(`API请求信息 (第${attempt}次尝试):`, {
          url,
          method,
          params: requestParams
        })
        
        let body: string | FormData | undefined
        let headers: Record<string, string> = {
          'User-Agent': 'AigcPanel/1.0',
          'Accept': 'application/json'
        }
        
        if (method === 'POST') {
          // 使用form-data格式，符合泡椒云API要求
          const formData = new FormData()
          Object.keys(requestParams).forEach(key => {
            formData.append(key, String(requestParams[key]))
          })
          body = formData
          // FormData会自动设置Content-Type，包含boundary
        } else {
          headers['Content-Type'] = 'application/json'
        }
        
        const response = await fetch(url, {
          method,
          headers,
          mode: 'cors', // 明确指定CORS模式
          credentials: 'omit', // 不发送凭据
          body
        })
        
        console.log('API响应状态:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API错误响应:', errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }
        
        const result = await response.json()
        console.log('API响应数据:', result)
        
        // 请求成功，返回数据
        if (attempt > 1) {
          console.log(`API请求在第${attempt}次尝试后成功`)
        }
        return result
        
      } catch (error) {
        lastError = error as Error
        console.error(`API请求失败 (第${attempt}次尝试):`, error)
        
        // 如果不是最后一次尝试，等待一段时间后重试
        if (attempt < retryCount) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // 指数退避，最大5秒
          console.log(`等待${delay}ms后进行第${attempt + 1}次重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    // 所有重试都失败了
    console.error(`API请求在${retryCount}次尝试后仍然失败`)
    if (lastError instanceof TypeError && lastError.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查：\n1. 网络连接是否正常\n2. API服务器是否可访问\n3. 是否存在CORS跨域问题')
    }
    throw lastError || new Error('未知错误')
  }

  /**
   * 测试签名算法（基于泡椒云文档示例）
   */
  testSignatureAlgorithm(): void {
    // 泡椒云文档示例数据
    const testData = {
      method: 'POST',
      host: 'api.paojiaoyun.com',
      path: '/v1/card/login',
      params: {
        app_key: 'blsvh14llhcr96vtboqg',
        card: 'abc3b65KDZ9Qb7UC685D2MVFR0TPc53BCU1IPD5ad20',
        device_id: '123',
        nonce: '359c22e4-d522-4771-ba8e-4b99cf61b372',
        timestamp: 1574654197
      },
      appSecret: 'uiS9M0G8JolpUvlf5NxZ7pwMVinKs73x',
      expectedSign: 'b5f3cc619998fa45e4c11ef57e712f87'
    }
    
    // 按文档要求排序参数
    const sortedKeys = Object.keys(testData.params).sort()
    const queryString = sortedKeys
      .map(key => `${key}=${testData.params[key as keyof typeof testData.params]}`)
      .join('&')
    
    const signString = `${testData.method}${testData.host}${testData.path}${queryString}${testData.appSecret}`
    const calculatedSign = this.md5(signString)
    
    console.log('泡椒云签名算法测试:', {
      testData,
      queryString,
      signString,
      calculatedSign,
      expectedSign: testData.expectedSign,
      isCorrect: calculatedSign === testData.expectedSign
    })
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testUrl = `${this.config.baseUrl}/ping`
      console.log('测试连接:', testUrl)
      
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        return {
          success: true,
          message: `连接成功 (${response.status})`
        }
      } else {
        return {
          success: false,
          message: `连接失败: HTTP ${response.status}`
        }
      }
    } catch (error) {
      console.error('连接测试失败:', error)
      
      // 处理常见的网络错误
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: '网络连接失败，可能是CORS跨域限制或服务器不可达'
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 卡密登录
   */
  async login(card: string, deviceId: string): Promise<CardLoginResponse> {
    return await this.request<CardLoginResponse>('POST', '/v1/card/login', {
      card: card,
      device_id: deviceId
    })
  }

  /**
   * 卡密心跳
   */
  async heartbeat(card: string, deviceId: string): Promise<CardLoginResponse> {
    return await this.request<CardLoginResponse>('POST', '/v1/card/heartbeat', {
      card: card,
      device_id: deviceId
    })
  }

  /**
   * 卡密退出
   */
  async logout(card: string, deviceId: string): Promise<CardLoginResponse> {
    return await this.request<CardLoginResponse>('POST', '/v1/card/logout', {
      card: card,
      device_id: deviceId
    })
  }
}

/**
 * 创建卡密验证API实例
 */
export function createCardAuthAPI(config: CardAuthConfig): CardAuthAPI {
  return new CardAuthAPI(config)
}