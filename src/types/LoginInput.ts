import {Field, InputType} from 'type-graphql';

@InputType()
export class LoginInput {
	@Field()
	UsernameOrEmail: string;
	@Field()
	password: string;
}
