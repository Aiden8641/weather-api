import { createClient } from "redis";
import { configDotenv } from "dotenv";

configDotenv()

// redis setup
export const client = createClient({
  username: `${process.env.REDIS_USERNAME}`,
  password: `${process.env.REDIS_PASSWORD}`,
  socket: {
    host: 'redis-11260.c8.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 11260,
  }

});

client.on('error', err => console.log('Redis Client Error', err));
client.connect()

