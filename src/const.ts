/// ACCESS_TOKEN START
(globalThis as any).accessToken = ''

/// KEY START
export const openApiKey: string = process.env.OPENAI_API_KEY ?? ''
export const openApiBaseUrl: string = process.env.OPENAI_API_BASE_URL ?? ''
export const wechatToken: string = process.env.WECHAT_TOKEN ?? ''
export const wechatAppID: string = process.env.WECHAT_APPID ?? ''
export const wechatSecret: string = process.env.WECHAT_SECRET ?? ''
export function wechatAccessToken() {
  return process.env.WECHAT_ACESS_TOKEN ?? ''
}
/// KEY END

/// API ADDR START
export const apiPath = '/wechat/api'
export const promptPath = '/prompt-process'
export const chatPath = '/chat-process'
/// API ADDR END
