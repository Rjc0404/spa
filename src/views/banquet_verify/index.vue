<template>
  <div class="banquet-page">
    <!-- 顶部导航栏 -->
    <div class="banquet-header">
      <div class="banquet-header-back" @click="handleBack">
        <svg class="banquet-header-icon" viewBox="0 0 24 24" fill="none">
          <path d="M15 19L8 12L15 5" stroke="#1F1F1F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="banquet-header-title">宴席主家信息验真</div>
      <div class="banquet-header-placeholder"></div>
    </div>

    <!-- 页面初始化加载 Loading 弹窗（仅当接口响应超过 250ms 时才显示，避免快网下闪烁） -->
    <div v-if="pageLoading" class="banquet-modal-mask">
      <div class="banquet-modal-box">
        <div class="banquet-loading-spinner">
          <span
            v-for="n in 8"
            :key="n"
            class="banquet-loading-dot"
            :style="getSpinnerDotStyle(n)"
          ></span>
        </div>
        <div class="banquet-loading-title">正在加载...</div>
        <div class="banquet-loading-desc">请耐心等待</div>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div v-if="pageReady" class="banquet-body">
      <!-- 不可验真锁屏状态（图9: 超期或链接无效 / 图10: 已取消 / 无需验真） -->
      <div v-if="isLockedView" class="banquet-lock-card">
        <div class="banquet-lock-icon">
          <svg viewBox="0 0 64 64" width="52" height="52" fill="none">
            <path d="M20 28V20C20 13.3726 25.3726 8 32 8C38.6274 8 44 13.3726 44 20V28" stroke="#A5B2C2" stroke-width="5" stroke-linecap="round" />
            <path d="M21 28V20C21 13.9249 25.9249 9 32 9C38.0751 9 43 13.9249 43 20V28" stroke="#D2DCE6" stroke-width="2" stroke-linecap="round" />
            <rect x="14" y="26" width="36" height="30" rx="4" fill="url(#lockGrad)" />
            <defs>
              <linearGradient id="lockGrad" x1="14" y1="26" x2="50" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#DFC97B" />
                <stop offset="50%" stop-color="#BBA14F" />
                <stop offset="100%" stop-color="#9A8033" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div
          v-for="(line, idx) in lockTextLines"
          :key="idx"
          class="banquet-lock-text"
        >
          {{ line }}
        </div>
      </div>

      <!-- 正常展示状态（图1、图2、图6、图7） -->
      <template v-else>
        <!-- 卡片1：主家验真状态 -->
        <div class="banquet-status-card">
          <span class="banquet-status-label">主家验真状态</span>
          <div v-if="statusText" class="banquet-status-badge" :class="statusBadgeClass">
            <span class="banquet-status-dot" :class="statusDotClass"></span>
            <span>{{ statusText }}</span>
          </div>
        </div>

        <!-- 卡片2：宴席信息 -->
        <div class="banquet-info-card">
          <div class="banquet-card-title">宴席信息</div>
          <div class="banquet-info-row">
            <span class="banquet-info-label">宴席订单号</span>
            <span class="banquet-info-value">{{ banquetInfo.orderNo || '-' }}</span>
          </div>
          <div class="banquet-info-row">
            <span class="banquet-info-label">宴席类型</span>
            <span class="banquet-info-value">{{ banquetTypeText }}</span>
          </div>
          <div class="banquet-info-row">
            <span class="banquet-info-label">宴席时间</span>
            <span class="banquet-info-value">
              <template v-if="banquetTimeLines.length > 1">
                <div v-for="(line, idx) in banquetTimeLines" :key="idx">{{ line }}</div>
              </template>
              <template v-else>{{ displayBanquetTime }}</template>
            </span>
          </div>
          <div class="banquet-info-row">
            <span class="banquet-info-label">主家姓名</span>
            <span class="banquet-info-value">{{ displayHostName }}</span>
          </div>
          <div class="banquet-info-row">
            <span class="banquet-info-label">主家手机号</span>
            <span class="banquet-info-value">{{ displayHostPhone }}</span>
          </div>
        </div>

        <!-- 卡片3：主家身份信息验真（仅未验真 1 / 验真未通过 3 且未超期时展示） -->
        <template v-if="canVerify">
          <div class="banquet-verify-card">
            <div class="banquet-card-title">主家身份信息验真</div>

            <!-- 婚宴（banquetType === '1'）：上传结婚证照片（图1、图12） -->
            <template v-if="isWeddingBanquet">
              <div class="banquet-cert-header">
                <span class="banquet-cert-label">结婚证照片</span>
                <span class="banquet-example-btn" @click="showSampleModal = true">查看图例</span>
              </div>
              <div v-if="ocrErrorTip" class="banquet-error-tip">
                <div v-for="(line, idx) in splitMessageLines(ocrErrorText)" :key="idx">
                  {{ line }}
                </div>
              </div>
              <div class="banquet-upload-box" @click="triggerFileSelect">
                <input
                  ref="fileInputRef"
                  class="banquet-upload-input"
                  type="file"
                  accept="image/*"
                  @change="handleFileChange"
                />
                <template v-if="certPreviewUrl">
                  <div class="banquet-preview-wrap">
                    <img :src="certPreviewUrl" class="banquet-preview-img" alt="结婚证照片" />
                    <div class="banquet-preview-reupload">点击重新上传</div>
                  </div>
                </template>
                <template v-else>
                  <div class="banquet-upload-plus">+</div>
                  <div class="banquet-upload-text">上传结婚证照片</div>
                </template>
              </div>
              <div class="banquet-cert-desc">
                结婚证照片须包含主家身份证信息（结婚证内页），系统仅用于身份核验，不存储证件信息。
              </div>
            </template>

            <!-- 其他宴席（非婚宴）：输入身份证号（图2、图7） -->
            <template v-else>
              <div class="banquet-idcard-label">主家身份证号</div>
              <input
                v-model.trim="idCardNumber"
                class="banquet-idcard-input"
                type="text"
                maxlength="18"
                placeholder="请输入主家身份证号"
                @input="handleIdCardInput"
              />
              <div v-if="idCardErrorTip" class="banquet-error-tip">
                <div v-for="(line, idx) in splitMessageLines(idCardErrorTip)" :key="idx">
                  {{ line }}
                </div>
              </div>
              <div class="banquet-idcard-desc">
                系统仅用于身份核验，不做存储。
              </div>
            </template>
          </div>

          <!-- 底部提交按钮 -->
          <div class="banquet-submit-wrap">
            <button type="button" class="banquet-submit-btn" @click="handleSubmitVerify">
              {{ submitButtonText }}
            </button>
          </div>
        </template>
      </template>
    </div>

    <!-- 图3：正在验真弹窗 -->
    <div v-if="activeModal === 'verifying'" class="banquet-modal-mask">
      <div class="banquet-modal-box">
        <div class="banquet-loading-spinner">
          <span
            v-for="n in 8"
            :key="n"
            class="banquet-loading-dot"
            :style="getSpinnerDotStyle(n)"
          ></span>
        </div>
        <div class="banquet-loading-title">正在验真...</div>
        <div class="banquet-loading-desc">请耐心等待验真结果</div>
      </div>
    </div>

    <!-- 图4：验真通过提示弹窗 -->
    <div v-if="activeModal === 'passed'" class="banquet-modal-mask">
      <div class="banquet-modal-box">
        <div class="banquet-result-icon banquet-icon-success">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M5 13L9.5 17.5L19 7" stroke="#18A058" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="banquet-result-title banquet-title-success">验真通过</div>
        <div class="banquet-result-desc">主家身份信息验真通过</div>
        <button type="button" class="banquet-modal-btn" @click="handleConfirmPassedModal">好的</button>
      </div>
    </div>

    <!-- 图5：验真未通过提示弹窗 -->
    <div v-if="activeModal === 'failed'" class="banquet-modal-mask">
      <div class="banquet-modal-box">
        <div class="banquet-result-icon banquet-icon-fail">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path d="M7 7L17 17M17 7L7 17" stroke="#C93B2B" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </div>
        <div class="banquet-result-title banquet-title-fail">验真未通过</div>
        <div class="banquet-result-desc">
          主家身份信息验真未通过，请核对主家姓名、手机号、身份证号是否相符。<br />
          如宴席主家姓名与手机号填写有误，请联系门店老板协助修改后重新验真
        </div>
        <button type="button" class="banquet-modal-btn" @click="handleConfirmFailedModal">好的</button>
      </div>
    </div>

    <!-- 图8：验真次数已达上限弹窗 -->
    <div v-if="activeModal === 'limit'" class="banquet-modal-mask">
      <div class="banquet-modal-box">
        <div class="banquet-result-title banquet-title-limit">验真次数已达上限</div>
        <div class="banquet-result-desc">请联系门店或销售人员协助处理</div>
        <button type="button" class="banquet-modal-btn" @click="activeModal = ''">好的</button>
      </div>
    </div>

    <!-- 图11：结婚证照片示例查看弹窗 -->
    <div v-if="showSampleModal" class="banquet-sample-mask" @click.self="showSampleModal = false">
      <div class="banquet-sample-wrap">
        <img :src="marriageCertSampleImg" class="banquet-sample-img" alt="结婚证照片示例" />
        <div class="banquet-sample-close" @click="showSampleModal = false">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M6 6L18 18M18 6L6 18" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 图12：居中轻提示 Toast（支持按逗号分段换行展示） -->
    <div v-if="toastLines.length" class="banquet-toast-box">
      <div v-for="(line, idx) in toastLines" :key="idx" class="banquet-toast-line">
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script setup name="BanquetVerify">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import marriageCertSampleImg from '@/assets/images/marriage_cert_sample.png'
import {
  getBanquetVerifyInfo,
  submitBanquetVerify,
  getDictValuesByCode
} from '@/api/banquetVerify'

