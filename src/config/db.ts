import mongoose from 'mongoose';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/';

function connect(dbName: string) {
  return mongoose.connect(MONGO_URL + dbName);
}

export default connect;