<template>
  <a-modal
    v-model:visible="visible"
    title="卡密验证"
    :width="480"
    :mask-closable="false"
    :esc-to-close="false"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div class="card-auth-dialog">
      <!-- 当前状态显示 -->
      <div v-if="cardAuth.isAuthenticated" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center mb-2">
          <icon-check-circle class="text-green-500 mr-2" />
          <span class="text-green-700 font-medium">卡密验证成功</span>
        </div>
        <div class="text-sm text-gray-600">
          <div>卡密: {{ maskCardNumber(cardAuth.cardNumber) }}</div>
          <div>类型: {{ cardAuth.cardType || '普通卡密' }}</div>
          <div>剩余时间: {{ cardAuth.timeRemaining }}</div>
          <div v-if="cardAuth.lastHeartbeat">
            最后心跳: {{ formatTime(cardAuth.lastHeartbeat) }}
          </div>
        </div>
        <div class="mt-3">
          <a-button size="small" type="outline" status="danger" @click="handleLogout">
            退出登录
          </a-button>
        </div>
      </div>

      <!-- 卡密输入表单 -->
      <div v-else>
        <a-form :model="form" layout="vertical" @submit="handleSubmit">
          <a-form-item label="卡密" field="cardNumber" :rules="cardRules">
            <a-input
              v-model="form.cardNumber"
              placeholder="请输入卡密"
              :disabled="cardAuth.isLoading"
              @press-enter="handleSubmit"
            >
              <template #prefix>
                <icon-safe />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item>
            <div class="text-sm text-gray-500 mb-3">
              <div class="mb-1">• 请输入有效的卡密进行验证</div>
              <div class="mb-1">• 验证成功后可使用数字人功能</div>
              <div>• 卡密将绑定当前设备</div>
            </div>
          </a-form-item>
        </a-form>
      </div>


    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <div class="text-xs text-gray-400">
            设备ID: {{ deviceId }}
          </div>
          <a-button
            v-if="!cardAuth.isAuthenticated"
            size="mini"
            type="outline"
            :loading="testingConnection"
            @click="handleTestConnection"
          >
            测试连接
          </a-button>
        </div>
        <div>
          <a-button @click="handleCancel">取消</a-button>
          <a-button
            v-if="!cardAuth.isAuthenticated"
            type="primary"
            :loading="cardAuth.isLoading"
            @click="handleSubmit"
          >
            验证卡密
          </a-button>
          <a-button v-else type="primary" @click="handleCancel">
            确定
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { cardAuth } from '../../store/modules/cardAuth'
import {
  IconCheckCircle,
  IconSafe
} from '@arco-design/web-vue/es/icon'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 使用已初始化的cardAuth实例
const testingConnection = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive({
  cardNumber: ''
})

const cardRules = [
  {
    required: true,
    message: '请输入卡密'
  },
  {
    minLength: 10,
    message: '卡密长度不能少于10位'
  }
]

const deviceId = computed(() => {
  return cardAuth.getDeviceId().substring(0, 12) + '...'
})

// 遮蔽卡密显示
const maskCardNumber = (cardNumber: string) => {
  if (!cardNumber) return ''
  if (cardNumber.length <= 8) return cardNumber
  return cardNumber.substring(0, 4) + '****' + cardNumber.substring(cardNumber.length - 4)
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// 提交验证
const handleSubmit = async () => {
  if (cardAuth.isAuthenticated) {
    visible.value = false
    return
  }

  if (!form.cardNumber.trim()) {
    Message.error('请输入卡密')
    return
  }

  try {
    const result = await cardAuth.cardLogin(form.cardNumber.trim())
    
    if (result.success) {
      Message.success('验证成功')
      emit('success')
      visible.value = false
      form.cardNumber = ''
    } else {
      Message.error(result.message)
    }
  } catch (error) {
    console.error('验证失败:', error)
    Message.error('验证失败，请重试')
  }
}

// 取消
const handleCancel = () => {
  visible.value = false
  form.cardNumber = ''
}

// 测试连接
const handleTestConnection = async () => {
  if (!cardAuth.api) {
    Message.error('API未初始化，请检查配置')
    return
  }
  
  testingConnection.value = true
  
  try {
    const result = await cardAuth.api.testConnection()
    
    if (result.success) {
      Message.success(result.message || '连接测试成功')
    } else {
      Message.error(result.message || '连接测试失败')
    }
  } catch (error) {
    console.error('连接测试错误:', error)
    Message.error('连接测试失败: ' + (error.message || '未知错误'))
  } finally {
    testingConnection.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  await cardAuth.logout()
  Message.success('已退出登录')
}


</script>

<style scoped>
.card-auth-dialog {
  min-height: 200px;
}
</style>