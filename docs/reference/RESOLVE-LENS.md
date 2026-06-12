# Resolve AI lens — high-signal extract, mapped to sayhello

> Resolve AI = production/SRE agent (Mayank/Spiros, + Zscaler customer). It IS the SRE parallel.
> Their architecture for "don't throw AI at production blindly" is the exact template for "don't throw
> AI at GTM blindly." Extracted 2026-06-12. Only the signal relevant to our 6-step harness.

## The transferable principles (Resolve → sayhello)
| Resolve (SRE) | sayhello (GTM) |
|---|---|
| Understand what makes production hard for HUMANS, then backtrack to make it work for AI | Understand what a great salesperson actually does to know a lead, backtrack |
| **Start at the narrowest point where symptoms show, navigate to root cause** — don't broadcast queries against all tools (picks up noise) | Don't dump all company data. Start at the strongest SIGNAL (a hiring spike, a release, a funding event) and navigate to the ONE real pain |
| "Given these symptoms, what is the most likely origin point?" (not "what's abnormal right now?") | "Given this company, what's the most likely real pain we solve?" — not "enrich everything" |
| **The grumpy critic** — "we want a very grumpy critiquer to say you have holes in your theory," NOT "you're absolutely right." Checks causality gaps, missing evidence, false conclusions | OUR HELD-OUT JUDGE, validated. It rejects ungrounded claims — same grumpy-critic mechanic |
| Evidence-backed claims + citations + a causal timeline | Every story claim → a sourced signal; the story is causal (WHY this pain exists now) |
| **Say NO to wrong theories** — multiple competing theories, only one right; rejecting wrong ones matters as much as finding the right one | Reject wrong angles/fabricated claims, not just generate a story |
| Bring the right persona at each step; can't shove all expertise in one big prompt (noise) | Right "lens" per step (signal-reader → pain-theorist → narrative-writer), not one mega-prompt |
| Learns from humans, collaborative, never binary | Human-approval gate + the loop improves |

## The ONE insight that reframes the output (Chris, the customer — load-bearing)
> "It actually isn't hard to put together an agent that's just gonna give you MORE INFORMATION about
> your system. That doesn't help me. I don't need more numbers or more data. What I need is a ROOT CAUSE,
> or at least really good WORKING THEORIES... That's how I'm grading the agent."

**Translation to GTM:** every lead tool on earth gives you MORE DATA (enrichment dumps). The salesperson
doesn't want more data about the company — they want the **working theory of the lead's pain**, grounded,
with the guesses rejected. That is what is NOT being done. sayhello's output is a THEORY, not a data dump.

## Lessons that protect us (their hard-won list)
- Not just a model problem — architecture matters (the loop + critic, not a better prompt).
- Context windows don't solve everything — start narrow, get the right context at the right time.
- Evals are as hard as the product — trust comes from the grumpy critic, not the generator.
