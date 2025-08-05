<template>
  <div class="card-auth-status">
    <!-- 已认证状态 -->
    <div v-if="cardAuth.isAuthenticated && !cardAuth.isExpired" class="auth-success">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <icon-check-circle class="text-green-500 mr-2" />
          <span class="text-green-700 font-medium">卡密已验证</span>
        </div>
        <a-button size="mini" type="text" @click="showDetails = !showDetails">
          {{ showDetails ? '收起' : '详情' }}
        </a-button>
      </div>
      
      <div v-if="showDetails" class="details">
        <div class="text-sm text-gray-600 space-y-1">
          <div>卡密: {{ maskCardNumber(cardAuth.cardNumber) }}</div>
          <div>类型: {{ cardAuth.cardType || '普通卡密' }}</div>
          <div class="flex items-center">
            <span>剩余时间: {{ cardAuth.timeRemaining }}</span>
            <div 
              class="ml-2 w-2 h-2 rounded-full"
              :class="heartbeatStatus.class"
              :title="heartbeatStatus.title"
            ></div>
          </div>
        </div>
        
        <div class="mt-2 flex gap-2">
          <a-button size="mini" @click="refreshAuth">
            刷新状态
          </a-button>
          <a-button size="mini" type="outline" status="danger" @click="handleLogout">
            退出登录
          </a-button>
        </div>
      </div>
    </div>

    <!-- 已过期状态 -->
    <div v-else-if="cardAuth.isAuthenticated && cardAuth.isExpired" class="auth-expired">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <icon-exclamation-circle class="text-orange-500 mr-2" />
          <span class="text-orange-700 font-medium">卡密已过期</span>
        </div>
      </div>
      
      <div class="text-sm text-gray-600 mb-2">
        请重新验证卡密以继续使用
      </div>
      
      <div class="flex gap-2">
        <a-button size="mini" type="primary" @click="openAuthDialog">
          重新验证
        </a-button>
        <a-button size="mini" type="outline" @click="handleLogout">
          清除状态
        </a-button>
      </div>
    </div>

    <!-- 未认证状态 -->
    <div v-else class="auth-required">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <icon-lock class="text-gray-500 mr-2" />
          <span class="text-gray-700 font-medium">需要卡密验证</span>
        </div>
      </div>
      
      <div class="text-sm text-gray-600 mb-2">
        使用数字人功能需要先验证卡密
      </div>
      
      <a-button size="mini" type="primary" @click="openAuthDialog">
        验证卡密
      </a-button>
    </div>

    <!-- 卡密验证对话框 -->
    <CardAuthDialog 
      v-model="showAuthDialog" 
      @success="handleAuthSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { cardAuth } from '../../store/modules/cardAuth'
import CardAuthDialog from './CardAuthDialog.vue'
import {
  IconCheckCircle,
  IconExclamationCircle,
  IconLock
} from '@arco-design/web-vue/es/icon'

interface Emits {
  (e: 'auth-success'): void
  (e: 'auth-required'): void
}

const emit = defineEmits<Emits>()

// 使用已初始化的cardAuth实例
const showDetails = ref(false)
const showAuthDialog = ref(false)

// 心跳状态
const heartbeatStatus = computed(() => {
  if (!cardAuth.lastHeartbeat) {
    return {
      class: 'bg-gray-400',
      title: '未知状态'
    }
  }
  
  const timeSinceLastHeartbeat = Date.now() - cardAuth.lastHeartbeat
  
  if (timeSinceLastHeartbeat < 70000) { // 70秒内
    return {
      class: 'bg-green-500',
      title: '连接正常'
    }
  } else if (timeSinceLastHeartbeat < 180000) { // 3分钟内
    return {
      class: 'bg-yellow-500',
      title: '连接异常'
    }
  } else {
    return {
      class: 'bg-red-500',
      title: '连接断开'
    }
  }
})

// 遮蔽卡密显示
const maskCardNumber = (cardNumber: string) => {
  if (!cardNumber) return ''
  if (cardNumber.length <= 8) return cardNumber
  return cardNumber.substring(0, 4) + '****' + cardNumber.substring(cardNumber.length - 4)
}

// 打开认证对话框
const openAuthDialog = () => {
  showAuthDialog.value = true
}

// 认证成功处理
const handleAuthSuccess = () => {
  emit('auth-success')
  Message.success('卡密验证成功，可以使用数字人功能了')
}

// 退出登录
const handleLogout = async () => {
  await cardAuth.logout()
  emit('auth-required')
  Message.success('已退出登录')
}

// 刷新认证状态
const refreshAuth = async () => {
  const success = await cardAuth.heartbeat()
  if (success) {
    Message.success('状态刷新成功')
  } else {
    Message.error('状态刷新失败，请检查网络连接')
  }
}

// 检查认证状态
const checkAuthStatus = () => {
  if (cardAuth.isAuthenticated && !cardAuth.isExpired) {
    emit('auth-success')
  } else {
    emit('auth-required')
  }
}

// 初始化检查
checkAuthStatus()
</script>

<style scoped>
.card-auth-status {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}

.auth-success {
  border-left: 4px solid #10b981;
  padding-left: 12px;
}

.auth-expired {
  border-left: 4px solid #f59e0b;
  padding-left: 12px;
}

.auth-required {
  border-left: 4px solid #6b7280;
  padding-left: 12px;
}

.details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}
</style>