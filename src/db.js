import { v4 as uuidv4 } from "uuid";
import {
  PAYMENT_TYPES,
  PAYMENT_STATUS,
  RECEIVERS,
  getAccountsForReceiver,
  getMedicinePharmacy,
  checkStock,
  applyDeduction,
  computeLine,
  getPackaging,
  round2,
} from "./salesLogic";

const DB_NAME = "PharmacyDB";
const DB_VERSION = 6;
const PURCHASE_INVOICES_STORE = "purchase_invoices";
const PURCHASE_PAYMENTS_STORE = "purchase_payments";
const STORE_NAME = "medicines";
const SALES_STORE = "sales";
const SALE_ITEMS_STORE = "sale_items";
const DELETED_SALES_STORE = "deleted_sales";

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SALES_STORE)) {
        const sales = db.createObjectStore(SALES_STORE, { keyPath: "id" });
        sales.createIndex("created_at", "created_at", { unique: false });
        sales.createIndex("pharmacy", "pharmacy", { unique: false });
      }
      if (!db.objectStoreNames.contains(SALE_ITEMS_STORE)) {
        const items = db.createObjectStore(SALE_ITEMS_STORE, { keyPath: "id" });
        items.createIndex("sale_id", "sale_id", { unique: false });
      }
      if (!db.objectStoreNames.contains(DELETED_SALES_STORE)) {
        db.createObjectStore(DELETED_SALES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PURCHASE_INVOICES_STORE)) {
        const invStore = db.createObjectStore(PURCHASE_INVOICES_STORE, {
          keyPath: "id",
        });
        invStore.createIndex("date", "date", { unique: false });
      }
      if (!db.objectStoreNames.contains(PURCHASE_PAYMENTS_STORE)) {
        const payStore = db.createObjectStore(PURCHASE_PAYMENTS_STORE, {
          keyPath: "id",
        });
        payStore.createIndex("invoice_id", "invoice_id", { unique: false });
      }
      // ===== الترقية من الإصدار 4 إلى 5 =====
      // إضافة الحقول الجديدة displayed_qty و storage_qty و is_merged
      if (oldVersion < 5) {
        const tx = event.target.transaction;
        const medStore = tx.objectStore(STORE_NAME);

        const getAllReq = medStore.getAll();
        getAllReq.onsuccess = () => {
          const medicines = getAllReq.result || [];
          medicines.forEach((med) => {
            if (
              med.displayed_qty === undefined &&
              med.storage_qty === undefined
            ) {
              const stock = Number(med.stockUnits) || 0;
              if (med.location === "مخزون") {
                med.displayed_qty = 0;
                med.storage_qty = stock;
              } else {
                med.displayed_qty = stock;
                med.storage_qty = 0;
              }
              med.is_merged = med.is_merged || false;
              medStore.put(med);
            }
          });
        };
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      // Let a future schema upgrade proceed instead of being blocked by this tab.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onblocked = () =>
      console.warn(
        "PharmacyDB upgrade is blocked by another open tab. Close other tabs of this app.",
      );
    request.onerror = (event) => reject(event.target.error);
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// Medicines (existing API – unchanged)
// ═════════════════════════════════════════════════════════════════════════════

export const getAllMedicines = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveMedicineDB = async (medicine) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(medicine); // put تقوم بالإرسال والتعديل معاً

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteMedicineDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// Transaction plumbing (used by everything below)
// ═════════════════════════════════════════════════════════════════════════════

const reqToPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

/**
 * Runs `work(tx)` inside ONE transaction. If `work` throws, the transaction is
 * aborted (nothing is written) and the error is re-thrown. Inside `work`, only
 * await IndexedDB requests – awaiting anything else lets the transaction close.
 */
const runTx = async (storeNames, mode, work) => {
  const db = await initDB();
  let abortReason = null;
  try {
    const tx = db.transaction(storeNames, mode);
    const done = new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(abortReason || tx.error || new Error("Transaction aborted"));
    });
    done.catch(() => {}); // avoid "unhandled rejection" noise; awaited below

    let result;
    try {
      result = await work(tx);
    } catch (err) {
      abortReason = err;
      try {
        tx.abort();
      } catch (_) {
        /* already finished */
      }
      throw err;
    }
    await done;
    return result;
  } finally {
    db.close();
  }
};

export class SaleError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "SaleError";
    this.code = code;
    this.details = details;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Sales – reads
// ═════════════════════════════════════════════════════════════════════════════

export const getAllSalesDB = () =>
  runTx([SALES_STORE], "readonly", (tx) =>
    reqToPromise(tx.objectStore(SALES_STORE).getAll()),
  );

