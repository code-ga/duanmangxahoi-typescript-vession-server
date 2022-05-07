import {Query, Resolver, Ctx} from 'type-graphql'
import {Context} from '../types/Context'
// hello resolver
@Resolver()
export class HelloResolver {
	@Query(() => String)
	hello(@Ctx() {req}: Context) {
		const userId = req.session.userId
		console.log(userId)
		return 'Hello World!'
	}
}
