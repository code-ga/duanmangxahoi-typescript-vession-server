import { role } from "../types/RoleEnum";

export const checkRoleCanDeletePost = (roleUser: string[]): boolean => {
  const roleCanDeletePost = [role.admin, role.superAdmin];
  return roleCanDeletePost.some((role) => roleUser.includes(role));
};
export const checkRoleCanEditPost = (roleUser: string[]): boolean => {
  const roleCanEditPost = [role.admin, role.superAdmin];
  return roleCanEditPost.some((role) => roleUser.includes(role));
};
export const checkRoleCanDeleteComment = (roleUser: string[]): boolean => {
  const roleCanDeleteComment = [role.admin, role.superAdmin];
  return roleCanDeleteComment.some((role) => roleUser.includes(role));
};
export const checkRoleCanEditComment = (roleUser: string[]): boolean => {
  const roleCanEditComment = [role.admin, role.superAdmin];
  return roleCanEditComment.some((role) => roleUser.includes(role));
};
export const checkRoleCanDeleteUser = (roleUser: string[]): boolean => {
  const roleCanDeleteUser = [role.superAdmin, role.admin];
  return roleCanDeleteUser.some((role) => roleUser.includes(role));
};
export const checkRoleCanEditUser = (roleUser: string[]): boolean => {
  const roleCanEditUser = [role.superAdmin];
  return roleCanEditUser.some((role) => roleUser.includes(role));
};
export const checkRoleCanCreateAlertPost = (roleUser: string[]): boolean => {
  const roleCanCreateAlertPost = [role.superAdmin, role.admin];
  return roleCanCreateAlertPost.some((role) => roleUser.includes(role));
};
export const checkRoleCanUpdateAlertPost = (roleUser: string[]): boolean => {
  const roleCanUpdateAlertPost = [role.superAdmin, role.admin];
  return roleCanUpdateAlertPost.some((role) => roleUser.includes(role));
};
export const checkRoleCanDeleteAlertPost = (roleUser: string[]): boolean => {
  const roleCanDeleteAlertPost = [role.superAdmin, role.admin];
  return roleCanDeleteAlertPost.some((role) => roleUser.includes(role));
};
