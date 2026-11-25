"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { DEMO_RECORDS, DEMO_VEHICLES } from "@/lib/demo-data";
import { compressImageFile } from "@/lib/image-compression";
import type {
  RecordPhoto,
  ServiceRecord,
  ServiceRecordFormValues,
  Vehicle,
  VehicleFormValues,
} from "@/types/database";

const LOCAL_VEHICLES_KEY = "autogarage_demo_vehicles_v1";
const LOCAL_RECORDS_KEY = "autogarage_demo_records_v1";
const ACTIVE_VEHICLE_KEY = "autogarage_active_vehicle_id";
const STORAGE_BUCKET = "garage-media";

export interface GarageStoreState {
  vehicles: Vehicle[];
  records: ServiceRecord[];
  activeVehicleId: string | null;
  activeVehicle: Vehicle | null;
  activeVehicleRecords: ServiceRecord[];
  loading: boolean;
  isDemoMode: boolean;
  userEmail: string | null;
  error: string | null;
}

export function useGarageStore() {
  const supabaseEnabled = isSupabaseConfigured();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectVehicle = useCallback((id: string) => {
    setActiveVehicleIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_VEHICLE_KEY, id);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabaseEnabled) {
      try {
        const storedVehicles = window.localStorage.getItem(LOCAL_VEHICLES_KEY);
        const storedRecords = window.localStorage.getItem(LOCAL_RECORDS_KEY);
        const parsedVehicles: Vehicle[] = storedVehicles
          ? JSON.parse(storedVehicles)
          : DEMO_VEHICLES;
        const parsedRecords: ServiceRecord[] = storedRecords
          ? JSON.parse(storedRecords)
          : DEMO_RECORDS;

        if (!storedVehicles) {
          window.localStorage.setItem(
            LOCAL_VEHICLES_KEY,
            JSON.stringify(DEMO_VEHICLES)
          );
        }
        if (!storedRecords) {
          window.localStorage.setItem(
            LOCAL_RECORDS_KEY,
            JSON.stringify(DEMO_RECORDS)
          );
        }

        setVehicles(parsedVehicles);
        setRecords(parsedRecords);
        setUserEmail("ukazka@autogaraz.cz");
        setUserId("demo-user");

        const savedId = window.localStorage.getItem(ACTIVE_VEHICLE_KEY);
        const validId =
          parsedVehicles.find((v) => v.id === savedId)?.id ??
          parsedVehicles[0]?.id ??
          null;
        setActiveVehicleIdState(validId);
      } catch {
        setVehicles(DEMO_VEHICLES);
        setRecords(DEMO_RECORDS);
        setActiveVehicleIdState(DEMO_VEHICLES[0]?.id ?? null);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email ?? null);
      setUserId(user.id);

      const [vehiclesRes, recordsRes, photosRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("service_records")
          .select("*")
          .order("record_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("record_photos")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (recordsRes.error) throw recordsRes.error;
      if (photosRes.error) throw photosRes.error;

      const rawVehicles = (vehiclesRes.data ?? []) as Vehicle[];
      const rawRecords = (recordsRes.data ?? []) as ServiceRecord[];
      const rawPhotos = (photosRes.data ?? []) as RecordPhoto[];

      // Vygenerování podepsaných URL pro soukromý storage bucket
      const pathsToSign = [
        ...rawVehicles
          .map((v) => v.cover_photo_path)
          .filter((p): p is string => Boolean(p)),
        ...rawPhotos.map((p) => p.storage_path).filter(Boolean),
      ];

      const signedUrlMap = new Map<string, string>();
      if (pathsToSign.length > 0) {
        const { data: signedData } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrls(pathsToSign, 60 * 60 * 6);
        signedData?.forEach((item) => {
          if (item.path && item.signedUrl) {
            signedUrlMap.set(item.path, item.signedUrl);
          }
        });
      }

      const hydratedVehicles: Vehicle[] = rawVehicles.map((v) => ({
        ...v,
        cover_photo_url: v.cover_photo_path
          ? signedUrlMap.get(v.cover_photo_path) ?? null
          : null,
      }));

      const photosByRecord = new Map<string, RecordPhoto[]>();
      rawPhotos.forEach((photo) => {
        const list = photosByRecord.get(photo.record_id) ?? [];
        list.push({
          ...photo,
          signed_url: signedUrlMap.get(photo.storage_path) ?? null,
        });
        photosByRecord.set(photo.record_id, list);
      });

      const hydratedRecords: ServiceRecord[] = rawRecords.map((rec) => ({
        ...rec,
        parts_cost: Number(rec.parts_cost),
        labor_cost: Number(rec.labor_cost),
        total_cost: Number(rec.total_cost),
        photos: photosByRecord.get(rec.id) ?? [],
      }));

      setVehicles(hydratedVehicles);
      setRecords(hydratedRecords);

      const savedId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ACTIVE_VEHICLE_KEY)
          : null;
      const validId =
        hydratedVehicles.find((v) => v.id === savedId)?.id ??
        hydratedVehicles[0]?.id ??
        null;
      setActiveVehicleIdState(validId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepodařilo se načíst data z databáze."
      );
    } finally {
      setLoading(false);
    }
  }, [supabaseEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const persistLocalVehicles = (next: Vehicle[]) => {
    setVehicles(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(next));
    }
  };

  const persistLocalRecords = (next: ServiceRecord[]) => {
    setRecords(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(next));
    }
  };

  const saveVehicle = useCallback(
    async (
      values: VehicleFormValues,
      options?: {
        vehicleId?: string;
        coverFile?: File | null;
        removeCover?: boolean;
      }
    ) => {
      const existing = options?.vehicleId
        ? vehicles.find((v) => v.id === options.vehicleId)
        : undefined;

      if (!supabaseEnabled) {
        let coverUrl = options?.removeCover
          ? null
          : existing?.cover_photo_url ?? null;
        if (options?.coverFile) {
          const compressed = await compressImageFile(options.coverFile);
          coverUrl = await fileToDataUrl(compressed);
        }

        const now = new Date().toISOString();
        if (existing) {
          const updated: Vehicle = {
            ...existing,
            ...toNullableVehicleFields(values),
            cover_photo_url: coverUrl,
            updated_at: now,
          };
          const next = vehicles.map((v) => (v.id === existing.id ? updated : v));
          persistLocalVehicles(next);
          return updated;
        } else {
          const id = `veh-${crypto.randomUUID()}`;
          const created: Vehicle = {
            id,
            user_id: "demo-user",
            ...toNullableVehicleFields(values),
            cover_photo_path: null,
            cover_photo_url: coverUrl,
            created_at: now,
            updated_at: now,
          };
          const next = [...vehicles, created];
          persistLocalVehicles(next);
          selectVehicle(id);
          return created;
        }
      }

      const supabase = createClient();
      const targetId = existing?.id ?? crypto.randomUUID();
      let coverPath = options?.removeCover
        ? null
        : existing?.cover_photo_path ?? null;

      if (options?.removeCover && existing?.cover_photo_path) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([existing.cover_photo_path]);
      }

      if (options?.coverFile && userId) {
        const compressed = await compressImageFile(options.coverFile);
        const path = `${userId}/vehicles/${targetId}/cover-${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;

        if (existing?.cover_photo_path && existing.cover_photo_path !== path) {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([existing.cover_photo_path]);
        }
        coverPath = path;
      }

      const payload = {
        ...toNullableVehicleFields(values),
        cover_photo_path: coverPath,
      };

      if (existing) {
        const { error: updateErr } = await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", existing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from("vehicles").insert({
          id: targetId,
          ...payload,
        });
        if (insertErr) throw insertErr;
        selectVehicle(targetId);
      }

      await loadData();
      return null;
    },
    [supabaseEnabled, vehicles, userId, selectVehicle, loadData]
  );

  const deleteVehicle = useCallback(
    async (vehicleId: string) => {
      if (!supabaseEnabled) {
        const nextVehicles = vehicles.filter((v) => v.id !== vehicleId);
        const nextRecords = records.filter((r) => r.vehicle_id !== vehicleId);
        persistLocalVehicles(nextVehicles);
        persistLocalRecords(nextRecords);
        if (activeVehicleId === vehicleId) {
          selectVehicle(nextVehicles[0]?.id ?? "");
        }
        return;
      }

      const supabase = createClient();
      const target = vehicles.find((v) => v.id === vehicleId);
      const relatedPhotos = records
        .filter((r) => r.vehicle_id === vehicleId)
        .flatMap((r) => r.photos ?? [])
        .map((p) => p.storage_path);
      if (target?.cover_photo_path) {
        relatedPhotos.push(target.cover_photo_path);
      }
      if (relatedPhotos.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(relatedPhotos);
      }

      const { error: delErr } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId);
      if (delErr) throw delErr;

      await loadData();
    },
    [
      supabaseEnabled,
      vehicles,
      records,
      activeVehicleId,
      selectVehicle,
      loadData,
    ]
  );

  const saveServiceRecord = useCallback(
    async (
      values: ServiceRecordFormValues,
      options?: {
        recordId?: string;
        newFiles?: File[];
        removedPhotoIds?: string[];
        updateVehicleMileage?: boolean;
      }
    ) => {
      const existing = options?.recordId
        ? records.find((r) => r.id === options.recordId)
        : undefined;

      const totalCost =
        Number(values.parts_cost || 0) + Number(values.labor_cost || 0);

      if (!supabaseEnabled) {
        const now = new Date().toISOString();
        const recordId = existing?.id ?? `rec-${crypto.randomUUID()}`;
        const keptPhotos = (existing?.photos ?? []).filter(
          (p) => !(options?.removedPhotoIds ?? []).includes(p.id)
        );
        const uploadedPhotos: RecordPhoto[] = [];

        for (const file of options?.newFiles ?? []) {
          const compressed = await compressImageFile(file);
          const dataUrl = await fileToDataUrl(compressed);
          uploadedPhotos.push({
            id: `ph-${crypto.randomUUID()}`,
            record_id: recordId,
            user_id: "demo-user",
            storage_path: dataUrl,
            signed_url: dataUrl,
            caption: file.name,
            created_at: now,
          });
        }

        const nextRecord: ServiceRecord = {
          id: recordId,
          vehicle_id: values.vehicle_id,
          user_id: "demo-user",
          title: values.title.trim(),
          category: values.category,
          record_date: values.record_date,
          mileage: Number(values.mileage || 0),
          parts_cost: Number(values.parts_cost || 0),
          labor_cost: Number(values.labor_cost || 0),
          total_cost: totalCost,
          oem_codes: values.oem_codes.trim() || null,
          product_url: values.product_url.trim() || null,
          notes: values.notes.trim() || null,
          created_at: existing?.created_at ?? now,
          updated_at: now,
          photos: [...keptPhotos, ...uploadedPhotos],
        };

        const nextRecords = existing
          ? records.map((r) => (r.id === existing.id ? nextRecord : r))
          : [nextRecord, ...records];
        nextRecords.sort((a, b) => b.record_date.localeCompare(a.record_date));
        persistLocalRecords(nextRecords);

        if (options?.updateVehicleMileage) {
          const nextVehicles = vehicles.map((v) =>
            v.id === values.vehicle_id && values.mileage > v.current_mileage
              ? { ...v, current_mileage: values.mileage, updated_at: now }
              : v
          );
          persistLocalVehicles(nextVehicles);
        }
        return;
      }

      const supabase = createClient();
      const targetRecordId = existing?.id ?? crypto.randomUUID();
      const payload = {
        vehicle_id: values.vehicle_id,
        title: values.title.trim(),
        category: values.category,
        record_date: values.record_date,
        mileage: Number(values.mileage || 0),
        parts_cost: Number(values.parts_cost || 0),
        labor_cost: Number(values.labor_cost || 0),
        oem_codes: values.oem_codes.trim() || null,
        product_url: values.product_url.trim() || null,
        notes: values.notes.trim() || null,
      };

      if (existing) {
        const { error: updErr } = await supabase
          .from("service_records")
          .update(payload)
          .eq("id", existing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from("service_records")
          .insert({ id: targetRecordId, ...payload });
        if (insErr) throw insErr;
      }

      if (options?.removedPhotoIds && options.removedPhotoIds.length > 0 && existing) {
        const toRemove = (existing.photos ?? []).filter((p) =>
          options.removedPhotoIds?.includes(p.id)
        );
        if (toRemove.length > 0) {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(toRemove.map((p) => p.storage_path));
          await supabase
            .from("record_photos")
            .delete()
            .in(
              "id",
              toRemove.map((p) => p.id)
            );
        }
      }

      if (options?.newFiles && options.newFiles.length > 0 && userId) {
        for (const file of options.newFiles) {
          const compressed = await compressImageFile(file);
          const storagePath = `${userId}/records/${targetRecordId}/${crypto.randomUUID()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, compressed, { contentType: "image/jpeg" });
          if (upErr) throw upErr;

          const { error: photoRowErr } = await supabase
            .from("record_photos")
            .insert({
              record_id: targetRecordId,
              storage_path: storagePath,
              caption: file.name,
            });
          if (photoRowErr) throw photoRowErr;
        }
      }

      if (options?.updateVehicleMileage) {
        const veh = vehicles.find((v) => v.id === values.vehicle_id);
        if (veh && values.mileage > veh.current_mileage) {
          await supabase
            .from("vehicles")
            .update({ current_mileage: values.mileage })
            .eq("id", veh.id);
        }
      }

      await loadData();
    },
    [supabaseEnabled, records, vehicles, userId, loadData]
  );

  const deleteServiceRecord = useCallback(
    async (recordId: string) => {
      if (!supabaseEnabled) {
        persistLocalRecords(records.filter((r) => r.id !== recordId));
        return;
      }

      const supabase = createClient();
      const target = records.find((r) => r.id === recordId);
      const photoPaths = (target?.photos ?? []).map((p) => p.storage_path);
      if (photoPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(photoPaths);
      }

      const { error: delErr } = await supabase
        .from("service_records")
        .delete()
        .eq("id", recordId);
      if (delErr) throw delErr;

      await loadData();
    },
    [supabaseEnabled, records, loadData]
  );

  const activeVehicle =
    vehicles.find((v) => v.id === activeVehicleId) ?? vehicles[0] ?? null;

  const activeVehicleRecords = activeVehicle
    ? records.filter((r) => r.vehicle_id === activeVehicle.id)
    : [];

  return {
    vehicles,
    records,
    activeVehicle,
    activeVehicleId: activeVehicle?.id ?? null,
    activeVehicleRecords,
    loading,
    isDemoMode: !supabaseEnabled,
    userEmail,
    error,
    selectVehicle,
    reload: loadData,
    saveVehicle,
    deleteVehicle,
    saveServiceRecord,
    deleteServiceRecord,
  };
}

function toNullableVehicleFields(values: VehicleFormValues) {
  return {
    nickname: values.nickname.trim(),
    make: values.make.trim(),
    model: values.model.trim(),
    year: Number(values.year) || new Date().getFullYear(),
    license_plate: values.license_plate.trim() || null,
    initial_mileage: Math.max(0, Number(values.initial_mileage) || 0),
    current_mileage: Math.max(0, Number(values.current_mileage) || 0),
    vin: values.vin.trim().toUpperCase() || null,
    engine_code: values.engine_code.trim().toUpperCase() || null,
    paint_code: values.paint_code.trim() || null,
    fuel_type: values.fuel_type.trim() || null,
    engine_spec: values.engine_spec.trim() || null,
    stk_expires_at: values.stk_expires_at || null,
    vignette_expires_at: values.vignette_expires_at || null,
    insurance_expires_at: values.insurance_expires_at || null,
    notes: values.notes.trim() || null,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
