const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@127.0.0.1:5672';
const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'demo_queue';

async function startWorker() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.prefetch(1);

    console.log('Worker ready. Waiting for messages on queue:', QUEUE_NAME);

    channel.consume(
        QUEUE_NAME,
        async (msg) => {
            if (msg === null) return;
            try {
                const content = msg.content.toString();
                const payload = JSON.parse(content);
                console.log('Received message:', payload);

                // Simulate work (e.g., processing time)
                await new Promise((resolve) => setTimeout(resolve, 200));

                channel.ack(msg);
            } catch (err) {
                console.error('Worker error:', err.message);
                // Requeue on failure to avoid message loss during practice
                channel.nack(msg, false, true);
            }
        },
        { noAck: false }
    );

    const handleShutdown = async () => {
        try {
            await channel.close();
            await connection.close();
        } finally {
            process.exit(0);
        }
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
}

if (require.main === module) {
    startWorker().catch((err) => {
        console.error('Failed to start worker:', err.message);
        process.exit(1);
    });
}

module.exports = { startWorker };


