import path, { dirname } from 'path';

import Redis from 'ioredis';
import { WebSocketServer } from 'ws';
import express from 'express';
import { fileURLToPath } from 'url';
import http from 'http';
import { v4 as uuid } from 'uuid';

const app = express();
const server = http.createServer(app);
const httpServer = http.createServer();
httpServer.listen(8080, () => console.log("Listening on 8080"))
const wss = new WebSocketServer({ server: httpServer });
const redisClusterInfoList = ["chatroomappredisinstance.vjgbsq.clustercfg.use1.cache.amazonaws.com", 6379];
const redis = await new Redis.Cluster(redisClusterInfoList);

wss.on('connection', async (socket) => {
    socket.id = uuid();
    const messageList = await getMessages();
    messageList.forEach(msg => {
        socket.send(msg);
    })
    socket.onmessage = (event) => {
        const payload = JSON.stringify({ data: event.data, socket: socket.id });
        redis.publish("RedisServerSend", payload);
    }
});

redis.subscribe("RedisServerSend", (err, count) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`Subscribed successfully! Currently subbed to ${count} channels`);
    }
});

redis.on("message", (channel, message) => {
    if (channel === "RedisServerSend") {
        const { data, socket } = JSON.parse(message);
        redis.lpush("messages", data);
        [...wss.clients].forEach(c => {
            if (c.id == socket) {
                return;
            }
            c.send(data);
        });
    }
});

async function getMessages() {
    let data = await redis.lrange("messages", 0, -1);
    while (data.length > 25) {
        await redis.rpop("messages");
        data = await redis.lrange("messages", 0, -1);
    }
    return data.reverse();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(`${__dirname}/public`)));
const port = 3000;
server.listen(port, () => console.log(`Listening on port ${port}`));