const route = useRoute()

/**
 * 字典编码（严格对齐《宴席主家验真_上线准备清单.md》4.2 节 banquetHostVerifyStatus）：
 * '0' - 无需验真
 * '1' - 未验真
 * '2' - 验真通过
 * '3' - 验真未通过
 */
const VERIFY_STATUS = {
  NO_NEED: '0',
  UNVERIFIED: '1',
  PASSED: '2',
  FAILED: '3'
}

// 从 URL query 获取验真 token（兼容短信短链 ?c=xxx 以及 ?token=xxx、?code=xxx）
const verifyToken = computed(() => {
  const fromRoute = route.query.c || route.query.token || route.query.code
  if (fromRoute) return String(fromRoute)
  const searchParams = new URLSearchParams(window.location.search)
  return String(
    searchParams.get('c') ||
      searchParams.get('token') ||
      searchParams.get('code') ||
      ''
  )
})

// 页面初始加载状态（延迟显示 Loading 防止接口极快时一闪而过）
const pageLoading = ref(false)
const pageReady = ref(false)
let pageLoadingTimer = null

// 宴席主信息（初始无写死假数据，由后端 info 接口填充）
const banquetInfo = ref({
  valid: true,
  orderNo: '',
  banquetType: '1',
  banquetDate: '',
  banquetTime: '',
  hostName: '',
  hostName1: '',
  hostName2: '',
  hostPhone: '',
  terminalName: '',
  verifyStatus: VERIFY_STATUS.UNVERIFIED,
  verifyCount: 0,
  maxVerifyCount: 5,
  isExpired: false, // 验真时间已超期（有效开瓶统计已完结）
  isCancelled: false, // 宴席订单已取消
  invalidReason: '' // 自定义锁屏提示文案
})

