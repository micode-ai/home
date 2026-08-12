# Integracja Accounting AI Agent (eKsiegowyAi) z wFirma — brief techniczny

Przygotowane przez MiCode Sp. z o.o. dla zespołu partnerskiego wFirma, jako odpowiedź
na ewentualne pytania po zgłoszeniu aplikacji integrującej się z wFirma. Wszystkie
poniższe stwierdzenia pochodzą z opublikowanych materiałów MiCode (blog, strona
produktu, `llms.txt`) — link do każdego z nich w nawiasie.

## 1. Co to jest

Accounting AI Agent (wersja hostowana: **eKsiegowyAi**, eKsiegowyAi.pl) to asystent AI
dla księgowych i właścicieli firm w Polsce. Odpowiada na pytania o VAT, PIT, CIT i ZUS
oraz na pytania o dane samej firmy — faktury, kontrahentów, rachunki bankowe, adres
rejestrowy — czytane na żywo z konta wFirma użytkownika przez API, a nie z pamięci
modelu językowego.

Czego nie robi: **nie składa za użytkownika deklaracji podatkowych** do urzędu i
**nie zastępuje księgowego ani doradcy podatkowego** — odpowiedzialność za
sprawozdawczość i ostateczne decyzje zostają po stronie użytkownika i jego księgowego.
Jedyny wyjątek to faktury ustrukturyzowane: te agent potrafi wysłać do KSeF i odebrać
za nie urzędowe potwierdzenie (UPO).
(*„Czy istnieje asystent AI podłączony do wFirma?"*, sekcje „Czego asystent nie zrobi?"
i FAQ „Czy asystent składa za mnie deklaracje podatkowe?")

## 2. Jakie dane czyta z wFirma i co z nimi robi

Z wFirma agent czyta: faktury i historię faktur, dane firmy (nazwa, NIP, REGON, adres
rejestrowy), kontrahentów, rachunki bankowe oraz płatności i wydatki. Te dane trafiają
do dwóch zastosowań:

- **Odpowiedzi na pytania o własne dane** — np. ile faktur wystawiono w danym miesiącu,
  czy dane kontrahenta są poprawne, jakie rachunki bankowe są podpięte, czy adres
  rejestrowy jest kompletny (niekompletny adres jest opisywany jako realny problem —
  utrudnia wystawianie faktur i korespondencję z urzędem).
- **Odpowiedzi podatkowe oparte na realnych danych** — stawki VAT, rozliczenia PIT/CIT,
  wymagania ZUS, zawsze w odniesieniu do faktycznych dokumentów firmy, a nie do
  domysłów modelu.

Zestaw narzędzi (patrz sekcja 5) obejmuje m.in. kategorie „Firma i kontrahenci —
wyszukiwanie po NIP, rejestry", „Faktury i sprzedaż — utwórz · wyślij · PDF",
„Płatności i wydatki" oraz „Podatki: KPiR · JPK_VAT · PIT".
(*„Automatyzacja rozliczeń księgowych w Polsce za pomocą agenta AI"*;
*„Jak działa Accounting AI Agent"*, diagram `accounting-tools-map` i `accounting-grounding`)

## 3. Czy agent zapisuje coś z powrotem

Tak. Najnowszy opublikowany materiał (12.08.2026) stwierdza to wprost: „Integracja
działa w obie strony, więc agent nie tylko czyta, ale i zapisuje — po Twoim
potwierdzeniu." Konkretne, nazwane w materiałach akcje zapisu:

- utworzenie kontrahenta,
- wystawienie faktury,
- obliczenie wynagrodzenia (moduł kadrowo-płacowy, opcjonalny),
- zamiana paragonu sfotografowanego w Telegramie na gotowy wydatek w wFirma
  (kontrahent dobierany automatycznie po NIP).

Osobno: faktury ustrukturyzowane (utworzone na czacie lub istniejące już w wFirma) są
generowane w formacie FA(3) i wysyłane do KSeF — państwowego systemu e-faktur, a nie
do samego wFirma. Osobna usługa w tle śledzi status wysłanych faktur i odbiera
urzędowe potwierdzenie (UPO); faktury przychodzące z KSeF są automatycznie dopasowywane
do istniejących zapisów w wFirma.

Wcześniejszy artykuł (30.06.2026) opisuje integrację ogólniej jako działającą „w obie
strony", bez wymieniania konkretnych akcji zapisu ani mechanizmu potwierdzenia —
patrz uwaga o niezgodności na końcu dokumentu.
(*„Czy istnieje asystent AI podłączony do wFirma?"*, sekcja „Skąd bierze dane…";
*„Jak działa Accounting AI Agent"*, sekcja „KSeF: e-faktury po państwowemu")

## 4. Autoryzacja i dane użytkownika

**Klucz do modelu językowego (OpenAI albo Google Gemini) należy do użytkownika.**
Użytkownik podłącza własny klucz, który jest przechowywany w bazie danych **w postaci
zaszyfrowanej**, a zużycie tokenów jest rozliczane bezpośrednio z dostawcą modelu, nie
z MiCode. Obsługa Anthropic została usunięta wiosną 2026 roku.

Co do samego konta wFirma — materiały opisują jedynie, że użytkownik „podłącza wFirma"
i że integracja rozmawia z API wFirma; **konkretny mechanizm autoryzacji (np. rodzaj
klucza API, OAuth) oraz sposób przechowywania danych uwierzytelniających do wFirma nie
są opisane publicznie** i nie powinny być tu zakładane (patrz sekcja „Co świadomie
pominięto" na końcu).

Ogólne zabezpieczenia platformy, opisane dla warstwy serwera samego produktu:
logowanie na tokenach, haszowanie haseł, ograniczanie częstości zapytań (rate
limiting), walidacja danych wejściowych, ochrona przed wstrzyknięciami do bazy danych
oraz dziennik audytu dla każdej operacji zmieniającej dane. Cały stos — łącznie z
bazą danych i kluczami — można też uruchomić samodzielnie (kod jest open source), co
daje pełną kontrolę nad danymi.
(*„Jak działa Accounting AI Agent"*, sekcje „Twoje klucze, Twój wybór modelu" i
podsumowanie; *„Czy istnieje asystent AI podłączony do wFirma?"*, sekcja „Ile kosztuje
wypróbowanie?")

## 5. Co działa poza wFirma

- **Model / agent**: jeden agent na LangGraph (nie „rój" wielu agentów), pętla
  „rozumowanie → działanie", z twardym limitem 25 kroków na zapytanie. Bazowe **58
  narzędzi** dostępne zawsze; +15 dla kadr i płac oraz +9 dla KSeF, jeśli te
  możliwości są skonfigurowane — razem **do 82 narzędzi**. Obsługiwani dostawcy
  modelu: OpenAI (w tym rodziny gpt-5, o1, o3, obsługiwane wg ich szczególnych reguł)
  i Google Gemini. Część narzędzi (kalendarz terminów podatkowych, sprawdzenie na
  Białej Liście) działa nawet bez podłączonej wFirma.
- **Rozpoznawanie paragonów (OCR)**: model **GPT-4o z obsługą obrazów (vision)**.
  Użytkownik wysyła zdjęcie paragonu w Telegramie; rozpoznanie następuje w osobnym
  kroku, jeszcze przed uruchomieniem agenta AI, i zwraca ustrukturyzowaną kartę
  (sprzedawca, kwota, data, NIP).
- **Polskie rejestry publiczne**: Biała Lista Ministerstwa Finansów i KRS — do
  autouzupełniania nazwy, REGON i adresu kontrahenta po samym numerze NIP, oraz do
  obowiązkowej z mocy prawa (art. 117ba Ordynacji podatkowej) weryfikacji rachunku
  kontrahenta dla każdej płatności od 15 000 zł.
- **KSeF**: generowanie faktury w formacie FA(3), wysyłka do państwowego systemu
  e-faktur, odbiór urzędowego potwierdzenia (UPO) i dopasowywanie faktur
  przychodzących do zapisów wFirma.
- **Pamięć długoterminowa**: przechowywana w PostgreSQL, napełniana **regułami
  deterministycznymi** (wykrywanie wyraźnych znaczników w rozmowie), **bez udziału
  modelu AI** — więc bez dodatkowego ryzyka halucynacji na tym etapie. Fakty, które
  długo się nie przydają, „wygasają"; do promptu trafia tylko kilkanaście
  najważniejszych rekordów w ramach ścisłego budżetu znaków.
- **Infrastruktura**: panel webowy i bot Telegram jako punkty wejścia; PostgreSQL na
  dane i pamięć agenta; Redis na sesje i ograniczanie obciążenia.

(*„Jak działa Accounting AI Agent"* — całość, w tym diagramy `accounting-system-overview`,
`accounting-tools-map`, `accounting-ksef`, `accounting-ocr`, `accounting-memory-lifecycle`)

## 6. Gdzie jest kod i wersja hostowana

- Kod źródłowy: otwarty i darmowy na GitHubie —
  `https://github.com/micode-ai/accounting-ai-agent`. Cały stos można postawić
  samodzielnie (własny serwer, własna baza, własne klucze).
- Wersja hostowana: **eKsiegowyAi.pl**, w modelu subskrypcyjnym, dla zespołów, które
  chcą zarządzanego hostingu.
- Strona produktu: `https://mi-code.pl/products/accounting-ai/`.

## 7. Co możemy pokazać

- Demo agenta działającego na koncie wFirma (produkcyjnym lub testowym).
- Przegląd kodu warstwy integracyjnej z wFirma i zestawu narzędzi (58 podstawowych +
  opcjonalne moduły HR/KSeF) na GitHubie.
- Pokazanie na żywo przepływu potwierdzenia przed zapisem oraz obowiązkowej kontroli
  Białej Listy dla dużych płatności.
- Kontakt do dalszej rozmowy: **development@mi-code.pl**.

---

## Note for whoever sends this (not for wFirma)

The repository does not state the following details. If wFirma's team asks about any
of them, verify against the actual codebase before answering — do not repeat anything
from this brief as if it covered them:

- The exact wFirma API endpoints, request/response payloads, or API version in use.
- The specific mechanism used to authorize a user's wFirma account (API key format vs.
  OAuth) and where/how that wFirma credential is stored at rest. (Only the LLM
  provider key — OpenAI/Gemini — is documented as user-owned and stored encrypted;
  the wFirma credential's storage is never described in the published material.)
- Whether payroll calculations are written back into wFirma's HR module or only
  computed and shown to the user.
- Whether KSeF submission goes through wFirma's own KSeF integration or directly
  against the Ministry of Finance's KSeF API.
- Rate limits, retry/backoff behavior, or error handling specific to wFirma API calls.
- Any wFirma OAuth/API scopes or permissions requested, and whether reads and writes
  are gated separately per action.
- Production usage volume (number of active wFirma-connected accounts).
- SLA, uptime, or data-residency commitments for the hosted eKsiegowyAi.pl service.

## Discrepancy between sources

The 2026-06-30 article ("Automatyzacja rozliczeń księgowych...") describes the wFirma
integration as working "in both directions" but only names read examples (pulling an
address list, checking linked bank accounts) and does not spell out concrete write
actions or a confirmation step. The 2026-08-12 article ("Czy istnieje asystent AI
podłączony do wFirma?") is the first to name specific write actions (create a
contractor, issue an invoice, calculate payroll, turn a scanned receipt into an
expense) and the first to state explicitly that writes happen "after your
confirmation." This brief follows the more recent, more specific statement, per
instructions. It is not a contradiction in substance, only in level of detail — but
worth knowing if wFirma's team has read the older post too.
