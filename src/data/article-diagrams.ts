// Mermaid diagram definitions embedded in blog articles.
// Referenced from a post body via the `[[diagram:<id>]]` marker (see ArticlePage.svelte),
// rendered through MermaidDiagram.svelte. Keyed by a stable id, then by language.
//
// Labels are written for a general reader: no internal file/function/route names — just what
// each part does. The diagram structure/logic mirrors the project's technical docs.

type Lang = 'ru' | 'en' | 'pl';

export const articleDiagrams: Record<string, Record<Lang, string>> = {
  'legalka-system-overview': {
    ru: `flowchart TB
  subgraph Sources["Источники сообщества"]
    TG["Чаты и каналы<br/>в Telegram"]
  end
  subgraph Pipeline["Сборщик практики (LangGraph)"]
    direction LR
    ING["приём"] --> THR["сборка диалогов"] --> EXT["извлечение фактов (LLM)"]
    EXT --> PII["фильтр личных данных"] --> CLS["классификация темы"]
    CLS --> DED["дедупликация"] --> STG["подготовка<br/>фактов"]
  end
  subgraph KB["База знаний (сам продукт)"]
    NORM["слой «норма»<br/>(закон, со ссылками)"]
    PRAC["слой «практика»<br/>(сообщество, с датами)"]
  end
  subgraph RAG["Ассистент, отвечающий строго из базы"]
    IDX["индекс"] --> RET["поиск"] --> ANS["ответ<br/>норма/практика + ссылки + абстенция"]
  end
  subgraph Revise["Агент правок (LangGraph)"]
    REV["загрузка → план → правка →<br/>проверка → запись"]
  end
  subgraph Dash["Панель управления (для куратора)"]
    COL["Панель сбора"]
    REVIEW["Ревью и одобрение"]
  end
  TG --> ING
  STG -. "ручное продвижение" .-> PRAC
  Authoring["куратор + официальные источники"] --> NORM
  NORM --> IDX
  PRAC --> IDX
  ANS --> Users["Пользователи RU/UA/BE/PL/EN<br/>(Telegram-бот)"]
  Dash -->|данные| Pipeline
  Dash -->|данные| KB
  Dash -->|данные| RAG
  REVIEW --> REV
  REV --> KB`,
    en: `flowchart TB
  subgraph Sources["Community sources"]
    TG["Telegram<br/>chats & channels"]
  end
  subgraph Pipeline["Practice collector (LangGraph)"]
    direction LR
    ING["ingest"] --> THR["rebuild conversations"] --> EXT["extract facts (LLM)"]
    EXT --> PII["personal-data filter"] --> CLS["classify topic"]
    CLS --> DED["deduplicate"] --> STG["stage<br/>facts"]
  end
  subgraph KB["Knowledge base (the product)"]
    NORM["«norm» layer<br/>(law, sourced)"]
    PRAC["«practice» layer<br/>(community, dated)"]
  end
  subgraph RAG["Assistant answering strictly from the base"]
    IDX["index"] --> RET["retrieve"] --> ANS["answer<br/>norm/practice + links + abstention"]
  end
  subgraph Revise["Revision agent (LangGraph)"]
    REV["load → plan → revise →<br/>validate → write"]
  end
  subgraph Dash["Control panel (for the curator)"]
    COL["Collection panel"]
    REVIEW["Review & approval"]
  end
  TG --> ING
  STG -. "manual promotion" .-> PRAC
  Authoring["curator + official sources"] --> NORM
  NORM --> IDX
  PRAC --> IDX
  ANS --> Users["RU/UA/BE/PL/EN users<br/>(Telegram bot)"]
  Dash -->|data| Pipeline
  Dash -->|data| KB
  Dash -->|data| RAG
  REVIEW --> REV
  REV --> KB`,
    pl: `flowchart TB
  subgraph Sources["Źródła społeczności"]
    TG["Czaty i kanały<br/>na Telegramie"]
  end
  subgraph Pipeline["Kolektor praktyki (LangGraph)"]
    direction LR
    ING["odbiór"] --> THR["składanie rozmów"] --> EXT["ekstrakcja faktów (LLM)"]
    EXT --> PII["filtr danych osobowych"] --> CLS["klasyfikacja tematu"]
    CLS --> DED["deduplikacja"] --> STG["przygotowanie<br/>faktów"]
  end
  subgraph KB["Baza wiedzy (sam produkt)"]
    NORM["warstwa «norma»<br/>(prawo, ze źródłami)"]
    PRAC["warstwa «praktyka»<br/>(społeczność, z datami)"]
  end
  subgraph RAG["Asystent odpowiadający wyłącznie z bazy"]
    IDX["indeks"] --> RET["wyszukiwanie"] --> ANS["odpowiedź<br/>norma/praktyka + linki + abstencja"]
  end
  subgraph Revise["Agent poprawek (LangGraph)"]
    REV["wczytanie → plan → poprawka →<br/>walidacja → zapis"]
  end
  subgraph Dash["Panel sterowania (dla kuratora)"]
    COL["Panel zbierania"]
    REVIEW["Recenzja i zatwierdzanie"]
  end
  TG --> ING
  STG -. "ręczne przeniesienie" .-> PRAC
  Authoring["kurator + oficjalne źródła"] --> NORM
  NORM --> IDX
  PRAC --> IDX
  ANS --> Users["Użytkownicy RU/UA/BE/PL/EN<br/>(bot Telegram)"]
  Dash -->|dane| Pipeline
  Dash -->|dane| KB
  Dash -->|dane| RAG
  REVIEW --> REV
  REV --> KB`,
  },

  'legalka-monorepo': {
    ru: `flowchart LR
  ROOT["Проект Legalka"]
  ROOT --> KB["База знаний —<br/>страницы со ссылками на источники"]
  ROOT --> PIPE["Сборщик практики<br/>и агент правок"]
  ROOT --> RAGD["Ассистент<br/>и Telegram-бот"]
  ROOT --> DASH["Панель управления"]
  ROOT --> EVAL["Набор проверочных<br/>вопросов"]
  ROOT --> INBOX["Входящие: вопросы<br/>и черновики фактов"]
  ROOT --> DOCS["Документация"]
  ROOT --> CLAUDE["Инструменты команды"]`,
    en: `flowchart LR
  ROOT["The Legalka project"]
  ROOT --> KB["Knowledge base —<br/>pages with sourced claims"]
  ROOT --> PIPE["Practice collector<br/>and revision agent"]
  ROOT --> RAGD["Assistant<br/>and Telegram bot"]
  ROOT --> DASH["Control panel"]
  ROOT --> EVAL["Set of<br/>regression questions"]
  ROOT --> INBOX["Inbox: questions<br/>and draft facts"]
  ROOT --> DOCS["Documentation"]
  ROOT --> CLAUDE["Team tooling"]`,
    pl: `flowchart LR
  ROOT["Projekt Legalka"]
  ROOT --> KB["Baza wiedzy —<br/>strony ze źródłami"]
  ROOT --> PIPE["Kolektor praktyki<br/>i agent poprawek"]
  ROOT --> RAGD["Asystent<br/>i bot Telegram"]
  ROOT --> DASH["Panel sterowania"]
  ROOT --> EVAL["Zestaw pytań<br/>regresyjnych"]
  ROOT --> INBOX["Skrzynka: pytania<br/>i szkice faktów"]
  ROOT --> DOCS["Dokumentacja"]
  ROOT --> CLAUDE["Narzędzia zespołu"]`,
  },

  'legalka-page-lifecycle': {
    ru: `stateDiagram-v2
  state "черновик" as draft
  state "проверено — практика" as vp
  state "проверено — норма" as vn
  [*] --> draft: создаёт куратор
  draft --> draft: правки
  draft --> vp: ревью куратора
  draft --> vn: ревью юриста
  vp --> [*]
  vn --> [*]
  note right of draft
    Правки вносит ИИ или куратор вручную.
    Черновики бот тоже показывает,
    но честно помечает их
    как ещё не проверенные
  end note`,
    en: `stateDiagram-v2
  state "draft" as draft
  state "verified — practice" as vp
  state "verified — norm" as vn
  [*] --> draft: created by curator
  draft --> draft: edits
  draft --> vp: curator review
  draft --> vn: lawyer review
  vp --> [*]
  vn --> [*]
  note right of draft
    Edits come from the AI or the curator by hand.
    The bot still shows drafts,
    but honestly marks them
    as not yet verified
  end note`,
    pl: `stateDiagram-v2
  state "szkic" as draft
  state "zweryfikowane — praktyka" as vp
  state "zweryfikowane — norma" as vn
  [*] --> draft: tworzy kurator
  draft --> draft: poprawki
  draft --> vp: recenzja kuratora
  draft --> vn: recenzja prawnika
  vp --> [*]
  vn --> [*]
  note right of draft
    Poprawki wprowadza AI albo kurator ręcznie.
    Bot pokazuje też szkice,
    ale uczciwie oznacza je
    jako jeszcze niezweryfikowane
  end note`,
  },

  'legalka-collection-pipeline': {
    ru: `flowchart LR
  A["Приём сообщений"] --> B["Сборка диалогов"]
  B --> C["Извлечение фактов (LLM)"]
  C --> D{"Фильтр личных данных"}
  D -->|чисто| E["Классификация темы"]
  D -->|есть личные данные| X["Отбросить"]
  E --> F["Дедупликация"]
  F --> G["Подготовка фактов<br/>к проверке"]`,
    en: `flowchart LR
  A["Ingest messages"] --> B["Rebuild conversations"]
  B --> C["Extract facts (LLM)"]
  C --> D{"Personal-data filter"}
  D -->|clean| E["Classify topic"]
  D -->|has personal data| X["Drop"]
  E --> F["Deduplicate"]
  F --> G["Stage facts<br/>for review"]`,
    pl: `flowchart LR
  A["Odbiór wiadomości"] --> B["Składanie rozmów"]
  B --> C["Ekstrakcja faktów (LLM)"]
  C --> D{"Filtr danych osobowych"}
  D -->|czysto| E["Klasyfikacja tematu"]
  D -->|są dane osobowe| X["Odrzuć"]
  E --> F["Deduplikacja"]
  F --> G["Przygotowanie faktów<br/>do recenzji"]`,
  },

  'legalka-answer-flow': {
    ru: `flowchart TB
  Q["Вопрос пользователя<br/>(текст или голос)"] --> CQ["Переформулирование:<br/>уточняющий вопрос → самостоятельный запрос"]
  CQ --> R["Поиск: ближайшие по смыслу<br/>разделы базы + приоритет воеводства"]
  R --> G{"Оценка релевантности"}
  G -->|"слишком низкое совпадение<br/>или ничего не найдено"| AB["Абстенция:<br/>«не знаю»"]
  G -->|"совпадение уверенно высокое"| A
  G -->|"иначе"| V{"Проверка моделью<br/>по исходному вопросу"}
  V -->|нерелевантно| AB
  V -->|релевантно| A["Ответ<br/>метки норма/практика + ссылки"]
  A --> DIS["+ дисклеймер"]
  AB --> DIS
  DIS --> REC["Запись ответа<br/>(без личных данных)"]
  REC --> FB["👍/👎 привязаны<br/>к этому ответу"]`,
    en: `flowchart TB
  Q["User question<br/>(text or voice)"] --> CQ["Rephrasing:<br/>follow-up → standalone query"]
  CQ --> R["Retrieval: closest sections<br/>of the base + voivodeship boost"]
  R --> G{"Relevance scoring"}
  G -->|"match too low<br/>or nothing found"| AB["Abstain:<br/>«I don't know»"]
  G -->|"match confidently high"| A
  G -->|"otherwise"| V{"Model check<br/>on the raw question"}
  V -->|not relevant| AB
  V -->|relevant| A["Answer<br/>norm/practice labels + links"]
  A --> DIS["+ disclaimer"]
  AB --> DIS
  DIS --> REC["Record the answer<br/>(no personal data)"]
  REC --> FB["👍/👎 attached<br/>to this answer"]`,
    pl: `flowchart TB
  Q["Pytanie użytkownika<br/>(tekst lub głos)"] --> CQ["Przeformułowanie:<br/>pytanie odsyłające → samodzielne zapytanie"]
  CQ --> R["Wyszukiwanie: najbliższe znaczeniowo<br/>sekcje bazy + priorytet województwa"]
  R --> G{"Ocena trafności"}
  G -->|"dopasowanie zbyt niskie<br/>lub brak wyników"| AB["Abstencja:<br/>«nie wiem»"]
  G -->|"dopasowanie pewnie wysokie"| A
  G -->|"w innym razie"| V{"Sprawdzenie przez model<br/>wg pierwotnego pytania"}
  V -->|nietrafne| AB
  V -->|trafne| A["Odpowiedź<br/>etykiety norma/praktyka + linki"]
  A --> DIS["+ zastrzeżenie"]
  AB --> DIS
  DIS --> REC["Zapis odpowiedzi<br/>(bez danych osobowych)"]
  REC --> FB["👍/👎 powiązane<br/>z tą odpowiedzią"]`,
  },

  'legalka-bot-features': {
    ru: `flowchart TB
  subgraph In["Ввод пользователя"]
    T["текстовый вопрос"]
    Vc["голосовое сообщение"]
    Cmd["команды"]
  end
  subgraph Core["Ответ строго из базы"]
    ANSW["ответ + метки норма/практика<br/>+ ссылки + дисклеймер"]
  end
  Vc -->|распознавание речи| T
  T --> ANSW
  ANSW --> Buttons["инлайн-кнопки под ответом"]
  Buttons --> B1["👍 / 👎 обратная связь"]
  Buttons --> B2["🔊 озвучить"]
  Buttons --> B3["✍️ предложить правку"]
  Buttons --> B4["📍 показать на карте<br/>(если польский адрес)"]
  Buttons --> B5["🔔 лист ожидания по региону"]
  Buttons --> B6["📋 создать чек-лист"]
  Cmd --> C1["/topics — обзор разделов базы"]
  Cmd --> C2["/checklist — личные списки"]
  Cmd --> C3["/region — воеводство"]
  Cmd --> C4["/lang — язык интерфейса и ответов"]
  Cmd --> C5["/new, /chats, /reset —<br/>память по чатам"]`,
    en: `flowchart TB
  subgraph In["User input"]
    T["text question"]
    Vc["voice message"]
    Cmd["commands"]
  end
  subgraph Core["Answer strictly from the base"]
    ANSW["answer + norm/practice labels<br/>+ links + disclaimer"]
  end
  Vc -->|speech recognition| T
  T --> ANSW
  ANSW --> Buttons["inline buttons under the answer"]
  Buttons --> B1["👍 / 👎 feedback"]
  Buttons --> B2["🔊 read aloud"]
  Buttons --> B3["✍️ suggest an edit"]
  Buttons --> B4["📍 show on map<br/>(if a Polish address)"]
  Buttons --> B5["🔔 region waitlist"]
  Buttons --> B6["📋 create a checklist"]
  Cmd --> C1["/topics — browse the base"]
  Cmd --> C2["/checklist — personal lists"]
  Cmd --> C3["/region — voivodeship"]
  Cmd --> C4["/lang — interface & answer language"]
  Cmd --> C5["/new, /chats, /reset —<br/>multi-chat memory"]`,
    pl: `flowchart TB
  subgraph In["Wejście użytkownika"]
    T["pytanie tekstowe"]
    Vc["wiadomość głosowa"]
    Cmd["komendy"]
  end
  subgraph Core["Odpowiedź wyłącznie z bazy"]
    ANSW["odpowiedź + etykiety norma/praktyka<br/>+ linki + zastrzeżenie"]
  end
  Vc -->|rozpoznawanie mowy| T
  T --> ANSW
  ANSW --> Buttons["przyciski pod odpowiedzią"]
  Buttons --> B1["👍 / 👎 opinia"]
  Buttons --> B2["🔊 odczytaj na głos"]
  Buttons --> B3["✍️ zaproponuj poprawkę"]
  Buttons --> B4["📍 pokaż na mapie<br/>(jeśli polski adres)"]
  Buttons --> B5["🔔 lista oczekujących dla regionu"]
  Buttons --> B6["📋 utwórz listę kontrolną"]
  Cmd --> C1["/topics — przegląd bazy"]
  Cmd --> C2["/checklist — osobiste listy"]
  Cmd --> C3["/region — województwo"]
  Cmd --> C4["/lang — język interfejsu i odpowiedzi"]
  Cmd --> C5["/new, /chats, /reset —<br/>pamięć wielu czatów"]`,
  },

  'legalka-revision-agent': {
    ru: `flowchart LR
  S((сообщение куратора)) --> L["Загрузка страницы"]
  L --> C{"Что это:<br/>вопрос или правка?"}
  C -->|вопрос| AN["Ответ по странице<br/>(без изменений в файле)"]
  C -->|правка| P["Минимальный план<br/>изменений"]
  P --> RV["Переписать только<br/>текст страницы"]
  RV --> V{"Проверка: разделы целы?<br/>текст не обрезан?"}
  V -->|"нужна доработка<br/>(до 2 попыток)"| RV
  V -->|ок| W["Сохранить<br/>+ отметка в истории"]
  AN --> E((конец))
  W --> E`,
    en: `flowchart LR
  S((message from curator)) --> L["Load the page"]
  L --> C{"What is it:<br/>a question or an edit?"}
  C -->|question| AN["Answer from the page<br/>(no file change)"]
  C -->|edit| P["Minimal change<br/>plan"]
  P --> RV["Rewrite only<br/>the page text"]
  RV --> V{"Check: sections intact?<br/>text not truncated?"}
  V -->|"needs rework<br/>(up to 2 tries)"| RV
  V -->|ok| W["Save<br/>+ note in the history"]
  AN --> E((end))
  W --> E`,
    pl: `flowchart LR
  S((wiadomość kuratora)) --> L["Wczytanie strony"]
  L --> C{"Co to jest:<br/>pytanie czy poprawka?"}
  C -->|pytanie| AN["Odpowiedź ze strony<br/>(bez zmiany pliku)"]
  C -->|poprawka| P["Minimalny plan<br/>zmian"]
  P --> RV["Przepisz tylko<br/>tekst strony"]
  RV --> V{"Kontrola: sekcje całe?<br/>tekst nieucięty?"}
  V -->|"wymaga poprawy<br/>(do 2 prób)"| RV
  V -->|ok| W["Zapis<br/>+ wpis w historii"]
  AN --> E((koniec))
  W --> E`,
  },

  'legalka-dashboard': {
    ru: `flowchart LR
  subgraph UI["Панель управления (3 вкладки)"]
    COL["Вкладка «Сбор»"]
    REV["Вкладка «Ревью»"]
    SIG["Вкладка «Предложения»"]
  end
  subgraph API["Что делает панель"]
    S1["Статус сбора и факты"]
    S2["Управление каналами и запуском"]
    S3["Список и содержимое страниц"]
    S4["Спросить бота"]
    S5["Одобрить / вернуть страницу"]
    S6["Диалог-правка с ИИ (+ отмена)"]
    S7["Сигналы: предложения,<br/>отзывы, ожидание регионов"]
  end
  COL --> S1 & S2
  REV --> S3 & S4 & S5 & S6
  SIG --> S7
  S4 -->|запустить поиск| RAGcli["Бот"]
  S6 -->|запустить правку| REVcli["Агент правок"]
  S5 -->|записать одобрение| KBfiles["Файлы базы"]
  S6 -->|показать изменения| KBfiles
  S7 -->|"только чтение, без личных данных"| Signals["Входящие сигналы"]`,
    en: `flowchart LR
  subgraph UI["Control panel (3 tabs)"]
    COL["«Collection» tab"]
    REV["«Review» tab"]
    SIG["«Suggestions» tab"]
  end
  subgraph API["What the panel does"]
    S1["Collection status & facts"]
    S2["Manage channels & runs"]
    S3["Page list & content"]
    S4["Ask the bot"]
    S5["Approve / return a page"]
    S6["AI edit dialogue (+ undo)"]
    S7["Signals: suggestions,<br/>feedback, region waitlist"]
  end
  COL --> S1 & S2
  REV --> S3 & S4 & S5 & S6
  SIG --> S7
  S4 -->|run retrieval| RAGcli["Bot"]
  S6 -->|run an edit| REVcli["Revision agent"]
  S5 -->|write approval| KBfiles["Base files"]
  S6 -->|show changes| KBfiles
  S7 -->|"read-only, no personal data"| Signals["Incoming signals"]`,
    pl: `flowchart LR
  subgraph UI["Panel sterowania (3 zakładki)"]
    COL["Zakładka «Zbieranie»"]
    REV["Zakładka «Recenzja»"]
    SIG["Zakładka «Sugestie»"]
  end
  subgraph API["Co robi panel"]
    S1["Status zbierania i fakty"]
    S2["Zarządzanie kanałami i uruchomieniem"]
    S3["Lista i treść stron"]
    S4["Zapytaj bota"]
    S5["Zatwierdź / zwróć stronę"]
    S6["Dialog-poprawka z AI (+ cofnij)"]
    S7["Sygnały: sugestie,<br/>opinie, oczekiwanie regionów"]
  end
  COL --> S1 & S2
  REV --> S3 & S4 & S5 & S6
  SIG --> S7
  S4 -->|uruchom wyszukiwanie| RAGcli["Bot"]
  S6 -->|uruchom poprawkę| REVcli["Agent poprawek"]
  S5 -->|zapisz zatwierdzenie| KBfiles["Pliki bazy"]
  S6 -->|pokaż zmiany| KBfiles
  S7 -->|"tylko odczyt, bez danych osobowych"| Signals["Przychodzące sygnały"]`,
  },

  'legalka-review-sequence': {
    ru: `sequenceDiagram
  actor Reviewer as Ревьюер
  participant UI as Панель ревью
  participant API as Сервер
  participant RAGcli as Бот
  participant Agent as Агент правок
  participant FS as Файлы базы (git)
  Reviewer->>UI: выбрать страницу
  UI->>API: запросить страницу
  API-->>UI: текст + источники + вопросы
  opt Посмотреть ответ бота
    UI->>API: спросить бота
    API->>RAGcli: запустить поиск
    RAGcli-->>UI: ответ + ссылки
  end
  opt Правка ИИ
    Reviewer->>UI: комментарий + «Исправить с ИИ»
    UI->>API: запустить правку
    API->>Agent: передать задачу
    Agent->>FS: записать переписанный текст
    API-->>UI: показать изменения
    alt принять
      Reviewer->>UI: «Принять»
    else откатить
      UI->>API: откатить
      API->>FS: вернуть прежнюю версию
    end
  end
  Reviewer->>UI: роль (куратор/юрист) + «Одобрить»
  UI->>API: записать одобрение
  API->>FS: пометка «проверено» + запись в истории`,
    en: `sequenceDiagram
  actor Reviewer as Reviewer
  participant UI as Review panel
  participant API as Server
  participant RAGcli as Bot
  participant Agent as Revision agent
  participant FS as Base files (git)
  Reviewer->>UI: pick a page
  UI->>API: request the page
  API-->>UI: text + sources + questions
  opt See the bot's answer
    UI->>API: ask the bot
    API->>RAGcli: run retrieval
    RAGcli-->>UI: answer + links
  end
  opt AI edit
    Reviewer->>UI: comment + «Fix with AI»
    UI->>API: run the edit
    API->>Agent: hand off the task
    Agent->>FS: write the rewritten text
    API-->>UI: show the changes
    alt accept
      Reviewer->>UI: «Accept»
    else revert
      UI->>API: revert
      API->>FS: restore previous version
    end
  end
  Reviewer->>UI: role (curator/lawyer) + «Approve»
  UI->>API: write the approval
  API->>FS: mark «verified» + history entry`,
    pl: `sequenceDiagram
  actor Reviewer as Recenzent
  participant UI as Panel recenzji
  participant API as Serwer
  participant RAGcli as Bot
  participant Agent as Agent poprawek
  participant FS as Pliki bazy (git)
  Reviewer->>UI: wybierz stronę
  UI->>API: poproś o stronę
  API-->>UI: tekst + źródła + pytania
  opt Zobacz odpowiedź bota
    UI->>API: zapytaj bota
    API->>RAGcli: uruchom wyszukiwanie
    RAGcli-->>UI: odpowiedź + linki
  end
  opt Poprawka AI
    Reviewer->>UI: komentarz + «Popraw z AI»
    UI->>API: uruchom poprawkę
    API->>Agent: przekaż zadanie
    Agent->>FS: zapisz przepisany tekst
    API-->>UI: pokaż zmiany
    alt zaakceptuj
      Reviewer->>UI: «Akceptuj»
    else wycofaj
      UI->>API: wycofaj
      API->>FS: przywróć poprzednią wersję
    end
  end
  Reviewer->>UI: rola (kurator/prawnik) + «Zatwierdź»
  UI->>API: zapisz zatwierdzenie
  API->>FS: oznaczenie «zweryfikowane» + wpis w historii`,
  },

  'legalka-collection-tab': {
    ru: `flowchart LR
  ST["Статус загрузки<br/>состояние · дата · текущий канал ·<br/>пауза Telegram · прогресс · лог"]
  CH["Каналы<br/>✓ готов / ⏳ идёт / ◑ частично /<br/>○ ожидает / — н/д"]
  CTL["Управление<br/>дата · ▶ запустить · ■ остановить"]
  FACT["Хранилища и факты<br/>месяц · тема ·<br/>сколько сообщений подтверждают факт"]`,
    en: `flowchart LR
  ST["Loading status<br/>state · date · current channel ·<br/>Telegram pause · progress · log"]
  CH["Channels<br/>✓ done / ⏳ running / ◑ partial /<br/>○ waiting / — n/a"]
  CTL["Controls<br/>date · ▶ start · ■ stop"]
  FACT["Stores & facts<br/>month · topic ·<br/>how many messages support a fact"]`,
    pl: `flowchart LR
  ST["Status ładowania<br/>stan · data · bieżący kanał ·<br/>pauza Telegram · postęp · log"]
  CH["Kanały<br/>✓ gotowy / ⏳ trwa / ◑ częściowo /<br/>○ oczekuje / — n/d"]
  CTL["Sterowanie<br/>data · ▶ start · ■ stop"]
  FACT["Magazyny i fakty<br/>miesiąc · temat ·<br/>ile wiadomości potwierdza fakt"]`,
  },

  'legalka-review-tab': {
    ru: `flowchart LR
  L["Список страниц<br/>фильтры: статус / слой / тема + поиск<br/>счётчики: черновики / проверенные"]
  D["Детали страницы<br/>текст · источники · проверочные вопросы"]
  A["Действия<br/>роль: куратор / юрист<br/>Спросить бота · ✓ Одобрить ·<br/>↩ Вернуть · Исправить с ИИ"]
  L --> D --> A`,
    en: `flowchart LR
  L["Page list<br/>filters: status / layer / topic + search<br/>counters: drafts / verified"]
  D["Page detail<br/>text · sources · review questions"]
  A["Actions<br/>role: curator / lawyer<br/>Ask the bot · ✓ Approve ·<br/>↩ Return · Fix with AI"]
  L --> D --> A`,
    pl: `flowchart LR
  L["Lista stron<br/>filtry: status / warstwa / temat + szukaj<br/>liczniki: szkice / zweryfikowane"]
  D["Szczegóły strony<br/>tekst · źródła · pytania kontrolne"]
  A["Akcje<br/>rola: kurator / prawnik<br/>Zapytaj bota · ✓ Zatwierdź ·<br/>↩ Zwróć · Popraw z AI"]
  L --> D --> A`,
  },

  'legalka-revision-dialogue': {
    ru: `sequenceDiagram
  actor You as Вы
  participant Chat as Диалог с ИИ
  participant Agent as Агент
  participant FS as Файлы базы (git)
  You->>Chat: «что тут написано про X?»
  Chat->>Agent: это вопрос
  Agent-->>Chat: ответ (файл не меняется)
  You->>Chat: «добавь пункт про Y»
  Chat->>Agent: это правка
  Agent->>FS: переписать текст (служебные поля не тронуты)
  Agent-->>Chat: итог + изменения, страница обновляется
  opt отмена
    You->>Chat: «Отменить» правку
    Chat->>FS: вернуть версию до правки
  end`,
    en: `sequenceDiagram
  actor You as You
  participant Chat as AI dialogue
  participant Agent as Agent
  participant FS as Base files (git)
  You->>Chat: «what does this say about X?»
  Chat->>Agent: this is a question
  Agent-->>Chat: answer (file unchanged)
  You->>Chat: «add a point about Y»
  Chat->>Agent: this is an edit
  Agent->>FS: rewrite the text (service fields untouched)
  Agent-->>Chat: summary + changes, the page refreshes
  opt undo
    You->>Chat: «Undo» the edit
    Chat->>FS: restore the pre-edit version
  end`,
    pl: `sequenceDiagram
  actor You as Ty
  participant Chat as Dialog z AI
  participant Agent as Agent
  participant FS as Pliki bazy (git)
  You->>Chat: «co tu jest napisane o X?»
  Chat->>Agent: to jest pytanie
  Agent-->>Chat: odpowiedź (plik bez zmian)
  You->>Chat: «dodaj punkt o Y»
  Chat->>Agent: to jest poprawka
  Agent->>FS: przepisz tekst (pola służbowe nietknięte)
  Agent-->>Chat: podsumowanie + zmiany, strona się odświeża
  opt cofnięcie
    You->>Chat: «Cofnij» poprawkę
    Chat->>FS: przywróć wersję sprzed poprawki
  end`,
  },

  'legalka-end-to-end': {
    ru: `flowchart LR
  C["Сбор фактов<br/>(из чатов)"] --> P["Продвинуть практику /<br/>написать норму (черновик)"]
  P --> R["Ревью<br/>читать · спросить бота · править с ИИ"]
  R -->|одобрить| V["Проверено"]
  R -->|вернуть| P
  V --> COMMIT["Зафиксировать изменения"]
  COMMIT --> REINDEX["Переиндексация<br/>и прогон тестов"]`,
    en: `flowchart LR
  C["Collect facts<br/>(from chats)"] --> P["Promote practice /<br/>write a norm (draft)"]
  P --> R["Review<br/>read · ask the bot · fix with AI"]
  R -->|approve| V["Verified"]
  R -->|return| P
  V --> COMMIT["Commit the changes"]
  COMMIT --> REINDEX["Re-index<br/>and run the tests"]`,
    pl: `flowchart LR
  C["Zbieranie faktów<br/>(z czatów)"] --> P["Przenieś praktykę /<br/>napisz normę (szkic)"]
  P --> R["Recenzja<br/>czytaj · zapytaj bota · popraw z AI"]
  R -->|zatwierdź| V["Zweryfikowane"]
  R -->|zwróć| P
  V --> COMMIT["Zapisz zmiany"]
  COMMIT --> REINDEX["Ponowne indeksowanie<br/>i uruchomienie testów"]`,
  },

  'accounting-system-overview': {
    ru: `flowchart TB
  subgraph Clients["Как обращаются к агенту"]
    WEB["Веб-кабинет<br/>(Next.js)"]
    TG["Telegram-бот"]
  end
  subgraph Core["Сервер и ИИ"]
    API["Сервер (API)<br/>вход · права · проверки"]
    AGENT["ИИ-агент<br/>(один, на LangGraph)"]
    OCR["Распознавание чеков<br/>(GPT-4o vision)"]
  end
  subgraph Integrations["Интеграции с внешним миром"]
    WF["wFirma<br/>счета · компания · платежи"]
    KSEF["KSeF<br/>гос. э-счета — FA(3)"]
    REG["Польские реестры<br/>Biała Lista MF · KRS"]
  end
  subgraph Data["Хранение"]
    PG["PostgreSQL<br/>данные · память ИИ"]
    RED["Redis<br/>сессии · лимиты"]
  end
  WEB --> API
  TG --> API
  TG --> OCR
  API --> AGENT
  AGENT --> WF
  AGENT --> KSEF
  AGENT --> REG
  API --> PG
  API --> RED
  WF --> PG`,
    en: `flowchart TB
  subgraph Clients["How users reach the agent"]
    WEB["Web app<br/>(Next.js)"]
    TG["Telegram bot"]
  end
  subgraph Core["Server & AI"]
    API["Server (API)<br/>auth · permissions · checks"]
    AGENT["AI agent<br/>(single, on LangGraph)"]
    OCR["Receipt OCR<br/>(GPT-4o vision)"]
  end
  subgraph Integrations["Integrations with the outside world"]
    WF["wFirma<br/>invoices · company · payments"]
    KSEF["KSeF<br/>government e-invoices — FA(3)"]
    REG["Polish registries<br/>Biała Lista MF · KRS"]
  end
  subgraph Data["Storage"]
    PG["PostgreSQL<br/>data · AI memory"]
    RED["Redis<br/>sessions · limits"]
  end
  WEB --> API
  TG --> API
  TG --> OCR
  API --> AGENT
  AGENT --> WF
  AGENT --> KSEF
  AGENT --> REG
  API --> PG
  API --> RED
  WF --> PG`,
    pl: `flowchart TB
  subgraph Clients["Jak użytkownicy trafiają do agenta"]
    WEB["Aplikacja web<br/>(Next.js)"]
    TG["Bot Telegram"]
  end
  subgraph Core["Serwer i AI"]
    API["Serwer (API)<br/>logowanie · uprawnienia · walidacja"]
    AGENT["Agent AI<br/>(jeden, na LangGraph)"]
    OCR["Rozpoznawanie paragonów<br/>(GPT-4o vision)"]
  end
  subgraph Integrations["Integracje ze światem zewnętrznym"]
    WF["wFirma<br/>faktury · firma · płatności"]
    KSEF["KSeF<br/>rządowe e-faktury — FA(3)"]
    REG["Polskie rejestry<br/>Biała Lista MF · KRS"]
  end
  subgraph Data["Przechowywanie"]
    PG["PostgreSQL<br/>dane · pamięć AI"]
    RED["Redis<br/>sesje · limity"]
  end
  WEB --> API
  TG --> API
  TG --> OCR
  API --> AGENT
  AGENT --> WF
  AGENT --> KSEF
  AGENT --> REG
  API --> PG
  API --> RED
  WF --> PG`,
  },

  'accounting-agent-loop': {
    ru: `stateDiagram-v2
  state "ИИ-агент (модель)" as A
  state "Инструменты" as T
  state C <<choice>>
  [*] --> A: сообщение пользователя
  A --> C: ответ модели
  C --> T: есть вызовы инструментов
  C --> [*]: готовый ответ (без вызовов)
  T --> A: результаты добавлены в диалог
  note right of A
    Модель с привязанными
    инструментами
  end note
  note right of T
    Инструменты выполняются и
    возвращают данные из wFirma,
    KSeF и реестров
  end note`,
    en: `stateDiagram-v2
  state "AI agent (model)" as A
  state "Tools" as T
  state C <<choice>>
  [*] --> A: user message
  A --> C: model response
  C --> T: has tool calls
  C --> [*]: final answer (no calls)
  T --> A: results appended to the dialogue
  note right of A
    The model with
    bound tools
  end note
  note right of T
    Tools run and return
    data from wFirma,
    KSeF and registries
  end note`,
    pl: `stateDiagram-v2
  state "Agent AI (model)" as A
  state "Narzędzia" as T
  state C <<choice>>
  [*] --> A: wiadomość użytkownika
  A --> C: odpowiedź modelu
  C --> T: są wywołania narzędzi
  C --> [*]: gotowa odpowiedź (bez wywołań)
  T --> A: wyniki dołączone do rozmowy
  note right of A
    Model z podpiętymi
    narzędziami
  end note
  note right of T
    Narzędzia działają i zwracają
    dane z wFirma,
    KSeF i rejestrów
  end note`,
  },

  'accounting-message-pipeline': {
    ru: `flowchart TB
  A["Пользователь отправил сообщение"] --> B["Взять ключ модели<br/>пользователя"]
  B --> C["Создать модель<br/>(OpenAI или Google Gemini)"]
  C --> D["Определить язык<br/>по тексту (ru / pl / en)"]
  D --> E["Подгрузить долгую память<br/>о бизнесе пользователя"]
  E --> F["Собрать системный промпт<br/>роль + язык + правила + налоги + память"]
  F --> G["Подключить инструменты<br/>58, а с HR и KSeF — до 82"]
  G --> H["Запустить агента<br/>(цикл рассуждение — инструменты)"]
  H --> I["Сохранить переписку"]
  I --> J["Обновить память<br/>(в фоне)"]
  I --> K["Озвучить ответ<br/>(в фоне, по желанию)"]`,
    en: `flowchart TB
  A["User sends a message"] --> B["Take the user's<br/>model API key"]
  B --> C["Create the model<br/>(OpenAI or Google Gemini)"]
  C --> D["Detect language<br/>from the text (ru / pl / en)"]
  D --> E["Load long-term memory<br/>about the user's business"]
  E --> F["Build the system prompt<br/>role + language + rules + tax + memory"]
  F --> G["Bind the tools<br/>58, up to 82 with HR and KSeF"]
  G --> H["Run the agent<br/>(reason — tools loop)"]
  H --> I["Save the conversation"]
  I --> J["Update memory<br/>(in the background)"]
  I --> K["Voice the answer<br/>(background, optional)"]`,
    pl: `flowchart TB
  A["Użytkownik wysyła wiadomość"] --> B["Pobierz klucz modelu<br/>użytkownika"]
  B --> C["Utwórz model<br/>(OpenAI lub Google Gemini)"]
  C --> D["Wykryj język<br/>z tekstu (ru / pl / en)"]
  D --> E["Wczytaj pamięć długoterminową<br/>o firmie użytkownika"]
  E --> F["Zbuduj prompt systemowy<br/>rola + język + reguły + podatki + pamięć"]
  F --> G["Podłącz narzędzia<br/>58, a z HR i KSeF — do 82"]
  G --> H["Uruchom agenta<br/>(pętla rozumowanie — narzędzia)"]
  H --> I["Zapisz rozmowę"]
  I --> J["Zaktualizuj pamięć<br/>(w tle)"]
  I --> K["Odczytaj odpowiedź<br/>(w tle, opcjonalnie)"]`,
  },

  'accounting-tools-map': {
    ru: `flowchart LR
  AGENT(["ИИ-агент выбирает нужные инструменты"])
  subgraph BASE["Всегда доступно — 58 инструментов"]
    direction TB
    T1["Компания и контрагенты<br/>поиск по NIP, реестры"]
    T2["Счета и продажи<br/>создать · отправить · PDF"]
    T3["Платежи и расходы"]
    T4["Налоги: KPiR · JPK_VAT · PIT"]
    T5["Календарь налоговых сроков"]
    T6["Белый список счетов (Biała Lista)"]
    T7["Документы · книги · авто · сроки"]
  end
  subgraph OPT["Подключается при наличии"]
    direction TB
    HR["HR и зарплата — 15"]
    KS["KSeF — 9"]
  end
  AGENT --> BASE
  AGENT -.-> OPT`,
    en: `flowchart LR
  AGENT(["The AI agent picks the tools it needs"])
  subgraph BASE["Always available — 58 tools"]
    direction TB
    T1["Company & contractors<br/>lookup by NIP, registries"]
    T2["Invoices & sales<br/>create · send · PDF"]
    T3["Payments & expenses"]
    T4["Taxes: KPiR · JPK_VAT · PIT"]
    T5["Tax-deadline calendar"]
    T6["Bank-account White List (Biała Lista)"]
    T7["Documents · ledgers · vehicles · terms"]
  end
  subgraph OPT["Enabled when configured"]
    direction TB
    HR["HR & payroll — 15"]
    KS["KSeF — 9"]
  end
  AGENT --> BASE
  AGENT -.-> OPT`,
    pl: `flowchart LR
  AGENT(["Agent AI wybiera potrzebne narzędzia"])
  subgraph BASE["Zawsze dostępne — 58 narzędzi"]
    direction TB
    T1["Firma i kontrahenci<br/>wyszukiwanie po NIP, rejestry"]
    T2["Faktury i sprzedaż<br/>utwórz · wyślij · PDF"]
    T3["Płatności i wydatki"]
    T4["Podatki: KPiR · JPK_VAT · PIT"]
    T5["Kalendarz terminów podatkowych"]
    T6["Biała Lista rachunków"]
    T7["Dokumenty · księgi · pojazdy · terminy"]
  end
  subgraph OPT["Włącza się, gdy skonfigurowane"]
    direction TB
    HR["HR i płace — 15"]
    KS["KSeF — 9"]
  end
  AGENT --> BASE
  AGENT -.-> OPT`,
  },

  'accounting-grounding': {
    ru: `flowchart LR
  Q["Вопрос или действие<br/>пользователя"] --> AGENT["ИИ-агент"]
  AGENT --> WF["wFirma<br/>реальные счета, компания,<br/>платежи, расходы"]
  AGENT --> REG["Публичные реестры<br/>Biała Lista MF · KRS"]
  REG --> AF["Автозаполнение по NIP<br/>название · REGON · адрес"]
  AGENT --> WL{"Платёж ≥ 15 000 zł?"}
  WL -->|да| CHK["Проверить счёт по Белому<br/>списку МФ (обязательно)"]
  WL -->|нет| SKIP["Обычная запись"]
  WF --> ANS["Ответ на реальных данных<br/>+ официальные ссылки"]
  CHK --> ANS
  AF --> ANS`,
    en: `flowchart LR
  Q["User's question<br/>or action"] --> AGENT["AI agent"]
  AGENT --> WF["wFirma<br/>real invoices, company,<br/>payments, expenses"]
  AGENT --> REG["Public registries<br/>Biała Lista MF · KRS"]
  REG --> AF["Autofill by NIP<br/>name · REGON · address"]
  AGENT --> WL{"Payment ≥ 15,000 zł?"}
  WL -->|yes| CHK["Verify the account against<br/>the MF White List (mandatory)"]
  WL -->|no| SKIP["Ordinary record"]
  WF --> ANS["Answer on real data<br/>+ official links"]
  CHK --> ANS
  AF --> ANS`,
    pl: `flowchart LR
  Q["Pytanie lub działanie<br/>użytkownika"] --> AGENT["Agent AI"]
  AGENT --> WF["wFirma<br/>realne faktury, firma,<br/>płatności, wydatki"]
  AGENT --> REG["Rejestry publiczne<br/>Biała Lista MF · KRS"]
  REG --> AF["Autouzupełnianie po NIP<br/>nazwa · REGON · adres"]
  AGENT --> WL{"Płatność ≥ 15 000 zł?"}
  WL -->|tak| CHK["Sprawdź rachunek na Białej<br/>Liście MF (obowiązkowo)"]
  WL -->|nie| SKIP["Zwykły zapis"]
  WF --> ANS["Odpowiedź na realnych danych<br/>+ oficjalne linki"]
  CHK --> ANS
  AF --> ANS`,
  },

  'accounting-ksef': {
    ru: `flowchart LR
  A["Счёт из чата<br/>или из wFirma"] --> GEN["Сформировать<br/>FA(3) XML"]
  GEN --> SEND["Отправить в KSeF"]
  SEND --> POLL["Проверка статуса<br/>в фоне (раз в минуту)"]
  POLL --> UPO["UPO — официальное<br/>подтверждение"]
  subgraph Incoming["Входящие"]
    IN["Э-счета из KSeF"] --> MATCH["Сопоставить<br/>с записями wFirma"]
  end`,
    en: `flowchart LR
  A["Invoice from chat<br/>or from wFirma"] --> GEN["Generate<br/>FA(3) XML"]
  GEN --> SEND["Send to KSeF"]
  SEND --> POLL["Status check<br/>in background (every minute)"]
  POLL --> UPO["UPO — official<br/>confirmation"]
  subgraph Incoming["Incoming"]
    IN["E-invoices from KSeF"] --> MATCH["Match against<br/>wFirma records"]
  end`,
    pl: `flowchart LR
  A["Faktura z czatu<br/>lub z wFirma"] --> GEN["Wygeneruj<br/>FA(3) XML"]
  GEN --> SEND["Wyślij do KSeF"]
  SEND --> POLL["Sprawdzanie statusu<br/>w tle (co minutę)"]
  POLL --> UPO["UPO — oficjalne<br/>potwierdzenie"]
  subgraph Incoming["Przychodzące"]
    IN["E-faktury z KSeF"] --> MATCH["Dopasuj<br/>do zapisów wFirma"]
  end`,
  },

  'accounting-ocr': {
    ru: `flowchart LR
  P["Фото чека<br/>в Telegram"] --> OCR["Распознавание<br/>(GPT-4o vision)"]
  OCR --> CARD["Структурированная карточка:<br/>продавец · сумма · дата · NIP"]
  CARD --> EXP["Создать расход в wFirma<br/>(контрагент — по NIP автоматически)"]
  N["Отдельный шаг в обработчике фото,<br/>ещё до ИИ-агента"] -.-> OCR`,
    en: `flowchart LR
  P["Receipt photo<br/>in Telegram"] --> OCR["Recognition<br/>(GPT-4o vision)"]
  OCR --> CARD["Structured card:<br/>seller · amount · date · NIP"]
  CARD --> EXP["Create an expense in wFirma<br/>(contractor auto-filled by NIP)"]
  N["A separate step in the photo handler,<br/>before the AI agent"] -.-> OCR`,
    pl: `flowchart LR
  P["Zdjęcie paragonu<br/>w Telegramie"] --> OCR["Rozpoznawanie<br/>(GPT-4o vision)"]
  OCR --> CARD["Ustrukturyzowana karta:<br/>sprzedawca · kwota · data · NIP"]
  CARD --> EXP["Utwórz wydatek w wFirma<br/>(kontrahent — po NIP automatycznie)"]
  N["Osobny krok w obsłudze zdjęcia,<br/>jeszcze przed agentem AI"] -.-> OCR`,
  },

  'accounting-memory-lifecycle': {
    ru: `flowchart TB
  subgraph Extract["Извлечение (в фоне, после ответа)"]
    R["Ответ сформирован"] --> RULES["Разбор по правилам и шаблонам<br/>без LLM: «моя фирма…», «всегда…»"]
    RULES --> USE["Учёт частых инструментов<br/>и контрагентов"]
  end
  subgraph Store["Хранение (PostgreSQL)"]
    M[("Память: факты о фирме ·<br/>частые контакты · предпочтения ·<br/>рабочие шаблоны")]
  end
  subgraph Decay["Угасание (лениво, раз в сутки)"]
    DEC["Не вспоминали 30 дней →<br/>снижаем уверенность"] --> HIDE["Уверенность мала →<br/>факт скрывается"]
  end
  subgraph Inject["Вложение в промпт"]
    TOP["Взять до 20 самых важных<br/>(бюджет ~6000 знаков)"] --> SP["Добавить в системный промпт<br/>следующего разговора"]
  end
  USE --> M
  RULES --> M
  M --> DEC
  M --> TOP`,
    en: `flowchart TB
  subgraph Extract["Extraction (background, after the answer)"]
    R["Answer produced"] --> RULES["Parse by rules and patterns<br/>no LLM: «my company…», «always…»"]
    RULES --> USE["Track frequent tools<br/>and contractors"]
  end
  subgraph Store["Storage (PostgreSQL)"]
    M[("Memory: business facts ·<br/>frequent contacts · preferences ·<br/>workflow patterns")]
  end
  subgraph Decay["Decay (lazy, once a day)"]
    DEC["Not recalled for 30 days →<br/>lower the confidence"] --> HIDE["Confidence too low →<br/>fact is hidden"]
  end
  subgraph Inject["Injection into the prompt"]
    TOP["Take up to 20 most important<br/>(budget ~6000 chars)"] --> SP["Add to the system prompt<br/>of the next conversation"]
  end
  USE --> M
  RULES --> M
  M --> DEC
  M --> TOP`,
    pl: `flowchart TB
  subgraph Extract["Ekstrakcja (w tle, po odpowiedzi)"]
    R["Odpowiedź gotowa"] --> RULES["Analiza wg reguł i wzorców<br/>bez LLM: «moja firma…», «zawsze…»"]
    RULES --> USE["Śledzenie częstych narzędzi<br/>i kontrahentów"]
  end
  subgraph Store["Przechowywanie (PostgreSQL)"]
    M[("Pamięć: fakty o firmie ·<br/>częste kontakty · preferencje ·<br/>wzorce pracy")]
  end
  subgraph Decay["Wygasanie (leniwie, raz dziennie)"]
    DEC["Brak użycia przez 30 dni →<br/>obniżamy pewność"] --> HIDE["Pewność zbyt niska →<br/>fakt ukrywany"]
  end
  subgraph Inject["Wstawienie do promptu"]
    TOP["Weź do 20 najważniejszych<br/>(budżet ~6000 znaków)"] --> SP["Dodaj do promptu systemowego<br/>następnej rozmowy"]
  end
  USE --> M
  RULES --> M
  M --> DEC
  M --> TOP`,
  },

  'budget-ai-overview': {
    ru: `flowchart TB
  subgraph Clients["Как обращаются пользователи"]
    APP["Мобильное приложение<br/>(Expo)"]
    TG["Telegram-бот"]
    WA["WhatsApp-бот"]
  end
  subgraph Server["Сервер (NestJS) — здесь живёт ключ"]
    PROXY["ИИ-прокси<br/>добавляет ключ + контекст"]
    RULES["Логика без ИИ<br/>аномалии · индекс инфляции"]
  end
  OPENAI["OpenAI API"]
  subgraph Data["Хранение"]
    PG["PostgreSQL"]
    RED["Redis · кэш и лимиты"]
  end
  APP --> PROXY
  TG --> PROXY
  WA --> PROXY
  PROXY --> OPENAI
  PROXY --> PG
  PROXY --> RED
  RULES --> PG`,
    en: `flowchart TB
  subgraph Clients["How users connect"]
    APP["Mobile app<br/>(Expo)"]
    TG["Telegram bot"]
    WA["WhatsApp bot"]
  end
  subgraph Server["Server (NestJS) — the key lives here"]
    PROXY["AI proxy<br/>adds key + context"]
    RULES["Logic without AI<br/>anomalies · inflation index"]
  end
  OPENAI["OpenAI API"]
  subgraph Data["Storage"]
    PG["PostgreSQL"]
    RED["Redis · cache and limits"]
  end
  APP --> PROXY
  TG --> PROXY
  WA --> PROXY
  PROXY --> OPENAI
  PROXY --> PG
  PROXY --> RED
  RULES --> PG`,
    pl: `flowchart TB
  subgraph Clients["Jak łączą się użytkownicy"]
    APP["Aplikacja mobilna<br/>(Expo)"]
    TG["Bot Telegram"]
    WA["Bot WhatsApp"]
  end
  subgraph Server["Serwer (NestJS) — tu mieszka klucz"]
    PROXY["Proxy AI<br/>dodaje klucz + kontekst"]
    RULES["Logika bez AI<br/>anomalie · indeks inflacji"]
  end
  OPENAI["OpenAI API"]
  subgraph Data["Przechowywanie"]
    PG["PostgreSQL"]
    RED["Redis · cache i limity"]
  end
  APP --> PROXY
  TG --> PROXY
  WA --> PROXY
  PROXY --> OPENAI
  PROXY --> PG
  PROXY --> RED
  RULES --> PG`,
  },

  'budget-ai-request': {
    ru: `flowchart LR
  REQ["Запрос к ИИ<br/>чат · чек · подсказка"] --> Q{"Хватает ИИ-квоты?"}
  Q -->|нет| STOP["Отказ +<br/>предложить тариф"]
  Q -->|да| MUL["Списать квоту<br/>× множитель тарифа"]
  MUL --> RES["Модель по «скорости»<br/>выбор пользователя"]
  RES --> F["fast<br/>gpt-4o-mini · ×0.75"]
  RES --> B["balanced по умолчанию<br/>gpt-4o · ×1.0"]
  RES --> Qy["quality<br/>gpt-4.1 · ×1.5"]
  F --> CALL["Вызов OpenAI<br/>ключ на сервере"]
  B --> CALL
  Qy --> CALL
  CALL --> ANS["Ответ пользователю"]`,
    en: `flowchart LR
  REQ["AI request<br/>chat · receipt · suggestion"] --> Q{"Enough AI quota?"}
  Q -->|no| STOP["Refuse +<br/>suggest a plan"]
  Q -->|yes| MUL["Deduct quota<br/>× plan multiplier"]
  MUL --> RES["Model by «speed»<br/>user's choice"]
  RES --> F["fast<br/>gpt-4o-mini · ×0.75"]
  RES --> B["balanced default<br/>gpt-4o · ×1.0"]
  RES --> Qy["quality<br/>gpt-4.1 · ×1.5"]
  F --> CALL["Call OpenAI<br/>key on the server"]
  B --> CALL
  Qy --> CALL
  CALL --> ANS["Answer to the user"]`,
    pl: `flowchart LR
  REQ["Żądanie do AI<br/>czat · paragon · podpowiedź"] --> Q{"Wystarczy limitu AI?"}
  Q -->|nie| STOP["Odmowa +<br/>zaproponuj plan"]
  Q -->|tak| MUL["Odejmij limit<br/>× mnożnik planu"]
  MUL --> RES["Model wg «prędkości»<br/>wybór użytkownika"]
  RES --> F["fast<br/>gpt-4o-mini · ×0.75"]
  RES --> B["balanced domyślnie<br/>gpt-4o · ×1.0"]
  RES --> Qy["quality<br/>gpt-4.1 · ×1.5"]
  F --> CALL["Wywołanie OpenAI<br/>klucz na serwerze"]
  B --> CALL
  Qy --> CALL
  CALL --> ANS["Odpowiedź dla użytkownika"]`,
  },

  'budget-chat-agent': {
    ru: `flowchart TB
  MSG["Сообщение пользователя"] --> MODEL["ai-агент с 11 функциями<br/>создать расход, доход…"]
  MODEL --> D{"Что вернула модель?"}
  D -->|обычный ответ| ANS["Текстовый ответ<br/>совет, разбор"]
  D -->|вызов функции| ACT["Предложенное действие<br/>черновик"]
  ACT --> ROLE{"Роль пользователя?"}
  ROLE -->|наблюдатель| BLOCK["Запись заблокирована"]
  ROLE -->|владелец / редактор| CONF{"Подтвердить?"}
  CONF -->|да| EXEC["Выполнить и записать"]
  CONF -->|нет| CANCEL["Отменить"]`,
    en: `flowchart TB
  MSG["User message"] --> MODEL["Model with 11 functions<br/>create expense, income…"]
  MODEL --> D{"What did the model return?"}
  D -->|plain answer| ANS["Text reply<br/>advice, analysis"]
  D -->|function call| ACT["Proposed action<br/>draft"]
  ACT --> ROLE{"User role?"}
  ROLE -->|viewer| BLOCK["Write blocked"]
  ROLE -->|owner / editor| CONF{"Confirm?"}
  CONF -->|yes| EXEC["Execute and save"]
  CONF -->|no| CANCEL["Cancel"]`,
    pl: `flowchart TB
  MSG["Wiadomość użytkownika"] --> MODEL["Model z 11 funkcjami<br/>utwórz wydatek, przychód…"]
  MODEL --> D{"Co zwrócił model?"}
  D -->|zwykła odpowiedź| ANS["Odpowiedź tekstowa<br/>porada, analiza"]
  D -->|wywołanie funkcji| ACT["Proponowane działanie<br/>szkic"]
  ACT --> ROLE{"Rola użytkownika?"}
  ROLE -->|obserwator| BLOCK["Zapis zablokowany"]
  ROLE -->|właściciel / edytor| CONF{"Potwierdzić?"}
  CONF -->|tak| EXEC["Wykonaj i zapisz"]
  CONF -->|nie| CANCEL["Anuluj"]`,
  },

  'budget-context-injection': {
    ru: `flowchart TB
  subgraph Ctx["Контекст пользователя"]
    C1["Траты за месяц"]
    C2["Лимиты по категориям"]
    C3["Топ-категории"]
    C4["Недавние расходы"]
  end
  Ctx --> SAN["Очистка текстовых полей"]
  SAN --> BLOCK["Изолированный блок данных<br/>--- ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ---"]
  INSTR["Инструкции ассистенту<br/>отдельно"] --> MODEL["Модель"]
  BLOCK --> MODEL
  MODEL --> NOTE["Данные — это данные,<br/>а не команды"]`,
    en: `flowchart TB
  subgraph Ctx["User context"]
    C1["Monthly spending"]
    C2["Category limits"]
    C3["Top categories"]
    C4["Recent expenses"]
  end
  Ctx --> SAN["Sanitize text fields"]
  SAN --> BLOCK["Isolated data block<br/>--- USER DATA ---"]
  INSTR["Assistant instructions<br/>separate"] --> MODEL["Model"]
  BLOCK --> MODEL
  MODEL --> NOTE["Data is data,<br/>not commands"]`,
    pl: `flowchart TB
  subgraph Ctx["Kontekst użytkownika"]
    C1["Wydatki miesięczne"]
    C2["Limity kategorii"]
    C3["Najczęstsze kategorie"]
    C4["Ostatnie wydatki"]
  end
  Ctx --> SAN["Czyszczenie pól tekstowych"]
  SAN --> BLOCK["Izolowany blok danych<br/>--- DANE UŻYTKOWNIKA ---"]
  INSTR["Instrukcje dla asystenta<br/>osobno"] --> MODEL["Model"]
  BLOCK --> MODEL
  MODEL --> NOTE["Dane to dane,<br/>a nie polecenia"]`,
  },

  'budget-receipt-ocr': {
    ru: `flowchart LR
  PHOTO["Фото чека"] --> OCR["Визуальное распознавание<br/>выбранная модель"]
  OCR --> ITEMS["Позиции: товар · цена ·<br/>дата · магазин · адрес"]
  ITEMS --> EXP["Черновик расхода<br/>подтвердите"]
  ITEMS --> CANON["Каноничное имя товара<br/>для индекса инфляции"]
  ITEMS --> ADDR["Адрес магазина"]
  ADDR --> GEO["Геокодинг: OpenStreetMap<br/>без ИИ, с кэшем"]
  GEO --> MAP["Точка на карте"]`,
    en: `flowchart LR
  PHOTO["Receipt photo"] --> OCR["Vision recognition<br/>selected model"]
  OCR --> ITEMS["Line items: product · price ·<br/>date · store · address"]
  ITEMS --> EXP["Expense draft<br/>please confirm"]
  ITEMS --> CANON["Canonical product name<br/>for the inflation index"]
  ITEMS --> ADDR["Store address"]
  ADDR --> GEO["Geocoding: OpenStreetMap<br/>no AI, cached"]
  GEO --> MAP["Point on the map"]`,
    pl: `flowchart LR
  PHOTO["Zdjęcie paragonu"] --> OCR["Rozpoznawanie wizyjne<br/>wybrany model"]
  OCR --> ITEMS["Pozycje: produkt · cena ·<br/>data · sklep · adres"]
  ITEMS --> EXP["Szkic wydatku<br/>potwierdź"]
  ITEMS --> CANON["Kanoniczna nazwa produktu<br/>dla indeksu inflacji"]
  ITEMS --> ADDR["Adres sklepu"]
  ADDR --> GEO["Geokodowanie: OpenStreetMap<br/>bez AI, z cache"]
  GEO --> MAP["Punkt na mapie"]`,
  },

  'budget-omnichannel': {
    ru: `flowchart TB
  APP["Приложение"] --> S
  TG["Telegram"] --> S
  WA["WhatsApp"] --> S
  subgraph S["Общие ИИ-сервисы на сервере"]
    CHAT["Чат-агент"]
    VOICE["Голос → текст<br/>whisper-1"]
    OCR["Чеки — визуальное распознавание"]
  end
  S --> OPENAI["OpenAI"]`,
    en: `flowchart TB
  APP["App"] --> S
  TG["Telegram"] --> S
  WA["WhatsApp"] --> S
  subgraph S["Shared AI services on the server"]
    CHAT["Chat agent"]
    VOICE["Voice → text<br/>whisper-1"]
    OCR["Receipts — vision"]
  end
  S --> OPENAI["OpenAI"]`,
    pl: `flowchart TB
  APP["Aplikacja"] --> S
  TG["Telegram"] --> S
  WA["WhatsApp"] --> S
  subgraph S["Wspólne usługi AI na serwerze"]
    CHAT["Agent czatu"]
    VOICE["Głos → tekst<br/>whisper-1"]
    OCR["Paragony — wizja"]
  end
  S --> OPENAI["OpenAI"]`,
  },

  'budget-suggestions': {
    ru: `flowchart LR
  E["Новый расход"] --> H{"Похожее уже<br/>встречалось?"}
  H -->|да| FAST["Подсказка сразу<br/>без модели"]
  H -->|нет| AI["ИИ / эмбеддинги"]
  AI --> S1["Категория"]
  AI --> S2["Теги"]
  AI --> S3["Проект по смыслу"]
  AI --> S4["Разбиение по категориям"]`,
    en: `flowchart LR
  E["New expense"] --> H{"Seen something<br/>similar before?"}
  H -->|yes| FAST["Instant suggestion<br/>no model"]
  H -->|no| AI["AI / embeddings"]
  AI --> S1["Category"]
  AI --> S2["Tags"]
  AI --> S3["Project by meaning"]
  AI --> S4["Split across categories"]`,
    pl: `flowchart LR
  E["Nowy wydatek"] --> H{"Coś podobnego<br/>już było?"}
  H -->|tak| FAST["Podpowiedź od razu<br/>bez modelu"]
  H -->|nie| AI["AI / embeddingi"]
  AI --> S1["Kategoria"]
  AI --> S2["Tagi"]
  AI --> S3["Projekt wg sensu"]
  AI --> S4["Podział na kategorie"]`,
  },

  'budget-insights': {
    ru: `flowchart LR
  DATA["Ваши финансы"] --> AI["Модель, выбранная вами"]
  AI --> CARDS["Инсайт-карточки<br/>паттерны трат"]
  AI --> STORY["История трат<br/>нарративная сводка"]
  PORT["Инвест-портфель"] --> AIP["Портфельные инсайты<br/>тариф Pro+, кэш 24 ч"]
  AIP --> RISK["Риски концентрации,<br/>отставание, комиссии…"]`,
    en: `flowchart LR
  DATA["Your finances"] --> AI["The model you chose"]
  AI --> CARDS["Insight cards<br/>spending patterns"]
  AI --> STORY["Spending story<br/>narrative summary"]
  PORT["Investment portfolio"] --> AIP["Portfolio insights<br/>Pro+ tier, 24h cache"]
  AIP --> RISK["Concentration risk,<br/>underperformance, fees…"]`,
    pl: `flowchart LR
  DATA["Twoje finanse"] --> AI["Model wybrany przez Ciebie"]
  AI --> CARDS["Karty wglądów<br/>wzorce wydatków"]
  AI --> STORY["Historia wydatków<br/>narracyjne podsumowanie"]
  PORT["Portfel inwestycyjny"] --> AIP["Wglądy portfelowe<br/>plan Pro+, cache 24 h"]
  AIP --> RISK["Ryzyko koncentracji,<br/>słabe wyniki, prowizje…"]`,
  },

  'budget-anomaly': {
    ru: `flowchart TB
  EXP["Расход записан"] --> RULES["4 правила — без ИИ"]
  RULES --> R1["Всплеск категории<br/>+30% к среднему"]
  RULES --> R2["Рост цены подписки<br/>больше 10%"]
  RULES --> R3["Двойное списание<br/>±1 день"]
  RULES --> R4["Похоже на регулярный платёж"]
  R1 --> FEED["Лента алертов<br/>защита от дублей"]
  R2 --> FEED
  R3 --> FEED
  R4 --> FEED
  FEED --> PUSH["Пуш — не более 3 в день"]`,
    en: `flowchart TB
  EXP["Expense saved"] --> RULES["4 rules — no AI"]
  RULES --> R1["Category spike<br/>+30% vs average"]
  RULES --> R2["Subscription price up<br/>over 10%"]
  RULES --> R3["Duplicate charge<br/>±1 day"]
  RULES --> R4["Looks like a recurring payment"]
  R1 --> FEED["Alert feed<br/>dedup protection"]
  R2 --> FEED
  R3 --> FEED
  R4 --> FEED
  FEED --> PUSH["Push — max 3 per day"]`,
    pl: `flowchart TB
  EXP["Wydatek zapisany"] --> RULES["4 reguły — bez AI"]
  RULES --> R1["Skok kategorii<br/>+30% do średniej"]
  RULES --> R2["Wzrost ceny subskrypcji<br/>ponad 10%"]
  RULES --> R3["Podwójne obciążenie<br/>±1 dzień"]
  RULES --> R4["Wygląda na płatność cykliczną"]
  R1 --> FEED["Kanał alertów<br/>ochrona przed duplikatami"]
  R2 --> FEED
  R3 --> FEED
  R4 --> FEED
  FEED --> PUSH["Push — maks. 3 dziennie"]`,
  },

  'emarketing-system-overview': {
    ru: `flowchart TB
  subgraph Client["Как приходит задача"]
    UI["Веб-панель маркетолога"]
    CRON["Расписание (cron)"]
  end
  subgraph App["Основное приложение"]
    API["Сервер (API)<br/>создаёт запись о запуске"]
    Q["Очередь заданий<br/>(на Redis)"]
  end
  subgraph AI["ИИ-сервис (отдельный)"]
    SUP["Супервайзер<br/>(маршрутизатор)"]
    AG["Агенты-специалисты"]
  end
  LLM["OpenAI GPT-4o"]
  DB[("База данных<br/>контент · кампании · метрики")]
  UI --> API
  CRON --> API
  API --> Q
  Q --> SUP
  SUP --> AG
  AG --> LLM
  AG --> DB
  API --> DB`,
    en: `flowchart TB
  subgraph Client["How a task arrives"]
    UI["Marketer's web dashboard"]
    CRON["Schedule (cron)"]
  end
  subgraph App["Main application"]
    API["Server (API)<br/>creates a run record"]
    Q["Job queue<br/>(on Redis)"]
  end
  subgraph AI["AI service (separate)"]
    SUP["Supervisor<br/>(router)"]
    AG["Specialist agents"]
  end
  LLM["OpenAI GPT-4o"]
  DB[("Database<br/>content · campaigns · metrics")]
  UI --> API
  CRON --> API
  API --> Q
  Q --> SUP
  SUP --> AG
  AG --> LLM
  AG --> DB
  API --> DB`,
    pl: `flowchart TB
  subgraph Client["Jak trafia zadanie"]
    UI["Panel web marketera"]
    CRON["Harmonogram (cron)"]
  end
  subgraph App["Aplikacja główna"]
    API["Serwer (API)<br/>tworzy wpis o uruchomieniu"]
    Q["Kolejka zadań<br/>(na Redis)"]
  end
  subgraph AI["Usługa AI (osobna)"]
    SUP["Nadzorca<br/>(router)"]
    AG["Wyspecjalizowani agenci"]
  end
  LLM["OpenAI GPT-4o"]
  DB[("Baza danych<br/>treści · kampanie · metryki")]
  UI --> API
  CRON --> API
  API --> Q
  Q --> SUP
  SUP --> AG
  AG --> LLM
  AG --> DB
  API --> DB`,
  },

  'emarketing-supervisor-team': {
    ru: `flowchart TB
  SUP(["Супервайзер выбирает нужного специалиста"])
  subgraph Team["Команда агентов"]
    direction TB
    C["Контент<br/>посты · статьи · письма · лендинги"]
    CH["Чек-листы<br/>запуск · кампания · SEO"]
    D["Документы<br/>план · отчёт · анализ конкурентов"]
    S["SEO<br/>аудит страницы + разбор выдачи"]
    ST["Стратегия<br/>go-to-market · позиционирование"]
    E["Email<br/>темы · письма · цепочки"]
    A["Аналитика<br/>инсайты по реальным метрикам"]
  end
  CHAT["Чат-ассистент"]
  SUP --> Team
  CHAT -. "поручение" .-> SUP`,
    en: `flowchart TB
  SUP(["The supervisor picks the right specialist"])
  subgraph Team["The team of agents"]
    direction TB
    C["Content<br/>posts · articles · emails · landing pages"]
    CH["Checklists<br/>launch · campaign · SEO"]
    D["Documents<br/>plan · report · competitor analysis"]
    S["SEO<br/>page audit + SERP breakdown"]
    ST["Strategy<br/>go-to-market · positioning"]
    E["Email<br/>subject lines · emails · sequences"]
    A["Analytics<br/>insights over real metrics"]
  end
  CHAT["Chat assistant"]
  SUP --> Team
  CHAT -. "hands off a job" .-> SUP`,
    pl: `flowchart TB
  SUP(["Nadzorca wybiera właściwego specjalistę"])
  subgraph Team["Zespół agentów"]
    direction TB
    C["Treści<br/>posty · artykuły · e-maile · landing pages"]
    CH["Listy kontrolne<br/>launch · kampania · SEO"]
    D["Dokumenty<br/>plan · raport · analiza konkurencji"]
    S["SEO<br/>audyt strony + analiza wyników"]
    ST["Strategia<br/>go-to-market · pozycjonowanie"]
    E["Email<br/>tematy · e-maile · sekwencje"]
    A["Analityka<br/>wglądy na realnych metrykach"]
  end
  CHAT["Asystent czatu"]
  SUP --> Team
  CHAT -. "przekazuje zadanie" .-> SUP`,
  },

  'emarketing-run-lifecycle': {
    ru: `stateDiagram-v2
  state "Ожидает" as P
  state "В очереди" as Q
  state "Выполняется" as R
  state "Готово" as D
  state "Ошибка" as F
  [*] --> P: задача создана
  P --> Q: поставлена в очередь
  Q --> R: агент взял в работу
  R --> D: результат сохранён
  R --> F: сбой
  D --> [*]
  F --> [*]
  note right of R
    Замеряются время,
    израсходованные токены
    и стоимость в долларах;
    сохраняется трейс для отладки
  end note`,
    en: `stateDiagram-v2
  state "Pending" as P
  state "Queued" as Q
  state "Running" as R
  state "Completed" as D
  state "Failed" as F
  [*] --> P: task created
  P --> Q: put in the queue
  Q --> R: an agent picks it up
  R --> D: result saved
  R --> F: error
  D --> [*]
  F --> [*]
  note right of R
    Time, tokens spent
    and cost in dollars
    are measured;
    a debug trace is stored
  end note`,
    pl: `stateDiagram-v2
  state "Oczekuje" as P
  state "W kolejce" as Q
  state "Trwa" as R
  state "Gotowe" as D
  state "Błąd" as F
  [*] --> P: zadanie utworzone
  P --> Q: trafia do kolejki
  Q --> R: agent bierze je do pracy
  R --> D: wynik zapisany
  R --> F: błąd
  D --> [*]
  F --> [*]
  note right of R
    Mierzone są czas,
    zużyte tokeny
    i koszt w dolarach;
    zapisywany jest ślad do debugowania
  end note`,
  },

  'emarketing-content-multilingual': {
    ru: `flowchart TB
  IN["Запрос: тип · платформа · тема ·<br/>тон · длина · языки"] --> CTX["Загрузить контекст проекта<br/>голос бренда · аудитория · отрасль"]
  CTX --> GEN["Сгенерировать текст<br/>(GPT-4o, температура 0.8)"]
  GEN --> REV["Проверка качества"]
  REV --> SAVE["Сохранить как отдельную запись<br/>с общим ID группы"]
  SAVE --> MORE{"Ещё языки?"}
  MORE -->|да| NEXT["Следующий язык"]
  NEXT --> GEN
  MORE -->|нет| DONE["Готово: по записи на язык,<br/>сгруппированы вместе"]`,
    en: `flowchart TB
  IN["Request: type · platform · topic ·<br/>tone · length · languages"] --> CTX["Load project context<br/>brand voice · audience · industry"]
  CTX --> GEN["Generate the text<br/>(GPT-4o, temperature 0.8)"]
  GEN --> REV["Quality review"]
  REV --> SAVE["Save as a separate record<br/>with a shared group ID"]
  SAVE --> MORE{"More languages?"}
  MORE -->|yes| NEXT["Next language"]
  NEXT --> GEN
  MORE -->|no| DONE["Done: one record per language,<br/>grouped together"]`,
    pl: `flowchart TB
  IN["Zapytanie: typ · platforma · temat ·<br/>ton · długość · języki"] --> CTX["Wczytaj kontekst projektu<br/>głos marki · odbiorcy · branża"]
  CTX --> GEN["Wygeneruj tekst<br/>(GPT-4o, temperatura 0.8)"]
  GEN --> REV["Kontrola jakości"]
  REV --> SAVE["Zapisz jako osobny wpis<br/>ze wspólnym ID grupy"]
  SAVE --> MORE{"Więcej języków?"}
  MORE -->|tak| NEXT["Następny język"]
  NEXT --> GEN
  MORE -->|nie| DONE["Gotowe: po wpisie na język,<br/>zgrupowane razem"]`,
  },

  'emarketing-grounding': {
    ru: `flowchart LR
  Q["Запрос: отчёт<br/>или вопрос по аналитике"] --> AGENT["Агент документов / аналитики"]
  AGENT --> DATA["Только чтение реальных данных проекта<br/>контент · кампании · подписчики ·<br/>соцсети · метрики · чек-листы"]
  DATA --> CHECK{"Данные есть?"}
  CHECK -->|да| ANS["Отчёт и инсайты<br/>на реальных цифрах"]
  CHECK -->|нет| HONEST["«Данных нет» +<br/>что стоит подключить"]`,
    en: `flowchart LR
  Q["Request: a report<br/>or an analytics question"] --> AGENT["Document / analytics agent"]
  AGENT --> DATA["Read-only, the project's real data<br/>content · campaigns · subscribers ·<br/>socials · metrics · checklists"]
  DATA --> CHECK{"Is there data?"}
  CHECK -->|yes| ANS["Report and insights<br/>on real figures"]
  CHECK -->|no| HONEST["«No data» +<br/>what to set up"]`,
    pl: `flowchart LR
  Q["Zapytanie: raport<br/>lub pytanie o analitykę"] --> AGENT["Agent dokumentów / analityki"]
  AGENT --> DATA["Tylko odczyt realnych danych projektu<br/>treści · kampanie · subskrybenci ·<br/>social · metryki · listy kontrolne"]
  DATA --> CHECK{"Czy są dane?"}
  CHECK -->|tak| ANS["Raport i wglądy<br/>na realnych liczbach"]
  CHECK -->|nie| HONEST["«Brak danych» +<br/>co warto podłączyć"]`,
  },

  'emarketing-chat-dispatch': {
    ru: `stateDiagram-v2
  state "Чат" as C
  state Decide <<choice>>
  state "Инструмент" as T
  [*] --> C: сообщение пользователя
  C --> Decide: ответ модели
  Decide --> [*]: ответ текстом (без действия)
  Decide --> T: нужно действие
  T --> C: специалист отработал, есть ссылка
  note right of T
    Из разговора можно поручить
    задачу любому специалисту:
    чек-лист, контент, отчёт, SEO…
  end note`,
    en: `stateDiagram-v2
  state "Chat" as C
  state Decide <<choice>>
  state "Tool" as T
  [*] --> C: user message
  C --> Decide: model response
  Decide --> [*]: text answer (no action)
  Decide --> T: an action is needed
  T --> C: specialist finished, a link is ready
  note right of T
    From the conversation you can
    hand a job to any specialist:
    checklist, content, report, SEO…
  end note`,
    pl: `stateDiagram-v2
  state "Czat" as C
  state Decide <<choice>>
  state "Narzędzie" as T
  [*] --> C: wiadomość użytkownika
  C --> Decide: odpowiedź modelu
  Decide --> [*]: odpowiedź tekstem (bez akcji)
  Decide --> T: potrzebne działanie
  T --> C: specjalista skończył, jest link
  note right of T
    Z rozmowy można przekazać
    zadanie dowolnemu specjaliście:
    lista kontrolna, treść, raport, SEO…
  end note`,
  },

  'emarketing-seo-flow': {
    ru: `stateDiagram-v2
  state "Загрузка" as S1
  state "Аудит" as S2
  state "Выдача" as S3
  state "Рекомендации" as S4
  [*] --> S1: загрузить страницу
  S1 --> S2: аудит on-page
  S2 --> S3: разбор конкурентов
  S3 --> S4: приоритеты правок
  S4 --> [*]
  note right of S2
    Заголовки, мета-теги,
    плотность ключевых слов
  end note
  note right of S4
    Плюс мета-заголовок, описание
    и slug для новой страницы
  end note`,
    en: `stateDiagram-v2
  state "Fetch" as S1
  state "Audit" as S2
  state "SERP" as S3
  state "Recommendations" as S4
  [*] --> S1: fetch the page
  S1 --> S2: on-page audit
  S2 --> S3: competitor breakdown
  S3 --> S4: prioritized fixes
  S4 --> [*]
  note right of S2
    Headings, meta tags,
    keyword density
  end note
  note right of S4
    Plus meta title, description
    and slug for a new page
  end note`,
    pl: `stateDiagram-v2
  state "Pobranie" as S1
  state "Audyt" as S2
  state "Wyniki" as S3
  state "Rekomendacje" as S4
  [*] --> S1: pobierz stronę
  S1 --> S2: audyt on-page
  S2 --> S3: analiza konkurencji
  S3 --> S4: priorytety poprawek
  S4 --> [*]
  note right of S2
    Nagłówki, meta-tagi,
    gęstość słów kluczowych
  end note
  note right of S4
    Plus meta-tytuł, opis
    i slug dla nowej strony
  end note`,
  },

  'dreaming-team-overview': {
    ru: `flowchart TB
  SCHED["Планировщик<br/>ночная ротация"]
  subgraph Repo["Кодовая база — контроль версий"]
    AGENTS["Команда агентов<br/>роли как файлы"]
    CODE["Исходный код"]
    ART["Артефакты<br/>заметки · предложения · находки"]
  end
  HUMAN["Ревью человеком<br/>одобрить / отклонить"]
  SCHED -->|будит агента| AGENTS
  AGENTS -->|изучает| CODE
  AGENTS -->|пишет| ART
  ART -->|выносится на ревью| HUMAN
  HUMAN -->|применяет одобренное| AGENTS`,
    en: `flowchart TB
  SCHED["Scheduler<br/>nightly rota"]
  subgraph Repo["Codebase — version control"]
    AGENTS["Agent team<br/>roles as files"]
    CODE["Source code"]
    ART["Artifacts<br/>notes · proposals · findings"]
  end
  HUMAN["Human review<br/>approve / reject"]
  SCHED -->|wakes an agent| AGENTS
  AGENTS -->|studies| CODE
  AGENTS -->|writes| ART
  ART -->|surfaced for review| HUMAN
  HUMAN -->|applies approved changes| AGENTS`,
    pl: `flowchart TB
  SCHED["Harmonogram<br/>nocna rotacja"]
  subgraph Repo["Kod bazowy — kontrola wersji"]
    AGENTS["Zespół agentów<br/>role jako pliki"]
    CODE["Kod źródłowy"]
    ART["Artefakty<br/>notatki · propozycje · znaleziska"]
  end
  HUMAN["Przegląd człowieka<br/>zatwierdź / odrzuć"]
  SCHED -->|budzi agenta| AGENTS
  AGENTS -->|studiuje| CODE
  AGENTS -->|zapisuje| ART
  ART -->|do przeglądu| HUMAN
  HUMAN -->|stosuje zatwierdzone| AGENTS`,
  },

  'dreaming-self-study-loop': {
    ru: `flowchart TB
  START(["Начало ночной смены"]) --> READ["Перечитать свою роль"]
  READ --> SAMPLE["Выборочно изучить код<br/>строгий бюджет"]
  SAMPLE --> NOTE["Написать заметку<br/>роль · наблюдение · вопрос"]
  NOTE --> DRIFT{"Инструкции сходятся с реальностью?"}
  DRIFT -->|да| DONE(["Заметка сохранена"])
  DRIFT -->|"нет — структурный разрыв"| PROP["Набросать предложение по эволюции"]
  PROP --> GATE{"Ревью человеком"}
  GATE -->|одобрить| APPLY["Обновить собственное описание агента"]
  GATE -->|отклонить| DONE
  APPLY --> DONE`,
    en: `flowchart TB
  START(["Night shift begins"]) --> READ["Re-read own role"]
  READ --> SAMPLE["Sample the codebase<br/>strict budget"]
  SAMPLE --> NOTE["Write a learning note<br/>role · watchlist · question"]
  NOTE --> DRIFT{"Instructions match reality?"}
  DRIFT -->|yes| DONE(["Note saved"])
  DRIFT -->|"no — structural gap"| PROP["Draft an evolution proposal"]
  PROP --> GATE{"Human review"}
  GATE -->|approve| APPLY["Update the agent's own definition"]
  GATE -->|reject| DONE
  APPLY --> DONE`,
    pl: `flowchart TB
  START(["Początek nocnej zmiany"]) --> READ["Przeczytaj rolę na nowo"]
  READ --> SAMPLE["Zbadaj kod wyrywkowo<br/>ścisły budżet"]
  SAMPLE --> NOTE["Napisz notatkę<br/>rola · obserwacja · pytanie"]
  NOTE --> DRIFT{"Instrukcje zgodne z rzeczywistością?"}
  DRIFT -->|tak| DONE(["Notatka zapisana"])
  DRIFT -->|"nie — rozjazd strukturalny"| PROP["Naszkicuj propozycję ewolucji"]
  PROP --> GATE{"Przegląd człowieka"}
  GATE -->|zatwierdź| APPLY["Zaktualizuj własny opis agenta"]
  GATE -->|odrzuć| DONE
  APPLY --> DONE`,
  },

  'dreaming-scanner-family': {
    ru: `flowchart LR
  REPO["Кодовая база"] --> RUN["Один паттерн<br/>фонового запуска"]
  RUN --> SS["Линза самообучения"]
  RUN --> TD["Линза техдолга"]
  RUN --> IDEA["Линза продуктовых идей"]
  RUN --> LOOP["Линза операционных циклов"]
  RUN --> WIKI["Линза базы знаний"]
  SS --> STORE["Markdown-артефакты<br/>в репозитории"]
  TD --> STORE
  IDEA --> STORE
  LOOP --> STORE
  WIKI --> STORE`,
    en: `flowchart LR
  REPO["Codebase"] --> RUN["One background-run<br/>pattern"]
  RUN --> SS["Self-study lens"]
  RUN --> TD["Tech-debt lens"]
  RUN --> IDEA["Product-idea lens"]
  RUN --> LOOP["Operational-loop lens"]
  RUN --> WIKI["Knowledge-base lens"]
  SS --> STORE["Markdown artifacts<br/>in the repo"]
  TD --> STORE
  IDEA --> STORE
  LOOP --> STORE
  WIKI --> STORE`,
    pl: `flowchart LR
  REPO["Kod bazowy"] --> RUN["Jeden wzorzec<br/>uruchomienia w tle"]
  RUN --> SS["Soczewka samokształcenia"]
  RUN --> TD["Soczewka długu technicznego"]
  RUN --> IDEA["Soczewka pomysłów produktowych"]
  RUN --> LOOP["Soczewka pętli operacyjnych"]
  RUN --> WIKI["Soczewka bazy wiedzy"]
  SS --> STORE["Artefakty markdown<br/>w repozytorium"]
  TD --> STORE
  IDEA --> STORE
  LOOP --> STORE
  WIKI --> STORE`,
  },

  'dreaming-session-lifecycle': {
    ru: `stateDiagram-v2
  state "Запланирована" as S0
  state "Выполняется" as S1
  state "Успех" as S2
  state "Таймаут" as S3
  state "Провал" as S4
  state "Сверена" as S5
  [*] --> S0
  S0 --> S1: выбрана из ротации
  S1 --> S2: отчиталась
  S1 --> S3: остановлено сторожем
  S1 --> S4: ошибка или убита
  S1 --> S5: умерла без отчёта
  S2 --> [*]
  S3 --> [*]
  S4 --> [*]
  S5 --> [*]`,
    en: `stateDiagram-v2
  state "Scheduled" as S0
  state "Running" as S1
  state "Success" as S2
  state "Timeout" as S3
  state "Failed" as S4
  state "Reconciled" as S5
  [*] --> S0
  S0 --> S1: picked from rotation
  S1 --> S2: reported back
  S1 --> S3: watchdog stalled
  S1 --> S4: error or killed
  S1 --> S5: died silently
  S2 --> [*]
  S3 --> [*]
  S4 --> [*]
  S5 --> [*]`,
    pl: `stateDiagram-v2
  state "Zaplanowana" as S0
  state "Trwa" as S1
  state "Sukces" as S2
  state "Timeout" as S3
  state "Porażka" as S4
  state "Uzgodniona" as S5
  [*] --> S0
  S0 --> S1: wybrana z rotacji
  S1 --> S2: zaraportowała
  S1 --> S3: zatrzymana przez watchdog
  S1 --> S4: błąd lub zabita
  S1 --> S5: umarła bez raportu
  S2 --> [*]
  S3 --> [*]
  S4 --> [*]
  S5 --> [*]`,
  },

  'dreaming-cascade-gates': {
    ru: `flowchart TB
  GOAL["Цель"] --> SUP["Супервайзер<br/>раскладывает на подагентов"]
  SUP --> C["Контракт"]
  C --> G1{"Ворота"}
  G1 -->|одобрить| D["Дизайн"]
  G1 -->|вернуть| C
  D --> G2{"Ворота"}
  G2 -->|одобрить| IMP["Реализация"]
  G2 -->|вернуть| D
  IMP --> G3{"Ворота"}
  G3 -->|одобрить| R["Ревью"]
  G3 -->|вернуть| IMP
  R --> G4{"Ворота"}
  G4 -->|одобрить| Q["QA"]
  G4 -->|вернуть| R
  Q --> DONE(["Готово"])
  G1 -->|отклонить| STOP(["Запуск остановлен"])
  G2 -->|отклонить| STOP
  G3 -->|отклонить| STOP
  G4 -->|отклонить| STOP`,
    en: `flowchart TB
  GOAL["Goal"] --> SUP["Supervisor<br/>decomposes into subagents"]
  SUP --> C["Contract"]
  C --> G1{"Gate"}
  G1 -->|approve| D["Design"]
  G1 -->|return| C
  D --> G2{"Gate"}
  G2 -->|approve| IMP["Implementation"]
  G2 -->|return| D
  IMP --> G3{"Gate"}
  G3 -->|approve| R["Review"]
  G3 -->|return| IMP
  R --> G4{"Gate"}
  G4 -->|approve| Q["QA"]
  G4 -->|return| R
  Q --> DONE(["Done"])
  G1 -->|reject| STOP(["Run stopped"])
  G2 -->|reject| STOP
  G3 -->|reject| STOP
  G4 -->|reject| STOP`,
    pl: `flowchart TB
  GOAL["Cel"] --> SUP["Nadzorca<br/>rozkłada na podagentów"]
  SUP --> C["Kontrakt"]
  C --> G1{"Bramka"}
  G1 -->|zatwierdź| D["Projekt"]
  G1 -->|wróć| C
  D --> G2{"Bramka"}
  G2 -->|zatwierdź| IMP["Implementacja"]
  G2 -->|wróć| D
  IMP --> G3{"Bramka"}
  G3 -->|zatwierdź| R["Przegląd"]
  G3 -->|wróć| IMP
  R --> G4{"Bramka"}
  G4 -->|zatwierdź| Q["QA"]
  G4 -->|wróć| R
  Q --> DONE(["Gotowe"])
  G1 -->|odrzuć| STOP(["Uruchomienie zatrzymane"])
  G2 -->|odrzuć| STOP
  G3 -->|odrzuć| STOP
  G4 -->|odrzuć| STOP`,
  },
  'geo-search-shift': {
    ru: `flowchart TB
  subgraph SEOflow["Классический поиск · SEO"]
    direction LR
    Q1["Запрос"] --> L["Список ссылок"]
    L --> CL["Клик по ссылке"]
    CL --> P["Ваш сайт"]
  end
  subgraph AIflow["Ответ ИИ · AEO / GEO"]
    direction LR
    Q2["Запрос"] --> ENG["Движок читает<br/>много источников"]
    ENG --> ANS["Один готовый ответ<br/>со ссылками на источники"]
    ANS --> CIT{"Ваш контент<br/>процитирован?"}
    CIT -->|да| VIS["Вы в ответе"]
    CIT -->|нет| INV["Вас не видно"]
  end`,
    en: `flowchart TB
  subgraph SEOflow["Classic search · SEO"]
    direction LR
    Q1["Query"] --> L["List of links"]
    L --> CL["Click a link"]
    CL --> P["Your site"]
  end
  subgraph AIflow["AI answer · AEO / GEO"]
    direction LR
    Q2["Query"] --> ENG["Engine reads<br/>many sources"]
    ENG --> ANS["One ready-made answer<br/>with source links"]
    ANS --> CIT{"Is your content<br/>cited?"}
    CIT -->|yes| VIS["You are in the answer"]
    CIT -->|no| INV["You are invisible"]
  end`,
    pl: `flowchart TB
  subgraph SEOflow["Klasyczne wyszukiwanie · SEO"]
    direction LR
    Q1["Zapytanie"] --> L["Lista linków"]
    L --> CL["Kliknięcie w link"]
    CL --> P["Twoja strona"]
  end
  subgraph AIflow["Odpowiedź AI · AEO / GEO"]
    direction LR
    Q2["Zapytanie"] --> ENG["Silnik czyta<br/>wiele źródeł"]
    ENG --> ANS["Jedna gotowa odpowiedź<br/>z linkami do źródeł"]
    ANS --> CIT{"Czy Twoja treść<br/>jest cytowana?"}
    CIT -->|tak| VIS["Jesteś w odpowiedzi"]
    CIT -->|nie| INV["Jesteś niewidoczny"]
  end`,
  },
  'geo-timeline': {
    ru: `flowchart LR
  A["Ноябрь 2022<br/>Запуск ChatGPT"] --> B["2023<br/>Google SGE —<br/>генеративный поиск"]
  B --> C["Ноябрь 2023<br/>Научная работа<br/>«GEO»"]
  C --> D["2024<br/>Google AI Overviews<br/>над результатами"]
  D --> E["Сейчас<br/>Perplexity и другие<br/>«движки ответов»"]`,
    en: `flowchart LR
  A["November 2022<br/>ChatGPT launches"] --> B["2023<br/>Google SGE —<br/>generative search"]
  B --> C["November 2023<br/>The «GEO»<br/>research paper"]
  C --> D["2024<br/>Google AI Overviews<br/>above the results"]
  D --> E["Now<br/>Perplexity and other<br/>«answer engines»"]`,
    pl: `flowchart LR
  A["Listopad 2022<br/>Premiera ChatGPT"] --> B["2023<br/>Google SGE —<br/>wyszukiwanie generatywne"]
  B --> C["Listopad 2023<br/>Praca naukowa<br/>«GEO»"]
  C --> D["2024<br/>Google AI Overviews<br/>nad wynikami"]
  D --> E["Teraz<br/>Perplexity i inne<br/>«silniki odpowiedzi»"]`,
  },
  'geo-micode-recipe': {
    ru: `flowchart LR
  SITE["Наши сайты<br/>mi-code.pl · eksiegowyai.pl · ai-budget.pl"] --> LLMS["llms.txt<br/>+ llms-full.txt"]
  SITE --> ROB["robots.txt<br/>впускает ИИ-ботов,<br/>закрывает приватное"]
  SITE --> JLD["JSON-LD<br/>FAQPage · Organization"]
  SITE --> PRE["Трёхъязычный prerender<br/>canonical + hreflang"]
  LLMS --> CRAWL["ИИ-краулер<br/>читает сайт"]
  ROB --> CRAWL
  JLD --> CRAWL
  PRE --> CRAWL
  CRAWL --> ANS["Ответ ИИ<br/>цитирует и упоминает вас"]`,
    en: `flowchart LR
  SITE["Our sites<br/>mi-code.pl · eksiegowyai.pl · ai-budget.pl"] --> LLMS["llms.txt<br/>+ llms-full.txt"]
  SITE --> ROB["robots.txt<br/>welcomes AI bots,<br/>fences off private routes"]
  SITE --> JLD["JSON-LD<br/>FAQPage · Organization"]
  SITE --> PRE["Trilingual prerender<br/>canonical + hreflang"]
  LLMS --> CRAWL["AI crawler<br/>reads the site"]
  ROB --> CRAWL
  JLD --> CRAWL
  PRE --> CRAWL
  CRAWL --> ANS["AI answer<br/>cites and mentions you"]`,
    pl: `flowchart LR
  SITE["Nasze strony<br/>mi-code.pl · eksiegowyai.pl · ai-budget.pl"] --> LLMS["llms.txt<br/>+ llms-full.txt"]
  SITE --> ROB["robots.txt<br/>wpuszcza boty AI,<br/>odgradza trasy prywatne"]
  SITE --> JLD["JSON-LD<br/>FAQPage · Organization"]
  SITE --> PRE["Trójjęzyczny prerender<br/>canonical + hreflang"]
  LLMS --> CRAWL["Crawler AI<br/>czyta stronę"]
  ROB --> CRAWL
  JLD --> CRAWL
  PRE --> CRAWL
  CRAWL --> ANS["Odpowiedź AI<br/>cytuje i wspomina o Tobie"]`,
  },

  'cost-bill-anatomy': {
    ru: `flowchart TB
  SP["Системный промпт"] --> REQ
  TS["Схемы всех инструментов"] --> REQ
  H["История диалога"] --> REQ
  RAG["Найденный контекст"] --> REQ
  REQ["Один запрос к модели"] --> OUT["Ответ модели"]
  OUT --> MUL["× число шагов на задачу"]
  MUL --> BILL["Счёт за задачу"]`,
    en: `flowchart TB
  SP["System prompt"] --> REQ
  TS["Schemas of every tool"] --> REQ
  H["Conversation history"] --> REQ
  RAG["Retrieved context"] --> REQ
  REQ["One request to the model"] --> OUT["Model output"]
  OUT --> MUL["x steps per task"]
  MUL --> BILL["Cost of one task"]`,
    pl: `flowchart TB
  SP["Prompt systemowy"] --> REQ
  TS["Schematy wszystkich narzędzi"] --> REQ
  H["Historia rozmowy"] --> REQ
  RAG["Znaleziony kontekst"] --> REQ
  REQ["Jedno zapytanie do modelu"] --> OUT["Odpowiedź modelu"]
  OUT --> MUL["x liczba kroków na zadanie"]
  MUL --> BILL["Koszt jednego zadania"]`,
  },

  'cost-agent-loop': {
    ru: `stateDiagram-v2
  state "запрос собран" as req
  state "модель думает" as model
  state "вызов инструмента" as tool
  state "ответ пользователю" as done
  [*] --> req
  req --> model: префикс уходит заново
  model --> tool: нужен инструмент
  tool --> req: результат дописан в историю
  model --> done: ответ готов
  done --> [*]
  note right of req
    Каждый круг заново пересылает
    промпт и схемы инструментов
  end note`,
    en: `stateDiagram-v2
  state "request assembled" as req
  state "model thinking" as model
  state "tool call" as tool
  state "answer to user" as done
  [*] --> req
  req --> model: prefix re-sent
  model --> tool: a tool is needed
  tool --> req: result appended to history
  model --> done: answer ready
  done --> [*]
  note right of req
    Every lap re-sends the prompt
    and all tool schemas
  end note`,
    pl: `stateDiagram-v2
  state "zapytanie złożone" as req
  state "model myśli" as model
  state "wywołanie narzędzia" as tool
  state "odpowiedź dla użytkownika" as done
  [*] --> req
  req --> model: prefiks wysyłany ponownie
  model --> tool: potrzebne narzędzie
  tool --> req: wynik dopisany do historii
  model --> done: odpowiedź gotowa
  done --> [*]
  note right of req
    Każde koło wysyła ponownie prompt
    i wszystkie schematy narzędzi
  end note`,
  },

  'cost-four-leaks': {
    ru: `flowchart TB
  L["Куда утекает бюджет"] --> A["Все инструменты в каждом запросе<br/>схемы не зависят от задачи"]
  L --> B["Слишком широкий поиск в базе<br/>лишние найденные фрагменты"]
  L --> C["Повторы после сбоя<br/>падение инструмента = ещё один круг"]
  L --> D["История без обрезки<br/>растёт с каждым шагом"]`,
    en: `flowchart TB
  L["Where the budget leaks"] --> A["Every tool in every request<br/>schemas ignore the task at hand"]
  L --> B["Retrieval set too wide<br/>chunks nobody needed"]
  L --> C["Retries after a failure<br/>a failed tool call costs a full lap"]
  L --> D["History never trimmed<br/>grows with every step"]`,
    pl: `flowchart TB
  L["Gdzie wycieka budżet"] --> A["Wszystkie narzędzia w każdym zapytaniu<br/>schematy niezależne od zadania"]
  L --> B["Zbyt szerokie wyszukiwanie<br/>nadmiarowe fragmenty"]
  L --> C["Ponowienia po błędzie<br/>błąd narzędzia to kolejne koło"]
  L --> D["Historia bez obcinania<br/>rośnie z każdym krokiem"]`,
  },

  'cost-four-levers': {
    ru: `flowchart LR
  subgraph До
    B1["Все схемы каждый раз"]
    B2["Префикс не кэшируется"]
    B3["Одна дорогая модель на всё"]
    B4["История целиком"]
  end
  subgraph После
    A1["Подмножество инструментов<br/>по намерению запроса"]
    A2["Стабильный префикс впереди<br/>кэшированные токены стоят примерно в десять раз дешевле"]
    A3["Дешёвая на роутинге<br/>дорогая на решении"]
    A4["Обрезка и сжатие истории"]
  end
  B1 --> A1
  B2 --> A2
  B3 --> A3
  B4 --> A4`,
    en: `flowchart LR
  subgraph Before
    B1["Every schema every time"]
    B2["Prefix not cached"]
    B3["One expensive model for everything"]
    B4["Full history"]
  end
  subgraph After
    A1["Tool subset<br/>chosen by intent"]
    A2["Stable prefix first<br/>cached tokens cost about ten times less"]
    A3["Cheap model to route<br/>expensive one to decide"]
    A4["History trimmed and summarised"]
  end
  B1 --> A1
  B2 --> A2
  B3 --> A3
  B4 --> A4`,
    pl: `flowchart LR
  subgraph Przed
    B1["Wszystkie schematy za każdym razem"]
    B2["Prefiks bez cache"]
    B3["Jeden drogi model do wszystkiego"]
    B4["Cała historia"]
  end
  subgraph Po
    A1["Podzbiór narzędzi<br/>wybrany po intencji"]
    A2["Stabilny prefiks na początku<br/>tokeny z cache kosztują około dziesięciokrotnie mniej"]
    A3["Tani model do routingu<br/>drogi do decyzji"]
    A4["Historia obcięta i streszczona"]
  end
  B1 --> A1
  B2 --> A2
  B3 --> A3
  B4 --> A4`,
  },
};
