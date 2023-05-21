import 'dotenv/config'

import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastify from 'fastify'
import { resolve } from 'path'
import { authRoutes } from './routes/auth'
import { memoriesRoutes } from './routes/memories'
import { uploadRoutes } from './routes/upload'

const app = fastify()

app.register(multipart)

app.register(require('@fastify/static'), {
  root: resolve(__dirname, '../uploads'),
  prefix: '/uploads',
})

app.register(jwt, {
  secret: 'Sp@ceTime',
})

app.register(cors, {
  origin: true,
})

app.register(memoriesRoutes)
app.register(authRoutes)
app.register(uploadRoutes)

// Start the server on port 3333
app
  .listen({
    port: 3333,
  })
  .then(() => console.log('🚀 HTTP server running on http://localhost:3333'))
