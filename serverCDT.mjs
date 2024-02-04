import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import next from 'next';
import * as middelware from './middlewares.mjs';
import handshakeAPI from './apis/handshakeAPI.mjs';


// import cors from 'cors';
// import bodyParser from 'body-parser';
// import fileUpload from 'express-fileupload';
// import rateLimit from 'express-rate-limit';
import "./loadEnvironment.mjs"; 
// import "./middlewares.mjs";

const dev = process.env.NODE_ENV !== 'production';
// const dev = true;
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
// const routeBuild = path.join(__dirname, '.next');
console.log("__dirname", __dirname);

const app = next({ dev, dir: path.resolve(__dirname) });
const handle = app.getRequestHandler();

// const jsonParser = bodyParser.json({
//   limit: '100kb'
// });

// const urlencodedParser = bodyParser.urlencoded({
//   limit: '1024b',
//   extended: true
// }); 

// const connLimit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//   standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers. 
// });

// const fileLimiter = fileUpload({
//   limits: { fileSize: '10mb' },
//   abortOnLimit: true,
// });

// const corsOptions = cors({
//   origin: 'http://localhost:3000', //dev
//   credentials: true,
//   exposedHeaders: ['Content-Metadata', 'Content-Disposition'],
// })


app.prepare().then(() => {

  const server = express();

  server.use(middelware.corsOptions);
  server.use(middelware.connLimit);
  server.use(middelware.fileLimiter);  
  server.use(middelware.jsonParser);
  server.use(middelware.urlencodedParser);
  server.use(express.json());
  server.use('/apiHs', handshakeAPI);
  server.use("/public", express.static(path.join(__dirname, 'public')));
  // server.use('/_next/static', express.static(path.join(routeBuild, 'static')));
  server.use((err, _req, res, next) => {
    // res.status(500).send("Uh oh! An unexpected error occured.", err)
    console.error(err.stack);
    res.status(500).send(`ERROR PROVOCADO ${err}`);

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

