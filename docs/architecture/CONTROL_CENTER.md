# DIGITAL AI Control Center

The Control Center is the owner-facing operating layer for the company. It coordinates systems; it does not directly store credentials or replace the underlying services.

## Domains

| Domain | Owns | First capability |
|---|---|---|
| Company HQ | strategy, legal, finance, company documents | company profile and operating goals |
| AI Lab | licensed data, datasets, training, models, evaluation | dataset preparation and small-model training |
| Product Studio | web/mobile applications, APIs, releases | customer-facing API foundation |
| Team Hub | identities, roles, tasks, approvals | role-based access design |
| Customer Platform | accounts, usage, subscriptions, support | API-key and usage design |
| Security & Governance | audit trail, policies, privacy, incidents | data-license registry and access policy |

## Ownership boundaries

- `apps/` contains user-facing applications.
- `services/` contains independently deployable APIs and workers.
- `ml/` contains model and dataset lifecycle code; raw data is never served publicly.
- `packages/` contains shared contracts and SDKs.
- `infrastructure/` contains deployment and operational configuration.
- `governance/` contains policies, privacy, licensing, and model documentation.

## Security baseline

No cloud credentials, personal data, or production API keys belong in the repository. Every future control action must be authenticated, authorised by role, and recorded in an audit log.
