import { Router } from 'express';
import { URL } from 'url';
import { __dirname } from '../serverCDT.mjs';
import path from 'path';
import fs from 'fs';
import sanitize from 'sanitize-filename';

const imageMimes = [
  'image/jpeg',  // .jpg, .jpeg
  'image/png',   // .png
  'image/gif',   // .gif
  'image/bmp',   // .bmp
  'image/webp',  // .webp
  'image/svg+xml' // .svg
];


const audioMimes = [
  'audio/mpeg',        // .mp3
  'audio/wav',         // .wav
  'audio/x-ms-wma',    // .wma
  'audio/vnd.rn-realaudio', // .ra, .ram
  'audio/ogg',         // .ogg
  'audio/aac',         // .aac
  'audio/flac',        // .flac
  'audio/x-matroska',  // .mka
  'audio/x-aiff',      // .aif, .aiff
  'audio/midi',        // .mid, .midi
  'audio/x-ms-asf'     // .asf
];


const videoMimes = [
  'video/mp4',         // .mp4
  'video/avi',         // .avi
  'video/mpeg',        // .mpeg, .mpg
  'video/quicktime',   // .mov
  'video/x-ms-wmv',    // .wmv
  'video/x-flv',       // .flv
  'video/x-matroska',  // .mkv
  'video/x-msvideo',   // .avi
  'video/x-ms-asf'     // .asf
];


const routerMultimedia = Router();


//rev / refact
routerMultimedia.post('/mediaupload', (req, res) => {

  const mediaFile = req.files.mediaFile;
  const mediaType = req.body.mediaType;
  const docFileName = req.body.docFileName;
  const areaIndex = req.body.areaIndex;

  const mediaName = sanitize(mediaFile.name);
  const mediaId = Date.now() + '_' + mediaName;
  const spot = docFileName.split('_')[1];
  console.log("mediaName", spot);

  const _path = `informes/informesJSON/${spot}`

  const pathRoot = process.cwd();
  const pathFile = path.join(pathRoot, _path, docFileName);
  console.log("pathFilepathFilepathFile", pathFile); 

  try {

    const doc = fs.readFileSync(pathFile, 'utf-8');
    const docObj = JSON.parse(doc);

    let mediaDir;
    let mediaDocURLsStack;

    switch (mediaType) {

      case "image":
        if (!/^image/.test(mediaFile.mimetype) || !imageMimes.includes(mediaFile.mimetype)) {
          return res.sendStatus(400);
        }
        mediaDir = "image"
        mediaDocURLsStack = docObj[2].areas[areaIndex].urlImages;
        break;

      case "video":
        if (!/^video/.test(mediaFile.mimetype) || !videoMimes.includes(mediaFile.mimetype)) {
          return res.sendStatus(400);
        }
        mediaDir = "video"
        mediaDocURLsStack = docObj[2].areas[areaIndex].urlVideos;
        break;

      case "audio":
        if (!/^audio/.test(mediaFile.mimetype) || !audioMimes.includes(mediaFile.mimetype)) {
          return res.sendStatus(400);
        }
        mediaDir = "audio"
        mediaDocURLsStack = docObj[2].areas[areaIndex].urlAudios;
        break;

      default:
        return res.sendStatus(400);
    }


    const pathMediaFile = path.join(pathRoot, 'public', mediaDir, mediaId);
    mediaFile.mv(pathMediaFile);

    const mediaURL = `http://localhost:3001/public/${mediaDir}/${mediaId}`;
    mediaDocURLsStack.push(mediaURL);

    fs.writeFileSync(pathFile, JSON.stringify(docObj, null, 2), 'utf-8'); 

    res.status(200).json({ mediaURL: mediaURL });

    console.log('nuevo archivo multimedia', docFileName);

  }
  catch (e) {
    console.log("mediaupload err", e.message);
    return res.sendStatus(500);
  }

});




