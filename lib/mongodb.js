import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error('MONGODB_URI를 환경변수에 추가하세요');
}

client = new MongoClient(uri, options);
clientPromise = client.connect();

export default clientPromise;
