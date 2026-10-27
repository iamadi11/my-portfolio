# Visual science

Rules that keep a visual technically true. A good-looking diagram is persuasive; that is exactly why it must not
say more than the evidence does. Apply this to every asset in a chapter's asset plan, at Stage B (plan), Stage C
(build) and Stage F (review).

## Contents

- Model fidelity
- Causal correctness and the adversarial pass
- Evidence classes
- Units, scales and invariants
- Uncertainty and limits
- Conceptual illustration or executable model

## Model fidelity

Every technical visual has an explicit model, written in the asset plan before any drawing:

- **State:** what the visual tracks (e.g. queue length `Q(t)`, a connection table, a replica's last applied write).
- **Inputs:** each control, its unit and valid range (e.g. arrival rate `λ` in requests/s, 0–2000).
- **Rules:** the equations or step rules that turn inputs into state, and the discipline they assume (e.g. FIFO).
- **Outputs:** every readout and every visual change, each computed from state.
- **Assumptions:** what the model leaves out, stated beside the visual, not only in the spec.

Choose the simplest model that is true for the teaching objective, and say where it stops being true. Example: the
fluid approximation of a queue, `dQ/dt ≈ λ − μ` while `Q > 0` (arrival rate `λ`, service rate `μ`, both in
requests/s), shows why a queue grows without bound when `λ > μ`. It does not show waiting when `λ < μ`: with random
arrivals and service times a queue forms below capacity, and burstiness, scheduling and queue limits change
behaviour. A chapter that needs those effects uses a discrete-event model instead, and says so.

A **conceptual illustration** (no executable model) may only show structure that every case shares (who talks to
whom, which layer wraps which). The moment it shows quantities, order of events or outcomes that depend on inputs,
it needs a model.

## Causal correctness and the adversarial pass

A visual must show cause and effect as they are, not merely a plausible order of things lighting up. For every
asset, the author and then the reviewer run an adversarial pass: "what wrong conclusion could a learner draw from
this picture?" Each answer is either prevented in the visual or stated beside it. Common traps:

| A learner might conclude                            | What is true instead                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A timeout means the server did nothing              | The client cannot tell a lost request from a lost or late response                     |
| A cache hit means the data is current everywhere    | A hit returns a stored copy; whether it is fresh depends on the cache's rules          |
| More replicas mean stronger consistency             | Replicas add copies to keep in step; consistency depends on how reads and writes route |
| A bigger queue means more capacity                  | A queue stores work; it adds waiting, not service                                      |
| An IP address and port identify a user or a request | They identify an interface and a transport endpoint; requests and users live higher up |
| A retry is harmless                                 | A retry can execute an operation again unless it is idempotent                         |
| Packets travel as a neat line along one path        | Each datagram is routed independently; paths and order can differ                      |
| The animation's speed is the system's speed         | Animated time is scaled; real timings are in the readouts, with units                  |

Record the pass in the asset plan (`assumptions:` and `tests:`), and test the guard where it is in code (e.g. a
test that a timeout readout never claims the server failed).

## Evidence classes

Label every claim a visual makes with one of these, in the asset plan and, when it matters, on the page:

1. **Standard-defined:** an RFC, W3C/WHATWG standard or similar says so (cite the section).
2. **Documented implementation behaviour:** official docs of a named system say so, for a version (e.g. a Linux
   default, a PostgreSQL behaviour). Not true of other systems unless they say so too.
3. **Mathematical model:** follows from stated equations under stated assumptions.
4. **Illustrative scenario:** a made-up but self-consistent example; numbers are labelled "assumed".
5. **Heuristic or engineering judgement:** a trade-off or rule of thumb; labelled as judgement.

A visual never upgrades a claim's class: a beautifully drawn heuristic is still a heuristic. Never present
illustrative numbers as measurements, and never draw a chart of invented data that looks like an experiment.

## Units, scales and invariants

- Every quantity on screen has a unit; every axis has a label, unit and scale (linear/log stated).
- Numbers that appear in two places agree (the text, the readout and the test assert the same value).
- Name the model's invariants and test them: conservation (requests in = done + failed + in flight + queued),
  bounds (utilisation in [0, 1], no negative counts, no NaN), ordering (an event never precedes its cause), and
  identity rules (e.g. one connection per distinct 5-tuple).
- Test boundaries: zero, maximum, equal inputs (`λ = μ`), and the empty case.
- Animated time is a display scale, never a measurement; label it ("not to scale" or "1 s shown ≈ 10 ms").

## Uncertainty and limits

When behaviour depends on implementation, configuration, workload or protocol version, show the dependency instead
of one scenario as universal truth: a control for the variant, a label ("Linux default"), or a note naming the
alternatives. State what the visual does **not** support concluding (e.g. "this model says nothing about tail
latency"). If a source could not be read, the visual does not depict the unverified behaviour.

## Conceptual illustration or executable model

Each asset says which it is, on the page:

- **Conceptual illustration:** "a picture of the idea, not a packet capture / not a real topology".
- **Executable model:** "teaching model, not a benchmark", with its assumptions listed beside it, every number
  computed by a tested pure module, deterministic for given inputs (seeded randomness if any).

Never make a simplified illustration look like real tool output (a fake terminal, a fake packet capture, a fake
dashboard with plausible numbers).
