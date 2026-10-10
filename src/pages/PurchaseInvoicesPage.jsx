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
  Button,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Autocomplete,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  ReceiptLong as InvoiceIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  getAllMedicines,
  getAllPurchaseInvoicesDB,
  getPurchasePaymentsDB,
  savePurchaseInvoiceDB,
  updatePurchaseInvoiceDB,
  addPurchasePaymentDB,
  deletePurchaseInvoiceDB,
  saveMedicineDB,
} from "../db";
import { syncMedicines } from "../sync";

// ─── Theme (Premium light design system) ───────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#F4F7FC", paper: "#FFFFFF" },
    primary: { main: "#3B5BFF", light: "#6B85FF", dark: "#2742D9" },
    secondary: { main: "#7C5CFF" },
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
    text: { primary: "#111A2E", secondary: "#64748B" },
    divider: "#E6ECF5",
  },
  typography: {
    fontFamily:
      '"Inter", "Plus Jakarta Sans", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    h5: { fontWeight: 800, letterSpacing: "-0.03em" },
    h6: { fontWeight: 800, letterSpacing: "-0.03em" },
    subtitle2: { fontWeight: 800, letterSpacing: "-0.01em" },
    button: {
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "-0.005em",
    },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@keyframes pi-fadeUp": {
          from: { opacity: 0, transform: "translateY(14px) scale(0.985)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "@keyframes pi-fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "@keyframes pi-popIn": {
          from: { opacity: 0, transform: "translateY(18px) scale(0.965)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "@keyframes pi-float": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-14px,0)" },
        },
        "@keyframes pi-shine": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "@keyframes pi-barGrow": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          background: "#F4F7FC",
        },
        "::selection": { background: "rgba(59,91,255,0.18)" },
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-thumb": {
          background: "#CBD5E6",
          borderRadius: 10,
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        "*::-webkit-scrollbar-thumb:hover": {
          background: "#AEBBD3",
          backgroundClip: "content-box",
          border: "2px solid transparent",
        },
        ".MuiDialog-root .MuiCard-root:hover": {
          transform: "none",
          boxShadow: "0 5px 22px rgba(15,23,42,0.045)",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animation: "none !important",
            transition: "none !important",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg,#FFFFFF 0%,#FBFCFF 100%)",
          border: "1px solid #E6ECF5",
          borderRadius: 20,
          boxShadow:
            "0 1px 2px rgba(16,24,40,0.04), 0 8px 28px rgba(31,50,100,0.06)",
          transition:
            "transform .28s cubic-bezier(.2,.8,.2,1), box-shadow .28s ease, border-color .28s ease",
          "&:hover": {
            borderColor: "#D3DEFA",
            transform: "translateY(-4px)",
            boxShadow:
              "0 2px 4px rgba(16,24,40,0.04), 0 22px 44px rgba(59,91,255,0.13)",
          },
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          "& .MuiCardActionArea-focusHighlight": { background: "#3B5BFF" },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition:
            "transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, background .25s ease, border-color .25s ease",
          "&:active": { transform: "scale(0.97)" },
        },
        contained: {
          backgroundImage:
            "linear-gradient(135deg,#4F6BFF 0%,#3B5BFF 50%,#6A4DFF 100%)",
          boxShadow: "0 8px 20px rgba(59,91,255,0.28)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 12px 26px rgba(59,91,255,0.38)",
            backgroundImage:
              "linear-gradient(135deg,#5C76FF 0%,#4663FF 50%,#7659FF 100%)",
          },
          "&.Mui-disabled": {
            backgroundImage: "none",
            boxShadow: "none",
          },
        },
        containedError: {
          backgroundImage: "linear-gradient(135deg,#F76B6B 0%,#EF4444 100%)",
          boxShadow: "0 8px 20px rgba(239,68,68,0.26)",
          "&:hover": {
            backgroundImage: "linear-gradient(135deg,#F97B7B 0%,#F05252 100%)",
            boxShadow: "0 12px 26px rgba(239,68,68,0.36)",
          },
        },
        outlined: {
          borderColor: "#D9E2F3",
          background: "#FFFFFF",
          "&:hover": {
            background: "#F5F8FF",
            borderColor: "#B9C8F5",
            transform: "translateY(-1px)",
          },
        },
        outlinedError: {
          borderColor: "#FBC9C9",
          "&:hover": { background: "#FFF5F5", borderColor: "#F5A3A3" },
        },
        text: {
          "&:hover": { background: "rgba(59,91,255,0.07)" },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "background .2s ease, transform .2s ease",
          "&:hover": {
            background: "rgba(59,91,255,0.08)",
            transform: "rotate(0deg) scale(1.06)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 13,
          background: "#FFFFFF",
          transition: "box-shadow .2s ease, background .2s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#DEE6F3",
            transition: "border-color .2s ease",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#B7C6EE",
          },
          "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(59,91,255,0.12)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3B5BFF",
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontWeight: 600, "&.Mui-focused": { color: "#3B5BFF" } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 10 },
        outlined: {
          borderColor: "#D6E0F7",
          background: "linear-gradient(135deg,#F3F6FF,#F8F5FF)",
          color: "#3B5BFF",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { overflow: "hidden" },
        bar: {
          borderRadius: 8,
          transformOrigin: "left center",
          animation: "pi-barGrow .9s cubic-bezier(.2,.8,.2,1) both",
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: "#EBF0F8" } },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            background: "rgba(17,26,46,0.32)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          },
        },
        paper: {
          background: "linear-gradient(180deg,#FFFFFF 0%,#FAFBFF 100%)",
          borderRadius: 28,
          border: "1px solid rgba(230,236,245,0.9)",
          boxShadow: "0 30px 80px rgba(20,30,70,0.22)",
          animation: "pi-popIn .38s cubic-bezier(.2,.8,.2,1) both",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { padding: "20px 24px 16px" } },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: "20px 24px" } },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          borderTop: "1px solid #EBF0F8",
          background: "rgba(246,249,255,0.7)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          marginTop: 6,
          border: "1px solid #E3EAF7",
          boxShadow: "0 20px 50px rgba(20,30,70,0.16)",
          animation: "pi-fadeUp .22s ease both",
        },
        option: {
          borderRadius: 10,
          margin: "2px 6px",
          transition: "background .15s ease",
          "&.Mui-focused": { background: "#EEF2FF !important" },
          "&[aria-selected='true']": { background: "#E6ECFF !important" },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          marginTop: 6,
          border: "1px solid #E3EAF7",
          boxShadow: "0 20px 50px rgba(20,30,70,0.16)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "2px 6px",
          fontWeight: 600,
          "&.Mui-selected": { background: "#E9EEFF" },
          "&:hover": { background: "#F1F4FF" },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
  },
});

