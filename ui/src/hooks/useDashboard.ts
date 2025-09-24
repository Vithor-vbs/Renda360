import { useState, useEffect } from "react";
import { DashboardService, DashboardData, DateRange } from "../api";

export interface UseDashboardOptions {
  dateRange?: DateRange;
  cardIds?: number[];
  autoFetch?: boolean;
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await DashboardService.getDashboardData({
        dateRange: options.dateRange,
        cardIds: options.cardIds,
      });
      setData(result);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchData();
  };

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [options.dateRange, options.cardIds, options.autoFetch]);

  return {
    data,
    loading,
    error,
    refresh,
    fetchData,
  };
};
