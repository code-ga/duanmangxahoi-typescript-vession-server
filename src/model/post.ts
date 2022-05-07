import {
	getModelForClass,
	ModelOptions,
	prop as Property,
} from '@typegoose/typegoose'
import {defaultCategory} from '../constraint'
import {Field, ObjectType} from 'type-graphql'
import Comment from './comment'
import LikeModel from './LikeModel'
import {Category} from './Category'
import User from './user'
@ObjectType()
@ModelOptions({
	schemaOptions: {
		timestamps: true,
	},
})
export class Post {
	// title field
	@Field()
	@Property({required: true})
	public title: string
	// content field

	@Field()
	@Property({required: true})
	public content: string
	// author field

	@Field(() => String)
	@Property({
		required: true,
	})
	public authorId: string

	@Field(() => User)
	author: User
	// image field
	@Field(() => [String])
	@Property({required: true, default: [], type: () => [String]})
	public photo: string[]

	// keywords field
	@Field(() => [String], {nullable: true})
	@Property({default: [], required: true, type: () => [String]})
	public keyword: string[] // this field is optional the server is generate keyword from title

	@Field()
	public _id: string

	@Field()
	@Property({required: true, default: defaultCategory, ref: Category})
	public category: string

	@Field()
	@Property({default: 0})
	public views: number

	@Field(() => [String], {nullable: true})
	@Property({
		default: [],
		required: true,
		ref: () => Comment,
		type: () => [String],
	})
	public comments: string[]

	// is alert post
	@Field()
	@Property({default: false})
	public isAlert: boolean

	// like field
	@Field(() => [String])
	@Property({
		default: [],
		required: true,
		ref: () => LikeModel,
		type: () => [String],
	})
	public likes: string[]

	// like number
	@Field()
	@Property({default: 0})
	public likeNumber: number
	
	// time field
	@Field()
	@Property()
	public createdAt: Date

	@Field()
	@Property()
	public updatedAt: Date
}
export default Post
export const postModel = getModelForClass(Post)
