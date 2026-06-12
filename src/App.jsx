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
  "Ointment",
  "Drops",
  "Ampoule",
  "Others",
];

const TYPE_CONFIG = {
  Tablets: {
    icon: <MedicationIcon />,
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
  },
  Syrup: {
    icon: <ScienceIcon />,
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
  },
  Ointment: {
    icon: <MedicalIcon />,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
  },
  Drops: { icon: <DropsIcon />, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  Ampoule: {
    icon: <VaccinesIcon />,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
  },
  Others: {
    icon: <MedicalServices />,
    color: "#94A3B8",
    bg: "rgba(148,163,184,0.12)",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || {
    icon: <PharmacyIcon />,
    color: "#94A3B8",
    bg: "rgba(148,163,184,0.12)",
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

function MedicineDetailsDialog({ open, onClose, medicine, onEdit, onDelete }) {
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
              label: "Cost Price",
              value: `ILS ${medicine.costPrice.toFixed(2)}`,
              icon: <MoneyIcon sx={{ fontSize: 16 }} />,
            },
            {
              label: "Sell Pri.ce",
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
      <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
        <Button
          onClick={() => {
            onDelete(medicine.id);
            onClose();
          }}
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          sx={{ flex: 1 }}
        >
          Delete
        </Button>
        <Button
          onClick={() => {
            onEdit(medicine);
            onClose();
          }}
          variant="contained"
          startIcon={<EditIcon />}
          sx={{ flex: 2 }}
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Medicine Card ────────────────────────────────────────────────────────────

function MedicineCard({ medicine, onClick }) {
  const cfg = getTypeConfig(medicine.type);
  const stock = getLowStockStatus(medicine.qty);

  return (
    <Fade in timeout={300}>
      <Card elevation={0}>
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
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {medicine.type}
                </Typography>
                {medicine.company && (
                  <>
                    <Box
                      sx={{
                        width: 3,
                        height: 3,
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
  const [filterType, setFilterType] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [detailMed, setDetailMed] = useState(null);
  const [editMed, setEditMed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (navigator.onLine) {
        await syncMedicines();
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
        await syncMedicines();

        const freshData = await getAllMedicines();

        setMedicines(freshData.filter((m) => !m.deleted));
      }
    };

    startSync();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      await syncMedicines();

      const freshData = await getAllMedicines();

      setMedicines(freshData.filter((m) => !m.deleted));
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      if (m.deleted) return false;

      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === "All" || m.type === filterType;

      return matchSearch && matchType;
    });
  }, [medicines, search, filterType]);
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
                Yahya Pharmacy
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: 11 }}
              >
                Inventory Management
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
                border: `1px solid ${isOnline ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
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
          <Box sx={{ pt: 2.5, pb: 1.5 }}>
            <TextField
              fullWidth
              placeholder="Search medicines…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Filter */}
          <Box sx={{ pb: 2 }}>
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
        />
      </Box>
    </ThemeProvider>
  );
}
