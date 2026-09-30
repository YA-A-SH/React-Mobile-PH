import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useDeferredValue,
  useRef,
} from "react";
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
  Avatar,
  Alert,
  Snackbar,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  useMediaQuery,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  AccessTime as TimeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  FilterList as FilterIcon,
  Payments as CashIcon,
  PhoneIphone as AppIcon,
  AccountBalance as AccountIcon,
  ReceiptLong as ReceiptIcon,
  TrendingUp as ProfitIcon,
  ShoppingBag as ItemsIcon,
  PointOfSale as SalesIcon,
  QrCodeScanner as QrCodeScannerIcon,
  CloudOff as OfflineIcon,
  Inventory2 as StockIcon,
  LocalPharmacy,
  Liquor,
  WaterDrop,
  Vaccines as VaccinesIcon,
  MedicalServices,
  Healing,
  Colorize,
  Opacity,
  Medication as MedicationIcon,
} from "@mui/icons-material";
import {
  getAllMedicines,
  getSalesByRangeDB,
  getSaleItemsBySaleIdsDB,
  createSaleDB,
  markSalePaymentReceivedDB,
  deleteSaleDB,
  updateSaleWithStockDB,
} from "../db";
import { syncAll, syncAfterSaleChange } from "../sync";
import QrScannerDialog from "../QrScanner.jsx";
import {
  PAYMENT_TYPES,
  PAYMENT_STATUS,
  TRANSFER_SOURCES,
  RECEIVERS,
  RECEIVER_FILTER_OPTIONS,
  getAccountsForReceiver,
  getMedicinePharmacy,
  getPackaging,
  formatStock,
  isOutOfStock,
  pieceLabel,
  defaultQuantity,
  checkStock,
  computeLine,
  formatItemQuantity,
  describeItemPriceUnit,
  money,
  round2,
  toDateKey,
  shiftDateKey,
  getLocalDayRangeIso,
} from "../salesLogic";

// ─── Theme (mirrors the Inventory page's theme so both pages look identical) ──

const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#F6F8FB", paper: "#FFFFFF" },
    primary: {
      main: "#2563EB",
      light: "#3B82F6",
      dark: "#1D4ED8",
      contrastText: "#FFFFFF",
    },
    success: { main: "#0F9F6E", light: "#10B981" },
    warning: { main: "#D97706", light: "#F59E0B" },
    error: { main: "#DC2626", light: "#EF4444" },
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
        body: {
          backgroundColor: "#F6F8FB",
          color: "#172033",
        },
        "*": { boxSizing: "border-box" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#FFFFFF",
          border: "1px solid #E7ECF3",
          borderRadius: 18,
          boxShadow: "0 6px 24px rgba(15,23,42,0.055)",
          transition:
            "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
          "&:hover": {
            borderColor: "rgba(37,99,235,0.22)",
            transform: "translateY(-1px)",
            boxShadow: "0 12px 30px rgba(15,23,42,0.075)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "#FFFFFF",
          color: "#172033",
          borderRadius: 24,
          border: "1px solid #E7ECF3",
          boxShadow: "0 24px 70px rgba(15,23,42,0.16)",
          overflow: "hidden",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 13,
            background: "#FFFFFF",
            transition: "box-shadow 160ms ease, border-color 160ms ease",
            "& fieldset": { borderColor: "#D8E0EA" },
            "&:hover fieldset": { borderColor: "rgba(37,99,235,0.45)" },
            "&.Mui-focused fieldset": {
              borderColor: "#2563EB",
              borderWidth: 1.5,
            },
            "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(37,99,235,0.08)" },
          },
          "& .MuiInputLabel-root": { color: "#667085" },
          "& .MuiInputLabel-root.Mui-focused": { color: "#2563EB" },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 13,
          background: "#FFFFFF",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px !important",
          borderColor: "#D8E0EA !important",
          color: "#667085",
          fontWeight: 700,
          textTransform: "none",
          "&.Mui-selected": {
            background: "#EEF4FF",
            color: "#1D4ED8",
            borderColor: "rgba(37,99,235,0.30) !important",
          },
          "&.Mui-selected:hover": { background: "#E5EEFF" },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          width: 60,
          height: 60,
          boxShadow: "0 12px 28px rgba(37,99,235,0.25)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
          textTransform: "none",
        },
        contained: {
          boxShadow: "0 7px 18px rgba(37,99,235,0.16)",
          "&:hover": { boxShadow: "0 10px 24px rgba(37,99,235,0.22)" },
        },
        outlined: { borderColor: "#D8E0EA" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          fontWeight: 700,
          fontSize: 11,
        },
      },
    },
  },
});

// ─── Constants / small helpers ───────────────────────────────────────────────

const PHARMACY_NAMES = {
  old: "Yahya Pharmacy · صيدلية يحيى",
  new: "Balqis Pharmacy · صيدلية بلقيس",
};

const TYPE_CONFIG = {
  Tablets: {
    icon: <LocalPharmacy fontSize="small" />,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.1)",
  },
  Syrup: {
    icon: <Liquor fontSize="small" />,
    color: "#0F9F6E",
    bg: "rgba(16,185,129,0.1)",
  },
  Drops: {
    icon: <WaterDrop fontSize="small" />,
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.1)",
  },
  Ampoule: {
    icon: <VaccinesIcon fontSize="small" />,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.1)",
  },
  Suppository: {
    icon: <MedicalServices fontSize="small" />,
    color: "#F97316",
    bg: "rgba(249,115,22,0.1)",
  },
  Cream: {
    icon: <Healing fontSize="small" />,
    color: "#EC4899",
    bg: "rgba(236,72,153,0.1)",
  },
  Oint: {
    icon: <Colorize fontSize="small" />,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
  },
  Emulgel: {
    icon: <Opacity fontSize="small" />,
    color: "#14B8A6",
    bg: "rgba(20,184,166,0.1)",
  },
  Others: {
    icon: <MedicationIcon fontSize="small" />,
    color: "#64748B",
    bg: "rgba(100,116,139,0.1)",
  },
};
const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.Others;

const STATUS_UI = {
  pending: {
    label: "🟠 Payment Pending",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
  },
  received: {
    label: "🟢 Payment Received",
    color: "#0F9F6E",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
  },
};

// Same admin flag the Inventory uses. (Frontend-only, NOT real security.)
const readIsAdmin = () => localStorage.getItem("isAdmin") === "true";

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatDateTime = (iso) =>
  new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const shortId = (id) =>
  String(id || "")
    .slice(0, 8)
    .toUpperCase();
