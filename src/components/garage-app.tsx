"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Warehouse,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardView } from "@/components/dashboard-view";
import { ExportView } from "@/components/export-view";
import { GarageView } from "@/components/garage-view";
import { RecordDetailDialog } from "@/components/record-detail-dialog";
import { RecordFormDialog } from "@/components/record-form-dialog";
import { ServiceLogView } from "@/components/service-log-view";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import { VehicleHeader } from "@/components/vehicle-header";
import { formatKm } from "@/lib/format";
import { useGarageStore } from "@/lib/garage-store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ServiceRecord, Vehicle } from "@/types/database";

type ActiveTab = "overview" | "log" | "garage" | "export";

export function GarageApp() {
  const router = useRouter();
  const store = useGarageStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(
    null
  );

  const [detailRecord, setDetailRecord] = useState<ServiceRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function handleSignOut() {
    if (!isSupabaseConfigured()) {
      router.push("/prihlaseni");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/prihlaseni");
    router.refresh();
  }

  function openAddVehicle() {
    setEditingVehicle(null);
    setVehicleDialogOpen(true);
  }

  function openEditVehicle(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setVehicleDialogOpen(true);
  }

  function openAddRecord() {
    if (!store.activeVehicle) {
      openAddVehicle();
      return;
    }
    setEditingRecord(null);
    setRecordDialogOpen(true);
  }

  function openEditRecord(record: ServiceRecord) {
    setEditingRecord(record);
    setRecordDialogOpen(true);
  }

  function openRecordDetail(record: ServiceRecord) {
    setDetailRecord(record);
    setDetailOpen(true);
  }

  const navItems: {
    id: ActiveTab;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "overview",
      label: "Přehled",
      mobileLabel: "Přehled",
      icon: LayoutDashboard,
    },
    {
      id: "log",
      label: "Servisní knížka",
      mobileLabel: "Knížka",
      icon: BookOpen,
    },
    {
      id: "garage",
      label: "Garáž",
      mobileLabel: "Garáž",
      icon: Warehouse,
    },
    {
      id: "export",
      label: "Export",
      mobileLabel: "Export",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-dvh bg-[#09090b] text-zinc-50 flex flex-col lg:flex-row">
      {/* Desktop levý sidebar */}
      <aside className="no-print hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/[0.07] bg-[#0c0c0e]">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111113] text-blue-400">
            <BrandLogo className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">
              AutoGaráž
            </div>
            <div className="text-[11px] text-zinc-500">
              Elektronická servisní knížka
            </div>
          </div>
        </div>

        {/* Přepínač vozidel */}
        <div className="p-4 border-b border-white/[0.07] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Vybrané vozidlo
            </span>
            <button
              type="button"
              onClick={openAddVehicle}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              + Přidat auto
            </button>
          </div>

          {store.vehicles.length > 0 ? (
            <Select
              value={store.activeVehicleId ?? ""}
              onValueChange={store.selectVehicle}
            >
              <SelectTrigger className="h-10 bg-[#111113] border-white/[0.08]">
                <SelectValue placeholder="Vyberte vozidlo" />
              </SelectTrigger>
              <SelectContent>
                {store.vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nickname} — {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={openAddVehicle}
            >
              Přidat první vozidlo
            </Button>
          )}

          {store.activeVehicle && (
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1 tabular-nums">
              <span className="font-mono">
                {store.activeVehicle.license_plate || "Bez SPZ"}
              </span>
              <span className="font-mono text-zinc-300">
                {formatKm(store.activeVehicle.current_mileage)}
              </span>
            </div>
          )}
        </div>

        {/* Rychlé CTA */}
        <div className="p-4 pb-2">
          <Button className="w-full h-10" onClick={openAddRecord}>
            <Plus className="h-4 w-4" />
            Nový záznam
          </Button>
        </div>

        {/* Navigace */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-[#18181B] text-white border border-white/[0.06]"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-blue-400" : "text-zinc-500"
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Patička uživatele */}
        <div className="p-3.5 border-t border-white/[0.07]">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#18181B] text-[11px] font-medium uppercase text-zinc-200">
                {(store.userEmail?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">
                  {store.isDemoMode
                    ? "Lokální ukázkový režim"
                    : store.userEmail ?? "Uživatelský účet"}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      store.isDemoMode ? "bg-amber-400" : "bg-emerald-500"
                    )}
                  />
                  <span>{store.isDemoMode ? "Lokální režim" : "Online"}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Odhlásit se"
              aria-label="Odhlásit se"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-400" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobilní horní hlavička */}
      <header className="no-print lg:hidden sticky top-0 z-30 border-b border-white/[0.07] bg-[#09090b]/95 backdrop-blur-md pt-safe">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111113] text-blue-400">
              <BrandLogo className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm text-white">AutoGaráž</span>
          </div>

          <div className="flex-1 max-w-[210px]">
            {store.vehicles.length > 0 ? (
              <Select
                value={store.activeVehicleId ?? ""}
                onValueChange={store.selectVehicle}
              >
                <SelectTrigger className="h-9 text-xs bg-zinc-900">
                  <SelectValue placeholder="Vyberte auto" />
                </SelectTrigger>
                <SelectContent>
                  {store.vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nickname} ({v.make})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={openAddVehicle}
              >
                + Přidat auto
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hlavní obsah */}
      <main className="flex-1 lg:pl-72 pb-24 lg:pb-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 sm:py-7 space-y-5">
          {store.isDemoMode && (
            <div className="no-print rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Ukázkový režim:</strong> Supabase není zatím nakonfigurován
                v <code className="text-amber-100">.env.local</code> — veškeré
                změny se ukládají lokálně v prohlížeči.
              </span>
              <button
                type="button"
                onClick={() => router.push("/prihlaseni")}
                className="underline font-medium text-amber-100 hover:text-white cursor-pointer"
              >
                Nastavení přihlášení
              </button>
            </div>
          )}

          {store.error && (
            <div className="no-print rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {store.error}
            </div>
          )}

          {store.loading ? (
            <div className="space-y-4">
              <div className="h-36 rounded-xl border border-white/[0.07] bg-[#111113] animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl border border-white/[0.07] bg-[#111113] animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : activeTab === "garage" ? (
            <GarageView
              vehicles={store.vehicles}
              records={store.records}
              activeVehicleId={store.activeVehicleId}
              onSelectVehicle={(id) => {
                store.selectVehicle(id);
                setActiveTab("overview");
              }}
              onAddVehicle={openAddVehicle}
              onEditVehicle={openEditVehicle}
            />
          ) : !store.activeVehicle ? (
            <GarageView
              vehicles={store.vehicles}
              records={store.records}
              activeVehicleId={store.activeVehicleId}
              onSelectVehicle={store.selectVehicle}
              onAddVehicle={openAddVehicle}
              onEditVehicle={openEditVehicle}
            />
          ) : (
            <>
              {activeTab !== "export" && (
                <VehicleHeader
                  vehicle={store.activeVehicle}
                  onEdit={() => openEditVehicle(store.activeVehicle!)}
                />
              )}

              {activeTab === "overview" && (
                <DashboardView
                  vehicle={store.activeVehicle}
                  records={store.activeVehicleRecords}
                  onSelectRecord={openRecordDetail}
                  onOpenLog={() => setActiveTab("log")}
                />
              )}

              {activeTab === "log" && (
                <ServiceLogView
                  vehicle={store.activeVehicle}
                  records={store.activeVehicleRecords}
                  onAddRecord={openAddRecord}
                  onSelectRecord={openRecordDetail}
                  onEditRecord={openEditRecord}
                />
              )}

              {activeTab === "export" && (
                <ExportView
                  vehicle={store.activeVehicle}
                  records={store.activeVehicleRecords}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobilní spodní navigace pro ovládání jednou rukou v garáži */}
      <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.07] bg-[#0c0c0e]/95 backdrop-blur-lg pb-safe">
        <div className="grid grid-cols-5 items-center px-2 pt-1.5">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium cursor-pointer transition-colors",
                  active ? "text-blue-400" : "text-zinc-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}

          <div className="flex justify-center -mt-5">
            <button
              type="button"
              onClick={openAddRecord}
              aria-label="Přidat záznam"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB] text-white border border-blue-400/20 shadow-lg shadow-blue-600/20 active:scale-95 transition-transform cursor-pointer"
            >
              <Plus className="h-5 w-5 stroke-[2.25]" />
            </button>
          </div>

          {navItems.slice(2).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium cursor-pointer transition-colors",
                  active ? "text-blue-400" : "text-zinc-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modální okna */}
      <VehicleFormDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        vehicle={editingVehicle}
        onSave={store.saveVehicle}
        onDelete={store.deleteVehicle}
      />

      <RecordFormDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        vehicle={store.activeVehicle}
        record={editingRecord}
        onSave={store.saveServiceRecord}
        onDelete={store.deleteServiceRecord}
      />

      <RecordDetailDialog
        record={detailRecord}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEditRecord}
        onDelete={store.deleteServiceRecord}
      />
    </div>
  );
}
