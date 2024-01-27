import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser'; 
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import next from 'next'; 
import handshakeAPI from './apis/handshakeAPI.mjs';
import fileUpload from 'express-fileupload';
import "./loadEnvironment.mjs"; 



const dev = process.env.NODE_ENV !== 'production';
// const dev = true;
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// const routeBuild = path.join(__dirname, '.next');
console.log("__dirname", __dirname);

const app = next({ dev, dir: path.resolve(__dirname) });
const handle = app.getRequestHandler();

const jsonParser = bodyParser.json({ limit: '10mb' });  
const urlencodedParser = bodyParser.urlencoded({ limit: '10mb', extended: true }); 


app.prepare().then(() => {

  const server = express();
  // server.use(cors());
  server.use(cors({
    origin: 'http://localhost:3000', //dev
    credentials: true,
    exposedHeaders: ['Content-Metadata', 'Content-Disposition'],
  }));
  // server.use(fileUpload());
  server.use(
    fileUpload({
      limits: {
        fileSize: 10000000,
      },
      abortOnLimit: true,
    })
  );


  server.use(jsonParser);
  server.use(urlencodedParser);
  server.use(express.json());
  server.use("/public", express.static(path.join(__dirname, 'public')));
  server.use('/apiHs', handshakeAPI);
  // server.use('/_next/static', express.static(path.join(routeBuild, 'static')));
  server.use((err, _req, res, next) => {
    // res.status(500).send("Uh oh! An unexpected error occured.", err)
    console.error(err.stack);
    res.status(500).send(err);

  })

  server.all('*', (req, res) => { 
    return handle(req, res);
  });

  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`Server is running on port ${PORT}`);
    console.log(`dev`, dev);
  });

});

