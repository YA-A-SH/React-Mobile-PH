import { useState, useMemo, useCallback } from "react";
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
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Collapse,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  MoneyOff as MoneyOffIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  WarningAmber as WarningIcon,
  LocalPharmacy as PharmacyIcon,
  Inventory2 as InventoryIcon,
} from "@mui/icons-material";

// ─── Theme (inherited + amber accent override) ────────────────────────────────

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0F172A", paper: "#1E293B" },
    primary: { main: "#D97706", light: "#F59E0B", dark: "#B45309" },
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
            border: "1px solid rgba(217,119,6,0.4)",
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
            "&:hover fieldset": { borderColor: "rgba(217,119,6,0.4)" },
            "&.Mui-focused fieldset": { borderColor: "#D97706" },
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          width: 60,
          height: 60,
          background: "#D97706",
          color: "#fff",
          boxShadow: "0 8px 32px rgba(217,119,6,0.45)",
          "&:hover": { background: "#B45309" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 600, textTransform: "none" },
        contained: {
          background: "#D97706",
          boxShadow: "none",
          "&:hover": {
            background: "#B45309",
            boxShadow: "0 4px 16px rgba(217,119,6,0.4)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: 11 },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "rgba(148,163,184,0.4)",
          "&.Mui-checked": { color: "#10B981" },
          padding: "6px",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          background: "#1E293B",
          border: "1px solid rgba(148,163,184,0.12)",
          borderRadius: 14,
        },
      },
    },
  },
});

// ─── Accent tokens (used inline for amber-specific styling) ───────────────────
const AMBER = {
  main: "#D97706",
  light: "#F59E0B",
  bg: "rgba(217,119,6,0.12)",
  bgHover: "rgba(217,119,6,0.2)",
};

// ─── Sample inventory (mirrors SAMPLE_MEDICINES from the main app) ────────────
// In production: import from your global medicines store / API.
const INVENTORY_MEDICINES = [
  { id: 1, name: "Amoxicillin 500mg", sellPrice: 18.0 },
  { id: 2, name: "Paracetamol Syrup", sellPrice: 9.5 },
  { id: 3, name: "Betamethasone Cream", sellPrice: 22.0 },
  { id: 4, name: "Ciprofloxacin 250mg", sellPrice: 30.0 },
  { id: 5, name: "Vitamin D3 Drops", sellPrice: 13.5 },
  { id: 6, name: "Metoclopramide Ampoule", sellPrice: 38.0 },
  { id: 7, name: "Ibuprofen 400mg", sellPrice: 15.0 },
  { id: 8, name: "Azithromycin Syrup", sellPrice: 21.0 },
  { id: 9, name: "Relaxon 5mg", sellPrice: 12.0 },
  { id: 10, name: "Panadol Extra", sellPrice: 8.0 },
];

// ─── Sample seed data ─────────────────────────────────────────────────────────

/** @type {Debtor[]} */
const SEED_DEBTORS = [
  {
    id: "d1",
    name: "Ahmad Al-Khalidi",
    phone: "0599-123-456",
    createdAt: "2026-05-01",
  },
  {
    id: "d2",
    name: "Sara Mansour",
    phone: "0591-789-012",
    createdAt: "2026-05-10",
  },
  { id: "d3", name: "Omar Haddad", phone: null, createdAt: "2026-06-01" },
];

