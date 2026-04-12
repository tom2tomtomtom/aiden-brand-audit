import { Vibrant } from "node-vibrant/node";

export interface ColorPalette {
  dominantColor: string;
  primaryColors: string[];
  secondaryColors: string[];
  rgbValues: [number, number, number][];
}

export async function extractColors(imageUrl: string): Promise<ColorPalette | null> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();

    const swatches = [
      palette.Vibrant,
      palette.DarkVibrant,
      palette.LightVibrant,
      palette.Muted,
      palette.DarkMuted,
      palette.LightMuted,
    ].filter(Boolean);

    if (swatches.length === 0) return null;

    const hexColors = swatches.map((s) => s!.hex);
    const rgbValues = swatches.map((s) => s!.rgb as [number, number, number]);

    return {
      dominantColor: hexColors[0],
      primaryColors: hexColors.slice(0, 3),
      secondaryColors: hexColors.slice(3),
      rgbValues,
    };
  } catch {
    return null;
  }
}
