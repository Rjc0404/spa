import axios from 'axios'

/**
 * 独立 axios 实例（用于 H5 免登录接口，避免触发 PC 端 ElementPlus 的 ElNotification 弹窗）
 * 网关已在 miniapp-auth 的 primus.ignoreUrls 放行：/rest/banquet/hostVerify/**
 */
const h5Http = axios.create({
  baseURL: import.meta.env.VITE_HOST_VERIFY_BASE_API || '',
  timeout: 60000
})

/**
 * 1. 查询宴席主家验真页信息（H5免登录）
 * GET /rest/banquet/hostVerify/info?token=xxx
 * @param {string} token - 验真链接 token
 */
export async function getBanquetVerifyInfo(token) {
  const response = await h5Http.get('/rest/banquet/hostVerify/info', {
    params: { token }
  })
  return response.data
}

/**
 * 2. 提交宴席主家身份验真（H5免登录）
 * POST /rest/banquet/hostVerify/submit
 * Content-Type: multipart/form-data
 * @param {Object} params
 * @param {string} params.token - 验真链接 token（必传）
 * @param {File} [params.image] - 结婚证内页照片文件流（婚宴必传）
 * @param {string} [params.idNo] - 主家身份证号（非婚宴必传）
 */
export async function submitBanquetVerify({ token, image, idNo }) {
  const formData = new FormData()
  formData.append('token', token || '')
  if (image) {
    const fileName = image.name || `marriage_cert_${Date.now()}.jpg`
    formData.append('image', image, fileName)
  }
  if (idNo !== undefined && idNo !== null && idNo !== '') {
    formData.append('idNo', idNo)
  }

  const response = await h5Http.post('/rest/banquet/hostVerify/submit', formData)
  return response.data
}

/**
 * 3. 根据字典类型编码查询字典项列表（H5免登录）
 * GET /rest/tsa/dictDataRestApiController/getValuesByCode?type=banquetHostVerifyStatus
 * @param {string} type - 字典组编码
 */
export async function getDictValuesByCode(type) {
  const response = await h5Http.get('/rest/tsa/dictDataRestApiController/getValuesByCode', {
    params: { type }
  })
  return response.data
}
