import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeChoice = 'auto' | 'light' | 'dark';

/** Il prefisso `acfs-bgs:` resta quello di sempre (vedi CLAUDE.md). */
const STORAGE_KEY = 'acfs-bgs:theme';
/** La classe che attiva il tema chiaro negli stili globali: per ora solo il Colony Plotter la mette. */
const THEMED_CLASS = 'cp-themed';

function storedChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

/**
 * Tema chiaro, scuro o automatico, come il selettore del blog dell'utente (20 novembre 2026).
 * Vale solo nelle pagine che chiamano `enable()` (oggi il Colony Plotter): le altre restano scure.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  readonly choice = signal<ThemeChoice>(storedChoice());

  enable(): void {
    this.root.classList.add(THEMED_CLASS);
    this.apply(this.choice());
  }

  disable(): void {
    this.root.classList.remove(THEMED_CLASS);
    this.root.removeAttribute('data-theme');
  }

  set(choice: ThemeChoice): void {
    this.choice.set(choice);
    try {
      if (choice === 'auto') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Senza localStorage la scelta vale finché la pagina resta aperta.
    }
    this.apply(choice);
  }

  private apply(choice: ThemeChoice): void {
    if (choice === 'auto') this.root.removeAttribute('data-theme');
    else this.root.setAttribute('data-theme', choice);
  }
}
