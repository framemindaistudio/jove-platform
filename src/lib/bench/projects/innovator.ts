/**
 * Grades 9–12 · Innovator Kit: the AI vision pan-tilt head, wired as in the AI Innovators deck (src/lib/decks/ai.ts):
 * pan signal GPIO 18, tilt GPIO 19, servos powered from the 5 V module with a common ground, OLED on SDA 21 / SCL 22.
 */
import type { BenchProject } from "../types";

export const PANTILT_CODE = `// the DevKit runs a little web server (Code Library, section 2)
http://192.168.8.102/move?pan=60&tilt=90   // go to angles
http://192.168.8.102/nudge?dpan=10         // 10° more
http://192.168.8.102/center                // back to 90, 90

void handleNudge() {
  panAngle += server.arg("dpan").toInt();
  applyAngles();   // keeps it inside PAN_MIN..PAN_MAX
}

// jove_pantilt.html, run from http://localhost:8000
if (probability < CONFIG.CONFIDENCE) return;   // not sure: do nothing

if (label === "Left")
  sendCommand("/nudge?dpan=" + CONFIG.STEP_DEG);
if (label === "Right")
  sendCommand("/nudge?dpan=" + (-CONFIG.STEP_DEG));
// "Centre" or "Nothing": hold still`;

export const panTiltProject: BenchProject = {
  id: "ai-pan-tilt",
  title: "AI Vision Pan-Tilt",
  audience: "Grades 9–12 · Innovator Kit",
  kit: "Innovator",
  summary: "An ESP32 moves two servos; a model trained in the browser tells it Left, Right or Centre. Wire it, then play the model.",
  behaviour: "pantilt",
  code: PANTILT_CODE,
  parts: [
    { id: "esp", type: "esp32", at: [-5, 0, -1] },
    { id: "pw", type: "power5v", at: [-5, 0, 6], props: { label: "5 V module" } },
    { id: "pan", type: "sg90", at: [6, 0, 0], props: { label: "Pan servo" } },
    { id: "tilt", type: "sg90", at: [6.55, 2.6, 0], props: { label: "Tilt servo" } },
    { id: "cam", type: "esp32cam", at: [6.55, 5.0, 0], props: { label: "ESP32-CAM" } },
    { id: "oled", type: "oled", at: [-5, 0, -6.5] },
  ],
  camera: { at: [2, 16, 20], look: [1, 2, 0] },
  steps: [
    { title: "Meet the parts", text: "The ESP32 DevKit runs the servo server. Two SG90 servos make the pan-tilt head, the ESP32-CAM rides on top, and the 5 V module powers the servos.", place: ["esp", "pw", "pan", "tilt", "cam"] },
    { title: "Signal wires", text: "Pan servo's orange wire → GPIO 18. Tilt servo's orange wire → GPIO 19.", wires: [{ from: "pan.S", to: "esp.GPIO18", color: "orange" }, { from: "tilt.S", to: "esp.GPIO19", color: "orange" }], tip: "Orange = signal: the ESP32 tells each servo its angle." },
    { title: "Power the servos", text: "Each servo: red → +5V, brown → GND of the 5 V module.", wires: [{ from: "pan.+", to: "pw.+5V", color: "red" }, { from: "pan.-", to: "pw.GND", color: "brown" }, { from: "tilt.+", to: "pw.+5V", color: "red" }, { from: "tilt.-", to: "pw.GND", color: "brown" }], tip: "Never power servos from the 3.3 V pin: the board resets." },
    { title: "Common ground", text: "ESP32 GND → the 5 V module's GND. Now the signal means the same thing on both sides.", wires: [{ from: "esp.GND", to: "pw.GND", color: "black" }], tip: "Without it the servos jitter or ignore the ESP32." },
    { title: "Test from the browser", text: "Press Run, then use the sliders: that is the /move?pan=…&tilt=… page. Limits: pan 20–160°, tilt 50–130°.", run: true },
    { title: "Join the model", text: "Play the model: press Left, Right or Centre as if the camera saw it. Left nudges the pan +10°, Right −10°.", run: true, tip: "Below the confidence line, the page does nothing: not sure = hold still." },
    { title: "Bonus: the OLED", text: "OLED SDA → GPIO 21, SCL → GPIO 22, VCC → 3.3 V, GND → GND. It shows what the model sees.", place: ["oled"], wires: [{ from: "oled.SDA", to: "esp.GPIO21", color: "blue" }, { from: "oled.SCL", to: "esp.GPIO22", color: "yellow" }, { from: "oled.VCC", to: "esp.3V3", color: "red" }, { from: "oled.GND", to: "esp.GND.2", color: "black" }], run: true },
  ],
};
