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
  const unsynced = medicines.filter((m) => m.synced === false);

  if (unsynced.length === 0) return;

  for (const batch of chunk(unsynced, 500)) {
    const payload = batch.map(({ synced, ...rest }) => rest);

    const { error } = await supabase.from("medicines").upsert(payload);

    if (error) {
      console.error(error);
      return;
    }

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

    // ── تنظيف الأدوية اللي انحذفت على السيرفر (من جهاز ثاني) ──
    const serverIds = new Set(allMeds.map((m) => m.id));
    const localMeds = await getAllMedicines();

    for (const local of localMeds) {
      // إذا السجل محلي ومتزامن وما عاد موجود على السيرفر → انحذف من جهاز آخر
      if (
        local.synced !== false &&
        !serverIds.has(local.id) &&
        !local.deleted
      ) {
        await saveMedicineDB({
          ...local,
          deleted: true,
          synced: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }
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
  price_mode: i.price_mode || "unit",
  manual_total_price:
    i.manual_total_price == null ? null : Number(i.manual_total_price),
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

    // 1) parents — فقط أعمدة جدول sales الموجودة في Supabase
    const salesPayload = batch.map((s) => ({
      id: s.id,
      pharmacy: s.pharmacy,
      customer_name: s.customer_name ?? null,
      customer_phone: s.customer_phone ?? null,
      payment_type: s.payment_type,
      transfer_from: s.transfer_from ?? null,
      receiver: s.receiver ?? null,
      destination_account: s.destination_account ?? null,
      payment_status: s.payment_status,
      total: Number(s.total) || 0,
      total_cost: Number(s.total_cost) || 0,
      total_profit: Number(s.total_profit) || 0,
      created_at: s.created_at,
      updated_at: s.updated_at || s.created_at,
      created_by: s.created_by ?? null,
      sale_status: s.sale_status || "completed",
    }));

    const { error: saleError } = await supabase
      .from("sales")
      .upsert(salesPayload);
    if (saleError) {
      console.error("Sales upload failed:", saleError);
      return false;
    }

    // 2) children — فقط أعمدة sale_items (بدون updated_at)
    const itemsPayload = unsyncedItems.map((it) => ({
      id: it.id,
      sale_id: it.sale_id,
      medicine_id: it.medicine_id,
      medicine_name: it.medicine_name,
      medicine_type: it.medicine_type ?? null,
      quantity_boxes: Number(it.quantity_boxes) || 0,
      quantity_strips: Number(it.quantity_strips) || 0,
      quantity_pills: Number(it.quantity_pills) || 0,
      quantity_in_base_units: Number(it.quantity_in_base_units) || 0,
      sell_price: Number(it.sell_price) || 0,
      cost_at_sale: Number(it.cost_at_sale) || 0,
      line_total: Number(it.line_total) || 0,
      line_cost: Number(it.line_cost) || 0,
      line_profit: Number(it.line_profit) || 0,
      created_at: it.created_at || new Date().toISOString(),
      price_mode: it.price_mode || "unit",
      manual_total_price:
        it.manual_total_price == null ? null : Number(it.manual_total_price),
    }));

    for (const itemBatch of chunk(itemsPayload, 500)) {
      const { error: itemError } = await supabase
        .from("sale_items")
        .upsert(itemBatch);
      if (itemError) {
        console.error("Sale items upload failed:", itemError);
        return false;
      }
    }

    const saleIdsWithItems = new Set(items.map((i) => i.sale_id));
    const salesReady = batch.filter((s) => {
      if (!saleIdsWithItems.has(s.id)) {
        console.warn("Sale has no local items; leaving unsynced:", s.id);
        return false;
      }
      return true;
    });

    await markSaleItemsSyncedDB(unsyncedItems.map((i) => i.id));
    if (salesReady.length > 0) {
      await markSalesSyncedDB(
        salesReady.map((s) => ({ id: s.id, updated_at: s.updated_at })),
      );
    }
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
