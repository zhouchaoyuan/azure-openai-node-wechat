import type { FastifyInstance } from 'fastify'
import verify from './wechat/verify'
import wechatAcceptor from './wechat/acceptor'
import openAIAcceptor from './azureopenai/acceptor'

function setUpRouter(server: FastifyInstance) {
  // verify wechat request
  verify(server)
  // accept wechat request
  wechatAcceptor(server)

  // Azure openai sample api receive the request
  openAIAcceptor(server)
}

export default setUpRouter
