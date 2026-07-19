import type { BusinessType, Priority, WorkOrderStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Demo clients — one seeded org per business type, created on production/staging
// startup (see src/lib/seedDemos.ts + instrumentation.ts). Each org is a
// fully-populated sales-demo account you can log into as
//   demo<slug>@uptimehq.app  /  demo<slug><PASSWORD_SUFFIX>
// e.g. demorestaurant@uptimehq.app / demorestaurant4213.
//
// The data here is PURE (no DB). The six asset "roles" below map onto a fixed
// timing/cost template (WO_TEMPLATE / the PM plan in seedDemos) that is tuned so
// the insight rules R1–R7 fire, matching the hand-tuned local seed. Each profile
// only supplies industry-specific names, symptoms and copy.
// ---------------------------------------------------------------------------

/** $60/hr in cents — demo orgs bill labor at the same rate as the local seed. */
export const DEMO_LABOR_RATE = 6000;

/** Appended to every demo password: demo<slug><SUFFIX>. */
export const DEMO_PASSWORD_SUFFIX = "4213";

/** The six asset slots every profile fills; drives the shared WO/PM template. */
export type AssetRole =
  | "moneyPit" // the costliest asset — fires repair-vs-replace + downtime hotspot
  | "repeat" // three faults in 180d — fires repeat-failure
  | "assetA" // carries the overdue PM
  | "assetB" // carries the due-this-week PM
  | "assetC" // carries the one currently-open work order
  | "compliance"; // meter-tracked + expiring certificate

export interface DemoAssetDef {
  name: string;
  category: string;
  location: string;
  costCents: number;
}

/** Industry-specific title/symptom for one slot of WO_TEMPLATE. */
export interface DemoWoCopy {
  title: string;
  symptom?: string;
}

export interface DemoProfile {
  type: BusinessType;
  /** Credential + URL slug: demo<slug>@uptimehq.app. */
  slug: string;
  orgName: string;
  /** Unique Organization.slug. */
  orgSlug: string;
  city: string;
  timezone: string;
  owner: { name: string };
  tech: { name: string };
  assets: Record<AssetRole, DemoAssetDef>;
  /** Whether the compliance asset is safety/DOT tracked (isComplianceTracked). */
  complianceTracked: boolean;
  /** One title/symptom per WO_TEMPLATE slot, in order (length must match). */
  workOrders: DemoWoCopy[];
  /** PM task names for the four scheduled maintenance jobs. */
  pm: {
    overdue: { taskName: string; instructions: string };
    dueSoon: { taskName: string };
    meter: {
      taskName: string;
      unitLabel: string;
      intervalUnits: number;
      lastCompletedMeter: number;
      dueMeter: number;
      /** Meter readings on the compliance asset, newest last. */
      readings: { daysAgo: number; value: number }[];
    };
    cert: { taskName: string; notes: string };
  };
  /** Title of the certificate document that expires within 30 days. */
  certDocTitle: string;
  /** Three activity-feed lines: [tech report, tech close, owner add-asset]. */
  activity: { verb: string; subject: string; daysAgo: number; actor: "owner" | "tech" }[];
}

/**
 * Fixed work-order timing/cost template. Each profile supplies the copy for the
 * matching slot in `workOrders`. Numbers mirror the tuned local seed so the same
 * insight rules fire: `role: "moneyPit"` accumulates 5 recent repairs + most of
 * the org's downtime; `role: "repeat"` logs 3 faults inside 180 days.
 */
export const WO_TEMPLATE: {
  role: AssetRole;
  openedDaysAgo: number;
  parts: number;
  laborHours: number;
  downtime: number;
  status?: WorkOrderStatus;
  priority?: Priority;
}[] = [
  { role: "moneyPit", openedDaysAgo: 8, parts: 34000, laborHours: 1.0, downtime: 5, priority: "high" },
  { role: "moneyPit", openedDaysAgo: 20, parts: 46000, laborHours: 1.5, downtime: 8, priority: "high" },
  { role: "moneyPit", openedDaysAgo: 30, parts: 39000, laborHours: 1.0, downtime: 6 },
  { role: "moneyPit", openedDaysAgo: 55, parts: 40000, laborHours: 1.0, downtime: 7 },
  { role: "moneyPit", openedDaysAgo: 82, parts: 42000, laborHours: 1.0, downtime: 5, priority: "high" },
  { role: "moneyPit", openedDaysAgo: 200, parts: 24000, laborHours: 1.0, downtime: 3 },

  { role: "repeat", openedDaysAgo: 28, parts: 15000, laborHours: 1.0, downtime: 2 },
  { role: "repeat", openedDaysAgo: 88, parts: 12000, laborHours: 1.0, downtime: 2 },
  { role: "repeat", openedDaysAgo: 150, parts: 18000, laborHours: 1.5, downtime: 3 },

  { role: "assetA", openedDaysAgo: 40, parts: 21000, laborHours: 1.0, downtime: 3 },
  { role: "assetA", openedDaysAgo: 130, parts: 6000, laborHours: 0.5, downtime: 1 },

  { role: "assetB", openedDaysAgo: 60, parts: 7500, laborHours: 1.0, downtime: 1 },
  { role: "assetB", openedDaysAgo: 160, parts: 8000, laborHours: 1.0, downtime: 2 },

  { role: "assetC", openedDaysAgo: 70, parts: 8000, laborHours: 1.0, downtime: 2 },
  { role: "assetC", openedDaysAgo: 210, parts: 5000, laborHours: 0.5, downtime: 1 },

  { role: "compliance", openedDaysAgo: 220, parts: 30000, laborHours: 2.0, downtime: 0 },
  { role: "compliance", openedDaysAgo: 120, parts: 8000, laborHours: 0.75, downtime: 0 },
  { role: "compliance", openedDaysAgo: 35, parts: 4000, laborHours: 0.5, downtime: 0 },

  // The single currently-open issue (drives "open work orders" + down status).
  { role: "assetC", openedDaysAgo: 3, parts: 0, laborHours: 0, downtime: 0, status: "open", priority: "high" },
];

/** Login credentials for a demo profile. */
export function demoCredentials(slug: string): { email: string; password: string } {
  return {
    email: `demo${slug}@uptimehq.app`,
    password: `demo${slug}${DEMO_PASSWORD_SUFFIX}`,
  };
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    type: "auto",
    slug: "auto",
    orgName: "Kessler Automotive (Demo)",
    orgSlug: "demo-auto-kessler",
    city: "Broken Arrow, OK",
    timezone: "America/Chicago",
    owner: { name: "Dale Kessler" },
    tech: { name: "Marcus Reed" },
    complianceTracked: true,
    assets: {
      moneyPit: { name: "Vehicle Lift #2", category: "Lift", location: "Bay 2", costCents: 480000 },
      repeat: { name: "A/C Recovery Machine", category: "HVAC", location: "Bay 3", costCents: 280000 },
      assetA: { name: "Vehicle Lift #1", category: "Lift", location: "Bay 1", costCents: 480000 },
      assetB: { name: "80-gal Air Compressor", category: "Compressor", location: "Utility room", costCents: 210000 },
      assetC: { name: "Tire Balancer", category: "Tire equipment", location: "Bay 3", costCents: 350000 },
      compliance: { name: "Shop Truck F-250", category: "Vehicle", location: "Lot", costCents: 4200000 },
    },
    workOrders: [
      { title: "Hydraulic cylinder reseal", symptom: "Leaking" },
      { title: "Replace hydraulic hose", symptom: "Leaking" },
      { title: "Lock latch stuck", symptom: "Won't lift / lower" },
      { title: "Arm restraint gear worn", symptom: "Strange noise" },
      { title: "Pump motor overheating", symptom: "Overheating" },
      { title: "Annual safety recert", symptom: undefined },
      { title: "Low recovery pressure", symptom: "Low pressure" },
      { title: "Pressure sensor drift", symptom: "Low pressure" },
      { title: "Compressor pressure fault", symptom: "Warning light" },
      { title: "Replace cable pulley", symptom: "Strange noise" },
      { title: "Fluid top-off", symptom: undefined },
      { title: "Drain valve replacement", symptom: "Leaking" },
      { title: "Pressure switch swap", symptom: "Won't start" },
      { title: "Calibration off", symptom: "Warning light" },
      { title: "Display flicker", symptom: "Damaged" },
      { title: "Brake inspection & pads", symptom: undefined },
      { title: "Oil & filter change", symptom: undefined },
      { title: "Tire rotation", symptom: undefined },
      { title: "Wheel clamp won't grip", symptom: "Damaged" },
    ],
    pm: {
      overdue: {
        taskName: "Hydraulic fluid & safety check",
        instructions: "Check fluid level, inspect cables, test safety locks.",
      },
      dueSoon: { taskName: "Drain tank & replace inline filter" },
      meter: {
        taskName: "Oil change",
        unitLabel: "miles",
        intervalUnits: 5000,
        lastCompletedMeter: 105000,
        dueMeter: 110000,
        readings: [
          { daysAgo: 120, value: 105000 },
          { daysAgo: 60, value: 107800 },
          { daysAgo: 20, value: 109400 },
          { daysAgo: 2, value: 109950 },
        ],
      },
      cert: { taskName: "DOT annual inspection", notes: "Passed. Sticker renewed." },
    },
    certDocTitle: "Annual DOT calibration certificate",
    activity: [
      { verb: "reported a problem on", subject: "Tire Balancer (WO-18)", daysAgo: 3, actor: "tech" },
      { verb: "closed", subject: "WO-1 (5 hrs downtime)", daysAgo: 7, actor: "tech" },
      { verb: "added asset", subject: "Shop Truck F-250", daysAgo: 30, actor: "owner" },
    ],
  },
  {
    type: "machine_shop",
    slug: "machineshop",
    orgName: "Ardent Precision (Demo)",
    orgSlug: "demo-machineshop-ardent",
    city: "Warren, MI",
    timezone: "America/Detroit",
    owner: { name: "Nina Ardent" },
    tech: { name: "Victor Osei" },
    complianceTracked: true,
    assets: {
      moneyPit: { name: "Haas VF-2 (Mill #4)", category: "CNC mill", location: "Cell 4", costCents: 8500000 },
      repeat: { name: "Surface Grinder #1", category: "Grinder", location: "Cell 2", costCents: 1200000 },
      assetA: { name: "CNC Lathe #1", category: "CNC lathe", location: "Cell 1", costCents: 5400000 },
      assetB: { name: "Shop Air Compressor", category: "Compressor", location: "Utility room", costCents: 260000 },
      assetC: { name: "Coolant System", category: "Coolant", location: "Cell 3", costCents: 180000 },
      compliance: { name: "Zeiss CMM", category: "Inspection", location: "QA lab", costCents: 3200000 },
    },
    workOrders: [
      { title: "Spindle bearing replacement", symptom: "Unusual vibration" },
      { title: "Way lube pump failure", symptom: "Error code" },
      { title: "Z-axis servo fault", symptom: "Error code" },
      { title: "Coolant nozzle rebuild", symptom: "Coolant leak" },
      { title: "Spindle overheating", symptom: "Overheating" },
      { title: "Annual accuracy recert", symptom: undefined },
      { title: "Wheel out of balance", symptom: "Unusual vibration" },
      { title: "Coolant contamination", symptom: "Coolant leak" },
      { title: "Grinding wheel drive fault", symptom: "Belt / drive issue" },
      { title: "Turret index error", symptom: "Error code" },
      { title: "Tailstock lube service", symptom: undefined },
      { title: "Pressure switch swap", symptom: "Won't power on" },
      { title: "Drain valve replacement", symptom: "Coolant leak" },
      { title: "Pump seal replacement", symptom: "Coolant leak" },
      { title: "Filter housing crack", symptom: "Damaged" },
      { title: "Full probe recalibration", symptom: undefined },
      { title: "Air bearing service", symptom: undefined },
      { title: "Stylus tip replacement", symptom: undefined },
      { title: "Probe reading erratic", symptom: "Out of calibration" },
    ],
    pm: {
      overdue: {
        taskName: "Way oil & backlash check",
        instructions: "Top up way oil, check ballscrew backlash, inspect chip guards.",
      },
      dueSoon: { taskName: "Drain tank & replace inline filter" },
      meter: {
        taskName: "Spindle lubrication service",
        unitLabel: "spindle hrs",
        intervalUnits: 500,
        lastCompletedMeter: 12000,
        dueMeter: 12500,
        readings: [
          { daysAgo: 120, value: 12000 },
          { daysAgo: 60, value: 12210 },
          { daysAgo: 20, value: 12380 },
          { daysAgo: 2, value: 12455 },
        ],
      },
      cert: { taskName: "Annual calibration certification", notes: "Passed. Certificate on file." },
    },
    certDocTitle: "CMM calibration certificate",
    activity: [
      { verb: "reported a problem on", subject: "Coolant System (WO-18)", daysAgo: 3, actor: "tech" },
      { verb: "closed", subject: "WO-1 (5 hrs downtime)", daysAgo: 7, actor: "tech" },
      { verb: "added asset", subject: "Zeiss CMM", daysAgo: 30, actor: "owner" },
    ],
  },
  {
    type: "gym",
    slug: "gym",
    orgName: "Ironline Fitness (Demo)",
    orgSlug: "demo-gym-ironline",
    city: "Austin, TX",
    timezone: "America/Chicago",
    owner: { name: "Priya Naidu" },
    tech: { name: "Cole Bennett" },
    complianceTracked: false,
    assets: {
      moneyPit: { name: "Treadmill #7", category: "Cardio", location: "Cardio floor", costCents: 750000 },
      repeat: { name: "Cable Crossover #2", category: "Strength", location: "Free-weight area", costCents: 480000 },
      assetA: { name: "Elliptical #3", category: "Cardio", location: "Cardio floor", costCents: 520000 },
      assetB: { name: "Rowing Machine #1", category: "Cardio", location: "Functional zone", costCents: 140000 },
      assetC: { name: "Spin Bike #12", category: "Studio", location: "Spin studio", costCents: 210000 },
      compliance: { name: "HVAC Air Handler", category: "HVAC", location: "Mechanical room", costCents: 1800000 },
    },
    workOrders: [
      { title: "Running belt replacement", symptom: "Grinding / squeaking" },
      { title: "Drive motor overheating", symptom: "Won't turn on" },
      { title: "Incline motor stuck", symptom: "Stuck resistance" },
      { title: "Console display dead", symptom: "Display broken" },
      { title: "Deck cushion worn", symptom: "Loose / wobbly" },
      { title: "Annual belt & deck service", symptom: undefined },
      { title: "Frayed cable replacement", symptom: "Cable / belt frayed" },
      { title: "Pulley bearing noise", symptom: "Grinding / squeaking" },
      { title: "Weight stack pin damaged", symptom: "Damaged" },
      { title: "Pedal strap torn", symptom: "Torn upholstery" },
      { title: "Resistance recalibration", symptom: undefined },
      { title: "Damper handle replacement", symptom: "Stuck resistance" },
      { title: "Chain lubrication service", symptom: "Grinding / squeaking" },
      { title: "Seat post seized", symptom: "Stuck resistance" },
      { title: "Flywheel wobble", symptom: "Loose / wobbly" },
      { title: "Blower belt replacement", symptom: undefined },
      { title: "Filter change", symptom: undefined },
      { title: "Thermostat sensor swap", symptom: undefined },
      { title: "Handrail loose", symptom: "Loose / wobbly" },
    ],
    pm: {
      overdue: {
        taskName: "Belt lubrication & deck check",
        instructions: "Lubricate belt, check deck wear, verify emergency stop.",
      },
      dueSoon: { taskName: "Chain & damper service" },
      meter: {
        taskName: "Filter replacement",
        unitLabel: "run hrs",
        intervalUnits: 1000,
        lastCompletedMeter: 8000,
        dueMeter: 9000,
        readings: [
          { daysAgo: 120, value: 8000 },
          { daysAgo: 60, value: 8420 },
          { daysAgo: 20, value: 8760 },
          { daysAgo: 2, value: 8910 },
        ],
      },
      cert: { taskName: "Annual HVAC inspection", notes: "Passed. Coils cleaned." },
    },
    certDocTitle: "Fire & HVAC compliance certificate",
    activity: [
      { verb: "reported a problem on", subject: "Spin Bike #12 (WO-18)", daysAgo: 3, actor: "tech" },
      { verb: "closed", subject: "WO-1 (5 hrs downtime)", daysAgo: 7, actor: "tech" },
      { verb: "added asset", subject: "HVAC Air Handler", daysAgo: 30, actor: "owner" },
    ],
  },
  {
    type: "contractor",
    slug: "contractor",
    orgName: "Halstead Site Works (Demo)",
    orgSlug: "demo-contractor-halstead",
    city: "Denver, CO",
    timezone: "America/Denver",
    owner: { name: "Ray Halstead" },
    tech: { name: "Diego Fuentes" },
    complianceTracked: true,
    assets: {
      moneyPit: { name: "Generator #3", category: "Generator", location: "Site B", costCents: 1600000 },
      repeat: { name: "Skid Steer #2", category: "Heavy equipment", location: "Site A", costCents: 4800000 },
      assetA: { name: "Excavator #1", category: "Heavy equipment", location: "Site A", costCents: 9500000 },
      assetB: { name: "Air Compressor (tow)", category: "Compressor", location: "Yard", costCents: 320000 },
      assetC: { name: "Light Tower #4", category: "Light tower", location: "Site C", costCents: 180000 },
      compliance: { name: "Fleet Truck F-550", category: "Vehicle", location: "Yard", costCents: 5800000 },
    },
    workOrders: [
      { title: "Hydraulic pump reseal", symptom: "Hydraulic leak" },
      { title: "Fuel injector replacement", symptom: "Low power" },
      { title: "Alternator failure", symptom: "Warning light" },
      { title: "Radiator hose burst", symptom: "Overheating" },
      { title: "Control panel fault", symptom: "Won't start" },
      { title: "Annual load-bank test", symptom: undefined },
      { title: "Boom hydraulic leak", symptom: "Hydraulic leak" },
      { title: "Track tensioner worn", symptom: "Broken attachment" },
      { title: "Coupler won't lock", symptom: "Broken attachment" },
      { title: "Bucket cylinder reseal", symptom: "Hydraulic leak" },
      { title: "Greasing service", symptom: undefined },
      { title: "Drain valve replacement", symptom: "Hydraulic leak" },
      { title: "Pressure regulator swap", symptom: "Low power" },
      { title: "Mast winch jammed", symptom: "Won't lift / lower" },
      { title: "Flat tire replacement", symptom: "Flat / damaged tire" },
      { title: "Brake inspection & pads", symptom: undefined },
      { title: "Oil & filter change", symptom: undefined },
      { title: "DEF sensor swap", symptom: "Warning light" },
      { title: "Ballast won't power on", symptom: "Won't start" },
    ],
    pm: {
      overdue: {
        taskName: "500-hr hydraulic & filter service",
        instructions: "Change hydraulic filters, grease all points, inspect tracks.",
      },
      dueSoon: { taskName: "Drain tank & replace inline filter" },
      meter: {
        taskName: "Engine oil & filter change",
        unitLabel: "engine hrs",
        intervalUnits: 250,
        lastCompletedMeter: 4200,
        dueMeter: 4450,
        readings: [
          { daysAgo: 120, value: 4200 },
          { daysAgo: 60, value: 4300 },
          { daysAgo: 20, value: 4380 },
          { daysAgo: 2, value: 4420 },
        ],
      },
      cert: { taskName: "DOT annual inspection", notes: "Passed. Sticker renewed." },
    },
    certDocTitle: "DOT annual inspection certificate",
    activity: [
      { verb: "reported a problem on", subject: "Light Tower #4 (WO-18)", daysAgo: 3, actor: "tech" },
      { verb: "closed", subject: "WO-1 (5 hrs downtime)", daysAgo: 7, actor: "tech" },
      { verb: "added asset", subject: "Fleet Truck F-550", daysAgo: 30, actor: "owner" },
    ],
  },
  {
    type: "restaurant",
    slug: "restaurant",
    orgName: "Marlowe & Finch Café (Demo)",
    orgSlug: "demo-restaurant-marlowe",
    city: "Portland, OR",
    timezone: "America/Los_Angeles",
    owner: { name: "Elena Marlowe" },
    tech: { name: "Sam Okafor" },
    complianceTracked: true,
    assets: {
      moneyPit: { name: "Walk-in Cooler #1", category: "Refrigeration", location: "Back of house", costCents: 950000 },
      repeat: { name: "Espresso Machine", category: "Beverage", location: "Front bar", costCents: 1400000 },
      assetA: { name: "Convection Oven", category: "Cooking", location: "Kitchen line", costCents: 620000 },
      assetB: { name: "Dishwasher", category: "Warewashing", location: "Dish pit", costCents: 380000 },
      assetC: { name: "Ice Machine", category: "Refrigeration", location: "Back of house", costCents: 210000 },
      compliance: { name: "Hood & Exhaust System", category: "Ventilation", location: "Kitchen line", costCents: 1600000 },
    },
    workOrders: [
      { title: "Compressor replacement", symptom: "Not cooling / warm" },
      { title: "Evaporator fan motor", symptom: "Strange noise" },
      { title: "Door gasket & heater", symptom: "Ice / frost buildup" },
      { title: "Refrigerant recharge", symptom: "Not cooling / warm" },
      { title: "Condenser coil cleaning", symptom: "Not cooling / warm" },
      { title: "Annual refrigeration service", symptom: undefined },
      { title: "Group head rebuild", symptom: "Leaking water" },
      { title: "Steam wand valve fault", symptom: "Not heating" },
      { title: "Boiler element replacement", symptom: "Error code" },
      { title: "Igniter replacement", symptom: "Won't turn on" },
      { title: "Thermostat calibration", symptom: undefined },
      { title: "Drain pump replacement", symptom: "Leaking water" },
      { title: "Wash arm descaling", symptom: "Error code" },
      { title: "Water inlet valve swap", symptom: "Leaking water" },
      { title: "Scale buildup flush", symptom: "Ice / frost buildup" },
      { title: "Full hood degrease & inspection", symptom: undefined },
      { title: "Filter replacement", symptom: undefined },
      { title: "Fan belt replacement", symptom: undefined },
      { title: "Ice bin won't fill", symptom: "Won't turn on" },
    ],
    pm: {
      overdue: {
        taskName: "Coil clean & temp log",
        instructions: "Clean condenser coils, verify holding temp, log reading.",
      },
      dueSoon: { taskName: "Descale & sanitation cycle" },
      meter: {
        taskName: "Filter & descale service",
        unitLabel: "cycles",
        intervalUnits: 2000,
        lastCompletedMeter: 30000,
        dueMeter: 32000,
        readings: [
          { daysAgo: 120, value: 30000 },
          { daysAgo: 60, value: 30900 },
          { daysAgo: 20, value: 31500 },
          { daysAgo: 2, value: 31820 },
        ],
      },
      cert: { taskName: "Hood cleaning & fire cert", notes: "Passed. Certificate posted." },
    },
    certDocTitle: "Hood cleaning & fire suppression certificate",
    activity: [
      { verb: "reported a problem on", subject: "Ice Machine (WO-18)", daysAgo: 3, actor: "tech" },
      { verb: "closed", subject: "WO-1 (5 hrs downtime)", daysAgo: 7, actor: "tech" },
      { verb: "added asset", subject: "Hood & Exhaust System", daysAgo: 30, actor: "owner" },
    ],
  },
];
