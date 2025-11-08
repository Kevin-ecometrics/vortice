import { WaiterNotification } from "@/app/lib/supabase/waiter";
import NotificationCard from "./NotificationCard";

interface NotificationsTabProps {
  notifications: WaiterNotification[];
  processing: string | null;
  attendedNotifications: Set<string>;
  onAcknowledgeNotification: (notificationId: string) => void;
  onCompleteNotification: (notificationId: string) => void;
  onGoToTables: () => void;
}

export default function NotificationsTab({
  notifications,
  processing,
  attendedNotifications,
  onAcknowledgeNotification,
  onCompleteNotification,
  onGoToTables,
}: NotificationsTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Notificaciones Pendientes
        </h2>
      </div>

      {notifications.length === 0 ? (
        <EmptyNotificationsState />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              processing={processing}
              isAttended={attendedNotifications.has(notification.id)}
              onAcknowledge={() => {
                onAcknowledgeNotification(notification.id);
                onGoToTables();
              }}
              onComplete={() => onCompleteNotification(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyNotificationsState() {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No hay notificaciones pendientes
      </h3>
      <p className="text-gray-500">Todo está bajo control</p>
    </div>
  );
}

// Import necesario para el componente EmptyNotificationsState
import { FaCheckCircle } from "react-icons/fa";
