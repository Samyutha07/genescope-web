import { useEffect, useState, useCallback } from "react";
import {
  Container, Typography, Box, Card, CardContent, Alert,
  CircularProgress, TextField, Pagination, Chip, InputAdornment,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchSequences, type Sequence } from "../api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

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
  const [deleteTarget, setDeleteTarget] = useState<Sequence | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    setPage(1);
    loadSequences(debouncedSearch, 1);
  }, [debouncedSearch, loadSequences]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    loadSequences(debouncedSearch, value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/sequences/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteTarget(null);
      loadSequences(debouncedSearch, page);
    } catch {
      setError("Failed to delete sequence. Please try again.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container sx={{ mt: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Stored Sequences</Typography>
        {!loading && !error && (
          <Typography color="text.secondary">{total} sequence{total !== 1 ? "s" : ""} found</Typography>
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
          startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
        }}
      />

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

      {!loading && !error && sequences.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          {search ? `No sequences match "${search}".` : "No sequences stored yet. Upload a FASTA file to get started."}
        </Alert>
      )}

      {!loading && sequences.map((seq) => (
        <Card key={seq._id} elevation={0} sx={{ mt: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, transition: "box-shadow 0.2s", "&:hover": { boxShadow: 4 } }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{seq.header}</Typography>
                  <Chip label={`${seq.length?.toLocaleString() ?? "?"} bp`} size="small" color="primary" variant="outlined" />
                </Box>
                <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all", color: "text.secondary", bgcolor: "action.hover", p: 1.5, borderRadius: 1, fontSize: "0.75rem" }}>
                  {seq.sequence.substring(0, 300)}{seq.sequence.length > 300 ? "…" : ""}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
                  Uploaded {new Date(seq.uploadedAt).toLocaleString()}
                </Typography>
              </Box>
              <Tooltip title="Delete sequence">
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(seq)} sx={{ mt: 0.5, flexShrink: 0 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      ))}

      {pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5, mb: 4 }}>
          <Pagination count={pages} page={page} onChange={handlePageChange} color="primary" shape="rounded" />
        </Box>
      )}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete sequence?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.header}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}