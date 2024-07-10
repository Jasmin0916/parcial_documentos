const express = require('express');
const axios = require('axios');
const amqp = require('amqplib');
const port = 8081;
const app = express();
app.use(express.json());

const DOCS_URI = 'http://localhost:8080';
const RABBITMQ_URI = 'amqp://cliente:cliente@localhost';
const QUEUE_NAME = 'document_queue';
let sentDocuments = [];
let channel;

async function connectRabbit() {
  try {
    const conn = await amqp.connect(RABBITMQ_URI);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
  } catch (error) {
    console.error('ERROR AL CONECTAR RABBITMQ:', error);
    throw error;
  }
}

const sendDocuments = async (documents) => {
  try {
    await connectRabbit();

    documents.forEach(doc => {
      channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(doc)), { persistent: true });
    });
    console.log('DOCUMENTOS ENVIADOS A LA COLA');

  } catch (error) {
    console.error('ERROR AL ENVIAR DOCUMENTOS:', error);
  }
};

const checkStatus = async () => {
  try {
    for (const doc of sentDocuments) {
      const response = await axios.get(`${DOCS_URI}/consultar_estado/${doc.id}`);
      console.log(`DOCUMENTO ${doc.id}: ${response.data.estado}`);
    }
  } catch (error) {
    console.error('ERROR AL CONSULTAR ESTADO:', error);
  }
};

setInterval(() => {
  const newDocuments = Array.from({ length: 50 }, (_, i) => ({ id: `doc_${Date.now()}_${i}` }));
  sentDocuments.push(...newDocuments);
  sendDocuments(newDocuments);
}, 120000);

setInterval(checkStatus, 120000);

app.listen(port, async () => {
  console.log(`SERVICIO CLIENTE CORRIENDO EN EL PUERTO ${port}`);
  await connectRabbit();
});
