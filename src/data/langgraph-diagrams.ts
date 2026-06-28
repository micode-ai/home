export const langgraphDiagrams: Record<string, string> = {
  'accounting-ai': `flowchart TD
    U([User Message]) --> MEM[Load AI Memory<br/>+ User Context]
    MEM --> A["AI Agent<br/>OpenAI · Gemini · GPT-5"]
    A --> R{Tool calls?}
    R -- No --> END([Response])
    R -- Yes --> T[Tool Node]
    T --> A

    subgraph TOOLS [20+ Accounting Tools]
        direction LR
        T1[Invoices & KSeF]
        T2[HR & Payroll]
        T3[Payments & Tax]
        T4[Contractors]
        T5[Ledger & Declarations]
    end

    T --> T1
    T --> T2
    T --> T3
    T --> T4
    T --> T5`,

  'budget-assistant': `flowchart TD
    U([User Message]) --> CTX[Build Financial Context<br/>Balances · Transactions · Goals]
    CTX --> AI["OpenAI GPT<br/>Function Calling"]
    AI --> R{Action type?}
    R -- Direct Answer --> END([Response])
    R -- Read Action --> FETCH[Fetch Data from DB]
    FETCH --> FMT[Format & Narrate]
    FMT --> END
    R -- Write Action --> PEND[Create Pending Action<br/>Confirmation Request]
    PEND --> CONF{User confirms?}
    CONF -- Yes --> EXEC[Execute Action<br/>Create · Update · Delete]
    CONF -- No --> REJ[Reject Action]
    EXEC --> END
    REJ --> END`,

  'emarketing-ai': `flowchart TD
    U([User Message]) --> CHAT["Chat Agent<br/>GPT-4o + run_agent tool"]
    CHAT --> R{Dispatch specialist?}
    R -- Direct answer --> RESP([Response])
    R -- Yes --> TOOL[run_agent Tool<br/>HTTP → API]
    TOOL --> CHAT

    subgraph SPEC [7 Specialized LangGraph Agents]
        direction TB
        A1["CONTENT Agent<br/>loadContext → generate → reviewQuality → save"]
        A2["SEO Agent<br/>keywords · competitor · audit"]
        A3["EMAIL Agent<br/>campaigns · templates"]
        A4["CHECKLIST Agent<br/>analyze → generate → validate → refine"]
        A5["STRATEGY Agent<br/>go-to-market · positioning"]
        A6["ANALYTICS Agent<br/>reports · insights"]
        A7["DOCUMENT Agent<br/>plans · proposals"]
    end

    TOOL --> A1
    TOOL --> A2
    TOOL --> A3
    TOOL --> A4
    TOOL --> A5
    TOOL --> A6
    TOOL --> A7`,

  'testing-ai': `flowchart TD
    START([Code Change / PR]) --> SEL{Select Agent}

    SEL --> TG[Test Generator Agent]
    TG --> TGA[Analyze Code] --> TGB[Generate Tests] --> TGC[Validate Tests]
    TGC --> TGR{Valid?}
    TGR -- Refine --> TGD[Refine Tests] --> TGC
    TGR -- Done --> TGE([Test Files])

    SEL --> BD[Bug Detector Agent]
    BD --> BDA[Analyze Test Results] --> BDB[Analyze Code Diff] --> BDC[Cross-Reference] --> BDD([Bug Report])

    SEL --> CG[Checklist Generator Agent]
    CG --> CGA[Analyze App] --> CGB[Generate Checklist] --> CGC[Validate Checklist]
    CGC --> CGR{Valid?}
    CGR -- Refine --> CGD[Refine] --> CGC
    CGR -- Done --> CGE([Test Checklist])

    SEL --> CA[Coverage Advisor Agent]
    CA --> CAA[Analyze Coverage] --> CAB([Coverage Report])

    SEL --> FD[Flaky Detector Agent]
    FD --> FDA[Statistical Analysis] --> FDB[Pattern Detection] --> FDC([Recommendations])`,
};
