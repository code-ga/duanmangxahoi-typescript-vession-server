import {ApolloServerPlugin} from 'apollo-server-plugin-base';
import {Context} from '../types/Context';
export class Log {
	log(className: string, ...message: unknown[]): void {
		console.log(`[${className}]`, ...message);
	}
	warn(className: string, ...message: unknown[]): void {
		console.warn(`[${className}]`, ...message);
	}
}
export const log = new Log();

// https://stackoverflow.com/questions/59988906/how-do-i-write-a-apollo-server-plugin-to-log-the-request-and-its-duration
export const LogPluginForApolloServer: ApolloServerPlugin<Context> = {
	async requestDidStart() {
		const start = Date.now();
		let op: string | null;

		return {
			async didResolveOperation(context) {
				op = context.operationName;
			},
			async willSendResponse(context) {
				const stop = Date.now();
				const elapsed = stop - start;
				const size = JSON.stringify(context.response).length * 2;
				console.log(`operation=${op} duration=${elapsed}ms bytes=${size}`);
			},
		};
	},
};
