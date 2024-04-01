import express from 'express';
import next from 'next';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as middelware from './middlewares.mjs';
import jsonFilesAPI from './apis/jsonFilesAPI.mjs';
import multimediaAPI from './apis/multimediaAPI.mjs';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import "./loadEnvironment.mjs";
import initSocket from './apis/socket.js';


const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
console.log("__dirname", __dirname);

const app = next({ dev, dir: path.resolve(__dirname) });
const handle = app.getRequestHandler();

// REV
const corsOptions = {
  origin: ["http://localhost:3001","http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.255:3000", "http://192.168.1.2:3000", "http://192.168.1.1:3000", "http://192.168.1.101:3000", "http://192.168.1.100:3000", "http://192.168.56.1:3000", "http://192.168.1.103:3000", "http://127.0.0.1:3001"],
  credentials: true
};


app.prepare().then(() => {

  const serverExpress = express(); 

  serverExpress.use(function (req, res, next) {  
    res.setHeader('Access-Control-Expose-Headers', 'ETag, X-File-Type');    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); 
    next();
  });  

  serverExpress.use(cors(corsOptions));
  serverExpress.use(middelware.connLimit);
  serverExpress.use(middelware.fileLimiter);
  serverExpress.use(middelware.jsonParser);
  serverExpress.use(middelware.urlencodedParser);
  serverExpress.use(express.json());
  serverExpress.use('/jsonAPI', jsonFilesAPI);
  serverExpress.use('/multimediaAPI', multimediaAPI);
  serverExpress.use("/public", express.static(path.join(__dirname, 'public')));

  serverExpress.use((err, _req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Server Error ${err}`);
    next();
  })


  const httpServer = http.createServer(serverExpress);  

  const serverSocket = new Server(httpServer, {
    cors: corsOptions
  });

  initSocket(serverSocket);  

  serverExpress.all('*', (req, res) => {
    return handle(req, res);
  }); 


  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor en el puerto ${PORT}`);
  });

 


});





 