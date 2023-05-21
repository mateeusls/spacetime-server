import axios from 'axios'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const bodySchema = z.object({
      code: z.string(),
    })

    // Esté código é responsável por pegar o código que o github retorna
    const { code } = bodySchema.parse(request.body)

    // Enviamos o code para o github e recebemos o access_token
    const accessTokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          accept: 'application/json',
        },
      },
    )

    const { access_token: accessToken } = accessTokenResponse.data

    // Usamos o access_token para pegar as informações do usuário
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const userSchema = z.object({
      id: z.number(),
      login: z.string(),
      avatar_url: z.string().url(),
      name: z.string(),
    })

    const userInfo = userSchema.parse(userResponse.data)

    // Verificamos se o usuário já existe no banco de dados
    let user = await prisma.user.findUnique({
      where: {
        githubId: userInfo.id,
      },
    })

    // Se não existir, criamos um novo usuário
    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: userInfo.id,
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url,
          login: userInfo.login,
        },
      })
    }

    // Criamos um token para o usuário
    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      },
    )

    return { token }
  })
}
