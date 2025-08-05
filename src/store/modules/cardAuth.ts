import { defineStore } from "pinia"
import store from "../index"
import { Message } from '@arco-design/web-vue'
import { createCardAuthAPI, type CardAuthAPI, type CardAuthConfig } from '../../api/cardAuth'
import { PAOJIAO_CONFIG, validateConfig, getConfigStatus } from '../../config/paojiao'

// 泡椒云卡密验证状态
export interface CardAuthState {
  isAuthenticated: boolean
  cardNumber: string
  expiresAt: string | null
  expiresTs: number | null
  cardType: string
  config: any
  isLoading: boolean
  heartbeatInterval: number | null
  lastHeartbeat: number | null
  api: CardAuthAPI | null
}

export const cardAuthStore = defineStore('cardAuth', {
  state(): CardAuthState {
    return {
      isAuthenticated: false,
      cardNumber: '',
      expiresAt: null,
      expiresTs: null,
      cardType: '',
      config: {},
      isLoading: false,
      heartbeatInterval: null,
      lastHeartbeat: null,
      api: null as CardAuthAPI | null,
    }
  },

  getters: {
    isExpired(): boolean {
      if (!this.expiresTs) return true
      return Date.now() / 1000 > this.expiresTs
    },
    
    timeRemaining(): string {
      if (!this.expiresTs) return '未知'
      const remaining = this.expiresTs - Date.now() / 1000
      if (remaining <= 0) return '已过期'
      
      const days = Math.floor(remaining / 86400)
      const hours = Math.floor((remaining % 86400) / 3600)
      const minutes = Math.floor((remaining % 3600) / 60)
      
      if (days > 0) return `${days}天${hours}小时`
      if (hours > 0) return `${hours}小时${minutes}分钟`
      return `${minutes}分钟`
    }
  },

  actions: {
    // 生成设备ID
    getDeviceId(): string {
      let deviceId = localStorage.getItem('device_id')
      if (!deviceId) {
        deviceId = 'web_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
        localStorage.setItem('device_id', deviceId)
      }
      return deviceId
    },

    // 生成随机nonce
    generateNonce(): string {
      return Math.random().toString(36).substr(2, 20) + Date.now().toString(36)
    },

    // 获取时间戳
    getTimestamp(): number {
      return Math.floor(Date.now() / 1000)
    },

    // 计算MD5签名
    async calculateMD5(text: string): Promise<string> {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    },

    // 计算签名
    async calculateSign(method: string, path: string, params: Record<string, any>): Promise<string> {
      // 按照泡椒云文档的签名算法
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&')
      
      const signString = method + new URL(PAOJIAO_CONFIG.baseUrl).host + path + sortedParams + PAOJIAO_CONFIG.appSecret
      return await this.calculateMD5(signString)
    },

    // 发送API请求
    async apiRequest(path: string, method: string = 'POST', data: Record<string, any> = {}): Promise<any> {
      const timestamp = this.getTimestamp()
      const nonce = this.generateNonce()
      
      const params: Record<string, any> = {
        app_key: PAOJIAO_CONFIG.appKey,
        timestamp,
        nonce,
        ...data
      }
      
      const sign = await this.calculateSign(method, path, params)
      params.sign = sign
      
      const url = `${PAOJIAO_CONFIG.baseUrl}${path}`
      
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: method === 'POST' ? JSON.stringify(params) : undefined,
        })
        
        const result = await response.json()
        return result
      } catch (error) {
        console.error('API请求失败:', error)
        throw error
      }
    },

    // 卡密登录
    async cardLogin(cardNumber: string): Promise<{ success: boolean; message: string }> {
      if (!this.api) {
        return { success: false, message: '请先配置泡椒云AppKey和AppSecret' }
      }

      this.isLoading = true
      
      try {
        const result = await this.api.login(cardNumber.trim(), this.getDeviceId())
        
        if (result.code === 0) {
             this.isAuthenticated = true
             this.cardNumber = cardNumber.trim()
             this.cardType = result.result?.card_type || ''
             this.expiresAt = result.result?.expires || ''
             this.expiresTs = result.result?.expires_ts || 0
          
          // 保存到本地存储
          this.saveToStorage()
          
          // 启动心跳
          this.startHeartbeat()
          
          Message.success('卡密验证成功')
          return { success: true, message: '验证成功' }
        } else {
          const errorMessages: Record<number, string> = {
            10210: '卡密已过期',
            10212: '卡密已被冻结',
            10213: '卡密超过多开上限',
            10214: '登录状态已失效',
            10215: '只能在首次登录绑定的设备上使用',
            400: '参数错误',
            10010: '签名验证失败',
            10011: '签名已过期'
          }
          
          const message = errorMessages[result.code] || result.message || '验证失败'
          Message.error(message)
          return { success: false, message }
        }
      } catch (error) {
        console.error('卡密登录失败:', error)
        Message.error('网络请求失败，请检查网络连接')
        return { success: false, message: '网络请求失败' }
      } finally {
        this.isLoading = false
      }
    },

    // 心跳检测
    async heartbeat(): Promise<boolean> {
      if (!this.isAuthenticated || !this.api) return false
      
      try {
        const result = await this.api.heartbeat(this.cardNumber, this.getDeviceId())
        
        if (result.code === 0) {
          this.lastHeartbeat = Date.now()
          // 更新过期时间
          if (result.result?.expires_ts) {
            this.expiresTs = result.result.expires_ts
            this.expiresAt = result.result.expires || ''
          }
          return true
        } else {
          // 心跳失败，可能需要重新登录
          if (result.code === 10214) {
            this.logout()
            Message.error('登录状态已失效，请重新验证卡密')
          }
          return false
        }
      } catch (error) {
        console.error('心跳检测失败:', error)
        return false
      }
    },

    // 启动心跳
    startHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
      }
      
      this.heartbeatInterval = setInterval(() => {
        this.heartbeat()
      }, PAOJIAO_CONFIG.heartbeatInterval) as any
    },

    // 停止心跳
    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }
    },

    // 退出登录
    async logout() {
      if (this.isAuthenticated && this.api) {
        try {
          await this.api.logout(this.cardNumber, this.getDeviceId())
        } catch (error) {
          console.error('退出登录失败:', error)
        }
      }
      
      this.isAuthenticated = false
      this.cardNumber = ''
      this.expiresAt = null
      this.expiresTs = null
      this.cardType = ''
      this.config = {}
      this.lastHeartbeat = null
      
      this.stopHeartbeat()
      this.clearStorage()
    },

    // 保存到本地存储
    saveToStorage() {
      const data = {
        isAuthenticated: this.isAuthenticated,
        cardNumber: this.cardNumber,
        expiresAt: this.expiresAt,
        expiresTs: this.expiresTs,
        cardType: this.cardType,
        config: this.config,
        lastHeartbeat: this.lastHeartbeat
      }
      localStorage.setItem('cardAuth', JSON.stringify(data))
    },

    // 从本地存储加载
    loadFromStorage() {
      try {
        const data = localStorage.getItem('cardAuth')
        if (data) {
          const parsed = JSON.parse(data)
          
          // 检查是否过期
          if (parsed.expiresTs && Date.now() / 1000 > parsed.expiresTs) {
            this.clearStorage()
            return
          }
          
          this.isAuthenticated = parsed.isAuthenticated
          this.cardNumber = parsed.cardNumber
          this.expiresAt = parsed.expiresAt
          this.expiresTs = parsed.expiresTs
          this.cardType = parsed.cardType
          this.config = parsed.config
          this.lastHeartbeat = parsed.lastHeartbeat
          
          // 如果已认证，启动心跳
          if (this.isAuthenticated) {
            this.startHeartbeat()
          }
        }
      } catch (error) {
        console.error('加载本地存储失败:', error)
        this.clearStorage()
      }
    },

    // 清除本地存储
    clearStorage() {
      localStorage.removeItem('cardAuth')
    },

    // 初始化
    async init() {
      this.loadFromStorage()
      
      // 检查配置状态
       const configStatus = getConfigStatus()
       if (configStatus.valid) {
         // 创建API实例
         const config: CardAuthConfig = {
           appKey: PAOJIAO_CONFIG.appKey,
           appSecret: PAOJIAO_CONFIG.appSecret,
           baseUrl: PAOJIAO_CONFIG.baseUrl
         }
         this.api = createCardAuthAPI(config)
         
         // 测试签名算法
         if (this.api) {
           this.api.testSignatureAlgorithm()
         }
       } else {
         console.warn('泡椒云配置无效:', configStatus.message)
       }
    },

    // 设置配置
     setConfig(appKey: string, appSecret: string) {
       // 验证配置
       if (!appKey || !appSecret) {
         throw new Error('无效的配置参数')
       }
      
      // 创建API实例
      const config: CardAuthConfig = {
        appKey,
        appSecret,
        baseUrl: PAOJIAO_CONFIG.baseUrl
      }
      this.api = createCardAuthAPI(config)
    }
  }
})

export const cardAuth = cardAuthStore(store)

// 初始化
cardAuth.init()

export const useCardAuthStore = () => {
  return cardAuthStore(store)
}