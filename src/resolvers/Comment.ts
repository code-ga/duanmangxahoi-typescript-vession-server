import {Arg, Ctx, Mutation, Resolver, UseMiddleware} from 'type-graphql'
import {CommentModel} from '../model/comment'
import {CodeError} from '../types/CodeError'
import {CommentMutationResponse} from '../types/CommentMutationResponse'
import {Context} from '../types/Context'
import {CreateCommentInput} from '../types/CreateCommentInput'
import {IsAuthorized} from './../middleware/checkAuth'
import {postModel} from './../model/post'
import {userModel} from './../model/user'
@Resolver()
export class CommentResolver {
	@Mutation(() => CommentMutationResponse)
	@UseMiddleware(IsAuthorized)
	async createComment(
		@Arg('data') data: CreateCommentInput,
		@Ctx() {req}: Context,
	): Promise<CommentMutationResponse> {
		try {
			const {content, postId} = data
			if (!(await postModel.findOne({_id: postId}))) {
				return {
					code: CodeError.post_not_found,
					message: 'post not found',
					success: false,
					errors: [
						{
							field: 'postId',
							message: 'post not found',
						},
					],
				}
			}
			const NewComment = new CommentModel({
				content,
				authorId: req.session.userId,
				postId,
			})
			await NewComment.save()
			await postModel.findOneAndUpdate(
				{_id: postId},
				{$push: {comments: NewComment._id}},
			)
			const CommentReturn = await CommentModel.find({postId})
			console.log(`User[${req.session.userId}] create comment`)
			return {
				code: CodeError.create_comment_success,
				success: true,
				message: 'create comment successful',
				comment: CommentReturn,
			}
		} catch (error) {
			console.warn(error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// get comment
	@Mutation(() => CommentMutationResponse)
	@UseMiddleware(IsAuthorized)
	async getComment(
		@Arg('postId') postId: string,
		@Ctx() {req}: Context,
	): Promise<CommentMutationResponse> {
		try {
			const CommentReturn = await CommentModel.find({postId})
			console.log(`User[${req.session.userId || 'vô danh'}] get comment`)
			return {
				code: CodeError.get_comment_success,
				success: true,
				message: 'get comment successful',
				comment: CommentReturn,
			}
		} catch (error) {
			console.warn(error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// update comment
	@Mutation(() => CommentMutationResponse)
	@UseMiddleware(IsAuthorized)
	async updateComment(
		@Arg('data') data: CreateCommentInput,
		@Ctx() {req}: Context,
		@Arg('commentId') commentId: string,
	): Promise<CommentMutationResponse> {
		try {
			const {content, postId} = data
			if (!(await postModel.findOne({_id: postId}))) {
				return {
					code: CodeError.post_not_found,
					message: 'post not found',
					success: false,
					errors: [
						{
							field: 'postId',
							message: 'post not found',
						},
					],
				}
			}
			const commentData = await CommentModel.findOne({_id: commentId})
			if (!commentData) {
				return {
					code: CodeError.comment_not_found,
					message: 'comment not found',
					success: false,
					errors: [
						{
							field: 'commentId',
							message: 'comment not found',
						},
					],
				}
			}
			const UserData = await userModel.findOne({_id: req.session.userId})
			if (!UserData) {
				return {
					code: CodeError.user_not_found,
					message: 'user not found',
					success: false,
					errors: [
						{
							field: 'userId',
							message: 'user not found',
						},
					],
				}
			}
			if (UserData._id !== commentData.authorId) {
				return {
					code: CodeError.access_denied,
					message: 'user not author',
					success: false,
					errors: [
						{
							field: 'userId',
							message: 'user not author',
						},
					],
				}
			}
			await CommentModel.findOneAndUpdate({_id: commentId}, {content})
			const CommentReturn = await CommentModel.find({postId})
			console.log(`User[${req.session.userId}] update comment`)
			return {
				code: CodeError.update_comment_success,
				success: true,
				message: 'update comment successful',
				comment: CommentReturn,
			}
		} catch (error) {
			console.warn(error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
	// delete comment
	@Mutation(() => CommentMutationResponse)
	@UseMiddleware(IsAuthorized)
	async deleteComment(
		@Arg('commentId') commentId: string,
		@Ctx() {req}: Context,
	): Promise<CommentMutationResponse> {
		try {
			const thatComment = await CommentModel.findOne({
				_id: commentId,
				authorId: req.session.userId,
			})
			if (!thatComment) {
				return {
					code: CodeError.comment_not_found,
					message: 'comment not found',
					success: false,
					errors: [
						{
							field: 'commentId',
							message: 'comment not found',
						},
					],
				}
			}
			await CommentModel.findOneAndDelete({
				_id: commentId,
			})
			const CommentReturn = await CommentModel.find({
				postId: thatComment.postId,
			})
			console.log(`User[${req.session.userId}] delete comment`)
			return {
				code: CodeError.delete_comment_success,
				success: true,
				message: 'delete comment successful',
				comment: CommentReturn,
			}
		} catch (error) {
			console.warn(error)
			return {
				code: CodeError.internal_server_error,
				message: 'Internal Server Error server error is the ' + error.message,
				success: false,
			}
		}
	}
}
