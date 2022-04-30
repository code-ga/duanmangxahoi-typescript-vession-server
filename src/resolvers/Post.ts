import {CodeError} from '../types/codeError'
import {
	Arg,
	Ctx,
	Mutation,
	Resolver,
	Query,
	UseMiddleware,
	registerEnumType,
	FieldResolver,
	Root,
} from 'type-graphql'
import {postModel} from '../model/post'
import {CreatePostInput} from '../types/CreatePostInput'
import {CreatePostMutationResponse} from '../types/CreatePostMutationResponse'
import {Context} from '../types/Context'
import {getPostByIdResponse} from '../types/GetPostByIdResponse'
import {UpdatePostInput} from '../types/UpdatePostInput'
import {generateKeywords} from '../util/keyword'
import {IsAuthorized} from '../middleware/checkAuth'
import {defaultCategory} from '../constraint'
import User, {userModel} from '../model/user'
import {CommentModel} from './../model/comment'
import {LikeType} from '../types/likeType'
import {
	checkRoleCanCreateAlertPost,
	checkRoleCanDeleteAlertPost,
	checkRoleCanDeletePost,
	checkRoleCanEditPost,
	checkRoleCanUpdateAlertPost,
} from '../util/checkRole'
import {likeModel} from '../model/LikeModel'
import {LikeModelType} from '../types/likeTypeModel'
import {emojiType} from '../types/EmojiType'
import {CategoryModel} from '../model/Category'
import {CategoryResponse} from './../types/CategoryQuery'
import {log} from '../util/logger'
import {GetLikeInfoResponse} from '../types/GetLikeInfoResponse'
import {Post} from './../model/post'

registerEnumType(LikeType, {
	name: 'LikeType',
	description: 'Like type',
})

@Resolver((_of) => Post)
export class PostResolver {
	ClassName: string
	constructor() {
		this.ClassName = 'Post'
	}
	@FieldResolver((_return) => String)
	contentSnippet(@Root() root: Post) {
		console.log(root)
		return root.content.slice(0, 100)
	}
	@FieldResolver((_return) => User)
	async author(@Root() root: Post) {
		return await userModel.findOne({_id: root.authorId})
	}

	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async createPost(
		@Arg('data') dataInput: CreatePostInput,
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse> {
		try {
			const userId = req.session.userId
			const postData = {
				...dataInput,
				authorId: userId,
				photo: [],
				keyword: generateKeywords(dataInput.title),
				category: dataInput.category ? dataInput.category : defaultCategory,
				views: 0,
			}

			const newPost = new postModel(postData)
			await newPost.save()
			const CategoryData = await CategoryModel.findOne({
				name: postData.category,
			})
			if (!CategoryData) {
				await new CategoryModel({
					name: postData.category,
					posts: [newPost._id],
				}).save()
			} else {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$push: {posts: newPost._id}},
				)
			}
			await CategoryModel.findOneAndUpdate(
				{name: postData.category},
				{$push: {posts: newPost._id}},
			)
			await userModel.findOneAndUpdate(
				{_id: userId},

				{$push: {posts: newPost._id}},
			)
			const postReturn = await postModel.find({}).lean().exec()
			log.log(
				this.ClassName,
				`User [${userId}] create post with data: ${postData}`,
			)
			return {
				code: CodeError.create_post_success,
				message: 'Post created successfully',
				posts: postReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	@Query(() => CreatePostMutationResponse, {nullable: true})
	async getPosts(
		@Ctx() {req}: Context,
		@Arg('limit', {
			defaultValue: 10,
		})
		limit: number,
	): Promise<CreatePostMutationResponse | null> {
		try {
			const posts = await postModel.find({}).limit(limit).lean().exec()
			log.log(
				this.ClassName,
				`User [${req.session.userId || 'vô danh'}] get all post`,
			)
			return {
				code: CodeError.get_post_success,
				message: 'Successfully get post',
				posts: posts,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
			return null
		}
	}
	@Query(() => getPostByIdResponse, {nullable: true})
	async getPostById(
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<getPostByIdResponse | null> {
		try {
			const userId = req.session.userId
			const postData = (await postModel.findById(id)) || undefined
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
				}
			}
			await postModel.findOneAndUpdate({_id: id}, {views: postData.views + 1})
			// add post To Post User Was watch if have req
			if (userId) {
				await userModel.findOneAndUpdate(
					{_id: userId},
					{$push: {postWasWatch: id}},
				)
			}
			const postReturn = (await postModel.findById(id)) || undefined
			log.log(
				this.ClassName,
				`User [${req.session.userId || 'vô danh'}] get post with id: ${id}`,
			)
			return {
				code: CodeError.get_post_success,
				message: 'Successfully get post',
				success: true,
				post: postReturn,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
			return null
		}
	}

	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async updatePost(
		@Arg('data') dataInput: UpdatePostInput,
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findOne({_id: userId})
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
				}
			}
			const postData = await postModel.findOne({_id: id})
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
				}
			}
			const updateUserIsAdmin = checkRoleCanEditPost(userData.role)

