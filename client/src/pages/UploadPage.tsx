import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import React, { useRef, useState } from "react";
import { uploadFasta, type UploadResponse } from "../api";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".fasta") && !file.name.endsWith(".fa") && !file.name.endsWith(".fna")) {
      setStatus("error");
      setErrorMsg("Please upload a valid FASTA file (.fasta, .fa, or .fna)");
      return;
    }

    setStatus("uploading");
    setResult(null);
    setErrorMsg("");

    try {
      const data = await uploadFasta(file);
      setResult(data);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Upload failed");
    }
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-uploaded
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Upload FASTA File
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Upload a .fasta, .fa, or .fna file to parse and store sequences.
      </Typography>

      <Paper
        elevation={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 6,
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "#cbd5e1",
          backgroundColor: isDragging ? "#f0f4ff" : "#fafafa",
          textAlign: "center",
          borderRadius: 3,
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onClick={handleBrowseClick}
      >
        <UploadFileIcon
          sx={{ fontSize: 56, mb: 2, color: isDragging ? "primary.main" : "text.secondary" }}
        />

        <Typography variant="h6" sx={{ mb: 1 }}>
          {isDragging ? "Drop your file here" : "Drag & drop your FASTA file here"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          or click to browse
        </Typography>

        <Button
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
          disabled={status === "uploading"}
        >
          Browse File
        </Button>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept=".fasta,.fa,.fna"
          onChange={handleFileChange}
        />
      </Paper>

      {status === "uploading" && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress />
          <Typography sx={{ mt: 1 }} color="text.secondary" align="center">
            Uploading and parsing sequences...
          </Typography>
        </Box>
      )}

      {status === "error" && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {status === "success" && result && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {result.message}
        </Alert>
      )}

      {status === "success" && result && result.sequences.length > 0 && (
        <Paper elevation={0} sx={{ mt: 3, p: 3, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Preview (first {result.sequences.length} of {result.count})
          </Typography>
          {result.sequences.map((seq, i) => (
            <Box
              key={i}
              sx={{
                mb: 2,
                p: 2,
                backgroundColor: "#f8fafc",
                borderRadius: 1,
                border: "1px solid #e2e8f0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {seq.header}
                </Typography>
                <Chip label={`${seq.length} bp`} size="small" color="primary" variant="outlined" />
              </Box>
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", color: "text.secondary", wordBreak: "break-all" }}
              >
                {seq.sequence.substring(0, 80)}
                {seq.sequence.length > 80 ? "…" : ""}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}