/** Sales whose created_at falls in [startIso, endIso] (ISO strings, UTC). */
export const getSalesByRangeDB = (startIso, endIso) =>
  runTx([SALES_STORE], "readonly", (tx) =>
    reqToPromise(
      tx
        .objectStore(SALES_STORE)
        .index("created_at")
        .getAll(IDBKeyRange.bound(startIso, endIso)),
    ),
  );

export const getSaleByIdDB = (id) =>
  runTx([SALES_STORE], "readonly", (tx) =>
    reqToPromise(tx.objectStore(SALES_STORE).get(id)),
  );

export const getSaleItemsDB = (saleId) =>
  runTx([SALE_ITEMS_STORE], "readonly", (tx) =>
    reqToPromise(
      tx.objectStore(SALE_ITEMS_STORE).index("sale_id").getAll(saleId),
    ),
  );

export const getSaleItemsBySaleIdsDB = (saleIds) =>
  runTx([SALE_ITEMS_STORE], "readonly", async (tx) => {
    const index = tx.objectStore(SALE_ITEMS_STORE).index("sale_id");
    const lists = await Promise.all(
      saleIds.map((id) => reqToPromise(index.getAll(id))),
    );
    return lists.flat();
  });

export const getUnsyncedSalesDB = async () =>
  (await getAllSalesDB()).filter((s) => s.synced === false);

export const getDeletedSalesDB = () =>
  runTx([DELETED_SALES_STORE], "readonly", (tx) =>
    reqToPromise(tx.objectStore(DELETED_SALES_STORE).getAll()),
  );

export const removeDeletedSaleDB = (id) =>
  runTx([DELETED_SALES_STORE], "readwrite", (tx) =>
    reqToPromise(tx.objectStore(DELETED_SALES_STORE).delete(id)),
  );

export const deleteLocalSalesNotOnServerDB = (serverSaleIds) =>
  runTx([SALES_STORE, SALE_ITEMS_STORE], "readwrite", async (tx) => {
    const saleStore = tx.objectStore(SALES_STORE);
    const itemStore = tx.objectStore(SALE_ITEMS_STORE);

    const serverIds = new Set(serverSaleIds);
    const localSales = await reqToPromise(saleStore.getAll());

    for (const sale of localSales) {
      // Never touch a sale that still has a pending local change.
      if (sale.synced === false) continue;

      if (!serverIds.has(sale.id)) {
        const items = await reqToPromise(
          itemStore.index("sale_id").getAll(sale.id),
        );

        for (const item of items) {
          await reqToPromise(itemStore.delete(item.id));
        }

        await reqToPromise(saleStore.delete(sale.id));
      }
    }
  });
// ═════════════════════════════════════════════════════════════════════════════
// Sales – simple writes
// ═════════════════════════════════════════════════════════════════════════════

export const saveSaleDB = (sale) =>
  runTx([SALES_STORE], "readwrite", (tx) =>
    reqToPromise(tx.objectStore(SALES_STORE).put(sale)),
  );

export const saveSaleItemDB = (item) =>
  runTx([SALE_ITEMS_STORE], "readwrite", (tx) =>
    reqToPromise(tx.objectStore(SALE_ITEMS_STORE).put(item)),
  );

/**
 * Read-modify-write of one sale in a single transaction.
 * `patch` is an object, or a function (currentSale) => patchObject that may throw.
 * Always bumps updated_at and flags the sale as unsynced.
 */
export const updateSaleDB = (id, patch) =>
  runTx([SALES_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(SALES_STORE);
    const current = await reqToPromise(store.get(id));
    if (!current) throw new SaleError("NOT_FOUND", "Sale not found.");
    const changes = typeof patch === "function" ? patch(current) : patch;
    if (!changes) return current; // nothing to change
    const updated = {
      ...current,
      ...changes,
      updated_at: new Date().toISOString(),
      synced: false,
    };
    await reqToPromise(store.put(updated));
    return updated;
  });
// ═════════════════════════════════════════════════════════════════════════════
// Cancel Sale – ATOMIC: restore stock + mark sale cancelled
// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
// Cancel Sale – ATOMIC: restore stock + DELETE sale + DELETE sale_items
// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
// Delete Sale – ATOMIC: restore stock + DELETE sale & items + track deletion
// ═════════════════════════════════════════════════════════════════════════════

