<script setup lang="ts">

import {t} from "../lang";
import {onMounted, ref} from "vue";
import SoundTts from "./Sound/SoundTts.vue";
import SoundClone from "./Sound/SoundClone.vue";
import VideoGen from "./Video/VideoGen.vue";
import Router from "../router";
import SoundPrompt from "./Sound/SoundPrompt.vue";
import VideoTemplate from "./Video/VideoTemplate.vue";
import VideoGenFlow from "./Video/VideoGenFlow.vue";
import CardAuthStatus from "../components/common/CardAuthStatus.vue";
import { cardAuth } from "../store/modules/cardAuth";
const tab = ref('');
const isAuthRequired = ref(true);

onMounted(() => {
    tab.value = Router.currentRoute.value.query.tab as string || 'soundTts';
    // 初始化卡密验证状态
    cardAuth.init();
    checkAuthStatus();
});

// 检查认证状态
const checkAuthStatus = () => {
    isAuthRequired.value = !cardAuth.isAuthenticated || cardAuth.isExpired;
};

// 认证成功处理
const handleAuthSuccess = () => {
    isAuthRequired.value = false;
};

// 需要认证处理
const handleAuthRequired = () => {
    isAuthRequired.value = true;
};

// 点击功能项时检查认证状态
const handleTabClick = (tabName: string) => {
    if (isAuthRequired.value) {
        // 如果需要认证，不切换tab
        return;
    }
    tab.value = tabName;
};

</script>

<template>
    <div class="pb-device-container bg-white h-full relative select-none flex">
        <div class="p-6 w-52 flex-shrink-0 border-r border-solid border-gray-100">
            <!-- 卡密验证状态 -->
            <div class="mb-4">
                <CardAuthStatus 
                    @auth-success="handleAuthSuccess"
                    @auth-required="handleAuthRequired"
                />
            </div>
            
            <!-- 功能导航 -->
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="[tab === 'soundTts' ? 'bg-gray-200' : '', isAuthRequired ? 'opacity-50 cursor-not-allowed' : '']"
                 @click="handleTabClick('soundTts')">
                <div class="text-base truncate">
                    <i class="iconfont icon-sound-generate w-6 inline-block"></i>
                    {{ t('声音合成') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="[tab === 'soundPrompt' ? 'bg-gray-200' : '', isAuthRequired ? 'opacity-50 cursor-not-allowed' : '']"
                 @click="handleTabClick('soundPrompt')">
                <div class="text-base truncate">
                    <i class="iconfont icon-sound-prompt w-6 inline-block"></i>
                    {{ t('我的音色') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="[tab === 'soundClone' ? 'bg-gray-200' : '', isAuthRequired ? 'opacity-50 cursor-not-allowed' : '']"
                 @click="handleTabClick('soundClone')">
                <div class="text-base truncate">
                    <i class="iconfont icon-sound-clone w-6 inline-block"></i>
                    {{ t('声音克隆') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="[tab === 'videoTemplate' ? 'bg-gray-200' : '', isAuthRequired ? 'opacity-50 cursor-not-allowed' : '']"
                 @click="handleTabClick('videoTemplate')">
                <div class="text-base truncate">
                    <i class="iconfont icon-video-template w-6 inline-block"></i>
                    {{ t('我的形象') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="[tab === 'videoGen' ? 'bg-gray-200' : '', isAuthRequired ? 'opacity-50 cursor-not-allowed' : '']"
                 @click="handleTabClick('videoGen')">
                <div class="text-base truncate">
                    <i class="iconfont icon-video w-6 inline-block"></i>
                    {{ t('视频合成') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="[tab === 'videoGenFlow' ? 'bg-gray-200' : '', isAuthRequired ? 'opacity-50 cursor-not-allowed' : '']"
                 @click="handleTabClick('videoGenFlow')">
                <div class="text-base truncate">
                    <i class="iconfont icon-quick w-6 inline-block"></i>
                    {{ $t('一键合成') }}
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <!-- 需要认证时显示的提示 -->
            <div v-if="isAuthRequired" class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="text-6xl text-gray-300 mb-4">
                        <i class="iconfont icon-lock"></i>
                    </div>
                    <h3 class="text-xl text-gray-600 mb-2">数字人功能需要验证卡密</h3>
                    <p class="text-gray-500">请在左侧验证您的卡密以使用完整功能</p>
                </div>
            </div>
            
            <!-- 认证通过后显示的功能组件 -->
            <template v-else>
                <SoundTts v-if="tab === 'soundTts'"/>
                <SoundPrompt v-else-if="tab==='soundPrompt'"/>
                <SoundClone v-else-if="tab === 'soundClone'"/>
                <VideoTemplate v-else-if="tab==='videoTemplate'"/>
                <VideoGen v-else-if="tab === 'videoGen'"/>
                <VideoGenFlow v-else-if="tab === 'videoGenFlow'"/>
            </template>
        </div>
    </div>
</template>

<style scoped>

</style>
