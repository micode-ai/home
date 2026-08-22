// Tabular content embedded in blog articles.
// Referenced from a post body via the `[[table:<id>]]` marker (see ArticlePage.svelte).
// Keyed by a stable id, then by language — same convention as article-diagrams.ts.
//
// Every figure here is a MODEL evaluated on declared assumptions, never measured production
// spend. `cost-assumptions` row labels deliberately mirror the `costCalc.*` field labels in
// src/data/{pl,en,ru}.json, and `cost-before-after` mirrors `costCalc.comp.*`, so the article
// and the calculator widget below it name the same things.
//
// `cost-before-after` is `computeAgentCost` from src/services/agentCost.ts evaluated on the
// `cost-assumptions` configuration at 8 steps and 1500 tasks/month for gpt-5.4-mini without
// the EU residency uplift, at cachedShare 0 and 0.9. Component cells are rounded to the cent,
// so they sum to 74.37 while the exact total is 74.376 — the total row carries 74.38, which is
// what the calculator renders. Keep the two in sync if the assumptions ever change.

type Lang = 'ru' | 'en' | 'pl';

export type ArticleTable = {
  headers: string[];
  rows: string[][];
};

export const articleTables: Record<string, Record<Lang, ArticleTable>> = {
  'cost-assumptions': {
    ru: {
      headers: ['Допущение', 'Значение'],
      rows: [
        ['Инструментов у агента', '80'],
        ['Токенов на схему инструмента', '180'],
        ['Токенов в системном промпте', '1200'],
        ['Токенов истории в запросе', '2000'],
        ['Токенов найденного контекста (RAG)', '1500'],
        ['Токенов ответа на шаг', '300'],
        ['Шагов на задачу', '8 (в калькуляторе вилка 4–12)'],
        ['Задач в день', '50'],
        ['Дней в месяце', '30'],
        ['Модель', 'gpt-5.4-mini'],
      ],
    },
    en: {
      headers: ['Assumption', 'Value'],
      rows: [
        ['Tools the agent has', '80'],
        ['Tokens per tool schema', '180'],
        ['Tokens in the system prompt', '1200'],
        ['History tokens per request', '2000'],
        ['Retrieved context tokens (RAG)', '1500'],
        ['Output tokens per step', '300'],
        ['Steps per task', '8 (4–12 range in the calculator)'],
        ['Tasks per day', '50'],
        ['Days per month', '30'],
        ['Model', 'gpt-5.4-mini'],
      ],
    },
    pl: {
      headers: ['Założenie', 'Wartość'],
      rows: [
        ['Liczba narzędzi agenta', '80'],
        ['Tokenów na schemat narzędzia', '180'],
        ['Tokenów w prompcie systemowym', '1200'],
        ['Tokenów historii w zapytaniu', '2000'],
        ['Tokenów znalezionego kontekstu (RAG)', '1500'],
        ['Tokenów odpowiedzi na krok', '300'],
        ['Kroków na zadanie', '8 (w kalkulatorze widełki 4–12)'],
        ['Zadań dziennie', '50'],
        ['Dni w miesiącu', '30'],
        ['Model', 'gpt-5.4-mini'],
      ],
    },
  },

  'cost-before-after': {
    ru: {
      headers: ['Составляющая', 'Без рычагов, USD/мес', 'С кэшем 90%, USD/мес'],
      rows: [
        ['Схемы инструментов', '129.60', '24.62'],
        ['Системный промпт', '10.80', '2.05'],
        ['История диалога', '18.00', '18.00'],
        ['Найденный контекст (RAG)', '13.50', '13.50'],
        ['Ответ модели', '16.20', '16.20'],
        ['Итого', '188.10', '74.38'],
      ],
    },
    en: {
      headers: ['Component', 'No levers, USD/mo', 'With 90% cache, USD/mo'],
      rows: [
        ['Tool schemas', '129.60', '24.62'],
        ['System prompt', '10.80', '2.05'],
        ['Conversation history', '18.00', '18.00'],
        ['Retrieved context (RAG)', '13.50', '13.50'],
        ['Model output', '16.20', '16.20'],
        ['Total', '188.10', '74.38'],
      ],
    },
    pl: {
      headers: ['Składnik', 'Bez dźwigni, USD/mies.', 'Z cache 90%, USD/mies.'],
      rows: [
        ['Schematy narzędzi', '129.60', '24.62'],
        ['Prompt systemowy', '10.80', '2.05'],
        ['Historia rozmowy', '18.00', '18.00'],
        ['Znaleziony kontekst (RAG)', '13.50', '13.50'],
        ['Odpowiedź modelu', '16.20', '16.20'],
        ['Razem', '188.10', '74.38'],
      ],
    },
  },

  // AI Act compliance calendar as it stands after Regulation (EU) 2026/1744 (Digital Omnibus
  // on AI, in force 27 July 2026) and Poland's act on AI systems (core provisions in force
  // 11 August 2026). The two December 2026 / December 2027 rows are the deferred dates, not
  // the original ones — if the calendar shifts again, this table and the article body that
  // states the same dates in prose have to move together.
  'ai-act-dates': {
    ru: {
      headers: ['Дата', 'Что вступает в силу', 'Кого касается'],
      rows: [
        ['2 февраля 2025', 'Запрещённые практики (ст. 5) и ИИ-грамотность (ст. 4)', 'Всех — поставщиков и внедряющих'],
        ['2 августа 2025', 'Обязанности поставщиков моделей общего назначения (GPAI)', 'Поставщиков моделей'],
        ['2 августа 2026', 'Прозрачность по ст. 50; штрафные полномочия Комиссии по GPAI', 'Чат-боты, генераторы контента, дипфейки, распознавание эмоций'],
        ['11 августа 2026', 'Польский закон о системах ИИ: надзор, нотифицированные органы, песочницы', 'Польский рынок'],
        ['28 октября 2026', 'KRiBSI может налагать административные штрафы', 'Польский рынок'],
        ['2 декабря 2026', 'Конец отсрочки на машиночитаемую маркировку контента', 'Поставщиков генераторов контента'],
        ['2 декабря 2027', 'Системы высокого риска, Приложение III (после переноса)', 'Найм, образование, кредиты, госуслуги'],
        ['2 августа 2028', 'Системы высокого риска, Приложение I (после переноса)', 'ИИ, встроенный в регулируемые продукты'],
      ],
    },
    en: {
      headers: ['Date', 'What starts applying', 'Who it affects'],
      rows: [
        ['2 February 2025', 'Prohibited practices (Art. 5) and AI literacy (Art. 4)', 'Everyone — providers and deployers'],
        ['2 August 2025', 'Obligations for providers of general-purpose AI models (GPAI)', 'Model providers'],
        ['2 August 2026', 'Article 50 transparency; Commission fining powers over GPAI', 'Chatbots, content generators, deepfakes, emotion recognition'],
        ['11 August 2026', 'Poland’s AI systems act: supervision, notified bodies, sandboxes', 'The Polish market'],
        ['28 October 2026', 'KRiBSI can impose administrative fines', 'The Polish market'],
        ['2 December 2026', 'End of the grace period for machine-readable content marking', 'Providers of content generators'],
        ['2 December 2027', 'High-risk systems, Annex III (after the deferral)', 'Hiring, education, credit, public services'],
        ['2 August 2028', 'High-risk systems, Annex I (after the deferral)', 'AI embedded in regulated products'],
      ],
    },
    pl: {
      headers: ['Data', 'Co zaczyna obowiązywać', 'Kogo dotyczy'],
      rows: [
        ['2 lutego 2025', 'Praktyki zakazane (art. 5) i kompetencje AI (art. 4)', 'Wszystkich — dostawców i wdrażających'],
        ['2 sierpnia 2025', 'Obowiązki dostawców modeli ogólnego przeznaczenia (GPAI)', 'Dostawców modeli'],
        ['2 sierpnia 2026', 'Przejrzystość z art. 50; uprawnienia Komisji do kar wobec GPAI', 'Chatboty, generatory treści, deepfake, rozpoznawanie emocji'],
        ['11 sierpnia 2026', 'Polska ustawa o systemach AI: nadzór, jednostki notyfikowane, piaskownice', 'Rynek polski'],
        ['28 października 2026', 'KRiBSI może nakładać kary administracyjne', 'Rynek polski'],
        ['2 grudnia 2026', 'Koniec karencji na maszynowe znakowanie treści', 'Dostawców generatorów treści'],
        ['2 grudnia 2027', 'Systemy wysokiego ryzyka, Załącznik III (po przesunięciu)', 'Rekrutacja, edukacja, kredyty, usługi publiczne'],
        ['2 sierpnia 2028', 'Systemy wysokiego ryzyka, Załącznik I (po przesunięciu)', 'AI wbudowana w produkty regulowane'],
      ],
    },
  },

  // Obligatory KSeF calendar. Every date here traces to podatki.gov.pl / biznes.gov.pl:
  // 200 mln zł is measured on 2024 sales including VAT; the 10 000 zł relief and the
  // cash-register carve-out both expire 31 XII 2026; art. 106ni penalties and the KSeF
  // number in payments both start 1 I 2027. The prose in the article repeats these, so
  // the two have to move together.
  'ksef-dates': {
    ru: {
      headers: ['Дата', 'Что вступает в силу', 'Кого касается'],
      rows: [
        ['1 февраля 2026', 'Выставление счетов через KSeF', 'Продажи с налогом свыше 200 млн злотых за 2024 год'],
        ['1 февраля 2026', 'Приём счетов через KSeF', 'Всех налогоплательщиков, без исключений'],
        ['1 апреля 2026', 'Выставление счетов через KSeF', 'Остальных предпринимателей, включая освобождённых от НДС'],
        ['до 31 декабря 2026', 'Счета вне KSeF при продажах до 10 000 злотых в месяц', 'Самых мелких выставителей'],
        ['до 31 декабря 2026', 'Счета с кассовых аппаратов и чеки с ИНН как упрощённые счета', 'Розничную торговлю'],
        ['до 31 декабря 2026', 'Период без денежных штрафов по ст. 106ni закона об НДС', 'Всех'],
        ['1 января 2027', 'Денежные штрафы за нарушение обязанностей KSeF', 'Всех'],
        ['1 января 2027', 'Номер KSeF в сообщении перевода и при раздельном платеже', 'Платежи B2B между действующими плательщиками НДС'],
      ],
    },
    en: {
      headers: ['Date', 'What starts applying', 'Who it affects'],
      rows: [
        ['1 February 2026', 'Issuing invoices through KSeF', 'Sales including VAT above PLN 200 m in 2024'],
        ['1 February 2026', 'Receiving invoices through KSeF', 'Every taxpayer, no exceptions'],
        ['1 April 2026', 'Issuing invoices through KSeF', 'All remaining businesses, including those exempt from VAT'],
        ['through 31 December 2026', 'Invoices outside KSeF at sales up to PLN 10 000 a month', 'The smallest issuers'],
        ['through 31 December 2026', 'Cash-register invoices and tax-ID receipts as simplified invoices', 'Retail'],
        ['through 31 December 2026', 'Period without the monetary penalties of Art. 106ni of the VAT Act', 'Everyone'],
        ['1 January 2027', 'Monetary penalties for breaching KSeF duties', 'Everyone'],
        ['1 January 2027', 'KSeF number in the transfer message and under split payment', 'B2B payments between active VAT payers'],
      ],
    },
    pl: {
      headers: ['Data', 'Co zaczyna obowiązywać', 'Kogo dotyczy'],
      rows: [
        ['1 lutego 2026', 'Wystawianie faktur w KSeF', 'Sprzedaż z podatkiem powyżej 200 mln zł w 2024 r.'],
        ['1 lutego 2026', 'Odbieranie faktur z KSeF', 'Wszystkich podatników, bez wyjątku'],
        ['1 kwietnia 2026', 'Wystawianie faktur w KSeF', 'Pozostałych przedsiębiorców, także zwolnionych z VAT'],
        ['do 31 grudnia 2026', 'Faktury poza KSeF przy sprzedaży do 10 000 zł miesięcznie', 'Najmniejszych wystawców'],
        ['do 31 grudnia 2026', 'Faktury z kas rejestrujących i paragony z NIP jako faktury uproszczone', 'Handel detaliczny'],
        ['do 31 grudnia 2026', 'Okres bez kar pieniężnych z art. 106ni ustawy o VAT', 'Wszystkich'],
        ['1 stycznia 2027', 'Kary pieniężne za naruszenie obowiązków KSeF', 'Wszystkich'],
        ['1 stycznia 2027', 'Numer KSeF w komunikacie przelewu i przy podzielonej płatności', 'Płatności B2B między czynnymi podatnikami VAT'],
      ],
    },
  },

  // Status of Polish public funding instruments an SME could use for an AI/automation project,
  // as of 16 August 2026. Sources: the official FENG call schedule (XIX aktualizacja, valid from
  // 31.07.2026, nowoczesnagospodarka.gov.pl), funduszeunijne.gov.pl call pages, digit.arp.pl and
  // gov.pl/web/ncbr. Every "status" cell is a point-in-time claim — if a call opens or closes,
  // this table and the prose in the article that repeats the same dates have to move together.
  'ai-funding-2026': {
    ru: {
      headers: ['Инструмент', 'Для кого', 'Масштаб поддержки', 'Статус на 16.08.2026'],
      rows: [
        ['KPO — инвестиции для предприятий', 'МСП и крупные компании', '—', 'Закрыт: приём завершён, 31.08.2026 — срок достижения показателей'],
        ['FENG 1.1 Ścieżka SMART — консорциумы (NCBR)', 'Консорциумы фирм, в том числе с научными организациями или НКО', 'Аллокация 350 млн зл., минимум 3 млн зл. затрат, до 140 млн зл. на проект', 'Открыт: 7.08–16.10.2026'],
        ['FENG 1.1 Ścieżka SMART — НИОКР (PARP)', 'Отдельные МСП', 'Аллокация 500 млн зл.', 'Объявлен: анонс 29.09.2026, приём 29.10–29.12.2026'],
        ['FENG 1.1 Ścieżka SMART — внедрение результатов НИОКР (PARP)', 'Отдельные МСП', 'В приёме 2026 года: 700 млн зл., до 50 млн зл. на проект, минимум 3 млн зл. затрат', 'Завершён 11.06.2026; следующий: анонс 17.12.2026, приём 21.01–16.03.2027'],
        ['FENG 2.12 Granty na eurogranty (PARP)', 'МСП и научные организации', 'Аллокация 20 млн зл.; паушальная сумма на подготовку заявки на европейский грант', 'Открыт до 3.09.2026; следующий X.2026–II.2027'],
        ['FENG 2.32 Технологический кредит (BGK)', 'МСП', 'Технологическая премия, гасящая часть кредита', 'Приёма нет — аллокация исчерпана после конкурса 2023 года'],
        ['Dig.IT Цифровая трансформация (ARP)', 'МСП из обрабатывающей промышленности и производственных услуг', '150–850 тыс. зл., до 50% затрат, помощь de minimis', 'Открытого приёма нет; пилот закрыт 28.11.2025'],
        ['FEPW 1.2 Автоматизация и роботизация в МСП (PARP)', 'МСП Восточной Польши', 'До 3 млн зл., интенсивность до 85% в зависимости от категории затрат', 'Завершён — последний приём 1.08–26.09.2024'],
        ['16 региональных программ', 'МСП в своём воеводстве', 'Зависит от региона', 'Собственные графики — смотрите программу своего воеводства'],
        ['EDIH — европейские хабы цифровых инноваций', 'МСП', 'Услуги, а не деньги; помощь de minimis', 'Работают — но это не грант на внедрение'],
      ],
    },
    en: {
      headers: ['Instrument', 'Who it is for', 'Scale of support', 'Status on 16.08.2026'],
      rows: [
        ['KPO — investments for enterprises', 'SMEs and large companies', '—', 'Closed: calls settled, 31.08.2026 is the deadline for hitting the targets'],
        ['FENG 1.1 Ścieżka SMART — consortia (NCBR)', 'Consortia of firms, also with research organisations or NGOs', 'PLN 350 m allocation, min. PLN 3 m eligible costs, up to PLN 140 m per project', 'Open: 7.08–16.10.2026'],
        ['FENG 1.1 Ścieżka SMART — R&D (PARP)', 'Individual SMEs', 'PLN 500 m allocation', 'Announced: launch 29.09.2026, call 29.10–29.12.2026'],
        ['FENG 1.1 Ścieżka SMART — deployment of R&D results (PARP)', 'Individual SMEs', 'In the 2026 call: PLN 700 m, up to PLN 50 m per project, min. PLN 3 m of costs', 'Closed 11.06.2026; next: launch 17.12.2026, call 21.01–16.03.2027'],
        ['FENG 2.12 Granty na eurogranty (PARP)', 'SMEs and research organisations', 'PLN 20 m allocation; a lump sum to prepare a European grant application', 'Open until 3.09.2026; next Oct 2026–Feb 2027'],
        ['FENG 2.32 Technology loan (BGK)', 'SMEs', 'A technology bonus repaying part of the loan', 'No call — the allocation was exhausted after the 2023 competition'],
        ['Dig.IT Digital Transformation (ARP)', 'SMEs in manufacturing and production services', 'PLN 150,000–850,000, up to 50% of costs, de minimis aid', 'No open call; the pilot closed 28.11.2025'],
        ['FEPW 1.2 Automation and robotisation in SMEs (PARP)', 'SMEs in Eastern Poland', 'Up to PLN 3 m, intensity up to 85% depending on the cost category', 'Closed — the last call ran 1.08–26.09.2024'],
        ['16 regional programmes', 'SMEs in a given voivodeship', 'Depends on the region', 'Own schedules — check your voivodeship’s programme'],
        ['EDIH — European Digital Innovation Hubs', 'SMEs', 'Services, not cash; de minimis aid', 'Operating — but this is not a deployment grant'],
      ],
    },
    pl: {
      headers: ['Instrument', 'Dla kogo', 'Skala wsparcia', 'Status na 16.08.2026'],
      rows: [
        ['KPO — inwestycje dla przedsiębiorstw', 'MŚP i duże firmy', '—', 'Zamknięty: nabory rozstrzygnięte, 31.08.2026 to termin osiągnięcia wskaźników'],
        ['FENG 1.1 Ścieżka SMART — konsorcja (NCBR)', 'Konsorcja firm, także z organizacjami badawczymi lub NGO', 'Alokacja 350 mln zł, min. 3 mln zł kosztów kwalifikowalnych, do 140 mln zł na projekt', 'Otwarty: 7.08–16.10.2026'],
        ['FENG 1.1 Ścieżka SMART — B+R (PARP)', 'Pojedyncze MŚP', 'Alokacja 500 mln zł', 'Zapowiedziany: ogłoszenie 29.09.2026, nabór 29.10–29.12.2026'],
        ['FENG 1.1 Ścieżka SMART — wdrożenie wyników B+R (PARP)', 'Pojedyncze MŚP', 'W naborze z 2026 r.: 700 mln zł, do 50 mln zł na projekt, min. 3 mln zł kosztów', 'Zakończony 11.06.2026; kolejny: ogłoszenie 17.12.2026, nabór 21.01–16.03.2027'],
        ['FENG 2.12 Granty na eurogranty (PARP)', 'MŚP i organizacje badawcze', 'Alokacja 20 mln zł; ryczałt na przygotowanie wniosku o grant europejski', 'Otwarty do 3.09.2026; kolejny X.2026–II.2027'],
        ['FENG 2.32 Kredyt technologiczny (BGK)', 'MŚP', 'Premia technologiczna spłacająca część kredytu', 'Brak naboru — alokacja wyczerpana po konkursie z 2023 r.'],
        ['Dig.IT Transformacja Cyfrowa (ARP)', 'MŚP z przetwórstwa przemysłowego i usług produkcyjnych', '150–850 tys. zł, do 50% kosztów, pomoc de minimis', 'Brak otwartego naboru; pilotaż zamknięty 28.11.2025'],
        ['FEPW 1.2 Automatyzacja i robotyzacja w MŚP (PARP)', 'MŚP z Polski Wschodniej', 'Do 3 mln zł, intensywność do 85% zależnie od kategorii kosztów', 'Zakończony — ostatni nabór 1.08–26.09.2024'],
        ['16 programów regionalnych', 'MŚP w danym województwie', 'Zależnie od regionu', 'Własne harmonogramy — sprawdź program swojego województwa'],
        ['EDIH — Europejskie Huby Innowacji Cyfrowych', 'MŚP', 'Usługi, nie gotówka; pomoc de minimis', 'Działają — ale to nie jest dotacja na wdrożenie'],
      ],
    },
  },

  // The four Polish income-tax reliefs an AI/automation project can realistically touch, with the
  // statutory anchors quoted in the article prose. Rates are from podatki.gov.pl; the robotisation
  // sunset ("tax year that began in 2026") is the statutory wording, not a projection.
  'ai-tax-reliefs-2026': {
    ru: {
      headers: ['Льгота', 'Кто может воспользоваться', 'Что даёт', 'Статус на 16.08.2026'],
      rows: [
        ['Льгота B+R (ст. 18d–18e CIT, ст. 26e PIT)', 'Плательщики CIT и PIT по шкале или линейной ставке, ведущие деятельность B+R', '100% квалифицированных затрат, 200% зарплат сотрудников и исполнителей по договорам', 'Бессрочная, без конкурса'],
        ['Льгота на инновационных сотрудников (ст. 18db CIT)', 'Фирмы с убытком или слишком малым доходом, чтобы вычесть льготу B+R целиком', 'Уменьшение авансов по PIT сотрудников, занятых в B+R не менее 50% рабочего времени', 'Бессрочная, без конкурса'],
        ['IP Box (ст. 24d CIT, ст. 30ca PIT)', 'Доход от квалифицированного права ИС, в том числе от авторского права на программу', '5% налога на доход от квалифицированного права ИС', 'Бессрочная; с 2022 года совмещается с льготой B+R'],
        ['Льгота на роботизацию (ст. 38eb CIT, ст. 52jb PIT)', 'Плательщики CIT и PIT, покупающие промышленных роботов', 'Дополнительные 50% затрат на роботизацию', 'До конца налогового года, начавшегося в 2026 году'],
      ],
    },
    en: {
      headers: ['Relief', 'Who can use it', 'What it gives', 'Status on 16.08.2026'],
      rows: [
        ['R&D relief (Art. 18d–18e CIT, Art. 26e PIT)', 'CIT payers and PIT payers on the scale or flat rate who run R&D activity', '100% of qualified costs, 200% of salaries of employees and contractors', 'Open-ended, no competition'],
        ['Innovative employees relief (Art. 18db CIT)', 'Firms with a loss, or too little income to deduct the whole R&D relief', 'Reduces PIT advances of staff spending at least 50% of their time on R&D', 'Open-ended, no competition'],
        ['IP Box (Art. 24d CIT, Art. 30ca PIT)', 'Income from a qualified IP right, including copyright in a computer program', '5% tax on income from the qualified IP right', 'Open-ended; combinable with the R&D relief since 2022'],
        ['Robotisation relief (Art. 38eb CIT, Art. 52jb PIT)', 'CIT and PIT payers buying industrial robots', 'An extra 50% of robotisation costs', 'Through the end of the tax year that began in 2026'],
      ],
    },
    pl: {
      headers: ['Ulga', 'Kto może skorzystać', 'Ile daje', 'Status na 16.08.2026'],
      rows: [
        ['Ulga B+R (art. 18d–18e CIT, art. 26e PIT)', 'Podatnicy CIT oraz PIT na skali lub liniowym, prowadzący działalność B+R', '100% kosztów kwalifikowanych, 200% wynagrodzeń pracowników i zleceniobiorców', 'Bezterminowa, bez naboru'],
        ['Ulga na innowacyjnych pracowników (art. 18db CIT)', 'Firmy ze stratą albo ze zbyt niskim dochodem, żeby odliczyć całą ulgę B+R', 'Pomniejsza zaliczki PIT osób poświęcających B+R co najmniej 50% czasu pracy', 'Bezterminowa, bez naboru'],
        ['IP Box (art. 24d CIT, art. 30ca PIT)', 'Dochód z kwalifikowanego prawa IP, w tym z autorskiego prawa do programu komputerowego', '5% podatku od dochodu z kwalifikowanego prawa IP', 'Bezterminowa; od 2022 łączy się z ulgą B+R'],
        ['Ulga na robotyzację (art. 38eb CIT, art. 52jb PIT)', 'Podatnicy CIT i PIT kupujący roboty przemysłowe', 'Dodatkowe 50% kosztów robotyzacji', 'Do końca roku podatkowego, który rozpoczął się w 2026 r.'],
      ],
    },
  },

  'ai-visibility-quota': {
    ru: {
      headers: ['Ограничение свободного тарифа', 'Значение'],
      rows: [
        ['Вызовов модели в день (на проект, на модель)', '20'],
        ['Реально используемый дневной бюджет', '18 (запас под лимитом)'],
        ['Вызовов на полный обход', '54 (27 промптов × 2 повтора)'],
        ['Дней на закрытие одного обхода', '3'],
        ['Пауза между вызовами (лимит в минуту)', '6,5 секунды'],
      ],
    },
    en: {
      headers: ['Free-tier constraint', 'Value'],
      rows: [
        ['Model calls allowed per day (per project, per model)', '20'],
        ['Daily budget actually used', '18 (headroom under the cap)'],
        ['Calls for one full sweep', '54 (27 prompts × 2 repeats)'],
        ['Days needed to close one sweep', '3'],
        ['Pacing gap between calls (per-minute limit)', '6.5 seconds'],
      ],
    },
    pl: {
      headers: ['Ograniczenie darmowego tieru', 'Wartość'],
      rows: [
        ['Wywołań modelu dziennie (na projekt, na model)', '20'],
        ['Realnie wykorzystywany dzienny budżet', '18 (margines pod limitem)'],
        ['Wywołań na pełny przegląd', '54 (27 promptów × 2 powtórzenia)'],
        ['Dni potrzebnych na zamknięcie przeglądu', '3'],
        ['Odstęp między wywołaniami (limit na minutę)', '6,5 sekundy'],
      ],
    },
  },
};
