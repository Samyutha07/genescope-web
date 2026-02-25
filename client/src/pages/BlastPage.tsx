import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  TextField,
  Chip,
  Divider,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import { submitBlast, pollBlastStatus } from "../api";

type BlastStatus = "idle" | "submitting" | "polling" | "ready" | "failed" | "timeout";

const MAX_POLL_ATTEMPTS = 60; // 60 × 5s = 5 minutes max
const POLL_INTERVAL_MS = 5000;

export default function BlastPage() {
  const [sequence, setSequence] = useState("");
  const [status, setStatus] = useState<BlastStatus>("idle");
  const [rid, setRid] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const abortRef = useRef(false);

  const cleanSequence = (raw: string) =>
    raw
      .split("\n")
      .filter((line) => !line.startsWith(">")) // strip FASTA header if pasted
      .join("")
      .replace(/\s+/g, "")
      .toUpperCase();

  const handleSubmit = async () => {
    const cleaned = cleanSequence(sequence);

    if (cleaned.length < 20) {
      setErrorMsg("Sequence must be at least 20 nucleotides.");
      setStatus("failed");
      return;
    }

    if (!/^[ACGTNRYSWKMBDHVN]+$/.test(cleaned)) {
      setErrorMsg("Sequence contains invalid characters. Only IUPAC nucleotide codes are allowed.");
      setStatus("failed");
      return;
    }

    abortRef.current = false;
    setStatus("submitting");
    setResult(null);
    setErrorMsg("");
    setRid(null);
    setPollCount(0);

    try {
      const { rid: newRid, estimatedTime: eta } = await submitBlast(cleaned);
      setRid(newRid);
      setEstimatedTime(eta);
      setStatus("polling");

      let attempts = 0;
      while (attempts < MAX_POLL_ATTEMPTS && !abortRef.current) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        attempts++;
        setPollCount(attempts);

        const { status: blastStatus, result: blastResult } = await pollBlastStatus(newRid);

        if (blastStatus === "READY" && blastResult) {
          setResult(blastResult);
          setStatus("ready");
          return;
        }

        if (blastStatus === "FAILED" || blastStatus === "UNKNOWN") {
          setErrorMsg("BLAST job failed or expired. Please try again.");
          setStatus("failed");
          return;
        }
      }

      if (!abortRef.current) {
        setErrorMsg("BLAST timed out after 5 minutes. The NCBI servers may be busy — try again later.");
        setStatus("timeout");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus("failed");
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setStatus("idle");
    setErrorMsg("");
  };

  const isRunning = status === "submitting" || status === "polling";

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        BLAST Search
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Submit a nucleotide sequence to NCBI BLAST for alignment against the nt database.
      </Typography>

      {/* Input */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Nucleotide Sequence
        </Typography>
        <TextField
          multiline
          rows={8}
          fullWidth
          placeholder={`Paste your nucleotide sequence here (FASTA format or raw sequence):\n\n>My_sequence\nATGGCCATTGTAATGGGCC...`}
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          disabled={isRunning}
          sx={{ fontFamily: "monospace", mb: 2 }}
          inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
        />

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ScienceIcon />}
            onClick={handleSubmit}
            disabled={isRunning || !sequence.trim()}
          >
            Run BLAST
          </Button>

          {isRunning && (
            <Button variant="outlined" color="error" onClick={handleCancel}>
              Cancel
            </Button>
          )}

          {sequence.trim() && !isRunning && (
            <Typography variant="caption" color="text.secondary">
              ~{cleanSequence(sequence).length} bp
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Status */}
      {status === "submitting" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Submitting sequence to NCBI BLAST...
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      )}

      {status === "polling" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <span>Waiting for BLAST results</span>
              {rid && <Chip label={`RID: ${rid}`} size="small" variant="outlined" />}
            </Box>
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              Poll {pollCount}/{MAX_POLL_ATTEMPTS} ·{" "}
              {estimatedTime
                ? `Estimated time: ~${estimatedTime}s`
                : "Checking every 5 seconds"}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(pollCount / MAX_POLL_ATTEMPTS) * 100}
            />
          </Box>
        </Alert>
      )}

      {(status === "failed" || status === "timeout") && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Results */}
      {status === "ready" && result && (
        <Paper
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: "#f0fdf4",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              BLAST Results
            </Typography>
            {rid && <Chip label={`RID: ${rid}`} size="small" color="success" variant="outlined" />}
            <Button
              size="small"
              variant="outlined"
              href={`https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&RID=${rid}&FORMAT_TYPE=HTML`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ ml: "auto" }}
            >
              View on NCBI ↗
            </Button>
          </Box>

          <Divider />

          <Box sx={{ p: 2, maxHeight: 500, overflow: "auto", backgroundColor: "#fafafa" }}>
            <pre
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: 0,
              }}
            >
              {result}
            </pre>
          </Box>
        </Paper>
      )}
    </Box>
  );
}