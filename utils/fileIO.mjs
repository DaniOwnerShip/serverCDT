import fs from 'fs';


export function loadFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw error;
    } 
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return fileContent;
  } catch (error) { 
    throw error;  
  }
}



export function saveFile(filePath, jsonString) {
  try {
    fs.writeFileSync(filePath, jsonString, 'utf-8'); 
  } catch (error) { 
    throw error;  
  }
}


 