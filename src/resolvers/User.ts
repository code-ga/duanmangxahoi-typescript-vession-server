import { user } from "../model/user";
import { Mutation, Resolver, Arg, Ctx } from "type-graphql";
import bcrypt from "bcrypt";
import { UserMutationResponse } from "./../types/userMutationResponse";
import { resisterInput } from "../types/RegisterInput";
import { CodeError } from "../types/codeError";
import { ValidationResisterInput } from "../util/ValidationResisterInput";
import { LoginInput } from "./../types/LoginInput";
import { Context } from "../types/Context";
import { COOKIE_NAME } from "../constraint";
import { role } from "../types/RoleEnum";
import { registerEnumType } from "type-graphql";
registerEnumType(role, {
  name: "role", // this one is mandatory
  description: "the role enum", // this one is optional
});

@Resolver()
export class UserResolver {
  @Mutation(() => UserMutationResponse)
  async register(
    @Arg("RegisterInput") ResisterInput: resisterInput,
    @Ctx() { req, res }: Context
  ): Promise<UserMutationResponse> {
    var errorDataInput = ValidationResisterInput(ResisterInput);
    if (errorDataInput) {
      return errorDataInput;
    }
    try {
      const { email, password, username } = ResisterInput;
      const exiting =
        (await user.findOne({ email })) || (await user.findOne({ username }));
      if (exiting) {
        return {
          code:
            exiting.username === username
              ? CodeError.username_already_exists
              : CodeError.email_already_exists,
          success: false,
          message: `${
            exiting.username === username ? "username" : "email"
          } are ready exiting`,
          error: [
            {
              field: exiting.username === username ? "username" : "email",
              message: `have two ${
                exiting.username === username ? "username" : "email"
              } in database`,
            },
          ],
        };
      }
      const hashedPassword = await bcrypt.hash(password, 4);
      let NewUser = new user({
        email: email,
        password: hashedPassword,
        username: username,
        role: role.user,
      });
      NewUser = await NewUser.save();
      req.session.userId = NewUser._id;
      console.log("register new user successful");
      return {
        code: CodeError.successFully_registered,
        success: true,
        user: NewUser,
        message:
          "happy ! user register is successful . now you can use this app",
      };
    } catch (err) {
      console.log(err);
      return {
        code: CodeError.internal_server_error,
        success: false,
        message: "Internal server error" + err.message,
      };
    }
  }
  @Mutation(() => UserMutationResponse)
  async login(
    @Arg("loginInput") loginInput: LoginInput,
    @Ctx() { req, res }: Context
  ): Promise<UserMutationResponse> {
    try {
      const { usernameOrEmail, password } = loginInput;
      const userData =
        (await user.findOne({ email: usernameOrEmail })) ||
        (await user.findOne({ username: usernameOrEmail }));
      if (!userData) {
        return process.env.NODE_ENV !== "development"
          ? {
              code: CodeError.Incorrect_User_or_Password,
              success: false,
              message: "Incorrect username email or password",
              error: [
                {
                  field: "Username Or Email Or Password",
                  message: "Incorrect username email or password",
                },
              ],
            }
          : {
              code: CodeError.user_not_found,
              success: false,
              message: "user not found",
              error: [
                {
                  field: "usernameOrEmail",
                  message: "user not found",
                },
              ],
            };
      }
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        return process.env.NODE_ENV !== "development"
          ? {
              code: CodeError.Incorrect_User_or_Password,
              success: false,
              message: "Incorrect username email or password",
              error: [
                {
                  field: "Username Or Email Or Password",
                  message: "Incorrect username email or password",
                },
              ],
            }
          : {
              code: CodeError.invalid_password,
              success: false,
              message: "invalid password",
              error: [
                {
                  field: "password",
                  message: "invalid password",
                },
              ],
            };
      }

      req.session.userId = userData._id;
      console.log("user login successful");

      return {
        code: CodeError.successFully_logged_in,
        success: true,
        user: userData,
        message: "happy ! you are logged in",
      };
    } catch (err) {
      console.log(err);
      return {
        code: CodeError.internal_server_error,
        success: false,
        message: "Internal server error " + err.message,
      };
    }
  }
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: Context): Promise<Boolean> {
    try {
      return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            reject(err);
          }
          res.clearCookie(COOKIE_NAME);
          resolve(true);
          console.log("user logout successful");
        });
      });
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => {
        reject(false);
      });
    }
  }
  @Mutation(() => UserMutationResponse)
  async getUser(@Ctx() { req }: Context): Promise<UserMutationResponse> {
    try {
      const userData = await user.findById(req.session.userId);
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          success: false,
          message: "user not found",
          error: [
            {
              field: "userId",
              message: "user not found",
            },
          ],
        };
      }
      console.log("get user successful");
      return {
        code: CodeError.successFully_get_user,
        success: true,
        user: userData,
        message: "happy ! you are get user",
      };
    } catch (err) {
      console.log(err);
      return {
        code: CodeError.internal_server_error,
        success: false,
        message: "Internal server error " + err.message,
      };
    }
  }
  @Mutation(() => UserMutationResponse)
  async getAuthorInfo(
    @Arg("authorId") authorId: string,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    try {
      let userData = await user.findById(authorId);
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          success: false,
          message: "author not found",
          error: [
            {
              field: "userId",
              message: "author not found",
            },
          ],
        };
      }
      // console.log(userData);
      return {
        code: CodeError.successFully_get_user,
        success: true,
        user: userData,
        message: "happy ! you are get user author info",
      };
    } catch (err) {
      console.log(err);
      return {
        code: CodeError.internal_server_error,
        success: false,
        message: "Internal server error " + err.message,
      };
    }
  }
  // update user to admin
  @Mutation(() => UserMutationResponse)
  async updateUserToAdmin(
    @Arg("userId") userId: string,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    try {
      const userData = await user.findById(userId);
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          success: false,
          message: "user not found",
          error: [
            {
              field: "userId",
              message: "user not found",
            },
          ],
        };
      }
      const userAdmin = await user.findOne({
        _id: req.session.userId,
        role: role.superAdmin,
      });
      if (!userAdmin) {
        return {
          code: CodeError.access_denied,
          success: false,
          message: "access denied",
          error: [
            {
              field: "userId",
              message: "access denied",
            },
          ],
        };
      }
      await user.findOneAndUpdate({ _id: userId }, { role: role.admin });
      const userAfterUpdate = (await user.findById(userId)) || undefined;
      console.log("update user to admin successful");
      return {
        code: CodeError.assign_role_success,
        success: true,
        user: userAfterUpdate,
        message: "happy ! you are update user to admin",
      };
    } catch (err) {
      console.log(err);
      return {
        code: CodeError.internal_server_error,
        success: false,
        message: "Internal server error " + err.message,
      };
    }
  }
  // create admin user
  @Mutation(() => UserMutationResponse)
  async createAdminAccount(
    @Arg("RegisterInput") ResisterInput: resisterInput,
    @Ctx() { req, res }: Context
  ): Promise<UserMutationResponse> {
    try {
      var UserIsSuperAdmin = await user.findOne({
        _id: req.session.userId,
        role: role.superAdmin,
      });
      if (!UserIsSuperAdmin) {
        return {
          code: CodeError.access_denied,
          success: false,
          message: "access denied",
          error: [
            {
              field: "userId",
              message: "access denied",
            },
          ],
        };
      }
      var errorDataInput = ValidationResisterInput(ResisterInput);
      if (errorDataInput) {
        return errorDataInput;
      }
      const { email, password, username } = ResisterInput;
      const exiting =
        (await user.findOne({ email })) || (await user.findOne({ username }));
      if (exiting) {
        return {
          code:
            exiting.username === username
              ? CodeError.username_already_exists
              : CodeError.email_already_exists,
          success: false,
          message: `${
            exiting.username === username ? "username" : "email"
          } are ready exiting`,
          error: [
            {
              field: exiting.username === username ? "username" : "email",
              message: `have two ${
                exiting.username === username ? "username" : "email"
              } in database`,
            },
          ],
        };
      }
      const hashedPassword = await bcrypt.hash(password, 4);
      let NewUser = new user({
        email: email,
        password: hashedPassword,
        username: username,
        role: role.admin,
      });
      NewUser = await NewUser.save();
      console.log("register new user admin successful");
      return {
        code: CodeError.create_admin_account_success,
        success: true,
        user: NewUser,
        message:
          "happy ! user register is successful . now you can use this app",
      };
    } catch (err) {
      console.log(err);
      return {
        code: CodeError.internal_server_error,
        success: false,
        message: "Internal server error" + err.message,
      };
    }
  }
}
