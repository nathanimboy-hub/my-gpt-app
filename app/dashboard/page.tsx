"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/KpiCard";
import { TripLogForm } from "@/components/TripLogForm";
import { TripLogsTable } from "@/components/TripLogsTable";
import { toCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase";
import { TripLog } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("trip_logs")
      .select("*")
      .order("created_at", { ascending: false });

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
      await loadLogs();
    };

    void setup();
  }, [router]);

  const metrics = useMemo(() => {
    const totalTrips = logs.length;
    const totalPassengers = logs.reduce((sum, log) => sum + log.passenger_count, 0);
    const totalTicketSales = logs.reduce((sum, log) => sum + Number(log.ticket_sales_php), 0);
    const totalFuelUsed = logs.reduce((sum, log) => sum + Number(log.total_fuel_liters), 0);
    const totalVehicles = logs.reduce(
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
  }, [logs]);

  const exportCsv = () => {
    const csv = toCsv(logs);
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

  if (loading) {
    return <main className="p-4">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lite Shipping Dashboard</h1>
          <p className="text-sm text-slate-500">Cebu ↔ Tubigon operations and fuel efficiency</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="bg-emerald-600 text-white">
            Export CSV
          </button>
          <button onClick={logout} className="bg-slate-700 text-white">
            Logout
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Total Trips" value={metrics.totalTrips.toString()} />
        <KpiCard label="Total Passengers" value={metrics.totalPassengers.toLocaleString()} />
        <KpiCard label="Total Ticket Sales" value={`₱${metrics.totalTicketSales.toLocaleString()}`} />
        <KpiCard label="Total Fuel Used" value={`${metrics.totalFuelUsed.toFixed(2)} L`} />
        <KpiCard label="Avg Fuel / Trip" value={`${metrics.averageFuelPerTrip.toFixed(2)} L`} />
        <KpiCard
          label="Fuel / Passenger"
          value={`${metrics.fuelPerPassengerRatio.toFixed(3)} L`}
        />
        <KpiCard label="Fuel / Vehicle" value={`${metrics.fuelPerVehicleRatio.toFixed(3)} L`} />
      </section>

      {userId && <TripLogForm userId={userId} editingLog={editingLog} onSaved={handleSaved} />}

      <div>
        <h2 className="mb-2 text-lg font-semibold">Trip Logs</h2>
        <TripLogsTable logs={logs} onEdit={setEditingLog} />
      </div>
    </main>
  );
}
