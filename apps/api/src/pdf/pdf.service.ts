import { Injectable } from '@nestjs/common';
import pdfmake from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class PdfService {
    constructor() {
        // Fuentes estándar de PDF: no necesitan archivos .ttf y soportan acentos y ñ
        pdfmake.addFonts({
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique',
            },
        });

        // Nuestros documentos no cargan recursos remotos: bloquear URLs externas previene ataques SSRF
        pdfmake.setUrlAccessPolicy(() => false);
    }

    render(doc: TDocumentDefinitions): Promise<Buffer> {
        return pdfmake
            .createPdf({ ...doc, defaultStyle: { font: 'Helvetica', ...doc.defaultStyle } })
            .getBuffer();
    }
}