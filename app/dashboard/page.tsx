"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/KpiCard";
import { TripLogForm } from "@/components/TripLogForm";
import { TripLogsTable } from "@/components/TripLogsTable";
import { toCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/roles";
import { TripLog, UserRole } from "@/lib/types";
import { formatDate, formatDateTime, isoDateToUsInput, parseUsDateInput } from "@/lib/date";

type DashboardTab = "employee" | "admin";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("employee");
  const [activeTab, setActiveTab] = useState<DashboardTab>("employee");
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [vesselNameFilter, setVesselNameFilter] = useState("");
  const [routeDirectionFilter, setRouteDirectionFilter] = useState("");

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("trip_logs")
      .select("*")
      .order("scheduled_departure_time", { ascending: false });

    if (!error && data) {
      setLogs(data as TripLog[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      const role = getUserRole(data.user);
      setUserRole(role);
      setActiveTab(role === "admin" ? "admin" : "employee");
      await loadLogs();
    };

    void setup();
  }, [router]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = new Date(log.scheduled_departure_time);
      const dateFrom = parseUsDateInput(dateFromInput);
      if (dateFrom) {
        const startDate = new Date(`${dateFrom}T00:00:00`);
        if (logDate < startDate) {
          return false;
        }
      }

      const dateTo = parseUsDateInput(dateToInput);
      if (dateTo) {
        const endDate = new Date(`${dateTo}T23:59:59.999`);
        if (logDate > endDate) {
          return false;
        }
      }

      if (vesselNameFilter && log.vessel_name !== vesselNameFilter) {
        return false;
      }

      if (routeDirectionFilter && log.route_direction !== routeDirectionFilter) {
        return false;
      }

      return true;
    });
  }, [dateFromInput, dateToInput, logs, routeDirectionFilter, vesselNameFilter]);

  const metrics = useMemo(() => {
    const totalTrips = filteredLogs.length;
    const totalPassengers = filteredLogs.reduce((sum, log) => sum + log.passenger_count, 0);
    const totalTicketSales = filteredLogs.reduce((sum, log) => sum + Number(log.ticket_sales_php), 0);
    const totalFuelUsed = filteredLogs.reduce((sum, log) => sum + Number(log.total_fuel_liters), 0);
    const totalVehicles = filteredLogs.reduce(
      (sum, log) => sum + log.motorcycles_count + log.cars_count + log.trucks_count,
      0
    );

    return {
      totalTrips,
      totalPassengers,
      totalTicketSales,
      totalFuelUsed,
      averageFuelPerTrip: totalTrips ? totalFuelUsed / totalTrips : 0,
      fuelPerPassengerRatio: totalPassengers ? totalFuelUsed / totalPassengers : 0,
      fuelPerVehicleRatio: totalVehicles ? totalFuelUsed / totalVehicles : 0
    };
  }, [filteredLogs]);

  const isAdmin = userRole === "admin";

  const analyticsSummary = useMemo(() => {
    const totalTrips = filteredLogs.length;
    const totalRevenue = filteredLogs.reduce((sum, log) => sum + Number(log.ticket_sales_php), 0);
    const totalFuelUsed = filteredLogs.reduce((sum, log) => sum + Number(log.total_fuel_liters), 0);
    const totalPassengers = filteredLogs.reduce((sum, log) => sum + Number(log.passenger_count), 0);

    const highestFuelTrip = filteredLogs.reduce<TripLog | null>((highest, current) => {
      if (!highest) {
        return current;
      }
      return Number(current.total_fuel_liters) > Number(highest.total_fuel_liters) ? current : highest;
    }, null);

    const lowestFuelTrip = filteredLogs.reduce<TripLog | null>((lowest, current) => {
      if (!lowest) {
        return current;
      }
      return Number(current.total_fuel_liters) < Number(lowest.total_fuel_liters) ? current : lowest;
    }, null);

    return {
      totalRevenue,
      totalFuelUsed,
      averageFuelPerTrip: totalTrips ? totalFuelUsed / totalTrips : 0,
      averageRevenuePerTrip: totalTrips ? totalRevenue / totalTrips : 0,
      fuelPerPassenger: totalPassengers ? totalFuelUsed / totalPassengers : 0,
      highestFuelTrip,
      lowestFuelTrip
    };
  }, [filteredLogs]);

  const summaryInsights = useMemo(() => {
    const totalTrips = filteredLogs.length;
    const totalPassengers = filteredLogs.reduce((sum, log) => sum + Number(log.passenger_count), 0);
    const totalFuelUsed = filteredLogs.reduce((sum, log) => sum + Number(log.total_fuel_liters), 0);

    const lowestPassengerTrip = filteredLogs.reduce<TripLog | null>((lowest, current) => {
      if (!lowest) {
        return current;
      }
      return Number(current.passenger_count) < Number(lowest.passenger_count) ? current : lowest;
    }, null);

    const highestFuelUsageTrip = filteredLogs.reduce<TripLog | null>((highest, current) => {
      if (!highest) {
        return current;
      }
      return Number(current.total_fuel_liters) > Number(highest.total_fuel_liters) ? current : highest;
    }, null);

    return {
      totalTrips,
      totalPassengers,
      averagePassengersPerTrip: totalTrips ? totalPassengers / totalTrips : 0,
      averageFuelUsedPerTrip: totalTrips ? totalFuelUsed / totalTrips : 0,
      lowestPassengerTrip,
      highestFuelUsageTrip
    };
  }, [filteredLogs]);

  const formatTripLabel = (trip: TripLog | null) => {
    if (!trip) {
      return "No trips in current filter";
    }

    const tripDate = formatDate(trip.scheduled_departure_time);
    return `${trip.vessel_name} • ${trip.route_direction} • ${tripDate}`;
  };

  const formatTripTime = (trip: TripLog | null) => {
    if (!trip) {
      return "No data available";
    }

    return new Date(trip.scheduled_departure_time).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const clearFilters = () => {
    setDateFromInput("");
    setDateToInput("");
    setVesselNameFilter("");
    setRouteDirectionFilter("");
  };

  const exportCsv = () => {
    const csv = toCsv(logs, isAdmin);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `lite-trip-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaved = async () => {
    await loadLogs();
    setEditingLog(null);
  };

  const handleDelete = async (log: TripLog) => {
    if (!userId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete trip log for ${log.vessel_name} (${formatDateTime(log.scheduled_departure_time)})?\nThis action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    let deleteQuery = supabase.from("trip_logs").delete().eq("id", log.id);
    if (!isAdmin) {
      deleteQuery = deleteQuery.eq("created_by", userId);
    }

    const { error } = await deleteQuery;

    if (!error) {
      if (editingLog?.id === log.id) {
        setEditingLog(null);
      }
      await loadLogs();
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-700">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-10 lg:px-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Lite Shipping</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Trip Operations Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Cebu ↔ Tubigon schedules, logs, and operational analytics.</p>
            <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Role: {userRole}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCsv} className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
              Export CSV
            </button>
            <button onClick={logout} className="bg-slate-800 text-white hover:bg-slate-900">
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Dashboard Tabs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("employee");
              setEditingLog(null);
            }}
            className={`w-full ${
              activeTab === "employee"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Employee Tab
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setEditingLog(null);
              }}
              className={`w-full ${
                activeTab === "admin"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Admin Tab
            </button>
          )}
        </nav>
      </section>

      {activeTab === "admin" && isAdmin ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold">Summary Insights</h2>
            <p className="mb-4 text-sm text-slate-500">Quick operational highlights from the current filtered trip logs.</p>
            {summaryInsights.totalTrips === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No data available
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Total Trips Logged</p>
                  <p className="text-xl font-semibold text-slate-900">{summaryInsights.totalTrips.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Total Passengers</p>
                  <p className="text-xl font-semibold text-slate-900">{summaryInsights.totalPassengers.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Average Passengers per Trip</p>
                  <p className="text-xl font-semibold text-slate-900">{summaryInsights.averagePassengersPerTrip.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Average Fuel Used per Trip</p>
                  <p className="text-xl font-semibold text-slate-900">{summaryInsights.averageFuelUsedPerTrip.toFixed(2)} L</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Lowest Passenger Trip</p>
                  <p className="text-base font-semibold text-slate-900">
                    {`${formatTripTime(summaryInsights.lowestPassengerTrip)} – ${summaryInsights.lowestPassengerTrip?.passenger_count ?? 0} passengers`}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Highest Fuel Usage Trip</p>
                  <p className="text-base font-semibold text-slate-900">
                    {`${formatTripTime(summaryInsights.highestFuelUsageTrip)} – ${
                      summaryInsights.highestFuelUsageTrip
                        ? `${Number(summaryInsights.highestFuelUsageTrip.total_fuel_liters).toFixed(2)} L`
                        : "No data available"
                    }`}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Admin Overview</h2>
              <p className="text-sm text-slate-500">Summary metrics and analytics across all filtered trip logs.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <KpiCard label="Total Trips" value={metrics.totalTrips.toString()} />
              <KpiCard label="Total Passengers" value={metrics.totalPassengers.toLocaleString()} />
              <KpiCard label="Total Ticket Sales" value={`₱${metrics.totalTicketSales.toLocaleString()}`} />
              <KpiCard label="Total Fuel Used" value={`${metrics.totalFuelUsed.toFixed(2)} L`} />
              <KpiCard label="Avg Fuel / Trip" value={`${metrics.averageFuelPerTrip.toFixed(2)} L`} />
              <KpiCard label="Fuel / Passenger" value={`${metrics.fuelPerPassengerRatio.toFixed(3)} L`} />
              <KpiCard label="Fuel / Vehicle" value={`${metrics.fuelPerVehicleRatio.toFixed(3)} L`} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold">Analytics Summary</h2>
            <p className="mb-4 text-sm text-slate-500">Financial and fuel-performance indicators for current filters.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-xl font-semibold text-slate-900">₱{analyticsSummary.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Total Fuel Used</p>
                <p className="text-xl font-semibold text-slate-900">{analyticsSummary.totalFuelUsed.toFixed(2)} L</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Average Fuel per Trip</p>
                <p className="text-xl font-semibold text-slate-900">{analyticsSummary.averageFuelPerTrip.toFixed(2)} L</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Average Revenue per Trip</p>
                <p className="text-xl font-semibold text-slate-900">₱{analyticsSummary.averageRevenuePerTrip.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Fuel per Passenger</p>
                <p className="text-xl font-semibold text-slate-900">{analyticsSummary.fuelPerPassenger.toFixed(3)} L</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 md:col-span-2 xl:col-span-1">
                <p className="text-sm text-slate-500">Highest Fuel Usage Trip</p>
                <p className="font-medium text-slate-900">{formatTripLabel(analyticsSummary.highestFuelTrip)}</p>
                <p className="text-sm text-slate-500">
                  {analyticsSummary.highestFuelTrip
                    ? `${Number(analyticsSummary.highestFuelTrip.total_fuel_liters).toFixed(2)} L`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 md:col-span-2 xl:col-span-3">
                <p className="text-sm text-slate-500">Lowest Fuel Usage Trip</p>
                <p className="font-medium text-slate-900">{formatTripLabel(analyticsSummary.lowestFuelTrip)}</p>
                <p className="text-sm text-slate-500">
                  {analyticsSummary.lowestFuelTrip
                    ? `${Number(analyticsSummary.lowestFuelTrip.total_fuel_liters).toFixed(2)} L`
                    : "—"}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Trip Logs</h2>
              <p className="text-sm text-slate-500">Filter and review operational logs across vessels and routes.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label htmlFor="date-from-filter">Date From</label>
                  <input
                    id="date-from-filter"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/DD/YYYY"
                    pattern="\d{1,2}/\d{1,2}/\d{4}"
                    value={dateFromInput}
                    onChange={(event) => setDateFromInput(event.target.value)}
                    onBlur={(event) => {
                      const isoDate = parseUsDateInput(event.target.value);
                      setDateFromInput(isoDateToUsInput(isoDate));
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="date-to-filter">Date To</label>
                  <input
                    id="date-to-filter"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/DD/YYYY"
                    pattern="\d{1,2}/\d{1,2}/\d{4}"
                    value={dateToInput}
                    onChange={(event) => setDateToInput(event.target.value)}
                    onBlur={(event) => {
                      const isoDate = parseUsDateInput(event.target.value);
                      setDateToInput(isoDateToUsInput(isoDate));
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="vessel-filter">Vessel Name</label>
                  <select
                    id="vessel-filter"
                    value={vesselNameFilter}
                    onChange={(event) => setVesselNameFilter(event.target.value)}
                  >
                    <option value="">All Vessels</option>
                    <option value="Lite Cat 1">Lite Cat 1</option>
                    <option value="Lite Cat 2">Lite Cat 2</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="route-filter">Route Direction</label>
                  <select
                    id="route-filter"
                    value={routeDirectionFilter}
                    onChange={(event) => setRouteDirectionFilter(event.target.value)}
                  >
                    <option value="">All Routes</option>
                    <option value="Cebu to Tubigon">Cebu to Tubigon</option>
                    <option value="Tubigon to Cebu">Tubigon to Cebu</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <TripLogsTable
              logs={filteredLogs}
              showFinancials={true}
              currentUserId={userId}
              userRole={userRole}
              onEdit={setEditingLog}
              onDelete={handleDelete}
            />
          </section>
        </>
      ) : (
        <>
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Employee Workspace</h2>
              <p className="text-sm text-slate-500">Create trip entries and manage logs based on your access permissions.</p>
            </div>
            <TripLogForm
              userId={userId}
              editingLog={editingLog}
              showFinancialFields={true}
              canManageAllLogs={isAdmin}
              onSaved={handleSaved}
            />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Trip Logs</h2>
              <p className="text-sm text-slate-500">Employees can edit or delete only records they created.</p>
            </div>
            <TripLogsTable
              logs={logs}
              showFinancials={false}
              currentUserId={userId}
              userRole={userRole}
              onEdit={setEditingLog}
              onDelete={handleDelete}
            />
          </section>
        </>
      )}
    </main>
  );
}
