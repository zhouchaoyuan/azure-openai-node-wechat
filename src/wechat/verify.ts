import type { FastifyInstance, FastifyRequest } from 'fastify'
import { apiPath as wechatApiPath, wechatToken } from '../const'
import { toSha1 } from '../utils/encryptor'
import type { VerifyQuery } from './types'

export function checkIsWechatRequest(request: FastifyRequest) {
  const q = request.query as VerifyQuery
  try {
    const arr: string[] = [wechatToken, q.timestamp.toString(), q.nonce.toString()]
    arr.sort((a, b) => a.localeCompare(b))
    const sha1 = toSha1(arr.join(''))
    if (sha1 === q.signature) {
      // Success.
      return true
    }
    else {
      return false
    }
  }
  catch (error) {
    console.error(error)
    return false
  }
}

function route(server: FastifyInstance) {
  // setup hook
  server.addHook('onRequest', (request, reply, done) => {
    // TODO: Do we need to add this hook for all wechat request?
    if (request?.url?.startsWith(wechatApiPath)) {
      if (checkIsWechatRequest(request)) {
        // Continue.
        done()
      }
      else {
        reply.send('who are you?')
      }
    }
    else {
      done()
    }
  })

  server.get(wechatApiPath, (request: FastifyRequest, reply) => {
    const q = request.query as VerifyQuery
    if (checkIsWechatRequest(request)) {
      // Success.
      reply.send(q.echostr)
    }
    else {
      reply.send('who are you?')
    }
  })
}

export default route
