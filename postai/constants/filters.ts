// ─── ColorMatrix builder for @shopify/react-native-skia ──────────────────────
//
// Skia ColorMatrix is a flat array of 20 numbers (4 rows × 5 cols).
// Output: R' = m[0]*R + m[1]*G + m[2]*B + m[3]*A + m[4]
//         G' = m[5]*R + m[6]*G + m[7]*B + m[8]*A + m[9]
//         B' = m[10]*R + m[11]*G + m[12]*B + m[13]*A + m[14]
//         A' = m[15]*R + m[16]*G + m[17]*B + m[18]*A + m[19]
// All values in [0, 1] range.

const Lr = 0.2126; // luminance weights (BT.709)
const Lg = 0.7152;
const Lb = 0.0722;

/**
 * Build a combined ColorMatrix from brightness / contrast / saturation.
 *
 * brightness: -1 to 1  (0 = normal)
 * contrast:   0 to 2   (1 = normal)
 * saturation: 0 to 2   (1 = normal, 0 = grayscale)
 *
 * Order of application: saturation → contrast → brightness
 * Computed analytically into a single 4×5 matrix so Skia only runs one pass.
 */
export function buildColorMatrix(
  brightness: number,
  contrast: number,
  saturation: number
): number[] {
  const s = saturation;
  const c = contrast;
  const bv = brightness;
  const offset = (1 - c) * 0.5 + bv; // combined offset from contrast + brightness

  // Combined matrix coefficients
  const rr = c * (Lr * (1 - s) + s);
  const rg = c * (Lg * (1 - s));
  const rb = c * (Lb * (1 - s));

  const gr = c * (Lr * (1 - s));
  const gg = c * (Lg * (1 - s) + s);
  const gb = c * (Lb * (1 - s));

  const br = c * (Lr * (1 - s));
  const bg_ = c * (Lg * (1 - s));
  const bb = c * (Lb * (1 - s) + s);

  // prettier-ignore
  return [
    rr, rg, rb, 0, offset,
    gr, gg, gb, 0, offset,
    br, bg_, bb, 0, offset,
    0,  0,  0,  1, 0,
  ];
}

// ─── Filter presets ───────────────────────────────────────────────────────────

export interface FilterPreset {
  name: string;
  brightness: number;
  contrast: number;
  saturation: number;
  /** Optional warm/cool tint overlay (RGBA hex) */
  tint?: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { name: 'Normal',   brightness: 0,     contrast: 1,    saturation: 1    },
  { name: 'Suave',    brightness: 0.06,  contrast: 0.88, saturation: 0.8  },
  { name: 'Quente',   brightness: 0.08,  contrast: 1.05, saturation: 1.15, tint: 'rgba(255,160,80,0.08)' },
  { name: 'Frio',     brightness: -0.04, contrast: 1.1,  saturation: 0.85, tint: 'rgba(80,160,255,0.08)' },
  { name: 'Vintage',  brightness: 0.05,  contrast: 0.85, saturation: 0.65, tint: 'rgba(220,180,100,0.1)' },
  { name: 'Vivo',     brightness: 0,     contrast: 1.2,  saturation: 1.5  },
  { name: 'Drama',    brightness: -0.08, contrast: 1.4,  saturation: 0.8  },
  { name: 'P&B',      brightness: 0,     contrast: 1.1,  saturation: 0    },
  { name: 'Fade',     brightness: 0.12,  contrast: 0.78, saturation: 0.75 },
  { name: 'Neon',     brightness: 0.02,  contrast: 1.25, saturation: 1.9  },
  { name: 'Fantasia', brightness: 0.05,  contrast: 0.95, saturation: 1.3, tint: 'rgba(200,100,255,0.12)' },
  { name: 'Cinema',   brightness: -0.05, contrast: 1.35, saturation: 0.7  },
];

export const DEFAULT_EDITS = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  filterName: 'Normal',
};
