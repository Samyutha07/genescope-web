import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import DnaIcon from "@mui/icons-material/Biotech";
import RulerIcon from "@mui/icons-material/Straighten";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

interface StatsData {
  total: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  uploadsByDay: { _id: string; count: number }[];
  lengthBuckets: { _id: number | string; count: number }[];
}

// Format the bucket labels nicely
function bucketLabel(id: number | string): string {
  const labels: Record<string, string> = {
    "0": "0–500",
    "500": "500–1k",
    "1000": "1k–2k",
    "2000": "2k–5k",
    "5000": "5k–10k",
    "10000": "10k–50k",
    "50000+": "50k+",
  };
  return labels[String(id)] ?? String(id);
}

// Format date labels as "Feb 24"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${color}18`,
              color: color,
              display: "flex",
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json() as Promise<StatsData>;
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load statistics. Is the server running?");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) return null;

  const uploadData = stats.uploadsByDay.map((d) => ({
    date: formatDate(d._id),
    Sequences: d.count,
  }));

  const bucketData = stats.lengthBuckets.map((b) => ({
    range: bucketLabel(b._id),
    Sequences: b.count,
  }));

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Statistics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        An overview of your stored sequence data.
      </Typography>

      {/* Stat Cards */}
      {/* Stat Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, gap: 2, mb: 4 }}>
        <StatCard
          icon={<DnaIcon />}
          label="Total Sequences"
          value={stats.total.toLocaleString()}
          color="#6366f1"
        />
        <StatCard
          icon={<RulerIcon />}
          label="Average Length"
          value={`${stats.avgLength.toLocaleString()} bp`}
          color="#0ea5e9"
        />
        <StatCard
          icon={<TrendingUpIcon />}
          label="Longest Sequence"
          value={`${stats.maxLength.toLocaleString()} bp`}
          color="#10b981"
        />
        <StatCard
          icon={<CalendarIcon />}
          label="Shortest Sequence"
          value={`${stats.minLength.toLocaleString()} bp`}
          color="#f59e0b"
        />
      </Box>

      {/* Charts */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        {/* Upload History */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Uploads — Last 14 Days
          </Typography>
          {uploadData.length === 0 ? (
            <Typography color="text.secondary">No uploads in the last 14 days.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={uploadData}>
                <defs>
                  <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <Area type="monotone" dataKey="Sequences" stroke="#6366f1" strokeWidth={2} fill="url(#uploadGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Length Distribution */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Sequence Length Distribution
          </Typography>
          {bucketData.length === 0 ? (
            <Typography color="text.secondary">No length data available.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bucketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <Bar dataKey="Sequences" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Box>
    </Box>
  );
}