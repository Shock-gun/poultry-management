
import {
  registerExpense,
  listExpenses,
  getExpense as getExpenseService,
  editExpense,
  removeExpense,
  summarizeExpenses
} from './expenses.service.js';

export async function createExpense(req, res, next) {
  try {
    const expense = await registerExpense(
      req.body,
      req.user?.id || req.user?.sub
    );

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      data: expense
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpenses(req, res, next) {
  try {
    const expenses = await listExpenses(req.query);

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpense(req, res, next) {
  try {
    const expense = await getExpenseService(req.params.id);

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
}

export async function updateExpense(req, res, next) {
  try {
    const expense = await editExpense(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully.',
      data: expense
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const expense = await removeExpense(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.',
      data: expense
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseSummary(req, res, next) {
  try {
    const summary = await summarizeExpenses(
      req.query.start_date,
      req.query.end_date
    );

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}
