import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CashSales } from './pages/CashSales';
import { CreditSales } from './pages/CreditSales';
import { CashValuting } from './pages/CashValuting';
import { EmployeeMasterlist } from './pages/EmployeeMasterlist';
import { Inventory } from './pages/Inventory';
import { GoodsSold } from './pages/GoodsSold';
import { FinancialStatements } from './pages/FinancialStatements';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'cash-sales', Component: CashSales },
      { path: 'credit-sales', Component: CreditSales },
      { path: 'cash-valuting', Component: CashValuting },
      { path: 'employees', Component: EmployeeMasterlist },
      { path: 'inventory', Component: Inventory },
      { path: 'goods-sold', Component: GoodsSold },
      { path: 'financial-statements', Component: FinancialStatements },
    ],
  },
]);
