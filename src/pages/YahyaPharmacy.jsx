import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
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
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Vaccines as VaccinesIcon,
  Science as ScienceIcon,
  Medication as MedicationIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Inventory2 as InventoryIcon,
  MedicalServices,
  LocalPharmacy,
  Liquor,
  WaterDrop,
  Healing,
  Colorize,
  Opacity,
  Sort,
  ArrowDownward,
  ArrowUpward,
  Delete,
  Layers,
  FormatListNumbered,
  QrCodeScanner,
} from "@mui/icons-material";
import { getAllMedicines, saveMedicineDB } from "../db";
import { getMedicinePharmacy } from "../salesLogic";
import { v4 as uuidv4 } from "uuid";
import { syncMedicines } from "../sync";
import QrScannerDialog from "../QrScanner.jsx";
import { QrCodeScanner as QrCodeScannerIcon } from "@mui/icons-material";
// ─── Theme ───────────────────────────────────────────────────────────────────

const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#F6F8FB", paper: "#FFFFFF" },
    primary: {
      main: "#2563EB",
      light: "#3B82F6",
      dark: "#1D4ED8",
      contrastText: "#fff",
    },
    success: { main: "#0F9F6E" },
    warning: { main: "#D97706" },
    error: { main: "#DC2626" },
    info: { main: "#0891B2" },
    text: { primary: "#172033", secondary: "#667085" },
    divider: "#E7ECF3",
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    h6: { fontWeight: 800, letterSpacing: "-0.025em" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { background: "#F6F8FB", WebkitFontSmoothing: "antialiased" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#FFFFFF",
          border: "1px solid #E8EDF4",
          borderRadius: 18,
          boxShadow: "0 5px 22px rgba(15,23,42,0.045)",
          transition:
            "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
          "&:hover": {
            borderColor: "#D7E1F0",
            transform: "translateY(-2px)",
            boxShadow: "0 12px 30px rgba(15,23,42,0.075)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "#FFFFFF",
          borderRadius: 24,
          border: "1px solid #E7ECF3",
          boxShadow: "0 24px 70px rgba(15,23,42,0.16)",
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 13,
            background: "#FBFCFE",
            "& fieldset": { borderColor: "#E1E7EF" },
            "&:hover fieldset": { borderColor: "#B9C8DC" },
            "&.Mui-focused fieldset": {
              borderColor: "#2563EB",
              borderWidth: 1.5,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 13 },
        outlined: { borderRadius: 13 },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 17,
          width: 58,
          height: 58,
          boxShadow: "0 12px 28px rgba(37,99,235,0.24)",
          "&:hover": { boxShadow: "0 16px 34px rgba(37,99,235,0.3)" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 11, fontWeight: 700, textTransform: "none" },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 8px 20px rgba(37,99,235,0.18)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9, fontWeight: 700, fontSize: 11 },
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
  "Suppository",
  "Cream",
  "Oint",
  "Emulgel",
  "Others",
];

const TYPE_CONFIG = {
  Tablets: {
    icon: <LocalPharmacy fontSize="small" />,
    color: "#3B82F6",
    bg: "#EEF4FF",
  },
  Syrup: {
    icon: <Liquor fontSize="small" />,
    color: "#10B981",
    bg: "#EAFBF4",
  },
  Drops: {
    icon: <WaterDrop fontSize="small" />,
    color: "#06B6D4",
    bg: "#EAF9FC",
  },
  Ampoule: {
    icon: <VaccinesIcon fontSize="small" />,
    color: "#8B5CF6",
    bg: "#F3EEFF",
  },
  Suppository: {
    icon: <MedicalServices fontSize="small" />,
    color: "#F97316",
    bg: "#FFF2E8",
  },
  Cream: {
    icon: <Healing fontSize="small" />,
    color: "#EC4899",
    bg: "#FCEEF6",
  },
  Oint: {
    icon: <Colorize fontSize="small" />,
    color: "#F59E0B",
    bg: "#FFF7E8",
  },
  Emulgel: {
    icon: <Opacity fontSize="small" />,
    color: "#14B8A6",
    bg: "#EAFBF8",
  },

  Others: {
    icon: <MedicationIcon fontSize="small" />,
    color: "#64748B",
    bg: "#F1F3F6",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const normalizeQr = (value) => String(value || "").trim();

const getTypeConfig = (type) => {
  return TYPE_CONFIG[type] || TYPE_CONFIG.Others;
};

const getLowStockStatus = (stockUnits) => {
  const stock = Number(stockUnits) || 0;

  if (stock <= 5) return { label: "Low Stock", color: "error" };
  if (stock <= 10) return { label: "Limited", color: "warning" };

  return null;
};

const formatStockUnits = (medicine) => {
  const stock = Math.max(0, Number(medicine?.stockUnits) || 0);

  const isStripType = ["Tablets", "Ampoule", "Suppository"].includes(
    medicine?.type,
  );

  if (!isStripType) {
    return `${stock} Units`;
  }

  const stripsPerBox = Number(medicine?.stripsPerBox) || 0;
  const pillsPerStrip = Number(medicine?.pillsPerStrip) || 0;

  if (stripsPerBox <= 0 || pillsPerStrip <= 0) {
    return `${stock} Units`;
  }

  const unitsPerBox = stripsPerBox * pillsPerStrip;

  const boxes = Math.floor(stock / unitsPerBox);
  const remainderAfterBoxes = stock % unitsPerBox;

  const strips = Math.floor(remainderAfterBoxes / pillsPerStrip);
  const pills = remainderAfterBoxes % pillsPerStrip;

  const parts = [];

  if (boxes > 0) parts.push(`${boxes} Boxes`);
  if (strips > 0) parts.push(`${strips} Strips`);
  if (pills > 0) parts.push(`${pills} Pills`);

  return parts.length > 0 ? parts.join(" + ") : "0 Pills";
};
// ─── Add/Edit Dialog ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  type: "",
  stockUnits: "",
  qrCode: "",
  stripsPerBox: "",
  pillsPerStrip: "",
  costPrice: "",
  sellPrice: "",
  company: "",
  location: "معروض",
  expDate: "",
};

function MedicineFormDialog({ open, onClose, onSave, initial, onOpenScanner }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const isEdit = Boolean(initial);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid =
    form.name.trim() &&
    form.type &&
    form.stockUnits !== "" &&
    Number(form.stockUnits) >= 0 &&
    form.costPrice !== "" &&
    form.sellPrice !== "";

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
          pb: 1.5,
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
          pb: 1.5,
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
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            label="QR / Barcode"
            value={form.qrCode || ""}
            onChange={set("qrCode")}
            fullWidth
            size="small"
            placeholder="امسح أو اكتب الكود"
          />
          <IconButton
            color="primary"
            onClick={() => onOpenScanner && onOpenScanner()}
            sx={{
              bgcolor: "#EEF4FF",
              color: "#2563EB",
              borderRadius: "12px",
              p: 1,
              "&:hover": { bgcolor: "#E2EBFF" },
            }}
          >
            <QrCodeScanner />{" "}
            {/* قم باستيراد QrCodeScanner من @mui/icons-material */}
          </IconButton>
        </Box>
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
          label="Stock Units"
          value={form.stockUnits}
          onChange={set("stockUnits")}
          required
          fullWidth
          size="small"
          type="number"
          inputProps={{ min: 0, step: 1 }}
          helperText={
            ["Tablets", "Ampoule", "Suppository"].includes(form.type)
              ? "Enter the total number of pills/units in stock"
              : "Enter the total number of units in stock"
          }
        />
        {["Tablets", "Ampoule", "Suppository"].includes(form.type) && (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <TextField
                label="Strips Per Box"
                value={form.stripsPerBox}
                onChange={set("stripsPerBox")}
                size="small"
                type="number"
              />

              <TextField
                label="Pills Per Strip"
                value={form.pillsPerStrip}
                onChange={set("pillsPerStrip")}
                size="small"
                type="number"
              />
            </Box>
          </>
        )}
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
  isAdmin,
}) {
  if (!medicine) return null;
  const cfg = getTypeConfig(medicine.type);
  const stock = getLowStockStatus(medicine.stockUnits);

  const totalSellPerBox = ["Tablets", "Ampoule", "Suppository"].includes(
    medicine.type,
  )
    ? (medicine.sellPrice || 0) * (medicine.stripsPerBox || 1)
    : medicine.sellPrice || 0;

  const margin =
    medicine.costPrice > 0
      ? (
          ((totalSellPerBox - medicine.costPrice) / medicine.costPrice) *
          100
        ).toFixed(0)
      : "0";

  const displayValue = (val) =>
    val !== undefined && val !== null && val !== "" ? val : "Unknown";

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
                width: 48,
                height: 48,
                borderRadius: "14px",
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
              label: "Stock",
              value: formatStockUnits(medicine),
              icon: <InventoryIcon sx={{ fontSize: 16 }} />,
            },
            {
              label: "Cost",
              value: `ILS ${
                medicine.costPrice ? medicine.costPrice.toFixed(2) : "0.00"
              }`,
              icon: <MoneyIcon sx={{ fontSize: 16 }} />,
            },
            {
              label: "Sell",
              value: `ILS ${
                medicine.sellPrice ? medicine.sellPrice.toFixed(2) : "0.00"
              }`,
              icon: <MoneyIcon sx={{ fontSize: 16 }} />,
            },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                background: "#F8FAFC",
                borderRadius: "14px",
                p: 1.5,
                border: "1px solid #E8EDF4",
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

          {(medicine.type === "Tablets" ||
            medicine.type === "Ampoule" ||
            medicine.type === "Suppository") && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Layers sx={{ color: "text.secondary", fontSize: 18 }} />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Strips Per Box
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {displayValue(medicine.stripsPerBox)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <FormatListNumbered
                  sx={{ color: "text.secondary", fontSize: 18 }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Pills Per Strip
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {displayValue(medicine.pillsPerStrip)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <LocalPharmacy sx={{ color: "text.secondary", fontSize: 18 }} />
              </Box>
            </>
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
        {isAdmin && (
          <Button
            onClick={() => {
              onEdit(medicine);
              onClose();
            }}
          >
            Edit Medicine
          </Button>
        )}

        <Box
          sx={{
            width: "100%",
            display: "flex",
            gap: 1,
          }}
        >
          {isAdmin && (
            <Button
              onClick={() => {
                onDelete(medicine);
                onClose();
              }}
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              sx={{ flex: 1 }}
            >
              Delete
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ─── Medicine Card ────────────────────────────────────────────────────────────

const MedicineCard = React.memo(({ medicine, onClick }) => {
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
  const stock = getLowStockStatus(medicine.stockUnits);
  const displayValue = (val) =>
    val !== undefined && val !== null && val !== "" ? val : "Unknown";

  const handleClick = React.useCallback(() => {
    onClick(medicine);
  }, [medicine, onClick]);
  return (
    <Card
      elevation={0}
      sx={{
        transition: "none",
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
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: medicine.location === "مخزون" ? "#F59E0B" : "#0F9F6E",
        },
      }}
    >
      <CardActionArea
        disableRipple
        disableTouchRipple
        onClick={handleClick}
        sx={{ p: 0 }}
      >
        <CardContent
          sx={{
            p: "17px 18px !important",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: cfg.bg,
              color: cfg.color,
              width: 50,
              height: 50,
              borderRadius: "15px",
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
                  fontWeight: 750,
                  fontSize: 14.5,
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
                  color: "#1D4ED8",
                  flexShrink: 0,
                }}
              >
                ILS{" "}
                {medicine.sellPrice ? medicine.sellPrice.toFixed(2) : "0.00"}
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
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
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
                  px: 1.25,
                  py: 0.45,
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
                Stock:{" "}
                <Box
                  component="span"
                  sx={{
                    color: stock ? "warning.main" : "text.primary",
                    fontWeight: 600,
                  }}
                >
                  {formatStockUnits(medicine)}
                </Box>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
});

// ─── App ──────────────────────────────────────────────────────────────────────

export default function InventoryPage({ selectedPharmacy = "old" }) {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [detailMed, setDetailMed] = useState(null);
  const [editMed, setEditMed] = useState(null);
  const [deleteMed, setDeleteMed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState("search");
  const [scannedQr, setScannedQr] = useState("");
  const [editScannedQr, setEditScannedQr] = useState("");
  const [qrMatches, setQrMatches] = useState([]);

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);

    const qrCode = normalizeQr(decodedText);

    if (!qrCode) return;

    if (scanTarget === "search") {
      const matches = medicines.filter(
        (m) => !m.deleted && normalizeQr(m.qrCode) === qrCode,
      );

      if (matches.length === 1) {
        // QR موجود لدواء واحد فقط
        setDetailMed(matches[0]);
      } else if (matches.length > 1) {
        // نفس QR موجود في أكثر من Location
        setQrMatches(matches);
      } else {
        setSearch(qrCode);
        alert("No medicine found with this QR Code");
      }
    } else if (scanTarget === "add") {
      setScannedQr(qrCode);
      setAddOpen(true);
    } else if (scanTarget === "edit") {
      setEditScannedQr(qrCode);
    }
  };
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpload, setLastUpload] = useState(
    localStorage.getItem("lastUpload") || "Never",
  );
  const [lastDownload, setLastDownload] = useState(
    localStorage.getItem("lastDownload") || "Never",
  );
  const ADMIN_PASSWORD = "05975520140598765139";

  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("app_role") === "admin",
  );

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const [inputPassword, setInputPassword] = useState("");

  const handleAdminAccess = () => {
    if (isAdmin) {
      const confirmLogout = window.confirm("لا إله إلا الله ليش بدك تطلع ؟");

      if (confirmLogout) {
        localStorage.setItem("app_role", "viewer");
        setIsAdmin(false);
      }

      return;
    }

    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = () => {
    if (inputPassword === ADMIN_PASSWORD) {
      localStorage.setItem("app_role", "admin");
      setIsAdmin(true);
      setShowPasswordDialog(false);
      setInputPassword("");
    } else {
      alert("خخخخخخخخ كلمة السر غلط ");
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (navigator.onLine) {
        await syncMedicines(setIsSyncing, setLastUpload, setLastDownload);
      }

      const freshData = await getAllMedicines();
      setMedicines(getCurrentPharmacyMedicines(freshData));
    } catch (error) {
      console.error("فشل التحديث اليدوي للبيانات", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const [sortDirection, setSortDirection] = useState("desc");
  const LOCATION_FILTERS = ["All", "Stored", "Displayed"];

  const getCurrentPharmacyMedicines = useCallback(
    (data) =>
      data.filter(
        (m) => !m.deleted && getMedicinePharmacy(m) === selectedPharmacy,
      ),
    [selectedPharmacy],
  );

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

        setMedicines(getCurrentPharmacyMedicines(data));
      } catch (error) {
        console.error("Failed to load medicines", error);
      }
    };

    loadData();
  }, [getCurrentPharmacyMedicines]);

  useEffect(() => {
    if (!navigator.onLine) return;

    setTimeout(async () => {
      await syncMedicines(setIsSyncing, setLastUpload, setLastDownload);

      const freshData = await getAllMedicines();
      setMedicines(getCurrentPharmacyMedicines(freshData));
    }, 1000);
  }, [getCurrentPharmacyMedicines]);

  useEffect(() => {
    const handleOnline = async () => {
      await syncMedicines(setIsSyncing, setLastUpload, setLastDownload);
      const freshData = await getAllMedicines();

      setMedicines(getCurrentPharmacyMedicines(freshData));
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const result = medicines.filter((m) => {
      if (m.deleted) return false;

      // المطابقة بالاسم أو بـ الـ QR Code
      const matchSearch =
        m.name.toLowerCase().includes(searchText) ||
        (m.qrCode && m.qrCode.toLowerCase().includes(searchText));

      const matchType = filterType === "All" || m.type === filterType;
      const matchLocation =
        locationFilter === "All" ||
        (locationFilter === "Stored" && m.location === "مخزون") ||
        (locationFilter === "Displayed" && m.location === "معروض");

      return matchSearch && matchType && matchLocation;
    });

    return result.sort((a, b) => {
      return sortDirection === "desc"
        ? b.costPrice - a.costPrice
        : a.costPrice - b.costPrice;
    });
  }, [medicines, search, filterType, locationFilter, sortDirection]);

  const totals = useMemo(() => {
    let totalCost = 0;
    let totalSell = 0;

    filtered.forEach((m) => {
      const stockUnits = Number(m.stockUnits) || 0;
      const cost = Number(m.costPrice) || 0;
      const unitSell = Number(m.sellPrice) || 0;

      const isStripType = ["Tablets", "Ampoule", "Suppository"].includes(
        m.type,
      );

      const stripsPerBox = isStripType ? Number(m.stripsPerBox) || 1 : 1;

      const pillsPerStrip = isStripType ? Number(m.pillsPerStrip) || 1 : 1;

      const unitsPerBox = stripsPerBox * pillsPerStrip;

      const costPerBaseUnit = cost / unitsPerBox;
      const sellPerBaseUnit = unitSell / pillsPerStrip;

      totalCost += stockUnits * costPerBaseUnit;
      totalSell += stockUnits * sellPerBaseUnit;
    });

    return {
      totalCost: totalCost.toFixed(2),
      totalSell: totalSell.toFixed(2),
      expectedProfit: (totalSell - totalCost).toFixed(2),
    };
  }, [filtered]);
  const handleAdd = async (form) => {
    if (!isAdmin) return;

    const qrCode = normalizeQr(form.qrCode);

    if (qrCode) {
      const exists = medicines.find(
        (m) =>
          normalizeQr(m.qrCode) === qrCode &&
          m.location === form.location &&
          getMedicinePharmacy(m) === selectedPharmacy,
      );

      if (exists) {
        alert("QR Code already exists in this location");
        return;
      }
    }
    const newMedicine = {
      ...form,
      id: uuidv4(),

      pharmacy: selectedPharmacy,

      stockUnits: Number(form.stockUnits),
      qrCode,
      stripsPerBox: Number(form.stripsPerBox) || 0,
      pillsPerStrip: Number(form.pillsPerStrip) || 0,

      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),

      updatedAt: new Date().toISOString(),
      deleted: false,
      synced: false,
    };

    await saveMedicineDB(newMedicine);

    setMedicines((prev) => [...prev, newMedicine]);

    if (navigator.onLine) {
      syncMedicines().catch(console.error);
    }
  };

  const handleEdit = async (form) => {
    if (!isAdmin) return;

    const qrCode = normalizeQr(form.qrCode);

    if (qrCode) {
      const exists = medicines.find(
        (m) =>
          normalizeQr(m.qrCode) === qrCode &&
          m.location === form.location &&
          m.id !== editMed.id,
      );

      if (exists) {
        alert("QR Code already exists in this location");
        return;
      }
    }

    const updatedMedicine = {
      ...editMed,
      ...form,

      pharmacy: selectedPharmacy,

      stockUnits: Number(form.stockUnits),
      qrCode,
      stripsPerBox: Number(form.stripsPerBox) || 0,
      pillsPerStrip: Number(form.pillsPerStrip) || 0,

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
    setEditScannedQr("");

    if (navigator.onLine) {
      syncMedicines().catch(console.error);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
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
      syncMedicines().catch(console.error);
    }
  };
  const openEdit = (med) => {
    setEditScannedQr("");

    setEditMed({
      ...med,

      stockUnits: String(med.stockUnits ?? ""),
      stripsPerBox: String(med.stripsPerBox ?? ""),
      pillsPerStrip: String(med.pillsPerStrip ?? ""),

      costPrice: String(med.costPrice ?? ""),
      sellPrice: String(med.sellPrice ?? ""),
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F6F8FB",
          backgroundImage:
            "radial-gradient(circle at 50% -8%, rgba(37,99,235,0.055), transparent 32%)",
        }}
      >
        {/* Main Content */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 12, maxWidth: 760, mx: "auto" }}>
          {/* Search */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              bgcolor: "rgba(246,248,251,0.88)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              pt: 2,
              pb: 1.75,
              mx: -2,
              px: 2,
              mb: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search by medicine name or QR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setScanTarget("search");
                          setShowScanner(true);
                        }}
                        title="Scan Medicine QR"
                        sx={{
                          color: "#2563EB",
                          bgcolor: "#EEF4FF",
                          borderRadius: "10px",
                        }} // لون ذهبي متناسق مع تصميمك
                      >
                        <QrCodeScannerIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "15px",
                  bgcolor: "#FFFFFF",
                  boxShadow: "0 7px 24px rgba(15,23,42,0.055)",
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#C7D2E2" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563EB",
                    borderWidth: 1.5,
                  },
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
                  bgcolor: "#FFFFFF",
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
                  bgcolor: "#FFFFFF",
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
                  <ArrowDownward sx={{ fontSize: 14, color: "#DC2626" }} />
                ) : (
                  <ArrowUpward sx={{ fontSize: 14, color: "#0F9F6E" }} />
                )
              }
              sx={{
                whiteSpace: "nowrap",
                borderRadius: "14px",
                height: "40px",
                px: 2,
                borderColor: "#DDE5EF",
                bgcolor: "#FFFFFF",
                color: "text.primary",
                fontSize: 12,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#BFD0EA",
                  bgcolor: "#F8FAFF",
                },
              }}
            ></Button>
          </Box>

          <Box
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: "16px",
              bgcolor: "#FFFFFF",
              border: "1px solid #E7ECF3",
              boxShadow: "0 7px 24px rgba(15,23,42,0.045)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1.5,
              textAlign: "center",
            }}
          >
            <Box sx={{ borderRight: "1px solid #E7ECF3", pr: 0.5 }}>
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
                  color: "#475467",
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
                onClick={handleAdminAccess}
                sx={{
                  color: "#2563EB",
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
                  color: "#0F9F6E",
                  fontWeight: "bold",
                  fontSize: { xs: 14, sm: 16 },
                }}
              >
                ILS {totals.expectedProfit}
              </Typography>
            </Box>

            {/* Total Sales*/}
            <Box sx={{ borderRight: "1px solid #E7ECF3", pr: 0.5 }}>
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
                  color: "#2563EB",
                  fontWeight: "bold",
                  fontSize: { xs: 14, sm: 16 },
                }}
              >
                ILS {totals.totalSell}
              </Typography>
            </Box>
          </Box>

          <Button
            variant={isAdmin ? "contained" : "outlined"}
            fullWidth
            onClick={handleAdminAccess}
            sx={{
              mb: 2,
              borderRadius: "12px",
              minHeight: 44,
              textTransform: "none",
            }}
          >
            {isAdmin ? "Admin Mode ✓" : "Admin Login"}
          </Button>
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

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                disabled={isRefreshing}
                onClick={handleManualRefresh}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  borderColor: "#DCE4EE",
                }}
              >
                {isRefreshing ? "Syncing..." : "Sync"}
              </Button>

              {filterType !== "All" && (
                <Button
                  size="small"
                  onClick={() => setFilterType("All")}
                  sx={{
                    fontSize: 12,
                    color: "primary.light",
                    p: 0,
                    minWidth: 0,
                  }}
                >
                  Clear filter
                </Button>
              )}
            </Box>
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
        {isAdmin && (
          <Fab
            color="primary"
            onClick={() => setAddOpen(true)}
            sx={{
              position: "fixed",
              bottom: { xs: 82, sm: 28 },
              right: { xs: 18, sm: 28 },
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>
        )}

        {/* Add Dialog */}
        <MedicineFormDialog
          open={addOpen}
          onClose={() => {
            setAddOpen(false);
            setScannedQr("");
          }}
          onSave={handleAdd}
          initial={scannedQr ? { ...EMPTY_FORM, qrCode: scannedQr } : null}
          onOpenScanner={() => {
            setScanTarget("add");
            setShowScanner(true);
          }}
        />

        {/* Edit Dialog */}
        {editMed && (
          <MedicineFormDialog
            open={Boolean(editMed)}
            onClose={() => {
              setEditMed(null);
              setEditScannedQr("");
            }}
            onSave={handleEdit}
            initial={
              editScannedQr ? { ...editMed, qrCode: editScannedQr } : editMed
            }
            onOpenScanner={() => {
              setScanTarget("edit");
              setShowScanner(true);
            }}
          />
        )}
        {qrMatches.length > 1 && (
          <Dialog
            open={true}
            onClose={() => setQrMatches([])}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>Select Location</DialogTitle>

            <DialogContent>
              <Typography sx={{ mb: 2, color: "text.secondary" }}>
                This QR Code exists in more than one location.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {qrMatches.map((medicine) => (
                  <Button
                    key={medicine.id}
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setQrMatches([]);
                      setDetailMed(medicine);
                    }}
                  >
                    {medicine.location === "معروض" ? "Displayed" : "Stored"}
                  </Button>
                ))}
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setQrMatches([])}>Cancel</Button>
            </DialogActions>
          </Dialog>
        )}
        <QrScannerDialog
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScanSuccess}
        />
        {/* Details Dialog */}
        {/* Details Dialog */}
        <MedicineDetailsDialog
          isAdmin={isAdmin}
          open={Boolean(detailMed)}
          onClose={() => setDetailMed(null)}
          medicine={detailMed}
          onEdit={(med) => {
            setDetailMed(null);
            openEdit(med);
          }}
          onDelete={(medicine) => setDeleteMed(medicine)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={Boolean(deleteMed)}
          onClose={() => setDeleteMed(null)}
          fullWidth
          maxWidth="xs"
          TransitionComponent={Slide}
          TransitionProps={{ direction: "up" }}
        >
          <DialogTitle sx={{ pb: 1 }}>Delete Medicine?</DialogTitle>

          <DialogContent sx={{ pt: 1 }}>
            <Typography
              sx={{
                fontSize: 14,
                color: "text.secondary",
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to delete{" "}
              <Box
                component="span"
                sx={{
                  color: "text.primary",
                  fontWeight: 700,
                }}
              >
                {deleteMed?.name}
              </Box>
              ?
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                color: "text.secondary",
              }}
            >
              This action cannot be undone.
            </Typography>
          </DialogContent>

          <Divider sx={{ borderColor: "divider" }} />

          <DialogActions
            sx={{
              px: 3,
              pb: 3,
              pt: 2,
              gap: 1,
            }}
          >
            <Button
              onClick={() => setDeleteMed(null)}
              sx={{
                flex: 1,
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (!deleteMed) return;

                await handleDelete(deleteMed.id);

                setDeleteMed(null);
                setDetailMed(null);
              }}
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              sx={{
                flex: 1,
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Admin Access</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            type="password"
            label="Password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>

          <Button variant="contained" onClick={handlePasswordSubmit}>
            Login
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
