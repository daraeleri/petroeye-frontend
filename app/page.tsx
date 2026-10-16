"use client";

import { useState } from "react";
import { Sidebar, type SidebarTabId } from "@/components/hud/Sidebar";
import { OverviewDashboard } from "@/components/dashboard/overview";
import { LiveMap } from "@/components/dashboard/live-map";
import { FleetDashboard } from "@/components/dashboard/fleet";
import { TruckDetailPage } from "@/components/dashboard/truck-detail";
import { useDashboard } from "@/lib/DashboardContext";

type View = SidebarTabId;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<View>("dashboard");
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const { trucks, alerts } = useDashboard();

  const alertCount = alerts.filter((a) => !a.resolved_at).length;
  const onlineCount = Array.from(trucks.values()).filter(
    (t) => t.status !== "offline",
  ).length;

  const handleViewTruck = (truckId: string) => {
    setSelectedTruckId(truckId);
  };

  const handleBack = () => {
    setSelectedTruckId(null);
    setActiveTab("fleet");
  };

  if (selectedTruckId) {
    return <TruckDetailPage truckId={selectedTruckId} onBack={handleBack} />;
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-background overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        alertCount={alertCount}
        onlineCount={onlineCount}
      />
      <main className="flex-1 min-w-0 overflow-hidden">
        {activeTab === "dashboard" && <OverviewDashboard />}
        {activeTab === "map" && <LiveMap onViewTruck={handleViewTruck} />}
        {activeTab === "fleet" && <FleetDashboard onViewTruck={handleViewTruck} />}
        {activeTab === "analytics" && <OverviewDashboard />}
        {activeTab === "energy" && <OverviewDashboard />}
        {activeTab === "alerts" && <OverviewDashboard />}
      </main>
    </div>
  );
}
