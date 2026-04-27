import { format } from "date-fns";
import { TripLog } from "@/lib/types";

interface TripLogsTableProps {
  logs: TripLog[];
  onEdit: (log: TripLog) => void;
}

export function TripLogsTable({ logs, onEdit }: TripLogsTableProps) {
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
              <th className="px-3 py-2">Sales</th>
              <th className="px-3 py-2">Fuel (L)</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                  No trip logs yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{format(new Date(log.created_at), "MMM d, yyyy HH:mm")}</td>
                  <td className="px-3 py-2">{log.vessel_name}</td>
                  <td className="px-3 py-2">{log.route_direction}</td>
                  <td className="px-3 py-2">{log.passenger_count}</td>
                  <td className="px-3 py-2">₱{log.ticket_sales_php.toLocaleString()}</td>
                  <td className="px-3 py-2">{log.total_fuel_liters.toFixed(2)}</td>
                  <td className="px-3 py-2">{log.trip_duration_minutes} min</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onEdit(log)}
                      className="bg-slate-200 text-slate-700 hover:bg-slate-300"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
