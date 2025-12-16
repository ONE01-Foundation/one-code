/**
 * Domain Choice - First Meaningful Step
 * 
 * Simple selection UI for choosing what to move forward
 * 3-5 large options, big tap targets, one selection only
 */

export type DomainOption = "work" | "health" | "mind" | "relationships" | "other";

interface DomainChoiceProps {
  onSelect: (domain: DomainOption) => void;
}

const DOMAIN_OPTIONS: Array<{ id: DomainOption; label: string; icon: string }> = [
  { id: "work", label: "Work / Money", icon: "💼" },
  { id: "health", label: "Health / Body", icon: "❤️" },
  { id: "mind", label: "Mind / Focus", icon: "🧠" },
  { id: "relationships", label: "Relationships", icon: "🤝" },
  { id: "other", label: "Something else", icon: "✨" },
];

export function DomainChoice({ onSelect }: DomainChoiceProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {DOMAIN_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className="w-full px-8 py-6 rounded-lg text-left transition-opacity duration-200 hover:opacity-90"
          style={{
            backgroundColor: "var(--background)",
            border: "2px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{option.icon}</span>
            <span className="text-xl font-medium">{option.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