/** @type {DebtRecord[]} */
const SEED_RECORDS = [
  {
    id: "r1",
    debtorId: "d1",
    medicineId: 9,
    medicineName: "Relaxon 5mg",
    boxes: 1,
    strips: 1,
    pills: 2,
    totalPrice: 15,
    date: "2026-06-15",
    isPaid: false,
    paidAt: null,
    createdAt: "2026-06-15T10:00:00",
  },
  {
    id: "r2",
    debtorId: "d1",
    medicineId: 10,
    medicineName: "Panadol Extra",
    boxes: 0,
    strips: 0,
    pills: 5,
    totalPrice: 8,
    date: "2026-06-10",
    isPaid: true,
    paidAt: "2026-06-12",
    createdAt: "2026-06-10T14:30:00",
  },
  {
    id: "r3",
    debtorId: "d2",
    medicineId: 1,
    medicineName: "Amoxicillin 500mg",
    boxes: 1,
    strips: 0,
    pills: 0,
    totalPrice: 18,
    date: "2026-06-18",
    isPaid: false,
    paidAt: null,
    createdAt: "2026-06-18T09:00:00",
  },
  {
    id: "r4",
    debtorId: "d2",
    medicineId: 7,
    medicineName: "Ibuprofen 400mg",
    boxes: 0,
    strips: 2,
    pills: 0,
    totalPrice: 12,
    date: "2026-06-14",
    isPaid: false,
    paidAt: null,
    createdAt: "2026-06-14T11:00:00",
  },
  {
    id: "r5",
    debtorId: "d3",
    medicineId: 2,
    medicineName: "Paracetamol Syrup",
    boxes: 2,
    strips: 0,
    pills: 0,
    totalPrice: 19,
    date: "2026-06-01",
    isPaid: false,
    paidAt: null,
    createdAt: "2026-06-01T08:00:00",
  },
];

// ─── Domain helpers ───────────────────────────────────────────────────────────

/** Sum unpaid records for a given debtorId */
const calcUnpaidAmount = (records, debtorId) =>
  records
    .filter((r) => r.debtorId === debtorId && !r.isPaid)
    .reduce((sum, r) => sum + r.totalPrice, 0);

/** Count unpaid records for a given debtorId */
const countUnpaid = (records, debtorId) =>
  records.filter((r) => r.debtorId === debtorId && !r.isPaid).length;

/** Format a quantity description like "1 Box, 2 Strips, 3 Pills" */
const formatQty = ({ boxes, strips, pills }) => {
  const parts = [];
  if (boxes > 0) parts.push(`${boxes} ${boxes === 1 ? "Box" : "Boxes"}`);
  if (strips > 0) parts.push(`${strips} ${strips === 1 ? "Strip" : "Strips"}`);
  if (pills > 0) parts.push(`${pills} ${pills === 1 ? "Pill" : "Pills"}`);
  return parts.length ? parts.join(", ") : "—";
};

/** Today's date in YYYY-MM-DD */
const todayISO = () => new Date().toISOString().split("T")[0];

/** Generate a simple unique ID */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Inventory deduction placeholder ─────────────────────────────────────────
/**
 * TODO: Inventory Deduction
 * Called after a new DebtRecord is successfully created.
 * @param {number} medicineId
 * @param {{ boxes: number, strips: number, pills: number }} qty
 */
// eslint-disable-next-line no-unused-vars
function deductFromInventory(medicineId, qty) {
  // TODO: Connect to the medicines store/API.
  // Example:
  //   const totalUnits = qty.boxes * UNITS_PER_BOX + qty.strips * UNITS_PER_STRIP + qty.pills;
  //   updateMedicineQty(medicineId, -totalUnits);
  console.warn(
    "[Inventory] Deduction not yet implemented for medicine:",
    medicineId,
    qty,
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, accent }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        background: "rgba(15,23,42,0.5)",
        border: `1px solid ${accent}22`,
        borderRadius: "14px",
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.75, color: accent }}
      >
        {icon}
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontSize: 11, fontWeight: 500 }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 18,
          lineHeight: 1,
          color: "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// ─── DebtorCard ───────────────────────────────────────────────────────────────

function DebtorCard({ debtor, records, onClick }) {
  const unpaid = calcUnpaidAmount(records, debtor.id);
  const count = countUnpaid(records, debtor.id);
  const initials = debtor.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <Fade in timeout={300}>
      <Card elevation={0}>
        <CardActionArea onClick={() => onClick(debtor)} sx={{ p: 0 }}>
          <CardContent
            sx={{
              p: "16px !important",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Avatar */}
            <Avatar
              sx={{
                bgcolor: AMBER.bg,
                color: AMBER.light,
                width: 48,
                height: 48,
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
                border: `1px solid ${AMBER.main}33`,
              }}
            >
              {initials}
            </Avatar>

            {/* Info */}
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
                    maxWidth: "calc(100% - 80px)",
                  }}
                >
                  {debtor.name}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: unpaid > 0 ? AMBER.light : "success.main",
                    flexShrink: 0,
                  }}
                >
                  {unpaid.toFixed(2)} ₪
                </Typography>
              </Box>

              {debtor.phone && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.4,
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {debtor.phone}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}
              >
                <Chip
                  label={
                    count === 0
                      ? "Settled"
                      : `${count} unpaid ${count === 1 ? "record" : "records"}`
                  }
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    bgcolor: count === 0 ? "rgba(16,185,129,0.12)" : AMBER.bg,
                    color: count === 0 ? "success.main" : AMBER.light,
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Fade>
  );
}

