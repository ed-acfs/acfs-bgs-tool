import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ConflictOutcome, ConflictScore, conflictOutcome } from '../../core/bgs';
import { I18nService } from '../i18n.service';

/**
 * A conflict's score as Inara draws it: us on the left, them on the right, the days won in the
 * middle, and under each side the outcome so far and what it loses on defeat.
 */
@Component({
  selector: 'app-conflict-score-card',
  template: `
    @let s = score();
    <div class="score-card" [attr.aria-label]="i18n.t('state.scoreAria', { ours: s.ours, theirs: s.theirs })">
      <div class="side side--ours" [attr.data-outcome]="tone(s.ours, s.theirs)">
        <span class="faction">{{ faction() }}</span>
        <span class="outcome">{{ outcome(s.ours, s.theirs) }}</span>
        <span class="stake-label">{{ i18n.t('state.stakeAtRisk') }}</span>
        <span class="stake">{{ s.ourStake ?? '—' }}</span>
      </div>
      <div class="middle">
        <span class="days"><strong>{{ s.ours }}</strong><span class="vs">vs</span><strong>{{ s.theirs }}</strong></span>
        <span class="days-label">{{ i18n.t('state.daysWon') }}</span>
      </div>
      <div class="side side--theirs" [attr.data-outcome]="tone(s.theirs, s.ours)">
        <span class="faction">{{ s.opponent }}</span>
        <span class="outcome">{{ outcome(s.theirs, s.ours) }}</span>
        <span class="stake-label">{{ i18n.t('state.stakeAtRisk') }}</span>
        <span class="stake">{{ s.theirStake ?? '—' }}</span>
      </div>
    </div>
  `,
  styleUrl: './conflict-score-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictScoreCardComponent {
  protected readonly i18n = inject(I18nService);

  readonly score = input.required<ConflictScore>();
  /** Our faction's name, for the left side. */
  readonly faction = input.required<string>();

  /** "Close Victory", "Draw", "Defeat"… for the side that won `days` against `otherDays` (see CLAUDE.md). */
  protected outcome(days: number, otherDays: number): ConflictOutcome {
    return conflictOutcome(days, otherDays);
  }

  /** Colours a side: ahead, level or behind. */
  protected tone(days: number, otherDays: number): 'ahead' | 'level' | 'behind' {
    return days > otherDays ? 'ahead' : days < otherDays ? 'behind' : 'level';
  }
}