export const deleteSaleDB = (saleId) =>
  runTx(
    [STORE_NAME, SALES_STORE, SALE_ITEMS_STORE, DELETED_SALES_STORE],
    "readwrite",
    async (tx) => {
      const medStore = tx.objectStore(STORE_NAME);
      const saleStore = tx.objectStore(SALES_STORE);
      const itemStore = tx.objectStore(SALE_ITEMS_STORE);
      const deletedStore = tx.objectStore(DELETED_SALES_STORE);

      // 1. جلب البيعة
      const sale = await reqToPromise(saleStore.get(saleId));
      if (!sale) return null;

      // 2. جلب عناصر البيعة (sale_items)
      const items = await reqToPromise(
        itemStore.index("sale_id").getAll(saleId),
      );

      const now = new Date().toISOString();

      // 3. إرجاع المخزون بناءً على الوحدات الأساسية Base Units
      for (const item of items) {
        if (!item.medicine_id) continue;
        const med = await reqToPromise(medStore.get(item.medicine_id));
        if (med) {
          const unitsToRestore = Number(
            item.quantity_in_base_units || item.quantity || 0,
          );
          const currentDisplayed = Math.max(0, Number(med.displayed_qty) || 0);
          const currentStorage = Number(med.storage_qty) || 0;

          await reqToPromise(
            medStore.put({
              ...med,
              displayed_qty: currentDisplayed + unitsToRestore,
              storage_qty: currentStorage,
              stockUnits: currentDisplayed + unitsToRestore + currentStorage,
              updatedAt: now,
              synced: false,
            }),
          );
        }
      }

      // 4. حذف عناصر البيعة من SALE_ITEMS_STORE
      for (const item of items) {
        await reqToPromise(itemStore.delete(item.id));
      }

      // 5. تسجيل معرّف البيعة المحذوفة للمزامنة مع السيرفر
      await reqToPromise(
        deletedStore.put({
          id: saleId,
          deleted_at: now,
        }),
      );

      // 6. الحذف النهائي للبيعة من SALES_STORE
      await reqToPromise(saleStore.delete(saleId));

      return sale;
    },
  );
// ═════════════════════════════════════════════════════════════════════════════
// Edit Sale – ATOMIC: restore old stock + apply new stock + update sale/items
// ═════════════════════════════════════════════════════════════════════════════