// ─── DebtRecordRow ────────────────────────────────────────────────────────────

function DebtRecordRow({ record, onTogglePaid, onDeleteRequest }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        py: 1.25,
        px: 1,
        borderRadius: "12px",
        transition: "background 0.15s",
        "&:hover": { background: "rgba(148,163,184,0.04)" },
        opacity: record.isPaid ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <Checkbox
        checked={record.isPaid}
        onChange={() => onTogglePaid(record.id)}
        icon={<UncheckedIcon sx={{ fontSize: 20 }} />}
        checkedIcon={
          <CheckCircleIcon sx={{ fontSize: 20, color: "#10B981" }} />
        }
        sx={{ mt: -0.25, flexShrink: 0 }}
      />

      {/* Details */}
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
              fontSize: 13,
              textDecoration: record.isPaid ? "line-through" : "none",
              color: record.isPaid ? "text.secondary" : "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "calc(100% - 70px)",
            }}
          >
            {record.medicineName}
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13,
              color: record.isPaid ? "text.secondary" : AMBER.light,
              flexShrink: 0,
              textDecoration: record.isPaid ? "line-through" : "none",
            }}
          >
            {record.totalPrice.toFixed(2)} ₪
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mt: 0.35,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <CalendarIcon sx={{ fontSize: 11, color: "text.secondary" }} />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: 11 }}
            >
              {record.date}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: 11 }}
          >
            {formatQty(record)}
          </Typography>
          {record.isPaid && record.paidAt && (
            <Chip
              label={`Paid ${record.paidAt}`}
              size="small"
              sx={{
                height: 16,
                fontSize: 10,
                bgcolor: "rgba(16,185,129,0.12)",
                color: "success.main",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )}
        </Box>
      </Box>

      {/* Delete */}
      <IconButton
        size="small"
        onClick={() => onDeleteRequest(record.id)}
        sx={{
          color: "text.secondary",
          opacity: 0.5,
          "&:hover": { opacity: 1, color: "error.main" },
          mt: -0.25,
        }}
      >
        <DeleteIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

// ─── DebtorDetailsDialog ──────────────────────────────────────────────────────

// ─── DebtorDetailsDialog ──────────────────────────────────────────────────────

function DebtorDetailsDialog({
  open,
  onClose,
  debtor,
  records,
  onTogglePaid,
  onDeleteRecordRequest,
}) {
  if (!debtor) return null;

  const debtorRecords = records.filter((r) => r.debtorId === debtor.id);

  const groupedByDate = debtorRecords.reduce((groups, record) => {
    const date = record.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {});

  const totalUnpaid = debtorRecords
    .filter((r) => !r.isPaid)
    .reduce((sum, r) => sum + r.totalPrice, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
      PaperProps={{ sx: { m: { xs: 1, sm: 2 }, maxHeight: "85vh" } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between", // تم تصحيح الاسم هنا ليعمل التصميم بدون أخطاء
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{ bgcolor: AMBER.bg, color: AMBER.light, fontWeight: 700 }}
            >
              {debtor.name[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                {debtor.name}
              </Typography>
              {debtor.phone && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 12 }} /> {debtor.phone}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "background.default",
            borderRadius: "12px",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            Total Remaining Debt:
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: totalUnpaid > 0 ? "error.main" : "success.main",
            }}
          >
            {totalUnpaid.toFixed(2)} ₪
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Debt History (Grouped by Invoice Date)
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {Object.keys(groupedByDate).length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", textAlign: "center", py: 3 }}
            >
              No debt records found.
            </Typography>
          ) : (
            Object.keys(groupedByDate)
              .sort((a, b) => new Date(b) - new Date(a))
              .map((date) => {
                const itemsInDate = groupedByDate[date];
                const invoiceTotal = itemsInDate.reduce(
                  (sum, r) => sum + r.totalPrice,
                  0,
                );

                return (
                  <Card
                    key={date}
                    variant="outlined"
                    sx={{
                      borderRadius: "12px",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        bgcolor: "action.hover",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CalendarIcon
                          sx={{ fontSize: 16, color: AMBER.light }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                          {date}
                        </Typography>
                        <Chip
                          label={`${itemsInDate.length} ${
                            itemsInDate.length === 1 ? "Item" : "Items"
                          }`}
                          size="small"
                          sx={{ height: 20, fontSize: 10, fontWeight: 600 }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "text.primary",
                        }}
                      >
                        {invoiceTotal.toFixed(2)} ₪
                      </Typography>
                    </Box>

                    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                      {itemsInDate.map((record, idx) => (
                        <Box key={record.id}>
                          <Box
                            key={record.id}
                            sx={{
                              px: 2,
                              py: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              opacity: record.isPaid ? 0.55 : 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 1.5,
                                flex: 1,
                              }}
                            >
                              <Checkbox
                                checked={record.isPaid}
                                onChange={() => onTogglePaid(record.id)}
                                icon={<UncheckedIcon sx={{ fontSize: 20 }} />}
                                checkedIcon={
                                  <CheckCircleIcon
                                    sx={{ fontSize: 20, color: "success.main" }}
                                  />
                                }
                                sx={{ p: 0, mt: 0.25 }}
                              />
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    textDecoration: record.isPaid
                                      ? "line-through"
                                      : "none",
                                  }}
                                  id={record.id}
                                >
                                  {record.medicineName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Qty: {formatQty(record)}
                                </Typography>
                              </Box>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  textDecoration: record.isPaid
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {record.totalPrice.toFixed(2)} ₪
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDeleteRecordRequest(record)}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Box>
                          {idx < itemsInDate.length - 1 && (
                            <Divider sx={{ borderStyle: "dashed" }} />
                          )}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                );
              })
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          fullWidth
          variant="outlined"
          color="inherit"
          sx={{ borderColor: "divider" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({ open, onClose, onConfirm, recordName }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: "rgba(239,68,68,0.12)",
            color: "error.main",
            borderRadius: "10px",
            width: 36,
            height: 36,
          }}
        >
          <WarningIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontSize: 16 }}>
          Delete Record
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
          Are you sure you want to delete the record for{" "}
          <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
            {recordName}
          </Box>
          ? This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 0.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ flex: 1, borderColor: "divider", color: "text.secondary" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            flex: 1,
            bgcolor: "#EF4444",
            "&:hover": { bgcolor: "#DC2626" },
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── AddDebtDialog ────────────────────────────────────────────────────────────
const EMPTY_DEBT_FORM = {
  debtorName: "",
  debtorPhone: "",
  items: [
    {
      medicine: null,
      boxes: 0,
      strips: 0,
      pills: 0,
      totalPrice: "",
    },
  ],
  date: todayISO(),
};

function AddDebtDialog({ open, onClose, onSave, existingDebtors }) {
  const [form, setForm] = useState({ ...EMPTY_DEBT_FORM, date: todayISO() });
  const [nameInputValue, setNameInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // دالة إضافة دواء جديد للمصفوفة (تُستدعى عند الضغط على زر +)
  const addMedicineItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { medicine: null, boxes: "", strips: "", pills: "", totalPrice: "" },
      ],
    }));
  };

  // دالة حذف دواء من المصفوفة (لو أضاف دواء بالخطأ وبدو يحذفه)
  const removeMedicineItem = (index) => {
    if (form.items.length === 1) return; // لا نسمح بحذف الدواء الوحيد المتبقي
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleClose = () => {
    setForm({ ...EMPTY_DEBT_FORM, date: todayISO() });
    setNameInputValue("");
    onClose();
  };

  const set = (k) => (val) => setForm((f) => ({ ...f, [k]: val }));
  const setE = (k) => (e) => set(k)(e.target.value);

  const grandTotal = form.items.reduce(
    (sum, item) => sum + (parseFloat(item.totalPrice) || 0),
    0,
  );

  const valid =
    (form.debtorName || "").trim().length > 0 &&
    form.date.length === 10 &&
    form.items.length > 0 &&
    form.items.every(
      (item) => item.medicine && (parseFloat(item.totalPrice) || 0) > 0,
    );
  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave(form);
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
      PaperProps={{ sx: { m: { xs: 1, sm: 2 }, maxHeight: "92vh" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: AMBER.bg,
              color: AMBER.light,
              borderRadius: "10px",
              width: 36,
              height: 36,
            }}
          >
            <ReceiptIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontSize: 17 }}>
            Add Debt Record
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
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
          gap: 2.25,
        }}
      >
        {/* ── Customer Section ── */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: 10,
              mb: 1,
              display: "block",
            }}
          >
            Customer
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Autocomplete
              freeSolo
              options={existingDebtors}
              getOptionLabel={(o) => (typeof o === "string" ? o : o.name)}
              inputValue={nameInputValue}
              onInputChange={(_, val) => {
                setNameInputValue(val);
                set("debtorName")(val);
              }}
              onChange={(_, val) => {
                if (!val) {
                  set("debtorPhone")("");
                  return;
                }
                setNameInputValue(val.name);
                set("debtorName")(val.name);
                set("debtorPhone")(val.phone || "");
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: AMBER.bg,
                      color: AMBER.light,
                      width: 30,
                      height: 30,
                      borderRadius: "8px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {option.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join("")}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {option.name}
                    </Typography>
                    {option.phone && (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {option.phone}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Customer Name"
                  required
                  size="small"
                  placeholder="Search or enter new name…"
                />
              )}
            />
            <TextField
              label="Phone Number"
              value={form.debtorPhone}
              onChange={setE("debtorPhone")}
              size="small"
              fullWidth
              placeholder="Optional"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: "divider" }} />

        {/* ── Medicines List Loop (المكان السحري لتكرار الأدوية) ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {form.items.map((item, index) => {
            // حساب نص الكمية التوضيحي لكل دواء منفصل
            const currentTotalUnits =
              (parseInt(item.boxes) || 0) *
                (item.medicine?.stripsPerBox || 1) *
                (item.medicine?.pillsPerStrip || 1) +
              (parseInt(item.strips) || 0) *
                (item.medicine?.pillsPerStrip || 1) +
              (parseInt(item.pills) || 0);

            return (
              <Box
                key={index}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  backgroundColor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  position: "relative",
                }}
              >
                {/* عنوان الدواء وزر الحذف */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: AMBER.light, fontWeight: 600 }}
                  >
                    Medicine #{index + 1}
                  </Typography>
                  {form.items.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeMedicineItem(index)}
                      sx={{ opacity: 0.8, "&:hover": { opacity: 1 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* حقول الدواء والكميات والسعر لهذا الـ item */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {/* دواء الأوتوكومبليت */}
                  <Autocomplete
                    options={INVENTORY_MEDICINES}
                    getOptionLabel={(o) => o.name}
                    value={item.medicine}
                    onChange={(_, val) => {
                      updateItem(index, "medicine", val);
                      // إذا تم اختيار دواء نقدر نحسب السعر المبدئي بناءً على سعر البيع إذا رغبت
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Medicine"
                        required
                        size="small"
                      />
                    )}
                  />

                  {/* كميات العلب والأشرطة والحبات */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      label="Boxes"
                      type="number"
                      size="small"
                      value={item.boxes}
                      onChange={(e) =>
                        updateItem(index, "boxes", e.target.value)
                      }
                    />
                    <TextField
                      label="Strips"
                      type="number"
                      size="small"
                      value={item.strips}
                      onChange={(e) =>
                        updateItem(index, "strips", e.target.value)
                      }
                    />
                    <TextField
                      label="Pills"
                      type="number"
                      size="small"
                      value={item.pills}
                      onChange={(e) =>
                        updateItem(index, "pills", e.target.value)
                      }
                    />
                  </Box>

                  {/* حقل السعر الخاص بالدواء الحالي */}
                  <TextField
                    label="Price for this medicine (₪)"
                    type="number"
                    size="small"
                    required
                    value={item.totalPrice}
                    onChange={(e) =>
                      updateItem(index, "totalPrice", e.target.value)
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* زر إضافة دواء جديد (+) */}
        <Button
          variant="outlined"
          color="warning"
          startIcon={<AddIcon />}
          onClick={addMedicineItem}
          sx={{ alignSelf: "center", px: 4, borderRadius: "20px" }}
        >
          Add Another Medicine
        </Button>

        <Divider sx={{ borderColor: "divider" }} />

        {/* ── Date & Grand Total (التاريخ والإجمالي العام في النهاية) ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={setE("date")}
            size="small"
            required
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            }}
          />

          {grandTotal > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 0.5,
                p: 1.5,
                background: AMBER.bg,
                borderRadius: "10px",
                border: `1px solid ${AMBER.main}33`,
              }}
            >
              <Typography
                sx={{ fontSize: 14, fontWeight: 600, color: "text.secondary" }}
              >
                Grand Total Debt Amount:
              </Typography>
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: AMBER.light }}
              >
                {grandTotal.toFixed(2)} ₪
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: "divider" }} />

      <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          sx={{ flex: 1, borderColor: "divider", color: "text.secondary" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!valid || saving}
          sx={{ flex: 2 }}
          startIcon={
            saving ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {saving ? "Saving…" : "Add Debt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── DebtsPage ────────────────────────────────────────────────────────────────

export default function DebtsPage() {
  const [debtors, setDebtors] = useState(SEED_DEBTORS);
  const [records, setRecords] = useState(SEED_RECORDS);

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, medicineName }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalUnpaid = useMemo(
    () =>
      records.filter((r) => !r.isPaid).reduce((s, r) => s + r.totalPrice, 0),
    [records],
  );
  const totalUnpaidCount = useMemo(
    () => records.filter((r) => !r.isPaid).length,
    [records],
  );

  const filteredDebtors = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return debtors;
    return debtors.filter((d) => d.name.toLowerCase().includes(q));
  }, [debtors, search]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAddDebt = useCallback(
    async (formData) => {
      let targetDebtorId = "";
      const trimmedName = formData.debtorName.trim();

      const existingDebtor = debtors.find(
        (d) => d.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (existingDebtor) {
        targetDebtorId = existingDebtor.id;
      } else {
        targetDebtorId =
          "d-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
      }

      const newRecords = formData.items.map((item) => {
        const totalUnits =
          (parseInt(item.boxes) || 0) *
            (item.medicine?.stripsPerBox || 1) *
            (item.medicine?.pillsPerStrip || 1) +
          (parseInt(item.strips) || 0) * (item.medicine?.pillsPerStrip || 1) +
          (parseInt(item.pills) || 0);

        return {
          id:
            "rec-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          debtorId: targetDebtorId,
          debtorName: trimmedName,
          debtorPhone: formData.debtorPhone.trim(),
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          qty: {
            boxes: parseInt(item.boxes) || 0,
            strips: parseInt(item.strips) || 0,
            pills: parseInt(item.pills) || 0,
          },
          boxes: parseInt(item.boxes) || 0,
          strips: parseInt(item.strips) || 0,
          pills: parseInt(item.pills) || 0,
          totalUnits: totalUnits,
          totalPrice: parseFloat(item.totalPrice) || 0,
          date: formData.date,
          isPaid: false,
          paidAt: null,
          createdAt: new Date().toISOString(),
        };
      });

      setRecords((prev) => [...newRecords, ...prev]);

      if (!existingDebtor) {
        setDebtors((prev) => [
          ...prev,
          {
            id: targetDebtorId,
            name: trimmedName,
            phone: formData.debtorPhone.trim() || null,
            createdAt: todayISO(),
          },
        ]);
      }
    },
    [debtors],
  );

  const handleTogglePaid = useCallback((recordId) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              isPaid: !r.isPaid,
              paidAt: !r.isPaid ? todayISO() : null,
            }
          : r,
      ),
    );
  }, []);

  const handleDeleteRecordRequest = useCallback(
    (recordId) => {
      const r = records.find((rec) => rec.id === recordId);
      if (r) setDeleteTarget({ id: recordId, medicineName: r.medicineName });
    },
    [records],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    // If debtor has no more records, optionally remove them too (currently kept for history)
    setDeleteTarget(null);
  }, [deleteTarget]);

  // Re-sync selectedDebtor after records update so dialog reflects changes
  const selectedDebtorSynced = selectedDebtor
    ? debtors.find((d) => d.id === selectedDebtor.id) || null
    : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        {/* ── App Bar ── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(148,163,184,0.08)",
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <Avatar
              sx={{
                bgcolor: AMBER.bg,
                color: AMBER.light,
                borderRadius: "12px",
                mr: 1.5,
                width: 38,
                height: 38,
                border: `1px solid ${AMBER.main}33`,
              }}
            >
              <MoneyOffIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: 16, sm: 18 }, lineHeight: 1.2 }}
              >
                Debts
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: 11 }}
              >
                Yahya Pharmacy
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Chip
              label={`${debtors.length} debtors`}
              size="small"
              sx={{
                bgcolor: AMBER.bg,
                color: AMBER.light,
                fontWeight: 600,
                fontSize: 12,
              }}
            />
          </Toolbar>
        </AppBar>

        {/* ── Main Content ── */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 12, maxWidth: 600, mx: "auto" }}>
          {/* Search */}
          <Box sx={{ pt: 2.5, pb: 1.75 }}>
            <TextField
              fullWidth
              placeholder="Search debtors by name…"
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
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearch("")}
                      sx={{ color: "text.secondary" }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {/* Summary Cards */}
          <Box sx={{ display: "flex", gap: 1.25, mb: 2.5 }}>
            <SummaryCard
              icon={<PeopleIcon sx={{ fontSize: 14 }} />}
              label="Debtors"
              value={debtors.length}
              accent={AMBER.light}
            />
            <SummaryCard
              icon={<WalletIcon sx={{ fontSize: 14 }} />}
              label="Unpaid"
              value={`${totalUnpaid.toFixed(2)} ₪`}
              accent="#EF4444"
            />
            <SummaryCard
              icon={<ReceiptIcon sx={{ fontSize: 14 }} />}
              label="Records"
              value={totalUnpaidCount}
              accent="#8B5CF6"
            />
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
              {filteredDebtors.length}{" "}
              {filteredDebtors.length === 1 ? "debtor" : "debtors"}
              {search && ` matching "${search}"`}
            </Typography>
            {search && (
              <Button
                size="small"
                onClick={() => setSearch("")}
                sx={{ fontSize: 12, color: AMBER.light, p: 0, minWidth: 0 }}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Debtor Cards */}
          {filteredDebtors.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {filteredDebtors.map((debtor) => (
                <DebtorCard
                  key={debtor.id}
                  debtor={debtor}
                  records={records}
                  onClick={setSelectedDebtor}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", pt: 8, pb: 4 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(148,163,184,0.06)",
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  borderRadius: "20px",
                }}
              >
                <PeopleIcon
                  sx={{ fontSize: 32, color: "text.secondary", opacity: 0.4 }}
                />
              </Avatar>
              <Typography sx={{ color: "text.secondary", fontWeight: 500 }}>
                {search ? "No debtors match your search" : "No debtors yet"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", opacity: 0.55 }}
              >
                {search
                  ? "Try a different name"
                  : "Tap + to add the first debt record"}
              </Typography>
            </Box>
          )}
        </Box>

        {/* ── FAB ── */}
        <Fab
          onClick={() => setAddOpen(true)}
          sx={{ position: "fixed", bottom: 75, right: 24 }}
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </Fab>

        {/* ── Add Debt Dialog ── */}
        <AddDebtDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSave={handleAddDebt}
          existingDebtors={debtors}
        />

        {/* ── Debtor Details Dialog ── */}
        <DebtorDetailsDialog
          open={Boolean(selectedDebtor)}
          onClose={() => setSelectedDebtor(null)}
          debtor={selectedDebtorSynced}
          records={records}
          onTogglePaid={handleTogglePaid}
          onDeleteRecordRequest={handleDeleteRecordRequest}
        />

        {/* ── Delete Confirm Dialog ── */}
        <DeleteConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          recordName={deleteTarget?.medicineName ?? ""}
        />
      </Box>
    </ThemeProvider>
  );
}
