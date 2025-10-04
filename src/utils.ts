/// <reference lib="dom" />
export function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element not found: ${id}`);
  }
  return element;
}
