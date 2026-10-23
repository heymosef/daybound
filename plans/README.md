# Deferred feature designs

These features were explicitly deferred by the user and remain design work only:

- [Portable configuration export/import](010-portable-configuration.md).
- [Configurable working hours and overlap](011-working-hours-overlap.md).

Implementation needs separate authorization and updated product decisions.
Current behavior and maintenance constraints live in
[maintenance decisions](../docs/maintenance-decisions.md); repeatable offline
browser checks are in [browser testing](../docs/browser-testing.md).

Completed maintenance plans, intermediate reviews, request logs and screenshots
were removed after preserving current decisions. Their complete historical
snapshot is retained in Git at `6996580a91dc8582771ac091526eeb407a168f1a`.
For example: `git show 6996580:plans/README.md`.
