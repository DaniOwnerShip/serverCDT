import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import next from 'next';
import * as middelware from './middlewares.mjs';
import handshakeAPI from './apis/handshakeAPI.mjs';
import "./loadEnvironment.mjs";

import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
// import { on, EventEmitter } from 'node:events';

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
console.log("__dirname", __dirname);

const app = next({ dev, dir: path.resolve(__dirname) });
const handle = app.getRequestHandler();

const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.255:3000", "http://192.168.1.2:3000", "http://192.168.1.1:3000", "http://192.168.1.101:3000", "http://192.168.1.100:3000", "http://192.168.56.1:3000", "http://192.168.1.103:3000", "http://127.0.0.1:3001"],
  credentials: true
};

// origin: ['*'],
//http://192.168.56.1:3000 origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.100:3000", "http://127.0.0.1:3000"],

app.prepare().then(() => {

  const serverExpress = express();


  //  serverExpress.use(middelware.corsOptions);
  //  serverExpress.use(cors()); EventEmitter } import { on, EventEmitter } from 'node:events';
  // serverExpress.use(cors({
  //   origin: 'http://localhost:3000',
  //   credentials: true, // Si necesitas enviar cookies de origen cruzado
  // }));

  //    serverExpress.use((req, res, next) => {
  //   res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir solicitudes desde cualquier origen
  //   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'); // Métodos permitidos
  //   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Cabeceras permitidas
  //   res.setHeader('Access-Control-Allow-Credentials', true); // Permitir el envío de credenciales (cookies, tokens, etc.)
  //   next();
  // });


  //  serverExpress.use(cors('*')); 
  //  serverExpress.use(cors({ origin: 'http://192.168.1.100:3000' }));

  //serverExpress.use(cors( ));

  serverExpress.use(cors(corsOptions));
  serverExpress.use(middelware.connLimit);
  serverExpress.use(middelware.fileLimiter);
  serverExpress.use(middelware.jsonParser);
  serverExpress.use(middelware.urlencodedParser);
  serverExpress.use(express.json());
  serverExpress.use('/apiHs', handshakeAPI);
  serverExpress.use("/public", express.static(path.join(__dirname, 'public')));

  serverExpress.use((err, _req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Server Error ${err}`);
  })

  const httpServer = http.createServer(serverExpress);



  const io = new Server(httpServer, {
    cors: corsOptions
  });


  // Same objects used in the client. I
  const IdocStatus = {
    required: "required",
    reserved: "reserved",
    released: "released"
  };
  let IdocReserve = { reqStatus: IdocStatus.released, docId: null, userIP: '' };
  let usersOn = [];




  io.on("connection", (socket) => {

    const ipConn = socket.handshake.address;

    console.log('usuario conectado', socket.id, ' IP ', ipConn);

    if (!usersOn.includes(ipConn)) {
      usersOn.push(ipConn);
    }


    io.emit('users', usersOn);


    socket.on('comment', (comment) => {
      io.emit('comment', ipConn + ' -> ' + comment);
    });


    


    socket.on('reserveDoc', (docReserve) => {

      console.log('docReserve: ', docReserve);
      console.log('Reserva docId: ', IdocReserve.docId);
      console.log('Reserva docId: ', docReserve.docId);
      console.log('Reserva reqStatus: ', docReserve.reqStatus);
      if (docReserve.reqStatus === IdocStatus.required && IdocReserve.docId === docReserve.docId) {

        socket.emit('reserveStatus', {
          IdocReserve: IdocReserve,
          message: 'Reserva denegada. El ' + IdocReserve.docId + ' está reservado por: ' + IdocReserve.userIP
        });

        console.log('Reserva denegada. El ' + IdocReserve.docId + ' está reservado por: ' + IdocReserve.userIP);
      }
      else {

        IdocReserve = { reqStatus: IdocStatus.reserved, docId: docReserve.docId, userIP: ipConn };

        io.emit('reserveStatus', {
          IdocReserve: IdocReserve,
          message: IdocReserve.docId + ' Reservado por: ' + IdocReserve.userIP
          // message: 'Reserva apectada: ' + IdocReserve.docId + ' para: ' + IdocReserve.userIP
        });

        console.log('Reserva apectada: ' + IdocReserve.docId + ' Por: ' + IdocReserve.userIP);
      }

    });







    socket.on('releaseDoc', (docReserve) => {

      console.log('releaseDoc', docReserve);

      if (docReserve.reqStatus === IdocStatus.released && IdocReserve.docId === docReserve.docId && IdocReserve.userIP === ipConn) {

        IdocReserve = { reqStatus: IdocStatus.released, docId: docReserve.docId, userIP: ipConn };

        io.emit('broadcast__DocStatus', {
          IdocReserve: IdocReserve,
          // message: 'Reserva liberada: ' + IdocReserve.docId + ' Por: ' + IdocReserve.userIP
          message: IdocReserve.docId + ' Liberado por: ' + IdocReserve.userIP
        });

        console.log('Reserva liberada: ' + IdocReserve.docId + ' Por: ' + IdocReserve.userIP);
        IdocReserve = { reqStatus: IdocStatus.released, docId: null, userIP: '' };

      }

    });





    socket.on("disconnect", () => {

      console.log('usuario desconectado', ipConn);  
      const index = usersOn.indexOf(ipConn);

      if (index !== -1) {
        usersOn.splice(index, 1);
        io.emit('users', usersOn);
        console.log('usuarios conectados', usersOn?.length);
      }

    });




  });










  serverExpress.all('*', (req, res) => {
    return handle(req, res);
  });



  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Next.js escuchando en el puerto ${PORT}`);
  });






  // console.log('Cliente desconectado', socket.id);
  // console.log('IdocReserve', IdocReserve);
  //    io.emit('broadcast__DocReserved', 'El documento ha sido reservado' + IdocReserve.docId + IdocReserve.userIP);
  // console.log('Reserve Required:', message);
  // io.emit("broadcast__DocReserved", message);
  // socket.on('isReserved', (message) => {
  //   console.log('isReserved:', message);
  // });

  // socket.broadcast.emit("broadcast__DocReserved", "Hola a todos excepto al remitente!");
  // Manejar el evento de desconexión para este socket específico


  // io.on("disconnect", (socket) => {
  //   console.log('Cliente desconectado', socket.id); 
  // });





  //   // mensajes desde el servidor al cliente
  //   socket.emit("mensaje", "Hola desde el servidor!");
  //   socket.send("mensaje", "Hola desde el servidor!");

  //   // escuchar mensajes enviados por el cliente 
  //   socket.on("mensajeDelCliente", (data) => {
  //     console.log("Mensaje del cliente:", data);
  //   });

  // // un mensaje a todos los clientes 
  //   io.emit("mensaje", "Hola a todos!");

  //   // mensajes a todos los clientes excepto al remitente:
  //   socket.broadcast.emit("mensaje", "Hola a todos excepto al remitente!");

  // // Unirse a una sala
  // socket.join("sala1");

  // // Enviar mensaje a todos los clientes en una sala específica
  // io.to("sala1").emit("mensaje", "¡Hola a todos en la sala 1!");

  // // Crear un espacio de nombres
  // const nsp = io.of("/espacio-de-nombre");

  // // Manejar eventos en el espacio de nombres
  // nsp.on("connection", (socket) => {
  //   console.log('Cliente conectado al espacio de nombre', socket.id); 
  // });





  // httpServer.listen(PORT, '0.0.0.0', (err) => {
  //   if (err) throw err;
  //   console.log(`Server is running on port ${PORT}`);
  //   console.log(`dev`, dev);
  // }); 



});











// // Crear un espacio de nombres llamado "/chat"
// const chatNamespace = io.of("/chat");

// // Manejar eventos en el espacio de nombres "/chat"
// chatNamespace.on("connection", (socket) => {
//   console.log('Cliente conectado al espacio de nombre "/chat"', socket.id);

//   // Escuchar mensajes del cliente en el espacio de nombres "/chat"
//   socket.on("mensajeDeChat", (mensaje) => {
//     console.log('Mensaje recibido en el espacio de nombre "/chat":', mensaje);

//     // Reenviar el mensaje a todos los clientes en el espacio de nombres "/chat"
//     chatNamespace.emit("mensajeDeChat", mensaje);
//   });
// });
