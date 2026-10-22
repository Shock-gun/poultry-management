
import {
  recordProduction,
  listProduction,
  listProductionByFlock,
  getDailySummary,
  getProductionSummaryByRange
} from './production.service.js';

export async function create(req, res, next) {
  try {
    const production = await recordProduction(
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Egg production recorded successfully',
      data: { production }
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const production = await listProduction();

    res.status(200).json({
      success: true,
      data: { production }
    });
  } catch (error) {
    next(error);
  }
}

export async function listByFlock(req, res, next) {
  try {
    const production = await listProductionByFlock(
      req.params.flockId
    );

    res.status(200).json({
      success: true,
      data: { production }
    });
  } catch (error) {
    next(error);
  }
}

export async function dailySummary(req, res, next) {
  try {
    const summary = await getDailySummary(req.query.date);

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
}

export async function summaryByRange(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    const summary = await getProductionSummaryByRange(
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
}
