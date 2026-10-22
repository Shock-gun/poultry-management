
import {
  recordConsumption,
  listConsumption,
  getConsumption,
  listConsumptionByFlock
} from './feed-consumption.service.js';

export async function create(req, res, next) {
  try {
    const result = await recordConsumption(
      req.body,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: 'Feed consumption recorded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const records = await listConsumption();

    return res.status(200).json({
      success: true,
      data: { records }
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const record = await getConsumption(req.params.id);

    return res.status(200).json({
      success: true,
      data: { record }
    });
  } catch (error) {
    next(error);
  }
}

export async function listByFlock(req, res, next) {
  try {
    const records = await listConsumptionByFlock(
      req.params.flockId
    );

    return res.status(200).json({
      success: true,
      data: { records }
    });
  } catch (error) {
    next(error);
  }
}
