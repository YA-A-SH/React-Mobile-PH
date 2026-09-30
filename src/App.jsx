import { useState, useCallback } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  ButtonBase,
  Chip,
  Fade,
  keyframes,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Inventory2 as InventoryIcon,
  MoneyOff as DebtsIcon,
  ShoppingCart as SalesIcon,
  LocalPharmacy as PharmacyIcon,
} from "@mui/icons-material";

// ─── Sub-page components ──────────────────────────────────────────────────────
import InventoryPage from "./pages/YahyaPharmacy"; // adjust path as needed
import DebtsPage from "./pages/DebtsPage"; // adjust path as needed
import SalesPage from "./pages/SalesPage";

// ─── Design tokens (single source of truth) ───────────────────────────────────

const TOKENS = {
  bg: "#F7F9FC",
  surface: "#FFFFFF",
  surfaceSoft: "#FBFCFE",

  navy: {
    main: "#164E63",
    dark: "#0F3D4D",
    light: "#28748E",
    bg: "#EAF7FA",
  },

  blue: {
    main: "#2563EB",
    light: "#3B82F6",
    dark: "#1D4ED8",
    bg: "#EEF4FF",
  },

  green: {
    main: "#0F9F6E",
    light: "#18B981",
    dark: "#087A55",
    bg: "#EAFBF4",
  },

  amber: {
    main: "#D97706",
    light: "#F59E0B",
    bg: "#FFF7E8",
  },

  red: {
    main: "#DC2626",
    light: "#EF4444",
    bg: "#FFF0F0",
  },

  border: "#E8EDF4",

  text: {
    primary: "#172033",
    secondary: "#667085",
    muted: "#98A2B3",
  },

  shadow: "0 8px 30px rgba(15, 23, 42, 0.055)",
  shadowStrong: "0 14px 40px rgba(15, 23, 42, 0.085)",
};

const VIEW_CONFIG = [
  {
    key: "inventory",
    labelEn: "Inventory",
    labelAr: "المخزون",
    icon: InventoryIcon,
    accent: TOKENS.blue,
  },
  {
    key: "debts",
    labelEn: "Debts",
    labelAr: "الديون",
    icon: DebtsIcon,
    accent: TOKENS.amber,
  },
  {
    key: "sales",
    labelEn: "Sales",
    labelAr: "المبيعات",
    icon: SalesIcon,
    accent: TOKENS.green,
  },
];

const appTheme = createTheme({
  palette: {
    mode: "light",

    background: {
      default: TOKENS.bg,
      paper: TOKENS.surface,
    },

    primary: {
      main: TOKENS.blue.main,
      light: TOKENS.blue.light,
      dark: TOKENS.blue.dark,
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: TOKENS.navy.main,
      light: TOKENS.navy.light,
      dark: TOKENS.navy.dark,
      contrastText: "#FFFFFF",
    },

    success: {
      main: TOKENS.green.main,
    },

    warning: {
      main: TOKENS.amber.main,
    },

    error: {
      main: TOKENS.red.main,
    },

    text: {
      primary: TOKENS.text.primary,
      secondary: TOKENS.text.secondary,
    },

    divider: TOKENS.border,
  },

  shape: {
    borderRadius: 14,
  },

  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.035em" },
    h2: { fontWeight: 800, letterSpacing: "-0.03em" },
    h3: { fontWeight: 800, letterSpacing: "-0.025em" },
    h4: { fontWeight: 750, letterSpacing: "-0.02em" },
    h5: { fontWeight: 750, letterSpacing: "-0.015em" },
    h6: { fontWeight: 750, letterSpacing: "-0.01em" },
    button: { textTransform: "none", fontWeight: 700 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: TOKENS.bg,
          color: TOKENS.text.primary,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "*": {
          boxSizing: "border-box",
        },
        "::selection": {
          background: `${TOKENS.blue.main}20`,
          color: TOKENS.text.primary,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },

    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650,
        },
      },
    },
  },
});

// ─── keyframes ────────────────────────────────────────────────────────────────

const pulseRing = keyframes`
  0%   { transform: scale(0.9); opacity: 0.7; }
  50%  { transform: scale(1.15); opacity: 0.3; }
  100% { transform: scale(0.9); opacity: 0.7; }
`;

const floatUp = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

// ─── ComingSoonPage ───────────────────────────────────────────────────────────

