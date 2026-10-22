
import {
  registerFormula,
  listFormulas,
  getFormulaById
} from './feed-formulas.service.js';

function handleError(res, error) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode && error.statusCode < 500
        ? error.message
        : 'Internal server error'
  });
}

export async function create(req, res) {
  try {
    const formula = await registerFormula(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Feed formula created successfully.',
      data: { formula }
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function list(req, res) {
  try {
    const formulas = await listFormulas();

    return res.status(200).json({
      success: true,
      data: { formulas }
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getById(req, res) {
  try {
    const formula = await getFormulaById(req.params.id);

    return res.status(200).json({
      success: true,
      data: { formula }
    });
  } catch (error) {
    return handleError(res, error);
  }
}
