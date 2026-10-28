# Scientific modeling

Rules that keep every simulation, animation and diagram technically true. A beautiful figure is persuasive, which
is exactly why it must not say more than the evidence does. Apply at concept decomposition (stage 1), storyboard
(2), build (3), explanation (4), tests (5) and review (6).

## Contents

- The model document (ten items)
- Choosing the kind of model
- Evidence classes
- The adversarial pass: misleading explanations to rule out
- Units, scales and invariants
- Uncertainty and limits
- Illustration or executable model
- Tests that establish correctness

## The model document (ten items)

Every `simulation`, `animated-2d`, `chart` and `3d` asset documents, in the asset plan's `model:` and
`assumptions:` fields and in a comment at the top of its pure model module:

1. **Inputs and valid ranges**, with units (arrival rate λ in requests/s, 0–2000).
2. **State variables** (queue length `Q(t)`, a connection table, a replica's last applied write).
3. **Transition rules**: what changes state, in what order, under which condition.
4. **Equations or algorithms** where they apply (`dQ/dt = λ − μ` while `Q > 0`; FIFO service; a hash on the
   5-tuple).
5. **Assumptions and simplifications**, stated beside the visual too, not only in the spec.
6. **Expected outputs**: every readout and every visual change, each computed from state.
7. **Boundary conditions**: zero, maximum, equal inputs (`λ = μ`), empty, overload.
8. **Deterministic or stochastic**: stochastic models use a seeded PRNG; the seed is part of the input.
9. **Limitations**: where the model stops applying, and what it cannot be used to conclude.
10. **Tests** that establish correctness (last section).

A model is a pure module (`state + inputs + time → state`, or `inputs → events`) with no UI imports; the figure
only reads it.

## Choosing the kind of model

- **Closed form** (utilisation `ρ = λ/μ`, Little's law `L = λW`, M/M/1 waiting time): fine when its assumptions
  are stated and match the scenario; say where it stops applying (M/M/1 assumes Poisson arrivals and exponential
  service).
- **Fluid approximation** (`dQ/dt ≈ λ − μ` while `Q > 0`): shows why a queue grows without bound when `λ > μ`; does
  not show waiting below capacity, burstiness or queue limits. Say so on the figure.
- **Discrete-event simulation**: request-level behaviour from an event queue ordered by time, finite servers with a
  real FIFO and a limit, sampled service times, timeouts that do not cancel work already started downstream, and
  percentiles measured from completed requests (never derived from the mean). Breakscale's engine (MIT) is a
  reference for these choices; write your own code.
- **Discrete-time teaching model** (ticks): fine for ordering and causality (which packet arrives first) when the
  tick is labelled an assumed unit and nothing claims real durations.

Tell the learner on the figure which kind it is ("fluid approximation", "discrete-event simulation", "teaching
model in ticks").

## Evidence classes

Label every claim a visual makes with one of these, in the asset plan's `evidence:` field and, when it matters,
on the page:

1. **Standard-defined:** an RFC or W3C/WHATWG standard says so (cite the section).
2. **Observed implementation behaviour:** official docs of a named system say so, for a version (a Linux default,
   a PostgreSQL behaviour). Not true of other systems unless they say so too.
3. **Mathematical model:** follows from stated equations under stated assumptions.
4. **Illustrative synthetic scenario:** made up but self-consistent; numbers are labelled "assumed".
5. **Engineering heuristic:** a trade-off or rule of thumb; labelled as judgement.
6. **Uncertain or configuration-dependent:** depends on version, configuration or workload; the figure shows the
   dependency (a control, a label, or a note naming the alternatives).

A visual never upgrades a claim's class: a beautifully drawn heuristic is still a heuristic. Never draw a chart of
invented data that looks like an experiment, and never present illustrative numbers as measurements.

## The adversarial pass: misleading explanations to rule out

For every asset, the author and then the reviewer ask "what wrong conclusion could a learner draw from this?" Each
answer is prevented in the visual or stated beside it, and guarded by a test where it lives in code.

| A learner might conclude                                    | What is true instead                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A timeout means the server did not process the request      | The client cannot tell a lost request from a lost or late response; the work may have happened               |
| More replicas mean stronger consistency                     | Replicas add copies to keep in step; consistency depends on how reads and writes are routed and acknowledged |
| A bigger queue means more capacity                          | A queue stores work; it adds waiting, not service; capacity is the service rate                              |
| A cache hit means the data is current everywhere            | A hit returns a stored copy; freshness depends on the cache's rules                                          |
| An IP address and port identify a user or a request         | They identify an interface and a transport endpoint; users and requests live higher up                       |
| Each browser tab has its own connection                     | One connection can carry many requests; HTTP decides how requests share it                                   |
| A retry is harmless                                         | A retry can execute an operation again unless it is idempotent                                               |
| Packets travel in a line along one path and arrive in order | Each datagram is routed on its own; paths and order can change                                               |
| No reply means nothing is listening                         | A firewall may drop silently; silence proves nothing                                                         |
| The animation's speed is the system's speed                 | Animated time is scaled; real timings are in readouts with units                                             |
| TCP makes the network reliable                              | The network still loses packets; TCP recovers in the end hosts and pays in waiting                           |

## Units, scales and invariants

- Every quantity on screen has a unit; every axis has a label, unit and scale (linear or log, stated).
- A number that appears in two places agrees (text, readout and test assert the same value).
- Name the invariants and test them: conservation (in = done + failed + in flight + queued), bounds (utilisation
  in [0, 1], no negative counts, no NaN), ordering (an effect never precedes its cause), identity (one connection
  per distinct socket pair).
- Animated time is a display scale, never a measurement; label it.

## Uncertainty and limits

When behaviour depends on implementation, configuration, workload or protocol version, show the dependency
instead of presenting one scenario as universal (a control for the variant, a "Linux default" label, a note naming
alternatives). State what the visual does not support concluding ("this model says nothing about tail latency").
If a source could not be read, the visual does not depict the unverified behaviour.

## Illustration or executable model

Each asset says which it is, on the page:

- **Conceptual illustration:** "a picture of the idea, not a packet capture / not a real topology"; it may show
  only structure every case shares. The moment it shows quantities, event order or input-dependent outcomes, it
  needs a model.
- **Executable model:** "teaching model, not a benchmark", its kind, and its assumptions beside it.

Never make a simplified illustration look like real tool output (a fake terminal, packet capture or dashboard).

## Tests that establish correctness

Unit tests (the host's runner) for every model:

- **Invariants:** conservation, bounds, ordering, identity (above).
- **Boundaries:** zero, maximum, equal inputs, empty, overload; invalid inputs rejected or clamped as documented.
- **Determinism:** same inputs and seed → identical output.
- **Known cases:** closed-form results where they exist, within a stated tolerance.
- **Misconception guards:** each row of the adversarial pass that the model could violate (a timeout readout never
  says the server failed; a late packet is not resent before its timer).
- **Quoted numbers:** every number the page states about a run is asserted by a test with those inputs.
- **Event-time consistency:** the animation's event list equals the model's events (times and order), so the
  picture cannot drift from the model.
