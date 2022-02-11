import {getModelForClass, prop, ModelOptions} from '@typegoose/typegoose'
import {role} from '../types/RoleEnum'
import {Field, ObjectType} from 'type-graphql'
import LikeModel from './LikeModel'

@ModelOptions({schemaOptions: {timestamps: true}})
@ObjectType()
class User {
	@Field()
	public _id: string

	@Field()
	@prop({required: true, unique: true})
	public email: string

	@Field()
	@prop({required: true})
	public username: string

	@prop({required: true})
	public password: string

	@Field()
	@prop({
		required: true,
		default:
			'https://iptc.org/wp-content/uploads/2018/05/avatar-anonymous-300x300.png',
	})
	public avatar: string

	@Field()
	@prop()
	createdAt: Date

	@Field()
	@prop()
	updatedAt: Date

	// role field
	@Field(() => [role])
	@prop({default: role.user})
	role: role[]

	// like field
	@Field(() => [String], {nullable: true})
	@prop({
		ref: () => LikeModel,
		default: [],
	})
	likes: string[]
	// key word field
	@Field(() => [String], {nullable: true})
	@prop({default: []})
	keywords: string[];
	// post User Was watch
	@Field(() => [String], { nullable: true })
	@prop({ default: [] })
	postWasWatch: string[];
}
export default User
export const userModel = getModelForClass(User)
