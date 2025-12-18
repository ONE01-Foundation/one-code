/**
 * OneText - Text utilities
 */

export class OneText {
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
  
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

