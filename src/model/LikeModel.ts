import {
  getModelForClass,
  prop,
  ModelOptions,
  Ref,
} from "@typegoose/typegoose";
import { LikeType } from "../types/likeType";
import { Field, ObjectType } from "type-graphql";
import { LikeModelType } from "../types/likeTypeModel";
import { emojiType } from "../types/EmojiType";

@ModelOptions({ schemaOptions: { timestamps: true } })
@ObjectType()
class LikeModel {
  @Field()
  @prop({ required: true })
  public userId: string;

  @Field()
  @prop({ required: true })
  public ObjectId: string;
  @Field()
  @prop({ required: true })
  public value: LikeType;

  @Field()
  @prop({ required: true })
  public type: LikeModelType;

  @Field()
  @prop({ required: true , default: emojiType.like})
  public emoji: emojiType;
 

  @Field()
  @prop()
  public createdAt: Date;
  @Field()
  @prop()
  public updatedAt: Date;
}
export default LikeModel;
export const likeModel = getModelForClass(LikeModel);
