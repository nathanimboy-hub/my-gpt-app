import { formatDate } from "@/lib/date";
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Date</th>
              <th className="whitespace-nowrap px-4 py-3">Vessel</th>
              <th className="whitespace-nowrap px-4 py-3">Route</th>
              <th className="whitespace-nowrap px-4 py-3">Passengers</th>
              {showFinancials && <th className="whitespace-nowrap px-4 py-3">Sales</th>}
              <th className="whitespace-nowrap px-4 py-3">Fuel (L)</th>
              <th className="whitespace-nowrap px-4 py-3">Duration</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={showFinancials ? 8 : 7} className="px-4 py-14 text-center">
                  <p className="font-medium text-slate-700">No trip logs found</p>
                  <p className="mt-1 text-sm text-slate-500">Adjust filters or add a new trip log to get started.</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const canManage = userRole === "admin" || log.created_by === currentUserId;

                return (
                  <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(log.scheduled_departure_time)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{log.vessel_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{log.route_direction}</td>
                    <td className="whitespace-nowrap px-4 py-3">{log.passenger_count.toLocaleString()}</td>
                    {showFinancials && <td className="whitespace-nowrap px-4 py-3">₱{log.ticket_sales_php.toLocaleString()}</td>}
                    <td className="whitespace-nowrap px-4 py-3">{log.total_fuel_liters.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{log.trip_duration_minutes} min</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(log)}
                            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
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
                        <p className="text-right text-xs text-slate-400">No access</p>
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
