/**
 * Converts a connector icon to a data URL
 * @param icon The connector icon
 * @returns A data URL
 */
export function connectorIconToSrc(icon: string | { light: string, dark: string }): string {
  const _icon = typeof icon === "string"
    ? icon
    : icon.light;
    return _icon.startsWith("<svg")
      // workaround for Argent Web Wallet
      ? encodeSvgToBase64(_icon)
      : _icon
}

/**
 * Encodes an SVG string to a base64 data URL that can be used in img src attributes
 * @param svgString The SVG string to encode
 * @returns A base64 encoded data URL
 */
function encodeSvgToBase64(svgString: string): string {
  if (!svgString) return "";
  // Remove any whitespace and newlines
  const cleanedSvg = svgString.replace(/\s+/g, ' ').trim();
  // Encode to base64
  const base64 = btoa(cleanedSvg);
  // Create data URL
  return `data:image/svg+xml;base64,${base64}`;
}