export const updateSaleWithStockDB = (id, pharmacy, input) =>
  runTx(
    [STORE_NAME, SALES_STORE, SALE_ITEMS_STORE],
    "readwrite",
    async (tx) => {
      const medStore = tx.objectStore(STORE_NAME);
      const saleStore = tx.objectStore(SALES_STORE);
      const itemStore = tx.objectStore(SALE_ITEMS_STORE);

      // ── Load sale ────────────────────────────────────────────────────────
      const sale = await reqToPromise(saleStore.get(id));

      if (!sale) {
        throw new SaleError("NOT_FOUND", "Sale not found.");
      }

      if (sale.pharmacy !== pharmacy) {
        throw new SaleError(
          "WRONG_PHARMACY",
          "This sale belongs to the other pharmacy.",
        );
      }

      if (sale.sale_status === "cancelled") {
        throw new SaleError("CANCELLED", "Cancelled sales cannot be edited.");
      }

      // ── Validate payment details ────────────────────────────────────────
      if (!PAYMENT_TYPES.includes(input.paymentType)) {
        throw new SaleError("INVALID_PAYMENT", "Choose a valid payment type.");
      }

      const isApp = input.paymentType === "Application";
      const receiver = input.receiver || null;

      if (receiver && !RECEIVERS.includes(receiver)) {
        throw new SaleError("INVALID_PAYMENT", "Unknown receiver.");
      }

      if (isApp) {
        if (!input.transferFrom || !receiver || !input.destinationAccount) {
          throw new SaleError(
            "INVALID_PAYMENT",
            "Application payments need: transfer from, receiver and destination account.",
          );
        }

        if (
          !getAccountsForReceiver(receiver).includes(input.destinationAccount)
        ) {
          throw new SaleError(
            "INVALID_PAYMENT",
            `${receiver} cannot receive on ${input.destinationAccount}.`,
          );
        }
      }

      // ── Load existing items ──────────────────────────────────────────────
      const oldItems = await reqToPromise(
        itemStore.index("sale_id").getAll(id),
      );

      if (!oldItems.length) {
        throw new SaleError("NO_ITEMS", "This sale has no items to edit.");
      }

      // ── Validate new lines ───────────────────────────────────────────────
      const lines = Array.isArray(input.lines) ? input.lines : [];

      if (!lines.length) {
        throw new SaleError(
          "NO_ITEMS",
          "Add at least one medicine to the sale.",
        );
      }

      const seen = new Set();

      for (const line of lines) {
        if (seen.has(line.medicineId)) {
          throw new SaleError(
            "DUPLICATE_ITEM",
            "The same medicine appears twice in this sale.",
          );
        }

        seen.add(line.medicineId);
      }

      const now = new Date().toISOString();

      // ── Restore the stock consumed by the OLD sale ───────────────────────
      //
      // We first put every old medicine back.
      // Then we validate/deduct the NEW sale quantities.
      //
      // Everything is inside ONE transaction, so if anything fails,
      // IndexedDB rolls the whole operation back.
      const restoredByMedicineId = new Map();

      for (const item of oldItems) {
        const medicine = await reqToPromise(medStore.get(item.medicine_id));

        if (!medicine || medicine.deleted) {
          throw new SaleError(
            "MEDICINE_NOT_FOUND",
            `Medicine "${item.medicine_name}" no longer exists.`,
          );
        }

        if (getMedicinePharmacy(medicine) !== pharmacy) {
          throw new SaleError(
            "WRONG_PHARMACY",
            `Medicine "${medicine.name}" belongs to the other pharmacy.`,
          );
        }

        const soldUnits = Math.max(0, Number(item.quantity_in_base_units) || 0);

        const currentStock = Math.max(0, Number(medicine.stockUnits) || 0);

        const currentDisplayed = Math.max(
          0,
          Number(medicine.displayed_qty) || 0,
        );
        const restored = {
          ...medicine,
          displayed_qty: currentDisplayed + soldUnits,
          storage_qty: Number(medicine.storage_qty) || 0,
          stockUnits:
            currentDisplayed + soldUnits + (Number(medicine.storage_qty) || 0),
          updatedAt: now,
          synced: false,
        };

        restoredByMedicineId.set(medicine.id, restored);

        await reqToPromise(medStore.put(restored));
      }

      // ── Apply the NEW sale against the restored stock ────────────────────
      const newItems = [];
      const updatedMedicines = [];

      for (const line of lines) {
        const med = await reqToPromise(medStore.get(line.medicineId));

        if (!med || med.deleted) {
          throw new SaleError(
            "MEDICINE_NOT_FOUND",
            "A selected medicine no longer exists.",
          );
        }

        if (getMedicinePharmacy(med) !== pharmacy) {
          throw new SaleError(
            "WRONG_PHARMACY",
            `"${med.name}" belongs to the other pharmacy and cannot be sold here.`,
          );
        }

        const price = Number(line.price);

        if (!Number.isFinite(price) || price < 0) {
          throw new SaleError(
            "INVALID_PRICE",
            `Enter a valid price for "${med.name}".`,
          );
        }

        const stock = checkStock(med, line);

        if (!stock.ok) {
          throw new SaleError(stock.code, stock.message, {
            medicineId: med.id,
          });
        }

        const calc = computeLine(med, line, price);

        // Reuse the old item ID when the medicine already existed.
        // This is important for syncing edited sale_items.
        const oldItem = oldItems.find((item) => item.medicine_id === med.id);

        newItems.push({
          id: oldItem?.id || uuidv4(),
          sale_id: id,
          medicine_id: med.id,
          medicine_name: med.name,
          medicine_type: med.type || null,

          quantity_boxes: calc.boxes,
          quantity_strips: calc.strips,
          quantity_pills: calc.pills,
          quantity_in_base_units: calc.base,

          sell_price: calc.sellPrice,
          cost_at_sale: calc.costAtSale,

          line_total: calc.lineTotal,
          line_cost: calc.lineCost,
          line_profit: calc.lineProfit,

          created_at: oldItem?.created_at || now,
          updated_at: now,
          synced: false,
        });

        const deducted = applyDeduction(med, line);

        const updatedMedicine = {
          ...med,
          displayed_qty: deducted.displayed_qty,
          storage_qty: deducted.storage_qty,
          stockUnits: deducted.stockUnits,
          updatedAt: now,
          synced: false,
        };

        updatedMedicines.push(updatedMedicine);
      }

      // ── Delete old items that no longer exist in the edited sale ─────────
      const newItemIds = new Set(newItems.map((item) => item.id));

      for (const oldItem of oldItems) {
        if (!newItemIds.has(oldItem.id)) {
          await reqToPromise(itemStore.delete(oldItem.id));
        }
      }

      // ── Save new/updated items ───────────────────────────────────────────
      for (const item of newItems) {
        await reqToPromise(itemStore.put(item));
      }

      // ── Save updated medicines ──────────────────────────────────────────
      for (const medicine of updatedMedicines) {
        await reqToPromise(medStore.put(medicine));
      }

      // ── Recalculate sale totals ─────────────────────────────────────────
      const total = round2(
        newItems.reduce((sum, item) => sum + item.line_total, 0),
      );

      const totalCost = round2(
        newItems.reduce((sum, item) => sum + item.line_cost, 0),
      );

      const updatedSale = {
        ...sale,

        customer_name: (input.customerName || "").trim() || null,

        customer_phone: (input.customerPhone || "").trim() || null,

        payment_type: input.paymentType,

        transfer_from: isApp ? input.transferFrom : null,

        receiver,

        destination_account: isApp ? input.destinationAccount : null,

        // Preserve the current payment status while editing.
        // Editing the sale should NOT automatically mark an application
        // as received/pending.
        payment_status:
          sale.payment_type === input.paymentType
            ? sale.payment_status
            : isApp
            ? PAYMENT_STATUS.PENDING
            : PAYMENT_STATUS.RECEIVED,

        total,
        total_cost: totalCost,
        total_profit: round2(total - totalCost),

        updated_at: now,
        synced: false,
      };

      await reqToPromise(saleStore.put(updatedSale));

      return {
        sale: updatedSale,
        items: newItems,
        medicines: updatedMedicines,
      };
    },
  );

