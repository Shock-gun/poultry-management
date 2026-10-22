import {
  findRawMaterialInventory,
  findFinishedFeedInventory,
  getRawMaterialInventorySummary,
  getFinishedFeedSummary,
} from './inventory.repository.js';

// Get the complete inventory overview.
export async function getInventoryOverview() {
  const [
    rawMaterialSummary,
    finishedFeedSummary,
  ] = await Promise.all([
    getRawMaterialInventorySummary(),
    getFinishedFeedSummary(),
  ]);

  return {
    raw_materials: rawMaterialSummary,
    finished_feed: finishedFeedSummary,
  };
}

// Get stock information for all active raw materials.
export async function getRawMaterialStock() {
  return findRawMaterialInventory();
}

// Get stock information for finished feed.
export async function getFinishedFeedStock() {
  return findFinishedFeedInventory();
}