// 表单与交互状态
const fileInputRef = ref(null)
const certFile = ref(null)
const certPreviewUrl = ref('')
const ocrErrorTip = ref(false)
const ocrErrorText = ref('未识别到有效的结婚证编号或身份证号，请上传清晰的结婚证内页照片')
const idCardNumber = ref('')
const idCardErrorTip = ref('')
const activeModal = ref('') // '' | 'verifying' | 'passed' | 'failed' | 'limit'
const showSampleModal = ref(false)
const toastMessage = ref('')
let toastTimer = null

// 标准化状态码（兼容数字、字符串码值）
const normalizedVerifyStatus = computed(() => {
  const raw = String(banquetInfo.value.verifyStatus ?? '')
  if (raw === '0' || raw === 'NO_NEED') return VERIFY_STATUS.NO_NEED
  if (raw === '2' || raw === 'PASSED') return VERIFY_STATUS.PASSED
  if (raw === '3' || raw === 'FAILED') return VERIFY_STATUS.FAILED
  return VERIFY_STATUS.UNVERIFIED
})

// 是否为锁屏不可验真视图（valid=false / 已取消 / 无需验真 / 未通过且已超期）
const isLockedView = computed(() => {
  if (banquetInfo.value.valid === false) return true
  if (banquetInfo.value.isCancelled) return true
  if (normalizedVerifyStatus.value === VERIFY_STATUS.NO_NEED) return true
  if (
    banquetInfo.value.isExpired &&
    normalizedVerifyStatus.value !== VERIFY_STATUS.PASSED
  ) {
    return true
  }
  return false
})