export const markSalePaymentReceivedDB = (id, pharmacy) =>
  updateSaleDB(id, (sale) => {
    if (sale.pharmacy !== pharmacy)
      throw new SaleError(
        "WRONG_PHARMACY",
        "This sale belongs to the other pharmacy.",
      );

    if (sale.payment_type !== "Application")
      throw new SaleError(
        "INVALID",
        "Only Application payments can change payment status.",
      );

    return {
      payment_status:
        sale.payment_status === PAYMENT_STATUS.RECEIVED
          ? PAYMENT_STATUS.PENDING
          : PAYMENT_STATUS.RECEIVED,
    };
  });
// ═════════════════════════════════════════════════════════════════════════════
// Create sale – ATOMIC: sale + items + stock deduction in ONE transaction
// ═════════════════════════════════════════════════════════════════════════════

/**
 * input = {
 *   pharmacy, paymentType, customerName?, customerPhone?, transferFrom?,
 *   receiver?, destinationAccount?, createdBy?,
 *   lines: [{ medicineId, boxes, strips, pills, price }]
 * }
 *
 * Every medicine is RE-READ inside the transaction, so stock is validated and
 * deducted against the current stored value (never a stale UI copy). Prices
 * and cost_at_sale are also taken from that fresh read. If anything fails the
 * transaction is aborted and nothing – sale, items or stock – is written.
 */
