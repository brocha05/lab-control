# Relationships & ERD

> Preliminary. Cardinalities marked with an assumption ID are unvalidated.

## ERD

```mermaid
erDiagram
    TENANT ||--o{ USER : has
    TENANT ||--o{ CLIENT : has
    CLIENT ||--o{ PROJECT : "owns (A-02)"
    PROJECT ||--o{ PROJECT_TEST_CONFIGURATION : "configures ages (A-10)"
    PROJECT ||--o{ FIELD_RECORD : "has (A-03)"
    FIELD_RECORD ||--o{ SAMPLE : "yields (A-04)"
    SAMPLE ||--o{ SPECIMEN : "yields (A-04)"
    SPECIMEN ||--o{ SPECIMEN_TEST : "tested by (A-05: maybe 1:1)"
    PROJECT ||--o{ REPORT : "issues (A-07)"

    TENANT {
        uuid id PK
        text name
        text slug UK
        text timezone
    }
    USER {
        uuid id PK
        uuid tenant_id FK
        text email UK
        enum role "placeholder"
    }
    CLIENT {
        uuid id PK
        uuid tenant_id FK
        text name
    }
    PROJECT {
        uuid id PK
        uuid tenant_id FK
        uuid client_id FK
        text name
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
        date record_date "A-12"
    }
    SAMPLE {
        uuid id PK
        uuid tenant_id FK
        uuid field_record_id FK
    }
    SPECIMEN {
        uuid id PK
        uuid tenant_id FK
        uuid sample_id FK
        enum status
    }
    SPECIMEN_TEST {
        uuid id PK
        uuid tenant_id FK
        uuid specimen_id FK
        int age_days
        enum status
        timestamptz performed_at
    }
    REPORT {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        text template_key
        int version
        enum status
        jsonb snapshot
        text storage_key
    }
```

Every table except `TENANT` also references `TENANT` directly through `tenant_id`.
Those edges are omitted from the diagram for readability.

## Tenant-safe foreign keys

Each parent declares `UNIQUE (id, tenant_id)`. Each child references the parent with
**both** columns:

```sql
ALTER TABLE samples
  ADD CONSTRAINT samples_field_record_fk
  FOREIGN KEY (field_record_id, tenant_id)
  REFERENCES field_records (id, tenant_id);
```

In Prisma:

```prisma
fieldRecord FieldRecord @relation(fields: [fieldRecordId, tenantId], references: [id, tenantId])
```

Effect: inserting a Sample with tenant A's `tenant_id` and tenant B's
`field_record_id` fails at the database level.

## Delete behaviour

| Relation | On delete | Why |
|----------|-----------|-----|
| Project → ProjectTestConfiguration | Cascade | Pure configuration, owned by the project |
| Everything else | Restrict (default) | Records are cancelled, not deleted (A-24). Prevents accidental loss of history. |

## Cardinalities to validate

| Relation | Current | Possible after validation | Question |
|----------|---------|---------------------------|----------|
| Project → Client | N:1 | N:M (owner + contractor + supervisor?) | Q-41 |
| FieldRecord → Project | N:1 | — | Q-04 |
| FieldRecord → truck/delivery | (fields TBD) | 1:N separate entity | Q-05 |
| Specimen → SpecimenTest | 1:N | 1:1 | Q-16 |
| Report → Project | N:1 | Report → FieldRecord(s) / date range | Q-31 |
| Age reference date | on FieldRecord | on Sample | Q-18 |
