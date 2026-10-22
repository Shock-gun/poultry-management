
import { generateFarmReportPdf } from './reports.pdf.service.js';

export async function downloadFarmReportPdf(req, res, next) {
  try {
    const filters = {
      start_date: req.query.start_date || undefined,
      end_date: req.query.end_date || undefined,
    };

    const pdfBuffer = await generateFarmReportPdf(filters);

    const filename = 'poultry-farm-report.pdf';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-store',
    });

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
}
