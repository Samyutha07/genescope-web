import { useState, useMemo, createContext, useContext } from "react";
import { AppBar, Toolbar, Typography, Container, Box, Button, IconButton, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";

import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import SequencesPage from "./pages/SequencesPage";
import BlastPage from "./pages/BlastPage";
import StatsPage from "./pages/StatsPage";

const ColorModeContext = createContext({ toggleColorMode: () => {} });

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Upload", to: "/upload" },
  { label: "Sequences", to: "/sequences" },
  { label: "BLAST", to: "/blast" },
  { label: "Stats", to: "/stats" },
];

function NavBar() {
  const location = useLocation();
  const { toggleColorMode } = useContext(ColorModeContext);
  const [mode, setMode] = useState<"light" | "dark">("light");

  const handleToggle = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
    toggleColorMode();
  };

  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: "#0f172a" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ fontWeight: 700, color: "#fff", textDecoration: "none" }}
        >
          GeneScope 🧬
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {navLinks.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              sx={{
                color: location.pathname === link.to ? "#818cf8" : "#fff",
                fontWeight: location.pathname === link.to ? 700 : 400,
                borderBottom: location.pathname === link.to ? "2px solid #818cf8" : "2px solid transparent",
                borderRadius: 0,
                mx: 0.5,
              }}
            >
              {link.label}
            </Button>
          ))}
          <IconButton onClick={handleToggle} sx={{ color: "#fff", ml: 1 }}>
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
        <NavBar />
        <Container maxWidth="lg" sx={{ mt: 6, pb: 8 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/sequences" element={<SequencesPage />} />
            <Route path="/blast" element={<BlastPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  );
}

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  const colorMode = useMemo(() => ({
    toggleColorMode: () => setMode((prev) => (prev === "light" ? "dark" : "light")),
  }), []);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        ...(mode === "light"
          ? { background: { default: "#f8fafc", paper: "#ffffff" } }
          : { background: { default: "#0f172a", paper: "#1e293b" } }),
      },
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}