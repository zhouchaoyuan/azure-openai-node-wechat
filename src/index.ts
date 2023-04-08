/* eslint-disable no-console */
import express from 'express'
import JSSHA from 'jssha'
import * as dotenv from 'dotenv'
// import { Configuration, OpenAIApi } from 'openai'
import { Configuration, OpenAIApi } from 'azure-openai'
import type { WechatVerificationRequestProps } from './types'
import { isNotEmptyString } from './untils/is'

const app = express()
const router = express.Router()
const config = {
  token: process.env.WECHAT_TOKEN,
  appID: process.env.WECHAT_APPID,
  appsecret: process.env.WECHAT_APP_SECRET,
  EncodingAESKey: process.env.WECHAT_ENCODING_AES_KEY,
}

if (!isNotEmptyString(process.env.OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable')

dotenv.config()

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

// wechat handle
router.get('/wx', async (req, res) => {
  try {
    const { token } = config
    const {
      signature,
      timestamp,
      nonce,
      echostr,
    } = req.query as WechatVerificationRequestProps

    const array = [token, timestamp, nonce]
    array.sort()
    const tempStr = array.join('')
    const shaObj = new JSSHA('SHA-1', 'TEXT')
    shaObj.update(tempStr)
    const scyptoString = shaObj.getHash('HEX')

    if (signature === scyptoString)
      res.send(echostr)
    else
      res.send('we chat verification error!')
  }
  catch (error) {
    res.send('we chat verification error!')
  }
})

router.post('/prompt-process', async (req, res) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE_URL,
      // add azure info into configuration
      azure: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: process.env.OPENAI_API_BASE_URL,
        deploymentName: 'TextIdeaCreation',
      },
    })
    const openai = new OpenAIApi(configuration)
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: 'Translate the following to French and Spanish. \n\n1. On a scale of 1 to 10, how satisfied are you with your in-store experience today?\n2. How likely are you to recommend our product to others?',
      max_tokens: 800,
    })
    console.log('response-content: ', completion.data.choices[0].text)
    res.send(completion.data.choices[0].text)
  }
  catch (error) {
    if (error.response)
      console.log(error.response.status, error.response.data)
    else
      console.log(error.message)
    res.send('暂不支持 (unsupported temporally)')
  }
})

router.post('/chat-process', async (req, res) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE_URL,
      // add azure info into configuration
      azure: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: process.env.OPENAI_API_BASE_URL,
        deploymentName: 'IdeaCreation',
      },
    })
    const openai = new OpenAIApi(configuration)
    const completion = await openai.createChatCompletion({
      model: 'gpt-35-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that helps people find information.',
        },
        {
          role: 'assistant',
          content: 'As an AI language model, I don\'t have the capability to show pictures. However, I can help you find pictures on the internet. What kind of picture are you looking for?',
        },
        {
          role: 'user',
          content: 'please give me a picture with a beautiful girl',
        },
        {
          role: 'assistant',
          content: '**The response was filtered due to the prompt triggering Azure OpenAI’s content management policy. Please modify your prompt and retry. To learn more about our content filtering policies please read our documentation.** [Learn more](https://go.microsoft.com/fwlink/?linkid=2198766)',
        },
        {
          role: 'user',
          content: 'please give me a picture with a dog',
        },
        {
          role: 'assistant',
          content: 'Sure! Here is a picture of a cute dog:\n\n![Cute Dog](https://www.thesprucepets.com/thmb/1l0EwB6cCvJ8Wz6XyX6-2U6Jxv8=/1500x1000/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1214943584-5a8f7a5c23d74d7c8e5b5c7c5d5d5f3a.jpg)',
        },
        {
          role: 'user',
          content: 'where is my picture',
        },
        {
          role: 'assistant',
          content: 'As an AI language model, I don\'t have the capability to show pictures directly. However, I can help you find pictures on the internet. Please let me know what kind of picture you would like to see and I\'ll do my best to find it for you.',
        },
        {
          role: 'user',
          content: 'give me some ideas for writing code',
        },
        {
          role: 'assistant',
          content: 'Sure, here are some ideas for writing code:\n\n1. Build a weather app that gets real-time weather data from an API and displays it to the user.\n2. Create a calculator app that performs basic arithmetic operations such as addition, subtraction, multiplication, and division.\n3. Develop a web-based game using HTML, CSS, and JavaScript.\n4. Write a program that generates a random password with a specified length and complexity.\n5. Build a chatbot that interacts with users and provides helpful information or assistance.\n6. Create a program that reads data from a CSV file and performs various data analysis tasks.\n7. Develop a mobile app that uses GPS to track the user\'s location and provides location-based services.\n8. Write a program that simulates a game of blackjack or poker.\n9. Build a website that displays information about a particular topic, such as a hobby or interest.\n10. Create a program that encrypts and decrypts messages using various encryption algorithms.',
        },
        {
          role: 'user',
          content: 'Do you know leetcode, could you please help me solve two sum problem?',
        },
      ],
      max_tokens: 800,
    })
    console.log('response-content: ', completion.data.choices[0].message.content)
    res.send(completion.data.choices[0].message.content)
  }
  catch (error) {
    if (error.response)
      console.log(error.response.status, error.response.data)
    else
      console.log(error.message)
    res.send('暂不支持 (unsupported temporally)')
  }
})

app.use('', router)
// app.use('/api', router)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
