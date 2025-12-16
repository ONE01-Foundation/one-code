/**
 * Global View - Live Mirror
 * 
 * Shows aggregated, anonymous global state
 * Read-only, no social mechanics
 */

"use client";

import { GlobalSnapshot, GlobalPulseItem, GlobalNeedBucket, GlobalOfferBucket, GlobalMission } from "@/lib/global-types";
import { UILang } from "@/lib/lang";
import { t } from "@/lib/ui-text";

interface GlobalViewProps {
  snapshot: GlobalSnapshot;
  onBringToPrivate: (item: GlobalNeedBucket | GlobalOfferBucket | GlobalMission) => void;
  uiLang?: UILang;
}

export function GlobalView({ snapshot, onBringToPrivate, uiLang = "en" }: GlobalViewProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-8 py-12">
      {/* Pulse Section */}
      {snapshot.pulse.length > 0 && (
        <div className="space-y-4">
          <h2
            className="text-lg font-normal opacity-60"
            style={{ color: "var(--foreground)" }}
          >
            Pulse
          </h2>
          <div className="space-y-2">
            {snapshot.pulse.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: "var(--neutral-100)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <span
                    className="text-base font-normal"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.title}
                  </span>
                  {item.delta !== undefined && item.delta > 0 && (
                    <span className="text-xs opacity-50" style={{ color: "var(--foreground)" }}>
                      ↗
                    </span>
                  )}
                </div>
                <div
                  className="text-sm opacity-60"
                  style={{ color: "var(--foreground)" }}
                >
                  {item.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs & Offers Section */}
      {(snapshot.needs.length > 0 || snapshot.offers.length > 0) && (
        <div className="space-y-4">
          <h2
            className="text-lg font-normal opacity-60"
            style={{ color: "var(--foreground)" }}
          >
            Needs & Offers
          </h2>

          {/* Needs */}
          {snapshot.needs.length > 0 && (
            <div className="space-y-2">
              <div
                className="text-sm opacity-50 mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Needs
              </div>
              {snapshot.needs.map((need) => (
                <div
                  key={need.id}
                  className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: "var(--neutral-100)",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => onBringToPrivate(need)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-base font-normal"
                      style={{ color: "var(--foreground)" }}
                    >
                      {need.label}
                    </span>
                    <span
                      className="text-xs opacity-60"
                      style={{ color: "var(--foreground)" }}
                    >
                      {need.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Offers */}
          {snapshot.offers.length > 0 && (
            <div className="space-y-2 mt-4">
              <div
                className="text-sm opacity-50 mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Offers
              </div>
              {snapshot.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: "var(--neutral-100)",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => onBringToPrivate(offer)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-base font-normal"
                      style={{ color: "var(--foreground)" }}
                    >
                      {offer.label}
                    </span>
                    <span
                      className="text-xs opacity-60"
                      style={{ color: "var(--foreground)" }}
                    >
                      {offer.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missions Section */}
      {snapshot.missions.length > 0 && (
        <div className="space-y-4">
          <h2
            className="text-lg font-normal opacity-60"
            style={{ color: "var(--foreground)" }}
          >
            Missions
          </h2>
          <div className="space-y-3">
            {snapshot.missions.map((mission) => (
              <div
                key={mission.id}
                className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: "var(--neutral-100)",
                  border: "2px solid var(--border)",
                }}
                onClick={() => onBringToPrivate(mission)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3
                      className="text-base font-normal"
                      style={{ color: "var(--foreground)" }}
                    >
                      {mission.title}
                    </h3>
                    <span
                      className="text-xs opacity-50"
                      style={{ color: "var(--foreground)" }}
                    >
                      {mission.estimatedMinutes} min
                    </span>
                  </div>
                  <p
                    className="text-sm opacity-70"
                    style={{ color: "var(--foreground)" }}
                  >
                    {mission.why}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs opacity-50"
                      style={{ color: "var(--foreground)" }}
                    >
                      {mission.participantCount} people
                    </span>
                    <span
                      className="text-xs opacity-50"
                      style={{ color: "var(--foreground)" }}
                    >
                      {mission.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {snapshot.pulse.length === 0 &&
        snapshot.needs.length === 0 &&
        snapshot.offers.length === 0 &&
        snapshot.missions.length === 0 && (
          <div className="text-center py-12">
            <p
              className="text-base opacity-60"
              style={{ color: "var(--foreground)" }}
            >
              {t(uiLang, "globalViewOnly")}
            </p>
          </div>
        )}
    </div>
  );
}

