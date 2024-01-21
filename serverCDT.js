import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// import sphereApi from "./routes/sphereApi.mjs";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import next from 'next';
import puppeteer from 'puppeteer';
import "./loadEnvironment.mjs";


const dev = process.env.NODE_ENV !== 'production';
// const dev = true;
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const routeBuild = path.join(__dirname, '.next');

const app = next({ dev, dir: path.resolve(__dirname) });
const handle = app.getRequestHandler();

app.prepare().then(() => {

  const server = express();
  server.use(cors());
  server.use(bodyParser.json());
  // server.use(sphereApi);C:\Proyects\dataCenter\clientCDT\src
  server.use('/_next/static', express.static(path.join(routeBuild, 'static')));
  server.use(express.static(path.join(__dirname, 'public')));
  server.use((err, _req, res, next) => {
    res.status(500).send("Uh oh! An unexpected error occured.", err)
  })


  server.get('/download-pdf', async (req, res) => {
    console.log("download-pdf");
    // return;
    try {
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage(); 
      await page.goto('http://localhost:3001/shiftChange');
 
      const dateNow = new Date();
      const dateFormat = dateNow.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' });

      const fileName = `informe${dateFormat.replace(/\//g, '-')}.pdf`;

      const outPath = path.join(__dirname, 'informesPDF', fileName);

      await page.pdf({ path: outPath, format: 'A4', printBackground: true });
 
      await browser.close();

      // Enviar el PDF como respuesta al cliente
      res.download(outPath, fileName, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error al descargar el archivo.');
        }
        // else {
        //   // Eliminar archivo  
        //   // fs.unlinkSync(outPath);
        // }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al generar el PDF.');
    }
  });










  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`Server is running on port ${PORT}`);
    console.log(`dev`, dev);
  });

});

