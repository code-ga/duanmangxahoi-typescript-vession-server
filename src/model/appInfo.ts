import {ModelOptions, prop, getModelForClass} from '@typegoose/typegoose';
import {Field, ObjectType} from 'type-graphql';

@ModelOptions({
	schemaOptions: {
		timestamps: true,
	},
})
@ObjectType()
export class AppInfo {
	@Field()
	@prop({required: true, default: 'example app name'})
	name: string;
	@Field()
	@prop({required: true, default: 'example app description'})
	description: string;
	// app avatar url
	@Field()
	@prop({required: true, default: 'https://www.example.com/avatar.png'})
	avatarUrl: string;
	// app icon url
	@Field()
	@prop({required: true, default: 'https://www.example.com/icon.png'})
	iconUrl: string;
	// app solution
	@Field()
	@prop({required: true, default: 'https://www.example.com/solution.png'})
	solutionUrl: string;
}

export const AppInfoModel = getModelForClass(AppInfo);
