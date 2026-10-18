import { TestBed } from '@angular/core/testing';
import { App, footerParts } from './app.component';

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