const formatDateLabel = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const dateFieldSx = { "& input": { colorScheme: "light" } };
const selectSx = {
  borderRadius: "14px !important",
  bgcolor: "#FFFFFF",
};

// ─── Small presentational pieces ─────────────────────────────────────────────

function SummaryCard({ icon, label, value, color, bg }) {
  return (
    <Card
      elevation={0}
      sx={{
        "&:hover": { transform: "translateY(-2px)" },
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          p: "14px !important",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: bg,
            color,
            width: 40,
            height: 40,
            borderRadius: "12px",
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block" }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 15, sm: 18 },
              color,
              lineHeight: 1.2,
            }}
            noWrap
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }) {
  const ui = STATUS_UI[status] || STATUS_UI.pending;
  return (
    <Chip
      size="small"
      label={ui.label}
      sx={{
        bgcolor: ui.bg,
        color: ui.color,
        border: `1px solid ${ui.border}`,
        fontWeight: 700,
      }}
    />
  );
}

function InfoRow({ icon, label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block" }}
        >
          {label}
        </Typography>
        <Typography
          sx={{ fontSize: 14, fontWeight: 500, wordBreak: "break-word" }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function MarkReceivedControl({ onChange, compact, received }) {
  return (
    <FormControlLabel
      onClick={(e) => e.stopPropagation()}
      control={
        <Checkbox
          checked={received}
          onChange={onChange}
          size={compact ? "small" : "medium"}
          sx={{
            color: "#F59E0B",
            "&.Mui-checked": { color: "#0F9F6E" },
          }}
        />
      }
      label={
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {received
            ? "Payment received — click to mark pending"
            : "Mark payment as received"}
        </Typography>
      }
      sx={{ m: 0 }}
    />
  );
}

// ─── Sale card ───────────────────────────────────────────────────────────────

const SaleCard = React.memo(function SaleCard({
  sale,
  itemCount,
  isAdmin,
  onOpen,
  onMarkReceived,
  onCancel,
  onEdit,
}) {
  const canManageSale = isAdmin && sale.sale_status !== "cancelled";
  const ui = STATUS_UI[sale.payment_status] || STATUS_UI.pending;
  const isApp = sale.payment_type === "Application";
  const canMark = isAdmin && isApp;

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor:
          sale.payment_status === "received"
            ? "rgba(16,185,129,0.03)"
            : "rgba(245,158,11,0.03)",
        border: `1px solid ${ui.border}`,
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: ui.color,
        },
      }}
    >
      <CardActionArea
        disableRipple
        onClick={() => onOpen(sale.id)}
        sx={{ p: 0 }}
      >
        <CardContent
          sx={{
            p: "16px !important",
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: isApp
                  ? "rgba(59,130,246,0.1)"
                  : "rgba(16,185,129,0.1)",
                color: isApp ? "#3B82F6" : "#10B981",
                width: 44,
                height: 44,
                borderRadius: "14px",
                flexShrink: 0,
              }}
            >
              {isApp ? (
                <AppIcon fontSize="small" />
              ) : (
                <CashIcon fontSize="small" />
              )}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3 }}
                noWrap
              >
                {sale.customer_name || "Walk-in customer"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  flexWrap: "wrap",
                  mt: 0.25,
                }}
              >
                {sale.customer_phone && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 13 }} /> {sale.customer_phone}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.4,
                  }}
                >
                  <TimeIcon sx={{ fontSize: 13 }} />{" "}
                  {formatTime(sale.created_at)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: "primary.light",
                  lineHeight: 1.2,
                }}
              >
                ILS {money(sale.total)}
              </Typography>
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: "#0F9F6E" }}
              >
                +{money(sale.total_profit)} profit
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              alignItems: "center",
            }}
          >
            <Chip
              size="small"
              icon={<ItemsIcon sx={{ fontSize: "14px !important" }} />}
              label={`${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              sx={{
                bgcolor: "#F2F5F8",
                color: "text.secondary",
              }}
            />
            <Chip
              size="small"
              label={sale.payment_type}
              sx={{
                bgcolor: isApp
                  ? "rgba(59,130,246,0.12)"
                  : "rgba(16,185,129,0.12)",
                color: isApp ? "#2563EB" : "#0F9F6E",
              }}
            />
            {(sale.receiver || sale.destination_account) && (
              <Chip
                size="small"
                icon={<AccountIcon sx={{ fontSize: "14px !important" }} />}
                label={[sale.receiver, sale.destination_account]
                  .filter(Boolean)
                  .join(" → ")}
                sx={{
                  bgcolor: "#F2F5F8",
                  color: "text.secondary",
                }}
              />
            )}
            <Box sx={{ flex: 1 }} />
            {sale.sale_status === "cancelled" ? (
              <Chip
                size="small"
                label="Cancelled"
                sx={{
                  bgcolor: "#FEF0F0",
                  color: "#DC2626",
                  fontWeight: 700,
                }}
              />
            ) : (
              <StatusChip status={sale.payment_status} />
            )}{" "}
          </Box>
        </CardContent>
      </CardActionArea>

      {canMark && (
        <>
          <Divider sx={{ borderColor: "divider" }} />
          <Box sx={{ px: 1.5, py: 0.25 }}>
            <MarkReceivedControl
              compact
              received={sale.payment_status === PAYMENT_STATUS.RECEIVED}
              onChange={() => onMarkReceived(sale)}
            />
          </Box>
        </>
      )}

      {canManageSale && (
        <Button
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(sale);
          }}
        >
          Edit Sale
        </Button>
      )}
      {canManageSale && (
        <>
          <Divider sx={{ borderColor: "divider" }} />
          <Box sx={{ px: 1.5, py: 1 }}>
            <Button
              fullWidth
              size="small"
              color="error"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(sale);
              }}
            >
              Delete Sale
            </Button>
          </Box>
        </>
      )}
    </Card>
  );
});

// ─── Sale details dialog ─────────────────────────────────────────────────────

function SaleDetailsDialog({
  open,
  onClose,
  sale,
  items,
  pharmacyName,
  isAdmin,
  onMarkReceived,
}) {
  if (!sale) return null;
  const isApp = sale.payment_type === "Application";
  const canMark = isAdmin && isApp;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
    >
      <DialogTitle sx={{ pb: 1 }}>
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
                bgcolor: "#EAFBF4",
                color: "#0F9F6E",
                width: 44,
                height: 44,
                borderRadius: "12px",
              }}
            >
              <ReceiptIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontSize: 16, lineHeight: 1.3 }}>
                {sale.customer_name || "Walk-in customer"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Sale #{shortId(sale.id)}
              </Typography>
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
      <Divider sx={{ borderColor: "divider" }} />

      <DialogContent
        sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Box>
          {sale.sale_status === "cancelled" ? (
            <Chip
              size="small"
              label="Cancelled"
              sx={{
                bgcolor: "#FEF0F0",
                color: "#DC2626",
                fontWeight: 700,
              }}
            />
          ) : (
            <StatusChip status={sale.payment_status} />
          )}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.75,
          }}
        >
          <InfoRow
            icon={<PersonIcon sx={{ fontSize: 18 }} />}
            label="Customer"
            value={sale.customer_name || "Walk-in customer"}
          />
          <InfoRow
            icon={<PhoneIcon sx={{ fontSize: 18 }} />}
            label="Phone"
            value={sale.customer_phone}
          />
          <InfoRow
            icon={<TimeIcon sx={{ fontSize: 18 }} />}
            label="Date & time"
            value={formatDateTime(sale.created_at)}
          />
          <InfoRow
            icon={<StockIcon sx={{ fontSize: 18 }} />}
            label="Pharmacy"
            value={pharmacyName}
          />
          <InfoRow
            icon={
              isApp ? (
                <AppIcon sx={{ fontSize: 18 }} />
              ) : (
                <CashIcon sx={{ fontSize: 18 }} />
              )
            }
            label="Payment type"
            value={sale.payment_type}
          />
          <InfoRow
            icon={<AppIcon sx={{ fontSize: 18 }} />}
            label="Transferred from"
            value={sale.transfer_from}
          />
          <InfoRow
            icon={<PersonIcon sx={{ fontSize: 18 }} />}
            label="Receiver"
            value={sale.receiver}
          />
          <InfoRow
            icon={<AccountIcon sx={{ fontSize: 18 }} />}
            label="Destination account"
            value={sale.destination_account}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13,
              color: "text.secondary",
              mb: 1,
            }}
          >
            Medicines ({items.length})
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {items.map((item) => {
              const cfg = getTypeConfig(item.medicine_type);
              return (
                <Box
                  key={item.id}
                  sx={{
                    background: "#F8FAFC",
                    border: "1px solid #E7ECF3",
                    borderRadius: "14px",
                    p: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      mb: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: cfg.bg,
                        color: cfg.color,
                        width: 34,
                        height: 34,
                        borderRadius: "10px",
                      }}
                    >
                      {cfg.icon}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                        {item.medicine_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {formatItemQuantity(item)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 1,
                    }}
                  >
                    {[
                      {
                        l: `Price / ${describeItemPriceUnit(item)}`,
                        v: `ILS ${money(item.sell_price)}`,
                        c: "text.primary",
                      },
                      {
                        l: "Line total",
                        v: `ILS ${money(item.line_total)}`,
                        c: "primary.light",
                      },
                      {
                        l: "Line profit",
                        v: `ILS ${money(item.line_profit)}`,
                        c: "#10B981",
                      },
                    ].map((c) => (
                      <Box key={c.l}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            fontSize: 10.5,
                          }}
                        >
                          {c.l}
                        </Typography>
                        <Typography
                          sx={{ fontWeight: 700, fontSize: 13, color: c.c }}
                        >
                          {c.v}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box
          sx={{
            background: "#F8FAFC",
            border: "1px solid #E7ECF3",
            borderRadius: "14px",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          {[
            { l: "Total", v: sale.total, c: "primary.light", big: true },
            { l: "Total cost", v: sale.total_cost, c: "text.secondary" },
            { l: "Total profit", v: sale.total_profit, c: "#10B981" },
          ].map((r) => (
            <Box
              key={r.l}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <Typography
                sx={{ color: "text.secondary", fontSize: r.big ? 14 : 13 }}
              >
                {r.l}
              </Typography>
              <Typography
                sx={{ fontWeight: 800, fontSize: r.big ? 20 : 14, color: r.c }}
              >
                ILS {money(r.v)}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: "divider" }} />
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          flexDirection: "column",
          alignItems: "stretch",
          gap: 1,
        }}
      >
        {canMark && (
          <MarkReceivedControl
            received={sale.payment_status === PAYMENT_STATUS.RECEIVED}
            onChange={() => onMarkReceived(sale)}
          />
        )}
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ color: "text.secondary", borderColor: "divider" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Add-sale: one medicine line ─────────────────────────────────────────────

const onlyDigits = (v) => v.replace(/[^\d]/g, "");

function SaleLineCard({
  line,
  medicine,
  stockMedicine,
  highlighted,
  onChange,
  onRemove,
}) {
  if (!medicine) {
    return (
      <Card
        elevation={0}
        sx={{ p: 2, border: "1px solid rgba(239,68,68,0.4)" }}
      >
        <Alert
          severity="error"
          action={
            <IconButton size="small" onClick={onRemove}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          }
        >
          This medicine is no longer available in this pharmacy.
        </Alert>
      </Card>
    );
  }
  const pk = getPackaging(medicine);
  const cfg = getTypeConfig(medicine.type);
  const piece = pieceLabel(medicine.type);
  const stock = checkStock(stockMedicine || medicine, line);
  const calc = computeLine(medicine, line, line.price);
  const priceInvalid = line.price === "" || !(Number(line.price) >= 0);
  const showStockError = !stock.ok && stock.code !== "EMPTY";
  const showEmpty = !stock.ok && stock.code === "EMPTY";

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 1.75 },
        border: highlighted
          ? "1px solid rgba(245,158,11,0.8)"
          : !stock.ok || priceInvalid
          ? "1px solid rgba(239,68,68,0.35)"
          : "1px solid rgba(148,163,184,0.12)",
        bgcolor: "#FFFFFF",
        "&:hover": { transform: "none" },
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 1.5 }}
      >
        <Avatar
          sx={{
            bgcolor: cfg.bg,
            color: cfg.color,
            width: 38,
            height: 38,
            borderRadius: "12px",
          }}
        >
          {cfg.icon}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
            {medicine.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
            <Chip
              size="small"
              label={medicine.type || "—"}
              sx={{ bgcolor: cfg.bg, color: cfg.color }}
            />
            <Chip
              size="small"
              icon={<StockIcon sx={{ fontSize: "13px !important" }} />}
              label={`In stock: ${formatStock(stockMedicine || medicine)}`}
              sx={{
                bgcolor: "#F2F5F8",
                color: "text.secondary",
              }}
            />
            {medicine.location && getMedicinePharmacy(medicine) === "old" && (
              <Chip
                size="small"
                label={medicine.location}
                sx={{
                  bgcolor:
                    medicine.location === "مخزون"
                      ? "rgba(245,158,11,0.12)"
                      : "rgba(16,185,129,0.12)",
                  color: medicine.location === "مخزون" ? "#F59E0B" : "#10B981",
                }}
              />
            )}
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{ color: "text.secondary" }}
          aria-label="Remove medicine"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: pk.divisible ? "repeat(3, 1fr)" : "1fr",
          gap: 1.25,
          mb: 1.25,
        }}
      >
        <TextField
          size="small"
          label={pk.divisible ? "Boxes" : pk.isStripType ? "Boxes" : "Quantity"}
          value={line.boxes}
          onChange={(e) => onChange({ boxes: onlyDigits(e.target.value) })}
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
        />
        {pk.divisible && (
          <>
            <TextField
              size="small"
              label="Strips"
              value={line.strips}
              onChange={(e) => onChange({ strips: onlyDigits(e.target.value) })}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
            <TextField
              size="small"
              label={`${piece[0].toUpperCase()}${piece.slice(1)}s`}
              value={line.pills}
              onChange={(e) => onChange({ pills: onlyDigits(e.target.value) })}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
          </>
        )}
      </Box>

      <TextField
        size="small"
        fullWidth
        type="number"
        label={`Sell price per ${pk.priceUnit}`}
        value={line.price}
        onChange={(e) => onChange({ price: e.target.value })}
        error={priceInvalid}
        helperText={priceInvalid ? "Enter a valid price" : undefined}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">ILS</InputAdornment>
            ),
          },
          htmlInput: { min: 0, step: "0.01", inputMode: "decimal" },
        }}
      />

      {showStockError && (
        <Alert severity="error" sx={{ mt: 1.25, py: 0, borderRadius: "12px" }}>
          {stock.message}
        </Alert>
      )}
      {showEmpty && (
        <Typography
          variant="caption"
          sx={{ color: "warning.main", display: "block", mt: 1 }}
        >
          Enter a quantity to include this medicine.
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 1.5,
          pt: 1.25,
          borderTop: "1px solid #E7ECF3",
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block" }}
          >
            Line total
          </Typography>
          <Typography sx={{ fontWeight: 800, color: "primary.light" }}>
            ILS {money(calc.lineTotal)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block" }}
          >
            Line profit
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              color: calc.lineProfit < 0 ? "error.main" : "#10B981",
            }}
          >
            ILS {money(calc.lineProfit)}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

// ─── Add-sale dialog ─────────────────────────────────────────────────────────

const SectionCard = ({ title, children }) => (
  <Box
    sx={{
      background: "#F8FAFC",
      border: "1px solid #E7ECF3",
      borderRadius: "18px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
      p: 2,
      display: "flex",
      flexDirection: "column",
      gap: 1.75,
    }}
  >
    <Typography sx={{ fontWeight: 700, fontSize: 13, color: "text.secondary" }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const norm = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

function AddSaleDialog({
  open,
  onClose,
  medicines,
  onSubmit,
  editSale = null,
  editItems = [],
}) {
  const fullScreen = useMediaQuery("(max-width:600px)");
  const [paymentType, setPaymentType] = useState("Application");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [transferFrom, setTransferFrom] = useState("");
  const [receiver, setReceiver] = useState("");
  const [destination, setDestination] = useState("");
  const [lines, setLines] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Fresh form every time the dialog opens
  // Initialize a fresh Add form or populate the existing Sale for Edit.
  useEffect(() => {
    if (!open) return;

    setSubmitError("");
    setSubmitting(false);
    setSearchInput("");
    setHighlightId(null);
    setNotice("");

    if (!editSale) {
      setPaymentType("Application");
      setCustomerName("");
      setCustomerPhone("");
      setTransferFrom("");
      setReceiver("");
      setDestination("");
      setLines([]);
      return;
    }

    setPaymentType(editSale.payment_type || "Application");
    setCustomerName(editSale.customer_name || "");
    setCustomerPhone(editSale.customer_phone || "");
    setTransferFrom(editSale.transfer_from || "");
    setReceiver(editSale.receiver || "");
    setDestination(editSale.destination_account || "");

    setLines(
      editItems.map((item) => ({
        medicineId: item.medicine_id,
        boxes: String(item.quantity_boxes || ""),
        strips: String(item.quantity_strips || ""),
        pills: String(item.quantity_pills || ""),
        price: String(item.sell_price ?? ""),
      })),
    );
  }, [open, editSale, editItems]);
  // `medicines` is ALREADY restricted to the selected pharmacy by the parent.
  const medById = useMemo(
    () => new Map(medicines.map((m) => [m.id, m])),
    [medicines],
  );
  const originalUnitsByMedicineId = useMemo(() => {
    const map = new Map();

    for (const item of editItems) {
      map.set(
        item.medicine_id,
        Math.max(0, Number(item.quantity_in_base_units) || 0),
      );
    }

    return map;
  }, [editItems]);

  const getStockMedicineForEdit = (med) => {
    if (!editSale || !med) return med;

    const originalUnits = originalUnitsByMedicineId.get(med.id) || 0;

    if (originalUnits <= 0) return med;

    return {
      ...med,
      stockUnits: Math.max(0, Number(med.stockUnits) || 0) + originalUnits,
    };
  };

  const isApp = paymentType === "Application";
  const accounts = receiver ? getAccountsForReceiver(receiver) : [];

  const handleReceiver = (r) => {
    const next = receiver === r ? "" : r;
    setReceiver(next);
    const valid = next ? getAccountsForReceiver(next) : [];
    // keep the account only if it is valid for the new receiver; auto-pick a single option
    setDestination((d) =>
      valid.includes(d) ? d : valid.length === 1 ? valid[0] : "",
    );
  };

  const addMedicine = (med) => {
    if (!med) return;
    const existing = lines.find((l) => l.medicineId === med.id);
    if (existing) {
      // No duplicates: point the user at the existing line instead
      setHighlightId(med.id);
      setNotice(
        `"${med.name}" is already in this sale – adjust its quantity below.`,
      );
      return;
    }
    const q = defaultQuantity(med);
    setNotice("");
    setHighlightId(null);
    setLines((prev) => [
      ...prev,
      {
        medicineId: med.id,
        ...q,
        price: String(getPackaging(med).defaultPrice),
      },
    ]);
  };

  const updateLine = (id, patch) =>
    setLines((prev) =>
      prev.map((l) => (l.medicineId === id ? { ...l, ...patch } : l)),
    );
  const removeLine = (id) =>
    setLines((prev) => prev.filter((l) => l.medicineId !== id));

  const handleScan = (text) => {
    setScannerOpen(false);
    const code = String(text || "").trim();
    if (!code) return;
    const matches = medicines.filter(
      (m) => String(m.qrCode || "").trim() === code,
    );
    if (matches.length === 1) addMedicine(matches[0]);
    else if (matches.length > 1) {
      setSearchInput(code); // e.g. same code displayed + stored → let the user choose
      setNotice(
        "This code exists in more than one place – pick the right one from the list.",
      );
    } else setNotice("No medicine with this code in this pharmacy.");
  };

  const filterOptions = (options, { inputValue }) => {
    const t = norm(inputValue);
    const list = t
      ? options.filter(
          (m) => norm(m.name).includes(t) || norm(m.qrCode).includes(t),
        )
      : options;
    if (t)
      list.sort(
        (a, b) =>
          Number(norm(b.name).startsWith(t)) -
          Number(norm(a.name).startsWith(t)),
      );
    return list.slice(0, 40);
  };

  // Validation + totals (same logic the DB re-checks inside its transaction)
  const lineStates = lines.map((l) => {
    const med = medById.get(l.medicineId);
    if (!med) return { ok: false };

    const stockMed = getStockMedicineForEdit(med);
    const stock = checkStock(stockMed, l);
    const priceOk = l.price !== "" && Number(l.price) >= 0;

    return {
      ok: stock.ok && priceOk,
      calc: computeLine(med, l, l.price),
    };
  });
  const allLinesOk = lines.length > 0 && lineStates.every((s) => s.ok);
  const total = round2(
    lineStates.reduce((s, x) => s + (x.calc?.lineTotal || 0), 0),
  );
  const cost = round2(
    lineStates.reduce((s, x) => s + (x.calc?.lineCost || 0), 0),
  );
  const profit = round2(total - cost);
  const paymentOk = !isApp || (transferFrom && receiver && destination);
  const canSubmit = allLinesOk && paymentOk && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({
        paymentType,
        customerName,
        customerPhone,
        transferFrom: isApp ? transferFrom : null,
        receiver: isApp ? receiver : null,
        destinationAccount: isApp ? destination : null,
        lines: lines.map((l) => ({
          medicineId: l.medicineId,
          boxes: l.boxes,
          strips: l.strips,
          pills: l.pills,
          price: Number(l.price),
        })),
      });
    } catch (err) {
      setSubmitError(err?.message || "Could not save the sale.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        PaperProps={fullScreen ? { sx: { borderRadius: 0 } } : undefined}
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
            {editSale ? "Edit Sale" : "New Sale"}
          </Typography>
          <IconButton
            onClick={onClose}
            disabled={submitting}
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
          <SectionCard title="Payment type">
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={paymentType}
              onChange={(_, v) => v && setPaymentType(v)}
              sx={{
                "& .MuiToggleButton-root": {
                  borderRadius: "12px !important",
                  border: "1px solid rgba(148,163,184,0.2) !important",
                  textTransform: "none",
                  fontWeight: 700,
                  gap: 1,
                  py: 1.1,
                },
                "& .MuiToggleButton-root.Mui-selected": {
                  bgcolor: "#EAF1FF",
                  color: "#2563EB",
                  borderColor: "rgba(37,99,235,0.5) !important",
                },
                gap: 1,
              }}
            >
              {PAYMENT_TYPES.map((t) => (
                <ToggleButton key={t} value={t}>
                  {t === "Application" ? (
                    <AppIcon fontSize="small" />
                  ) : (
                    <CashIcon fontSize="small" />
                  )}
                  {t}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {isApp
                ? "Saved as 🟠 Payment Pending until an admin marks it as received."
                : "Cash is saved as 🟢 Payment Received immediately."}
            </Typography>
          </SectionCard>

          {isApp && (
            <SectionCard title="Customer (optional)">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  size="small"
                  label="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />

                <TextField
                  size="small"
                  label="Customer phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  slotProps={{ htmlInput: { inputMode: "tel" } }}
                />
              </Box>
            </SectionCard>
          )}
          {isApp && (
            <SectionCard title="Transfer details">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* Transfer From */}
                <FormControl fullWidth size="small" required>
                  <InputLabel>Transfer from</InputLabel>
                  <Select
                    value={transferFrom}
                    label="Transfer from"
                    onChange={(e) => setTransferFrom(e.target.value)}
                    sx={selectSx}
                  >
                    {TRANSFER_SOURCES.map((source) => (
                      <MenuItem key={source} value={source}>
                        {source}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Receiver */}
                <FormControl fullWidth size="small" required>
                  <InputLabel>Receiver</InputLabel>
                  <Select
                    value={receiver}
                    label="Receiver"
                    onChange={(e) => {
                      const next = e.target.value;
                      setReceiver(next);

                      const accounts = getAccountsForReceiver(next);
                      setDestination(accounts[0] || "");
                    }}
                    sx={selectSx}
                  >
                    {RECEIVERS.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Destination Account */}
                <FormControl fullWidth size="small" required>
                  <InputLabel>Destination account</InputLabel>
                  <Select
                    value={destination}
                    label="Destination account"
                    onChange={(e) => setDestination(e.target.value)}
                    sx={selectSx}
                  >
                    {getAccountsForReceiver(receiver).map((account) => (
                      <MenuItem key={account} value={account}>
                        {account}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </SectionCard>
          )}

          <SectionCard title={`Medicines (${lines.length})`}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <Autocomplete
                fullWidth
                size="small"
                value={null}
                inputValue={searchInput}
                onInputChange={(_, v, reason) =>
                  setSearchInput(reason === "reset" ? "" : v)
                }
                options={medicines}
                filterOptions={filterOptions}
                getOptionLabel={(o) => o?.name || ""}
                getOptionDisabled={(o) => isOutOfStock(o)}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                onChange={(_, med) => med && addMedicine(med)}
                noOptionsText="No medicines found in this pharmacy"
                renderOption={(props, med) => {
                  const { key, ...rest } = props;
                  const cfg = getTypeConfig(med.type);
                  return (
                    <li key={med.id} {...rest}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          width: "100%",
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            width: 30,
                            height: 30,
                            borderRadius: "9px",
                          }}
                        >
                          {cfg.icon}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{ fontSize: 13.5, fontWeight: 600 }}
                            noWrap
                          >
                            {med.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                            noWrap
                          >
                            {[med.type, med.company, med.qrCode]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          {isOutOfStock(med) ? (
                            <Chip
                              size="small"
                              color="error"
                              label="Out of stock"
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {formatStock(med)}
                            </Typography>
                          )}
                          {getMedicinePharmacy(med) === "old" &&
                            med.location && (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  color:
                                    med.location === "مخزون"
                                      ? "#F59E0B"
                                      : "#10B981",
                                }}
                              >
                                {med.location}
                              </Typography>
                            )}
                        </Box>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add medicine"
                    placeholder="Search by name or QR / barcode"
                  />
                )}
              />
              <IconButton
                color="primary"
                onClick={() => setScannerOpen(true)}
                aria-label="Scan medicine QR"
                sx={{
                  bgcolor: "#EEF4FF",
                  borderRadius: "12px",
                  p: 1,
                  "&:hover": { bgcolor: "#E5EEFF" },
                }}
              >
                <QrCodeScannerIcon />
              </IconButton>
            </Box>

            {notice && (
              <Alert
                severity="info"
                onClose={() => setNotice("")}
                sx={{ borderRadius: "12px" }}
              >
                {notice}
              </Alert>
            )}

            {lines.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
                <AddIcon sx={{ fontSize: 28, opacity: 0.5 }} />
                <Typography sx={{ fontSize: 13 }}>
                  Search above to add the first medicine
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {lines.map((l) => {
                  const med = medById.get(l.medicineId);

                  return (
                    <SaleLineCard
                      key={l.medicineId}
                      line={l}
                      medicine={med}
                      stockMedicine={getStockMedicineForEdit(med)}
                      highlighted={highlightId === l.medicineId}
                      onChange={(patch) => updateLine(l.medicineId, patch)}
                      onRemove={() => removeLine(l.medicineId)}
                    />
                  );
                })}
              </Box>
            )}
          </SectionCard>

          {submitError && (
            <Alert severity="error" sx={{ borderRadius: "12px" }}>
              {submitError}
            </Alert>
          )}
        </DialogContent>

        <Divider sx={{ borderColor: "divider" }} />
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            flexDirection: "column",
            alignItems: "stretch",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                Total
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: 23, sm: 26 },
                  color: "#2563EB",
                  letterSpacing: "-0.02em",
                }}
              >
                ILS {money(total)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                Profit
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: profit < 0 ? "error.main" : "#10B981",
                }}
              >
                ILS {money(profit)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={onClose}
              disabled={submitting}
              variant="outlined"
              color="inherit"
              sx={{ flex: 1, color: "text.secondary", borderColor: "divider" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canSubmit}
              variant="contained"
              sx={{
                flex: 2,
                minHeight: 48,
                fontSize: 14,
                borderRadius: "14px",
              }}
            >
              {submitting
                ? editSale
                  ? "Saving changes…"
                  : "Saving…"
                : editSale
                ? "Save changes"
                : "Confirm sale"}{" "}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SalesPage({ selectedPharmacy = "old" }) {
  const isMobile = useMediaQuery("(max-width:767px)");

  // Admin flag: same localStorage mechanism as Inventory (read-only here).
  const [isAdmin] = useState(readIsAdmin);

  // Date ALWAYS starts as the current local date and is never persisted.
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const [paymentType, setPaymentType] = useState("All");
  const [receiver, setReceiver] = useState("All");
  const [destination, setDestination] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [itemsBySale, setItemsBySale] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [addOpen, setAddOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, severity, message });

  // ── data loading ──
  const loadMedicines = useCallback(async () => {
    console.log("🔥 LOAD MEDICINES START");

    const data = await getAllMedicines();

    console.log("🔥 LOAD MEDICINES RESULT:", data);
    console.log("🔥 MEDICINES COUNT:", data?.length);

    setMedicines(data || []);
  }, []);

  const loadSeq = useRef(0);
  const loadSales = useCallback(async () => {
    const seq = ++loadSeq.current;
    const { startIso, endIso } = getLocalDayRangeIso(selectedDate);
    const rows = await getSalesByRangeDB(startIso, endIso);
    // Pharmacy isolation: only this pharmacy's sales ever reach state
    const own = rows
      .filter((s) => s.pharmacy === selectedPharmacy)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const items = await getSaleItemsBySaleIdsDB(own.map((s) => s.id));
    if (seq !== loadSeq.current) return; // a newer load superseded this one
    const grouped = {};
    for (const it of items) (grouped[it.sale_id] ||= []).push(it);
    setSales(own);
    setItemsBySale(grouped);
  }, [selectedDate, selectedPharmacy]);

  // Always call the LATEST loader from async continuations (sync, dialogs…)
  // so a slow callback can never repopulate the page with the other pharmacy.
  const loadSalesRef = useRef(loadSales);
  loadSalesRef.current = loadSales;

  useEffect(() => {
    loadSales().catch(console.error);
  }, [loadSales]);

  useEffect(() => {
    loadMedicines().catch(console.error);
  }, [loadMedicines]);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncAll();
      await loadMedicines();
      await loadSalesRef.current();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  }, [loadMedicines]);

  // Sync on open, and again whenever the connection comes back.
  useEffect(() => {
    runSync();
    const goOnline = () => {
      setIsOnline(true);
      runSync();
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [runSync]);

  // ── pharmacy-scoped medicines for the Add Sale dialog ──
  const pharmacyMedicines = useMemo(
    () =>
      medicines
        .filter(
          (m) =>
            !m.deleted &&
            getMedicinePharmacy(m) === selectedPharmacy &&
            (selectedPharmacy !== "old" ||
              !m.location ||
              m.location === "معروض"),
        )
        .sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || "")),
        ),
    [medicines, selectedPharmacy],
  );

  // ── filters (all combined with AND) ──
  const receiverAccounts = useMemo(
    () => getAccountsForReceiver(receiver),
    [receiver],
  );

  const handleReceiverFilter = (value) => {
    setReceiver(value);
    // drop the destination if it is not valid for the newly chosen receiver
    if (
      destination !== "All" &&
      !getAccountsForReceiver(value).includes(destination)
    ) {
      setDestination("All");
    }
  };

  const filteredSales = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    const termDigits = term.replace(/\s+/g, "");
    return sales.filter((s) => {
      if (s.pharmacy !== selectedPharmacy) return false;
      if (toDateKey(s.created_at) !== selectedDate) return false;
      if (paymentType !== "All" && s.payment_type !== paymentType) return false;
      if (receiver !== "All" && s.receiver !== receiver) return false;
      if (destination !== "All" && s.destination_account !== destination)
        return false;
      if (status !== "All" && s.payment_status !== status) return false;
      if (term) {
        const hit =
          (s.customer_name || "").toLowerCase().includes(term) ||
          (s.customer_phone || "").replace(/\s+/g, "").includes(termDigits) ||
          String(s.id).toLowerCase().includes(term);
        if (!hit) return false;
      }
      return true;
    });
  }, [
    sales,
    selectedPharmacy,
    selectedDate,
    paymentType,
    receiver,
    destination,
    status,
    deferredSearch,
  ]);

  const summary = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let items = 0;
    for (const s of filteredSales) {
      revenue += Number(s.total) || 0;
      profit += Number(s.total_profit) || 0;
      items += (itemsBySale[s.id] || []).length;
    }
    return {
      count: filteredSales.length,
      revenue: round2(revenue),
      profit: round2(profit),
      items,
    };
  }, [filteredSales, itemsBySale]);

  const activeChips = [
    paymentType !== "All" && {
      key: "type",
      label: `Payment: ${paymentType}`,
      clear: () => setPaymentType("All"),
    },
    receiver !== "All" && {
      key: "receiver",
      label: `Receiver: ${receiver}`,
      clear: () => handleReceiverFilter("All"),
    },
    destination !== "All" && {
      key: "dest",
      label: `Account: ${destination}`,
      clear: () => setDestination("All"),
    },
    status !== "All" && {
      key: "status",
      label: `Status: ${status === "pending" ? "Pending" : "Received"}`,
      clear: () => setStatus("All"),
    },
    search.trim() && {
      key: "search",
      label: `Search: "${search.trim()}"`,
      clear: () => setSearch(""),
    },
  ].filter(Boolean);

  const clearFilters = () => {
    setPaymentType("All");
    setReceiver("All");
    setDestination("All");
    setStatus("All");
    setSearch("");
  };

  const today = toDateKey(new Date());

  // ── actions ──
  const handleCreateSale = async (form) => {
    if (!readIsAdmin()) throw new Error("Only an admin can add sales.");
    // pharmacy comes from the app-level selection, never from the form
    const { sale } = await createSaleDB({
      ...form,
      pharmacy: selectedPharmacy,
      createdBy: "admin",
    });
    setAddOpen(false);
    // Show the new sale: jump to today if another date was being viewed
    if (selectedDate !== toDateKey(sale.created_at))
      setSelectedDate(toDateKey(sale.created_at));
    await Promise.all([loadMedicines(), loadSalesRef.current()]);
    showSnack(
      `Sale saved · ILS ${money(sale.total)}${
        navigator.onLine ? "" : " (offline – will sync later)"
      }`,
    );
    // background: upload the sale, its items and the stock change
    syncAfterSaleChange()
      .then(() => loadSalesRef.current())
      .catch(console.error);
  };
  const handleEditSale = async (form) => {
    if (!readIsAdmin()) {
      throw new Error("Only an admin can edit sales.");
    }

    if (!editSale) {
      throw new Error("No sale selected for editing.");
    }

    if (editSale.pharmacy !== selectedPharmacy) {
      throw new Error("This sale belongs to the other pharmacy.");
    }

    if (editSale.sale_status === "cancelled") {
      throw new Error("Cancelled sales cannot be edited.");
    }

    try {
      const { sale } = await updateSaleWithStockDB(
        editSale.id,
        selectedPharmacy,
        form,
      );

      setEditSale(null);

      await Promise.all([loadMedicines(), loadSalesRef.current()]);

      showSnack(
        `Sale updated · ILS ${money(sale.total)}${
          navigator.onLine ? "" : " (offline – will sync later)"
        }`,
        "success",
      );

      if (navigator.onLine) {
        setIsSyncing(true);

        try {
          await syncAfterSaleChange();
          await loadSalesRef.current();
          await loadMedicines();
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (err) {
      console.error("Edit sale failed:", err);
      throw err;
    }
  };
  const handleDeleteSale = async (sale) => {
    if (!readIsAdmin()) {
      throw new Error("Only an admin can delete sales.");
    }

    if (sale.pharmacy !== selectedPharmacy) {
      throw new Error("This sale belongs to the other pharmacy.");
    }

    const confirmed = window.confirm(
      `⚠️ DELETE SALE\n\n` +
        `Sale: ${sale.id}\n\n` +
        `This action is permanent and cannot be undone.\n` +
        `The sale, its items, and related local records will be deleted.\n` +
        `The stock will be restored.\n\n` +
        `Are you absolutely sure you want to continue?`,
    );

    if (!confirmed) return;

    try {
      await deleteSaleDB(sale.id, selectedPharmacy);

      await Promise.all([loadMedicines(), loadSalesRef.current()]);

      setDetailId(null);

      showSnack(
        "Sale deleted permanently · Stock restored successfully.",
        "success",
      );

      if (navigator.onLine) {
        setIsSyncing(true);

        try {
          await syncAfterSaleChange();
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (err) {
      console.error("Delete sale failed:", err);

      showSnack(err?.message || "Failed to delete sale.", "error");
    }
  };
  const handleMarkReceived = useCallback(
    async (sale) => {
      if (!readIsAdmin()) return;
      try {
        await markSalePaymentReceivedDB(sale.id, selectedPharmacy);
        await loadSalesRef.current();
        syncAfterSaleChange().catch(console.error);
      } catch (err) {
        console.error(err);
        showSnack(
          err?.message || "Could not update the payment status.",
          "error",
        );
      }
    },
    [selectedPharmacy],
  );

  const handleOpenDetails = useCallback((id) => setDetailId(id), []);
  const detailSale = detailId
    ? sales.find((s) => s.id === detailId) || null
    : null;

  const filterFields = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: 1.5,
      }}
    >
      <FormControl fullWidth size="small">
        <InputLabel>Payment type</InputLabel>
        <Select
          value={paymentType}
          label="Payment type"
          onChange={(e) => setPaymentType(e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="All">All</MenuItem>
          {PAYMENT_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <InputLabel>Receiver</InputLabel>
        <Select
          value={receiver}
          label="Receiver"
          onChange={(e) => handleReceiverFilter(e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="All">All</MenuItem>
          {RECEIVER_FILTER_OPTIONS.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <InputLabel>Destination account</InputLabel>
        <Select
          value={destination}
          label="Destination account"
          onChange={(e) => setDestination(e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="All">All</MenuItem>
          {receiverAccounts.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <InputLabel>Payment status</InputLabel>
        <Select
          value={status}
          label="Payment status"
          onChange={(e) => setStatus(e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="received">Received</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          backgroundImage:
            "radial-gradient(circle at 88% 0%, rgba(37,99,235,0.055), transparent 28%), radial-gradient(circle at 8% 20%, rgba(15,159,110,0.035), transparent 24%)",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pt: 2,
            pb: 14,
            maxWidth: 1280,
            mx: "auto",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "13px",
                    bgcolor: "#EEF4FF",
                    color: "#2563EB",
                    border: "1px solid #DCE7FB",
                  }}
                >
                  <SalesIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: 21, lineHeight: 1.15 }}
                  >
                    Sales
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {PHARMACY_NAMES[selectedPharmacy]}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {!isOnline && (
                <Chip
                  size="small"
                  icon={<OfflineIcon sx={{ fontSize: "14px !important" }} />}
                  label="Offline – saved locally"
                  sx={{ bgcolor: "#FFF3DF", color: "#F59E0B" }}
                />
              )}
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                disabled={isSyncing || !isOnline}
                onClick={runSync}
                sx={{ borderRadius: "10px" }}
              >
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>
            </Box>
          </Box>

          {/* Summary (follows pharmacy + date + active filters) */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 1.5,
              mb: 2,
            }}
          >
            <SummaryCard
              icon={<SalesIcon fontSize="small" />}
              label="Total Sales"
              value={summary.count}
              color="#2563EB"
              bg="rgba(59,130,246,0.12)"
            />
            <SummaryCard
              icon={<ReceiptIcon fontSize="small" />}
              label="Revenue"
              value={`ILS ${money(summary.revenue)}`}
              color="#172033"
              bg="rgba(148,163,184,0.12)"
            />
            <SummaryCard
              icon={<ProfitIcon fontSize="small" />}
              label="Profit"
              value={`ILS ${money(summary.profit)}`}
              color="#10B981"
              bg="rgba(16,185,129,0.12)"
            />
            <SummaryCard
              icon={<ItemsIcon fontSize="small" />}
              label="Items Sold"
              value={summary.items}
              color="#F59E0B"
              bg="rgba(245,158,11,0.12)"
            />
          </Box>

          {/* Filters */}
          <Box
            sx={{
              background: "rgba(255,255,255,0.94)",
              border: "1px solid #E7ECF3",
              borderRadius: "18px",
              p: 2,
              mb: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "auto 1fr" },
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <IconButton
                  size="small"
                  onClick={() => setSelectedDate((d) => shiftDateKey(d, -1))}
                  aria-label="Previous day"
                  sx={{
                    bgcolor: "#F2F5F8",
                    borderRadius: "10px",
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <TextField
                  type="date"
                  size="small"
                  label="Date"
                  value={selectedDate}
                  onChange={(e) =>
                    e.target.value && setSelectedDate(e.target.value)
                  }
                  sx={{ flex: 1, minWidth: 160, ...dateFieldSx }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <IconButton
                  size="small"
                  onClick={() => setSelectedDate((d) => shiftDateKey(d, 1))}
                  aria-label="Next day"
                  sx={{
                    bgcolor: "#F2F5F8",
                    borderRadius: "10px",
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
                <Button
                  size="small"
                  variant={selectedDate === today ? "contained" : "outlined"}
                  startIcon={<TodayIcon />}
                  onClick={() => setSelectedDate(toDateKey(new Date()))}
                  sx={{ borderRadius: "10px", whiteSpace: "nowrap" }}
                >
                  Today
                </Button>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search customer, phone or sale ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                {isMobile && (
                  <Button
                    variant="outlined"
                    onClick={() => setFiltersOpen((o) => !o)}
                    startIcon={<FilterIcon />}
                    sx={{
                      borderRadius: "14px",
                      whiteSpace: "nowrap",
                      borderColor: "rgba(148,163,184,0.2)",
                      color: "#172033",
                    }}
                  >
                    {activeChips.filter((c) => c.key !== "search").length || ""}
                  </Button>
                )}
              </Box>
            </Box>

            {isMobile ? (
              <Collapse in={filtersOpen}>{filterFields}</Collapse>
            ) : (
              filterFields
            )}

            {activeChips.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  alignItems: "center",
                }}
              >
                {activeChips.map((c) => (
                  <Chip
                    key={c.key}
                    size="small"
                    label={c.label}
                    onDelete={c.clear}
                    sx={{ bgcolor: "#EEF4FF", color: "#2563EB" }}
                  />
                ))}
                <Button
                  size="small"
                  onClick={clearFilters}
                  sx={{ fontSize: 12, color: "primary.light", minWidth: 0 }}
                >
                  Clear Filters
                </Button>
              </Box>
            )}
          </Box>

          {/* List header */}
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
              {filteredSales.length}{" "}
              {filteredSales.length === 1 ? "sale" : "sales"} ·{" "}
              {formatDateLabel(selectedDate)}
            </Typography>
            {!isAdmin && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", opacity: 0.7 }}
              >
                View only · admin login is on the Inventory page
              </Typography>
            )}
          </Box>

          {/* Sale cards */}
          {filteredSales.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {filteredSales.map((s) => (
                <SaleCard
                  key={s.id}
                  sale={s}
                  itemCount={(itemsBySale[s.id] || []).length}
                  isAdmin={isAdmin}
                  onOpen={handleOpenDetails}
                  onMarkReceived={handleMarkReceived}
                  onCancel={handleDeleteSale}
                  onEdit={(sale) => setEditSale(sale)}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", pt: 8, pb: 4 }}>
              <Avatar
                sx={{
                  bgcolor: "#F2F5F8",
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  borderRadius: "20px",
                }}
              >
                <SalesIcon sx={{ fontSize: 32, color: "text.secondary" }} />
              </Avatar>
              <Typography sx={{ color: "text.secondary", fontWeight: 500 }}>
                No sales found
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", opacity: 0.6 }}
              >
                {activeChips.length > 0
                  ? "Try clearing some filters"
                  : `Nothing recorded for ${formatDateLabel(selectedDate)}`}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Add Sale – admin only */}
        {isAdmin && (
          <Fab
            color="primary"
            aria-label="Add sale"
            onClick={() => setAddOpen(true)}
            sx={{
              position: "fixed",
              bottom: { xs: 82, sm: 28 },
              right: { xs: 18, sm: 28 },
              width: 62,
              height: 62,
              borderRadius: "19px",
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>
        )}

        {isAdmin && (
          <AddSaleDialog
            open={addOpen || Boolean(editSale)}
            onClose={() => {
              setAddOpen(false);
              setEditSale(null);
            }}
            medicines={pharmacyMedicines}
            onSubmit={editSale ? handleEditSale : handleCreateSale}
            editSale={editSale}
            editItems={editSale ? itemsBySale[editSale.id] || [] : []}
          />
        )}

        <SaleDetailsDialog
          open={Boolean(detailSale)}
          onClose={() => setDetailId(null)}
          sale={detailSale}
          items={detailSale ? itemsBySale[detailSale.id] || [] : []}
          pharmacyName={PHARMACY_NAMES[selectedPharmacy]}
          isAdmin={isAdmin}
          onMarkReceived={handleMarkReceived}
        />

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ mb: 8 }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            sx={{ borderRadius: "12px" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
