export const langgraphDiagrams: Record<string, string> = {
  'accounting-ai': `flowchart TD
    U([User Message]) --> MEM[Load AI Memory<br/>+ User Context]
    MEM --> A["AI Agent<br/>OpenAI · Gemini · GPT-5"]
    A --> R{Tool calls?}
    R -- No --> END([Response])
    R -- Yes --> T[Tool Node]
    T --> A

    subgraph TOOLS [Up to 82 Accounting Tools]
        direction LR
        T1[Invoices & KSeF]
        T2[HR & Payroll]
        T3[Payments & Tax]
        T4[Contractors]
        T5[Ledger & Declarations]
        T1 ~~~ T2 ~~~ T3 ~~~ T4 ~~~ T5
    end

    T --> TOOLS`,

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
  'legalka-kb': `flowchart TD
    U([Telegram Message]) --> BOT[Bot Front-end<br/>Language · Region · Commands]
    BOT --> R{Message type?}
    R -- Question --> RAG
    R -- /suggest --> SUG[Suggestion Flow<br/>PII guard → stage]
    R -- KB Review --> REV

    subgraph RAG [RAG Assistant · rag/]
        direction TB
        IDX[index.json<br/>kb/ embeddings] --> RET[Retrieve<br/>cosine top-K]
        RET --> J{Coverage?}
        J -- No --> ABS([Abstain<br/>не знаю])
        J -- Yes --> ANS[Answer<br/>норма · практика · citations]
    end

    subgraph REV [AI Revision Agent · LangGraph]
        direction TB
        L[loadPage] --> CI[classifyIntent]
        CI -- question --> AM[answerMsg]
        CI -- edit --> MP[makePlan]
        MP --> RB[reviseBody]
        RB --> CB[checkBody]
        CB -- invalid --> RB
        CB -- ok --> WF[writeFile]
        CB -- abort --> AB[abort]
    end

    subgraph PIPE [Practice Ingest Pipeline · LangGraph]
        direction TB
        IM[ingest_messages] --> TR[thread_reconstruct]
        TR --> EF[extract_facts · LLM]
        EF --> PG{pii_guard<br/>fail-closed}
        PG -- PII --> DROP([drop])
        PG -- clean --> CT[classify_topic]
        CT --> DM[dedup_merge]
        DM --> SF[stage_facts<br/>inbox/facts-*.md]
    end

    SF -. curator .-> IDX

    ANS --> END([Response + disclaimer])
    AM --> END
    WF --> END
    AB --> END
    SUG --> END`,
};
