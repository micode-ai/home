# -*- coding: utf-8 -*-
"""Turn `slides.render()`'s bare warnings into operator-facing lines — once,
in one place, for all three generators.

`slides.render()` signals a slide it could not lay out properly with a plain
`RuntimeWarning`: copy that still overflows the footer band at the minimum
type scale, a screenshot it could not find, a screenshot it had no room for.
Left as a bare warning that is close to invisible in a real build run — the
default filters dedupe by (message text, code location), so a deck with two
overflowing slides rendered in two languages prints *one* line, and that line
names neither the campaign, nor the language, nor which slide — while the
operator is looking at twelve freshly written PNGs and no reason to doubt
any of them.

Lives in its own module rather than in `brand.py` on purpose: `brand.py` is
the one place visual tokens (palette, fonts, badge, footer) are written down
and it is imported by `slides.py` itself, so putting operator-facing stderr
I/O there would push console output *below* the drawing layer. The three
`build_*.py` scripts are the only things in this factory that talk to an
operator; a module they import — and nothing else does — keeps that
dependency one-way.
"""
import sys
import warnings
from contextlib import contextmanager


@contextmanager
def surfaced(campaign_id: str, lang: str, what: str, canvas: tuple[int, int]):
    """Render inside this block; anything it warns about gets an operator line.

    Usage:

        with render_warnings.surfaced(campaign_id, lang, "'li-single'", size):
            image = slides.render(campaign, slide, lang, size)
        image.save(path)

    Three properties this shape exists to preserve, all of them paid for the
    hard way (see the Task 6 entries in the SDD ledger):

    * **The operator gets context.** Every line names the campaign, the
      language, the format (`what`) and the canvas, then relays the warning's
      own text — so a missing screenshot does not get reported as overflowing
      copy just because both arrive through the same channel.
    * **`simplefilter("always")` never leaks.** It lifts *this block's* own
      filter only, so the warning is reliably captured instead of being
      deduped away. It must not override a caller's filter — an earlier
      version did, and silently defeated CI gates running with
      `-W error::RuntimeWarning`.
    * **The caller's filter still decides.** The captured warning is re-emitted
      with `warn_explicit` *after* the `catch_warnings` block has exited and
      the caller's own filters are back in force, so `-W error::RuntimeWarning`
      raises again — from the `with` statement, i.e. before the caller reaches
      its `.save()`, matching plain `slides.render(...).save(path)` semantics.
      Under default filters the caller sees the warning exactly once and the
      operator line exactly once: no double-emit, no suppression.
    """
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        yield
    # Outside the block: the caller's own filters are in force again.
    for entry in caught:
        print(
            f"  WARNING: {campaign_id} ({lang}): {what} at "
            f"{canvas[0]}x{canvas[1]} — {entry.message}",
            file=sys.stderr,
        )
        warnings.warn_explicit(entry.message, entry.category,
                               entry.filename, entry.lineno)
