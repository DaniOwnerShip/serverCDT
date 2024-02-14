
import cors from 'cors';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';


export const jsonParser = bodyParser.json({
  limit: '100kb'
});

export const urlencodedParser = bodyParser.urlencoded({
  limit: '1024b',
  extended: true
});

export const connLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers. 
});

export const fileLimiter = fileUpload({
  limits: { fileSize: 50 * (1024 ** 2) },      // 50 megas
  // limits: { fileSize: 10 },
  abortOnLimit: true,
});

// export const corsOptions = cors({
//   origin: 'http://localhost:3000', //dev
//   credentials: true,
//   exposedHeaders: ['Content-Metadata', 'Content-Disposition'],
// })
export const corsOptions = cors({
  origin: ["http://localhost:3000"],
  credentials: true
})
// const corsOptions = {
//   origin: ["http://localhost:3000"],
//   credentials: true
// };


// const corsOptions = {
//   origin: ["http://localhost:3000"],
//   credentials: true
// };


// export const corsOptions = {
//   origin: 'http://localhost:3000', // Permitir solicitudes solo desde localhost:3000
//   credentials: true, // Permitir el envío de cookies de origen cruzado
//   exposedHeaders: ['Content-Metadata', 'Content-Disposition'], // Exponer ciertos encabezados personalizados
// };