import { minPasswordLength } from '../constraint'
import {CodeError} from '../types/codeError'
import {resisterInput} from './../types/RegisterInput'

export const checkPasswordIsValid = (password: string) => {
	if (password.length < minPasswordLength) {
		return false
	}
	return true
}

export const ValidationResisterInput = (ResisterInput: resisterInput) => {
	if (!ResisterInput.email.includes('@')) {
		return {
			success: false,
			message: 'Email is not valid',
			code: CodeError.email_not_valid,
			error: [
				{
					field: 'email',
					message: 'Email is not valid',
				},
			],
		}
	} else if (!checkPasswordIsValid(ResisterInput.password)) {
		return {
			success: false,
			message: 'Password is not valid',
			code: CodeError.password_not_valid,
			error: [
				{
					field: 'password',
					message: 'Password is not valid',
				},
			],
		}
	}
	return null
}
