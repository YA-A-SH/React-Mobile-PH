export const STRIP_TYPES = ["Tablets", "Ampoule", "Suppository"];

export const PAYMENT_TYPES = ["Application", "Cash"];
export const PAYMENT_STATUS = { PENDING: "pending", RECEIVED: "received" };

export const TRANSFER_SOURCES = [
  "Bank of Palestine",
  "Islamic Bank",
  "PalPay wallet",
  "Jawwal Pay wallet",
];

export const RECEIVERS = ["Asil", "Mohammed", "Fatma"];
// Order used by the Receiver *filter* (as requested)
export const RECEIVER_FILTER_OPTIONS = ["Mohammed", "Asil", "Fatma"];

export const RECEIVER_ACCOUNTS = {
  Asil: ["Jawwal Pay", "Bank of Palestine"],
  Mohammed: ["Jawwal Pay", "PalPay", "Bank of Palestine"],
  Fatma: ["PalPay"],
};

export const ALL_ACCOUNTS = ["Jawwal Pay", "PalPay", "Bank of Palestine"];

/** Accounts valid for a receiver. No receiver → union (used by the filter). */
export const getAccountsForReceiver = (receiver) => {
  if (!receiver || receiver === "All") return ALL_ACCOUNTS;
  return RECEIVER_ACCOUNTS[receiver] || [];
};

// ─── Small numeric helpers ───────────────────────────────────────────────────
export const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
/** Non-negative whole number (what a customer can actually buy). */
export const wholeQty = (v) => Math.max(0, Math.floor(num(v)));
export const round2 = (n) => Math.round((num(n) + Number.EPSILON) * 100) / 100;
export const round4 = (n) =>
  Math.round((num(n) + Number.EPSILON) * 10000) / 10000;
export const money = (n) => num(n).toFixed(2);
const plural = (n, one, many) => (n === 1 ? one : many);

/**
 * Pharmacy of a medicine. Inventory treats a missing `pharmacy` as "old"
 * (`m.pharmacy || "old"`), so Sales does exactly the same – otherwise legacy
 * records would show in Inventory but never be sellable.
 */
export const getMedicinePharmacy = (m) => (m && m.pharmacy) || "old";

// ─── Dates (all LOCAL time) ──────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" in the user's local time zone. */
export const toDateKey = (input = new Date()) => {
  const d = input instanceof Date ? input : new Date(input);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const shiftDateKey = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
};

/** UTC ISO bounds of one LOCAL calendar day (for the created_at index). */
export const getLocalDayRangeIso = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return {
    startIso: new Date(y, m - 1, d, 0, 0, 0, 0).toISOString(),
    endIso: new Date(y, m - 1, d, 23, 59, 59, 999).toISOString(),
  };
};

// ─── Packaging / pricing / stock ─────────────────────────────────────────────

/**
 * A medicine is "divisible" (can be sold by strip / pill) only when BOTH
 * stripsPerBox and pillsPerStrip are configured. Otherwise it is sold whole.
 * Base unit: divisible → 1 pill/piece, otherwise → 1 box/unit.
 */
export const getPackaging = (med) => {
  const isStripType = STRIP_TYPES.includes(med?.type);
  const stripsPerBox = isStripType ? wholeQty(med?.stripsPerBox) : 0;
  const pillsPerStrip = isStripType ? wholeQty(med?.pillsPerStrip) : 0;
  const divisible = stripsPerBox > 0 && pillsPerStrip > 0;

  const sellPrice = num(med?.sellPrice);
  // Same rule the Inventory uses for "sell price per box"
  const boxPrice = sellPrice * (isStripType ? stripsPerBox || 1 : 1);

  return {
    isStripType,
    divisible,
    stripsPerBox,
    pillsPerStrip,
    unitsPerStrip: divisible ? pillsPerStrip : 0, // base units in a strip
    unitsPerBox: divisible ? stripsPerBox * pillsPerStrip : 1, // base units in a box
    // The price the user edits in the sale line, and how many base units it covers
    priceUnit: divisible ? "strip" : isStripType ? "box" : "unit",
    priceBaseCount: divisible ? pillsPerStrip : 1,
    defaultPrice: divisible ? sellPrice : boxPrice,
  };
};

export const pieceLabel = (type) =>
  type === "Ampoule"
    ? "ampoule"
    : type === "Suppository"
    ? "suppository"
    : "pill";

export const getStock = (med) => {
  const pk = getPackaging(med);
  const totalBase = Math.max(0, num(med?.stockUnits));

  if (!pk.divisible) {
    return {
      boxes: totalBase,
      strips: 0,
      pills: 0,
      loose: 0,
      totalBase,
    };
  }

  const boxes = Math.floor(totalBase / pk.unitsPerBox);
  const remainderAfterBoxes = totalBase % pk.unitsPerBox;

  const strips = Math.floor(remainderAfterBoxes / pk.unitsPerStrip);

  const pills = remainderAfterBoxes % pk.unitsPerStrip;

  return {
    boxes,
    strips,
    pills,
    loose: strips * pk.unitsPerStrip + pills,
    totalBase,
  };
};

