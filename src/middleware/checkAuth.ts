import {Context} from '../types/Context'
import {
  MiddlewareFn,
} from 'type-graphql'
import { AuthenticationError } from 'apollo-server-express'

export const IsAuthorized: MiddlewareFn<Context> = async (data, next) => {
  const userId = data.context.req.session.userId
  console.log(userId)
  if (!userId) {
    throw new AuthenticationError('You are not authorized to perform this action')
  } else {
    await next()
  }
}
