import { Outlet } from 'react-router-dom';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { NotificationContainer } from '@/components/common/NotificationContainer';

export function RootShell() {
  return (
    <div className="app-content isolate relative flex min-h-svh flex-col">
      <NotificationContainer />
      <ConfirmationModal />
      <Outlet />
    </div>
  );
}
