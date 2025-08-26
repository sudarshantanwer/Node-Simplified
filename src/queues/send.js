const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@127.0.0.1:5672';
const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'demo_queue';

async function publishMessage(messagePayload) {
    let connection;
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        const messageBuffer = Buffer.from(JSON.stringify(messagePayload));
        channel.sendToQueue(QUEUE_NAME, messageBuffer, { persistent: true });

        await channel.close();
        await connection.close();
        return { ok: true };
    } catch (error) {
        if (connection) {
            try { await connection.close(); } catch (_) {}
        }
        throw error;
    }
}

// Allow running from CLI: `npm run publish -- '{"hello":"world"}'`
if (require.main === module) {
    const arg = process.argv[2];
    const payload = arg ? JSON.parse(arg) : { hello: 'world', ts: Date.now() };
    console.log('Attempting to connect to:', RABBITMQ_URL);
    publishMessage(payload)
        .then(() => {
            console.log('Message published to queue', QUEUE_NAME, payload);
        })
        .catch((err) => {
            console.error('Failed to publish message:', err.message);
            console.error('Full error:', err);
            process.exit(1);
        });
}

module.exports = { publishMessage };


