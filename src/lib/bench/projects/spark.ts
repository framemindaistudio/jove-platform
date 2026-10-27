/**
 * Grades 1–2 · Spark Kit: the Light-up Robot Buddy with a spinning fan hat, built clip by clip as in
 * OPERATIONS/02_CURRICULUM/G01-02_Little_Inventors/01_JOVE_Day_Session_Plan.md and 06_ROBOTICS_KITS/03_Assembly_Instructions_Spark.md.
 */
import type { BenchProject } from "../types";

export const sparkProject: BenchProject = {
  id: "robot-buddy",
  title: "Light-up Robot Buddy",
  audience: "Grades 1–2 · Spark Kit",
  kit: "Spark",
  summary: "Clip a battery, an LED, a fan motor and a buzzer into circles of electricity, and make the Robot Buddy glow, spin and beep.",
  public: true,
  behaviour: "spark",
  parts: [
    { id: "robot", type: "robotBody", at: [3.5, 0, -4.5] },
    { id: "bat", type: "battery2", at: [-7, 0, 1.5] },
    { id: "led", type: "led", at: [2.5, 0, 1.2], props: { color: "#ff3b30", label: "Red LED" } },
    { id: "fan", type: "minimotor", at: [6.5, 0, 4.5], props: { fan: true } },
    { id: "bz", type: "buzzer", at: [1.2, 0, 6.2] },
  ],
  camera: { at: [0, 19, 24], look: [0, 2.5, 0] },
  steps: [
    { title: "Meet the parts", text: "A battery box, a little light (LED), a fan motor and a buzzer. And the Robot Buddy they will live on.", place: ["robot", "bat", "led", "fan", "bz"], tip: "Point to each part and say its name together." },
    { title: "Batteries in", text: "The trainer puts in the two cells: flat end on the spring. The switch stays OFF.", tip: "Only trainers handle the cells." },
    { title: "Red clip from the battery", text: "Clip the red wire from the battery's red lead to the LED's long leg.", wires: [{ from: "bat.+", to: "led.+", color: "red", clip: true }], tip: "Long leg = plus = red!" },
    { title: "Black clip back home", text: "Clip the black wire from the LED's short leg back to the battery's black lead. The circle is closed.", wires: [{ from: "led.-", to: "bat.-", color: "black", clip: true }] },
    { title: "Switch ON. It glows!", text: "Slide the switch on the battery box. Shout when it lights!", run: true, tip: "No light? Is the switch on? Long leg to red?" },
    { title: "Spinning fan hat", text: "Clip the fan motor to the battery too: red to one tab, black to the other.", wires: [{ from: "bat.+", to: "fan.a", color: "red", clip: true }, { from: "fan.b", to: "bat.-", color: "black", clip: true }], run: true, tip: "Swap the two clips: the fan spins the other way!" },
    { title: "Robot says hello", text: "Clip the buzzer in its own circle: red to its + leg, black to its − leg.", wires: [{ from: "bat.+", to: "bz.+", color: "red", clip: true }, { from: "bz.-", to: "bat.-", color: "black", clip: true }], run: true, tip: "Two or three parts can share one battery." },
    { title: "Show & Glow!", text: "Lights off, everyone switches on together: 5, 4, 3, 2, 1, GLOW!", run: true },
  ],
};
