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

 

export function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`Archivo eliminado correctamente: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error al eliminar el archivo ${filePath}: ${error.message}`);
    return false;
  }
}


