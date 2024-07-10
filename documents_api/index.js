const express = require('express');
const amqp = require('amqplib');
const port = 8080;
const app = express();
app.use(express.json());

const RABBITMQ_URI = 'amqp://documents:documents@localhost';
const QUEUE_NAME = 'document_queue';

let documents = {};
let channel;

async function connectRabbit() {
  try {
    const conn = await amqp.connect(RABBITMQ_URI);
    channel = await conn.createChannel();
    await channel.assertExchange('document_exchange', 'direct', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.consume(QUEUE_NAME, processMessage, { noAck: false });
  } catch (error) {
    console.error('ERROR AL CONECTAR CON RABBITMQ:', error);
    throw error;
  }
}

function processMessage(msg) {
  if (msg !== null) {
    const document = JSON.parse(msg.content.toString());
    const docId = document.id;
    documents[docId] = 'EN PROCESO';

    setTimeout(() => {
      const newState = Math.random() > 0.5 ? 'ACEPTADO' : 'RECHAZADO';
      documents[docId] = newState;
      console.log(`DOCUMENTO ${docId} ACTUALIZADO A ${newState}`);

      channel.ack(msg);
    }, 60000);
  }
}

app.post('/recibir_documentos', async (req, res) => {
  const receivedDocuments = req.body.documents;
  try {
    await connectRabbit();

    receivedDocuments.forEach(doc => {
      channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(doc)), { persistent: true });
    });
    res.json({ mensaje: 'DOCUMENTOS RECIBIDOS Y EN PROCESO' });

  } catch (error) {
    console.error('ERROR AL RECIBIR DOCUMENTOS:', error);
    res.status(500).json({ mensaje: 'ERROR AL PROCESAR LA SOLICITUD' });
  }
});

app.get('/consultar_estado/:id', (req, res) => {
  const documentId = req.params.id;
  const state = documents[documentId];
  if (state) {
    res.json({ id: documentId, estado: state });
  } else {
    res.status(404).json({ mensaje: 'DOCUMENTO NO ENCONTRADO' });
  }
});

app.listen(port, async () => {
  console.log(`SERVICIO DOCUMENTS CORRIENDO EN EL PUERTO ${port}`);
  await connectRabbit();
});
