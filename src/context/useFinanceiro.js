import { useContext } from 'react';
import { FinanceContext } from './financeContext.js';

export function useFinanceiro() {
  return useContext(FinanceContext);
}
