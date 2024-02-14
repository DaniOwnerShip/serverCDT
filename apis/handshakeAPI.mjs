import { Router } from 'express';
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import sanitizeFilename from 'sanitize-filename';
import { URL } from 'url';
import { reportValidation } from '../validations.mjs';
import { __dirname } from '../serverCDT.mjs';


const router = Router();


router.get('/testConn', async (req, res) => {

  console.log("req.query", req.query);
  console.log("req.ip", req.ip);
  const doc = req.query;

  const reserveDoc = {
    id: doc.docID,
    ip: req.ip,
    reservado: true
  };

  console.log("reserveDoc", reserveDoc.id);
  console.log("reservado", reserveDoc.reservado);
  console.log("ip", reserveDoc.ip);

  res.json({ mensaje: 'El documento ha sido reservado con éxito.' });









  // console.log("req.secure", req.secure);
  // console.log("req.ip", req.ip);
  // console.log("req.originalUrl", req.originalUrl);  
  // console.log("req.accepted", req.accepted);
  // console.log("req.socket", req.socket); 
  // console.log("req.app", req.app);
  // console.log("req.subdomains", req.subdomains);
  // console.log("req.query", req.baseUrl);
  // console.log("req.query", req.body);
  // console.log("req.query", req.closed);
  // console.log("req.query", req.complete);
  // console.log("req.query", req.cookies);
  // console.log("req.query", req.destroyed);
  // console.log("req.query", req.headers);
  // console.log("req.query", req.headersDistinct);
  // console.log("req.query", req.hostname);
  // console.log("req.query", req.httpVersion);
  // console.log("req.query", req.rawHeaders);
  // console.log("req.query", req.xhr);
  // console.log("req.query", req.readableHighWaterMark);
  // console.log("req.query", req.method);
  // console.log("req.query", req.path);
  // console.log("req.query", req.protocol);
  // console.log("req.query", req.ips);
  // console.log("req.query", req.readable);
  // console.log("req.query", req.readableLength);
  // console.log("req.query", req.res);
  // console.log("req.query", req.route);
  // console.log("req.query", req.signedCookies);
  // console.log("req.query", req.trailers);

}
);




router.get('/downloadjson', async (req, res) => {

  try {

    const { fileName } = req.query;
    const acceptfile = req.get('accept');
    const routepath = fileName === 'informe-last.json' ? 'informes/lastJSON' : 'informes/informesJSON';

    if (!fileName || !acceptfile.includes('application/json') || !fileName.includes('informe-') || fileName.length > 20) {
      res.status(400).json('Nombre de archivo erróneo');
      return;
    }

    const filePath = path.join(process.cwd(), routepath, fileName);

    if (!fs.existsSync(filePath)) {
      res.status(400).json('Archivo no encontrado');
      return;
    }

    const file = fs.readFileSync(filePath, 'utf-8');

    res.status(200).json(JSON.parse(file));

  }

  catch (e) {
    console.error(e.message);
    res.status(500).json(e.message);
  }

});







router.post('/saveJson', async (req, res) => {

  const data = req.body;
  const validation = reportValidation(data);

  if (typeof (validation) === 'object' && validation !== null) {
    return res.status(400).json(validation);
  }

  if (validation === null || validation !== 1) {
    return res.status(500).json(`Error durante la validación`);
  }

  try {

    const filename = data[0].handshake.fileID;
    const reportsPath = path.join(process.cwd(), 'informes/informesJSON', filename);
    const lastReportPath = path.join(process.cwd(), 'informes/lastJSON/lastReport.json');

    fs.writeFileSync(reportsPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.writeFileSync(lastReportPath, JSON.stringify(data, null, 2), 'utf-8');

    res.status(200).json(`Archivo guardado correctamente.\n\n ${filename}`);

  }

  catch (e) {
    console.error(e.message);
    res.sendStatus(500);
  }

});






router.get('/download-pdf', async (req, res) => {

  try {

    const dateNow = new Date();
    const dateFormat = dateNow.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' });
    const fileName = `informe${dateFormat.replace(/\//g, '-')}.pdf`;
    const filePath = path.join(process.cwd(), 'informes/informesPDF/', fileName);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/pages/handshake', { waitUntil: 'networkidle2' });
    await page.pdf({ path: filePath, format: 'a4', printBackground: true, scale: .65 });
    await browser.close();


    res.download(filePath, fileName, (err) => {
      if (err) {
        res.status(404).send(`Archivo ${fileName} no encontrado`);
      }
      else {
        fs.unlink(filePath, (err) => { if (err) { console.error(err); } });
      }
    });

  }

  catch (e) {
    res.status(500).send(`Error al generar el PDF.${e}`);
  }

});







const imgMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

router.post('/upload-img', (req, res) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.sendStatus(400);
  }

  const uploadedFile = req.files.image;

  if (!/^image/.test(uploadedFile.mimetype) || !imgMimes.includes(uploadedFile.mimetype)) {
    return res.status(400).json({ error: 'Tipo de archivo no permitido.' });
  }

  const safeFilename = sanitizeFilename(uploadedFile.name);
  const uniqueFilename = Date.now() + '_' + safeFilename;
  const uploadPath = path.join(process.cwd(), 'public/images', uniqueFilename);

  console.log("uploadPath", uploadPath);

  uploadedFile.mv(uploadPath, (err) => {

    if (err) {
      console.log("upload-img err", err.message);
      return res.sendStatus(500);
    }

    const imageUrl = `/public/images/${uniqueFilename}`;
    res.status(200).json({ imageUrl })

  });

});






const videoMimes = ['video/mp4', 'video/webm', 'video/ogg'];

router.post('/uploadvideo', (req, res) => {

  const video = req.files.video;

  if (!req.files || Object.keys(req.files).length === 0 || !/^video/.test(video.mimetype) || !videoMimes.includes(video.mimetype)) {
    return res.sendStatus(400);
  }

  const safeFilename = sanitizeFilename(video.name);
  const uniqueFilename = Date.now() + '_' + safeFilename;
  const uploadPath = path.join(process.cwd(), 'public/video', uniqueFilename);

  console.log("uploadPath", uniqueFilename);

  video.mv(uploadPath, (err) => {

    if (err) {
      console.log("upload-video err", err.message);
      return res.sendStatus(500);
    }

    const videoUrl = `/public/video/${uniqueFilename}`;
    res.status(200).json(videoUrl);

  });

});







router.get('/delete-file', async (req, res) => {

  const { urlFile } = req.query;
  console.log("urlFile", urlFile);

  if (!urlFile) {
    res.sendStatus(400);
    return;
  }

  try {

    const url = new URL(urlFile);
    const decodePath = decodeURIComponent(url.pathname);
    const filePath = path.join(__dirname, decodePath);

    fs.unlinkSync(filePath);

    res.status(200).json("archivo eliminado. url: " + urlFile)

  }

  catch (e) {
    console.error(e.message);
    res.status(500).json(e.message);
  }

});





export default router;




