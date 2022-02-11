import {CodeError} from '../types/codeError';
import {
	Arg,
	Ctx,
	Mutation,
	Resolver,
	Query,
	UseMiddleware,
	registerEnumType,
} from 'type-graphql';
import {postModel} from '../model/post';
import {CreatePostInput} from '../types/CreatePostInput';
import {CreatePostMutationResponse} from '../types/CreatePostMutationResponse';
import {Context} from '../types/Context';
import {GetPostQueryResponse} from '../types/getPostsQueryResponse';
import {getPostByIdResponse} from '../types/GetPostByIdResponse';
import {UpdatePostMutationResponse} from '../types/UpdatePostMutationResponse';
import {UpdatePostInput} from '../types/UpdatePostInput';
import {generateKeywords} from '../util/keyword';
import {IsAuthorized} from '../middleware/checkAuth';
import {defaultCategory} from '../constraint';
import {userModel} from '../model/user';
import {CommentModel} from './../model/comment';
import {LikeType} from '../types/likeType';
import {
	checkRoleCanCreateAlertPost,
	checkRoleCanDeleteAlertPost,
	checkRoleCanDeletePost,
	checkRoleCanEditPost,
	checkRoleCanUpdateAlertPost,
} from '../util/checkRole';
import {likeModel} from '../model/LikeModel';
import {LikeModelType} from '../types/likeTypeModel';
import {emojiType} from '../types/EmojiType';
import {CategoryModel} from '../model/Category';
import {CategoryResponse} from './../types/CategoryQuery';

registerEnumType(LikeType, {
	name: 'LikeType',
	description: 'Like type',
});

