import { Context } from "../types/Context";
import { MiddlewareFn, Authorized } from "type-graphql";

export const IsAuthorized: MiddlewareFn<Context> = async (
  { root, args, context, info },
  next
) => {
  const userId = context.req.session.userId;
  if (!userId) {
    throw Authorized("You are not authorized");
  } else {
    await next();
  }
};
