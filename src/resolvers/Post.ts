import { CodeError } from "../types/codeError";
import {
  Arg,
  Ctx,
  Mutation,
  Resolver,
  Query,
  UseMiddleware,
  Int,
  registerEnumType,
} from "type-graphql";
import { postModel } from "../model/post";
import { CreatePostInput } from "../types/CreatePostInput";
import { CreatePostMutationResponse } from "../types/CreatePostMutationResponse";
import { Context } from "../types/Context";
import { GetPostQueryResponse } from "../types/getPostsQueryResponse";
import { getPostByIdResponse } from "../types/GetPostByIdResponse";
import { UpdatePostMutationResponse } from "../types/UpdatePostMutationResponse";
import { UpdatePostInput } from "../types/UpdatePostInput";
import { generateKeywords } from "../util/keyword";
import { IsAuthorized } from "../middleware/checkAuth";
import { defaultCategory } from "../constraint";
import { user } from "../model/user";
import { CommentModel } from "./../model/comment";
import { LikeType } from "../types/likeType";
import {
  checkRoleCanCreateAlertPost,
  checkRoleCanDeleteAlertPost,
  checkRoleCanDeletePost,
  checkRoleCanEditPost,
  checkRoleCanUpdateAlertPost,
} from "../util/checkRole";
import { likeModel } from "../model/LikeModel";
import { LikeModelType } from "../types/likeTypeModel";

registerEnumType(LikeType, {
  name: "LikeType",
  description: "Like type",
});