@Resolver()
export class PostResolver {
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async createPost(
		@Arg('data') dataInput: CreatePostInput,
		@Ctx() {req}: Context,
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
			const CategoryData = await CategoryModel.findOne({
				name: postData.category,
			});
			if (!CategoryData) {
				await new CategoryModel({
					name: postData.category,
					posts: [newPost._id],
				}).save();
			} else {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$push: {posts: newPost._id}},
				);
			}
			await CategoryModel.findOneAndUpdate(
				{name: postData.category},
				{$push: {posts: newPost._id}},
			);
			const postReturn = await postModel.find({});
			console.log(
				`User [${req.session.userId}] create post with data: ${postData}`,
			);
			return {
				code: CodeError.create_post_success,
				message: 'Post created successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	@Query(() => GetPostQueryResponse)
	async getPosts() {
		try {
			const posts = await postModel.find({});
			console.log('User [vô danh] get all post');
			return {
				code: CodeError.get_post_success,
				message: 'Successfully get post',
				posts: posts,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	@Query(() => getPostByIdResponse)
	async getPostById(
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<getPostByIdResponse> {
		try {
			const postData = (await postModel.findById(id)) || undefined;
			if (!postData) {
				return {
					code: CodeError.post_not_found,
					message: 'Post not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'Post not found',
						},
					],
				};
			}
			await postModel.findOneAndUpdate({_id: id}, {views: postData.views + 1});
			// add post To Post User Was watch if have req
			if (req.session.userId) {
				await userModel.findOneAndUpdate(
					{_id: req.session.userId},
					{$push: {postWasWatch: id}},
				);
			}
			const postReturn = (await postModel.findById(id)) || undefined;
			console.log(`User [vô danh] get post with id: ${id}`);
			return {
				code: CodeError.get_post_success,
				message: 'Successfully get post',
				success: true,
				post: postReturn,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}

	@Mutation(() => UpdatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async updatePost(
		@Arg('data') dataInput: UpdatePostInput,
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<UpdatePostMutationResponse> {
		try {
			const userData = await userModel.findOne({_id: req.session.userId});
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					message: 'User not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'User not found',
						},
					],
				};
			}
			const postData = await postModel.findOne({_id: id});
			if (!postData) {
				return {
					code: CodeError.post_not_found,
					message: 'Post you want to update is not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'Post you want to update is not found',
						},
					],
				};
			}
			const updateUserIsAdmin = checkRoleCanEditPost(userData.role);

			if (postData.author !== req.session.userId && !updateUserIsAdmin) {
				return {
					code: CodeError.forbidden,
					message: 'You are not allowed to update this post',
					success: false,
					errors: [
						{
							field: 'author',
							message: 'You are not allowed to update this post',
						},
					],
				};
			}
			const dataUpdate =
				typeof dataInput.title !== 'undefined' && dataInput.category
					? {
							...dataInput,
							photo: [],
							keyword: generateKeywords(dataInput.title),
							category: dataInput.category,
					  }
					: {
							...dataInput,
							photo: [],
					  };
			await postModel.findOneAndUpdate(
				{_id: id},
				{
					...dataUpdate,
				},
			);

			// if dataInput.category !== postData.category delete post in category model
			if (dataInput.category !== postData.category) {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$pull: {posts: id}},
				);
				// if don't have the dataInput.category create new category
				const CategoryData = await CategoryModel.findOne({
					name: dataInput.category,
				});
				if (!CategoryData) {
					await new CategoryModel({
						name: dataInput.category,
						posts: [postData._id],
					}).save();
				}
			}
			const postReturn = await postModel.find({});
			console.log(`User [${req.session.userId}] update post with id: ${id}`);
			return {
				code: CodeError.update_post_success,
				message: 'Post updated successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	@Mutation(() => UpdatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async deletePost(
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<UpdatePostMutationResponse> {
		try {
			const userData = await userModel.findOne({_id: req.session.userId});
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					message: 'User not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'User not found',
						},
					],
				};
			}
			const postData = await postModel.findOne({_id: id});
			if (!postData) {
				return {
					code: CodeError.post_not_found,
					message: 'Post you want to delete is not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'Post you want to delete is not found',
						},
					],
				};
			}

			const updateUserIsAdmin = checkRoleCanDeletePost(userData.role);

			if (postData.author !== req.session.userId && !updateUserIsAdmin) {
				return {
					code: CodeError.forbidden,
					message: 'You are not allowed to delete this post',
					success: false,
					errors: [
						{
							field: 'author',
							message: 'You are not allowed to delete this post',
						},
					],
				};
			}
			await postModel.findOneAndDelete({_id: id});
			await CommentModel.deleteMany({post: id});
			await likeModel.deleteMany({post: id});
			await CategoryModel.findOneAndUpdate(
				{name: postData.category},
				{$pull: {posts: id}},
			);
			const postReturn = await postModel.find({});
			console.log(`User [${req.session.userId}] delete post with id: ${id}`);
			return {
				code: CodeError.delete_post_success,
				message: 'Post deleted successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	// get user post
	@Query(() => GetPostQueryResponse)
	async getUserPost(@Ctx() {req}: Context) {
		try {
			const postData = await postModel.find({author: req.session.userId});
			console.log(`User [${req.session.userId}] get all post`);
			return {
				code: CodeError.get_post_success,
				message: 'Successfully get post',
				posts: postData,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async CreateAlertPost(
		@Arg('data') dataInput: CreatePostInput,
		@Ctx() {req}: Context,
	) {
		try {
			const userData = await userModel.findOne({_id: req.session.userId});
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					message: 'User not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'User not found',
						},
					],
				};
			}
			const permission = checkRoleCanCreateAlertPost(userData.role);
			if (!permission) {
				return {
					code: CodeError.forbidden,
					message: 'You are not allowed to create this post',
					success: false,
					errors: [
						{
							field: 'author',
							message: 'You are not allowed to create this post',
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
			const CategoryData = await CategoryModel.findOne({
				name: postData.category,
			});
			if (!CategoryData) {
				await new CategoryModel({
					name: postData.category,
					posts: [newPost._id],
				}).save();
			} else {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$push: {posts: newPost._id}},
				);
			}
			const postReturn = await postModel.find({isAlert: true});
			console.log(`User [${req.session.userId}] create alert post`);
			return {
				code: CodeError.create_post_success,
				message: 'Post created successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async UpdateAlertPost(
		@Arg('data') dataInput: UpdatePostInput,
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	) {
		try {
			const userData = await userModel.findOne({_id: req.session.userId});
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					message: 'User not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'User not found',
						},
					],
				};
			}
			const permission = checkRoleCanUpdateAlertPost(userData.role);
			if (!permission) {
				return {
					code: CodeError.forbidden,
					message: 'You are not allowed to update this post',
					success: false,
					errors: [
						{
							field: 'author',
							message: 'You are not allowed to update this post',
						},
					],
				};
			}
			const postData = (await postModel.findById(id)) || undefined;
			if (!postData) {
				return {
					code: CodeError.post_not_found,
					message: 'Post not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'Post not found',
						},
					],
				};
			}
			const dataUpdate = dataInput.title
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
				{_id: id},
				{
					...dataUpdate,
				},
			);
			if (dataInput.category !== postData.category) {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$pull: {posts: id}},
				);
				// if don't have the dataInput.category create new category
				const CategoryData = await CategoryModel.findOne({
					name: dataInput.category,
				});
				if (!CategoryData) {
					await new CategoryModel({
						name: dataInput.category,
						posts: [postData._id],
					}).save();
				}
			}
			const postReturn = await postModel.find({isAlert: true});
			console.log(`User [${req.session.userId}] update alert post`);
			return {
				code: CodeError.update_post_success,
				message: 'Post updated successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	// delete alert post
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async DeleteAlertPost(@Arg('id') id: string, @Ctx() {req}: Context) {
		try {
			const userData = await userModel.findOne({_id: req.session.userId});
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					message: 'User not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'User not found',
						},
					],
				};
			}
			const permission = checkRoleCanDeleteAlertPost(userData.role);
			if (!permission) {
				return {
					code: CodeError.forbidden,
					message: 'You are not allowed to delete this post',
					success: false,
					errors: [
						{
							field: 'author',
							message: 'You are not allowed to delete this post',
						},
					],
				};
			}
			const postData = await postModel.findOne({_id: id});
			if (!postData) {
				return {
					code: CodeError.post_not_found,
					message: 'Post not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'Post not found',
						},
					],
				};
			}
			await postModel.findOneAndDelete({_id: id});
			const postReturn = await postModel.find({isAlert: true});
			await CommentModel.deleteMany({post: id});
			await likeModel.deleteMany({post: id});
			await CategoryModel.findOneAndUpdate(
				{name: postData.category},
				{$pull: {posts: id}},
			);
			console.log(`User [${req.session.userId}] delete alert post`);
			return {
				code: CodeError.delete_post_success,
				message: 'Post deleted successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	// get alert post
	@Query(() => GetPostQueryResponse)
	async GetAlertPost() {
		try {
			const postReturn = await postModel.find({isAlert: true});
			console.log('User [vô danh] get alert post');
			return {
				code: CodeError.get_post_success,
				message: 'Post get successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	// user like post
	@Mutation(() => UpdatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async likePost(
		@Arg('id') PostId: string,
		@Arg('likeType') likeType: LikeType,
		@Ctx()
		{
			req: {
				session: {userId},
			},
			connection,
		}: Context,
	): Promise<UpdatePostMutationResponse> {
		const session = await connection.startSession();
		session.startTransaction();
		try {
			const postData = await postModel.findOne({_id: PostId});
			if (!postData) {
				return {
					code: CodeError.post_not_found,
					message: 'Post not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'Post not found',
						},
					],
				};
			}
			const userData = await userModel.findOne({_id: userId});
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					message: 'User not found',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'User not found',
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
					message: 'Like post already exists',
					success: false,
					errors: [
						{
							field: 'id',
							message: 'Like post already exists',
						},
					],
				};
			}
			const like = new likeModel({
				userId: userId,
				ObjectId: PostId,
				value: likeType,
				type: LikeModelType.post,
				emoji: likeType === LikeType.like ? emojiType.happy : emojiType.sad,
			});
			await like.save();
			const post = await postModel.findOneAndUpdate(
				{_id: PostId},
				{
					likes: [...postData.likes, like._id],
					likeNumber: postData.likeNumber + likeType,
				},
				{
					new: true,
				},
			);
			userModel.findOneAndUpdate(
				{_id: userId},
				{
					likes: [...userData.likes, like._id],
				},
			);
			console.log(`User [${userId}] like post`);
			return {
				code: CodeError.like_post_success,
				message: 'Like post successfully',
				post: post ? [post] : [],
				success: true,
			};
		} catch (error) {
			await session.abortTransaction();
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		} finally {
			await session.endSession();
		}
	}

	// get all Category
	@Query(() => CategoryResponse)
	async GetCategory() {
		try {
			const categoryReturn = await CategoryModel.find({});
			console.log('User [vô danh] get all category');
			return {
				code: CodeError.get_category_success,
				message: 'Category get successfully',
				category: categoryReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
	// get all post in category
	@Query(() => GetPostQueryResponse)
	async GetPostByCategory(@Arg('category') category: string) {
		try {
			const postReturn = await postModel.find({
				category: category,
			});
			console.log('User [vô danh] get all post in category');
			return {
				code: CodeError.get_post_success,
				message: 'Post get successfully',
				post: postReturn,
				success: true,
			};
		} catch (error) {
			console.warn(error);
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			};
		}
	}
}
