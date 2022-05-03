import {Field, InputType} from 'type-graphql';

@InputType()
export class UpdatePostInput {
	@Field({nullable: true})
	title?: string
	@Field({nullable: true})
	content?: string
	@Field({nullable: true})
	category?: string
	// is alert
	@Field({nullable: true, defaultValue: false})
	isAlert?: boolean
}
