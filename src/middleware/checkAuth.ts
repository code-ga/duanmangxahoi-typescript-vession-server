import {Context} from '../types/Context'
import {MiddlewareFn, Authorized} from 'type-graphql'

export const IsAuthorized: MiddlewareFn<Context> = async (data, next) => {
  const userId = data.context.req.session.userId
  console.log(userId)
  if (!userId) {
    throw Authorized('You are not authorized')
  } else {
    await next()
  }
}
