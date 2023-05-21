import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { extname, resolve } from 'node:path'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

// pipeline é um callback, por isso precisamos transformá-lo em uma promise com o promisify
const pump = promisify(pipeline)

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request, reply) => {
    const upload = await request.file({
      limits: {
        fileSize: 5_242_880, // 5mb
      },
    })

    if (!upload) {
      return reply.status(400).send()
    }

    const mimTypeRegex = /^(image|video)\/[a-zA-Z]+/
    const isMimeTypeValid = mimTypeRegex.test(upload.mimetype)

    if (!isMimeTypeValid) {
      return reply.status(400).send()
    }

    const fileId = randomUUID()
    const extension = extname(upload.filename)

    const fileName = fileId.concat(extension)

    const writeStream = createWriteStream(
      resolve(__dirname, '../../uploads/', fileName),
    )

    await pump(upload.file, writeStream)

    const fullURL = request.protocol.concat('://').concat(request.hostname)
    const fileURL = new URL(`/uploads/${fileName}`, fullURL).toString()

    return { fileURL }
  })
}
