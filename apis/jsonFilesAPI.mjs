import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { reportValidation } from '../validations.mjs';

import crypto from 'crypto';

const routerJson = Router();


routerJson.get('/downloadjson', async (req, res) => {

  try {

    const { fileName } = req.query; 
    const spot = fileName.split('_')[1]; 
    const spotN = spot.split('-')[1]; 
    const holderDataDir = 'holderData' + spotN; 
    const holderDataPath = `informes/informesJSON/${holderDataDir}`;

    const routepath = `informes/informesJSON/${spot}`;

    console.log('spot', spot);
    console.log('routepath', routepath);


    const acceptfile = req.get('accept');
    //rev
    if (!fileName || !acceptfile.includes('application/json') || !fileName.includes('informe') || fileName.length > 57) {
      res.status(400).json('Nombre de archivo erróneo');
      return;
    }


    const filePath = path.join(process.cwd(), routepath, fileName);

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      res.set('X-File-Type', 'actual');
      res.status(200).json(JSON.parse(fileContent));
    } 
    else { 
      const templatePath = path.join(process.cwd(), holderDataPath, `/template.json`); 
      const fileContent = fs.readFileSync(templatePath, 'utf8');
      res.set('X-File-Type', 'Plantilla hidratada');
      res.status(200).json(JSON.parse(fileContent));
    }
    console.log('download file', fileName);


  }
  catch (e) {
    console.error(e.message);
    res.status(500).json(e.message);
  }

});




routerJson.post('/saveJson', async (req, res) => {

  console.log("saveJson");
  const report = req.body;

  const validation = reportValidation(report);
  if (typeof (validation) === 'object' && validation !== null) {
    const msg = `Error durante la validación: ${validation[0].message}`
    return res.status(400).json(msg);
  } else if (validation === null || validation !== 1) {
    return res.status(500).json(`Error desconocido durante la validación`);
  }

  const _date = new Date().toLocaleString();
  report[0].metaData.lastEdit = _date;

  if (report[0].metaData.isComplete) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(report));
    const checksum = hash.digest('hex');
    report[0].metaData.checksum = checksum;
  }


  try {

    const fileName = report[0].metaData.fileID;
    const spot = fileName.split('_')[1];
    const spotN = spot.split('-')[1];

    const holderDataDir = 'holderData' + spotN;
    const holderDataPath = `informes/informesJSON/${holderDataDir}`;

    const routepath = `informes/informesJSON/${spot}`;

    // const templatePath = path.join(process.cwd(), routepath, `/informe_${spot}_template.json`);
    const templatePath = path.join(process.cwd(), holderDataPath, `/template.json`);
    const templateFile = fs.readFileSync(templatePath, 'utf-8');
    const templateObj = JSON.parse(templateFile); //templateObj[2].areas =
    templateObj[0].metaData.lastEdit = _date;

    const templateAreas = JSON.parse(JSON.stringify(report[2].areas));

    templateAreas.forEach(area => {
      area.urlImages = [];
      area.urlVideos = [];
      area.urlAudios = [];
    });

    templateObj[2].areas = templateAreas;  

    fs.writeFileSync(templatePath, JSON.stringify(templateObj, null, 2), 'utf-8');

    const reportPath = path.join(process.cwd(), routepath, fileName);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    res.status(200).json(`Archivo guardado: ${fileName}`);
    console.log('saveJson', fileName);
  }

  catch (e) {
    console.error(e.message);
    res.sendStatus(500);
  }

});



export default routerJson;

