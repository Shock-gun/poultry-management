import {
  getInventoryOverview,
  getRawMaterialStock,
  getFinishedFeedStock,
} from './inventory.service.js';

// GET /api/inventory
export async function getOverview(req, res, next) {
  try {
    const inventory = await getInventoryOverview();

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/inventory/raw-materials
export async function getRawMaterials(req, res, next) {
  try {
    const materials = await getRawMaterialStock();

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/inventory/finished-feed
export async function getFinishedFeed(req, res, next) {
  try {
    const feed = await getFinishedFeedStock();

    res.status(200).json({
      success: true,
      count: feed.length,
      data: feed,
    });
  } catch (error) {
    next(error);
  }
}