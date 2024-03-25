import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { reportValidation } from '../validations.mjs';

import crypto from 'crypto';

const routerJson = Router();


routerJson.get('/downloadjson', async (req, res) => {

  try {

    const { fileName } = req.query;
    const fns = fileName.split('-');
    const place = fns[1].replace('.json', '');
    const acceptfile = req.get('accept');
    const routepath = `informes/informesJSON/${place}`;

    if (!fileName || !acceptfile.includes('application/json') || !fileName.includes('informe') || fileName.length > 27) {
      res.status(400).json('Nombre de archivo erróneo');
      return;
    }

    const pathFile = path.join(process.cwd(), routepath, fileName); 
    const doc = fs.readFileSync(pathFile, 'utf-8');

    res.status(200).json(JSON.parse(doc));

    console.log('downloadjson', fileName);

  }
  catch (e) {
    console.error(e.message);
    res.status(500).json(e.message);
  }

});




routerJson.post('/saveJson', async (req, res) => {

  const report = req.body; 

  const validation = reportValidation(report);
  if (typeof (validation) === 'object' && validation !== null) {
    const msg = `Error durante la validación: ${validation[0].message}`
    console.log(msg);
    return res.status(400).json(msg);
  } else if (validation === null || validation !== 1) {
    return res.status(500).json(`Error desconocido durante la validación`);
  }
  const localDate = new Date().toLocaleString();
  report[0].metaData.lastEdit = localDate;
  console.log('localDate', localDate);

  if (report[0].metaData.isComplete) {
    console.log('isComplete');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(report));
    const checksum = hash.digest('hex');
    report[0].metaData.checksum = checksum;
    console.log('checksum', checksum);
  }

  try {

    const fileName = report[0].metaData.fileID;
    const place = fileName.split('-')[1];

    const routepath = `informes/informesJSON/${place}`;

    const reportsPath = path.join(process.cwd(), routepath, fileName);
    const lastReportPath = path.join(process.cwd(), routepath, `/informe-${place}-last.json`);

    fs.writeFileSync(reportsPath, JSON.stringify(report, null, 2), 'utf-8');
    fs.writeFileSync(lastReportPath, JSON.stringify(report, null, 2), 'utf-8');

    res.status(200).json(`Archivo guardado: ${fileName}`); 
    console.log('saveJson', fileName); 
  }

  catch (e) {
    console.error(e.message);
    res.sendStatus(500);
  }

});



export default routerJson;