			if (postData.authorId !== userId && !updateUserIsAdmin) {
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
				}
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
					  }
			await postModel.findOneAndUpdate(
				{_id: id},
				{
					...dataUpdate,
				},
			)

			// if dataInput.category !== postData.category delete post in category model
			if (dataInput.category !== postData.category) {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$pull: {posts: id}},
				)
				// if don't have the dataInput.category create new category
				const CategoryData = await CategoryModel.findOne({
					name: dataInput.category,
				})
				if (!CategoryData) {
					await new CategoryModel({
						name: dataInput.category,
						posts: [postData._id],
					}).save()
				}
			}
			const postReturn = await postModel.find({}).lean().exec()
			log.log(this.ClassName, `User [${userId}] update post with id: ${id}`)
			return {
				code: CodeError.update_post_success,
				message: 'Post updated successfully',
				posts: postReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async deletePost(
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findOne({_id: userId})
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
				}
			}

			const postData = await postModel.findOne({_id: id})

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
				}
			}
			const authorId = `${postData?.authorId}`
			const updateUserIsAdmin = checkRoleCanDeletePost(userData.role)

			if (authorId !== userId && !updateUserIsAdmin) {
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
				}
			}
			await postModel.findOneAndDelete({_id: id})
			await CommentModel.deleteMany({post: id})
			await likeModel.deleteMany({post: id})
			await CategoryModel.findOneAndUpdate(
				{name: postData.category},
				{$pull: {posts: id}},
			)

			await userModel.findOneAndUpdate({_id: authorId}, {$pull: {posts: id}})
			const postReturn = await postModel.find({}).lean().exec()
			log.log(this.ClassName, `User [${userId}] delete post with id: ${id}`)
			return {
				code: CodeError.delete_post_success,
				message: 'Post deleted successfully',
				posts: postReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// get user post
	@Query(() => CreatePostMutationResponse, {nullable: true})
	async getUserPost(
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse | null> {
		try {
			const userId = req.session.userId
			const postData = await postModel.find({authorId: userId})
			log.log(this.ClassName, `User [${userId}] get all post`)
			return {
				code: CodeError.get_post_success,
				message: 'Successfully get post',
				posts: postData,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
			// return null
		}
	}
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async CreateAlertPost(
		@Arg('data') dataInput: CreatePostInput,
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findOne({_id: userId})
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
				}
			}
			const permission = checkRoleCanCreateAlertPost(userData.role)
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
				}
			}
			const postData = {
				...dataInput,
				authorId: userId,
				photo: [],
				keyword: generateKeywords(dataInput.title),
				category: dataInput.category ? dataInput.category : defaultCategory,
				views: 0,
				isAlert: true,
			}
			const newPost = new postModel(postData)
			await newPost.save()
			const CategoryData = await CategoryModel.findOne({
				name: postData.category,
			})
			if (!CategoryData) {
				await new CategoryModel({
					name: postData.category,
					posts: [newPost._id],
				}).save()
			} else {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$push: {posts: newPost._id}},
				)
			}
			await userModel.findOneAndUpdate(
				{_id: userId},
				{$push: {posts: newPost._id}},
			)
			const postReturn = await postModel.find({isAlert: true}).lean().exec()
			log.log(this.ClassName, `User [${userId}] create alert post`)
			return {
				code: CodeError.create_post_success,
				message: 'Post created successfully',
				posts: [...postReturn],
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async UpdateAlertPost(
		@Arg('data') dataInput: UpdatePostInput,
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findOne({_id: userId})
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
				}
			}
			const permission = checkRoleCanUpdateAlertPost(userData.role)
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
				}
			}
			const postData = (await postModel.findById(id)) || undefined
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
				}
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
				  }
			await postModel.findOneAndUpdate(
				{_id: id},
				{
					...dataUpdate,
				},
			)
			if (dataInput.category !== postData.category) {
				await CategoryModel.findOneAndUpdate(
					{name: postData.category},
					{$pull: {posts: id}},
				)
				// if don't have the dataInput.category create new category
				const CategoryData = await CategoryModel.findOne({
					name: dataInput.category,
				})
				if (!CategoryData) {
					await new CategoryModel({
						name: dataInput.category,
						posts: [postData._id],
					}).save()
				}
			}
			const postReturn = await postModel.find({isAlert: true}).lean().exec()
			log.log(this.ClassName, `User [${userId}] update alert post`)
			return {
				code: CodeError.update_post_success,
				message: 'Post updated successfully',
				posts: postReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// delete alert post
	@Mutation(() => CreatePostMutationResponse)
	@UseMiddleware(IsAuthorized)
	async DeleteAlertPost(
		@Arg('id') id: string,
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findOne({_id: userId})
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
				}
			}
			const permission = checkRoleCanDeleteAlertPost(userData.role)
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
				}
			}
			const postData = await postModel.findOne({_id: id})
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
				}
			}
			const authorId = `${postData?.authorId}`
			await postModel.findOneAndDelete({_id: id})
			await CommentModel.deleteMany({post: id})
			await likeModel.deleteMany({post: id})
			await CategoryModel.findOneAndUpdate(
				{name: postData.category},
				{$pull: {posts: id}},
			)
			await userModel.findOneAndUpdate({_id: authorId}, {$pull: {posts: id}})
			const postReturn = await postModel.find({isAlert: true}).lean().exec()
			log.log(this.ClassName, `User [${userId}] delete alert post`)
			return {
				code: CodeError.delete_post_success,
				message: 'Post deleted successfully',
				posts: postReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// get alert post
	@Query(() => CreatePostMutationResponse, {nullable: true})
	async GetAlertPost(
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse | null> {
		try {
			const postReturn = await postModel.find({isAlert: true}).lean().exec()
			log.log(
				this.ClassName,
				`User [${req.session.userId || 'vô danh'}] get alert post`,
			)
			return {
				code: CodeError.get_post_success,
				message: 'Post get successfully',
				posts: postReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// user like post
	@Mutation(() => CreatePostMutationResponse)
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
	): Promise<CreatePostMutationResponse> {
		const session = await connection.startSession()
		session.startTransaction()
		try {
			const postData = await postModel.findOne({_id: PostId})
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
				}
			}
			const userData = await userModel.findOne({_id: userId})
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
				}
			}
			const exitingLike = await likeModel.findOne({
				userId: userId,
				ObjectId: PostId,
			})
			let post
			if (exitingLike) {
				if (exitingLike.value !== likeType) {
					await likeModel.findOneAndUpdate(
						{
							userId: userId,
							ObjectId: PostId,
						},
						{
							...exitingLike,
							value: likeType,
						},
					)
					post = await postModel.findOneAndUpdate(
						{_id: PostId},
						{
							likeNumber: postData.likeNumber + 2 * likeType,
						},
						{
							new: true,
						},
					)
				} else {
					post = await postModel.findOneAndUpdate(
						{_id: PostId},
						{
							likeNumber: postData.likeNumber - 2 * likeType,
							$pull: {
								likes: exitingLike._id,
							},
						},
						{
							new: true,
						},
					)
					await userModel.findOneAndUpdate(
						{_id: userId},
						{
							$pull: {
								likes: exitingLike._id,
							},
						},
					)
					await likeModel.findOneAndDelete({
						userId: userId,
						ObjectId: PostId,
					})
				}
			}

			if (!exitingLike) {
				const like = new likeModel({
					userId: userId,
					ObjectId: PostId,
					value: likeType,
					type: LikeModelType.post,
					emoji: likeType === LikeType.like ? emojiType.happy : emojiType.sad,
				})
				await like.save()
				post = await postModel.findOneAndUpdate(
					{_id: PostId},
					{
						likes: [...postData.likes, like._id],
						likeNumber: postData.likeNumber + likeType,
					},
					{
						new: true,
					},
				)
				await userModel.findOneAndUpdate(
					{_id: userId},
					{
						likes: [...userData.likes, like._id],
					},
				)
			}
			log.log(this.ClassName, `User [${userId}] like post`)
			return {
				code: CodeError.like_post_success,
				message: 'Like post successfully',
				posts: post ? [post] : [],
				success: true,
			}
		} catch (error) {
			await session.abortTransaction()
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		} finally {
			await session.endSession()
		}
	}

	// get all Category
	@Query(() => CategoryResponse, {nullable: true})
	async GetCategory(@Ctx() {req}: Context): Promise<CategoryResponse | null> {
		try {
			const categoryReturn = await CategoryModel.find({})
			log.log(
				this.ClassName,
				`User [${req.session.userId || 'vô danh'}] get all category`,
			)
			return {
				code: CodeError.get_category_success,
				message: 'Category get successfully',
				category: categoryReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
			// return null
		}
	}
	// get all post in category
	@Query(() => CreatePostMutationResponse, {nullable: true})
	async GetPostByCategory(
		@Arg('category') category: string,
		@Ctx() {req}: Context,
	): Promise<CreatePostMutationResponse | null> {
		try {
			const postReturn = await postModel
				.find({
					category: category,
				})
				.lean()
				.exec()
			log.log(
				this.ClassName,
				`User [${req.session.userId || 'vô danh'}] get all post in category`,
			)
			return {
				code: CodeError.get_post_success,
				message: 'Post get successfully',
				posts: postReturn,
				success: true,
			}
		} catch (error) {
			log.warn(this.ClassName, error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// get like info
	@Query(() => GetLikeInfoResponse, {nullable: true})
	async GetLikeInfo(
		@Arg('LikeId') likeId: string,
		@Ctx() {req}: Context,
	): Promise<GetLikeInfoResponse | null> {
		try {
			const likeData = await likeModel.findOne({_id: likeId})
			if (!likeData) {
				return {
					code: CodeError.not_found,
					message: 'Like not found',
					success: false,
				}
			}
			log.log(
				this.ClassName,
				`User [${req.session.userId || 'vô danh'}] get like info`,
			)
			return {
				code: CodeError.get_like_info_success,
				message: 'Like info get successfully',
				success: true,
				like: [likeData],
			}
		} catch (error) {
			return null
		}
	}
}
