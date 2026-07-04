/** اهتزاز خفيف حيثما يدعمه الجهاز (لا يضر حيث لا يُدعم) */
export function haptic(pattern: number | number[] = 10): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* تجاهل */
  }
}
