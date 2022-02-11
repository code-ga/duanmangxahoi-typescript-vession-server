import {CreateCommentInput} from '../types/CreateCommentInput';
import {Arg, Resolver, Mutation, UseMiddleware, Ctx} from 'type-graphql';
import {CommentMutationResponse} from '../types/CommentMutationResponse';
import {CodeError} from '../types/codeError';
import {CommentModel} from '../model/comment';
import {IsAuthorized} from './../middleware/checkAuth';
import {Context} from '../types/Context';
import {postModel} from './../model/post';
import {user} from './../model/user';
@Resolver()
export class CommentResolver {
	@Mutation(() => CommentMutationResponse)
	@UseMiddleware(IsAuthorized)
	async createComment(
		@Arg('data') data: CreateCommentInput,
		@Ctx() {req}: Context,
	): Promise<CommentMutationResponse> {
		try {
			const {content, postId} = data;
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
				};
			}
			const NewComment = new CommentModel({
				content,
				author: req.session.userId,
				postId,
			});
			await NewComment.save();
			await postModel.findOneAndUpdate(
				{_id: postId},
				{$push: {comments: NewComment._id}},
			);
			const CommentReturn = await CommentModel.find({postId});
			console.log(`User[${req.session.userId}] create comment`);
			return {
				code: CodeError.create_comment_success,
				success: true,
				message: 'create comment successful',
				comment: CommentReturn,
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
	// get comment
	@Mutation(() => CommentMutationResponse)
	@UseMiddleware(IsAuthorized)
	async getComment(
		@Arg('postId') postId: string,
		// @Ctx() { req }: Context
	): Promise<CommentMutationResponse> {
		try {
			const CommentReturn = await CommentModel.find({postId});
			console.log('User[vô danh] get comment');
			return {
				code: CodeError.get_comment_success,
				success: true,
				message: 'get comment successful',
				comment: CommentReturn,
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
	// update comment
	@Mutation(() => CommentMutationResponse)
	@UseMiddleware(IsAuthorized)
	async updateComment(
		@Arg('data') data: CreateCommentInput,
		@Ctx() {req}: Context,
		@Arg('commentId') commentId: string,
	): Promise<CommentMutationResponse> {
		try {
			const {content, postId} = data;
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
				};
			}
			const commentData = await CommentModel.findOne({_id: commentId});
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
				};
			}
			const UserData = await user.findOne({_id: req.session.userId});
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
				};
			}
			if (UserData._id !== commentData.author) {
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
				};
			}
			await CommentModel.findOneAndUpdate({_id: commentId}, {content});
			const CommentReturn = await CommentModel.find({postId});
			console.log(`User[${req.session.userId}] update comment`);
			return {
				code: CodeError.update_comment_success,
				success: true,
				message: 'update comment successful',
				comment: CommentReturn,
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
				author: req.session.userId,
			});
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
				};
			}
			await CommentModel.findOneAndDelete({
				_id: commentId,
			});
			const CommentReturn = await CommentModel.find({
				postId: thatComment.postId,
			});
			console.log(`User[${req.session.userId}] delete comment`);
			return {
				code: CodeError.delete_comment_success,
				success: true,
				message: 'delete comment successful',
				comment: CommentReturn,
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
