import { z } from "zod";


export function reportValidation(data) {
 
    try {
 
        // //añadir  resto de campos una vez definidos 
        // const metadataSchema = z.object({
        //     // fileID: z.string().length(27),
        //     tittle: z.string().includes("Cambio de Turno").length(15)
        // });

        // metadataSchema.parse(data[0].metaData);

        const handshakeSchema = z.object({  
            party: z.array(
                z.object({
                    type: z.string(),
                    leader: z.string(),
                    // number: z.string().min(1).max(9).length(1),
                })
            ),
        });

        handshakeSchema.parse(data[1].handshake);
        
 //añadir resto de archivos multimedias. el tamaño ya está en el middleware..
        const areaSchema = z.object({
            areaName: z.string(),
            units: z.string(),
            urlImages: z.array(z.string()),
            areaItems: z.array(z.object({
                desc: z.string(),
                state: z.array(z.boolean()),
                comments: z.string(),
            }))
        });

        data[2].areas.forEach((area) => {
            areaSchema.parse(area);
        });

 
        return 1;

    }

    catch (e) {
 

        if (e.issues.length > 0) {

            let issues = [];
            e.issues.forEach((issue) => {
                issues.push({message: issue.message, path: issue.path});
                console.log('e:', issue.message);
                console.log('e:', issue.path);
            }); 

            return issues;
        }
 

        return null;

    }

}
