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
  draft --> draft: правки (ИИ или вручную)
  draft --> vp: ревью куратора
  draft --> vn: ревью юриста
  vp --> [*]
  vn --> [*]
  note right of draft
    Черновики бот тоже показывает,
    но честно помечает их
    как ещё не проверенные
  end note`,
    en: `stateDiagram-v2
  state "draft" as draft
  state "verified — practice" as vp
  state "verified — norm" as vn
  [*] --> draft: created by curator
  draft --> draft: edits (AI or manual)
  draft --> vp: curator review
  draft --> vn: lawyer review
  vp --> [*]
  vn --> [*]
  note right of draft
    The bot still shows drafts,
    but honestly marks them
    as not yet verified
  end note`,
    pl: `stateDiagram-v2
  state "szkic" as draft
  state "zweryfikowane — praktyka" as vp
  state "zweryfikowane — norma" as vn
  [*] --> draft: tworzy kurator
  draft --> draft: poprawki (AI lub ręcznie)
  draft --> vp: recenzja kuratora
  draft --> vn: recenzja prawnika
  vp --> [*]
  vn --> [*]
  note right of draft
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
};
