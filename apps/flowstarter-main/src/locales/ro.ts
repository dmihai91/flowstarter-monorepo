/**
 * Romanian translations
 * 
 * Extends English with Romanian overrides.
 * Keys not listed here fall back to English automatically.
 */

import en from './en';

const ro: typeof en = {
  ...en,

  // ─── Landing Page Hero ───────────────────────────────────────────────
  'landing.hero.badge': 'Creat pentru expertii reali',
  'landing.hero.headline1': 'Expertiza ta e reală.',
  'landing.hero.headline2': 'Prezența ta online ar trebui să fie la fel.',
  'landing.hero.pain':
    'Ai petrecut ani construind expertiza reala, relatii reale cu clientii si rezultate reale. Prezenta ta online ar trebui sa reflecte asta. Noi construim website-ul si sistemul de programari pe care munca ta chiar le merita.',
  'landing.hero.subheadline':
    'Website, booking și tot ce le conectează. Construite pentru tine în zile, nu luni. Tu te concentrezi pe clienții tăi. Noi ne asigurăm că alții noi te găsesc în continuare.',
  'landing.hero.cta': 'Programează un apel gratuit',
  'landing.hero.ctaNote':
    'Un singur apel. Fără jargon tehnic. Vei fi online în câteva zile.',
  'landing.hero.priceBuild': '€399',
  'landing.hero.priceBuildLabel': 'setup',
  'landing.hero.priceMonthly': '€39',
  'landing.hero.priceMonthlyLabel': '/lună',
  'landing.hero.priceNote': 'Early adopters: €39/lună · Utilizatori noi: €59/lună după 6 luni',

  // ─── Stats ────────────────────────────────────────────────────────────
  'landing.stats.weeks': 'Zile',
  'landing.stats.weeksLabel': 'NU LUNI, PÂNĂ LA LANSARE',
  'landing.stats.calls': '1',
  'landing.stats.callsLabel': 'UN SINGUR APEL PENTRU A ÎNCEPE',
  'landing.stats.techSkills': '0',
  'landing.stats.techSkillsLabel': 'MUNCĂ TEHNICĂ DIN PARTEA TA',

  // ─── How it works ─────────────────────────────────────────────────────
  'landing.howItWorks.title': 'Cum funcționează',
  'landing.howItWorks.text1': 'Acesta nu este un alt constructor de site-uri.',
  'landing.howItWorks.text2': 'Începem cu strategia: cine servești, ce oferi și cum să te poziționezi. Apoi designul este construit în jurul acesteia, nu în jurul unui template.',
  'landing.howItWorks.text3': 'Primești un site care sună ca tine, convertește cum ar trebui și nu te face să te jenezi când trimiți link-ul.',

  // ─── Editor ───────────────────────────────────────────────────────────
  'landing.editor.title': 'Actualizează site-ul oricând',
  'landing.editor.subtitle': 'Scrie ce vrei să schimbi. Editorul nostru AI face restul.',

  // ─── Pricing ──────────────────────────────────────────────────────────
  'landing.pricing.badge': 'Starter',
  'landing.pricing.limitedBadge': 'Beta',
  'landing.pricing.title': 'Starter',
  'landing.pricing.subtitle': 'Tot ce ai nevoie pentru a fi găsit online și a primi rezervări.',
  'landing.pricing.buildLabel': 'Setup',
  'landing.pricing.buildPrice': '€399',
  'landing.pricing.buildPeriod': 'o dată',
  'landing.pricing.careLabel': 'Îngrijire lunară',
  'landing.pricing.carePrice': '€39',
  'landing.pricing.carePeriod': '/lună',
  'landing.pricing.note': 'Prima lună gratuită. Facturarea începe la 30 de zile după lansare.',
  'landing.pricing.refund': '50% rambursare dacă nu ești mulțumit',
  'landing.pricing.assets': 'Primești toate fișierele site-ului',
  'landing.pricing.limitedNote': 'Prețul beta de €399 setup + €39/lună crește la €599 + €59/lună după beta',
  'landing.pricing.websiteTitle': 'Site-ul tău',
  'landing.pricing.websiteDesc': 'Construit o dată. Al tău pentru totdeauna.',
  'landing.pricing.websiteFeature1': 'Apel de descoperire pentru a înțelege afacerea ta',
  'landing.pricing.websiteFeature2': 'Site web proiectat din template-uri premium',
  'landing.pricing.websiteFeature3': 'Până la 7 pagini, construite după nevoile tale',
  'landing.pricing.websiteFeature4': 'Arată perfect pe telefon, tabletă și desktop',
  'landing.pricing.websiteFeature5': 'Domeniu propriu, conectat și configurat',
  'landing.pricing.careTitle': 'Îngrijire lunară',
  'landing.pricing.careDesc': 'Ce rămâne activ.',
  'landing.pricing.careFeature1': 'Site-ul tău rămâne online, rapid și securizat',
  'landing.pricing.careFeature2': 'Email profesional funcționează în continuare',
  'landing.pricing.careFeature3': 'Dashboard de analiză pentru afaceri',
  'landing.pricing.careFeature4': 'Editează conținut cu AI oricând',

  // ─── For you / Not for you ────────────────────────────────────────────
  'landing.forYou.title': 'Perfect pentru tine dacă...',
  'landing.forYou.item1': 'Ești un coach, terapeut, consultant, clinică, frizer sau salon de frumusețe',
  'landing.forYou.item2': 'Depinzi de programări și clienți locali',
  'landing.forYou.item3': 'Vrei să fii găsit online fără să înveți tehnologie',
  'landing.forYou.item4': 'Vrei să lași pe altcineva să gestioneze configurarea',
  'landing.notForYou.title': 'Nu potrivit dacă...',
  'landing.notForYou.item1': 'Vrei să construiești singur și să controlezi fiecare detaliu',
  'landing.notForYou.item2': 'Ai nevoie de funcționalitate complexă de e-commerce',
  'landing.notForYou.item3': 'Ai deja un web developer dedicat',
  'landing.notForYou.item4': 'Cauți cel mai ieftin option posibil',

  // ─── Final CTA ────────────────────────────────────────────────────────
  'landing.cta.title': 'Clienții tăi te caută acum.',
  'landing.cta.subtitle': 'Asigură-te că te găsesc.',
  'landing.cta.button': 'Rezervă Apelul Gratuit',
  'landing.cta.pricing': '€399 setup · €39/lună · Prima lună gratuită',
  // ─── How it works - 3 steps ───────────────────────────────────────────
  'landing.howItWorks.title': 'Trei pași pentru un site care îți aduce rezervări.',
  'landing.steps.step1.num': '01',
  'landing.steps.step1.title': 'Vorbim',
  'landing.steps.step1.desc': 'Un apel de 45 de minute. Ne spui despre afacerea ta și clienții tăi. Noi ne ocupăm de tot de acolo încolo.',
  'landing.steps.step2.num': '02',
  'landing.steps.step2.title': 'Construim',
  'landing.steps.step2.desc': 'Creăm site-ul tău și configurăm sistemul de rezervări, complet conectat și gata să primească programări. Verifici o dată și rafinăm.',
  'landing.steps.step3.num': '03',
  'landing.steps.step3.title': 'Clienții te găsesc și rezervă',
  'landing.steps.step3.desc': 'Site-ul tău intră live. Clienții noi te pot găsi, văd ce faci și rezervă direct. Nu mai sunt necesare apeluri pentru programări.',

  // ─── What's Included ─────────────────────────────────────────────────
  'landing.included.title': 'Tot ce ai nevoie pentru a fi găsit și rezervat.',
  'landing.included.subtitle': 'Un singur setup. Nicio subscripție de gestionat. Nicio tehnologie de înțeles.',
  'landing.included.setup.title': 'Setup',
  'landing.included.setup.label': '(o singură dată)',
  'landing.included.setup.desc': 'Ce construim pentru tine',
  'landing.included.setup.item1': 'Un site profesional construit în jurul afacerii și clienților tăi',
  'landing.included.setup.item2': 'Sistem de rezervări configurat și conectat, clienții pot programa fără să te sune',
  'landing.included.setup.item3': 'Buton WhatsApp pentru ca clienții să te contacteze dintr-o atingere',
  'landing.included.setup.item4': 'Site-ul funcționează perfect pe telefon, tabletă și desktop',
  'landing.included.setup.item5': 'Adresă de email profesională care se potrivește cu domeniul tău',
  'landing.included.setup.item6': 'Vezi câți oameni îți vizitează site-ul și de unde vin',
  'landing.included.setup.item7': 'Site-ul tău este pregătit să fie găsit pe Google din prima zi',
  'landing.included.setup.item8': 'Deții tot. Fișierele site-ului sunt ale tale',
  'landing.included.monthly.title': 'Îngrijire lunară',
  'landing.included.monthly.label': '(continuu)',
  'landing.included.monthly.desc': 'Ce rămâne activ',
  'landing.included.monthly.item1': 'Site-ul rămâne online, rapid și securizat în fiecare lună',
  'landing.included.monthly.item2': 'Emailul profesional funcționează fără întrerupere',
  'landing.included.monthly.item3': 'Stocare pentru fotografii și conținut',
  'landing.included.monthly.item4': 'Raport lunar de vizitatori ca să vezi cum performează site-ul',
  'landing.included.monthly.item5': 'Actualizări și îmbunătățiri gestionate pentru tine',
  'landing.included.monthly.item6': 'Suport când ai nevoie',
  'landing.included.monthly.item7': 'Sistemul de rezervări rămâne conectat și funcțional',

  // Three Pillars
  'landing.pillars.title': 'De ce expertii aleg Flowstarter',
  'landing.pillars.subtitle': 'Trei lucruri de care fiecare profesionist real are nevoie online.',
  'landing.pillars.differentiate.title': 'Diferentiaza-te',
  'landing.pillars.differentiate.subtitle': 'Iesi din multime',
  'landing.pillars.differentiate.body': 'Internetul recompenseaza ambalajul, nu substanta. Noi construim site-ul in jurul a ceea ce te face cu adevarat diferit: experienta ta reala, rezultatele tale reale, abordarea ta reala. Nu poze stock si cuvinte goale.',
  'landing.pillars.attract.title': 'Atrage',
  'landing.pillars.attract.subtitle': 'Fii gasit de clientii care apreciaza expertiza',
  'landing.pillars.attract.body': 'Clientii potriviti cauta pe cineva in care pot avea incredere. Noi ne asiguram ca te gasesc pe tine primul, cu un site care le vorbeste pe limba lor si le raspunde la intrebari inainte sa le puna.',
  'landing.pillars.convert.title': 'Converteste',
  'landing.pillars.convert.subtitle': 'Transforma vizitatorii in programari confirmate',
  'landing.pillars.convert.body': 'Fara formulare care nu duc nicaieri. Fara "contactati-ne" fara raspuns. Vizitatorii iti vad munca, inteleg valoarea ta si isi fac o programare. Totul intr-un singur flux, totul configurat pentru tine.',

  // Manifesto
  'landing.manifesto.title': 'Misiunea noastra',
  'landing.manifesto.headline': 'Fiecare expert real merita sa fie gasit.',
  'landing.manifesto.p1': 'Ai petrecut ani invatand lucruri care nu se gasesc pe Google. Cum sa citesti o situatie. Cand sa insisti si cand sa asculti. Diferenta dintre sfatul din manual si ceea ce functioneaza cu adevarat. Genul asta de cunoastere vine doar din munca, zi de zi, client dupa client.',
  'landing.manifesto.p2': 'Dar online, nimic din asta nu se vede. Internetul nu rasplateste profunzimea. Rasplateste pe cine posteaza cel mai mult, promoveaza cel mai tare si arata cel mai bine. Oamenii care chiar au nevoie de ajutorul tau? Trec pe langa tine fara sa te observe.',
  'landing.manifesto.p3': 'Am construit Flowstarter pentru ca noi credem ca prezenta ta online ar trebui sa reflecte expertiza ta reala. Nu un template completat la miezul noptii. Nu un placeholder pe care tot vrei sa-l schimbi. O reprezentare reala a cine esti, ce faci si de ce conteaza.',
  'landing.manifesto.p4': 'Un singur apel si ne ocupam de tot. Website-ul tau, sistemul de programari, tot setup-ul. Ca tu sa te intorci la ceea ce faci cu adevarat bine: sa ajuti oameni. Prezenta ta online continua sa lucreze in timp ce tu faci acelasi lucru.',
  'landing.manifesto.closing': 'Expertiza ta a schimbat vieti. Acum lasa oamenii sa te gaseasca.',

};

export default ro;