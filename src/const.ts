/// ACCESS_TOKEN START
(globalThis as any).accessToken = ''

/// API ADDR START
export const wechatApiPath = '/wechat/api'
export const promptPath = '/prompt-process'
export const chatPath = '/chat-process'
/// API ADDR END

/// GENERAL START
export const pastMessagesIncluded = 6
export const chatDeploymentName = 'IdeaCreation'
export const promptDeploymentName = 'TextIdeaCreation'
export const chatModel = 'gpt-35-turbo'
export const promptModel = 'text-davinci-003'
/// GENERAL START
