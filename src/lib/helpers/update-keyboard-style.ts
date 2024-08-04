import { type Keyboard } from "$lib/types";

export const updateKeyboardStyle = () => {
  if (typeof document === 'undefined') {
    return
  };

  const keyboard = document.querySelector('arabic-keyboard') as Keyboard | null;
  const tile1 = getComputedStyle(document.body).getPropertyValue('--tile1');
  const tile3 = getComputedStyle(document.body).getPropertyValue('--tile3');
  const tile4 = getComputedStyle(document.body).getPropertyValue('--tile4');
  const tile5 = getComputedStyle(document.body).getPropertyValue('--tile5');
  const tile6 = getComputedStyle(document.body).getPropertyValue('--tile6');
  const text1 = getComputedStyle(document.body).getPropertyValue('--text1');
  const text3 = getComputedStyle(document.body).getPropertyValue('--text3');

  if (keyboard) {
    keyboard.style.setProperty('--button-background-color', tile4);
    keyboard.style.setProperty('--button-active-background-color', tile5);
    keyboard.style.setProperty('--button-active-border', `1px solid ${tile6}`);
    keyboard.style.setProperty('--button-hover-background-color', tile3);
    keyboard.style.setProperty('--textarea-background-color', tile1);
    keyboard.style.setProperty('--textarea-input-color', text1);
    keyboard.style.setProperty('--max-keyboard-width', '900px');
    keyboard.style.setProperty('--button-color', text1);
    keyboard.style.setProperty('--button-eng-color', text3);
    keyboard.style.setProperty('--button-shifted-color', text3);
  }
}