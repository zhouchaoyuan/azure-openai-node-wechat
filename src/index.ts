/* eslint-disable no-console */
import Fastify from 'fastify'
import * as dotenv from 'dotenv'
import { isNotEmptyString } from './utils/is'
import parser from './utils/parser'
import router from './router'

dotenv.config()

if (!isNotEmptyString(process.env.OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable')

const server = Fastify({
  logger: true,
})

const port = 80

function main() {
  parser(server)
  router(server)
  // Run the server!
  server.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
    // Server is now listening on ${address}
    console.log('Server listening at', port)
  })
}

main()