// 将错误提示文案按中英文逗号及换行符切分为多段，逐行展示
function splitMessageLines(msg) {
  if (!msg) return []
  return String(msg)
    .split(/[，,\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

// 锁屏多行提示文案（优先按逗号切割后端返回的 message 分段展示）
const lockTextLines = computed(() => {
  if (banquetInfo.value.invalidReason) {
    return splitMessageLines(banquetInfo.value.invalidReason)
  }
  if (banquetInfo.value.isCancelled) {
    return ['本场宴席已取消', '不可进行身份验真']
  }
  if (normalizedVerifyStatus.value === VERIFY_STATUS.NO_NEED) {
    return ['该宴席无需验真']
  }
  if (banquetInfo.value.isExpired) {
    return ['本场宴席主家验真时间已超期', '不可进行身份验真']
  }
  if (banquetInfo.value.valid === false) {
    return ['验真链接无效或已过期', '不可进行身份验真']
  }
  return []
})

// 轻提示 Toast 按逗号切分多行展示
const toastLines = computed(() => splitMessageLines(toastMessage.value))

// 数据字典映射表（由接口 GET /rest/tsa/dictDataRestApiController/getValuesByCode 动态填充）
const verifyStatusDictMap = ref({}) // type=banquetHostVerifyStatus
const banquetTypeDictMap = ref({}) // type=banquetType

// 状态胶囊文案与样式（通过接口字典 banquetHostVerifyStatus 翻译）
const statusText = computed(() => {
  const raw = String(banquetInfo.value.verifyStatus ?? '')
  return (
    verifyStatusDictMap.value[raw] ||
    verifyStatusDictMap.value[normalizedVerifyStatus.value] ||
    ''
  )
})

const statusBadgeClass = computed(() => {
  if (normalizedVerifyStatus.value === VERIFY_STATUS.PASSED) {
    return 'banquet-badge-passed'
  }
  if (normalizedVerifyStatus.value === VERIFY_STATUS.FAILED) {
    return 'banquet-badge-failed'
  }
  return 'banquet-badge-unverified'
})

const statusDotClass = computed(() => {
  if (normalizedVerifyStatus.value === VERIFY_STATUS.PASSED) {
    return 'banquet-dot-passed'
  }
  if (normalizedVerifyStatus.value === VERIFY_STATUS.FAILED) {
    return 'banquet-dot-failed'
  }
  return 'banquet-dot-unverified'
})

// 宴席类型展示文案（通过接口字典 banquetType 动态翻译）
const banquetTypeText = computed(() => {
  const raw = String(banquetInfo.value.banquetType ?? '').trim()
  if (!raw) return '-'
  if (banquetTypeDictMap.value[raw]) {
    return banquetTypeDictMap.value[raw]
  }
  return /^\d+$/.test(raw) ? '-' : raw
})

// 格式化宴席日期（兼容后端 Jackson 默认序列化出的毫秒时间戳 Number 或字符串）
function formatBanquetDate(val) {
  if (val === undefined || val === null || val === '') return ''
  if (typeof val === 'number' || /^\d{10,13}$/.test(String(val).trim())) {
    const str = String(val).trim()
    const ts = str.length === 10 ? Number(str) * 1000 : Number(str)
    const d = new Date(ts)
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mi = String(d.getMinutes()).padStart(2, '0')
      return hh === '00' && mi === '00'
        ? `${yyyy}-${mm}-${dd}`
        : `${yyyy}-${mm}-${dd} ${hh}:${mi}`
    }
  }
  return String(val)
}

// 宴席时间展示（兼容 banquetDate 与 banquetTime，确保始终返回字符串）
const displayBanquetTime = computed(() => {
  const raw = banquetInfo.value.banquetTime || banquetInfo.value.banquetDate
  const formatted = formatBanquetDate(raw)
  return formatted || '-'
})

// 宴席时间分行处理（流水席跨时段折行显示：第一行带 ~）
const banquetTimeLines = computed(() => {
  const raw = String(displayBanquetTime.value || '')
  if (raw && raw.includes('~')) {
    const parts = raw.split('~')
    if (parts.length === 2) {
      return [`${parts[0]}~`, parts[1]]
    }
  }
  return raw && raw !== '-' ? [raw] : []
})

// 姓名脱敏展示（如：王测试 -> 王*试，张三 -> 张*）
function maskName(name) {
  if (!name) return ''
  const str = String(name).trim()
  if (!str || str.includes('*')) return str
  if (str.length === 2) {
    return `${str[0]}*`
  }
  if (str.length > 2) {
    return `${str[0]}${'*'.repeat(str.length - 2)}${str[str.length - 1]}`
  }
  return str
}

// 手机号脱敏展示（如：17601087000 -> 176****7000）
function maskPhone(phone) {
  if (!phone) return ''
  const str = String(phone).trim()
  if (!str || str.includes('*')) return str
  if (/^\d{11}$/.test(str)) {
    return `${str.slice(0, 3)}****${str.slice(7)}`
  }
  return str
}

// 主家姓名展示（兼容 info 接口的 consumerName / hostName / hostName1 / hostName2 并脱敏）
const displayHostName = computed(() => {
  const { hostName1, hostName2, hostName, consumerName } = banquetInfo.value
  if (consumerName || hostName) {
    return maskName(consumerName || hostName)
  }
  const names = [hostName1, hostName2].filter(Boolean).map(maskName)
  if (names.length > 0) {
    return names.join(' / ')
  }
  return '-'
})

// 主家手机号展示（脱敏）
const displayHostPhone = computed(() => {
  const raw = banquetInfo.value.hostPhone || banquetInfo.value.consumerPhone
  return raw ? maskPhone(raw) : '-'
})

// 是否允许进行身份验真操作（未验真 '1' 或 验真未通过 '3'）
const canVerify = computed(() => {
  return (
    banquetInfo.value.valid !== false &&
    !banquetInfo.value.isCancelled &&
    !banquetInfo.value.isExpired &&
    (normalizedVerifyStatus.value === VERIFY_STATUS.UNVERIFIED ||
      normalizedVerifyStatus.value === VERIFY_STATUS.FAILED)
  )
})

// 是否为婚宴（严格对齐清单 9.1 节判断条件：banquetType === '1'，同时兼容中文 '婚宴'）
const isWeddingBanquet = computed(() => {
  const raw = String(banquetInfo.value.banquetType ?? '')
  return raw === '1' || raw === '婚宴'
})

// 底部提交按钮文案（未验真：提交验真；验真未通过：重新提交验真）
const submitButtonText = computed(() => {
  return normalizedVerifyStatus.value === VERIFY_STATUS.FAILED
    ? '重新提交验真'
    : '提交验真'
})

// 旋转菊花点样式计算
function getSpinnerDotStyle(index) {
  const angle = (index - 1) * 45
  const rad = (angle * Math.PI) / 180
  const radius = 18
  const x = Math.round(Math.sin(rad) * radius)
  const y = Math.round(-Math.cos(rad) * radius)
  const delay = ((index - 1) * 0.12).toFixed(2)
  const size = index === 1 ? 8 : index === 2 ? 7 : 6
  return {
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(${x}px, ${y}px)`,
    animationDelay: `${delay}s`
  }
}

// 显示轻提示 Toast
function showToast(msg, duration = 2600) {
  toastMessage.value = msg
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, duration)
}

// 返回上一页
function handleBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.close()
  }
}

// 触发选择结婚证照片
function triggerFileSelect() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

// 前端压缩图片（避免手机拍照原图超过 10MB 限制或上传缓慢）
function compressImageFile(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.size <= 1.2 * 1024 * 1024) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressed = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressed)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

// 选择结婚证图片回调（选图后预览并清除旧错误提示，点击提交时随 submit 接口统一上传）
async function handleFileChange(event) {
  const rawFile = event.target.files && event.target.files[0]
  if (!rawFile) return

  ocrErrorTip.value = false
  const processedFile = await compressImageFile(rawFile)
  certFile.value = processedFile
  certPreviewUrl.value = URL.createObjectURL(processedFile)
}

// 身份证号输入格式化与18位校验
function handleIdCardInput() {
  idCardNumber.value = idCardNumber.value.replace(/[^0-9xX]/g, '').toUpperCase()
  if (idCardErrorTip.value) {
    idCardErrorTip.value = ''
  }
}

// 18位二代身份证正则与校验位算法核验
function validateChineseIdCard(idCard) {
  if (!idCard) return false
  const reg = /^[1-9]\d{5}(19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9X]$/
  if (!reg.test(idCard)) return false

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += Number(idCard[i]) * weights[i]
  }
  const expectedLast = checkCodes[sum % 11]
  return idCard[17].toUpperCase() === expectedLast
}

// 过滤后端网关默认返回的 "success" / "ok" 占位文案
function normalizeServerMessage(rawMsg, fallback = '') {
  const str = String(rawMsg || '').trim()
  if (!str || str.toLowerCase() === 'success' || str.toLowerCase() === 'ok') {
    return fallback
  }
  return str
}

// 处理后端 submit 接口返回的业务错误消息（对齐清单 9.1 节核心提示文案表）
function handleSubmitErrorMessage(errMsg) {
  const msg = normalizeServerMessage(errMsg, '系统繁忙，请稍后再试')
  activeModal.value = ''

  // 1. 已验真 5 次再提交 -> 图8 验真次数已达上限弹窗
  if (msg.includes('次数已达上限')) {
    banquetInfo.value.verifyCount = banquetInfo.value.maxVerifyCount || 5
    activeModal.value = 'limit'
    return
  }

  // 2. 订单已取消 -> 图10 锁屏（保留后端 message 按逗号分段展示）
  if (msg.includes('已取消')) {
    banquetInfo.value.isCancelled = true
    banquetInfo.value.invalidReason = msg
    return
  }

  // 3. 无需验真 -> 锁屏（保留后端 message 按逗号分段展示）
  if (msg.includes('无需验真')) {
    banquetInfo.value.verifyStatus = VERIFY_STATUS.NO_NEED
    banquetInfo.value.invalidReason = msg
    return
  }

  // 4. token 查不到 / 链接无效或已过期 / 时间已超期 -> 图9 锁屏
  if (
    msg.includes('无效') ||
    msg.includes('已过期') ||
    msg.includes('超期') ||
    msg.includes('不可进行身份验真')
  ) {
    banquetInfo.value.valid = false
    banquetInfo.value.invalidReason = msg
    return
  }

  // 5. 结婚证字号或身份证号不达标 -> 图12 红字提示 + 居中黑色 Toast
  if (msg.includes('未识别到有效的结婚证') || msg.includes('结婚证')) {
    ocrErrorText.value = msg.includes('未识别到有效')
      ? msg
      : '未识别到有效的结婚证编号或身份证号，请上传清晰的结婚证内页照片'
    ocrErrorTip.value = true
    showToast(
      msg.includes('请上传结婚证照片')
        ? msg
        : '结婚证识别失败，请查看图例后重新上传'
    )
    return
  }

  // 6. 非婚宴身份证格式错
  if (msg.includes('身份证') && !isWeddingBanquet.value) {
    idCardErrorTip.value = msg
    return
  }

  // 7. 同一单并发提交或缺少消费者姓名/电话等 -> Toast 提示（自动按逗号分行）
  showToast(msg)
}

// 点击提交/重新提交验真
async function handleSubmitVerify() {
  if (!verifyToken.value) {
    banquetInfo.value.valid = false
    banquetInfo.value.invalidReason = '验真链接无效或已过期，不可进行身份验真'
    return
  }

  // 1. 本地校验单场宴席至多验真 5 次限制
  if (banquetInfo.value.verifyCount >= (banquetInfo.value.maxVerifyCount || 5)) {
    activeModal.value = 'limit'
    return
  }

  // 2. 婚宴校验是否已选择结婚证照片
  if (isWeddingBanquet.value) {
    if (!certFile.value && !certPreviewUrl.value) {
      ocrErrorText.value = '未识别到有效的结婚证编号或身份证号，请上传清晰的结婚证内页照片'
      ocrErrorTip.value = true
      showToast('婚宴请上传结婚证照片')
      return
    }
  } else {
    // 3. 非婚宴校验身份证号格式
    if (!idCardNumber.value) {
      idCardErrorTip.value = '请输入主家身份证号'
      return
    }
    if (!validateChineseIdCard(idCardNumber.value)) {
      idCardErrorTip.value = '身份证号格式不正确'
      return
    }
  }

  // 4. 打开“正在验真...”弹窗（图3）
  activeModal.value = 'verifying'

  try {
    const res = await submitBanquetVerify({
      token: verifyToken.value,
      image: isWeddingBanquet.value ? certFile.value : undefined,
      idNo: !isWeddingBanquet.value ? idCardNumber.value : undefined
    })

    // 兼容网关包装格式 { code: 0, data: true/false, message: '...' } 或直接返回 boolean
    if (typeof res === 'boolean') {
      banquetInfo.value.verifyCount += 1
      activeModal.value = res ? 'passed' : 'failed'
      return
    }

    const code = res && res.code
    const isSuccessCode =
      res &&
      res.success !== false &&
      (code === 0 || code === '0' || code === 200 || code === undefined)
    if (!isSuccessCode) {
      handleSubmitErrorMessage(res && (res.message || res.msg))
      return
    }

    const passResult = res.data !== undefined ? res.data : res.result
    if (passResult === true) {
      banquetInfo.value.verifyCount += 1
      activeModal.value = 'passed'
    } else if (passResult === false) {
      banquetInfo.value.verifyCount += 1
      activeModal.value = 'failed'
    } else {
      handleSubmitErrorMessage(res.message || res.msg)
    }
  } catch (err) {
    const respData = err && err.response && err.response.data
    const errMsg =
      (respData && (respData.message || respData.msg)) ||
      (err && err.message) ||
      '网络异常，请稍后再试'
    handleSubmitErrorMessage(errMsg)
  }
}

// 确认验真通过弹窗 -> 更新页面为【验真通过 '2'】（图6）
function handleConfirmPassedModal() {
  activeModal.value = ''
  banquetInfo.value.verifyStatus = VERIFY_STATUS.PASSED
}

// 确认验真未通过弹窗 -> 更新页面为【验真未通过 '3'】（图7）
function handleConfirmFailedModal() {
  activeModal.value = ''
  banquetInfo.value.verifyStatus = VERIFY_STATUS.FAILED
}

// 通用字典加载函数（GET /rest/tsa/dictDataRestApiController/getValuesByCode?type=xxx）
async function fetchDictByCode(dictType, targetRef) {
  try {
    const res = await getDictValuesByCode(dictType)
    const list = Array.isArray(res)
      ? res
      : res && Array.isArray(res.data)
        ? res.data
        : []
    const map = {}
    list.forEach((item) => {
      if (item && item.dictCode !== undefined && item.dictCode !== null) {
        map[String(item.dictCode).trim()] = String(item.dictValue || '').trim()
      }
    })
    targetRef.value = map
  } catch (err) {
    console.error(`获取数据字典(${dictType})失败:`, err)
  }
}

// 初始化加载宴席验真详情与数据字典（状态字典 + 宴席类型字典并发请求）
async function fetchInitData() {
  document.title = '宴席主家信息验真'
  if (!verifyToken.value) {
    banquetInfo.value.valid = false
    banquetInfo.value.invalidReason = '验真链接无效或已过期，不可进行身份验真'
    pageReady.value = true
    return
  }

  // 延迟 250ms 触发 Loading：接口在 250ms 内返回则完全不闪弹窗，慢网时才展示 Loading
  pageLoadingTimer = setTimeout(() => {
    pageLoading.value = true
  }, 250)

  try {
    const [res] = await Promise.all([
      getBanquetVerifyInfo(verifyToken.value),
      fetchDictByCode('banquetHostVerifyStatus', verifyStatusDictMap),
      fetchDictByCode('banquetType', banquetTypeDictMap)
    ])
    if (!res || typeof res !== 'object') {
      banquetInfo.value.valid = false
      banquetInfo.value.invalidReason = '验真链接无效或已过期，不可进行身份验真'
      return
    }

    // 处理网关业务报错响应（如 { success: false, code: -10, data: null, message: "本场宴席主家验真时间已超期，不可进行身份验真" }）
    const isErrorResp =
      res.success === false ||
      (res.code !== undefined && res.code !== 0 && res.code !== '0' && res.code !== 200)
    if (isErrorResp) {
      banquetInfo.value.valid = false
      banquetInfo.value.invalidReason = normalizeServerMessage(
        res.message || res.msg,
        '验真链接无效或已过期，不可进行身份验真'
      )
      return
    }

    // 兼容网关 { code: 0, data: { ... } } 与直接返回 { valid, verifyStatus, ... }（避免 data: null 时退回到外层 res）
    const payload =
      'data' in res
        ? res.data && typeof res.data === 'object'
          ? res.data
          : null
        : res

    if (!payload || payload.valid === false) {
      banquetInfo.value.valid = false
      banquetInfo.value.invalidReason = normalizeServerMessage(
        (payload && payload.message) || res.message || res.msg,
        '验真链接无效或已过期，不可进行身份验真'
      )
      return
    }

    banquetInfo.value = {
      ...banquetInfo.value,
      valid: payload.valid !== false,
      orderNo: payload.orderNo || payload.orderCode || '',
      banquetType:
        payload.banquetType !== undefined && payload.banquetType !== null
          ? String(payload.banquetType)
          : banquetInfo.value.banquetType,
      banquetDate: payload.banquetDate || '',
      banquetTime: payload.banquetTime || payload.banquetDate || '',
      hostName: payload.hostName || payload.consumerName || '',
      hostName1: payload.hostName1 || '',
      hostName2: payload.hostName2 || '',
      hostPhone: payload.hostPhone || payload.consumerPhone || '',
      terminalName: payload.terminalName || '',
      verifyStatus:
        payload.verifyStatus !== undefined && payload.verifyStatus !== null
          ? String(payload.verifyStatus)
          : VERIFY_STATUS.UNVERIFIED,
      isExpired: Boolean(payload.expired || payload.isExpired),
      isCancelled: Boolean(payload.cancelled || payload.isCancelled),
      verifyCount: Number(payload.verifyCount || payload.hostVerifyCount || 0),
      invalidReason: ''
    }
  } catch (err) {
    console.error('获取宴席主家验真信息失败:', err)
    const respData = err && err.response && err.response.data
    banquetInfo.value.valid = false
    banquetInfo.value.invalidReason = normalizeServerMessage(
      respData && (respData.message || respData.msg),
      '验真链接无效或已过期，不可进行身份验真'
    )
  } finally {
    if (pageLoadingTimer) {
      clearTimeout(pageLoadingTimer)
      pageLoadingTimer = null
    }
    pageLoading.value = false
    pageReady.value = true
  }
}

onMounted(() => {
  fetchInitData()
})
</script>

<style lang="scss" scoped>
.banquet-page {
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background-color: #F4F5F7;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  color: #1F1F1F;
  box-sizing: border-box;
  position: relative;
}

.banquet-header {
  height: 48px;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.banquet-header-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
}

.banquet-header-icon {
  width: 20px;
  height: 20px;
}

.banquet-header-title {
  font-size: 17px;
  font-weight: 600;
  color: #1F1F1F;
  text-align: center;
}

.banquet-header-placeholder {
  width: 32px;
  height: 32px;
}

.banquet-body {
  padding: 12px 14px 36px;
}

.banquet-status-card {
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.banquet-status-label {
  font-size: 15px;
  color: #555555;
  font-weight: 400;
}

.banquet-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

.banquet-badge-unverified {
  background-color: #EEEFF2;
  color: #8C8E93;
}

.banquet-badge-passed {
  background-color: #E7F7EE;
  color: #20A162;
}

.banquet-badge-failed {
  background-color: #FCECEE;
  color: #D9483B;
}

.banquet-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;
}

.banquet-dot-unverified {
  background-color: #8C8E93;
}

.banquet-dot-passed {
  background-color: #20A162;
}

.banquet-dot-failed {
  background-color: #D9483B;
}

.banquet-info-card {
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.banquet-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #222222;
  margin-bottom: 14px;
}

.banquet-info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
}

.banquet-info-label {
  color: #7A7D82;
  flex-shrink: 0;
  margin-right: 12px;
}

.banquet-info-value {
  color: #2B2D30;
  text-align: right;
  word-break: break-all;
}

.banquet-verify-card {
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.banquet-cert-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.banquet-cert-label {
  font-size: 14px;
  color: #555555;
  margin-right: 8px;
}

.banquet-example-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #BC9C53;
  color: #FFFFFF;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 3px;
  cursor: pointer;
  &:active {
    opacity: 0.85;
  }
}

.banquet-error-tip {
  font-size: 12px;
  line-height: 1.45;
  color: #D9483B;
  margin-bottom: 10px;
}

.banquet-upload-box {
  border: 1px dashed #C7AA63;
  background-color: #F7F5EE;
  border-radius: 8px;
  min-height: 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
  &:active {
    opacity: 0.9;
  }
}

.banquet-upload-input {
  display: none;
}

.banquet-upload-plus {
  font-size: 26px;
  line-height: 1;
  color: #B49345;
  margin-bottom: 6px;
}

.banquet-upload-text {
  font-size: 13px;
  color: #B49345;
}

.banquet-preview-wrap {
  width: 100%;
  height: 148px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banquet-preview-img {
  max-width: 100%;
  max-height: 148px;
  object-fit: contain;
}

.banquet-preview-reupload {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.48);
  color: #FFFFFF;
  font-size: 12px;
  text-align: center;
  padding: 4px 0;
}

.banquet-cert-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #9A9CA0;
}

.banquet-idcard-label {
  font-size: 14px;
  color: #555555;
  margin-bottom: 10px;
}

.banquet-idcard-input {
  width: 100%;
  height: 44px;
  border: 1px solid #DCDFE6;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  color: #1F1F1F;
  background-color: #FFFFFF;
  box-sizing: border-box;
  outline: none;
  margin-bottom: 10px;
  &:focus {
    border-color: #B5954B;
  }
  &::placeholder {
    color: #B0B3B8;
  }
}

.banquet-idcard-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #9A9CA0;
}

.banquet-submit-wrap {
  margin-top: 4px;
}

.banquet-submit-btn {
  width: 100%;
  height: 46px;
  background-color: #B6954B;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  &:active {
    opacity: 0.88;
  }
}

.banquet-lock-card {
  background-color: #FFFFFF;
  border-radius: 10px;
  padding: 46px 20px 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.banquet-lock-icon {
  margin-bottom: 16px;
}

.banquet-lock-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333333;
}

.banquet-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 28px;
  z-index: 100;
}

.banquet-modal-box {
  width: 100%;
  max-width: 320px;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 28px 22px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
}

.banquet-loading-spinner {
  width: 54px;
  height: 54px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.banquet-loading-dot {
  position: absolute;
  border-radius: 50%;
  background-color: #B3B5B9;
  animation: banquetFadeSpin 0.96s linear infinite;
}

@keyframes banquetFadeSpin {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

.banquet-loading-title {
  font-size: 17px;
  font-weight: 600;
  color: #222222;
  margin-bottom: 10px;
}

.banquet-loading-desc {
  font-size: 13px;
  color: #666666;
}

.banquet-result-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.banquet-icon-success {
  background-color: #E7F7EE;
}

.banquet-icon-fail {
  background-color: #FCECEE;
}

.banquet-result-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 10px;
}

.banquet-title-success {
  color: #18A058;
}

.banquet-title-fail {
  color: #C93B2B;
}

.banquet-title-limit {
  color: #222222;
  margin-top: 6px;
  margin-bottom: 14px;
}

.banquet-result-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #555555;
  margin-bottom: 20px;
}

.banquet-modal-btn {
  width: 196px;
  height: 40px;
  background-color: #B6954B;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:active {
    opacity: 0.88;
  }
}

.banquet-sample-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.52);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 28px;
  z-index: 110;
}

.banquet-sample-wrap {
  width: 100%;
  max-width: 330px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.banquet-sample-img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  margin-bottom: 14px;
}

.banquet-sample-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:active {
    opacity: 0.85;
  }
}

.banquet-toast-box {
  position: fixed;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(38, 38, 38, 0.88);
  color: #FFFFFF;
  font-size: 13px;
  line-height: 1.5;
  padding: 12px 18px;
  border-radius: 6px;
  text-align: center;
  width: max-content;
  max-width: 82vw;
  box-sizing: border-box;
  z-index: 120;
}

.banquet-toast-line {
  word-break: break-word;
}
</style>
