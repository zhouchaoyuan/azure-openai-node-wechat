/* eslint-disable no-console */
import crypto from 'crypto'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { isUUID } from 'src/utils/is'
import type { ChatCompletionRequestMessage } from 'azure-openai'
import { FixedQueue } from 'src/utils/FixedQueue'
import { pastMessagesIncluded, wechatApiPath } from '../const'
import { generateTextResponse } from '../utils/responser'
import { GetAzureOpenAIChatAnswerAsync } from '../azureopenai/chatgpt'

const cacheMap = new Map()
const checkTimes = new Map()
const chatHistory = new Map() // cache in memory, should be cleared.
const queryCacheMap = new Map()

async function handleMsg(xml: any, reply: FastifyReply) {
  if (xml.MsgType === 'text' || xml.MsgType === 'voice') {
    handleTextMsg(xml, reply)
  }
  else if (xml.MsgType === 'event') {
    if (xml.Event === 'subscribe' || xml.Event === 'SCAN')
      reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, '感谢您的支持，我可以作为你的智能助手，我非常智能，虽然我只有鱼的记忆，但是你的问题我一定拼尽全力！！谢谢。'))
    else
      reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, '非常遗憾（so sad）'))
  }
  else { reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, '只支持文字消息（only support text message）')) }
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
  const msg = (xml?.Content?.toString() ?? xml?.Recognition?.toString()) as string
  if (msg === undefined || msg.trim().length === 0) {
    reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, '咋回事，不能发送空内容哦（empty text）'))
  }
  else {
    if (isUUID(msg)) {
      if (queryCacheMap.has(msg)) {
        const requestKey = queryCacheMap.get(msg)
        if (cacheMap.has(requestKey)) {
          const resp = cacheMap.get(requestKey)
          if (resp != null) {
            reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, resp))
            return
          }
        }
      }
      else {
        reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName,
          '您输入的标识可能已经过期或者输入过快还没有处理得到结果'))
        return
      }
    }
    const uuidKey = crypto.randomUUID()
    const requestKey = `${xml.FromUserName}_${xml.CreateTime}`
    if (!cacheMap.has(requestKey)) {
      const fq = getChatHistoryForUser(xml.FromUserName.toString())
      fq.enqueue({ role: 'user', content: msg })
      GetAzureOpenAIChatAnswerAsync(fq.toArray(), xml.FromUserName.toString())
        .then((response) => {
          if (!reply.sent) // return the result directly within 5s
            reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, response))
          cacheMap.set(requestKey, response)
          fq.enqueue({ role: 'assistant', content: response })
        }).catch((reason) => {
          if (!reply.sent) // return the result directly within 5s
            reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, reason))
          cacheMap.set(requestKey, reason)
        })
      cacheMap.set(requestKey, null)
      checkTimes.set(requestKey, 1)
    }
    else {
      const resp = cacheMap.get(requestKey)
      if (resp != null) {
        reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, resp))
      }
      else {
        const checkTime = checkTimes.get(requestKey) as number
        if (checkTime === 2) { // this is the third retry from wechat, we need to response the result within 5s
          const resp = cacheMap.get(requestKey)
          if (resp != null) {
            reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, resp))
          }
          else {
            // wait another 3s to get response, so total timeout value is 5 + 5 + 3 = 13s
            setTimeout(() => {
              const resp = cacheMap.get(requestKey)
              if (resp != null) {
                reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName, resp))
              }
              else {
                queryCacheMap.set(uuidKey, requestKey)
                reply.send(generateTextResponse(xml.FromUserName, xml.ToUserName,
                  `哎哟，超时啦！请耐心等待 30 秒后输入下面的标识获取 chatgpt 的回复：\n
                  <a href="weixin://bizmsgmenu?msgmenucontent=${uuidKey}&msgmenuid=1">${uuidKey}</a>`))
              }
            }, 3 * 1000)
          }
        }
        else {
          checkTimes.set(requestKey, checkTimes.get(requestKey) as number + 1)
          console.log(checkTimes.get(requestKey))
        }
      }
    }
    // cache 3 mins, this can be optimized.
    setTimeout(() => {
      console.log('delete cache')
      cacheMap.delete(requestKey)
      checkTimes.delete(requestKey)
      queryCacheMap.delete(uuidKey)
    }, 180 * 1000)
  }
}

function getChatHistoryForUser(requestKey: string) {
  if (!chatHistory.has(requestKey))
    chatHistory.set(requestKey, new FixedQueue<ChatCompletionRequestMessage>(pastMessagesIncluded))
  return chatHistory.get(requestKey)
}

function route(server: FastifyInstance) {
  server.post(wechatApiPath, (request, reply) => {
    const xml = request.body as any
    handleMsg(xml.xml, reply)
  })
}

export default route
