import { useState, useMemo } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActionArea,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Chip,
  Divider,
  Slide,
  Fade,
  Avatar,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  MedicalServices as MedicalIcon,
  Vaccines as VaccinesIcon,
  Opacity as DropsIcon,
  Science as ScienceIcon,
  Medication as MedicationIcon,
  LocalPharmacy as PharmacyIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Inventory2 as InventoryIcon,
  MedicalServices,
  ArrowRight,
  LocalPharmacy,
  Liquor,
  WaterDrop,
  Healing,
  Colorize,
  Opacity,
  Sort,
  ArrowDownward,
  ArrowUpward,
  Edit,
  Remove,
  Delete,
} from "@mui/icons-material";
import { useEffect } from "react";
import { getAllMedicines, saveMedicineDB } from "./db";
import { v4 as uuidv4 } from "uuid";
import { syncMedicines } from "./sync";
import RefreshIcon from "@mui/icons-material/Refresh";
// ─── Theme ───────────────────────────────────────────────────────────────────

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0F172A", paper: "#1E293B" },
    primary: { main: "#2563EB", light: "#3B82F6", dark: "#1D4ED8" },
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    text: { primary: "#F1F5F9", secondary: "#94A3B8" },
    divider: "rgba(148,163,184,0.12)",
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#1E293B",
          border: "1px solid rgba(148,163,184,0.08)",
          borderRadius: 20,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            border: "1px solid rgba(37,99,235,0.35)",
            transform: "translateY(-1px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "#1E293B",
          borderRadius: 24,
          border: "1px solid rgba(148,163,184,0.1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 14,
            background: "rgba(15,23,42,0.6)",
            "& fieldset": { borderColor: "rgba(148,163,184,0.15)" },
            "&:hover fieldset": { borderColor: "rgba(37,99,235,0.4)" },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 14 },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          width: 60,
          height: 60,
          boxShadow: "0 8px 32px rgba(37,99,235,0.5)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 600, textTransform: "none" },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 16px rgba(37,99,235,0.4)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: 11 },
      },
    },
  },
});

// ─── Constants ───────────────────────────────────────────────────────────────

const MEDICINE_TYPES = [
  "All",
  "Tablets",
  "Syrup",
  "Drops",
  "Ampoule",
  "Cream",
  "Oint",
  "Emulgel",
  "Others",
];

