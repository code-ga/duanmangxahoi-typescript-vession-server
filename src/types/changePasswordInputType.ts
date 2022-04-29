import {Field, InputType} from 'type-graphql';

@InputType()
export class ChangePasswordAfterLoginInputType {
	@Field()
	oldPassword: string;

	@Field()
	newPassword: string;
}
