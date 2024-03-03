import { Router } from 'express';
import { URL } from 'url';
import { __dirname } from '../serverCDT.mjs';
import path from 'path';
// import puppeteer from 'puppeteer';
import fs from 'fs';
import sanitizeFilename from 'sanitize-filename';
import { reportValidation } from '../validations.mjs';


const router = Router();

 


router.get('/downloadjson', async (req, res) => {

  try {

    const { fileName } = req.query;
    const fns = fileName.split('-');
    const place = fns[1].replace('.json', '');
    const acceptfile = req.get('accept');
    const routepath = `informes/informesJSON/${place}`;

    if (!fileName || !acceptfile.includes('application/json') || !fileName.includes('informe') || fileName.length > 25) {
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

  const report = req.body;
  // console.log("saveJson req", req.headers.origin);

  const validation = reportValidation(report);
  if (typeof (validation) === 'object' && validation !== null) {
    return res.status(400).json(validation);
  } else if (validation === null || validation !== 1) {
    return res.status(500).json(`Error durante la validación`);
  }

  try {

    const fileName = report[0].handshake.fileID;
    const place = fileName.split('-')[1];

    const routepath = `informes/informesJSON/${place}`; 

    const reportsPath = path.join(process.cwd(), routepath, fileName);
    const lastReportPath = path.join(process.cwd(), routepath, `/informe-${place}-last.json`);

    fs.writeFileSync(reportsPath, JSON.stringify(report, null, 2), 'utf-8');
    fs.writeFileSync(lastReportPath, JSON.stringify(report, null, 2), 'utf-8');

    res.status(200).json(`Archivo guardado correctamente.\n\n ${fileName}`);
    console.log("saveJson", `Archivo guardado correctamente.\n\n ${fileName}`);

  } 
  
  catch (e) {
    console.error(e.message);
    res.sendStatus(500);
  }

});





// PUPPETTER WAS REPLACE BY CLIENT SIDE SCREENSHOT TO PDF 

// router.get('/download-pdf', async (req, res) => {

//   const { fileId } = req.query;
//   console.log("download-pdf", fileId); 
  
//   try {

//     const dateNow = new Date();
//     const dateFormat = dateNow.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' });
//     const fileName = `informe-${dateFormat.replace(/\//g, '-')}.pdf`;
//     const filePath = path.join(process.cwd(), 'informes/informesPDF/', fileName);

//     const browser = await puppeteer.launch({ headless: "new" });
//     const page = await browser.newPage();

//     await page.goto('http://localhost:3000/pages/shiftChange/mainReport', { waitUntil: 'networkidle2' });
//     await page.pdf({ path: filePath, format: 'a4', printBackground: true, scale: .65 });
//     await browser.close();


//     res.download(filePath, fileName, (err) => {
//       if (err) {
//         res.status(404).send(`Archivo ${fileName} no encontrado`);
//       }
//       else {
//         // fs.unlink(filePath, (err) => { if (err) { console.error(err); } });
//       }
//     });

//   }

//   catch (e) {
//     res.status(500).send(`Error al generar el PDF.${e}`);
//   }

// });





const imageMimes = [
  'image/jpeg',  // .jpg, .jpeg
  'image/png',   // .png
  'image/gif',   // .gif
  'image/bmp',   // .bmp
  'image/webp',  // .webp
  'image/svg+xml' // .svg
];

router.post('/upload-img', (req, res) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.sendStatus(400);
  }

  const uploadedFile = req.files.image;

  if (!/^image/.test(uploadedFile.mimetype) || !imageMimes.includes(uploadedFile.mimetype)) {
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






const videoMimes = [
  'video/quicktime',   // .mov
  'video/avi',         // .avi
  'video/x-ms-wmv',    // .wmv
  'video/x-flv',       // .flv
  'video/mpeg',        // .mpeg, .mpg
  'video/x-matroska',  // .mkv
  'video/x-msvideo',   // .avi
  'video/x-ms-asf'     // .asf
];


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




