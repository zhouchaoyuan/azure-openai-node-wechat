import crypto from 'crypto'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { isUUID } from 'src/utils/is'
import { apiPath } from '../const'
import { generateTextResponse } from '../utils/responser'
import { GetAzureOpenAIAnswerAsync } from '../azureopenai/chatgpt'

const cacheMap = new Map()
const queryCacheMap = new Map()

async function handleMsg(xml: any, reply: FastifyReply) {
  if (xml.MsgType === 'text') {
    handleTextMsg(xml, reply)
  }
  else {
    // fallback, 返回空串
    reply.send('只支持文字消息（only support text message）')
  }
}

// <xml>
//   <ToUserName><![CDATA[toUser]]></ToUserName>
//   <FromUserName><![CDATA[fromUser]]></FromUserName>
//   <CreateTime>1348831860</CreateTime>
//   <MsgType><![CDATA[text]]></MsgType>
//   <Content><![CDATA[this is a test]]></Content>
//   <MsgId>1234567890123456</MsgId>
//   <MsgDataId>xxxx</MsgDataId>
//   <Idx>xxxx</Idx>
// </xml>
async function handleTextMsg(xml: any, reply: FastifyReply) {
  const msg = xml.Content.toString() as string
  if (msg.trim().length === 0) {
    reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, '咋回事，不能发送空内容哦（empty text）'))
  }
  else {
    if (isUUID(msg) && queryCacheMap.has(msg)) {
      const requestKey = queryCacheMap.get(msg)
      if (cacheMap.has(requestKey)) {
        const resp = cacheMap.get(requestKey)
        if (resp != null) {
          reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, resp))
          return
        }
      }
    }
    const uuidKey = crypto.randomUUID()
    const requestKey = `${xml.FromUserName}_${xml.CreateTime}`
    if (!cacheMap.has(requestKey)) {
      // return response after 4s since the timeout of wechat request is 5s
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('timeout')
        reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, `哎哟，超时啦！请耐心等待 30 秒后输入下面的标识获取 chatgpt 的回复：${uuidKey}`))
      }, 4 * 1000)

      GetAzureOpenAIAnswerAsync(msg, xml.FromUserName.toString()).then((response) => {
        reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, response))
        cacheMap.set(requestKey, response)
        queryCacheMap.set(uuidKey, requestKey)
        // cache 2 mins
        setTimeout(() => {
          cacheMap.delete(requestKey)
          queryCacheMap.delete(uuidKey)
        }, 120 * 1000)
      }).catch((reason) => {
        reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, reason))
      })
    }
    else {
      const resp = cacheMap.get(requestKey)
      reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, resp))
    }
  }
}

function route(server: FastifyInstance) {
  server.post(apiPath, (request, reply) => {
    const xml = request.body as any
    handleMsg(xml.xml, reply)
  })
}

export default route
