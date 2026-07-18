import type { BusinessType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Marketing case studies — customer stories by trade.
// ---------------------------------------------------------------------------

export type Metric = { label: string; value: string; sub: string };

export type CaseStudy = {
  slug: string;
  type: BusinessType;
  /** Short industry label, e.g. "Auto shop". */
  industry: string;
  emoji: string;
  /** One-line hook for the landing-page card. */
  cardStat: string;
  /** A concrete "map it to your business" line for the landing page. */
  mapLine: string;
  business: { name: string; profile: string };
  headline: string;
  subhead: string;
  /** The "before" story — a few short paragraphs. */
  challenge: string[];
  /** Equipment they tag with QR labels. */
  assets: { name: string; note: string }[];
  /** How they actually use UptimeHQ day to day. */
  workflow: { title: string; body: string }[];
  /** Headline results shown as big stat cards. */
  results: Metric[];
  /** Before/after rows for the savings breakdown table. */
  breakdown: { label: string; before: string; after: string }[];
  /** An owner quote. */
  quote: { text: string; who: string };
  /** Sample insight line rendered in the mock dashboard. */
  insight: string;
  /** Three mini KPI cards rendered under the insight in the mock dashboard. */
  dashKpis: { label: string; value: string }[];
  /** Six bar heights (0–100) for the mock "monthly spend" chart. */
  spendBars: number[];
  /** What a tech taps on the phone scan flow (mock). */
  scan: { asset: string; symptom: string };
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "auto-shop",
    type: "auto",
    industry: "Auto shop",
    emoji: "🔧",
    cardStat: "$18,400/yr saved · 63% less unplanned downtime",
    mapLine:
      "A tech scans the lift that jammed → you see it's failed 4× this quarter → you fix the root cause before it strands another car.",
    business: {
      name: "Kessler Automotive",
      profile: "5-bay independent repair shop · 6 techs · one location",
    },
    headline: "The lift that kept costing a bay a day",
    subhead:
      "How a 5-bay shop stopped losing billable hours to surprise equipment failures — and finally found out which machine was the real culprit.",
    challenge: [
      "Kessler runs five bays flat out. When a vehicle lift or the tire machine went down, a car sat half-finished, a tech stood idle, and the owner ate the lost labor — often without ever pricing what it cost.",
      "Preventive service on the lifts and air compressor lived on a whiteboard that nobody updated. Two lifts had quietly drifted a year past their annual inspection.",
      "Worst of all, nobody could say which machine was the money pit. It felt like Lift #2 was always the problem, but there was no record to prove it or justify replacing it.",
    ],
    assets: [
      { name: "Vehicle lifts (×5)", note: "Two-post and drive-on" },
      { name: "Tire changer & balancer", note: "High-cycle, wears fast" },
      { name: "Alignment rack", note: "Revenue-critical" },
      { name: "A/C recovery machine", note: "Seasonal peaks" },
      { name: "Shop air compressor", note: "Everything depends on it" },
      { name: "Diagnostic scanners", note: "Calibration matters" },
    ],
    workflow: [
      {
        title: "Every machine wears a QR label",
        body: "The morning of go-live they printed labels from the dashboard and stuck one on each lift, the tire machine, the compressor and the alignment rack. Two minutes each.",
      },
      {
        title: "Techs report from their phone",
        body: "When Lift #2 started drifting, the tech scanned the label and tapped “Won't lift / lower.” No login, no app — a work order appeared on the owner's dashboard in seconds.",
      },
      {
        title: "PM reminders replace the whiteboard",
        body: "Annual lift inspections and 90-day compressor service are now time-based PMs. The shop gets a reminder before each is due, so nothing drifts past inspection again.",
      },
      {
        title: "Insights name the culprit",
        body: "Within a month the dashboard flagged Lift #2 as costing 11× the shop average. That single line justified a replacement the owner had been putting off for a year.",
      },
    ],
    results: [
      { label: "Saved per year", value: "$18,400", sub: "Repairs + recovered billable hours" },
      { label: "Less unplanned downtime", value: "63%", sub: "Fewer surprise breakdowns" },
      { label: "Admin time saved", value: "9 hrs/wk", sub: "No more whiteboard chasing" },
      { label: "PM compliance", value: "48% → 94%", sub: "Inspections no longer slip" },
    ],
    breakdown: [
      { label: "Unplanned equipment downtime", before: "~41 hrs / quarter", after: "~15 hrs / quarter" },
      { label: "Billable hours lost to breakdowns", before: "$1,900 / month", after: "$700 / month" },
      { label: "Overdue safety inspections", before: "2 lifts", after: "0" },
      { label: "Time spent tracking maintenance", before: "9 hrs / week", after: "< 1 hr / week" },
    ],
    quote: {
      text: "I always blamed Lift #2 and I was right — but I could never prove it until the dashboard put a dollar figure on it. Replacing it paid for itself in a season.",
      who: "Owner, Kessler Automotive",
    },
    insight: "Vehicle Lift #2 has cost $2,340 in 90 days — 11× your shop average.",
    dashKpis: [
      { label: "Downtime", value: "15 hrs" },
      { label: "Spend (90d)", value: "$3,345" },
      { label: "PM compliance", value: "94%" },
    ],
    spendBars: [42, 58, 50, 74, 90, 46],
    scan: { asset: "Vehicle Lift #2", symptom: "Won't lift / lower" },
  },
  {
    slug: "machine-shop",
    type: "machine_shop",
    industry: "Machine shop",
    emoji: "⚙️",
    cardStat: "$31,000/yr saved · calibration compliance 61% → 100%",
    mapLine:
      "Your CMM's calibration is about to lapse → UptimeHQ warns you 9 days out → you never ship a part measured on an out-of-cal gauge again.",
    business: {
      name: "Ardent Precision",
      profile: "CNC job shop · 14 machines · AS9100-minded",
    },
    headline: "Scrapped parts and a failed audit — both avoidable",
    subhead:
      "A precision job shop tied every scrapped run and near-miss audit back to two things it wasn't tracking: calibration and coolant.",
    challenge: [
      "Ardent runs tight-tolerance aerospace and medical work. A micrometer or CMM that drifts out of calibration doesn't fail loudly — it quietly greenlights parts that later scrap, sometimes a whole run.",
      "Calibration due-dates lived in a spreadsheet one person maintained. When they were out, dates lapsed. A customer audit nearly failed on an expired CMM certificate.",
      "Coolant changes and spindle warm-up PMs were tribal knowledge. A neglected coolant system took a grinder down for three days during a rush.",
    ],
    assets: [
      { name: "CNC mills & lathes (×8)", note: "Spindle-hour tracked" },
      { name: "Surface grinders", note: "Coolant-sensitive" },
      { name: "CMM", note: "Calibration-critical" },
      { name: "Micrometers & gauges", note: "Cert expiry matters" },
      { name: "Coolant systems", note: "Scheduled changes" },
      { name: "Shop air compressor", note: "Feeds every machine" },
    ],
    workflow: [
      {
        title: "Gauges and machines get labeled",
        body: "Every CNC, the CMM and each calibrated instrument got a QR label tied to its record — including manuals and calibration certificates stored right on the asset.",
      },
      {
        title: "Meter-based PM on spindle hours",
        body: "Spindle warm-up and lubrication PMs trigger on meter readings techs log by scanning, not on a guessed calendar — so service matches actual use.",
      },
      {
        title: "Calibration never lapses silently",
        body: "Each gauge's certificate expiry is tracked. UptimeHQ warns the quality lead well before a due-date — and flags open jobs that depend on that instrument.",
      },
      {
        title: "Audit-ready in minutes",
        body: "When the customer auditor came back, the quality lead exported each machine's full service and calibration history to PDF on the spot.",
      },
    ],
    results: [
      { label: "Saved per year", value: "$31,000", sub: "Avoided scrap + recovered machine time" },
      { label: "Calibration compliance", value: "61% → 100%", sub: "No expired certs in production" },
      { label: "Less unplanned downtime", value: "58%", sub: "Coolant & spindle PMs on schedule" },
      { label: "Audit prep time", value: "2 days → 20 min", sub: "History exports on demand" },
    ],
    breakdown: [
      { label: "Scrapped runs from out-of-cal gauges", before: "~4 / year", after: "0" },
      { label: "Unplanned machine downtime", before: "~90 hrs / year", after: "~38 hrs / year" },
      { label: "Expired calibration certs", before: "3 at any time", after: "0" },
      { label: "Audit preparation", before: "~2 days", after: "~20 min" },
    ],
    quote: {
      text: "We didn't have a maintenance problem, we had a memory problem. Once the certs and coolant changes reminded us instead of the other way around, the scrap just stopped.",
      who: "Quality lead, Ardent Precision",
    },
    insight: "CMM calibration expires in 9 days — 3 open jobs depend on it.",
    dashKpis: [
      { label: "Downtime", value: "38 hrs/yr" },
      { label: "Cal. compliance", value: "100%" },
      { label: "Open PMs", value: "2" },
    ],
    spendBars: [30, 44, 38, 62, 55, 40],
    scan: { asset: "Haas VF-2 (Mill #4)", symptom: "Out of calibration" },
  },
  {
    slug: "gym",
    type: "gym",
    industry: "Gym / fitness",
    emoji: "🏋️",
    cardStat: "$12,600/yr saved · member complaints down 71%",
    mapLine:
      "A member reports a dead treadmill by scanning it themselves → staff see the pattern → you swap the belt before it becomes a one-star review.",
    business: {
      name: "Ironline Fitness",
      profile: "Two-location gym · 120+ cardio & strength machines",
    },
    challenge: [
      "At Ironline, a broken treadmill isn't a maintenance ticket — it's a member experience problem. An out-of-order sign on peak-hour equipment is the fastest way to a cancellation.",
      "Staff at the front desk heard about broken machines by word of mouth, wrote them on sticky notes, and half of them never reached the one person who could fix them.",
      "Warranty windows on newer cardio equipment were being missed because nobody logged when a machine was installed or first serviced.",
    ],
    headline: "Broken machines were quietly churning members",
    subhead:
      "A two-location gym turned equipment issues from front-desk gossip into a tracked, prioritized queue — and stopped the complaints before they became cancellations.",
    assets: [
      { name: "Treadmills (×20)", note: "Highest failure rate" },
      { name: "Ellipticals & bikes", note: "Belt & console wear" },
      { name: "Cable machines", note: "Frayed cables = safety" },
      { name: "Rowers", note: "Chain & damper service" },
      { name: "Spin studio bikes", note: "Class-critical" },
      { name: "HVAC / air handling", note: "Comfort = retention" },
    ],
    workflow: [
      {
        title: "Members can report it themselves",
        body: "A small QR sticker on each machine lets a member — or a staffer walking the floor — report “Won't turn on” or “Grinding” in seconds, without finding anyone.",
      },
      {
        title: "One prioritized queue, both locations",
        body: "Every report lands in a single work-order list. The maintenance tech sees what's down, where, and how long it's been out — no more sticky notes.",
      },
      {
        title: "Recurring failures get flagged",
        body: "When Treadmill #7 was reported four times in a month, UptimeHQ surfaced the pattern so staff replaced the belt instead of resetting the breaker again.",
      },
      {
        title: "PMs keep the fleet quiet",
        body: "Belt lubrication, cable inspection and HVAC filter changes run on schedule, so peak-hour breakdowns became the exception, not the norm.",
      },
    ],
    results: [
      { label: "Saved per year", value: "$12,600", sub: "Warranty recovery + fewer emergencies" },
      { label: "Member complaints", value: "−71%", sub: "About broken equipment" },
      { label: "Faster fix turnaround", value: "3.1 days → 14 hrs", sub: "From report to resolved" },
      { label: "PM compliance", value: "40% → 92%", sub: "Fleet stays serviced" },
    ],
    breakdown: [
      { label: "Avg. time a machine sits broken", before: "~3.1 days", after: "~14 hrs" },
      { label: "Monthly equipment complaints", before: "~24", after: "~7" },
      { label: "Missed warranty claims", before: "~5 / year", after: "0" },
      { label: "Reports lost before reaching a tech", before: "~half", after: "0" },
    ],
    quote: {
      text: "Members forgive a broken treadmill. They don't forgive the same one being broken for a week. Now it's a two-tap report and I can see it before I even get a complaint.",
      who: "Operations manager, Ironline Fitness",
    },
    insight: "Treadmill #7 reported 4× this month — belt wear pattern, schedule a replacement.",
    dashKpis: [
      { label: "Open issues", value: "3" },
      { label: "Avg. fix time", value: "14 hrs" },
      { label: "PM compliance", value: "92%" },
    ],
    spendBars: [28, 36, 30, 48, 40, 34],
    scan: { asset: "Treadmill #7 (Cardio floor)", symptom: "Grinding / squeaking" },
  },
  {
    slug: "contractor",
    type: "contractor",
    industry: "Contractor / equipment fleet",
    emoji: "🚜",
    cardStat: "$27,500/yr saved · jobsite delays down 55%",
    mapLine:
      "A generator leaks hydraulic fluid again → the field crew scans it on-site → you see it's the third leak in 60 days and pull it before it strands a crew.",
    business: {
      name: "Halstead Site Works",
      profile: "Excavation & site contractor · mixed equipment fleet",
    },
    headline: "When a machine dies on site, the whole crew waits",
    subhead:
      "A site contractor priced what a broken machine really costs — idle crew, blown schedule, rush repairs — and cut it by tracking service history in the field.",
    challenge: [
      "For Halstead, downtime isn't one machine sitting idle — it's a four-person crew standing around a dead skid steer at $65/hour each, plus a schedule that slips into the next job.",
      "Equipment moved between sites with no service history following it. The same hydraulic leak got “fixed” three times because nobody knew it was recurring.",
      "Preventive service — filters, greasing, hydraulic checks — happened whenever someone remembered, which on a busy season meant rarely.",
    ],
    assets: [
      { name: "Skid steers & excavators", note: "Hydraulics fail hard" },
      { name: "Generators", note: "Job-critical power" },
      { name: "Compactors & rollers", note: "High vibration wear" },
      { name: "Light towers", note: "Runtime-tracked" },
      { name: "Air compressors", note: "Tool supply" },
      { name: "Fleet trucks", note: "DOT compliance" },
    ],
    workflow: [
      {
        title: "History follows the machine, not the site",
        body: "Each machine's QR label ties to one record no matter which job it's on. Scan it and the full repair history is right there in the field.",
      },
      {
        title: "Field crews report without a login",
        body: "When the generator leaked again, the operator scanned it and tapped “Hydraulic leak.” The office saw it immediately — and saw it wasn't the first time.",
      },
      {
        title: "Meter-based service on runtime",
        body: "Greasing, filter and hydraulic PMs trigger on logged engine hours, so a machine that worked doubles gets serviced twice as often — automatically.",
      },
      {
        title: "Downtime gets a dollar figure",
        body: "By pricing idle-crew time against their labor rate, the owner could finally justify retiring a machine that looked cheap to keep but was quietly bleeding the schedule.",
      },
    ],
    results: [
      { label: "Saved per year", value: "$27,500", sub: "Idle-crew hours + avoided rush repairs" },
      { label: "Jobsite delays from breakdowns", value: "−55%", sub: "Fewer schedule slips" },
      { label: "Admin time saved", value: "10 hrs/wk", sub: "No more history hunting" },
      { label: "PM compliance", value: "44% → 90%", sub: "Runtime-based service" },
    ],
    breakdown: [
      { label: "Idle-crew hours from breakdowns", before: "~30 hrs / month", after: "~13 hrs / month" },
      { label: "Repeat repairs on same fault", before: "common", after: "rare" },
      { label: "Emergency / rush repair spend", before: "~$1,600 / month", after: "~$600 / month" },
      { label: "Machines with no service history", before: "most", after: "0" },
    ],
    quote: {
      text: "A machine that breaks doesn't just cost the repair — it costs four guys standing around and a job that runs long. Once I could see that number, the decisions made themselves.",
      who: "Owner, Halstead Site Works",
    },
    insight: "Generator #3: 3 hydraulic leaks in 60 days — $4,100 and climbing. Consider retiring.",
    dashKpis: [
      { label: "Idle-crew hrs", value: "13/mo" },
      { label: "Rush spend", value: "$600" },
      { label: "PM compliance", value: "90%" },
    ],
    spendBars: [40, 52, 46, 70, 60, 48],
    scan: { asset: "Generator #3 (Site B)", symptom: "Hydraulic leak" },
  },
  {
    slug: "restaurant-cafe",
    type: "restaurant",
    industry: "Restaurant / cafe",
    emoji: "☕",
    cardStat: "$21,300/yr saved · equipment downtime down 60%",
    mapLine:
      "The walk-in cooler is trending warm → staff scan it the moment it feels off → you catch the failing compressor before it spoils a weekend's inventory.",
    business: {
      name: "Marlowe & Finch Café",
      profile: "Two-location café & kitchen · full back-of-house equipment",
    },
    headline: "A walk-in cooler failed overnight — once",
    subhead:
      "A two-location café stopped losing inventory to overnight equipment failures and lost sales to dead espresso machines by catching problems early.",
    challenge: [
      "The night the walk-in cooler quit, Marlowe & Finch lost a full weekend's inventory before anyone noticed at open — and had no record showing the compressor had been struggling for weeks.",
      "When the espresso machine goes down during the morning rush, it's not a repair bill — it's the highest-margin hour of the day walking out the door.",
      "Hood cleaning, filter changes and cooler temperature checks were somebody's job in theory, but nothing reminded anyone, and health-code logs were a scramble before inspections.",
    ],
    assets: [
      { name: "Walk-in cooler & freezer", note: "Inventory-critical" },
      { name: "Espresso machines", note: "Revenue-critical" },
      { name: "Ovens & ranges", note: "Service-critical" },
      { name: "Dishwasher", note: "Chemical & temp checks" },
      { name: "Ice machine", note: "Scale & sanitation" },
      { name: "Hood & exhaust", note: "Health-code compliance" },
    ],
    workflow: [
      {
        title: "Back-of-house gets labeled",
        body: "Every cooler, the espresso machines, ovens, dishwasher and ice machine got a QR label. Staff can report an issue the moment something feels off — no manager needed.",
      },
      {
        title: "Early warning beats spoilage",
        body: "When the walk-in started running warm, a barista scanned it and tapped “Not cooling / warm.” Repeated reports surfaced the failing compressor before it quit for good.",
      },
      {
        title: "Cleaning & checks run on schedule",
        body: "Hood cleaning, filter changes, cooler temp logs and descaling are recurring PMs with reminders — so health-code tasks stop depending on memory.",
      },
      {
        title: "Inspection logs are always ready",
        body: "Each piece of equipment carries its full service history, so pulling records for a health inspection takes minutes, not a frantic morning.",
      },
    ],
    results: [
      { label: "Saved per year", value: "$21,300", sub: "Avoided spoilage + lost sales + repairs" },
      { label: "Less equipment downtime", value: "60%", sub: "Problems caught early" },
      { label: "Admin time saved", value: "7 hrs/wk", sub: "Logs & scheduling automated" },
      { label: "PM compliance", value: "35% → 93%", sub: "Cleaning & checks on time" },
    ],
    breakdown: [
      { label: "Inventory lost to cooler failures", before: "~$3,200 / year", after: "~$400 / year" },
      { label: "Espresso/rush hours lost to downtime", before: "~18 hrs / year", after: "~6 hrs / year" },
      { label: "Health-code prep time", before: "~half a day", after: "~15 min" },
      { label: "Overdue hood/filter cleaning", before: "routine", after: "0" },
    ],
    quote: {
      text: "Losing a walk-in overnight is the kind of mistake you only want to make once. Now the cooler basically tells us it's getting tired before it actually gives up.",
      who: "Owner, Marlowe & Finch Café",
    },
    insight: "Walk-in Cooler #1: temp-related reports 5× in 30 days — compressor trending to failure.",
    dashKpis: [
      { label: "Downtime", value: "6 hrs/yr" },
      { label: "Spoilage (yr)", value: "$400" },
      { label: "PM compliance", value: "93%" },
    ],
    spendBars: [26, 34, 30, 44, 38, 32],
    scan: { asset: "Walk-in Cooler #1", symptom: "Not cooling / warm" },
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}
