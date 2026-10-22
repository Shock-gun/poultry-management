
import {
  registerRawMaterial,
  listRawMaterials,
  getRawMaterialById,
  recordRawMaterialPurchase,
  listRawMaterialPurchases,
  getRawMaterialStockSummary
} from './raw-materials.service.js';

function sendError(res, error) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode && error.statusCode < 500
        ? error.message
        : 'Internal server error'
  });
}

// POST /api/raw-materials
export async function create(req, res) {
  try {
    const material = await registerRawMaterial(req.body);

    return res.status(201).json({
      success: true,
      message: 'Raw material created successfully.',
      data: { material }
    });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/raw-materials
export async function list(req, res) {
  try {
    const materials = await listRawMaterials();

    return res.status(200).json({
      success: true,
      data: { materials }
    });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/raw-materials/:id
export async function getById(req, res) {
  try {
    const material = await getRawMaterialById(req.params.id);

    return res.status(200).json({
      success: true,
      data: { material }
    });
  } catch (error) {
    return sendError(res, error);
  }
}

// POST /api/raw-materials/purchases
export async function createPurchase(req, res) {
  try {
    const purchase = await recordRawMaterialPurchase(
      req.body,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: 'Raw material purchase recorded successfully.',
      data: { purchase }
    });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/raw-materials/purchases
export async function listPurchases(req, res) {
  try {
    const purchases = await listRawMaterialPurchases(
      req.query.raw_material_id || null
    );

    return res.status(200).json({
      success: true,
      data: { purchases }
    });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/raw-materials/:id/stock
export async function getStockSummary(req, res) {
  try {
    const summary = await getRawMaterialStockSummary(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    return sendError(res, error);
  }
}
