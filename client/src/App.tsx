import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
} from "@mui/material";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import UploadPage from "./pages/UploadPage";
import SequencesPage from "./pages/SequencesPage";
import BlastPage from "./pages/BlastPage";
import StatsPage from "./pages/StatsPage";

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <AppBar position="static" elevation={0} sx={{ backgroundColor: "#0f172a" }}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              GeneScope
            </Typography>

            <Box>
              <Button component={Link} to="/" sx={{ color: "#fff" }}>
                Upload
              </Button>
              <Button component={Link} to="/sequences" sx={{ color: "#fff" }}>
                Sequences
              </Button>
              <Button component={Link} to="/blast" sx={{ color: "#fff" }}>
                BLAST
              </Button>
              <Button component={Link} to="/stats" sx={{ color: "#fff" }}>
                Stats
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/sequences" element={<SequencesPage />} />
            <Route path="/blast" element={<BlastPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

export default App;