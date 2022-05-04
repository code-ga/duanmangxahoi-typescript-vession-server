import {Field, InputType} from 'type-graphql'

@InputType()
export class UpdateAppInfoInput {
	@Field({nullable: true, description: 'app name', defaultValue: 'app name'})
	name?: string
	@Field({
		nullable: true,
		description: 'app description',
		defaultValue: 'app description',
	})
	description?: string
}
