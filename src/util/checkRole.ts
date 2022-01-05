import { role } from "../types/RoleEnum";

export const checkRoleCanDeletePost = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
};
export const checkRoleCanEditPost = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
export const checkRoleCanDeleteComment = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
export const checkRoleCanEditComment = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
export const checkRoleCanDeleteUser = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
export const checkRoleCanEditUser = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
export const checkRoleCanCreateAlertPost = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
export const checkRoleCanUpdateAlertPost = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
export const checkRoleCanDeleteAlertPost = (roleUser: string): boolean => {
    return roleUser=== role.admin || roleUser === role.superAdmin;
}
