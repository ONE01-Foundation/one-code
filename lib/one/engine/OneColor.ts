/**
 * OneColor - Color utilities
 */

export class OneColor {
  static rgba(r: number, g: number, b: number, a: number): string {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  
  static opacity(color: string, opacity: number): string {
    // Simple implementation - assumes rgba format
    return color.replace(/[\d\.]+\)$/g, `${opacity})`);
  }
}

