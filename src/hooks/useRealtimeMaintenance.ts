"use client";

import { useState, useEffect, useCallback } from "react";
import { MaintenanceConfig } from "@/types/settings";
import { supabase } from "@/lib/supabase/client";

export function useRealtimeMaintenance() {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({
    enabled: false,
    scope: "all",
    message: "Platform sedang dalam pemeliharaan sistem terencana.",
    estimatedEndTime: "14:00 WIB",
    bypassIpWhitelist: [],
  });
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/maintenance/status");
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(Boolean(data.maintenanceMode));
        if (data.maintenance) {
          setMaintenance(data.maintenance);
        }
        setIsBypassed(Boolean(data.isBypassed));
      }
    } catch (err) {
      console.warn("[Maintenance] Failed to check maintenance status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // 1. Supabase Realtime Broadcast & Postgres Changes channel
    const channel = supabase
      .channel("nemo-maintenance")
      .on("broadcast", { event: "MAINTENANCE_TOGGLED" }, (payload) => {
        const p = payload.payload as any;
        if (p) {
          setMaintenanceMode(Boolean(p.maintenanceMode));
          if (p.maintenance) {
            setMaintenance(p.maintenance);
          }
        }
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "website_settings" },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    // 2. Periodic Polling Fallback (every 30s)
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchStatus]);

  return {
    maintenanceMode,
    maintenance,
    isBypassed,
    loading,
    refresh: fetchStatus,
  };
}
