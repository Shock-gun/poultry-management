
import {
  getFarmReport,
  getFarmDailyReport,
} from './reports.service.js';

export async function getSummary(req, res, next) {
  try {
    const report = await getFarmReport(req.query);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyReport(req, res, next) {
  try {
    const report = await getFarmDailyReport(req.query);

    res.status(200).json({
      success: true,
      count: report.length,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}
