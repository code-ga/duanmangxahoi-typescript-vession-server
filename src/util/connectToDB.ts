// connect to mongodb
import mongoose from 'mongoose';
const connectToDB = async (url: string) => {
	try {
		const connect = await mongoose.connect(url, {
			// connect to mongodb options
		});
		console.log('Connected to MongoDB');
		return connect;
	} catch (err) {
		console.error(err);
		throw err;
	}
};
export default connectToDB;
