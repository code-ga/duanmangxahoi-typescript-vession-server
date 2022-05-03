import {defaultCategory} from '../constraint'
import {Field, InputType} from 'type-graphql'

@InputType()
export class CreatePostInput {
	@Field()
	title: string
	@Field()
	content: string
	@Field({nullable: true, description: `default is ${defaultCategory}`})
	category?: string
	// is alert
	@Field({nullable: true, defaultValue: false})
	isAlert?: boolean
}
