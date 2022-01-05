import {
  getModelForClass,
  prop,
  ModelOptions,
  Ref,
} from "@typegoose/typegoose";
import { role } from "../types/RoleEnum";
import { Field, ObjectType } from "type-graphql";
import LikeModel from "./LikeModel";

@ModelOptions({ schemaOptions: { timestamps: true } })
@ObjectType()
class User {
  @Field()
  public _id: string;
  @Field()
  @prop({ required: true, unique: true })
  public email: string;
  @Field()
  @prop({ required: true })
  public username: string;
  @prop({ required: true })
  public password: string;
  @Field()
  @prop({
    required: true,
    default:
      "https://iptc.org/wp-content/uploads/2018/05/avatar-anonymous-300x300.png",
  })
  public avatar: string;
  @Field()
  @prop()
  createdAt: Date;
  @Field()
  @prop()
  updatedAt: Date;
  // friend field
  // @Field((_type) => [String], { nullable: true })
  // @prop({
  //   ref: () => User,
  //   default: [],
  // })
  // public friend: Ref<User>[];
  // @Field((_type) => [String], { nullable: true })
  // @prop({
  //   ref: () => User,
  //   default: [],
  // })
  // public friendRequest: Ref<User>[];
  // admin field
  @Field((_type) =>role, { nullable: true })
  @prop( { default: false })
  public role: role;
  // like field
  @Field((_type) => [String], { nullable: true })
  @prop({
    ref: () => User,
    default: [],
  })
  public likes: string[];
}
export default User;
export const user = getModelForClass(User);
