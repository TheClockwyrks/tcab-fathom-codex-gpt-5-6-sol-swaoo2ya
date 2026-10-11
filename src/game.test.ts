import { describe, expect, it } from "vitest";
import type { InitApi } from "@clockwyrks/simple-2d";
import {
  BRIGHT_HOLD,
  KINDLE_VISION_MIN,
  START_LIVES,
  VISION_MIN,
} from "./constants";
import { game, type FathomState } from "./game";

function api(): InitApi<FathomState> {
  return {
    input: { register() {}, layout: () => null },
    audio: { define() {}, load: async () => {} },
    assets: {
      loadImage: async () => ({}) as ImageBitmap,
      loadAudio: async () => ({}) as AudioBuffer,
      load: async () => new Blob(),
      resolve: (path) => path,
    },
    diagnostics: { register() {} },
    events: { on: () => () => {} },
    viewport: () => ({
      width: 1280,
      height: 720,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }),
  };
}

describe("Fathom debug core", () => {
  it("opens with a complete fresh Kindle dive", async () => {
    const [state, debug] = await game.initialize(api());
    expect(debug.snapshot(state).screen).toBe("title");
    expect(state.lives).toBe(START_LIVES);
    expect(state.visionRadius).toBe(VISION_MIN);
    expect(state.windowRadius).toBe(KINDLE_VISION_MIN);
    expect(state.planktonRemaining).toBeGreaterThan(200);
    expect(state.predators.map((p) => p.kind)).toEqual([
      "lanternjaw",
      "gloamfin",
      "flarefish",
    ]);
  });
  it("poses state immutably and reconciles derived readings", async () => {
    const [state, debug] = await game.initialize(api());
    const bright = debug.setBrightness(state, 1);
    const held = debug.setBrightHold(bright, BRIGHT_HOLD);
    expect(state.brightness).toBe(0);
    expect(bright.visionRadius).toBeGreaterThan(state.visionRadius);
    expect(held.brightHold).toBe(BRIGHT_HOLD);
    expect(debug.clearFog(held).visibility.every((r) => /^u+$/.test(r))).toBe(
      true,
    );
  });
  it("updates depth-derived roster and sonar and rejects malformed fixtures", async () => {
    const [state, debug] = await game.initialize(api());
    const deep = debug.setDepth(state, 4);
    expect(deep.predators).toHaveLength(6);
    expect(deep.sonar.range).toBe(6);
    expect(() => debug.setMaze(state, ["..."])).toThrow(RangeError);
  });
});
