/**
 * Drone permission letter to a school.
 * The wording follows OPERATIONS/18_LEGAL_CONSENT/09_Drone_Permission_Letter_to_School.md.
 */
import { addressee, b, dateOf, fill, jove, joveSign, partySign, plain, val } from "../text";
import type { SignTemplate } from "../types";

export const dronePermission: SignTemplate = {
  id: "drone-permission",
  version: "1.0",
  title: "Drone Permission Letter",
  name: "Drone permission",
  group: "school",
  kind: "letter",
  parties: ["school"],
  signs: "both",
  blurb: "Asks the school for written permission to fly a drone during the workshop, with the flight plan and the safety measures.",
  when: "Sent with the agreement; signed by the school before the workshop",
  series: "SCH",
  source: "18_LEGAL_CONSENT/09_Drone_Permission_Letter_to_School.md",
  keep: "Contract term + 8 years",
  requiredForSchools: true,
  lawyer: [
    "Drone Rules, 2021 and the Digital Sky airspace map: confirm what the drone's weight class and the school's location need before every flight.",
    "Most drones need a UIN on Digital Sky, and most flights for a business need a remote pilot certificate; very small (nano) drones may be exempt. Confirm what this drone and this operator need, and fill both boxes, before the letter goes. The letter prints them only when they are filled.",
    "Third-party insurance for the drone may be required by the rules or by the school (29_COMPLIANCE/02). The letter mentions insurance only when the box is filled.",
    "The letter promises that the drone never flies over students or a crowd, as SOP-07 and SOP-13 say. The safeguarding policy (section 6) allows a flight over a crowd above a safe height. The whole-school formation shot must then be taken from the side. Confirm.",
  ],
  fields: [
    { key: "day", label: "Workshop date", kind: "date", from: "workshop.date", required: true, half: true },
    { key: "operator", label: "Drone operator", kind: "text", default: "Chinmay R M", half: true },
    { key: "operatorId", label: "Operator's certificate or registration (if any)", kind: "text", half: true },
    { key: "model", label: "Drone model", kind: "text", required: true, half: true },
    { key: "uin", label: "Digital Sky UIN or ID (if required)", kind: "text", half: true },
    { key: "minutes", label: "Flying time (minutes)", kind: "number", half: true },
    { key: "from", label: "Between (from)", kind: "text", placeholder: "10:30 am", half: true },
    { key: "to", label: "and (to)", kind: "text", placeholder: "11:15 am", half: true },
    { key: "area", label: "Where on the campus", kind: "text", placeholder: "The main ground" },
    { key: "height", label: "Maximum height (metres)", kind: "number", half: true },
    { key: "insurance", label: "Insurance held (optional)", kind: "text", placeholder: "Insurer and policy number", half: true, help: "Left empty, the letter does not mention insurance." },
  ],
  build(ctx) {
    const J = jove(ctx);
    const day = dateOf(ctx, "day");
    const insurance = val(ctx, "insurance");
    return [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: `Request for permission to capture aerial (drone) footage during the ${J} workshop on ${day}` },
      { t: "p", text: "Respected Sir / Madam," },
      {
        t: "p",
        text: `As part of the ${J} Media Pack, our in-house film studio, FrameMind AI Studio, plans to capture short aerial shots of your campus and a whole-school formation shot during the workshop on ${b(day)}. We request your written permission.`,
      },
      { t: "h", text: "Our flight plan" },
      {
        t: "table",
        widths: [26, 74],
        rows: [
          ["Operator", `${fill(ctx, "operator", 50)}${val(ctx, "operatorId") || ctx.blank ? `, ${fill(ctx, "operatorId", 50)}` : ""}`],
          ["Drone", `${fill(ctx, "model", 50)}${val(ctx, "uin") || ctx.blank ? `; Digital Sky UIN or ID: ${fill(ctx, "uin", 40)}` : ""}`],
          ["Time window", `About ${fill(ctx, "minutes", 12)} minutes, between ${fill(ctx, "from", 22)} and ${fill(ctx, "to", 22)}`],
          ["Area", `${fill(ctx, "area", 60)}. No flights over roads, neighbouring property, or buildings other than the school's own.`],
          ["Height", `Not above ${fill(ctx, "height", 12)} metres, and within the limits of the rules in force`],
          ["Weather", "Flights are cancelled in rain, strong wind or poor visibility"],
        ],
      },
      { t: "h", text: "Safety measures" },
      {
        t: "list",
        ordered: true,
        items: [
          "The drone never flies over students or a crowd, and students are not below or near it during take-off, landing or low passes. The formation shot is taken from a safe height and distance after the operator confirms an exclusion zone.",
          `Only the operator named above flies the drone. A ${J} crew member and a member of the school staff act as spotters. The area is cleared and marked, and we land at once if the school asks.`,
          "Only students whose parents gave media consent appear identifiably in the footage.",
          `The drone has a pre-flight checklist, charged batteries and a return-to-home setting.${insurance ? ` Insurance held: ${insurance}.` : ""}`,
          "If anything seems unsafe, we will not fly. The film will still be delivered, without aerial shots.",
          "We will not fly over restricted or no-fly areas, and we check the Digital Sky airspace map for the school's location before the day.",
        ],
      },
      { t: "h", text: "Use of the footage" },
      { t: "p", text: `The aerial footage is included in the school's highlight film and raw selects. The school may use it for its marketing and admissions. ${J} may use it in its portfolio, subject to the signed consent terms.` },
      { t: "p", text: "We would be grateful if you would sign the permission below. Kindly also tell us of any areas that must be avoided." },
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: joveSign(ctx, { lines: [] }) },
      { t: "h", text: "School permission" },
      { t: "checks", items: [`Permission is granted for drone flights on ${day} as described above.`, `Permission is not granted. ${J} will deliver the film without aerial shots.`] },
      { t: "fields", rows: [["Areas to avoid, or conditions", ""]], cols: 1 },
      { t: "sign", blocks: [partySign(ctx, "For the School", { seal: true })] },
    ];
  },
  cover(ctx) {
    const day = val(ctx, "day") ? ` on ${dateOf(ctx, "day")}` : "";
    return plain(`Respected Sir / Madam, for the ${jove(ctx)} workshop${day} we would like to capture a few aerial shots of the campus for your school's film. The attached letter has our flight plan and safety measures. Kindly tick your decision, sign and seal it, and send us a photo or scan before the workshop. Thank you.`);
  },
};
