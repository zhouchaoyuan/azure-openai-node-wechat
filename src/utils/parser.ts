import { XMLParser } from 'fast-xml-parser'
import type { FastifyInstance } from 'fastify'

const xmlParser = new XMLParser()

export default function configureParser(server: FastifyInstance) {
  server.addContentTypeParser(['text/xml', 'application/xml'], (
    request, payload, done,
  ) => {
    const chunks: Uint8Array[] = []
    payload.on('data', (chunk) => {
      chunks.push(chunk)
    })
    payload.on('end', () => {
      try {
        const xml = Buffer.concat(chunks).toString()
        const result = xmlParser.parse(xml)
        done(null, result)
      }
      catch (err) {
        done(err as Error)
      }
    })
  })
}
