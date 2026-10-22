
import {
  recordEggSale,
  listEggSales,
  getEggSale,
  summarizeEggSales,
} from './egg-sales.service.js';

export async function createSale(req, res, next) {
  try {
    const sale = await recordEggSale(
      req.body,
      req.user?.sub
    );

    res.status(201).json({
      success: true,
      message: 'Egg sale recorded successfully.',
      data: sale,
    });
  } catch (error) {
    next(error);
  }
}

export async function listSales(req, res, next) {
  try {
    const sales = await listEggSales(req.query);

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSaleById(req, res, next) {
  try {
    const sale = await getEggSale(req.params.id);

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesSummary(req, res, next) {
  try {
    const summary = await summarizeEggSales(req.query);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