export const formatStock = (med) => {
  const pk = getPackaging(med);
  const s = getStock(med);

  if (!pk.divisible) {
    const unitWord = plural(s.totalBase, "unit", "units");
    return `${s.totalBase} ${unitWord}`;
  }

  const parts = [];

  if (s.boxes > 0) {
    parts.push(`${s.boxes} ${plural(s.boxes, "box", "boxes")}`);
  }

  if (s.strips > 0) {
    parts.push(`${s.strips} ${plural(s.strips, "strip", "strips")}`);
  }

  if (s.pills > 0) {
    const p = pieceLabel(med.type);
    parts.push(`${s.pills} ${plural(s.pills, p, p + "s")}`);
  }

  return parts.join(" + ") || "0";
};

export const isOutOfStock = (med) => getStock(med).totalBase <= 0;

/** Normalise raw form input into whole numbers valid for this medicine. */
export const normalizeQuantity = (med, q = {}) => {
  const pk = getPackaging(med);
  const boxes = wholeQty(q.boxes);
  const strips = pk.divisible ? wholeQty(q.strips) : 0;
  const pills = pk.divisible ? wholeQty(q.pills) : 0;
  const base = boxes * pk.unitsPerBox + strips * pk.unitsPerStrip + pills;
  return { boxes, strips, pills, base };
};

/** Suggest a quantity that is actually possible for the current stock. */
export const defaultQuantity = (med) => {
  const pk = getPackaging(med);
  const s = getStock(med);

  if (s.totalBase <= 0) {
    return { boxes: "", strips: "", pills: "" };
  }

  if (s.boxes >= 1) {
    return { boxes: "1", strips: "", pills: "" };
  }

  if (pk.divisible && s.strips >= 1) {
    return { boxes: "", strips: "1", pills: "" };
  }

  if (pk.divisible && s.pills >= 1) {
    return { boxes: "", strips: "", pills: "1" };
  }

  return { boxes: "1", strips: "", pills: "" };
};

/**
 * Physical stock model:
 *   • whole boxes sold come out of SEALED boxes only,
 *   • strips/pills come from loose pills first, then from opening sealed boxes.
 * Never allows a negative result.
 */
export const checkStock = (med, q) => {
  const n = normalizeQuantity(med, q);
  const stock = getStock(med);

  const name = med?.name || "this medicine";
  const available = formatStock(med);

  if (n.base <= 0) {
    return {
      ok: false,
      code: "EMPTY",
      message: "Enter a quantity greater than zero.",
    };
  }

  if (n.base > stock.totalBase) {
    return {
      ok: false,
      code: "INSUFFICIENT_STOCK",
      message: `Not enough stock for "${name}". In stock: ${available}.`,
    };
  }

  return {
    ok: true,
    normalized: n,
  };
};

export const applyDeduction = (med, q) => {
  const n = normalizeQuantity(med, q);
  const currentStock = Math.max(0, num(med?.stockUnits));

  return {
    stockUnits: Math.max(0, currentStock - n.base),
  };
};

/**
 * Money maths for one line.
 *   priceEntered = price per STRIP (divisible) or per BOX/UNIT (otherwise) –
 *                  i.e. the Inventory's own sellPrice semantics.
 *   line_total = base units × (price ÷ base units covered by that price)
 *   line_cost  = base units × (costPrice ÷ base units per box)
 */
export const computeLine = (med, q, priceEntered) => {
  const pk = getPackaging(med);
  const n = normalizeQuantity(med, q);
  const price = Math.max(0, num(priceEntered));
  const sellPerBase = price / pk.priceBaseCount;
  const costPerBase = num(med?.costPrice) / pk.unitsPerBox;
  const lineTotal = round2(n.base * sellPerBase);
  const lineCost = round2(n.base * costPerBase);
  return {
    ...n,
    sellPrice: round4(price),
    costAtSale: num(med?.costPrice),
    lineTotal,
    lineCost,
    lineProfit: round2(lineTotal - lineCost),
  };
};

// ─── Display helpers for stored sale_items ───────────────────────────────────
export const formatItemQuantity = (item) => {
  const isStrip = STRIP_TYPES.includes(item.medicine_type);
  const piece = pieceLabel(item.medicine_type);
  const b = num(item.quantity_boxes);
  const s = num(item.quantity_strips);
  const p = num(item.quantity_pills);
  const parts = [];
  if (b > 0)
    parts.push(
      `${b} ${
        isStrip ? plural(b, "box", "boxes") : plural(b, "unit", "units")
      }`,
    );
  if (s > 0) parts.push(`${s} ${plural(s, "strip", "strips")}`);
  if (p > 0) parts.push(`${p} ${plural(p, piece, piece + "s")}`);
  return parts.join(" + ") || "—";
};

/** sell_price is stored in the Inventory's own unit; this names that unit. */
export const describeItemPriceUnit = (item) => {
  const divisible =
    num(item.quantity_strips) > 0 ||
    num(item.quantity_pills) > 0 ||
    num(item.quantity_in_base_units) > num(item.quantity_boxes);
  if (divisible) return "strip";
  return STRIP_TYPES.includes(item.medicine_type) ? "box" : "unit";
};
