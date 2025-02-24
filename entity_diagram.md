```mermaid
erDiagram
    COMPANY ||--|{ KEY-PERSON: has
    COMPANY ||--o{ ISSUE: has
    COMPANY ||--o{ INTERACTION: has
    GOVERNMENT-DEPARTMENT ||--o{ INTERACTION: has
```