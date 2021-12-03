import { Field, ObjectType } from "type-graphql";
import { IMutationResponse } from "./BaseResponseType";
import User from "./../model/user";
import { FieldError } from "./errorField";

@ObjectType({ implements: IMutationResponse })
export class UserMutationResponse implements IMutationResponse {
  code: number;
  success: boolean;
  message?: string;
  @Field({ nullable: true })
  user?: User;
  @Field((_type) => [FieldError], {nullable:true})
  error?: FieldError[];
}
