import { Field, InputType, registerEnumType } from "type-graphql";
import { role } from "./RoleEnum";

registerEnumType(role, {
  name: "role", // this one is mandatory
  description: "the role enum", // this one is optional
});


@InputType()
export class AddRoleForUserInput {
  @Field()
  userId: string;
  @Field(() => role)
  role: role;
}
