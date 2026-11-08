<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Grade-to-performance conversion and score validation live only in `src/lib/domain.ts` (`PERFORMANCE_LEVELS`, `parseScore`); why: one place to change institutional scales.
- Averages are computed from `grade_scores` at read time (`src/lib/grades.ts`), never stored as source data; `report_cards` is only a snapshot; why: avoid stale duplicates.
- Period rules (single active period per year, no delete with academic data) are enforced by DB triggers, not just UI; why: RLS/backend must be authoritative.
