import {getModelForClass, prop} from '@typegoose/typegoose'
import {ObjectType} from 'type-graphql'

@ObjectType()
export class Token {
	// field _id
	_id: string

	@prop({required: true})
	token: string

	@prop({required: true})
	userId: string

	@prop({expires: 60 * 5, default: Date.now()})
	public createdAt: Date
}
export const TokenModel = getModelForClass(Token)
