const amqp = require("amqplib");
const URL = "amqp://localhost:5672/";
const QUEUE = "myqueue";

function bail(error) {
  console.error(error);
  process.exit(1);
}
function debug(log) {
  console.log(log);
}
function warn(message) {
  console.warn(message);
}
function logError(error) {
  console.error(error);
}
async function connect(connUrl) {
  try {
    const connection = await amqp.connect(connUrl);
    return connection;
  } catch (error) {
    bail(error);
  }
}
async function getChannel(connection) {
  if (
    connection === undefined ||
    typeof connection["createChannel"] !== "function"
  ) {
    error("Connection is Invalid");
    return null;
  }
  try {
    let channel = await connection.createChannel();
    return channel;
  } catch (error) {
    error(error);
    return null;
  }
}

async function main() {
  try {
    let count = 0;
    const MAX_MESSAGE = 100;
    const connection = await connect(URL);
    const channel = await getChannel(connection);
    await channel.assertQueue(QUEUE);
    if (channel !== null) {
      channel.consume(QUEUE, async (message) => {
        debug(`Message Recieved: ${message.content.toString()}`);
        await channel.ack(message, true);
        count += 1;
        if (count === MAX_MESSAGE) {
          process.exit();
        }
      });
    }
    function close() {
      channel.close().then(() => {
        connection.close();
      });
    }
    return close;
  } catch (error) {
    bail(error);
  }
}

main().then((closeFunc) => {
  // stackoverflow solution
  [
    `SIGINT`,
    `SIGUSR1`,
    `SIGUSR2`,
    `uncaughtException`,
    `SIGTERM`,
  ].forEach((eventType) => {
    process.on(eventType, async function cleanUpServer() {
      try {
        debug("Closing Resources");
        closeFunc();
        process.exit(0);
      } catch (error) {
        logError(error);
      }
    });
  });
});
