import {
  getModelForClass,
  ModelOptions,
  Ref,
  prop as Property,
  DocumentType,
} from "@typegoose/typegoose";
import { defaultCategory } from "../constraint";
import { Field, ObjectType } from "type-graphql";
import user from "./user";
import mongoose from "mongoose";
// import * as autopopulate from "mongoose-autopopulate";
// TODO : REMOVE AUTOPOPULATE

@ObjectType()
@ModelOptions({ schemaOptions: { timestamps: true } })
export class Post {
  // title field
  @Field()
  @Property({ required: true })
  public title: string;
  // content field

  @Field()
  @Property({ required: true })
  public content: string;
  // author field

  @Field((_type) => String)
  @Property({
    ref: () => user,
  })
  public author: Ref<user>;
  // image field
  @Field((_type) => [String])
  @Property({ required: true, default: []})
  public photo: string[];

  // keywords field
  @Field(() => [String], { nullable: true })
  @Property({ default: [], required: true })
  public keyword: string[]; // this field is optional the server is generate keyword from title and content

  // time field
  @Field()
  @Property()
  public createdAt: Date;

  @Field()
  @Property()
  public updatedAt: Date;

  @Field()
  public _id: string;

  @Field()
  @Property({ required: true, default: defaultCategory })
  public category: string;

  @Field()
  @Property({ default: 0 })
  public views: number;

  @Field((_type) => [String], { nullable: true })
  @Property({ default: [], ref: () => user })
  public likes: Ref<user>[];

  @Field(() => [String], { nullable: true })
  @Property({ default: [], required: true })
  public comments: string[];

  // is alert post
  @Field()
  @Property({ default: false })
  public isAlert: boolean;
  // unlike field
  @Field(() => [String], { nullable: true })
  @Property({ default: [], required: true, ref: () => user })
  public unlike: Ref<user>[];
}
export default Post;
export const postModel = getModelForClass(Post);
