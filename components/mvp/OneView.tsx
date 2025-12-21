/**
 * OneView MVP - Main component
 */

"use client";

import { useEffect } from "react";
import { useMVPStore } from "@/lib/mvp/store";
import { SphereCanvas } from "./SphereCanvas";
import { CardsList } from "./CardsList";
import { MomentPreviewModal } from "./MomentPreviewModal";

export function OneView() {
  const store = useMVPStore();
  const { initialize, viewMode } = store;

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      {viewMode === "cards" ? <CardsList /> : <SphereCanvas />}
      <MomentPreviewModal />
    </>
  );
}

