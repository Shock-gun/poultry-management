
import {
  registerFlock,
  listFlocks,
  getFlockById,
  editFlock,
  finishFlock
} from './flocks.service.js';

// Create a new flock
export async function create(req, res, next) {
  try {
    const flock = await registerFlock(
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Flock created successfully',
      data: { flock }
    });
  } catch (error) {
    next(error);
  }
}

// Get all flocks
export async function list(req, res, next) {
  try {
    const flocks = await listFlocks();

    res.status(200).json({
      success: true,
      data: { flocks }
    });
  } catch (error) {
    next(error);
  }
}

// Get one flock by ID

/**
 * Update an existing flock.
 */
export async function update(req, res, next) {
  try {
    const flock = await editFlock(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Flock updated successfully',
      data: { flock }
    });
  } catch (error) {
    next(error);
  }
}


export async function getById(req, res, next) {
  try {
    const flock = await getFlockById(req.params.id);

    res.status(200).json({
      success: true,
      data: { flock }
    });
  } catch (error) {
    next(error);
  }
}

 // Close an existing flock
export async function close(req, res, next) {
  try {
    const flock = await finishFlock(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Flock closed successfully',
      data: { flock }
    });
  } catch (error) {
    next(error);
  }
}
