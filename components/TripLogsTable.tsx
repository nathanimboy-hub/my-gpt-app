import { formatScheduledDeparture } from "@/lib/date";
import { TripLog, UserRole } from "@/lib/types";
import { formatFixed, formatLocaleNumber } from "@/lib/number";

interface TripLogsTableProps {
  logs: TripLog[];
  showFinancials: boolean;
  currentUserId: string | null;
  userRole: UserRole;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onEdit: (log: TripLog) => void;
  onDelete: (log: TripLog) => void;
}

export function TripLogsTable({
  logs,
  showFinancials,
  currentUserId,
  userRole,
  loading = false,
  error = null,
  emptyTitle = "No trip logs found",
  emptyDescription = "Adjust filters or add a new trip log to get started.",
  onEdit,
  onDelete
}: TripLogsTableProps) {
  const getFuelDisplay = (log: TripLog) => {
    const totalFuel = log.total_fuel_liters;
    if (totalFuel !== null && totalFuel !== undefined && Number.isFinite(Number(totalFuel))) {
      return `${formatFixed(totalFuel, 2)} L`;
    }

    const fuelValues = [log.fuel_steaming_liters, log.fuel_maneuvering_liters, log.generator_fuel_liters];
    const hasMissingFuel = fuelValues.some((value) => value === null || value === undefined || !Number.isFinite(Number(value)));
    if (hasMissingFuel) {
      return "N/A";
    }

    const computedTotalFuel = fuelValues.reduce((sum, value) => sum + Number(value), 0);
    return `${formatFixed(computedTotalFuel, 2)} L`;
  };

  const getDurationDisplay = (log: TripLog) => {
    const storedDuration = log.trip_duration_minutes;
    if (storedDuration !== null && storedDuration !== undefined && Number.isFinite(Number(storedDuration))) {
      return `${formatLocaleNumber(storedDuration)} min`;
    }

    const departureMs = new Date(log.scheduled_departure_time).getTime();
    const arrivalMs = new Date(log.actual_arrival_time).getTime();
    if (!Number.isFinite(departureMs) || !Number.isFinite(arrivalMs) || arrivalMs < departureMs) {
      return "N/A";
    }

    const minutes = Math.floor((arrivalMs - departureMs) / (1000 * 60));
    return `${formatLocaleNumber(minutes)} min`;
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Scheduled Departure</th>
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
            {loading ? (
              <tr>
                <td colSpan={showFinancials ? 8 : 7} className="px-4 py-14 text-center">
                  <p className="font-medium text-slate-700">Loading trip logs...</p>
                  <p className="mt-1 text-sm text-slate-500">Please wait while we fetch the latest records.</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={showFinancials ? 8 : 7} className="px-4 py-14 text-center">
                  <p className="font-medium text-rose-700">Failed to load trip logs</p>
                  <p className="mt-1 text-sm text-slate-500">{error}</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={showFinancials ? 8 : 7} className="px-4 py-14 text-center">
                  <p className="font-medium text-slate-700">{emptyTitle}</p>
                  <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const canManage = userRole === "admin" || log.created_by === currentUserId;

                return (
                  <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatScheduledDeparture(log.scheduled_departure_time)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{log.vessel_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{log.route_direction}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatLocaleNumber(log.passenger_count)}</td>
                    {showFinancials && <td className="whitespace-nowrap px-4 py-3">₱{formatLocaleNumber(log.ticket_sales_php)}</td>}
                    <td className="whitespace-nowrap px-4 py-3">{getFuelDisplay(log)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{getDurationDisplay(log)}</td>
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
