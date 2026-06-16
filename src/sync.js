import { deleteMedicineDB, getAllMedicines, saveMedicineDB } from "./db";
import { supabase } from "./supabase";

export const uploadUnsyncedMedicines = async () => {
  const medicines = await getAllMedicines();
  const unsynced = medicines.filter((m) => !m.synced);

  for (const med of unsynced) {
    try {
      if (med.deleted) {
        const { error } = await supabase
          .from("medicines")
          .delete()
          .eq("id", med.id);

        if (!error) {
          await deleteMedicineDB(med.id);
        }
      } else {
        const { synced, ...serverMed } = med;
        const { error } = await supabase.from("medicines").upsert(serverMed);

        if (!error) {
          await saveMedicineDB({
            ...med,
            synced: true,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
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

export const syncMedicines = async (
  setIsSyncing,
  setLastUpload,
  setLastDownload,
) => {
  if (setIsSyncing) setIsSyncing(true);

  try {
    await uploadUnsyncedMedicines();

    const uploadTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    localStorage.setItem("lastUpload", uploadTime);
    if (setLastUpload) setLastUpload(uploadTime);

    await downloadMedicines();

    const downloadTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    localStorage.setItem("lastDownload", downloadTime);
    if (setLastDownload) setLastDownload(downloadTime);

    console.log("Sync completed");
  } catch (err) {
    console.error("Sync failed", err);
  } finally {
    if (setIsSyncing) setIsSyncing(false);
  }
};
