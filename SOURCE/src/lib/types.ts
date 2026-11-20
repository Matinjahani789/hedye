export interface SceneProps {
  /** Ask the scene controller to move to the next scene (safe to call repeatedly). */
  onNext: () => void;
  /** Only used by the last scene. */
  onReplay: () => void;
  /** false while the scene is leaving */
  active: boolean;
}

export interface Pt {
  x: number;
  y: number;
}
