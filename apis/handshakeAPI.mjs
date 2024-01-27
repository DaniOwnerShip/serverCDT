import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import { saveFile, loadFile } from '../utils/fileIO.mjs';
import puppeteer from 'puppeteer';
import fs from 'fs';

import mime from 'mime-types';
import sanitizeFilename from 'sanitize-filename';



const router = Router();



router.get('/download-json', async (req, res) => {
  const { fileName } = req.query;

  console.log("req fileName", fileName);

  if (!fileName) return res.sendStatus(400).json({ error: 'Nombre de archivo no válido.' });

  try {

    let filePath;

    fileName === 'lastReport.json' ?
      (filePath = path.join(process.cwd(), 'informes/lastJSON', fileName)) :
      (filePath = path.join(process.cwd(), 'informes/informesJSON', fileName));

    const file = loadFile(filePath);

    file ? (res.status(200).json(JSON.parse(file))) :
      (res.status(404).json({ error: 'Archivo no encontrado.' }));


  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
    console.error('Sending file error:', error);
  }

});



// router.post('/upload-img', (req, res) => {
//   // Get the file that was set to our field named "image"
//   const { image } = req.files; 
//   // If no image submitted, exit
//   if (!image) return res.sendStatus(400); 
//   // If does not have image mime type prevent from uploading
//   if (/^image/.test(image.mimetype)) return res.sendStatus(400); 
//   // Move the uploaded image to our upload folder 
//   image.mv(path.join(process.cwd() , '/public/images/' , image.name)); 
//   // All good
//   res.sendStatus(200);
// });
const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

router.post('/upload-img', (req, res) => {//csrfProtection

  console.log("upload-img" );

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  const uploadedFile = req.files.image;
  // Validación del tipo de archivo usando expresión regular
  if (!/^image/.test(uploadedFile.mimetype) || !allowedMimeTypes.includes(uploadedFile.mimetype)) {
    return res.status(400).json({ error: 'Tipo de archivo no permitido.' });
  }
  // Renombrar y desinfectar el nombre del archivo
  const safeFilename = sanitizeFilename(uploadedFile.name);
  const uniqueFilename = Date.now() + '_' + safeFilename;
  const uploadPath = path.join(process.cwd(), 'public/images', uniqueFilename);
  
  console.log("uploadPath" , uploadPath );

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const imageUrl = `/public/images/${uniqueFilename}`;
    res.json({ imageUrl });
  });
});





 

router.post('/saveReport', async (req, res) => { 
  try { 
    const data = req.body;
    const filename = data[0].handshake.fileID;
    console.log('saveReport:', filename);
 // Validar 
    const reportsPath = path.join(process.cwd(), 'informes/informesJSON', filename);
    const lastReportPath = path.join(process.cwd(), 'informes/lastJSON/lastReport.json');

    saveFile(reportsPath, JSON.stringify(data, null, 2));
    saveFile(lastReportPath, JSON.stringify(data, null, 2));
    // res.status(200).json({ mensaje: 'Solicitud POST recibida con éxito' });
    res.status(200).json({ message: `Gracias por registrar el informe.\n\n Nombre del archivo:\n ${filename}` });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});






// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// router.post('/saveReport', upload.single('archivo'), async (req, res) => {
//   console.log('saveReport:' );

//   try {

//     const fileData = req.file;
//     const fileName = fileData.originalname;
//   console.log('saveReport:', fileName);
//     const jsonString = fileData.buffer.toString('utf-8');
//     const reportsPath = path.join(process.cwd(), 'informes/informesJSON', fileName);
//     const lastReportPath = path.join(process.cwd(), 'informes/lastJSON', 'lastReport.json');

//     saveFile(reportsPath, jsonString);
//     saveFile(lastReportPath, jsonString);

//     res.json({ message: `Gracias por registrar el informe.\n\n Nombre del archivo:\n ${fileName}` });

//   } catch (error) {
//     console.error('Error at save files:', error);
//     res.status(400).json({ message: 'Error at save files' });
//   }

// });




router.get('/download-pdf', async (req, res) => {
  console.log("download-pdf");

  try {
    const dateNow = new Date();
    const dateFormat = dateNow.toLocaleDateString('es-ES', { year: '2-digit', month: '2-digit', day: '2-digit' });
    const fileName = `informe${dateFormat.replace(/\//g, '-')}.pdf`;
    const filePath = path.join(process.cwd(), 'informes/informesPDF/', fileName);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

    await page.goto('http://localhost:3000/pages/handshake', { waitUntil: 'networkidle2' });

    await page.pdf({ path: filePath, format: 'A4', printBackground: true });
    await browser.close();


    res.download(filePath, fileName, (err) => {
      if (err) {
        res.status(500).send('Error al descargar el archivo');
      } else { //borrar pdf.
        fs.unlink(filePath, (err) => { if (err) { console.error(err); throw err; } });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(400).send('Error al generar el PDF.');
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




