# Domain Language

- **Foundation packages** — the framework-neutral Core behavior package and
  its React and Solid adapters. They version together.
- **Foundation registry catalog** — consumer-owned Checkbox, Switch, Button,
  RadioGroup/Radio, Input, and Badge recipes for Core, React, and Solid.
- **Foundation RC** — a release candidate for the foundation packages and
  registry catalog. It does not publish or migrate companion packages.
- **Companion package** — an independently versioned, already-adopted product
  with higher-level convenience APIs. Dialog and Toast are companions.
- **Dialog primitive** — the compound overlay behavior in the foundation Core,
  React, and Solid packages.
- **Preview Dialog recipe** — the validated `registry/dialog` composition. It
  is not part of the starter catalog and does not replace the Dialog companion.
- **Recipe** — editable presentation and convenience source installed into and
  owned by the consuming application.