const TYPE_CONFIG = {
  Tablets: {
    icon: <LocalPharmacy fontSize="small" />,
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.1)",
  },
  Syrup: {
    icon: <Liquor fontSize="small" />,
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  Drops: {
    icon: <WaterDrop fontSize="small" />,
    color: "#06B6D4",
    bg: "rgba(6, 182, 212, 0.1)",
  },
  Ampoule: {
    icon: <VaccinesIcon fontSize="small" />,
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.1)",
  },

  Cream: {
    icon: <Healing fontSize="small" />,
    color: "#EC4899",
    bg: "rgba(236, 72, 153, 0.1)",
  },
  Oint: {
    icon: <Colorize fontSize="small" />,
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  Emulgel: {
    icon: <Opacity fontSize="small" />,
    color: "#14B8A6",
    bg: "rgba(20, 184, 166, 0.1)",
  },

  Others: {
    icon: <MedicationIcon fontSize="small" />,
    color: "#64748B",
    bg: "rgba(100, 116, 139, 0.1)",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTypeConfig = (type) => {
  return TYPE_CONFIG[type] || TYPE_CONFIG.Others;
};

const getLowStockStatus = (qty) => {
  if (qty <= 5) return { label: "Low Stock", color: "error" };
  if (qty <= 10) return { label: "Limited", color: "warning" };
  return null;
};

// ─── Add/Edit Dialog ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  type: "",
  qty: "",
  costPrice: "",
  sellPrice: "",
  company: "",
  location: "معروض",
  expDate: "",
};

function MedicineFormDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const isEdit = Boolean(initial);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid =
    form.name && form.type && form.qty && form.costPrice && form.sellPrice;

  const handleSave = () => {
    if (valid) {
      onSave(form);
      setForm(EMPTY_FORM);
      onClose();
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(initial || EMPTY_FORM);
  }, [initial, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: 18 }}>
          {isEdit ? "Edit Medicine" : "Add Medicine"}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: "divider" }} />
      <DialogContent
        sx={{
          pt: 2.5,
          pb: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <TextField
          label="Medicine Name"
          value={form.name}
          onChange={set("name")}
          required
          fullWidth
          size="small"
        />
        <FormControl fullWidth size="small" required>
          <InputLabel>Medicine Type</InputLabel>
          <Select
            value={form.type}
            label="Medicine Type"
            onChange={set("type")}
            sx={{ borderRadius: "14px !important" }}
          >
            {MEDICINE_TYPES.filter((t) => t !== "All").map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Quantity"
          value={form.qty}
          onChange={set("qty")}
          required
          fullWidth
          size="small"
          type="number"
        />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextField
            label="Cost Price"
            value={form.costPrice}
            onChange={set("costPrice")}
            required
            size="small"
            type="number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
          <TextField
            label="Selling Price"
            value={form.sellPrice}
            onChange={set("sellPrice")}
            required
            size="small"
            type="number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Location</InputLabel>

          <Select
            value={form.location || "معروض"}
            label="Location"
            onChange={set("location")}
          >
            <MenuItem value="معروض">معروض</MenuItem>

            <MenuItem value="مخزون">مخزون</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Company Name"
          value={form.company}
          onChange={set("company")}
          fullWidth
          size="small"
        />
        <TextField
          label="Expiration Date"
          value={form.expDate}
          onChange={set("expDate")}
          fullWidth
          size="small"
          placeholder="YYYY-MM"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ flex: 1, color: "text.secondary", borderColor: "divider" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!valid}
          sx={{ flex: 2 }}
        >
          {isEdit ? "Save Changes" : "Add Medicine"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Details Dialog ───────────────────────────────────────────────────────────

function MedicineDetailsDialog({
  open,
  onClose,
  medicine,
  onEdit,
  onDelete,
  onDecreaseQty,
}) {
  if (!medicine) return null;
  const cfg = getTypeConfig(medicine.type);
  const stock = getLowStockStatus(medicine.qty);
  const margin = (
    ((medicine.sellPrice - medicine.costPrice) / medicine.costPrice) *
    100
  ).toFixed(0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: cfg.bg,
                color: cfg.color,
                width: 44,
                height: 44,
                borderRadius: "12px",
              }}
            >
              {cfg.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontSize: 16, lineHeight: 1.3 }}>
                {medicine.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {medicine.type}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary", mt: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider sx={{ mt: 2, borderColor: "divider" }} />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1.5,
            mb: 2.5,
          }}
        >
          {[
            {
              label: "Quantity",
              value: medicine.qty,
              icon: <InventoryIcon sx={{ fontSize: 16 }} />,
            },
            {
              label: "Cost",
              value: `ILS ${medicine.costPrice.toFixed(2)}`,
              icon: <MoneyIcon sx={{ fontSize: 16 }} />,
            },
            {
              label: "Sell",
              value: `ILS ${medicine.sellPrice.toFixed(2)}`,
              icon: <MoneyIcon sx={{ fontSize: 16 }} />,
            },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                background: "rgba(15,23,42,0.5)",
                borderRadius: "12px",
                p: 1.5,
                border: "1px solid rgba(148,163,184,0.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                  color: "text.secondary",
                }}
              >
                {item.icon}
                <Typography variant="caption">{item.label}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {medicine.company && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <BusinessIcon sx={{ color: "text.secondary", fontSize: 18 }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  Company
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {medicine.company}
                </Typography>
              </Box>
            </Box>
          )}
          {medicine.expDate && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CalendarIcon sx={{ color: "text.secondary", fontSize: 18 }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  Expiration
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {medicine.expDate}
                </Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ScienceIcon sx={{ color: "text.secondary", fontSize: 18 }} />
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                Profit Margin
              </Typography>
              <Typography
                sx={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}
              >
                {margin}%
              </Typography>
            </Box>
          </Box>
          {stock && (
            <Chip
              label={stock.label}
              color={stock.color}
              size="small"
              sx={{ alignSelf: "flex-start", mt: 0.5 }}
            />
          )}
        </Box>
      </DialogContent>
      <Divider sx={{ borderColor: "divider" }} />
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          flexDirection: "column",
          gap: 1.2,
        }}
      >
        <Button
          onClick={() => {
            onEdit(medicine);
            onClose();
          }}
          variant="contained"
          startIcon={<Edit />}
          fullWidth
          size="large"
        >
          Edit Medicine
        </Button>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            onClick={() => onDecreaseQty(medicine)}
            variant="outlined"
            color="warning"
            disabled={medicine.qty <= 0}
            startIcon={<Remove />}
            sx={{ flex: 1 }}
          >
            Qty -1
          </Button>

          <Button
            onClick={() => {
              onDelete(medicine.id);
              onClose();
            }}
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            sx={{ flex: 1 }}
          >
            Delete
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ─── Medicine Card ────────────────────────────────────────────────────────────

function MedicineCard({ medicine, onClick }) {
  console.table({
    name: medicine.name,
    company: medicine.company,
    location: medicine.location,
  });
  const locationCfg =
    medicine.location === "مخزون"
      ? {
          label: "مخزون",
          color: "#F59E0B",
          bg: "rgba(245,158,11,0.12)",
          border: "rgba(245,158,11,0.25)",
        }
      : {
          label: "معروض",
          color: "#10B981",
          bg: "rgba(16,185,129,0.12)",
          border: "rgba(16,185,129,0.25)",
        };
  const cfg = getTypeConfig(medicine.type);
  const stock = getLowStockStatus(medicine.qty);

  return (
    <Fade in timeout={300}>
      <Card
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",

          bgcolor:
            medicine.location === "مخزون"
              ? "rgba(245,158,11,0.03)"
              : "rgba(16,185,129,0.03)",

          border:
            medicine.location === "مخزون"
              ? "1px solid rgba(245,158,11,0.12)"
              : "1px solid rgba(16,185,129,0.12)",

          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow:
              medicine.location === "مخزون"
                ? "0 8px 25px rgba(245,158,11,0.12)"
                : "0 8px 25px rgba(16,185,129,0.12)",
          },

          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: medicine.location === "مخزون" ? "#F59E0B" : "#10B981",
          },
        }}
      >
        {" "}
        <CardActionArea onClick={() => onClick(medicine)} sx={{ p: 0 }}>
          <CardContent
            sx={{
              p: "16px !important",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: cfg.bg,
                color: cfg.color,
                width: 48,
                height: 48,
                borderRadius: "14px",
                flexShrink: 0,
              }}
            >
              {cfg.icon}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: 14,
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "calc(100% - 60px)",
                  }}
                >
                  {medicine.name}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: "primary.light",
                    flexShrink: 0,
                  }}
                >
                  ILS {medicine.sellPrice.toFixed(2)}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    {medicine.type}
                  </Typography>

                  {medicine.company && (
                    <>
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          bgcolor: "text.secondary",
                          opacity: 0.4,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {medicine.company}
                      </Typography>
                    </>
                  )}
                </Box>

                <Box
                  sx={{
                    px: 1.2,
                    py: 0.35,
                    borderRadius: "999px",
                    bgcolor: locationCfg.bg,
                    border: `1px solid ${locationCfg.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: locationCfg.color,
                      boxShadow: `0 0 10px ${locationCfg.color}`,
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: locationCfg.color,
                      letterSpacing: 0.3,
                    }}
                  >
                    {locationCfg.label}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Qty:{" "}
                  <Box
                    component="span"
                    sx={{
                      color: stock ? "warning.main" : "text.primary",
                      fontWeight: 600,
                    }}
                  >
                    {medicine.qty}
                  </Box>
                </Typography>
                {stock && (
                  <Chip
                    label={stock.label}
                    color={stock.color}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Fade>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [detailMed, setDetailMed] = useState(null);
  const [editMed, setEditMed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpload, setLastUpload] = useState(
    localStorage.getItem("lastUpload") || "Never",
  );
  const [lastDownload, setLastDownload] = useState(
    localStorage.getItem("lastDownload") || "Never",
  );
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (navigator.onLine) {
        await syncMedicines(setIsSyncing, setLastUpload, setLastDownload);
      }

      const freshData = await getAllMedicines();
      setMedicines(freshData.filter((m) => !m.deleted));

      console.log("تم تحديث البيانات بنجاح يدوياً!");
    } catch (error) {
      console.error("فشل التحديث اليدوي للبيانات", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  const [sortDirection, setSortDirection] = useState("desc");
  const LOCATION_FILTERS = ["All", "Stored", "Displayed"];

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOfflineStatus);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllMedicines();

        setMedicines(data.filter((m) => !m.deleted));
      } catch (error) {
        console.error("Failed to load medicines", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const startSync = async () => {
      if (navigator.onLine) {
        await syncMedicines(setIsSyncing, setLastUpload, setLastDownload);

        const freshData = await getAllMedicines();
        setMedicines(freshData.filter((m) => !m.deleted));
      }
    };

    startSync();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      await syncMedicines(setIsSyncing, setLastUpload, setLastDownload);
      const freshData = await getAllMedicines();

      setMedicines(freshData.filter((m) => !m.deleted));
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const filtered = useMemo(() => {
    const result = medicines.filter((m) => {
      if (m.deleted) return false;

      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === "All" || m.type === filterType;

      const matchLocation =
        locationFilter === "All" ||
        (locationFilter === "Stored" && m.location === "مخزون") ||
        (locationFilter === "Displayed" && m.location === "معروض");

      return matchSearch && matchType && matchLocation;
    });

    return result.sort((a, b) => {
      if (sortDirection === "desc") {
        return b.costPrice - a.costPrice;
      } else {
        return a.costPrice - b.costPrice;
      }
    });
  }, [medicines, search, filterType, locationFilter, sortDirection]);

  const totals = useMemo(() => {
    let totalCost = 0;
    let totalSell = 0;

    filtered.forEach((m) => {
      totalCost += (m.costPrice || 0) * (m.qty || 0);
      totalSell += (m.sellPrice || 0) * (m.qty || 0);
    });

    const expectedProfit = totalSell - totalCost;

    return {
      totalCost: totalCost.toFixed(2),
      totalSell: totalSell.toFixed(2),
      expectedProfit: expectedProfit.toFixed(2),
    };
  }, [filtered]);

  const handleAdd = async (form) => {
    const newMedicine = {
      ...form,
      id: uuidv4(),
      qty: Number(form.qty),
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      updatedAt: new Date().toISOString(),
      deleted: false,
      synced: false,
    };

    await saveMedicineDB(newMedicine);

    setMedicines((prev) => [...prev, newMedicine]);

    if (navigator.onLine) {
      await syncMedicines();
      // تأكيد مزامنة البيانات النهائية في الـ State
      const freshData = await getAllMedicines();
      setMedicines(freshData.filter((m) => !m.deleted));
    }
  };

  const handleEdit = async (form) => {
    const updatedMedicine = {
      ...editMed,
      ...form,
      qty: Number(form.qty),
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveMedicineDB(updatedMedicine);

    setMedicines((prev) =>
      prev.map((m) => (m.id === editMed.id ? updatedMedicine : m)),
    );
    setEditMed(null);

    if (navigator.onLine) {
      await syncMedicines();
      const freshData = await getAllMedicines();
      setMedicines(freshData.filter((m) => !m.deleted));
    }
  };

  const handleDelete = async (id) => {
    const med = medicines.find((m) => m.id === id);
    if (!med) return;

    const deletedMedicine = {
      ...med,
      deleted: true,
      synced: false,
      updatedAt: new Date().toISOString(),
    };

    await saveMedicineDB(deletedMedicine);

    setMedicines((prev) => prev.filter((m) => m.id !== id));

    if (navigator.onLine) {
      await syncMedicines();
      // تأكيد مزامنة البيانات النهائية في الـ State
      const freshData = await getAllMedicines();
      setMedicines(freshData.filter((m) => !m.deleted));
    }
  };
  const openEdit = (med) => {
    setEditMed({
      ...med,
      qty: String(med.qty),
      costPrice: String(med.costPrice),
      sellPrice: String(med.sellPrice),
    });
  };
  const handleDecreaseQty = async (medicine) => {
    if (medicine.qty <= 0) return;

    const updatedMedicine = {
      ...medicine,
      qty: medicine.qty - 1,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveMedicineDB(updatedMedicine);

    setMedicines((prev) =>
      prev.map((m) => (m.id === medicine.id ? updatedMedicine : m)),
    );

    setDetailMed(updatedMedicine);

    if (navigator.onLine) {
      await syncMedicines();

      const freshData = await getAllMedicines();

      setMedicines(freshData.filter((m) => !m.deleted));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        {/* App Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(148,163,184,0.08)",
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(37,99,235,0.15)",
                color: "primary.light",
                borderRadius: "12px",
                width: 38,
                height: 38,
              }}
            >
              <PharmacyIcon sx={{ fontSize: 20 }} />
            </Avatar>

            <Box sx={{ mr: "auto" }}>
              {" "}
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: 16, sm: 18 }, lineHeight: 1.2 }}
              >
                أبو يحيى فارم
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                bgcolor: isOnline
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(239,68,68,0.1)",
                color: isOnline ? "#4ade80" : "#f87171",
                px: 1.2,
                py: 0.5,
                borderRadius: "20px",
                border: `1px solid ${
                  isOnline ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"
                }`,
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 500,
              }}
            >
              {/* النقطة المضيئة */}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: isOnline ? "#22c55e" : "#ef4444",
                  // تأثير نبض خفيف للنقطة عشان يعطي حيوية
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": { transform: "scale(0.95)", opacity: 0.7 },
                    "50%": { transform: "scale(1.1)", opacity: 1 },
                    "100%": { transform: "scale(0.95)", opacity: 0.7 },
                  },
                }}
              />
              {/* الكلمة (تختفي في الشاشات الصغيرة جداً للمحافظة على المساحة) */}
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {isOnline ? "Connected" : "Disconnected"}
              </Box>
            </Box>

            <IconButton
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              size="small"
              sx={{
                color: "primary.light",
                bgcolor: "rgba(255,255,255,0.03)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                ml: "auto",
              }}
            >
              {isSyncing ? (
                <CircularProgress size={16} sx={{ color: "primary.light" }} />
              ) : (
                <>
                  <Typography
                    sx={{ fontSize: 10, color: "primary.light", opacity: 0.7 }}
                  >
                    Sent : {lastUpload}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 10, color: "primary.light", opacity: 0.7 }}
                  >
                    Received : {lastDownload}
                  </Typography>
                </>
              )}
            </Box>
            <Chip
              label={`${medicines.length} items`}
              size="small"
              sx={{
                bgcolor: "rgba(37,99,235,0.12)",
                color: "primary.light",
                fontWeight: 600,
                fontSize: 12,
              }}
            />
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 12, maxWidth: 600, mx: "auto" }}>
          {/* Search */}
          <Box
            sx={{
              position: "sticky",
              top: 50,
              zIndex: 10,
              bgcolor: "rgba(15, 23, 42, 0.75)", // نفس خلفية التطبيق الداكنة مع شفافية
              backdropFilter: "blur(8px)", // تأثير الغباش الفخم عشان الأدوية تمر من تحته بنعومة
              pt: 2, // مسافة من الأعلى
              pb: 1.5, // مسافة من الأسفل لمنع الالتصاق بالفلاتر
              mx: -2, // ليمتد البوكس الشفاف على كامل عرض الشاشة (لو كان عندك Padding في الحاوية الأبوية)
              px: 2,
              mb: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search by medicine name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  bgcolor: "rgba(30, 41, 59, 0.5)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.05)" },
                  "&:hover fieldset": {
                    borderColor: "rgba(242, 210, 55, 0.2)",
                  },
                  "&.Mui-focused fieldset": { borderColor: "#f2d237" },
                },
              }}
            />
          </Box>

          {/* Filter */}
          <Box sx={{ pb: 2, display: "flex", gap: 1, alignItems: "center" }}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>

              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
                sx={{
                  borderRadius: "14px !important",
                  bgcolor: "rgba(15,23,42,0.6)",
                }}
              >
                {LOCATION_FILTERS.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                label="Filter by Type"
                onChange={(e) => setFilterType(e.target.value)}
                sx={{
                  borderRadius: "14px !important",
                  bgcolor: "rgba(15,23,42,0.6)",
                }}
              >
                {MEDICINE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t !== "All" && (
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          mr: 1,
                          color: getTypeConfig(t).color,
                          verticalAlign: "middle",
                        }}
                      >
                        {getTypeConfig(t).icon}
                      </Box>
                    )}
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() =>
                setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
              }
              startIcon={<Sort sx={{ fontSize: 18 }} />}
              endIcon={
                sortDirection === "desc" ? (
                  <ArrowDownward sx={{ fontSize: 14, color: "#ef4444" }} />
                ) : (
                  <ArrowUpward sx={{ fontSize: 14, color: "#4ade80" }} />
                )
              }
              sx={{
                whiteSpace: "nowrap",
                borderRadius: "14px",
                height: "40px",
                px: 2,
                borderColor: "rgba(148,163,184,0.2)",
                bgcolor: "rgba(15,23,42,0.4)",
                color: "text.primary",
                fontSize: 12,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#f2d237",
                  bgcolor: "rgba(245, 210, 55, 0.04)",
                },
              }}
            ></Button>
          </Box>

          <Box
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: "16px",
              bgcolor: "rgba(30, 41, 59, 0.5)", // لون داكن مريح ومتناسق مع الساس
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)", // تقسيم المساحة لـ 3 أعمدة متساوية
              gap: 1.5,
              textAlign: "center",
            }}
          >
            <Box
              sx={{ borderRight: "1px solid rgba(255,255,255,0.06)", pr: 0.5 }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: 11,
                  display: "block",
                  mb: 0.5,
                }}
              >
                Total Cost
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "#94a3b8",
                  fontWeight: "bold",
                  fontSize: { xs: 14, sm: 16 },
                }}
              >
                ILS {totals.totalCost}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#f2d237",
                  fontSize: 11,
                  display: "block",
                  mb: 0.5,
                  fontWeight: 500,
                }}
              >
                Est. Profit
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "#4ade80",
                  fontWeight: "bold",
                  fontSize: { xs: 14, sm: 16 },
                }}
              >
                ILS {totals.expectedProfit}
              </Typography>
            </Box>

            {/* Total Sales*/}
            <Box
              sx={{ borderRight: "1px solid rgba(255,255,255,0.06)", pr: 0.5 }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: 11,
                  display: "block",
                  mb: 0.5,
                }}
              >
                Total Value
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "#60a5fa",
                  fontWeight: "bold",
                  fontSize: { xs: 14, sm: 16 },
                }}
              >
                ILS {totals.totalSell}
              </Typography>
            </Box>
          </Box>
          {/* Count label */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 500 }}
            >
              {filtered.length}{" "}
              {filtered.length === 1 ? "medicine" : "medicines"}
            </Typography>
            {filterType !== "All" && (
              <Button
                size="small"
                onClick={() => setFilterType("All")}
                sx={{ fontSize: 12, color: "primary.light", p: 0, minWidth: 0 }}
              >
                Clear filter
              </Button>
            )}
          </Box>

          {/* Medicine Cards */}
          {filtered.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {filtered.map((m) => (
                <MedicineCard key={m.id} medicine={m} onClick={setDetailMed} />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", pt: 8, pb: 4 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(148,163,184,0.08)",
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  borderRadius: "20px",
                }}
              >
                <MedicationIcon
                  sx={{ fontSize: 32, color: "text.secondary" }}
                />
              </Avatar>
              <Typography sx={{ color: "text.secondary", fontWeight: 500 }}>
                No medicines found
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", opacity: 0.6 }}
              >
                {search
                  ? "Try a different search term"
                  : "Add your first medicine"}
              </Typography>
            </Box>
          )}
        </Box>

        {/* FAB */}
        <Fab
          color="primary"
          onClick={() => setAddOpen(true)}
          sx={{ position: "fixed", bottom: 28, right: 24 }}
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </Fab>

        {/* Add Dialog */}
        <MedicineFormDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSave={handleAdd}
        />

        {/* Edit Dialog */}
        {editMed && (
          <MedicineFormDialog
            open={Boolean(editMed)}
            onClose={() => setEditMed(null)}
            onSave={handleEdit}
            initial={editMed}
          />
        )}

        {/* Details Dialog */}
        <MedicineDetailsDialog
          open={Boolean(detailMed)}
          onClose={() => setDetailMed(null)}
          medicine={detailMed}
          onEdit={(med) => {
            setDetailMed(null);
            openEdit(med);
          }}
          onDelete={handleDelete}
          onDecreaseQty={handleDecreaseQty}
        />
        <Backdrop
          sx={{
            color: "#f2d237",
            zIndex: (theme) => theme.zIndex.drawer + 1,
            flexDirection: "column",
            gap: 2,
            backdropFilter: "blur(4px)",
            bgcolor: "rgba(15, 23, 42, 0.7)",
          }}
          open={isSyncing}
        >
          <CircularProgress color="inherit" size={50} thickness={4} />
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: 0.5,
            }}
          >
            باشا ثواني بجيبلك اخر بيانات قاعد
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
            }}
          ></Typography>
        </Backdrop>
      </Box>
    </ThemeProvider>
  );
}
