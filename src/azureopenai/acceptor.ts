import type { FastifyInstance, FastifyReply } from 'fastify'
import { chatPath, promptPath } from '../const'
import { GetAzureOpenAIAnswerAsync, GetAzureOpenAIChatAnswerAsync } from '../azureopenai/chatgpt'

function route(server: FastifyInstance) {
  server.post(promptPath, (request, reply) => {
    // eslint-disable-next-line no-console
    console.log('prompt')
    handlePrompt(request.body, reply)
  })
  server.post(chatPath, (request, reply) => {
    handleChat(request.body, reply)
  })
}
async function handlePrompt(requestBody: any, reply: FastifyReply) {
  GetAzureOpenAIAnswerAsync(requestBody.prompt, 'prompt restapi').then((response) => {
    reply.send(response)
  }).catch((reason) => {
    reply.send(reason)
  })
}

async function handleChat(requestBody: any, reply: FastifyReply) {
  GetAzureOpenAIChatAnswerAsync(requestBody.messages, 'chat restapi').then((response) => {
    reply.send(response)
  }).catch((reason) => {
    reply.send(reason)
  })
}

export default route
