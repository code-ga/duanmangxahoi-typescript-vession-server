import {
	getModelForClass,
	ModelOptions,
	Ref,
	prop as Property,
} from '@typegoose/typegoose';
import {Field, ObjectType} from 'type-graphql';
import user from './user';
// import * as autopopulate from "mongoose-autopopulate";
// TODO : REMOVE AUTOPOPULATE i lose for do this

@ObjectType()
@ModelOptions({schemaOptions: {timestamps: true}})
export class Comment {
	// user create comment
	@Field(() => String)
	@Property({
		ref: () => user,
	})
	public authorId: Ref<user>;

	// content comment
	@Field()
	@Property({required: true})
	public content: string;
	// time comment
	@Field()
	@Property()
	public createdAt: Date;
	@Field()
	@Property()
	public updatedAt: Date;
	@Field()
	public _id: string;
	@Field(() => [String])
	@Property({required: true, default: [], type: () => [String]})
	public likes: string[];
	@Field(() => [String])
	@Property({required: true})
	public postId: string;
	// photo comment
	@Field(() => String)
	@Property({required: true, default: [], type: () => [String]})
	public photo: string[];
}
export default Comment;
export const CommentModel = getModelForClass(Comment);
