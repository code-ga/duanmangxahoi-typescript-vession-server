/* eslint-disable no-inline-comments */
import User, {userModel} from '../model/user'
import {Mutation, Resolver, Arg, Ctx, UseMiddleware} from 'type-graphql'
import bcrypt from 'bcrypt'
import {UserMutationResponse} from '../types/userMutationResponse'
import {resisterInput} from '../types/RegisterInput'
import {CodeError} from './../types/codeError'
import {ValidationResisterInput} from '../util/ValidationResisterInput'
import {LoginInput} from './../types/LoginInput'
import {Context} from './../types/Context'
import {COOKIE_NAME} from '../constraint'
import {role} from '../types/RoleEnum'
import {registerEnumType} from 'type-graphql'
import {ChangePasswordAfterLoginInputType} from './../types/changePasswordInputType'
import {ValidationChangePasswordInput} from '../util/validationPasswordInput'
import {AddRoleForUserInput} from './../types/addRoleForUserInput'
import {IsAuthorized} from './../middleware/checkAuth'
import {generateKeywords} from './../util/keyword'
import {v4 as uuidV4} from 'uuid'
registerEnumType(role, {
	name: 'role', // this one is mandatory
	description: 'the role enum', // this one is optional
})
import {log} from '../util/logger'
import {Query} from 'type-graphql'
import {ForgotPasswordInput} from '../types/ForgotPasswordInput'
import {sendEmail} from './../util/sendEmail'
import {TokenModel} from '../model/Token'
import {ChangePasswordInputType} from './../types/changePasswordInput'
import {checkPasswordIsValid} from './../util/ValidationResisterInput'
const bcryptSalt = 10
@Resolver()
export class UserResolver {
	ClassName: string
	constructor() {
		this.ClassName = this.constructor.name
	}
	@Query(() => User, {
		nullable: true,
	})
	@UseMiddleware(IsAuthorized)
	async me(@Ctx() {req}: Context) {
		try {
			const UserId = req.session.userId
			if (!UserId) {
				return null
			}
			const UserData = await userModel.findById(UserId)
			if (!UserData) {
				return null
			}
			return UserData
		} catch (e) {
			log.warn(this.ClassName, e)
			return null
		}
	}
	@Mutation(() => UserMutationResponse)
	async register(
		@Arg('registerInput') ResisterInput: resisterInput,
		@Ctx() {req}: Context,
	): Promise<UserMutationResponse> {
		const errorDataInput = ValidationResisterInput(ResisterInput)
		if (errorDataInput) {
			return errorDataInput
		}
		try {
			const {email, password, username} = ResisterInput
			const exiting =
				(await userModel.findOne({email})) ||
				(await userModel.findOne({username}))
			if (exiting) {
				return {
					code:
						exiting.username === username
							? CodeError.username_already_exists
							: CodeError.email_already_exists,
					success: false,
					message: `${
						exiting.username === username ? 'username' : 'email'
					} are ready exiting`,
					error: [
						{
							field: exiting.username === username ? 'username' : 'email',
							message: `have two ${
								exiting.username === username ? 'username' : 'email'
							} in database`,
						},
					],
				}
			}
			const hashedPassword = await bcrypt.hash(password, bcryptSalt)
			const NewUser = new userModel({
				email: email,
				password: hashedPassword,
				username: username,
				role: [role.user],
				likes: [],
				keywords: generateKeywords(username),
			})
			await NewUser.save()
			log.log(this.ClassName, NewUser)
			req.session.userId = NewUser._id
			log.log(
				this.ClassName,
				`register new user successful with id is ${NewUser._id}`,
			)
			return {
				code: CodeError.successFully_registered,
				success: true,
				user: NewUser,
				message:
					'happy ! user register is successful . now you can use this app',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error' + err.message,
			}
		}
	}
	@Mutation(() => UserMutationResponse)
	async login(
		@Arg('loginInput') loginInput: LoginInput,
		@Ctx() {req}: Context,
	): Promise<UserMutationResponse> {
		try {
			const {UsernameOrEmail, password} = loginInput
			const userData =
				(await userModel.findOne({email: UsernameOrEmail})) ||
				(await userModel.findOne({username: UsernameOrEmail}))
			if (!userData) {
				return process.env.NODE_ENV !== 'development'
					? {
							code: CodeError.Incorrect_User_or_Password,
							success: false,
							message: 'Incorrect username email or password',
							error: [
								{
									field: 'Username Or Email Or Password',
									message: 'Incorrect username email or password',
								},
							],
					  }
					: {
							code: CodeError.user_not_found,
							success: false,
							message: 'user not found',
							error: [
								{
									field: 'usernameOrEmail',
									message: 'user not found',
								},
							],
					  }
			}
			const isPasswordValid = await bcrypt.compare(password, userData.password)
			if (!isPasswordValid) {
				return process.env.NODE_ENV !== 'development'
					? {
							code: CodeError.Incorrect_User_or_Password,
							success: false,
							message: 'Incorrect username email or password',
							error: [
								{
									field: 'Username Or Email Or Password',
									message: 'Incorrect username email or password',
								},
							],
					  }
					: {
							code: CodeError.invalid_password,
							success: false,
							message: 'invalid password',
							error: [
								{
									field: 'password',
									message: 'invalid password',
								},
							],
					  }
			}

			req.session.userId = userData._id
			log.log(
				this.ClassName,
				`user login successful with id is ${userData._id}`,
			)

			return {
				code: CodeError.successFully_logged_in,
				success: true,
				user: userData,
				message: 'happy ! you are logged in',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error ' + err.message,
			}
		}
	}
	@Mutation(() => Boolean)
	logout(@Ctx() {req, res}: Context): Promise<boolean> {
		try {
			return new Promise((resolve, reject) => {
				const ThisUserId = req.session.userId
				req.session.destroy((err) => {
					if (err) {
						reject(err)
					}
					res.clearCookie(COOKIE_NAME)
					resolve(true)
					log.log(
						this.ClassName,
						`user logout successful with id is ${ThisUserId}`,
					)
				})
			})
		} catch (err) {
			log.warn(this.ClassName, err)
			return new Promise((resolve, reject) => {
				reject(false)
			})
		}
	}
	@Mutation(() => UserMutationResponse)
	@UseMiddleware(IsAuthorized)
	async getUser(@Ctx() {req}: Context): Promise<UserMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findById(userId)
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					success: false,
					message: 'user not found',
					error: [
						{
							field: 'userId',
							message: 'user not found',
						},
					],
				}
			}
			log.log(
				this.ClassName,
				`get user successful with user id is ${userData._id}`,
			)
			return {
				code: CodeError.successFully_get_user,
				success: true,
				user: userData,
				message: 'happy ! you are get user',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error ' + err.message,
			}
		}
	}
	@Mutation(() => UserMutationResponse)
	async getAuthorInfo(
		@Arg('authorId') authorId: string,
		// @Ctx() {}: Context,
	): Promise<UserMutationResponse> {
		try {
			const userData = await userModel.findById(authorId)
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					success: false,
					message: 'author not found',
					error: [
						{
							field: 'userId',
							message: 'author not found',
						},
					],
				}
			}
			log.log(
				this.ClassName,
				`get author successful with user id is ${userData._id}`,
			)
			return {
				code: CodeError.successFully_get_user,
				success: true,
				user: userData,
				message: 'happy ! you are get user author info',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error ' + err.message,
			}
		}
	}
	// get my profile
	@Mutation(() => UserMutationResponse)
	@UseMiddleware(IsAuthorized)
	async getMyProfile(@Ctx() {req}: Context): Promise<UserMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findById(userId)
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					success: false,
					message: 'user not found',
					error: [
						{
							field: 'userId',
							message: 'user not found',
						},
					],
				}
			}
			log.log(
				this.ClassName,
				`get user successful with user id is ${userData._id}`,
			)
			return {
				code: CodeError.successFully_get_user,
				success: true,
				user: userData,
				message: 'happy ! you are get my profile',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error ' + err.message,
			}
		}
	}
	// change password user
	@Mutation(() => UserMutationResponse)
	@UseMiddleware(IsAuthorized)
	async changePasswordUserWasLogin(
		@Arg('changePasswordInput')
		changePasswordInput: ChangePasswordAfterLoginInputType,
		@Ctx() {req}: Context,
	): Promise<UserMutationResponse> {
		try {
			const userId = req.session.userId
			const userData = await userModel.findById(userId)
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					success: false,
					message: 'user not found',
					error: [
						{
							field: 'userId',
							message: 'user not found',
						},
					],
				}
			}
			const errorDataInput = await ValidationChangePasswordInput(
				changePasswordInput,
				userData.password,
			)
			if (errorDataInput) {
				return errorDataInput
			}
			const hashedPassword = await bcrypt.hash(
				changePasswordInput.newPassword,
				bcryptSalt,
			)
			await userModel.findOneAndUpdate(
				{_id: userId},
				{password: hashedPassword},
				{new: true},
			)
			log.log(
				this.ClassName,
				`change password (after user login) successful with user id is ${userData._id}`,
			)
			return {
				code: CodeError.change_password_success,
				success: true,
				message: 'happy ! you are change password',
				user: userData,
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error ' + err.message,
			}
		}
	}
	// admin User everyone must to write admin in here
	// create admin user
	@Mutation(() => UserMutationResponse)
	@UseMiddleware(IsAuthorized)
	async createAccountHaveRole(
		@Arg('RegisterInput') ResisterInput: resisterInput,
		@Arg('role') UserRole: role,
		@Ctx() {req}: Context,
	): Promise<UserMutationResponse> {
		try {
			const userId = req.session.userId
			const UserIsSuperAdmin = await userModel.findOne({
				_id: userId,
				role: role.superAdmin,
			})
			if (!UserIsSuperAdmin) {
				return {
					code: CodeError.access_denied,
					success: false,
					message: 'access denied',
					error: [
						{
							field: 'userId',
							message: 'access denied',
						},
					],
				}
			}
			if (UserRole === role.superAdmin) {
				return {
					code: CodeError.access_denied,
					success: false,
					message: 'access denied',
					error: [
						{
							field: 'userId',
							message: 'access denied',
						},
					],
				}
			}
			const errorDataInput = ValidationResisterInput(ResisterInput)
			if (errorDataInput) {
				return errorDataInput
			}
			const {email, password, username} = ResisterInput
			const exiting =
				(await userModel.findOne({email})) ||
				(await userModel.findOne({username}))
			if (exiting) {
				return {
					code:
						exiting.username === username
							? CodeError.username_already_exists
							: CodeError.email_already_exists,
					success: false,
					message: `${
						exiting.username === username ? 'username' : 'email'
					} are ready exiting`,
					error: [
						{
							field: exiting.username === username ? 'username' : 'email',
							message: `have two ${
								exiting.username === username ? 'username' : 'email'
							} in database`,
						},
					],
				}
			}
			const hashedPassword = await bcrypt.hash(password, bcryptSalt)
			let NewUser = new userModel({
				email: email,
				password: hashedPassword,
				username: username,
				role: [UserRole],
			})
			NewUser = await NewUser.save()
			log.log(
				this.ClassName,
				`create admin user successful with user id is ${NewUser._id}`,
			)
			return {
				code: CodeError.create_admin_account_success,
				success: true,
				user: NewUser,
				message:
					'happy ! user register is successful . now you can use this app',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error' + err.message,
			}
		}
	}
	// add role for user
	@Mutation(() => UserMutationResponse)
	@UseMiddleware(IsAuthorized)
	async addRoleForUser(
		@Arg('addRoleForUserInput') addRoleForUserInput: AddRoleForUserInput,
		@Ctx() {req}: Context,
	): Promise<UserMutationResponse> {
		try {
			const userId = req.session.userId
			const UserIsSuperAdmin = await userModel.findOne({
				_id: userId,
				role: role.superAdmin,
			})
			if (!UserIsSuperAdmin) {
				return {
					code: CodeError.access_denied,
					success: false,
					message: 'access denied',
					error: [
						{
							field: 'userId',
							message: 'access denied',
						},
					],
				}
			}
			const userData = await userModel.findOne({
				_id: addRoleForUserInput.userId,
			})
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					success: false,
					message: 'user not found',
					error: [
						{
							field: 'userId',
							message: 'user not found',
						},
					],
				}
			}
			await userModel.findOneAndUpdate(
				{_id: addRoleForUserInput.userId},
				{$push: {role: addRoleForUserInput.role}},
			)
			log.log(
				this.ClassName,
				`add role for user successful with user id is ${userData._id}`,
			)
			return {
				code: CodeError.add_role_for_user_success,
				success: true,
				message: 'happy ! you are add role for user',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error ' + err.message,
			}
		}
	}
	@Mutation(() => UserMutationResponse)
	@UseMiddleware(IsAuthorized)
	async removeRoleForUser(
		@Arg('removeRoleForUserInput') removeRoleForUserInput: AddRoleForUserInput, // vì input của hai cái này nó giống nhau
		@Ctx() {req}: Context,
	): Promise<UserMutationResponse> {
		try {
			const userId = req.session.userId
			const UserIsSuperAdmin = await userModel.findOne({
				_id: userId,
				role: role.superAdmin,
			})
			if (!UserIsSuperAdmin) {
				return {
					code: CodeError.access_denied,
					success: false,
					message: 'access denied',
					error: [
						{
							field: 'userId',
							message: 'access denied',
						},
					],
				}
			}
			const userData = await userModel.findOne({
				_id: removeRoleForUserInput.userId,
			})
			if (!userData) {
				return {
					code: CodeError.user_not_found,
					success: false,
					message: 'user not found',
					error: [
						{
							field: 'userId',
							message: 'user not found',
						},
					],
				}
			}
			await userModel.findOneAndUpdate(
				{_id: removeRoleForUserInput.userId},
				{$pull: {role: removeRoleForUserInput.role}},
			)
			log.log(
				this.ClassName,
				`remove role for user successful with user id is ${userData._id}`,
			)
			return {
				code: CodeError.remove_role_for_user_success,
				success: true,
				message: 'happy ! you are remove role for user',
			}
		} catch (err) {
			log.warn(this.ClassName, err)
			return {
				code: CodeError.internal_server_error,
				success: false,
				message: 'Internal server error ' + err.message,
			}
		}
	}
	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput,
	): Promise<boolean> {
		const user = await userModel.findOne({email: forgotPasswordInput.email})
		if (!user) return true
		await TokenModel.findOneAndDelete({userId: user._id})
		const resetToken = uuidV4()
		const hashResetToken = await bcrypt.hash(resetToken, bcryptSalt)
		await new TokenModel({
			token: hashResetToken,
			userId: user._id,
		}).save()
		const FE_URL = 'http://localhost:3000'
		const url = `${FE_URL}/change-password?token=${resetToken}&userId=${user._id}`
		await sendEmail(
			forgotPasswordInput.email,
			`<a href=${url}>Click here to reset password</a> <div>lưu ý : nếu bạn đánh mất link này vào tay người khác thì account của bạn có thể là sẽ bị mất và xin hãy nhấp vào link mới nhất<div/>`,
		)
		log.log(
			this.ClassName,
			`forgotPassword Mutation run successful with user id is ${user._id}`,
		)
		return true
	}

	@Mutation(() => UserMutationResponse)
	async changePassword(
		@Arg('changePasswordInput') changePasswordInput: ChangePasswordInputType,
		@Arg('token') token: string,
		@Arg('userId') userId: string,
		@Ctx() {req}: Context,
	): Promise<UserMutationResponse> {
		if (!checkPasswordIsValid(changePasswordInput.NewPassword)) {
			return {
				success: false,
				message: 'Password is not valid',
				code: CodeError.password_not_valid,
				error: [
					{
						field: 'NewPassword',
						message: 'Password is not valid',
					},
				],
			}
		}
		try {
			const resetPasswordTokenDocument = await TokenModel.findOne({userId})
			if (!resetPasswordTokenDocument) {
				return {
					success: false,
					message: 'Token is not valid or expired',
					code: CodeError.token_not_valid,
					error: [
						{
							field: 'token',
							message: 'Token is not valid or expired',
						},
					],
				}
			}

			const resetPasswordTokenIsValid = await bcrypt.compare(
				token,
				resetPasswordTokenDocument.token,
			)
			if (!resetPasswordTokenIsValid) {
				return {
					success: false,
					message: 'Token is not valid or expired',
					code: CodeError.token_not_valid,
					error: [
						{
							field: 'token',
							message: 'Token is not valid or expired',
						},
					],
				}
			}
			const user = await userModel.findOne({_id: userId})
			if (!user) {
				return {
					success: false,
					message: 'User not found where are you ?',
					code: CodeError.user_not_found,
					error: [
						{
							field: 'userId',
							message: 'User not found where are you ?',
						},
					],
				}
			}
			const hashPassword = await bcrypt.hash(
				changePasswordInput.NewPassword,
				bcryptSalt,
			)
			await userModel.findOneAndUpdate(
				{_id: userId},
				{password: hashPassword},
				{new: true},
			)
			await resetPasswordTokenDocument.deleteOne()
			req.session.userId = user._id
			log.log(
				this.ClassName,
				`change password successful with user id is ${user._id}`,
			)
			return {
				code: CodeError.change_password_success,
				success: true,
				message: 'happy ! you are change password',
				user,
			}
		} catch (error) {
			console.log(error)
			return {
				success: false,
				message: 'Internal server error',
				code: CodeError.internal_server_error,
			}
		}
	}
}
