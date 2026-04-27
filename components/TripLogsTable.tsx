import { format } from "date-fns";
import { TripLog, UserRole } from "@/lib/types";

interface TripLogsTableProps {
  logs: TripLog[];
  showFinancials: boolean;
  currentUserId: string | null;
  userRole: UserRole;
  onEdit: (log: TripLog) => void;
  onDelete: (log: TripLog) => void;
}

export function TripLogsTable({
  logs,
  showFinancials,
  currentUserId,
  userRole,
  onEdit,
  onDelete
}: TripLogsTableProps) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Vessel</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Passengers</th>
              {showFinancials && <th className="px-3 py-2">Sales</th>}
              <th className="px-3 py-2">Fuel (L)</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={showFinancials ? 8 : 7} className="px-3 py-6 text-center text-slate-500">
                  No trip logs yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const canManage = userRole === "admin" || log.created_by === currentUserId;

                return (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{format(new Date(log.scheduled_departure_time), "MMM d, h:mm a")}</td>
                    <td className="px-3 py-2">{log.vessel_name}</td>
                    <td className="px-3 py-2">{log.route_direction}</td>
                    <td className="px-3 py-2">{log.passenger_count}</td>
                    {showFinancials && <td className="px-3 py-2">₱{log.ticket_sales_php.toLocaleString()}</td>}
                    <td className="px-3 py-2">{log.total_fuel_liters.toFixed(2)}</td>
                    <td className="px-3 py-2">{log.trip_duration_minutes} min</td>
                    <td className="px-3 py-2">
                      {canManage ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(log)}
                            className="bg-slate-200 text-slate-700 hover:bg-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(log)}
                            className="bg-rose-100 text-rose-700 hover:bg-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No access</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
