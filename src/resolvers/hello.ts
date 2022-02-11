import {Query, Resolver, Ctx} from 'type-graphql';
import {Context} from '../types/Context';
// hello resolver
@Resolver()
export class HelloResolver {
	@Query(() => String)
	hello(@Ctx() {req}: Context) {
		console.log(req.session.userId);
		return 'Hello World!';
	}
}