export const createSaleDB = (input) =>
  runTx(
    [STORE_NAME, SALES_STORE, SALE_ITEMS_STORE],
    "readwrite",
    async (tx) => {
      const medStore = tx.objectStore(STORE_NAME);
      const pharmacy = input.pharmacy;

      // ── payment validation ──
      if (pharmacy !== "old" && pharmacy !== "new")
        throw new SaleError("INVALID_PHARMACY", "Unknown pharmacy.");
      if (!PAYMENT_TYPES.includes(input.paymentType))
        throw new SaleError("INVALID_PAYMENT", "Choose a payment type.");

      const isApp = input.paymentType === "Application";
      const receiver = input.receiver || null;
      if (receiver && !RECEIVERS.includes(receiver))
        throw new SaleError("INVALID_PAYMENT", "Unknown receiver.");
      if (isApp) {
        if (!input.transferFrom || !receiver || !input.destinationAccount)
          throw new SaleError(
            "INVALID_PAYMENT",
            "Application payments need: transfer from, receiver and destination account.",
          );
        if (
          !getAccountsForReceiver(receiver).includes(input.destinationAccount)
        )
          throw new SaleError(
            "INVALID_PAYMENT",
            `${receiver} cannot receive on ${input.destinationAccount}.`,
          );
      }

      // ── lines ──
      const lines = Array.isArray(input.lines) ? input.lines : [];
      if (lines.length === 0)
        throw new SaleError(
          "NO_ITEMS",
          "Add at least one medicine to the sale.",
        );
      const seen = new Set();
      for (const l of lines) {
        if (seen.has(l.medicineId))
          throw new SaleError(
            "DUPLICATE_ITEM",
            "The same medicine appears twice in this sale.",
          );
        seen.add(l.medicineId);
      }

      const now = new Date().toISOString();
      const saleId = uuidv4();
      const items = [];
      const updatedMedicines = [];

      for (const line of lines) {
        const med = await reqToPromise(medStore.get(line.medicineId));

        // Pharmacy isolation: the medicine MUST belong to the sale's pharmacy.
        if (!med || med.deleted)
          throw new SaleError(
            "MEDICINE_NOT_FOUND",
            "A selected medicine no longer exists.",
          );
        if (getMedicinePharmacy(med) !== pharmacy)
          throw new SaleError(
            "WRONG_PHARMACY",
            `"${med.name}" belongs to the other pharmacy and cannot be sold here.`,
          );

        const price = Number(line.price);
        if (!Number.isFinite(price) || price < 0)
          throw new SaleError(
            "INVALID_PRICE",
            `Enter a valid price for "${med.name}".`,
          );

        const stock = checkStock(med, line);
        if (!stock.ok)
          throw new SaleError(stock.code, stock.message, {
            medicineId: med.id,
          });

        const calc = computeLine(med, line, price);
        items.push({
          id: uuidv4(),
          sale_id: saleId,
          medicine_id: med.id,
          medicine_name: med.name,
          medicine_type: med.type || null,
          quantity_boxes: calc.boxes,
          quantity_strips: calc.strips,
          quantity_pills: calc.pills,
          quantity_in_base_units: calc.base,
          sell_price: calc.sellPrice, // price the user charged (Inventory unit)
          cost_at_sale: calc.costAtSale, // medicine.costPrice AT THE TIME OF SALE
          line_total: calc.lineTotal,
          line_cost: calc.lineCost,
          line_profit: calc.lineProfit,
          created_at: now,
          synced: false,
        });

        const deducted = applyDeduction(med, line);

        updatedMedicines.push({
          ...med,
          displayed_qty: deducted.displayed_qty,
          storage_qty: deducted.storage_qty,
          stockUnits: deducted.stockUnits,
          updatedAt: now,
          synced: false,
        });
      }

      const total = round2(items.reduce((s, i) => s + i.line_total, 0));
      const totalCost = round2(items.reduce((s, i) => s + i.line_cost, 0));

      const sale = {
        id: saleId,
        pharmacy,
        customer_name: (input.customerName || "").trim() || null,
        customer_phone: (input.customerPhone || "").trim() || null,
        payment_type: input.paymentType,
        transfer_from: isApp ? input.transferFrom : null,
        receiver,
        destination_account: isApp ? input.destinationAccount : null,
        payment_status: isApp
          ? PAYMENT_STATUS.PENDING
          : PAYMENT_STATUS.RECEIVED,
        total,
        total_cost: totalCost,
        total_profit: round2(total - totalCost),
        created_at: now,
        updated_at: now,
        created_by: input.createdBy || "admin",
        synced: false,
      };

      // ── all validation passed: write everything (same transaction) ──
      await reqToPromise(tx.objectStore(SALES_STORE).put(sale));
      const itemStore = tx.objectStore(SALE_ITEMS_STORE);
      for (const item of items) await reqToPromise(itemStore.put(item));
      for (const med of updatedMedicines) await reqToPromise(medStore.put(med));

      return { sale, items, medicines: updatedMedicines };
    },
  );

// ═════════════════════════════════════════════════════════════════════════════
// Sync helpers (used by sync.js)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Save server medicines locally WITHOUT clobbering rows that have local,
 * not-yet-uploaded changes (synced === false) – e.g. a stock deduction made by
 * a sale while offline. One transaction, so it cannot interleave with a sale.
 */
export const mergeServerMedicinesDB = (serverMeds) =>
  runTx([STORE_NAME], "readwrite", async (tx) => {
    const store = tx.objectStore(STORE_NAME);
    let skipped = 0;
    for (const med of serverMeds) {
      const local = await reqToPromise(store.get(med.id));
      if (local && local.synced === false) {
        skipped++;
        continue;
      }
      await reqToPromise(store.put({ ...med, synced: true }));
    }
    return { skipped };
  });

/**
 * Mark uploaded medicines as synced ONLY if they were not modified again while
 * the upload was in flight (compares updatedAt).
 */
export const markMedicinesSyncedDB = (pairs) =>
  runTx([STORE_NAME], "readwrite", async (tx) => {
    const store = tx.objectStore(STORE_NAME);
    for (const { id, updatedAt } of pairs) {
      const cur = await reqToPromise(store.get(id));
      if (cur && cur.synced === false && cur.updatedAt === updatedAt) {
        await reqToPromise(store.put({ ...cur, synced: true }));
      }
    }
  });

export const markSalesSyncedDB = (pairs) =>
  runTx([SALES_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(SALES_STORE);
    for (const { id, updated_at } of pairs) {
      const cur = await reqToPromise(store.get(id));
      if (cur && cur.synced === false && cur.updated_at === updated_at) {
        await reqToPromise(store.put({ ...cur, synced: true }));
      }
    }
  });

export const markSaleItemsSyncedDB = (ids) =>
  runTx([SALE_ITEMS_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(SALE_ITEMS_STORE);
    for (const id of ids) {
      const cur = await reqToPromise(store.get(id));
      if (cur) await reqToPromise(store.put({ ...cur, synced: true }));
    }
  });

