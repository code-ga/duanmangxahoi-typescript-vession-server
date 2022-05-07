import {Field, ObjectType} from 'type-graphql'
import {AppInfo} from '../model/appInfo'
import {IMutationResponse} from './BaseResponseType'
import {FieldError} from './errorField'

@ObjectType({implements: IMutationResponse})
export class AppInfoMutationResponse implements IMutationResponse {
	code: number
	success: boolean
	message?: string
	@Field(() => [FieldError], {nullable: true})
	errors?: FieldError[]
	@Field(() => AppInfo, {nullable: true})
	AppInfo?: AppInfo
}
