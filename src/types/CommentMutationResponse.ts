import {Field, ObjectType} from 'type-graphql'
import {IMutationResponse} from './BaseResponseType'
import {FieldError} from './errorField'
import Comment from '../model/comment'

@ObjectType({implements: IMutationResponse})
export class CommentMutationResponse implements IMutationResponse {
	code: number
	success: boolean
	message?: string
	@Field(() => [FieldError], {nullable: true})
	errors?: FieldError[]
	@Field(() => [Comment], {nullable: true})
	comment?: Comment[]
}
