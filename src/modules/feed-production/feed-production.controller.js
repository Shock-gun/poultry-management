
import {
  produceFeed,
  listProductionBatches,
  getProductionBatch
} from './feed-production.service.js';

export async function create(req, res, next) {
  try {
    const result = await produceFeed(req.body, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Feed production batch recorded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const batches = await listProductionBatches();
    return res.status(200).json({
      success: true,
      data: { batches }
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const batch = await getProductionBatch(req.params.id);
    return res.status(200).json({
      success: true,
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
}
