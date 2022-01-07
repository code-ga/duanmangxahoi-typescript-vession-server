import { CodeError } from "../types/codeError";
import { ChangePasswordInputType } from "./../types/changePasswordInputType";
import bcrypt from "bcrypt";
export const ValidationChangePasswordInput = async(
  ChangePasswordInput: ChangePasswordInputType,
  oldPasswordInDatabase: string
) => {
  if (ChangePasswordInput.oldPassword.length < 6) {
    return {
      success: false,
      message: "Old password is not valid",
      code: CodeError.old_password_not_valid,
      error: [
        {
          field: "oldPassword",
          message: "Old password is not valid",
        },
      ],
    };
  } else if (ChangePasswordInput.newPassword.length < 6) {
    return {
      success: false,
      message: "New password is not valid",
      code: CodeError.new_password_not_valid,
      error: [
        {
          field: "newPassword",
          message: "New password is not valid",
        },
      ],
    };
    }
    const passwordIsValid = await bcrypt.compare(
        ChangePasswordInput.oldPassword,
        oldPasswordInDatabase
    );
    if (!passwordIsValid) {
        return {
            success: false,
            message: "Old password is not valid",
            code: CodeError.old_password_not_valid,
            error: [
                {
                    field: "oldPassword",
                    message: "Old password is not valid",
                },
            ],
        };
    }
  return false;
};
