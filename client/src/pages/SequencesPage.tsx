import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  TextField,
  Pagination,
  Chip,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { fetchSequences, type Sequence } from "../api";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  const loadSequences = useCallback(async (query: string, pageNum: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSequences(query, pageNum);
      setSequences(data.sequences);
      setPages(data.pages);
      setPage(data.page);
      setTotal(data.total);
    } catch {
      setError("Failed to load sequences. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fires when debounced search changes — always resets to page 1
  useEffect(() => {
    setPage(1);
    loadSequences(debouncedSearch, 1);
  }, [debouncedSearch, loadSequences]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    loadSequences(debouncedSearch, value);
  };

  return (
    <Container sx={{ mt: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Stored Sequences
        </Typography>
        {!loading && !error && (
          <Typography color="text.secondary">
            {total} sequence{total !== 1 ? "s" : ""} found
          </Typography>
        )}
      </Box>

      <TextField
        label="Search by header"
        variant="outlined"
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && sequences.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          {search
            ? `No sequences match "${search}". Try a different search.`
            : "No sequences stored yet. Upload a FASTA file to get started."}
        </Alert>
      )}

      {!loading &&
        sequences.map((seq) => (
          <Card
            key={seq._id}
            elevation={0}
            sx={{
              mt: 2,
              border: "1px solid #e2e8f0",
              borderRadius: 2,
              transition: "box-shadow 0.2s",
              "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {seq.header}
                </Typography>
                <Chip
                  label={`${seq.length?.toLocaleString() ?? "?"} bp`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  color: "text.secondary",
                  backgroundColor: "#f8fafc",
                  p: 1.5,
                  borderRadius: 1,
                  fontSize: "0.75rem",
                }}
              >
                {seq.sequence.substring(0, 300)}
                {seq.sequence.length > 300 ? "…" : ""}
              </Typography>

              <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
                Uploaded {new Date(seq.uploadedAt).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        ))}

      {pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5, mb: 4 }}>
          <Pagination
            count={pages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Container>
  );
}