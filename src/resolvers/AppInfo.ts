import {Query, Resolver, Ctx, Mutation, Arg, UseMiddleware} from 'type-graphql'
import {IsAuthorized} from '../middleware/checkAuth'
import {AppInfo, AppInfoModel} from '../model/appInfo'
import {userModel} from '../model/user'
import {Context} from '../types/Context'
import {UpdateAppInfoInput} from '../types/UpdateAppInfoInput'
import {log} from '../util/logger'
import {AppInfoMutationResponse} from './../types/AppInfoMutationResponse'
import {CodeError} from './../types/codeError'
import {checkRoleCanUpdateAppInfo} from './../util/checkRole'
// hello resolver
@Resolver()
export class AppInfoResolver {
	ClassName: string
	constructor() {
		this.ClassName = this.constructor.name
	}
	// get app info
	@Query(() => AppInfo, {nullable: true})
	async getAppInfo(@Ctx() {req}: Context): Promise<AppInfo | null | undefined> {
		log.log(
			this.ClassName,
			`[${req.session.userId || 'vô danh'}] user get app info`,
		)
		return await AppInfoModel.findOne({})
	}
	// update app info
	@UseMiddleware(IsAuthorized)
	@Mutation(() => AppInfoMutationResponse, {nullable: true})
	async updateAppInfo(
		@Ctx() {req}: Context,
		@Arg('appInfo') appInfo: UpdateAppInfoInput,
	): Promise<AppInfoMutationResponse> {
		try {
			const appInfoData = await AppInfoModel.findOne({})
			if (!appInfoData) {
				return {
					code: CodeError.not_found,
					success: false,
					message: 'App info not found',
				}
			}

			const userId = req.session.userId
			const user = await userModel.findById(userId)
			if (!user) {
				return {
					code: CodeError.user_not_found,
					success: false,
					message: 'user not found',
					errors: [
						{
							field: 'userId',
							message: 'user not found',
						},
					],
				}
			}
			const permission = checkRoleCanUpdateAppInfo(user.role)
			if (!permission) {
				return {
					code: CodeError.access_denied,
					success: false,
					message: 'access denied',
					errors: [
						{
							field: 'userId',
							message: 'access denied',
						},
					],
				}
			}
			await AppInfoModel.updateOne({}, {$set: appInfo})
			const appInfoReturn = await AppInfoModel.findOne({})
			if (!appInfoReturn) {
				return {
					code: CodeError.not_found,
					success: false,
					message: 'App info not found',
				}
			}
			log.log(
				this.ClassName,
				`[${req.session.userId || 'vô danh'}] user update app info`,
			)
			return {
				code: CodeError.update_app_info_success,
				success: true,
				message: 'success',
				AppInfo: appInfoReturn,
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
}
