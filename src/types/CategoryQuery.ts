import {Field, ObjectType} from 'type-graphql'
import {IMutationResponse} from './BaseResponseType'
import {FieldError} from './errorField'
import {Category} from './../model/Category'

@ObjectType({implements: IMutationResponse})
export class CategoryResponse implements IMutationResponse {
	code: number
	success: boolean
	message?: string
	@Field(() => [FieldError], {nullable: true})
	errors?: FieldError[]
	@Field(() => [Category], {nullable: true})
	category?: Category[]
}