routerMultimedia.get('/mediadelete', async (req, res) => {

  const docFileName = req.query.docFileName;
  const areaIndex = req.query.areaIndex;
  const mediaType = req.query.mediaType;
  const mediaURL = req.query.mediaURL;

  const spot = docFileName.split('_')[1];

  const _path = `informes/informesJSON/${spot}`
  const pathRoot = process.cwd();
  const pathFile = path.join(pathRoot, _path, docFileName); 

  try {
 
    const doc = fs.readFileSync(pathFile, 'utf-8');
    const docObj = JSON.parse(doc);

    let mediaDir;
    let mediaDocURLsStack;

    switch (mediaType) {

      case "image":
        mediaDir = "image"
        mediaDocURLsStack = docObj[2].areas[areaIndex].urlImages;
        break;

      case "video": 
        mediaDir = "video"
        mediaDocURLsStack = docObj[2].areas[areaIndex].urlVideos;
        break;

      case "audio":
        mediaDir = "audio"
        mediaDocURLsStack = docObj[2].areas[areaIndex].urlAudios;
        break;

      default:
        return res.sendStatus(400);
    }

    const stackIndex = mediaDocURLsStack.findIndex((u) => u === mediaURL);
    if (stackIndex === -1) {
      return res.sendStatus(400);
    }

    mediaDocURLsStack.splice(stackIndex, 1);
    fs.writeFileSync(pathFile, JSON.stringify(docObj, null, 2), 'utf-8'); 

    const url = new URL(mediaURL);
    const decodePath = decodeURIComponent(url.pathname);
    const filePath = path.join(__dirname, decodePath);
 
    fs.unlinkSync(filePath);

    res.status(200).json(`${mediaType} eliminado de ${docFileName}`)

    console.log(`${mediaType} eliminado de ${docFileName}`);

  }

  catch (e) {
    console.error(e.message);
    res.status(500).json(e.message);
  }

});


export default routerMultimedia;






// routerMultimedia.post('/image', (req, res) => {
//   console.log('img');

//   const image = req.files.image;
//   const fileName = req.body.fileName;
//   const areaIndex = req.body.areaIndex;

//   if (!image || !areaIndex || !fileName || !/^image/.test(image.mimetype) || !imageMimes.includes(image.mimetype)) {
//     return res.sendStatus(400);
//   }

//   try {
//     const imageName = sanitize(image.name);
//     const imageId = Date.now() + '_' + imageName;
//     const urlImage = `http://localhost:3001/public/image/${imageId}`;
//     const pathRoot = process.cwd();
//     const pathImage = path.join(pathRoot, 'public/image/', imageId);
//     const pathFile = path.join(pathRoot, 'informes/informesJSON/main1/', fileName);
//     const pathFileLast = path.join(pathRoot, 'informes/informesJSON/main1/informe-main1-last.json');

//     image.mv(pathImage);

//     const doc = fs.readFileSync(pathFile, 'utf-8');
//     const docObj = JSON.parse(doc);
//     docObj[1].areas[areaIndex].urlImages.push(urlImage);

//     fs.writeFileSync(pathFile, JSON.stringify(docObj, null, 2), 'utf-8');
//     fs.writeFileSync(pathFileLast, JSON.stringify(docObj, null, 2), 'utf-8');
//     res.status(200).json({ urlImage: urlImage });
//     console.log('nuevo image', fileName);
//   }
//   catch (e) {
//     console.log("upload-image err", e.message);
//     return res.sendStatus(500);
//   }


// });


// routerMultimedia.get('/delete-filessss', async (req, res) => {

//   const { urlFile } = req.query;
//   console.log("urlFile", urlFile);

//   if (!urlFile) {
//     res.sendStatus(400);
//     return;
//   }

//   try {

//     const url = new URL(urlFile);
//     const decodePath = decodeURIComponent(url.pathname);
//     const filePath = path.join(__dirname, decodePath);

//     fs.unlinkSync(filePath);

//     res.status(200).json("archivo eliminado. url: " + urlFile)

//   }

//   catch (e) {
//     console.error(e.message);
//     res.status(500).json(e.message);
//   }

// });


// export default routerMultimedia;







// PUPPETTER se ha reemplazado por un screenshot en el cliente

// routerMultimedia.get('/download-pdf', async (req, res) => {

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


