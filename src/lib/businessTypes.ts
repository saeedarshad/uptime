import type { BusinessType } from "@prisma/client";

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "auto", label: "Auto shop" },
  { value: "machine_shop", label: "Machine shop" },
  { value: "gym", label: "Gym / fitness" },
  { value: "contractor", label: "Contractor" },
  { value: "other", label: "Other" },
];

// Symptom chips shown on the public report-a-problem flow, seeded per business
// type at org creation and editable later in Settings.
const CHIPS: Record<BusinessType, string[]> = {
  auto: [
    "Won't start",
    "Leaking",
    "Strange noise",
    "Overheating",
    "Low pressure",
    "Won't lift / lower",
    "Warning light",
    "Damaged",
  ],
  machine_shop: [
    "Won't power on",
    "Out of calibration",
    "Overheating",
    "Unusual vibration",
    "Coolant leak",
    "Error code",
    "Belt / drive issue",
    "Damaged",
  ],
  gym: [
    "Won't turn on",
    "Grinding / squeaking",
    "Cable / belt frayed",
    "Display broken",
    "Loose / wobbly",
    "Stuck resistance",
    "Torn upholstery",
    "Damaged",
  ],
  contractor: [
    "Won't start",
    "Low power",
    "Hydraulic leak",
    "Overheating",
    "Flat / damaged tire",
    "Warning light",
    "Broken attachment",
    "Damaged",
  ],
  other: [
    "Won't turn on",
    "Leaking",
    "Strange noise",
    "Overheating",
    "Error / warning",
    "Physical damage",
  ],
};

export function defaultSymptomChips(type: BusinessType): string[] {
  return CHIPS[type];
}
