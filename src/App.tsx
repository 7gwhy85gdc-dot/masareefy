import { NavProvider, useNav } from './components/layout/Nav';
import { BottomNav } from './components/layout/BottomNav';
import { ToastProvider } from './components/ui/Toast';
import { AddTransactionSheet } from './features/transactions/AddTransactionSheet';
import { HomePage } from './pages/HomePage';
import { AlertsPage } from './pages/AlertsPage';
import { OffersPage } from './pages/OffersPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { BudgetsPage } from './features/budgets/BudgetsPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { GoalsPage } from './features/goals/GoalsPage';

function Screen() {
  const { view, addOpen, closeAdd } = useNav();
  return (
    <div className="min-h-dvh">
      {view === 'home' && <HomePage />}
      {view === 'alerts' && <AlertsPage />}
      {view === 'offers' && <OffersPage />}
      {view === 'settings' && <SettingsPage />}
      {view === 'transactions' && <TransactionsPage />}
      {view === 'budgets' && <BudgetsPage />}
      {view === 'analytics' && <AnalyticsPage />}
      {view === 'goals' && <GoalsPage />}
      <BottomNav />
      <AddTransactionSheet open={addOpen} onClose={closeAdd} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <NavProvider>
        <Screen />
      </NavProvider>
    </ToastProvider>
  );
}
