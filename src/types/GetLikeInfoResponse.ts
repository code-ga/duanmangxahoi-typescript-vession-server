import {Field, ObjectType} from 'type-graphql'
import {IMutationResponse} from './BaseResponseType'
import {FieldError} from './errorField'
import Like from '../model/LikeModel'

@ObjectType({implements: IMutationResponse})
export class GetLikeInfoResponse implements IMutationResponse {
	code: number
	success: boolean
	message?: string
	@Field(() => [FieldError], {nullable: true})
	errors?: FieldError[]
	@Field(() => [Like], {nullable: true})
	like?: Like[]
}
