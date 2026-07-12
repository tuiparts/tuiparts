# Slot Property Application Benchmark

Command:

```bash
pnpm --filter @opentui-ui/core bench:slots
```

Environment: Bun 1.3.14, macOS arm64, 100,000 synthetic applications or 10,000
real OpenTUI applications per sample, nine measured samples after two warmups.
Timing is the median sample.

The baseline is commit `1f53a29`, which contains the complete benchmark without
changing the slot application implementation. The optimized measurements use
the same benchmark and environment.

## Timing

| Scenario | Baseline | Optimized | Elapsed change |
| --- | ---: | ---: | ---: |
| Unchanged Text styles | 92.648 ms | 49.954 ms | -46.1% |
| One changing Text color | 96.197 ms | 53.928 ms | -43.9% |
| Unchanged Input styles | 96.002 ms | 52.524 ms | -45.3% |
| Real OpenTUI unchanged Text | 31.319 ms | 12.543 ms | -60.0% |

Consolidating per-property cache state into one map raises synthetic throughput
to 1.9-2.0 million applications per second, a 78-85% increase. The real OpenTUI
path takes 60% less time, or 2.5x the baseline throughput, because unchanged
observable values no longer enter color parsing, native TextBuffer updates, or
render scheduling. Setter-only Yoga properties and mutable non-RGBA objects
are still reapplied. The target snapshot also lets styles recover from external
writes and mutable RGBA inputs.

## Side Effects

| Scenario | Baseline assignments / render requests | Optimized assignments / render requests | Reduction |
| --- | ---: | ---: | ---: |
| Unchanged Text styles | 500,000 | 5 | 99.999% |
| One changing Text color | 500,000 | 100,004 | 80.0% |
| Unchanged Input styles | 500,000 | 5 | 99.999% |
| Real OpenTUI unchanged Text | 20,000 / 60,001 | 2 / 20,005 | 66.7% render requests |

Each synthetic target has five normalized native properties. The optimized
path assigns them once, then only assigns properties whose normalized values
change. The real scenario subclasses `TextRenderable` to count foreground and
background setter entries and intercepts its actual renderer's
`requestRender()` method.

The real target's padding setters are intentionally reapplied because OpenTUI
does not expose readable values for them. Readable foreground/background
properties are diffed; setter-only properties favor correctness over caching
an unverifiable value.

Input style application was also moved out of `renderSelf`; rendering unchanged
frames no longer invokes slot application at all. Switch updates track
size/content and thumb position only when their observable inputs change, while
its setter-only gap is deliberately reapplied on each style/state transition.
