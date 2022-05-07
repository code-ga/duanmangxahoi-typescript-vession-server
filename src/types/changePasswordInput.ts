import {Field, InputType} from 'type-graphql';

@InputType()
export class ChangePasswordInputType {
    @Field()
    NewPassword: string;
}
