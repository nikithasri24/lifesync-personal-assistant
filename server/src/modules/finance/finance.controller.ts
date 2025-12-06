import type { RequestHandler } from 'express';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createTransaction, listAccounts, listTransactions } from './finance.repository.js';
import { createTransactionBody, listTransactionsQuery } from './finance.schema.js';
import type { CreateTransactionBody } from './finance.schema.js';

export const getAccounts: RequestHandler = asyncHandler(async (_req, res) => {
  const accounts = await listAccounts();
  res.json(accounts);
});

export const getTransactions: RequestHandler = asyncHandler(async (req, res) => {
  const { limit } = listTransactionsQuery.parse(req.query);
  const transactions = await listTransactions(limit ?? 100);
  res.json(transactions);
});

export const postTransaction: RequestHandler = asyncHandler(async (req, res) => {
  const body = createTransactionBody.parse(req.body) as CreateTransactionBody;
  const transaction = await createTransaction(body);
  res.status(201).json(transaction);
});
