import {
  getAllMedicines,
  saveMedicineDB,
  mergeServerMedicinesDB,
  markMedicinesSyncedDB,
  getUnsyncedSalesDB,
  getSaleItemsBySaleIdsDB,
  markSalesSyncedDB,
  markSaleItemsSyncedDB,
  getSalesSyncCursorDB,
  mergeServerSalesDB,
  putMissingSaleItemsDB,
  getDeletedSalesDB,
  removeDeletedSaleDB,
  deleteLocalSalesNotOnServerDB,
} from "./db";
import { supabase } from "./supabase";

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ═════════════════════════════════════════════════════════════════════════════
// Medicines
// ═════════════════════════════════════════════════════════════════════════════

export const uploadUnsyncedMedicines = async () => {
  const medicines = await getAllMedicines();
  // Strict `=== false`: rows downloaded by older versions have no `synced` flag
  // and must NOT be re-uploaded (that could overwrite newer server data).
  const unsynced = medicines.filter((m) => m.synced === false && !m.deleted);

  if (unsynced.length === 0) return;

  for (const batch of chunk(unsynced, 500)) {
    const payload = batch.map(({ synced, ...rest }) => rest);

    const { error } = await supabase.from("medicines").upsert(payload);

    if (error) {
      console.error(error);
      return;
    }

    // Only flips to synced if the row was not changed again during the upload
    // (e.g. by a sale) – otherwise the newer local change stays queued.
    await markMedicinesSyncedDB(
      batch.map((m) => ({ id: m.id, updatedAt: m.updatedAt })),
    );
  }
};

export const downloadMedicines = async () => {
  const { data, error } = await supabase.from("medicines").select("*");

  if (error) {
    console.error(error);
    return;
  }

  const localMedicines = await getAllMedicines();

  for (const med of data) {
    const localMed = localMedicines.find((m) => m.id === med.id);

    if (!localMed) {
      await saveMedicineDB(med);
      continue;
    }

    const serverDate = med.updatedAt ? new Date(med.updatedAt).getTime() : 0;
    const localDate = localMed.updatedAt
      ? new Date(localMed.updatedAt).getTime()
      : 0;

    if (!localMed.synced) {
      continue;
    }

    if (serverDate > localDate) {
      await saveMedicineDB(med);
    }
  }
};