/** Newest updated_at among sales already known to be on the server. */
export const getSalesSyncCursorDB = async () => {
  const synced = (await getAllSalesDB()).filter((s) => s.synced === true);
  if (synced.length === 0) return null;
  return synced.reduce(
    (max, s) => (s.updated_at > max ? s.updated_at : max),
    "",
  );
};

/** Insert/update server sales; never overwrites local unsynced changes. */
export const mergeServerSalesDB = (serverSales) =>
  runTx([SALES_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(SALES_STORE);
    let added = 0;
    for (const sale of serverSales) {
      const local = await reqToPromise(store.get(sale.id));
      if (local && local.synced === false) continue;
      if (local && new Date(local.updated_at) >= new Date(sale.updated_at))
        continue;
      await reqToPromise(store.put({ ...sale, synced: true }));
      if (!local) added++;
    }
    return { added };
  });

/** Insert server sale_items that are not stored locally yet (items are immutable). */
export const putMissingSaleItemsDB = (serverItems) =>
  runTx([SALE_ITEMS_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(SALE_ITEMS_STORE);
    for (const item of serverItems) {
      const local = await reqToPromise(store.get(item.id));
      if (!local) await reqToPromise(store.put({ ...item, synced: true }));
    }
  });

// ═════════════════════════════════════════════════════════════════════════════
// Purchase Invoices & Payments DB API
// ═════════════════════════════════════════════════════════════════════════════

export const getAllPurchaseInvoicesDB = () =>
  runTx([PURCHASE_INVOICES_STORE], "readonly", (tx) =>
    reqToPromise(tx.objectStore(PURCHASE_INVOICES_STORE).getAll()),
  );

export const getPurchasePaymentsDB = (invoiceId) =>
  runTx([PURCHASE_PAYMENTS_STORE], "readonly", (tx) =>
    reqToPromise(
      tx
        .objectStore(PURCHASE_PAYMENTS_STORE)
        .index("invoice_id")
        .getAll(invoiceId),
    ),
  );

// حفظ فاتورة شراء وتحديث الكميات والمتوسط المرجح
export const savePurchaseInvoiceDB = (invoice) =>
  runTx([PURCHASE_INVOICES_STORE, STORE_NAME], "readwrite", async (tx) => {
    const invStore = tx.objectStore(PURCHASE_INVOICES_STORE);
    const medStore = tx.objectStore(STORE_NAME);

    await reqToPromise(invStore.put(invoice));

    const now = new Date().toISOString();

    for (const item of invoice.items) {
      if (!item.medicineId) continue;
      const med = await reqToPromise(medStore.get(item.medicineId));
      if (med) {
        const addedStorage = Number(item.storageQty) || 0;
        const addedDisplayed = Number(item.displayedQty) || 0;
        const totalAdded = addedStorage + addedDisplayed;

        const oldStorage = Number(med.storage_qty) || 0;
        const oldDisplayed = Number(med.displayed_qty) || 0;
        const oldTotal = oldStorage + oldDisplayed;

        const oldCost = Number(med.costPrice) || 0;
        const newCost = Number(item.costPrice) || oldCost;

        // حساب المتوسط المرجح لسعر التكلفة (Weighted Average Cost Price)
        const combinedTotal = oldTotal + totalAdded;
        const weightedCost =
          combinedTotal > 0
            ? (oldTotal * oldCost + totalAdded * newCost) / combinedTotal
            : newCost;

        await reqToPromise(
          medStore.put({
            ...med,
            storage_qty: oldStorage + addedStorage,
            displayed_qty: oldDisplayed + addedDisplayed,
            stockUnits: combinedTotal,
            costPrice: Math.round(weightedCost * 100) / 100,
            sellPrice: Number(item.sellPrice) || med.sellPrice,
            updatedAt: now,
            synced: false,
          }),
        );
      }
    }
    return invoice;
  });

