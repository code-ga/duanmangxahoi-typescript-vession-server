import {Field, InputType} from 'type-graphql';

@InputType()
export class ChangePasswordInputType {
	@Field()
	oldPassword: string;

	@Field()
	newPassword: string;
}
