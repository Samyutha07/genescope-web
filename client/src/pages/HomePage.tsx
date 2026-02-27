import { Box, Typography, Card, CardContent, Button, Chip } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SearchIcon from "@mui/icons-material/Search";
import ScienceIcon from "@mui/icons-material/Science";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShieldIcon from "@mui/icons-material/Shield";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: <UploadFileIcon sx={{ fontSize: 36 }} />, title: "Upload Sequences", description: "Upload .fasta, .fa, or .fna files. GeneScope parses every sequence and stores it in your database instantly.", action: "Upload a file", route: "/upload", color: "#6366f1", tip: "Don't have a FASTA file? Download one free from NCBI." },
  { icon: <SearchIcon sx={{ fontSize: 36 }} />, title: "Browse Sequences", description: "Search and paginate through all your stored sequences. See headers, lengths in base pairs, and upload timestamps.", action: "Browse sequences", route: "/sequences", color: "#0ea5e9", tip: "You can delete any sequence you no longer need." },
  { icon: <ScienceIcon sx={{ fontSize: 36 }} />, title: "BLAST Search", description: "Submit any nucleotide sequence to NCBI BLAST — the gold standard tool for finding similar sequences across all known organisms.", action: "Run BLAST", route: "/blast", color: "#10b981", tip: "BLAST queries NCBI's servers and typically takes 30–120 seconds." },
  { icon: <BarChartIcon sx={{ fontSize: 36 }} />, title: "Statistics", description: "Visualize your database — see upload history, sequence length distribution, and summary stats across all stored sequences.", action: "View stats", route: "/stats", color: "#f59e0b", tip: "Charts update automatically as you add more sequences." },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Chip label="Bioinformatics Web App" size="small" sx={{ mb: 2, fontWeight: 600 }} color="primary" variant="outlined" />
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: "-0.5px" }}>Welcome to GeneScope 🧬</Typography>
        <Typography color="text.secondary" sx={{ fontSize: "1.1rem", maxWidth: 560, mx: "auto", mb: 4 }}>
          Upload, search, and analyze DNA and RNA sequences — with integrated NCBI BLAST alignment and real-time statistics.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="contained" size="large" startIcon={<UploadFileIcon />} onClick={() => navigate("/upload")} sx={{ borderRadius: 2, px: 3 }}>
            Get Started — Upload a File
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate("/sequences")} sx={{ borderRadius: 2, px: 3 }}>
            Browse Sequences
          </Button>
        </Box>
      </Box>

      {/* Privacy notice */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, mb: 5, border: "1px solid", borderColor: "success.main", borderRadius: 2, opacity: 0.85 }}
        style={{ backgroundColor: "rgba(22,163,74,0.08)" }}>
        <ShieldIcon sx={{ color: "success.main", mt: 0.2, flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "success.main" }}>Your data, your control</Typography>
          <Typography variant="body2" color="text.secondary">
            Sequences you upload are stored in a private database for your analysis. You can delete any sequence at any time from the Sequences page. We never share or sell your data.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
        {features.map((f) => (
          <Card key={f.route} elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 4, borderColor: f.color, transform: "translateY(-2px)" } }}
            onClick={() => navigate(f.route)}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ color: f.color, mb: 2 }}>{f.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{f.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{f.description}</Typography>
              <Typography variant="caption" sx={{ display: "block", color: "text.disabled", fontStyle: "italic", mb: 2 }}>💡 {f.tip}</Typography>
              <Button size="small" variant="outlined" sx={{ borderColor: f.color, color: f.color, borderRadius: 1.5 }}
                onClick={(e) => { e.stopPropagation(); navigate(f.route); }}>
                {f.action} →
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}