// دالة تزامن مجربة تجلب كافة البيانات مهما كان عددها بأسلوب الدفعات (Pagination)
export async function syncMedicines() {
  if (!navigator.onLine) return;

  try {
    // 1) Push local changes first (inventory edits AND sale stock deductions),
    //    so the download below cannot bring back an older copy.
    await uploadUnsyncedMedicines();

    let allMeds = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    // الحلقة تجلب 1000 بعنصر في كل مرة حتى تنتهي كل البيانات
    while (hasMore) {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .is("deleted", false)
        .range(from, from + step - 1);

      if (error) {
        console.error("Sync error:", error);
        break;
      }

      if (data && data.length > 0) {
        allMeds = [...allMeds, ...data];
        from += step;
      }

      if (!data || data.length < step) {
        hasMore = false;
      }
    }

    // 2) Save server copies, but never overwrite rows with pending local changes.
    const { skipped } = await mergeServerMedicinesDB(allMeds);

    console.log(
      `Successfully synced ${allMeds.length} medicines!` +
        (skipped ? ` (${skipped} kept: pending local changes)` : ""),
    );
  } catch (err) {
    console.error("Failed to sync medicines:", err);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Sales  (parent `sales` rows are always uploaded BEFORE their `sale_items`)
// ═════════════════════════════════════════════════════════════════════════════

const toIso = (v) => (v ? new Date(v).toISOString() : v);
// Normalise server timestamps to the same format used locally so the
// created_at index range queries compare correctly.
const normalizeServerSale = (s) => ({
  ...s,
  total: Number(s.total) || 0,
  total_cost: Number(s.total_cost) || 0,
  total_profit: Number(s.total_profit) || 0,
  created_at: toIso(s.created_at),
  updated_at: toIso(s.updated_at || s.created_at),
});
const normalizeServerItem = (i) => ({
  ...i,
  quantity_boxes: Number(i.quantity_boxes) || 0,
  quantity_strips: Number(i.quantity_strips) || 0,
  quantity_pills: Number(i.quantity_pills) || 0,
  quantity_in_base_units: Number(i.quantity_in_base_units) || 0,
  sell_price: Number(i.sell_price) || 0,
  cost_at_sale: Number(i.cost_at_sale) || 0,
  line_total: Number(i.line_total) || 0,
  line_cost: Number(i.line_cost) || 0,
  line_profit: Number(i.line_profit) || 0,
  created_at: toIso(i.created_at),
});

export const uploadUnsyncedSales = async () => {
  const unsyncedSales = await getUnsyncedSalesDB();
  if (unsyncedSales.length === 0) return true;

  for (const batch of chunk(unsyncedSales, 100)) {
    const items = await getSaleItemsBySaleIdsDB(batch.map((s) => s.id));
    const unsyncedItems = items.filter((i) => i.synced === false);

    // 1) parents
    const { error: saleError } = await supabase
      .from("sales")
      .upsert(batch.map(({ synced, ...rest }) => rest));
    if (saleError) {
      console.error("Sales upload failed:", saleError);
      return false;
    }

    // 2) children (only after their sales exist on the server)
    for (const itemBatch of chunk(unsyncedItems, 500)) {
      const { error: itemError } = await supabase
        .from("sale_items")
        .upsert(itemBatch.map(({ synced, ...rest }) => rest));
      if (itemError) {
        console.error("Sale items upload failed:", itemError);
        return false; // sales stay flagged unsynced → retried next time (upsert is idempotent)
      }
    }

    await markSaleItemsSyncedDB(unsyncedItems.map((i) => i.id));
    await markSalesSyncedDB(
      batch.map((s) => ({ id: s.id, updated_at: s.updated_at })),
    );
  }
  return true;
};

export const uploadDeletedSales = async () => {
  const deletedSales = await getDeletedSalesDB();

  if (deletedSales.length === 0) return true;

  for (const deleted of deletedSales) {
    const { error: itemsError } = await supabase
      .from("sale_items")
      .delete()
      .eq("sale_id", deleted.id);

    if (itemsError) {
      console.error("Deleted sale items sync failed:", itemsError);
      return false;
    }

    const { error: saleError } = await supabase
      .from("sales")
      .delete()
      .eq("id", deleted.id);

    if (saleError) {
      console.error("Deleted sale sync failed:", saleError);
      return false;
    }

    await removeDeletedSaleDB(deleted.id);
  }

  return true;
};

export const downloadSales = async () => {
  const serverSales = [];
  const step = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("updated_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + step - 1);
    if (error) {
      console.error("Sales download failed:", error);
      return false;
    }
    serverSales.push(...(data || []));
    if (!data || data.length < step) break;
    from += step;
  }
  if (serverSales.length === 0) {
    await deleteLocalSalesNotOnServerDB([]);
    return true;
  }

  await mergeServerSalesDB(serverSales.map(normalizeServerSale));

  await deleteLocalSalesNotOnServerDB(serverSales.map((s) => s.id));
  // Items for every downloaded sale (missing ones are inserted, existing kept)
  for (const ids of chunk(
    serverSales.map((s) => s.id),
    50,
  )) {
    let itemFrom = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("sale_items")
        .select("*")
        .in("sale_id", ids)
        .order("id", { ascending: true })
        .range(itemFrom, itemFrom + step - 1);
      if (error) {
        console.error("Sale items download failed:", error);
        return false;
      }
      if (data && data.length)
        await putMissingSaleItemsDB(data.map(normalizeServerItem));
      if (!data || data.length < step) break;
      itemFrom += step;
    }
  }
  return true;
};

// One sales sync at a time; a request that arrives mid-run triggers one more pass
// (so a sale created during a sync is never left behind).
let salesSyncPromise = null;
let salesSyncRerun = false;

export function syncSales() {
  if (!navigator.onLine) return Promise.resolve(false);
  if (salesSyncPromise) {
    salesSyncRerun = true;
    return salesSyncPromise;
  }
  salesSyncPromise = (async () => {
    let ok = true;
    try {
      do {
        salesSyncRerun = false;
        const deleted = await uploadDeletedSales();
        const up = await uploadUnsyncedSales();
        const down = await downloadSales();

        ok = ok && deleted && up && down;
      } while (salesSyncRerun);
    } catch (err) {
      console.error("Failed to sync sales:", err);
      ok = false;
    } finally {
      salesSyncPromise = null;
    }
    return ok;
  })();
  return salesSyncPromise;
}

/** Light sync right after a sale / payment change: push sales + stock changes. */
export async function syncAfterSaleChange() {
  if (!navigator.onLine) return;
  await syncSales();
  await uploadUnsyncedMedicines();
}

/** Full sync: medicines (upload + download) and sales (upload + download). */
export async function syncAll() {
  if (!navigator.onLine) return;
  await syncMedicines();
  await syncSales();
}

// ═════════════════════════════════════════════════════════════════════════════
// Purchase Invoices Sync
// ═════════════════════════════════════════════════════════════════════════════

export async function uploadUnsyncedPurchaseInvoices() {
  if (!navigator.onLine) return;

  const invoices = await getAllPurchaseInvoicesDB();
  const unsynced = invoices.filter((inv) => inv.synced === false);

  if (unsynced.length === 0) return;

  for (const inv of unsynced) {
    // 1. إرسال الفاتورة الرئيسية
    const payloadInvoice = {
      id: inv.id,
      pharmacy: inv.pharmacy || "old",
      supplier_name: inv.supplierName,
      invoice_number: inv.invoiceNumber || null,
      date: inv.date,
      notes: inv.notes || null,
      total_amount: inv.totalAmount,
      paid_amount: inv.paidAmount,
      payment_status: inv.paymentStatus,
      updated_at: new Date().toISOString(),
      synced: true,
    };

    const { error: invErr } = await supabase
      .from("purchase_invoices")
      .upsert(payloadInvoice);
    if (invErr) {
      console.error("Failed to sync invoice:", invErr);
      continue;
    }

    if (inv.items && inv.items.length > 0) {
      const itemsPayload = inv.items.map((it) => ({
        invoice_id: inv.id,
        medicine_id: it.medicineId,
        medicine_name: it.name,
        quantity_storage: it.storageQty,
        quantity_displayed: it.displayedQty,
        cost_price: it.costPrice,
        sell_price: it.sellPrice,
      }));

      const { error: itemsErr } = await supabase
        .from("purchase_invoice_items")
        .upsert(itemsPayload);
      if (itemsErr) console.error("Failed to sync invoice items:", itemsErr);
    }

    const payments = await getPurchasePaymentsDB(inv.id);
    if (payments && payments.length > 0) {
      const paymentsPayload = payments.map((p) => ({
        id: p.id,
        invoice_id: inv.id,
        amount: p.amount,
        payment_type: p.paymentType,
        transfer_from: p.transferFrom || null,
        receiver: p.receiver || null,
        destination_account: p.destinationAccount || null,
        date: p.date,
        notes: p.notes || null,
      }));

      const { error: payErr } = await supabase
        .from("purchase_payments")
        .upsert(paymentsPayload);
      if (payErr) console.error("Failed to sync invoice payments:", payErr);
    }
  }
}
