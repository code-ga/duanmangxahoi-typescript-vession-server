import {getModelForClass, prop, modelOptions} from '@typegoose/typegoose';
import {Field, ObjectType} from 'type-graphql';

@modelOptions({
	schemaOptions: {
		timestamps: true,
	},
})
@ObjectType()
export class Category {
	@Field()
	@prop({required: true})
	name: string;
	// all post in this category
	@Field(() => [String])
	@prop({required: true, default: []})
	posts: string[];
	// field _id
	@Field()
	_id: string;
}
export const CategoryModel = getModelForClass(Category);
