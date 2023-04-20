/* eslint-disable no-console */
import type { ChatCompletionRequestMessage } from 'azure-openai'
import { Configuration, OpenAIApi } from 'azure-openai'
import { chatDeploymentName, chatModel, promptDeploymentName, promptModel } from 'src/const'

export async function GetAzureOpenAIAnswerAsync(content: string, user: string) {
  console.log(`user ${user} try to get prompt answer for \"${content}\".`)
  try {
    const configuration = new Configuration({
      azure: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: process.env.OPENAI_API_BASE_URL,
        deploymentName: promptDeploymentName,
      },
    })
    const openai = new OpenAIApi(configuration)
    const completion = await openai.createCompletion({
      model: promptModel,
      prompt: content,
      max_tokens: 800,
    })
    console.log('prompt response-content: ', completion.data.choices[0].text?.trim())
    return completion.data.choices[0].text?.trim()
  }
  catch (error) {
    if (error.response)
      console.log(error.response.status, error.response.data)
    else
      console.log(error.message)
    return '暂不支持 (unsupported temporally)'
  }
}

export async function GetAzureOpenAIChatAnswerAsync(messages: Array<ChatCompletionRequestMessage>, user: string) {
  console.log(`user ${user} try to get chat answer for \"${messages[messages.length - 1].content}\".`)
  try {
    const configuration = new Configuration({
      azure: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: process.env.OPENAI_API_BASE_URL,
        deploymentName: chatDeploymentName,
      },
    })
    const openai = new OpenAIApi(configuration)
    const completion = await openai.createChatCompletion({
      model: chatModel,
      messages,
      max_tokens: 800,
    })
    console.log('chat response-content: ', completion.data.choices[0].message.content?.trim())
    return completion.data.choices[0].message.content?.trim()
  }
  catch (error) {
    if (error.response)
      console.log(error.response.status, error.response.data)
    else
      console.log(error.message)
    return '暂不支持 (unsupported temporally)'
  }
}
