import { deleteMedicineDB, getAllMedicines, saveMedicineDB } from "./db";
import { supabase } from "./supabase";

export const uploadUnsyncedMedicines = async () => {
  const medicines = await getAllMedicines();
  const unsynced = medicines.filter((m) => !m.synced);

  for (const med of unsynced) {
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

    const serverDate = new Date(med.updatedAt).getTime();

    const localDate = new Date(localMed.updatedAt).getTime();

    if (serverDate > localDate) {
      await saveMedicineDB(med);
    }
  }
};

export const syncMedicines = async () => {
  try {
    await uploadUnsyncedMedicines();

    await downloadMedicines();

    console.log("Sync completed");
  } catch (err) {
    console.error("Sync failed", err);
  }
};
