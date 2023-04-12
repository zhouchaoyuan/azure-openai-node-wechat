import { XMLBuilder } from 'fast-xml-parser'

export function generateTextResponse(toUser: string, fromUser: string, text: string) {
  const xmlBuilder = new XMLBuilder({})
  // <xml>
  //   <ToUserName><![CDATA[toUser]]></ToUserName>
  //   <FromUserName><![CDATA[fromUser]]></FromUserName>
  //   <CreateTime>12345678</CreateTime>
  //   <MsgType><![CDATA[text]]></MsgType>
  //   <Content><![CDATA[你好]]></Content>
  // </xml>
  return xmlBuilder.build({
    xml: {
      ToUserName: toUser,
      FromUserName: fromUser,
      CreateTime: Date.now(),
      MsgType: 'text',
      Content: text,
    },
  })
}
