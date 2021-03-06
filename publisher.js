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
function publish(channel, queueName, data) {
  if (!(data instanceof Buffer) && typeof queueName !== "string") {
    error("invalid data type sent!!");
  }
  try {
    const result = channel.sendToQueue(queueName, data);
    if (!result) {
      warn(`Unable to send data to ${queueName} using ${channel}`);
    }
    debug(`Message sent successfully: ${data.toString()}`);
    return true;
  } catch (error) {
    error(error);
    return false;
  }
}

async function main() {
  try {
    const message = process.argv.splice(2).join(" ");
    const connection = await connect(URL);
    const channel = await getChannel(connection);
    await channel.assertQueue(QUEUE);
    if (channel !== null) {
      publish(channel, QUEUE, Buffer.from(message));
    }
    await channel.close();
    await connection.close();
  } catch (error) {
    bail(error);
  }
}

main().then(() => {
  process.exit(0);
});
