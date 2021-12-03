import {
  getModelForClass,
  ModelOptions,
  Ref,
  prop as Property,
} from "@typegoose/typegoose";
import { Field, ObjectType } from "type-graphql";
import user from "./user";
import post from "./post";
// import * as autopopulate from "mongoose-autopopulate";
// TODO : REMOVE AUTOPOPULATE i lose for do this

@ObjectType()
@ModelOptions({ schemaOptions: { timestamps: true } })
export class Comment {
  // user create comment
  @Field((_type) => String)
  @Property({
    ref: () => user,
  })
  public author: Ref<user>;
  // content comment
  @Field()
  @Property({ required: true })
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
  @Field((_type) => [String])
  @Property({ required: true, default: [], ref: () => user })
  public likes: Ref<user>[];
  @Field((_type) => [String])
  @Property()
  public postId: Ref<post>;
  // photo comment
  @Field((_type) => String)
  @Property({ required: true, default: []})
  public photo: string[];
  // unlike comment
  @Field((_type) => [String])
  @Property({ required: true, default: [], ref: () => user })
  public unlike: Ref<user>[];
}
export default Comment;
export const CommentModel = getModelForClass(Comment);
