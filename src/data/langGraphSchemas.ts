/**
 * Representative LangGraph workflow schemas for each AI product.
 *
 * These are illustrative graph definitions (Mermaid `graph` syntax) that
 * model how each product's AI agent orchestrates its steps — entry router,
 * processing nodes, tool calls, conditional edges and the terminal state.
 * They are derived from each product's documented capabilities and are meant
 * to communicate the architecture, not to mirror the source code line-for-line.
 *
 * Keyed by the product `id` used in products.json.
 */
export const langGraphSchemas: Record<string, string> = {
  'budget-assistant': `graph TD
    START([__start__]) --> router{Input Router}
    router -->|voice| transcribe[Voice Transcription]
    router -->|receipt| ocr[Receipt OCR Extraction]
    router -->|manual| parse[Parse Expense]
    router -->|question| chat[GPT-4 Finance Chat]
    transcribe --> parse
    ocr --> parse
    parse --> categorize[AI Categorization]
    categorize --> budget[Budget Limit Check]
    budget --> insights[Spending Insights & Stories]
    chat --> tools[(Finance Tools)]
    tools --> chat
    insights --> FINISH([__end__])
    chat --> FINISH
    classDef terminal fill:#1e3a8a,stroke:#1e3a8a,color:#fff;
    class START,FINISH terminal;`,

  'ngx-chat': `graph TD
    START([__start__]) --> input[Receive User Message]
    input --> request[Send to Open WebUI]
    request --> stream[Stream Tokens]
    stream --> render[Render Markdown]
    render --> more{More tokens?}
    more -->|yes| stream
    more -->|complete| wait{Await Next Turn}
    wait -->|new message| input
    wait -->|conversation closed| FINISH([__end__])
    classDef terminal fill:#1e3a8a,stroke:#1e3a8a,color:#fff;
    class START,FINISH terminal;`,

  'accounting-ai': `graph TD
    START([__start__]) --> intent{Intent Router}
    intent -->|tax question| kb[Retrieve Polish Tax Law]
    intent -->|invoice| invoice[Invoice Analysis]
    intent -->|data sync| wfirma[(wFirma API)]
    kb --> calc[Tax Calculation VAT / PIT / CIT]
    wfirma --> invoice
    invoice --> calc
    calc --> compliance{Compliance Check}
    compliance -->|needs more data| wfirma
    compliance -->|compliant| respond[Generate Answer]
    respond --> FINISH([__end__])
    classDef terminal fill:#16a34a,stroke:#16a34a,color:#fff;
    class START,FINISH terminal;`,

  'emarketing-ai': `graph TD
    START([__start__]) --> supervisor{Supervisor Agent}
    supervisor -->|content| content[Content Generator]
    supervisor -->|campaign| campaign[Campaign Planner]
    supervisor -->|email| email[Email Composer]
    supervisor -->|document| docs[Document Generator]
    supervisor -->|checklist| checklist[Checklist Generator]
    supervisor -->|analytics| analytics[Analytics Insights]
    content --> review{Review Gate}
    review -->|revise| content
    review -->|approved| publish[Publish / Save]
    campaign --> publish
    email --> publish
    docs --> publish
    checklist --> publish
    publish --> FINISH([__end__])
    analytics --> FINISH
    classDef terminal fill:#8b5cf6,stroke:#8b5cf6,color:#fff;
    class START,FINISH terminal;`,

  'testing-ai': `graph TD
    START([__start__]) --> orchestrator{Test Orchestrator}
    orchestrator -->|new code| analyze[Codebase Analysis]
    analyze --> generate[AI Test Generation]
    generate --> schedule[Schedule & Prioritize]
    orchestrator -->|run suite| schedule
    schedule --> execute[Parallel Test Execution]
    execute --> evaluate{Evaluate Results}
    evaluate -->|flaky / fail| retry[Smart Retry]
    retry --> execute
    evaluate -->|pass| coverage[Coverage Analysis]
    coverage --> checklist[Update Quality Checklist]
    checklist --> notify[Notify Team]
    notify --> FINISH([__end__])
    classDef terminal fill:#f59e0b,stroke:#f59e0b,color:#fff;
    class START,FINISH terminal;`,
};