// تعديل فاتورة شراء مع عكس كمياتها القديمة ثم تطبيق الكميات الجديدة.
export const updatePurchaseInvoiceDB = (invoice) =>
  runTx([PURCHASE_INVOICES_STORE, STORE_NAME], "readwrite", async (tx) => {
    const invStore = tx.objectStore(PURCHASE_INVOICES_STORE);
    const medStore = tx.objectStore(STORE_NAME);

    const oldInvoice = await reqToPromise(invStore.get(invoice.id));
    if (!oldInvoice) {
      throw new Error("Invoice not found");
    }

    const now = new Date().toISOString();

    // أولًا: عكس كميات الأصناف في النسخة القديمة من الفاتورة.
    for (const item of oldInvoice.items || []) {
      if (!item.medicineId) continue;

      const med = await reqToPromise(medStore.get(item.medicineId));
      if (!med) continue;

      const storage = Math.max(
        0,
        (Number(med.storage_qty) || 0) - (Number(item.storageQty) || 0),
      );

      const displayed = Math.max(
        0,
        (Number(med.displayed_qty) || 0) - (Number(item.displayedQty) || 0),
      );

      await reqToPromise(
        medStore.put({
          ...med,
          storage_qty: storage,
          displayed_qty: displayed,
          stockUnits: storage + displayed,
          updatedAt: now,
          synced: false,
        }),
      );
    }

    // ثانيًا: تطبيق الكميات الجديدة الموجودة في الفاتورة المعدّلة.
    for (const item of invoice.items || []) {
      if (!item.medicineId) continue;

      const med = await reqToPromise(medStore.get(item.medicineId));
      if (!med) continue;

      const storage =
        (Number(med.storage_qty) || 0) + (Number(item.storageQty) || 0);

      const displayed =
        (Number(med.displayed_qty) || 0) + (Number(item.displayedQty) || 0);

      await reqToPromise(
        medStore.put({
          ...med,
          storage_qty: storage,
          displayed_qty: displayed,
          stockUnits: storage + displayed,
          costPrice: Number(item.costPrice) || med.costPrice,
          sellPrice: Number(item.sellPrice) || med.sellPrice,
          updatedAt: now,
          synced: false,
        }),
      );
    }

    // حفظ الفاتورة بعد التعديل.
    const updatedInvoice = {
      ...invoice,
      updated_at: now,
      synced: false,
    };

    await reqToPromise(invStore.put(updatedInvoice));

    return updatedInvoice;
  });
// إضافة دفعة جديدة وتحديث حالة الفاتورة
export const addPurchasePaymentDB = (invoiceId, paymentRecord) =>
  runTx(
    [PURCHASE_INVOICES_STORE, PURCHASE_PAYMENTS_STORE],
    "readwrite",
    async (tx) => {
      const invStore = tx.objectStore(PURCHASE_INVOICES_STORE);
      const payStore = tx.objectStore(PURCHASE_PAYMENTS_STORE);

      const invoice = await reqToPromise(invStore.get(invoiceId));
      if (!invoice) throw new Error("Invoice not found");

      await reqToPromise(payStore.put(paymentRecord));

      const newPaidAmount =
        (Number(invoice.paidAmount) || 0) + Number(paymentRecord.amount);
      const newStatus =
        newPaidAmount >= invoice.totalAmount
          ? "fully_paid"
          : newPaidAmount > 0
          ? "partially_paid"
          : "unpaid";

      const updatedInvoice = {
        ...invoice,
        paidAmount: newPaidAmount,
        paymentStatus: newStatus,
        updated_at: new Date().toISOString(),
        synced: false,
      };

      await reqToPromise(invStore.put(updatedInvoice));
      return updatedInvoice;
    },
  );

// حذف فاتورة وعكس تأثير الكميات على المخزون
export const deletePurchaseInvoiceDB = (invoiceId) =>
  runTx(
    [PURCHASE_INVOICES_STORE, PURCHASE_PAYMENTS_STORE, STORE_NAME],
    "readwrite",
    async (tx) => {
      const invStore = tx.objectStore(PURCHASE_INVOICES_STORE);
      const payStore = tx.objectStore(PURCHASE_PAYMENTS_STORE);
      const medStore = tx.objectStore(STORE_NAME);

      const invoice = await reqToPromise(invStore.get(invoiceId));
      if (!invoice) return;

      // عكس تأثير الكميات على المخزون
      for (const item of invoice.items) {
        if (!item.medicineId) continue;
        const med = await reqToPromise(medStore.get(item.medicineId));
        if (med) {
          const subStorage = Number(item.storageQty) || 0;
          const subDisplayed = Number(item.displayedQty) || 0;

          const currentStorage = Math.max(
            0,
            (Number(med.storage_qty) || 0) - subStorage,
          );
          const currentDisplayed = Math.max(
            0,
            (Number(med.displayed_qty) || 0) - subDisplayed,
          );

          await reqToPromise(
            medStore.put({
              ...med,
              storage_qty: currentStorage,
              displayed_qty: currentDisplayed,
              stockUnits: currentStorage + currentDisplayed,
              updatedAt: new Date().toISOString(),
              synced: false,
            }),
          );
        }
      }

      // حذف الدفعات المرتبطة
      const payments = await reqToPromise(
        payStore.index("invoice_id").getAll(invoiceId),
      );
      for (const p of payments) {
        await reqToPromise(payStore.delete(p.id));
      }

      // حذف الفاتورة
      await reqToPromise(invStore.delete(invoiceId));
    },
  );
