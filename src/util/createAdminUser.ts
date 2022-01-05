import { user } from "../model/user";
import { role } from "../types/RoleEnum";
import bcrypt from "bcrypt";

export const createAdminUser = async () => {
  const superAdmin = await user.find({
    role: role.superAdmin,
  });
  const adminEmail = process.env.ADMIN_EMAIL || "anh tritranduc đẹp trai";
  const adminUserName = `admin ${adminEmail} ${Date.now()}`;
  const password = `password admin ${adminEmail} ${Date.now()}`;
  const hashedPassword = await bcrypt.hash(password, 4);
  let AdminAccount;
  if (superAdmin.length > 0) {
    console.log("superAdmin is already created");
    await user.findOneAndUpdate(
      {
        role: role.superAdmin,
      },
      {
        email: adminEmail,
        password: hashedPassword,
        username: adminUserName,
        role: role.superAdmin,
      }
    );

    AdminAccount = await user.findOne({
      role: role.superAdmin,
    });
  } else {
    AdminAccount = new user({
      username: adminUserName,
      password: hashedPassword,
      email: adminEmail,
      role: role.superAdmin,
    });
    await AdminAccount.save();
  }
  console.log("Admin account created");
  console.log(`username: ${adminUserName}`);
  console.log(`password: ${password}`);
  console.log(`email: ${adminEmail}`);
  return [AdminAccount, true];
};