function ComingSoonPage() {
  const accent = TOKENS.emerald;

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          minHeight: "calc(100vh - 56px - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: 6,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 380,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <Box
              sx={{
                position: "absolute",
                inset: -12,
                borderRadius: "50%",
                border: `2px solid ${accent.main}`,
                animation: `${pulseRing} 2.4s ease-in-out infinite`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: -6,
                borderRadius: "50%",
                border: `1.5px solid ${accent.main}55`,
                animation: `${pulseRing} 2.4s ease-in-out infinite 0.4s`,
              }}
            />
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: accent.bg,
                border: `2px solid ${accent.main}55`,
                animation: `${floatUp} 4s ease-in-out infinite`,
              }}
            >
              <SalesIcon sx={{ fontSize: 38, color: accent.light }} />
            </Avatar>
          </Box>

          <Chip
            label="Coming Soon"
            size="small"
            sx={{
              bgcolor: accent.bg,
              color: accent.light,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: `1px solid ${accent.main}44`,
              px: 0.5,
            }}
          />

          <Box>
            <Typography
              sx={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                background: `linear-gradient(135deg, ${TOKENS.text.primary} 0%, ${accent.light} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1.5,
              }}
            >
              Sales Module
            </Typography>
            <Typography
              sx={{
                color: TOKENS.text.secondary,
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 280,
                mx: "auto",
              }}
            >
              We're working on something great. The Sales page will let you
              record transactions, generate reports, and track revenue — all
              from your phone.
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              maxWidth: 280,
              height: 6,
              borderRadius: 99,
              overflow: "hidden",
              bgcolor: "rgba(148,163,184,0.08)",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: "60%",
                borderRadius: 99,
                background: `linear-gradient(90deg, transparent, ${accent.light}, transparent)`,
                backgroundSize: "200% auto",
                animation: `${shimmer} 2s linear infinite`,
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: "center",
            }}
          >
            {[
              "Daily Reports",
              "Revenue Tracking",
              "Invoice Gen",
              "Sales History",
            ].map((f) => (
              <Box
                key={f}
                sx={{
                  px: 1.5,
                  py: 0.6,
                  borderRadius: "8px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: TOKENS.text.secondary,
                  bgcolor: "rgba(148,163,184,0.06)",
                  border: "1px solid rgba(148,163,184,0.10)",
                }}
              >
                {f}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

// ─── Desktop NavTab ───────────────────────────────────────────────────────────

function DesktopNavTab({ config, active, onClick }) {
  const Icon = config.icon;

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.85,
        px: 2,
        py: 0.9,
        borderRadius: "12px",
        position: "relative",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        bgcolor: active ? config.accent.bg : "transparent",
        "&:hover": {
          bgcolor: active ? config.accent.bg : "rgba(148,163,184,0.06)",
        },
        "&::before": active
          ? {
              content: '""',
              position: "absolute",
              left: 0,
              top: "25%",
              height: "50%",
              width: 3,
              borderRadius: "0 3px 3px 0",
              bgcolor: config.accent.main,
            }
          : {},
      }}
    >
      <Icon
        sx={{
          fontSize: 18,
          color: active ? config.accent.light : TOKENS.text.secondary,
          transition: "color 0.2s",
        }}
      />
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          color: active ? config.accent.light : TOKENS.text.secondary,
          transition: "color 0.2s",
          lineHeight: 1,
        }}
      >
        {config.labelEn}
      </Typography>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 500,
          color: active ? `${config.accent.light}88` : "rgba(148,163,184,0.4)",
          lineHeight: 1,
          ml: -0.25,
        }}
      >
        {config.labelAr}
      </Typography>
    </ButtonBase>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────

function MobileBottomNav({ currentView, onChange }) {
  const index = VIEW_CONFIG.findIndex((v) => v.key === currentView);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        bgcolor: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: `1px solid ${TOKENS.border}`,
        pb: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <BottomNavigation
        value={index}
        onChange={(_, newIndex) => onChange(VIEW_CONFIG[newIndex].key)}
        showLabels
      >
        {VIEW_CONFIG.map((v, i) => {
          const Icon = v.icon;
          const isActive = i === index;
          return (
            <BottomNavigationAction
              key={v.key}
              label={v.labelEn}
              icon={
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  {isActive && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: -8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 20,
                        height: 3,
                        borderRadius: 99,
                        bgcolor: v.accent.light,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 30,
                      borderRadius: "10px",
                      bgcolor: isActive ? v.accent.bg : "transparent",
                      transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: 22,
                        color: isActive
                          ? v.accent.light
                          : TOKENS.text.secondary,
                        transition: "color 0.2s",
                      }}
                    />
                  </Box>
                </Box>
              }
              sx={{
                "& .MuiBottomNavigationAction-label": {
                  color: isActive ? v.accent.light : TOKENS.text.secondary,
                },
              }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}

// ─── Desktop Top AppBar ───────────────────────────────────────────────────────

function DesktopTopBar({
  currentView,
  onChange,
  selectedPharmacy,
  onPharmacyChange,
}) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${TOKENS.border}`,
        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{ px: { sm: 3, md: 5 }, gap: 2, minHeight: "60px !important" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: 2 }}>
          <Avatar
            sx={{
              bgcolor: TOKENS.blue.bg,
              color: TOKENS.blue.light,
              borderRadius: "12px",
              width: 36,
              height: 36,
              border: `1px solid ${TOKENS.blue.main}44`,
            }}
          >
            <PharmacyIcon sx={{ fontSize: 19 }} />
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: TOKENS.text.primary,
              }}
            >
              {selectedPharmacy === "old"
                ? "Yahya Pharmacy"
                : "Balqis Pharmacy"}
            </Typography>
            <Typography
              sx={{ fontSize: 10, color: TOKENS.text.secondary, lineHeight: 1 }}
            >
              Management System
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup
          value={selectedPharmacy}
          exclusive
          onChange={(e, val) => val && onPharmacyChange(val)}
          size="small"
          sx={{
            bgcolor: "#F8FAFC",
            p: "3px",
            borderRadius: "12px",
            border: `1px solid ${TOKENS.border}`,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "8px",
              px: 2,
              py: 0.5,
              fontSize: 12,
              fontWeight: 700,
              color: TOKENS.text.secondary,
              "&.Mui-selected": {
                bgcolor: TOKENS.blue.main,
                color: "#fff",
                "&:hover": {
                  bgcolor: TOKENS.blue.light,
                },
              },
            },
          }}
        >
          <ToggleButton value="old">صيدلية يحيى</ToggleButton>
          <ToggleButton value="new">صيدلية بلقيس</ToggleButton>
        </ToggleButtonGroup>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
          }}
        >
          {VIEW_CONFIG.map((v) => (
            <DesktopNavTab
              key={v.key}
              config={v}
              active={currentView === v.key}
              onClick={() => onChange(v.key)}
            />
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label="v2.0"
            size="small"
            sx={{
              bgcolor: "rgba(148,163,184,0.08)",
              color: TOKENS.text.secondary,
              fontSize: 10,
              height: 22,
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────

function MobileTopBar({ selectedPharmacy, onPharmacyChange }) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${TOKENS.border}`,
        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{
          px: 2,
          minHeight: "60px !important",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{
              bgcolor: TOKENS.blue.bg,
              color: TOKENS.blue.light,
              borderRadius: "11px",
              width: 34,
              height: 34,
              border: `1px solid ${TOKENS.blue.main}33`,
            }}
          >
            <PharmacyIcon sx={{ fontSize: 17 }} />
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: TOKENS.blue.light,
              }}
            >
              {selectedPharmacy === "old" ? "صيدلية يحيى" : "صيدلية بلقيس"}
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup
          value={selectedPharmacy}
          exclusive
          onChange={(e, val) => val && onPharmacyChange(val)}
          size="small"
          sx={{
            bgcolor: "#F8FAFC",
            p: "2px",
            borderRadius: "10px",
            border: `1px solid ${TOKENS.border}`,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "8px",
              px: 1.2,
              py: 0.4,
              fontSize: 11,
              fontWeight: 700,
              color: TOKENS.text.secondary,
              "&.Mui-selected": {
                bgcolor: TOKENS.blue.main,
                color: "#fff",
              },
            },
          }}
        >
          <ToggleButton value="old">يحيى</ToggleButton>
          <ToggleButton value="new">بلقيس</ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>
    </AppBar>
  );
}

// ─── ViewRenderer ─────────────────────────────────────────────────────────────

function ViewRenderer({ currentView, selectedPharmacy }) {
  switch (currentView) {
    case "inventory":
      return <InventoryPage selectedPharmacy={selectedPharmacy} />;
    case "debts":
      return <DebtsPage selectedPharmacy={selectedPharmacy} />;
    case "sales":
      return <SalesPage selectedPharmacy={selectedPharmacy} />;
    default:
      return null;
  }
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState("inventory");
  const [selectedPharmacy, setSelectedPharmacy] = useState(
    localStorage.getItem("selected_pharmacy") || "old",
  );
  const isMobile = useMediaQuery("(max-width:767px)");

  const handlePharmacyChange = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    localStorage.setItem("selected_pharmacy", pharmacy);
  };

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          pb: isMobile ? "calc(64px + env(safe-area-inset-bottom, 12px))" : 0,
        }}
      >
        {/* Navigation Bar */}
        {isMobile ? (
          <MobileTopBar
            selectedPharmacy={selectedPharmacy}
            onPharmacyChange={handlePharmacyChange}
          />
        ) : (
          <DesktopTopBar
            currentView={currentView}
            onChange={handleViewChange}
            selectedPharmacy={selectedPharmacy}
            onPharmacyChange={handlePharmacyChange}
          />
        )}

        {/* Page Content */}
        <ViewRenderer
          currentView={currentView}
          selectedPharmacy={selectedPharmacy}
        />

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <MobileBottomNav
            currentView={currentView}
            onChange={handleViewChange}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}