const TODAY = new Date().toISOString().split("T")[0];

// Same case-insensitive matching behavior as the Sales medicine search.
const normalizeSearch = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase();

const filterMedicineOptions = (options, { inputValue }) => {
  const term = normalizeSearch(inputValue);
  const matches = term
    ? options.filter(
        (medicine) =>
          normalizeSearch(medicine.name).includes(term) ||
          normalizeSearch(medicine.qrCode).includes(term),
      )
    : options;

  if (term) {
    matches.sort(
      (a, b) =>
        Number(normalizeSearch(b.name).startsWith(term)) -
        Number(normalizeSearch(a.name).startsWith(term)),
    );
  }

  return matches.slice(0, 40);
};

const PHARMACY_KEY = "old";

export default function PurchaseInvoicesPage() {
  // ── States ─────────────────────────────────────────────────────────────────
  // No sample invoices; data comes from the local database.
  const [invoices, setInvoices] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [newMedicineForm, setNewMedicineForm] = useState(null);
  const [newMedicineRowIndex, setNewMedicineRowIndex] = useState(null);
  const [newMedicineSaving, setNewMedicineSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Dialogs & Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState("");

  // Form States
  const [invoiceForm, setInvoiceForm] = useState({
    supplierName: "",
    invoiceNumber: "",
    date: TODAY,
    notes: "",
    items: [],
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentType: "Application",
    receiver: "Aseel",
    destinationAccount: "Jawwal Pay",
    date: TODAY,
    notes: "",
  });

  // Load real invoices and medicines from IndexedDB.
  const loadPageData = useCallback(async () => {
    try {
      const [invoiceRows, medicineRows] = await Promise.all([
        getAllPurchaseInvoicesDB(),
        getAllMedicines(),
      ]);
      const pharmacyInvoices = (invoiceRows || []).filter(
        (invoice) => (invoice.pharmacy || "old") === PHARMACY_KEY,
      );
      const invoicesWithPayments = await Promise.all(
        pharmacyInvoices.map(async (invoice) => {
          const storedPayments = await getPurchasePaymentsDB(invoice.id).catch(
            () => [],
          );
          const legacyPayments = Array.isArray(invoice.payments)
            ? invoice.payments
            : [];
          const payments = storedPayments?.length
            ? storedPayments
            : legacyPayments;
          return {
            ...invoice,
            totalAmount: Number(invoice.totalAmount) || 0,
            paidAmount: Number(invoice.paidAmount) || 0,
            items: Array.isArray(invoice.items) ? invoice.items : [],
            payments: [...payments].sort((a, b) =>
              String(b.date || "").localeCompare(String(a.date || "")),
            ),
          };
        }),
      );
      setInvoices(invoicesWithPayments);

      setMedicines(
        (medicineRows || []).filter(
          (medicine) =>
            !medicine.deleted && (medicine.pharmacy || "old") === PHARMACY_KEY,
        ),
      );
    } catch (error) {
      console.error("Failed to load purchase invoices data:", error);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Existing supplier names.
  const existingSuppliers = useMemo(() => {
    const names = invoices.map((inv) => inv.supplierName).filter(Boolean);
    return Array.from(new Set(names));
  }, [invoices]);

  // ── Stats Calculations ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalValue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalUnpaid = invoices.reduce(
      (sum, inv) => sum + (inv.totalAmount - inv.paidAmount),
      0,
    );
    const unpaidCount = invoices.filter(
      (inv) => inv.paymentStatus !== "fully_paid",
    ).length;

    return { totalCount, totalValue, totalUnpaid, unpaidCount };
  }, [invoices]);

  // ── Filtered & Sorted Invoices ─────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (supplierFilter !== "All" && inv.supplierName !== supplierFilter)
          return false;
        if (statusFilter !== "All" && inv.paymentStatus !== statusFilter)
          return false;
        if (fromDate && inv.date < fromDate) return false;
        if (toDate && inv.date > toDate) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
          const matchSupplier = inv.supplierName?.toLowerCase().includes(q);
          if (!matchNum && !matchSupplier) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
        if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
        if (sortBy === "amount") return b.totalAmount - a.totalAmount;
        if (sortBy === "supplier")
          return a.supplierName.localeCompare(b.supplierName);
        return 0;
      });
  }, [
    invoices,
    supplierFilter,
    statusFilter,
    fromDate,
    toDate,
    searchQuery,
    sortBy,
  ]);

  const isUnitPricedMedicine = (medicine) => {
    const type = String(medicine?.type || "").toLowerCase();
    return [
      "tablets",
      "tablet",
      "tab",
      "ampoule",
      "amp",
      "suppository",
      "supp",
    ].includes(type);
  };

  const getUnitsPerBox = (medicine) => {
    if (!isUnitPricedMedicine(medicine)) return 1;
    const stripsPerBox = Number(medicine?.stripsPerBox) || 0;
    const pillsPerStrip = Number(medicine?.pillsPerStrip) || 0;
    return stripsPerBox * pillsPerStrip;
  };

  const getInvoiceLineTotal = (item) => {
    const totalUnits =
      (Number(item.storageQty) || 0) + (Number(item.displayedQty) || 0);
    const unitsPerBox = getUnitsPerBox(item.medicine);
    if (isUnitPricedMedicine(item.medicine) && unitsPerBox <= 0) return 0;
    const boxesEquivalent = totalUnits / unitsPerBox;
    return boxesEquivalent * (Number(item.costPrice) || 0);
  };

  const getCurrentInvoiceTotal = () =>
    invoiceForm.items.reduce((sum, item) => sum + getInvoiceLineTotal(item), 0);

  const validInvoiceItems = invoiceForm.items.filter(
    (item) =>
      item.medicine &&
      (Number(item.storageQty) > 0 || Number(item.displayedQty) > 0) &&
      item.storageQty !== "" &&
      item.displayedQty !== "" &&
      Number(item.storageQty) >= 0 &&
      Number(item.displayedQty) >= 0 &&
      item.costPrice !== "" &&
      Number(item.costPrice) >= 0 &&
      item.sellPrice !== "" &&
      Number(item.sellPrice) >= 0 &&
      (!isUnitPricedMedicine(item.medicine) ||
        getUnitsPerBox(item.medicine) > 0),
  );
  const canSaveInvoice = Boolean(
    invoiceForm.supplierName.trim() &&
      invoiceForm.date &&
      invoiceForm.items.length > 0 &&
      validInvoiceItems.length > 0 &&
      validInvoiceItems.length === invoiceForm.items.length &&
      !newMedicineForm &&
      !invoiceSaving,
  );

  const openEditInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceForm({
      supplierName: invoice.supplierName || "",
      invoiceNumber: invoice.invoiceNumber || "",
      date: invoice.date || TODAY,
      notes: invoice.notes || "",
      items: (invoice.items || []).map((item) => {
        const medicine =
          medicines.find((m) => m.id === item.medicineId) || null;
        return {
          medicine,
          storageQty: String(item.storageQty ?? "0"),
          displayedQty: String(item.displayedQty ?? "0"),
          costPrice: String(item.costPrice ?? medicine?.costPrice ?? ""),
          sellPrice: String(item.sellPrice ?? medicine?.sellPrice ?? ""),
          isNewMedicine: false,
          searchText: item.name || medicine?.name || "",
        };
      }),
    });
    setSelectedInvoice(null);
    setIsAddOpen(true);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenAddInvoice = () => {
    setEditingInvoiceId(null);
    setNewMedicineForm(null);
    setNewMedicineRowIndex(null);
    setInvoiceForm({
      supplierName: "",
      invoiceNumber: "",
      date: TODAY,
      notes: "",
      items: [
        {
          medicine: null,
          storageQty: "",
          displayedQty: "",
          costPrice: "",
          sellPrice: "",
          isNewMedicine: false,
          searchText: "",
        },
      ],
    });
    setIsAddOpen(true);
  };

  const handleAddItemRow = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          medicine: null,
          storageQty: "",
          displayedQty: "",
          costPrice: "",
          sellPrice: "",
          isNewMedicine: false,
          searchText: "",
        },
      ],
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (invoiceForm.items.length === 1) return;
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const startCreateMedicine = (rowIndex, typedName) => {
    const name = String(typedName || "").trim();
    if (!name) return;
    const duplicate = medicines.find(
      (medicine) => normalizeSearch(medicine.name) === normalizeSearch(name),
    );
    if (duplicate) {
      const items = [...invoiceForm.items];
      items[rowIndex] = {
        ...items[rowIndex],
        medicine: duplicate,
        costPrice: duplicate.costPrice ?? "",
        sellPrice: duplicate.sellPrice ?? "",
        searchText: duplicate.name,
      };
      setInvoiceForm((prev) => ({ ...prev, items }));
      setNewMedicineForm(null);
      return;
    }
    setNewMedicineRowIndex(rowIndex);
    setNewMedicineForm({
      name,
      type: "",
      displayed_qty: "0",
      storage_qty: "0",
      stripsPerBox: "",
      pillsPerStrip: "",
      costPrice: "",
      sellPrice: "",
      company: "",
      expDate: "",
    });
  };

  const updateNewMedicineField = (field, value) => {
    setNewMedicineForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveNewMedicine = async () => {
    if (!newMedicineForm || newMedicineSaving) return;
    const needsPackSize = isUnitPricedMedicine(newMedicineForm);
    if (
      !newMedicineForm.name.trim() ||
      !newMedicineForm.type ||
      newMedicineForm.costPrice === "" ||
      newMedicineForm.sellPrice === "" ||
      (needsPackSize &&
        (!(Number(newMedicineForm.stripsPerBox) > 0) ||
          !(Number(newMedicineForm.pillsPerStrip) > 0)))
    ) {
      window.alert(
        "Enter the medicine name, type, cost price and selling price. For tablets, ampoules and suppositories, also enter the units per box.",
      );
      return;
    }

    const duplicate = medicines.find(
      (medicine) =>
        normalizeSearch(medicine.name) ===
        normalizeSearch(newMedicineForm.name),
    );
    if (duplicate) {
      const items = [...invoiceForm.items];
      items[newMedicineRowIndex] = {
        ...items[newMedicineRowIndex],
        medicine: duplicate,
        costPrice: duplicate.costPrice ?? "",
        sellPrice: duplicate.sellPrice ?? "",
        searchText: duplicate.name,
      };
      setInvoiceForm((prev) => ({ ...prev, items }));
      setNewMedicineForm(null);
      return;
    }

    setNewMedicineSaving(true);
    try {
      // Stock starts at zero; invoice quantities are added when saved.
      const displayed = 0;
      const storage = 0;
      const medicine = {
        ...newMedicineForm,
        id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pharmacy: PHARMACY_KEY,
        displayed_qty: displayed,
        storage_qty: storage,
        stockUnits: displayed + storage,
        qrCode: "",
        stripsPerBox: Number(newMedicineForm.stripsPerBox) || 0,
        pillsPerStrip: Number(newMedicineForm.pillsPerStrip) || 0,
        costPrice: Number(newMedicineForm.costPrice),
        sellPrice: Number(newMedicineForm.sellPrice),
        updatedAt: new Date().toISOString(),
        deleted: false,
        synced: false,
      };
      await saveMedicineDB(medicine);
      if (navigator.onLine) syncMedicines().catch(console.error);
      setMedicines((prev) => [...prev, medicine]);
      const items = [...invoiceForm.items];
      items[newMedicineRowIndex] = {
        ...items[newMedicineRowIndex],
        medicine,
        costPrice: medicine.costPrice,
        sellPrice: medicine.sellPrice,
        searchText: medicine.name,
      };
      setInvoiceForm((prev) => ({ ...prev, items }));
      setNewMedicineForm(null);
      setNewMedicineRowIndex(null);
    } catch (error) {
      console.error("Failed to create medicine from purchase invoice:", error);
      window.alert(
        "Could not save the new medicine. Check the console for details.",
      );
    } finally {
      setNewMedicineSaving(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!canSaveInvoice) return;
    setInvoiceSaving(true);
    const totalAmount =
      Math.round(
        (validInvoiceItems.reduce(
          (sum, item) => sum + getInvoiceLineTotal(item),
          0,
        ) +
          Number.EPSILON) *
          100,
      ) / 100;

    const previousInvoice = editingInvoiceId
      ? invoices.find((invoice) => invoice.id === editingInvoiceId)
      : null;
    const newInvoice = {
      ...(previousInvoice || {}),
      id: editingInvoiceId || `inv-${Date.now()}`,
      pharmacy: PHARMACY_KEY,
      supplierName: invoiceForm.supplierName.trim(),
      invoiceNumber: invoiceForm.invoiceNumber.trim(),
      date: invoiceForm.date,
      notes: invoiceForm.notes,
      totalAmount,
      paidAmount: previousInvoice?.paidAmount || 0,
      paymentStatus: previousInvoice?.paymentStatus || "unpaid",
      items: validInvoiceItems.map((item) => ({
        medicineId: item.medicine.id,
        name: item.medicine.name,
        storageQty: Number(item.storageQty),
        displayedQty: Number(item.displayedQty),
        costPrice: Number(item.costPrice),
        sellPrice: Number(item.sellPrice),
      })),
      payments: previousInvoice?.payments || [],
      synced: false,
    };

    try {
      if (editingInvoiceId) {
        await updatePurchaseInvoiceDB(newInvoice);
      } else {
        await savePurchaseInvoiceDB(newInvoice);
      }
      await loadPageData();
      setIsAddOpen(false);
      setEditingInvoiceId(null);
      setNewMedicineForm(null);
      setNewMedicineRowIndex(null);
    } catch (error) {
      console.error("Failed to save purchase invoice:", error);
      window.alert(
        "Could not save the invoice. Check the console for details.",
      );
    } finally {
      setInvoiceSaving(false);
    }
  };

  const handleSavePayment = async () => {
    const remainingBalance = Math.max(
      0,
      Number(selectedInvoice?.totalAmount || 0) -
        Number(selectedInvoice?.paidAmount || 0),
    );
    if (
      !selectedInvoice ||
      !paymentForm.amount ||
      Number(paymentForm.amount) <= 0 ||
      Number(paymentForm.amount) > remainingBalance ||
      !paymentForm.date
    )
      return;
    if (
      paymentForm.paymentType === "Application" &&
      (!paymentForm.receiver || !paymentForm.destinationAccount)
    )
      return;

    const amount = Number(paymentForm.amount);
    const newPaymentRecord = {
      id: `pay-${Date.now()}`,
      invoice_id: selectedInvoice.id,
      amount,
      paymentType: paymentForm.paymentType,
      receiver:
        paymentForm.paymentType === "Application" ? paymentForm.receiver : null,
      destinationAccount:
        paymentForm.paymentType === "Application"
          ? paymentForm.destinationAccount
          : null,
      date: paymentForm.date,
      notes: paymentForm.notes,
      created_at: new Date().toISOString(),
      synced: false,
    };

    try {
      const updatedInvoice = await addPurchasePaymentDB(
        selectedInvoice.id,
        newPaymentRecord,
      );
      const withPayments = {
        ...updatedInvoice,
        payments: [newPaymentRecord, ...(selectedInvoice.payments || [])],
      };
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === selectedInvoice.id ? withPayments : inv)),
      );
      setSelectedInvoice(withPayments);
      setIsNewPaymentOpen(false);
      setPaymentForm({
        amount: "",
        paymentType: "Application",
        receiver: "Aseel",
        destinationAccount: "Jawwal Pay",
        date: TODAY,
        notes: "",
      });
      await loadPageData();
    } catch (error) {
      console.error("Failed to save purchase payment:", error);
      window.alert("Could not save the payment. Please try again.");
    }
  };

  const handleDeleteInvoice = async () => {
    if (deleteInputText !== "DELETE" || !selectedInvoice) return;

    try {
      await deletePurchaseInvoiceDB(selectedInvoice.id);
      await loadPageData();
      setDeleteConfirmOpen(false);
      setSelectedInvoice(null);
      setDeleteInputText("");
    } catch (error) {
      console.error("Failed to delete purchase invoice:", error);
      window.alert("Could not delete the invoice from the database.");
    }
  };

  const getStatusColor = (status) => {
    if (status === "fully_paid") return "#0F9F6E";
    if (status === "partially_paid") return "#2563EB";
    return "#D97706";
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(1100px 520px at 12% -8%, rgba(99,128,255,0.16), transparent 60%), radial-gradient(900px 480px at 100% 0%, rgba(150,110,255,0.13), transparent 58%), radial-gradient(800px 500px at 50% 110%, rgba(56,189,248,0.10), transparent 60%), #F4F7FC",
          pb: 10,
          pt: { xs: 2.5, sm: 4 },
          px: { xs: 2, sm: 3 },
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
            animation: "pi-float 14s ease-in-out infinite",
          },
          "&::before": {
            width: 320,
            height: 320,
            top: 120,
            left: -120,
            background: "rgba(99,128,255,0.12)",
          },
          "&::after": {
            width: 360,
            height: 360,
            bottom: 60,
            right: -140,
            background: "rgba(167,139,250,0.14)",
            animationDelay: "-6s",
          },
          "& > *": { position: "relative", zIndex: 1 },
        }}
      >
        {/* ── Top Header & Stats ────────────────────────────────────────────── */}
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{
                  background:
                    "linear-gradient(135deg,#5C76FF 0%,#3B5BFF 55%,#7C5CFF 100%)",
                  color: "#fff",
                  width: 52,
                  height: 52,
                  borderRadius: "16px",
                  boxShadow: "0 12px 26px rgba(59,91,255,0.34)",
                  animation: "pi-popIn .6s cubic-bezier(.2,.8,.2,1) both",
                  "& svg": { fontSize: 26 },
                }}
              >
                <InvoiceIcon />
              </Avatar>
              <Box
                sx={{
                  animation: "pi-fadeUp .6s .08s cubic-bezier(.2,.8,.2,1) both",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: 22, sm: 26 },
                    lineHeight: 1.15,
                    background:
                      "linear-gradient(90deg,#111A2E 0%,#2C3F8F 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Purchase Invoices
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Manage supplier invoices, stock purchases and outstanding
                  balances
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddInvoice}
              sx={{
                borderRadius: "14px",
                px: 3.2,
                py: 1.2,
                fontSize: 14.5,
                animation: "pi-fadeUp .6s .15s cubic-bezier(.2,.8,.2,1) both",
              }}
            >
              Add Invoice
            </Button>
          </Box>

          {/* Stats Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <Card
              elevation={0}
              sx={{
                p: 2.4,
                animation: "pi-fadeUp .6s 0.10s cubic-bezier(.2,.8,.2,1) both",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3.5,
                  background: "linear-gradient(90deg,#3B5BFF,#7C5CFF)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: -34,
                  right: -34,
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(59,91,255,0.16), transparent 70%)",
                  pointerEvents: "none",
                },
                "& .MuiTypography-caption": {
                  fontWeight: 700,
                  letterSpacing: ".03em",
                  textTransform: "uppercase",
                  fontSize: 11,
                },
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Total Invoices
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  mt: 0.8,
                  fontSize: 26,
                  lineHeight: 1.15,
                }}
              >
                {stats.totalCount}
              </Typography>
            </Card>
            <Card
              elevation={0}
              sx={{
                p: 2.4,
                animation: "pi-fadeUp .6s 0.17s cubic-bezier(.2,.8,.2,1) both",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3.5,
                  background: "linear-gradient(90deg,#0EA5E9,#3B5BFF)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: -34,
                  right: -34,
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(14,165,233,0.16), transparent 70%)",
                  pointerEvents: "none",
                },
                "& .MuiTypography-caption": {
                  fontWeight: 700,
                  letterSpacing: ".03em",
                  textTransform: "uppercase",
                  fontSize: 11,
                },
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Total Invoice Value
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "text.primary",
                  mt: 0.8,
                  fontSize: 26,
                  lineHeight: 1.15,
                }}
              >
                {stats.totalValue.toFixed(2)} ₪
              </Typography>
            </Card>
            <Card
              elevation={0}
              sx={{
                p: 2.4,
                animation: "pi-fadeUp .6s 0.24s cubic-bezier(.2,.8,.2,1) both",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3.5,
                  background: "linear-gradient(90deg,#EF4444,#F59E0B)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: -34,
                  right: -34,
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(239,68,68,0.16), transparent 70%)",
                  pointerEvents: "none",
                },
                "& .MuiTypography-caption": {
                  fontWeight: 700,
                  letterSpacing: ".03em",
                  textTransform: "uppercase",
                  fontSize: 11,
                },
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Total Outstanding
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "error.main",
                  mt: 0.8,
                  fontSize: 26,
                  lineHeight: 1.15,
                }}
              >
                {stats.totalUnpaid.toFixed(2)} ₪
              </Typography>
            </Card>
            <Card
              elevation={0}
              sx={{
                p: 2.4,
                animation: "pi-fadeUp .6s 0.31s cubic-bezier(.2,.8,.2,1) both",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3.5,
                  background: "linear-gradient(90deg,#F59E0B,#F97316)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: -34,
                  right: -34,
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(245,158,11,0.16), transparent 70%)",
                  pointerEvents: "none",
                },
                "& .MuiTypography-caption": {
                  fontWeight: 700,
                  letterSpacing: ".03em",
                  textTransform: "uppercase",
                  fontSize: 11,
                },
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Unpaid / Partially Paid
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "warning.main",
                  mt: 0.8,
                  fontSize: 26,
                  lineHeight: 1.15,
                }}
              >
                {stats.unpaidCount}
              </Typography>
            </Card>
          </Box>
        </Box>

        {/* ── Filters Section ────────────────────────────────────────────────── */}
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            mb: 3,
            p: 2.2,
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: "22px",
            border: "1px solid rgba(226,233,246,0.95)",
            boxShadow:
              "0 1px 2px rgba(16,24,40,0.04), 0 12px 32px rgba(31,50,100,0.06)",
            animation: "pi-fadeUp .6s .38s cubic-bezier(.2,.8,.2,1) both",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(5, 1fr)",
            },
            gap: 1.5,
          }}
        >
          <TextField
            size="small"
            placeholder="Search by invoice number or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              ),
            }}
          />

          <FormControl size="small">
            <InputLabel>Supplier / Company</InputLabel>
            <Select
              value={supplierFilter}
              label="Supplier / Company"
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              {existingSuppliers.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                ml: 0.5,
                color: "text.secondary",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: ".03em",
                textTransform: "uppercase",
              }}
            >
              From Date
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                ml: 0.5,
                color: "text.secondary",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: ".03em",
                textTransform: "uppercase",
              }}
            >
              To Date
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <FormControl size="small">
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={statusFilter}
              label="Payment Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
              <MenuItem value="partially_paid">Partially Paid</MenuItem>
              <MenuItem value="fully_paid">Fully Paid</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* ── Cards Grid ────────────────────────────────────────────────────── */}
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2.4,
            "& > .MuiCard-root": {
              animation: "pi-fadeUp .6s cubic-bezier(.2,.8,.2,1) both",
              cursor: "pointer",
            },
            "& > .MuiCard-root:nth-of-type(1)": { animationDelay: ".05s" },
            "& > .MuiCard-root:nth-of-type(2)": { animationDelay: ".10s" },
            "& > .MuiCard-root:nth-of-type(3)": { animationDelay: ".15s" },
            "& > .MuiCard-root:nth-of-type(4)": { animationDelay: ".20s" },
            "& > .MuiCard-root:nth-of-type(5)": { animationDelay: ".25s" },
            "& > .MuiCard-root:nth-of-type(6)": { animationDelay: ".30s" },
            "& > .MuiCard-root:nth-of-type(n+7)": { animationDelay: ".35s" },
          }}
        >
          {filteredInvoices.map((inv) => {
            const paidRatio =
              Math.min(
                100,
                Math.round((inv.paidAmount / inv.totalAmount) * 100),
              ) || 0;
            const remaining = inv.totalAmount - inv.paidAmount;

            return (
              <Card
                key={inv.id}
                elevation={0}
                onClick={() => setSelectedInvoice(inv)}
                sx={{
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 18,
                    bottom: 18,
                    width: 4,
                    borderRadius: "0 6px 6px 0",
                    background: getStatusColor(inv.paymentStatus),
                    zIndex: 1,
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 130,
                    height: 130,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${getStatusColor(
                      inv.paymentStatus,
                    )}22, transparent 70%)`,
                    pointerEvents: "none",
                  },
                }}
              >
                <CardActionArea sx={{ p: 2.4, borderRadius: "20px" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 16,
                        letterSpacing: "-0.02em",
                        color: "text.primary",
                      }}
                    >
                      {inv.supplierName}
                    </Typography>
                    <Chip
                      label={inv.invoiceNumber || "No Number"}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mb: 1.5 }}
                  >
                    Date: {inv.date}
                  </Typography>

                  <Box
                    sx={{
                      mb: 1.5,
                      background: "linear-gradient(135deg,#F6F8FE,#F9F7FF)",
                      border: "1px solid #EDF1FA",
                      p: 1.2,
                      borderRadius: "14px",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      Items:
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                      {inv.items
                        .slice(0, 2)
                        .map((i) => i.name)
                        .join(", ")}
                      {inv.items.length > 2 && " ..."}
                    </Typography>
                  </Box>

                  {/* Progress Bar Progress Meter */}
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: getStatusColor(inv.paymentStatus),
                        }}
                      >
                        Paid: {paidRatio}%
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Remaining: {remaining.toFixed(2)} ₪
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={paidRatio}
                      sx={{
                        height: 9,
                        borderRadius: 5,
                        bgcolor: "#E9EEF8",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: getStatusColor(inv.paymentStatus),
                        },
                      }}
                    />
                  </Box>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>

        {/* ── Dialog: Add / Edit Invoice ─────────────────────────────────── */}
        <Dialog
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background:
                "linear-gradient(135deg, rgba(99,128,255,0.10), rgba(150,110,255,0.07) 60%, rgba(255,255,255,0))",
            }}
          >
            <Typography variant="h6">
              {editingInvoiceId
                ? "Edit Purchase Invoice"
                : "Create Purchase Invoice"}
            </Typography>
            <IconButton onClick={() => setIsAddOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Autocomplete
                freeSolo
                options={existingSuppliers}
                value={invoiceForm.supplierName}
                onInputChange={(_, value) =>
                  setInvoiceForm((prev) => ({ ...prev, supplierName: value }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supplier / Company Name"
                    required
                    size="small"
                  />
                )}
              />
              <TextField
                label="Invoice Number"
                size="small"
                value={invoiceForm.invoiceNumber}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    invoiceNumber: e.target.value,
                  })
                }
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                type="date"
                label="Invoice Date *"
                size="small"
                required
                value={invoiceForm.date}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, date: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                error={!invoiceForm.date}
                helperText={!invoiceForm.date ? "Invoice date is required" : ""}
              />
              <TextField
                label="Notes"
                size="small"
                value={invoiceForm.notes}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, notes: e.target.value })
                }
              />
            </Box>

            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "18px",
                border: "1px solid #C5D4FF",
                background:
                  "linear-gradient(135deg, #EEF2FF 0%, #F5F0FF 50%, #F8FAFF 100%)",
                boxShadow: "0 8px 24px rgba(59,91,255,0.12)",
                position: "relative",
                overflow: "hidden",
                height: "400px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      fontSize: 13,
                      display: "block",
                      mb: 0.4,
                    }}
                  >
                    Current Invoice Total ={" "}
                    {getCurrentInvoiceTotal().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₪
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
              Invoice Items
            </Typography>

            {invoiceForm.items.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.8,
                  border: "1px solid #E6ECF7",
                  borderRadius: "18px",
                  background: "linear-gradient(180deg,#F8FAFF 0%,#F4F7FD 100%)",
                  boxShadow: "0 4px 14px rgba(31,50,100,0.045)",
                  position: "relative",
                  animation: "pi-fadeUp .4s cubic-bezier(.2,.8,.2,1) both",
                  transition: "border-color .25s ease, box-shadow .25s ease",
                  "&:hover": {
                    borderColor: "#CBD8F8",
                    boxShadow: "0 10px 26px rgba(59,91,255,0.09)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      px: 1.2,
                      py: 0.4,
                      borderRadius: "8px",
                      background: "rgba(59,91,255,0.09)",
                      letterSpacing: ".02em",
                    }}
                  >
                    Item #{idx + 1}
                  </Typography>
                  {invoiceForm.items.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveItemRow(idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Autocomplete
                  fullWidth
                  size="small"
                  options={medicines}
                  filterOptions={filterMedicineOptions}
                  value={item.medicine || null}
                  inputValue={item.searchText ?? item.medicine?.name ?? ""}
                  onInputChange={(_, value, reason) => {
                    const newItems = [...invoiceForm.items];
                    newItems[idx] = { ...newItems[idx], searchText: value };
                    if (reason === "input") newItems[idx].medicine = null;
                    setInvoiceForm((prev) => ({ ...prev, items: newItems }));
                  }}
                  getOptionLabel={(option) => option?.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  noOptionsText={
                    item.searchText?.trim() ? (
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          No medicine found with this name.
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() =>
                            startCreateMedicine(idx, item.searchText)
                          }
                        >
                          Would you like to create a new medicine with this
                          name?
                        </Button>
                      </Box>
                    ) : (
                      "Start typing a medicine name"
                    )
                  }
                  onChange={(_, val) => {
                    const newItems = [...invoiceForm.items];
                    newItems[idx] = {
                      ...newItems[idx],
                      medicine: val,
                      searchText: val?.name || "",
                      ...(val
                        ? {
                            costPrice: val.costPrice ?? "",
                            sellPrice: val.sellPrice ?? "",
                          }
                        : {}),
                    };
                    setInvoiceForm({ ...invoiceForm, items: newItems });
                  }}
                  renderOption={(props, medicine) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li key={medicine.id} {...optionProps}>
                        <Box sx={{ width: "100%", minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                            {medicine.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary", display: "block" }}
                          >
                            {[
                              medicine.type,
                              medicine.company,
                              medicine.location,
                              medicine.qrCode,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search medicines"
                      placeholder="Enter medicine name"
                      size="small"
                    />
                  )}
                />

                {newMedicineForm && newMedicineRowIndex === idx && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2.2,
                      border: "1px solid #BFD0FF",
                      borderRadius: "18px",
                      background:
                        "linear-gradient(135deg,#EEF3FF 0%,#F6F2FF 100%)",
                      boxShadow: "0 10px 28px rgba(59,91,255,0.10)",
                      animation: "pi-fadeUp .35s cubic-bezier(.2,.8,.2,1) both",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, mb: 1.5 }}>
                      Create New Medicine
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 1.5,
                      }}
                    >
                      <TextField
                        size="small"
                        label="Medicine Name"
                        required
                        value={newMedicineForm.name}
                        onChange={(e) =>
                          updateNewMedicineField("name", e.target.value)
                        }
                      />
                      <FormControl size="small" required>
                        <InputLabel>Medicine Type</InputLabel>
                        <Select
                          value={newMedicineForm.type}
                          label="Medicine Type"
                          onChange={(e) =>
                            updateNewMedicineField("type", e.target.value)
                          }
                        >
                          {[
                            "Tablets",
                            "Syrup",
                            "Drops",
                            "Ampoule",
                            "Suppository",
                            "Cream",
                            "Oint",
                            "Emulgel",
                            "Others",
                          ].map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        type="number"
                        label="Cost Price"
                        required
                        value={newMedicineForm.costPrice}
                        onChange={(e) =>
                          updateNewMedicineField("costPrice", e.target.value)
                        }
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Selling Price"
                        required
                        value={newMedicineForm.sellPrice}
                        onChange={(e) =>
                          updateNewMedicineField("sellPrice", e.target.value)
                        }
                      />
                      <TextField
                        size="small"
                        label="Company"
                        value={newMedicineForm.company}
                        onChange={(e) =>
                          updateNewMedicineField("company", e.target.value)
                        }
                      />
                      <TextField
                        size="small"
                        type="date"
                        label="Expiry Date"
                        value={newMedicineForm.expDate}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) =>
                          updateNewMedicineField("expDate", e.target.value)
                        }
                      />
                      {["Tablets", "Ampoule", "Suppository"].includes(
                        newMedicineForm.type,
                      ) && (
                        <>
                          <TextField
                            size="small"
                            type="number"
                            label="Strips per Box"
                            value={newMedicineForm.stripsPerBox}
                            onChange={(e) =>
                              updateNewMedicineField(
                                "stripsPerBox",
                                e.target.value,
                              )
                            }
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Units per Strip"
                            value={newMedicineForm.pillsPerStrip}
                            onChange={(e) =>
                              updateNewMedicineField(
                                "pillsPerStrip",
                                e.target.value,
                              )
                            }
                          />
                        </>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 1, color: "text.secondary" }}
                    >
                      The medicine stock starts at zero. The quantities entered
                      here will be added to stock when the invoice is saved.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={newMedicineSaving}
                        onClick={handleSaveNewMedicine}
                      >
                        {newMedicineSaving
                          ? "Saving..."
                          : "Save and Select Medicine"}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setNewMedicineForm(null);
                          setNewMedicineRowIndex(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}

                {item.medicine && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 1,
                      mt: 1.5,
                    }}
                  >
                    <TextField
                      label="Storage Quantity (Units)"
                      type="number"
                      size="small"
                      value={item.storageQty}
                      onChange={(e) => {
                        const newItems = [...invoiceForm.items];
                        newItems[idx].storageQty = e.target.value;
                        setInvoiceForm({ ...invoiceForm, items: newItems });
                      }}
                    />
                    <TextField
                      label="Display Quantity (Units)"
                      type="number"
                      size="small"
                      value={item.displayedQty}
                      onChange={(e) => {
                        const newItems = [...invoiceForm.items];
                        newItems[idx].displayedQty = e.target.value;
                        setInvoiceForm({ ...invoiceForm, items: newItems });
                      }}
                    />
                    <TextField
                      label="Cost Price"
                      type="number"
                      size="small"
                      value={item.costPrice}
                      onChange={(e) => {
                        const newItems = [...invoiceForm.items];
                        newItems[idx].costPrice = e.target.value;
                        setInvoiceForm({ ...invoiceForm, items: newItems });
                      }}
                    />
                    <TextField
                      label="Selling Price"
                      type="number"
                      size="small"
                      value={item.sellPrice}
                      onChange={(e) => {
                        const newItems = [...invoiceForm.items];
                        newItems[idx].sellPrice = e.target.value;
                        setInvoiceForm({ ...invoiceForm, items: newItems });
                      }}
                    />
                  </Box>
                )}
                {item.medicine && (
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {isUnitPricedMedicine(item.medicine)
                        ? getUnitsPerBox(item.medicine) > 0
                          ? `Pack size: ${getUnitsPerBox(
                              item.medicine,
                            )} units per box`
                          : "Missing package size: set strips per box and units per strip in the medicine record"
                        : "Quantity is priced per item"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Line total:{" "}
                      {getInvoiceLineTotal(item).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₪
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItemRow}
              sx={{
                alignSelf: "center",
                borderRadius: "999px",
                px: 3.4,
                py: 1,
                borderStyle: "dashed",
                borderWidth: 1.5,
                "&:hover": { borderStyle: "dashed", borderWidth: 1.5 },
              }}
            >
              Add Another Medicine
            </Button>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveInvoice}
              disabled={!canSaveInvoice}
            >
              {invoiceSaving
                ? "Saving..."
                : editingInvoiceId
                ? "Save Changes"
                : "Save Invoice"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: Invoice Details & Payments ────────────────────────────── */}
        {selectedInvoice && (
          <Dialog
            open={Boolean(selectedInvoice)}
            onClose={() => setSelectedInvoice(null)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background:
                  "linear-gradient(135deg, rgba(99,128,255,0.10), rgba(150,110,255,0.07) 60%, rgba(255,255,255,0))",
              }}
            >
              <Typography variant="h6">
                {selectedInvoice.supplierName}
              </Typography>
              <IconButton onClick={() => setSelectedInvoice(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Box
                sx={{
                  p: 2.4,
                  background: "linear-gradient(135deg,#F5F8FF 0%,#FAF7FF 100%)",
                  borderRadius: "20px",
                  border: "1px solid #E3EAF9",
                  boxShadow: "0 8px 24px rgba(31,50,100,0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="caption">Invoice Total:</Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {selectedInvoice.totalAmount.toFixed(2)} ₪
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="caption">Paid:</Typography>
                  <Typography sx={{ fontWeight: 700, color: "success.main" }}>
                    {selectedInvoice.paidAmount.toFixed(2)} ₪
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption">Remaining:</Typography>
                  <Typography sx={{ fontWeight: 700, color: "error.main" }}>
                    {(
                      selectedInvoice.totalAmount - selectedInvoice.paidAmount
                    ).toFixed(2)}{" "}
                    ₪
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle2">Payment History</Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    setPaymentForm({
                      amount: "",
                      paymentType: "Application",
                      receiver: "Aseel",
                      destinationAccount: "Jawwal Pay",
                      date: TODAY,
                      notes: "",
                    });
                    setIsNewPaymentOpen(true);
                  }}
                >
                  Record Payment
                </Button>
              </Box>

              {selectedInvoice.payments.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", textAlign: "center", py: 2 }}
                >
                  No payments have been recorded for this invoice yet.
                </Typography>
              ) : (
                selectedInvoice.payments.map((p) => (
                  <Card
                    key={p.id}
                    elevation={0}
                    sx={{
                      p: 1.8,
                      border: "1px solid #E6ECF5",
                      borderRadius: "16px",
                      animation: "pi-fadeUp .4s cubic-bezier(.2,.8,.2,1) both",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {p.amount.toFixed(2)} ₪ ({p.paymentType})
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {p.date}
                      </Typography>
                    </Box>
                    {p.paymentType === "Application" && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 0.5,
                          color: "primary.main",
                        }}
                      >
                        {p.receiver || ""}{" "}
                        {p.destinationAccount
                          ? `· ${p.destinationAccount}`
                          : ""}
                      </Typography>
                    )}
                    {p.notes && (
                      <Typography
                        variant="caption"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {p.notes}
                      </Typography>
                    )}
                  </Card>
                ))
              )}

              <Divider sx={{ my: 1 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => openEditInvoice(selectedInvoice)}
                  sx={{ minHeight: 48, borderRadius: "14px" }}
                >
                  Edit Invoice
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirmOpen(true)}
                  sx={{ minHeight: 48, borderRadius: "14px" }}
                >
                  Delete Invoice
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        )}

        {/* ── Dialog: Record Payment ────────────────────────────────────────────── */}
        <Dialog
          open={isNewPaymentOpen}
          onClose={() => setIsNewPaymentOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(135deg, rgba(99,128,255,0.10), rgba(150,110,255,0.07) 60%, rgba(255,255,255,0))",
            }}
          >
            Record Payment
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}
          >
            <TextField
              label="Payment Amount"
              type="number"
              size="small"
              value={paymentForm.amount}
              inputProps={{
                min: 0.01,
                max: Math.max(
                  0,
                  (selectedInvoice?.totalAmount || 0) -
                    (selectedInvoice?.paidAmount || 0),
                ),
                step: "0.01",
              }}
              error={
                Number(paymentForm.amount) >
                Math.max(
                  0,
                  (selectedInvoice?.totalAmount || 0) -
                    (selectedInvoice?.paidAmount || 0),
                )
              }
              helperText={`Remaining balance: ${Math.max(
                0,
                (selectedInvoice?.totalAmount || 0) -
                  (selectedInvoice?.paidAmount || 0),
              ).toFixed(2)} ₪`}
              onChange={(e) => {
                const remaining = Math.max(
                  0,
                  (selectedInvoice?.totalAmount || 0) -
                    (selectedInvoice?.paidAmount || 0),
                );
                const value = e.target.value;
                if (value === "") {
                  setPaymentForm({ ...paymentForm, amount: "" });
                } else {
                  const numeric = Number(value);
                  setPaymentForm({
                    ...paymentForm,
                    amount: numeric > remaining ? String(remaining) : value,
                  });
                }
              }}
            />
            <FormControl size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentForm.paymentType}
                label="Payment Method"
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentType: e.target.value,
                  })
                }
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Application">Application</MenuItem>
              </Select>
            </FormControl>
            {paymentForm.paymentType === "Application" && (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel>Received By</InputLabel>
                  <Select
                    value={paymentForm.receiver}
                    label="Received By"
                    onChange={(e) => {
                      const receiver = e.target.value;
                      setPaymentForm((prev) => ({
                        ...prev,
                        receiver,
                        destinationAccount:
                          receiver === "Aseel" ? "Jawwal Pay" : "Jawwal Pay",
                      }));
                    }}
                  >
                    <MenuItem value="Aseel">Aseel</MenuItem>
                    <MenuItem value="Mohamed">Mohamed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Destination Account</InputLabel>
                  <Select
                    value={paymentForm.destinationAccount}
                    label="Destination Account"
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        destinationAccount: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="Jawwal Pay">Jawwal Pay</MenuItem>
                    <MenuItem value="Bank of Palestine">
                      Bank of Palestine
                    </MenuItem>
                    {paymentForm.receiver === "Mohamed" && (
                      <MenuItem value="Palpay">Palpay</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </>
            )}
            <TextField
              type="date"
              label="Payment Date *"
              size="small"
              required
              value={paymentForm.date}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notes"
              size="small"
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsNewPaymentOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={
                !paymentForm.amount ||
                Number(paymentForm.amount) <= 0 ||
                Number(paymentForm.amount) >
                  Math.max(
                    0,
                    (selectedInvoice?.totalAmount || 0) -
                      (selectedInvoice?.paidAmount || 0),
                  ) ||
                !paymentForm.date ||
                (paymentForm.paymentType === "Application" &&
                  (!paymentForm.receiver || !paymentForm.destinationAccount))
              }
              onClick={handleSavePayment}
            >
              Save Payment
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: Confirm Deletion ────────────────────────────────────────────── */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle
            sx={{
              color: "error.main",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(245,158,11,0.06) 60%, rgba(255,255,255,0))",
            }}
          >
            Confirm Invoice Deletion
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}
          >
            <Typography variant="caption">
              Type <strong>"DELETE"</strong> to confirm. All stock changes from
              this invoice will be reversed automatically.
            </Typography>
            <TextField
              size="small"
              placeholder="DELETE"
              value={deleteInputText}
              onChange={(e) => setDeleteInputText(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              disabled={deleteInputText !== "DELETE"}
              onClick={handleDeleteInvoice}
            >
              Confirm Deletion
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
