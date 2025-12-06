import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { getAccounts, getTransactions, postTransaction } from './finance.controller.js';
import { createTransactionBody, listTransactionsQuery } from './finance.schema.js';

export const financeRouter = Router();

financeRouter.get('/accounts', getAccounts);
financeRouter.get('/transactions', validate({ query: listTransactionsQuery }), getTransactions);
financeRouter.post('/transactions', validate({ body: createTransactionBody }), postTransaction);
