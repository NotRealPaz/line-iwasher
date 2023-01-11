import * as line from '@line/bot-sdk'
import express from 'express'
import check from './src/check.js'
(await import('dotenv')).config()

const config = {
  channelAccessToken: process.env.CHANNELACCESSTOKEN,
  channelSecret: process.env.CHANNELSECRET
}

let data = await check()
const subscribe = {}

setInterval(async () => {
  data = await check()
  const keys = Object.keys(subscribe)
  keys.forEach(async i => {
    if (subscribe[i].length === 0) return
    if (data[i] === 'Free') {
      [...new Set(subscribe[i])].forEach(async userId => {
        return await client.pushMessage(userId, { type: 'text', text: `เครื่องที่ ${(+i) + 1} ซักเสร็จแล้ว` })
      })
      subscribe[i] = []
    }
  })
  // console.log(subscribe)
}, 1000 * 10 /* 10 seconds */)

const app = express()
app.post('/webhook', line.middleware(config), async (req, res) => {
  return res.json(await Promise.all(req.body.events.map(handleEvent)))
})

const client = new line.Client(config)

// client.broadcast({ type: 'text', text: 'ระบบถูกรีเซ็ต การแจ้งเตือนของคุณอาจถูกยกเลิก' })

const formatdata = () => data.map((val, i) => {
  const status = val === 'Free' ? '✅' : val === 'Using' ? '❌' : '⁉️'
  return `เครื่องที่ ${i + 1}: ${status}`
}).join`\r\n`

const reply = async (token, text) => await client.replyMessage(token, {
  type: 'text', text
})

const handleEvent = async (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') return null

  const [command, arg] = event.message.text.trim().toLowerCase().split(/ +/g)
  // console.log('command:', command)
  // console.log('arg:', arg)
  // console.log('data:', data)

  if (command === 'check') {
    return await reply(event.replyToken, formatdata())
  }

  if (command === 'sub') {
    const target = (+arg) - 1
    if (target >= 0 && target <= data.length - 1) {
      if (data[target] === 'Unknown') return await reply(event.replyToken, '❌ เครื่องไม่พร้อมใช้งาน')
      if (data[target] === 'Free') return await reply(event.replyToken, '❌ เครื่องว่างอยู่แล้ว')
      if (!subscribe[target]) subscribe[target] = []
      if (event.source.type !== 'user') return await reply(event.replyToken, '❌ รองรับเฉพาะบัญชีปกติ')
      if (subscribe[target].includes(event.source.userId)) return await reply(event.replyToken, '✅ พร้อมแจ้งเตือนอยู่แล้ว')
      subscribe[target].push(event.source.userId)
      return await reply(event.replyToken, `✅ จะแจ้งเตือนเมื่อเครื่อง ${arg} ซักเสร็จ`)
    } else {
      return await reply(event.replyToken, `❌ เลือกหมายเลขเครื่องระหว่าง 1 - ${data.length}`)
    }
  }

  return await reply(event.replyToken, 'ใช้คำสั่ง\r\ncheck - ดูสถาณะ\r\nsub {n} - แจ้งเตือนเครื่อง\r\nเช่น\r\nsub 6')
}

app.listen(process.env.PORT)
