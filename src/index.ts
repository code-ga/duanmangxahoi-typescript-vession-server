import { createServer } from "http";
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import path from "path";
import dotenv from "dotenv";
import connectToDB from "./util/connectToDB";
import session from "express-session";
import MongoStore from "connect-mongo";
import { buildSchema } from "type-graphql";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { HelloResolver } from "./resolvers/Hello";
import { COOKIE_NAME } from "./constraint";
import { Context } from "./types/Context";
import { UserResolver } from "./resolvers/User";
import { PostResolver } from "./resolvers/Post";
import { CommentResolver } from "./resolvers/Comment";
import { createAdminUser } from "./util/createAdminUser";
dotenv.config({ path: path.resolve(__dirname, "./.env") });
const main = async () => {
  const app = express();
  const MongoUrl = process.env.DB_URL as string;
  const connection = await connectToDB(MongoUrl);
  app.use(
    session({
      name: COOKIE_NAME,
      store: MongoStore.create({ mongoUrl: process.env.DB_URL as string }),
      cookie: {
        maxAge: 1000 * 60 * 60, // 1 HOURS
        httpOnly: true,
        sameSite: "lax", //csrf
        secure: process.env.NODE_ENV === "production", //cookie only works in https
      },
      secret: process.env.COOKIE_SECRET as string,
      resave: false,
      saveUninitialized: false,
    })
  );

  await createAdminUser();
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, UserResolver, PostResolver, CommentResolver],
      validate: false,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    context: ({ req, res }): Context => {
      return { req, res, connection };
    },
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });
  const HttpServer = createServer(app);
  const port = process.env.PORT || 4000;
  HttpServer.listen(port, () => {
    console.log(
      `Server is running on port ${port} and graphgl path http://127.0.0.1:${port}${apolloServer.graphqlPath}`
    );
  });
};
main().catch(console.log);
