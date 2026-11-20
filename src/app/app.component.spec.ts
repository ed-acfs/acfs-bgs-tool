import { TestBed } from '@angular/core/testing';
import { App, copyrightYears, footerParts } from './app.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows the copyright years from 2026 to the current year', () => {
    expect(copyrightYears(2026)).toBe('2026');
    expect(copyrightYears(2028)).toBe('2026–2028');
  });

  it('links the game and Frontier in the footer note, in any language', () => {
    const parts = footerParts('Uno strumento per Elite Dangerous, non affiliato a Frontier Developments.');
    expect(parts).toEqual([
      { text: 'Uno strumento per ', href: undefined },
      { text: 'Elite Dangerous', href: 'https://www.elitedangerous.com/' },
      { text: ', non affiliato a ', href: undefined },
      { text: 'Frontier Developments', href: 'https://www.frontier.co.uk/' },
      { text: '.', href: undefined },
    ]);
  });
});
