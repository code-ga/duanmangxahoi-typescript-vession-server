import {Field, InputType} from 'type-graphql'
import {MinLength} from 'class-validator'
@InputType()
export class resisterInput {
  @Field()
  username: string
  @Field()
  email: string
  @Field()
  @MinLength(8)
  password: string
}