@Resolver()
export class PostResolver {
  @Mutation(() => CreatePostMutationResponse)
  @UseMiddleware(IsAuthorized)
  async createPost(
    @Arg("data") dataInput: CreatePostInput,
    @Ctx() { req, res }: Context
  ): Promise<CreatePostMutationResponse> {
    try {
      const postData = {
        ...dataInput,
        author: req.session.userId,
        photo: [],
        keyword: generateKeywords(dataInput.title),
        category: dataInput.category ? dataInput.category : defaultCategory,
        views: 0,
      };
      const newPost = new postModel(postData);
      await newPost.save();
      let postReturn = await postModel.find({}); //.populate("author");
      return {
        code: CodeError.create_post_success,
        message: "Post created successfully",
        post: postReturn,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  @Query(() => GetPostQueryResponse)
  async getPosts() {
    try {
      const posts = await postModel.find({});
      return {
        code: CodeError.get_post_success,
        message: "Successfully get post",
        posts: posts,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  @Query(() => getPostByIdResponse)
  async getPostById(@Arg("id") id: string): Promise<getPostByIdResponse> {
    try {
      const postData = (await postModel.findById(id)) || undefined;
      if (!postData) {
        return {
          code: CodeError.post_not_found,
          message: "Post not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "Post not found",
            },
          ],
        };
      } else {
        await postModel.findOneAndUpdate(
          { _id: id },
          { views: postData.views + 1 }
        );
        var postReturn = (await postModel.findById(id)) || undefined;
        return {
          code: CodeError.get_post_success,
          message: "Successfully get post",
          success: true,
          post: postReturn,
        };
      }
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }

  @Mutation(() => UpdatePostMutationResponse)
  @UseMiddleware(IsAuthorized)
  async updatePost(
    @Arg("data") dataInput: UpdatePostInput,
    @Arg("id") id: string,
    @Ctx() { req, res }: Context
  ): Promise<UpdatePostMutationResponse> {
    try {
      const userData = await user.findOne({ _id: req.session.userId });
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          message: "User not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "User not found",
            },
          ],
        };
      }
      const postData = await postModel.findOne({ _id: id });
      if (!postData) {
        return {
          code: CodeError.post_not_found,
          message: "Post you want to update is not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "Post you want to update is not found",
            },
          ],
        };
      }
      const updateUserIsAdmin = checkRoleCanEditPost(userData.role);

      if (postData.author !== req.session.userId && !updateUserIsAdmin) {
        return {
          code: CodeError.forbidden,
          message: "You are not allowed to update this post",
          success: false,
          errors: [
            {
              field: "author",
              message: "You are not allowed to update this post",
            },
          ],
        };
      }
      const dataUpdate =
        typeof dataInput.title !== "undefined"
          ? {
              ...dataInput,
              photo: [],
              keyword: generateKeywords(dataInput.title),
            }
          : {
              ...dataInput,
              photo: [],
            };
      await postModel.findOneAndUpdate(
        { _id: id },
        {
          ...dataUpdate,
        }
      );
      const postReturn = await postModel.find({});
      return {
        code: CodeError.update_post_success,
        message: "Post updated successfully",
        post: postReturn,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  @Mutation(() => UpdatePostMutationResponse)
  @UseMiddleware(IsAuthorized)
  async deletePost(
    @Arg("id") id: string,
    @Ctx() { req, res }: Context
  ): Promise<UpdatePostMutationResponse> {
    try {
      const userData = await user.findOne({ _id: req.session.userId });
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          message: "User not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "User not found",
            },
          ],
        };
      }
      const postData = await postModel.findOne({ _id: id });
      if (!postData) {
        return {
          code: CodeError.post_not_found,
          message: "Post you want to delete is not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "Post you want to delete is not found",
            },
          ],
        };
      }

      const updateUserIsAdmin = checkRoleCanDeletePost(userData.role);

      if (postData.author !== req.session.userId && !updateUserIsAdmin) {
        return {
          code: CodeError.forbidden,
          message: "You are not allowed to delete this post",
          success: false,
          errors: [
            {
              field: "author",
              message: "You are not allowed to delete this post",
            },
          ],
        };
      }
      await postModel.findOneAndDelete({ _id: id });
      CommentModel.deleteMany({ postId: id });
      const postReturn = await postModel.find({});
      return {
        code: CodeError.delete_post_success,
        message: "Post deleted successfully",
        post: postReturn,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  } // end delete post
  // get user post
  @Query(() => GetPostQueryResponse)
  async getUserPost(@Ctx() { req, res }: Context) {
    try {
      const postData = await postModel.find({ author: req.session.userId });
      return {
        code: CodeError.get_post_success,
        message: "Successfully get post",
        posts: postData,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  @Mutation(() => CreatePostMutationResponse)
  @UseMiddleware(IsAuthorized)
  async CreateAlertPost(
    @Arg("data") dataInput: CreatePostInput,
    @Ctx() { req, res }: Context
  ) {
    try {
      const userData = await user.findOne({ _id: req.session.userId });
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          message: "User not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "User not found",
            },
          ],
        };
      }
      const permission = checkRoleCanCreateAlertPost(userData.role);
      if (!permission) {
        return {
          code: CodeError.forbidden,
          message: "You are not allowed to create this post",
          success: false,
          errors: [
            {
              field: "author",
              message: "You are not allowed to create this post",
            },
          ],
        };
      }
      const postData = {
        ...dataInput,
        author: req.session.userId,
        photo: [],
        keyword: generateKeywords(dataInput.title),
        category: dataInput.category ? dataInput.category : defaultCategory,
        views: 0,
        isAlert: true,
      };
      const newPost = new postModel(postData);
      await newPost.save();
      let postReturn = await postModel.find({ isAlert: true }); //.populate("author");
      return {
        code: CodeError.create_post_success,
        message: "Post created successfully",
        post: postReturn,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  @Mutation(() => CreatePostMutationResponse)
  @UseMiddleware(IsAuthorized)
  async UpdateAlertPost(
    @Arg("data") dataInput: UpdatePostInput,
    @Arg("id") id: string,
    @Ctx() { req, res }: Context
  ) {
    try {
      const userData = await user.findOne({ _id: req.session.userId });
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          message: "User not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "User not found",
            },
          ],
        };
      }
      const permission = checkRoleCanUpdateAlertPost(userData.role);
      if (!permission) {
        return {
          code: CodeError.forbidden,
          message: "You are not allowed to update this post",
          success: false,
          errors: [
            {
              field: "author",
              message: "You are not allowed to update this post",
            },
          ],
        };
      }
      const postData = (await postModel.findById(id)) || undefined;
      if (!postData) {
        return {
          code: CodeError.post_not_found,
          message: "Post not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "Post not found",
            },
          ],
        };
      }
      const dataUpdate =
        typeof dataInput.title !== "undefined"
          ? {
              ...dataInput,
              photo: [],
              keyword: generateKeywords(dataInput.title),
            }
          : {
              ...dataInput,
              photo: [],
            };
      await postModel.findOneAndUpdate(
        { _id: id },
        {
          ...dataUpdate,
        }
      );
      const postReturn = await postModel.find({ isAlert: true });
      return {
        code: CodeError.update_post_success,
        message: "Post updated successfully",
        post: postReturn,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  // delete alert post
  @Mutation(() => CreatePostMutationResponse)
  @UseMiddleware(IsAuthorized)
  async DeleteAlertPost(@Arg("id") id: string, @Ctx() { req, res }: Context) {
    try {
      const userData = await user.findOne({ _id: req.session.userId });
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          message: "User not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "User not found",
            },
          ],
        };
      }
      const permission = checkRoleCanDeleteAlertPost(userData.role);
      if (!permission) {
        return {
          code: CodeError.forbidden,
          message: "You are not allowed to delete this post",
          success: false,
          errors: [
            {
              field: "author",
              message: "You are not allowed to delete this post",
            },
          ],
        };
      }
      const postData = await postModel.findOne({ _id: id });
      if (!postData) {
        return {
          code: CodeError.post_not_found,
          message: "Post not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "Post not found",
            },
          ],
        };
      }
      await postModel.findOneAndDelete({ _id: id });
      const postReturn = await postModel.find({ isAlert: true });
      return {
        code: CodeError.delete_post_success,
        message: "Post deleted successfully",
        post: postReturn,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  // get alert post
  @Query(() => GetPostQueryResponse)
  async GetAlertPost(@Ctx() { req, res }: Context) {
    try {
      const postReturn = await postModel.find({ isAlert: true });
      return {
        code: CodeError.get_post_success,
        message: "Post get successfully",
        post: postReturn,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    }
  }
  // user like post
  @Mutation(() => UpdatePostMutationResponse)
  @UseMiddleware(IsAuthorized)
  async likePost(
    @Arg("id") PostId: string,
    @Arg("likeType") likeType: LikeType,
    @Ctx() { req : {session:{userId}}, res, connection }: Context
  ): Promise<UpdatePostMutationResponse> {
    let session = await connection.startSession();
    session.startTransaction();
    try {
      const postData = await postModel.findOne({ _id: PostId });
      if (!postData) {
        return {
          code: CodeError.post_not_found,
          message: "Post not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "Post not found",
            },
          ],
        };
      }
      const userData = await user.findOne({ _id: userId });
      if (!userData) {
        return {
          code: CodeError.user_not_found,
          message: "User not found",
          success: false,
          errors: [
            {
              field: "id",
              message: "User not found",
            },
          ],
        };
      }
      const likeData = await likeModel.findOne({
        userId: userId,
        ObjectId: PostId,
      });
      if (likeData) {
        return {
          code: CodeError.like_post_already_exists,
          message: "Like post already exists",
          success: false,
          errors: [
            {
              field: "id",
              message: "Like post already exists",
            },
          ],
        };
      }
      const like = new likeModel({
        userId: userId,
        ObjectId: PostId,
        value: likeType,
        type: LikeModelType.post,
      });
      await like.save();
      const post = await postModel.findOneAndUpdate(
        { _id: PostId },
        {
          likes: [...postData.likes, like._id],
        })
      user.findOneAndUpdate(
        { _id: userId },
        {
          likes: [...userData.likes, like._id],
        }
      );

      return {
        code: CodeError.like_post_success,
        message: "Like post successfully",
        post : await postModel.find({_id: PostId}),
        success: true,
      };

    } catch (error) {
      await session.abortTransaction();
      console.log(error);
      return {
        code: CodeError.internal_server_error,
        message: "Internal Server Error server error is the " + error.message,
        success: false,
      };
    } finally {
      await session.endSession();
    }
  }
}
