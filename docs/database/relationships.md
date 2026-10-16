# Relationships & ERD

> Preliminary, based on the first lab documents ([../domain/analysis/](../domain/analysis/README.md)).
> Cardinalities marked with an assumption ID are unvalidated. Only key columns are shown;
> the full column list is in [schema.md](schema.md).

## ERD

```mermaid
erDiagram
    TENANT ||--o{ USER : has
    TENANT ||--o{ CLIENT : has
    CLIENT ||--o{ PROJECT : "owns (A-02)"
    PROJECT ||--o{ PROJECT_TEST_CONFIGURATION : "default ages (Q-20)"
    TENANT ||--o{ HOLIDAY : "moves test dates (Q-21)"
    CONCRETE_SUPPLIER ||--o{ FIELD_RECORD : "supplies (Q-06)"
    CEMENT_TYPE ||--o{ FIELD_RECORD : "specified (Q-06)"
    PROJECT ||--o{ SAMPLE : "numbers (Q-57)"
    PROJECT ||--o{ SPECIMEN : "numbers (Q-58)"
    PROJECT ||--o{ FIELD_RECORD : "has (A-03)"
    FIELD_RECORD ||--o{ DELIVERY : "receives (A-60)"
    DELIVERY ||--o{ SAMPLE : "is sampled (A-61)"
    SAMPLE ||--o{ SPECIMEN : yields
    SPECIMEN ||--o{ SPECIMEN_TEST : "tested by (A-05: once in practice)"
    FIELD_RECORD ||--o{ REPORT : "issues (A-68)"

    TENANT {
        uuid id PK
        text slug UK
        text timezone
        text legal_name
    }
    USER {
        uuid id PK
        uuid tenant_id FK
        text email UK
        enum role "Q-39"
    }
    CLIENT {
        uuid id PK
        uuid tenant_id FK
        text name
        text code "MAR"
        text contact_name
    }
    PROJECT {
        uuid id PK
        uuid tenant_id FK
        uuid client_id FK
        text name
        text code "PVLT"
        text location
    }
    PROJECT_TEST_CONFIGURATION {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        int age_days
        int specimen_count
    }
    FIELD_RECORD {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        enum status
        int registry_sequence "MCH-068"
        int front_number "F1"
        date pour_date "age reference"
        numeric specified_strength_kg_cm2
        text cast_element
    }
    DELIVERY {
        uuid id PK
        uuid tenant_id FK
        uuid field_record_id FK
        int sequence
        text ticket_number
        numeric volume_m3
        numeric concrete_temperature_c
    }
    SAMPLE {
        uuid id PK
        uuid tenant_id FK
        uuid delivery_id FK
        text sample_number "102"
        enum specimen_type
        time molded_at
    }
    SPECIMEN {
        uuid id PK
        uuid tenant_id FK
        uuid sample_id FK
        enum status
        text specimen_number "405"
        text mold_code
    }
    SPECIMEN_TEST {
        uuid id PK
        uuid tenant_id FK
        uuid specimen_id FK
        int age_days
        enum status
        date test_date
        numeric max_load_kgf
    }
    REPORT {
        uuid id PK
        uuid tenant_id FK
        uuid field_record_id FK
        text template_key
        int version
        enum status
        text report_number
        jsonb snapshot
    }
```

Every table except `TENANT` also references `TENANT` directly through `tenant_id`.
Those edges are omitted from the diagram for readability.

## Tenant-safe foreign keys

Each parent declares `UNIQUE (id, tenant_id)`. Each child references the parent with
**both** columns:

```sql
ALTER TABLE samples
  ADD CONSTRAINT samples_delivery_fk
  FOREIGN KEY (delivery_id, tenant_id)
  REFERENCES deliveries (id, tenant_id);
```

In Prisma:

```prisma
delivery Delivery @relation(fields: [deliveryId, tenantId], references: [id, tenantId])
```

Effect: inserting a Sample with tenant A's `tenant_id` and tenant B's `delivery_id`
fails at the database level.

## Delete behaviour

| Relation | On delete | Why |
|----------|-----------|-----|
| Project → ProjectTestConfiguration | Cascade | Pure configuration, owned by the project |
| Everything else | Restrict (default) | Records are cancelled, not deleted (A-24). While a record is `DRAFT`, the service deletes its deliveries/samples/specimens explicitly. |

## Cardinalities to validate

| Relation | Current | Possible after validation | Question |
|----------|---------|---------------------------|----------|
| Project → Client | N:1 | — (confirmed, Q-41) | — |
| FieldRecord → Delivery | 1:N | — (7 per sheet, several sheets, Q-71/Q-77) | — |
| Delivery → Sample | 1:N | 1:1 | Q-71 |
| Specimen → SpecimenTest | 1:N | 1:1 (each specimen tested once, Q-16) | — |
| Report → FieldRecord | N:1 | — (confirmed: one page per sample, Q-71) | — |
| Test ages | project default + per-test edit | — (Q-20, Q-22) | — |
| Registro numbering | per project | per front | Q-79 |
