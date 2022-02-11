/* eslint-disable no-shadow */
import { role } from '../types/RoleEnum';

export const checkRoleCanDeletePost = (roleUser: role[]): boolean => {
	const roleCanDeletePost = [role.admin, role.superAdmin, role.contentAdmin];
	return roleCanDeletePost.some((role) => roleUser.includes(role));
};
export const checkRoleCanEditPost = (roleUser: role[]): boolean => {
	const roleCanEditPost = [role.admin, role.superAdmin, role.contentAdmin];
	return roleCanEditPost.some((role) => roleUser.includes(role));
};
export const checkRoleCanDeleteComment = (roleUser: role[]): boolean => {
	const roleCanDeleteComment = [role.admin, role.superAdmin, role.contentAdmin];
	return roleCanDeleteComment.some((role) => roleUser.includes(role));
};
export const checkRoleCanEditComment = (roleUser: role[]): boolean => {
	const roleCanEditComment = [role.admin, role.superAdmin, role.contentAdmin];
	return roleCanEditComment.some((role) => roleUser.includes(role));
};
export const checkRoleCanDeleteUser = (roleUser: role[]): boolean => {
	const roleCanDeleteUser = [role.superAdmin, role.admin];
	return roleCanDeleteUser.some((role) => roleUser.includes(role));
};
export const checkRoleCanEditUser = (roleUser: role[]): boolean => {
	const roleCanEditUser = [role.superAdmin];
	return roleCanEditUser.some((role) => roleUser.includes(role));
};
export const checkRoleCanCreateAlertPost = (roleUser: role[]): boolean => {
	const roleCanCreateAlertPost = [
		role.superAdmin,
		role.admin,
		role.contentAdmin,
	];
	return roleCanCreateAlertPost.some((role) => roleUser.includes(role));
};
export const checkRoleCanUpdateAlertPost = (roleUser: role[]): boolean => {
	const roleCanUpdateAlertPost = [
		role.superAdmin,
		role.admin,
		role.contentAdmin,
	];
	return roleCanUpdateAlertPost.some((role) => roleUser.includes(role));
};
export const checkRoleCanDeleteAlertPost = (roleUser: role[]): boolean => {
	const roleCanDeleteAlertPost = [
		role.superAdmin,
		role.admin,
		role.contentAdmin,
	];
	return roleCanDeleteAlertPost.some((role) => roleUser.includes(role));
};
