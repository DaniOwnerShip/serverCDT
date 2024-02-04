import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import { saveFile, loadFile, deleteFile } from '../utils/fileIO.mjs';
import puppeteer from 'puppeteer';
import fs from 'fs';

import mime from 'mime-types';
import sanitizeFilename from 'sanitize-filename';
import { URL } from 'url';

import { reportValidation } from '../validations.mjs';
import { __dirname } from '../serverCDT.mjs';


const router = Router();



router.get('/downloadjson', async (req, res) => {

  const { fileName } = req.query;
  const acceptfile = req.get('accept');

  if (!fileName || !acceptfile.includes('application/json')) {
    res.sendStatus(400);
    return;
  }

  const routepath = fileName === 'lastReport.json' ? 'informes/lastJSON' : 'informes/informesJSON';

  try {

    const filePath = path.join(process.cwd(), routepath, fileName);

    const file = loadFile(filePath);

    if (!file) {
      res.sendStatus(404);
      return;
    }

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

    saveFile(reportsPath, JSON.stringify(data, null, 2));
    saveFile(lastReportPath, JSON.stringify(data, null, 2));

    res.status(200).json(`Archivo guardado correctamente.\n\n archivo:\n ${filename}`);

  }

  catch (e) {
    console.error(e.message);
    res.sendStatus(500);
  }

});





const imgMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

router.post('/upload-img', (req, res) => {

  const uploadedImage = req.files.image;

  console.log("upload-img", req.accepted);
  console.log("upload-img", uploadedImage.mimetype);
  console.log("upload-img", req.files.image.size);
  // return res.status(100).json("probando image uploader SERVER");

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
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
      return res.status(500).json("ERROR DESDE EL SERVIDOR");
    }

    const imageUrl = `/public/images/${uniqueFilename}`;
    res.status(200).json({ imageUrl });

  });

});








router.get('/download-pdf', async (req, res) => {
  console.log("download-pdf", req.accepted);
  console.log("download-pdf", req.body);
  console.log("download-pdf", req.query);

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
      return res.status(500).json("ERROR DESDE EL SERVIDOR");
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

    deleteFile(filePath);

    res.status(200).json("archivo eliminado. url: " + urlFile)

  }

  catch (e) {
    console.error(e.message);
    res.status(500).json(e.message);
  }

});







// router.get('/download-pdf', async (req, res) => {
//   console.log("download-pdf"); 
//     try {
//       const browser = await puppeteer.launch({ headless: "new" });
//       const page = await browser.newPage();
//       await page.goto('http://localhost:3000/pages/handshake');
//       // await page.waitForNavigation({ waitUntil: 'load' });
//       const dateNow = new Date();
//       const dateFormat = dateNow.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' }); 
//       const fileName = `informe${dateFormat.replace(/\//g, '-')}.pdf`; 
//       const outPath = path.join(process.cwd(), 'informes/informesPDF', fileName);

//       await page.pdf({ path: outPath, format: 'A4', printBackground: true });

//       await browser.close();

//       res.download(outPath, fileName, (err) => {
//         if (err) {
//           console.error(err);
//           res.status(400).send('Error al descargar el archivo.');
//         }
//         // else {
//         //   // Eliminar archivo  
//         //   // fs.unlinkSync(outPath);
//         // }
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(400).send('Error al generar el PDF.');
//     }


// });




export default router;




