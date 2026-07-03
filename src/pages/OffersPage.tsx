import { Header } from '../components/layout/Header';
import { EmptyState } from '../components/ui/Basics';

export function OffersPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg space-y-3 px-4 pb-32 pt-2">
        <h1 className="px-1 text-xl font-extrabold">العروض</h1>
        <div className="card">
          <EmptyState
            icon="🏷️"
            title="لا توجد عروض حاليًا"
            subtitle="قريبًا: عروض وخصومات من متاجرك المفضلة بناءً على مصروفاتك"
          />
        </div>
      </main>
    </>
  );
}
