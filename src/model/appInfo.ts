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
}

export const AppInfoModel = getModelForClass(AppInfo);
