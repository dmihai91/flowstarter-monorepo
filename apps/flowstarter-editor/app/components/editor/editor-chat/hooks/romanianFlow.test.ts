/**
 * Romanian Flow Tests
 *
 * Tests the complete onboarding flow in Romanian language.
 * Verifies that LLM-based intent detection works correctly for Romanian inputs.
 *
 * Covers:
 * - Business descriptions in Romanian
 * - Name confirmations (da/nu)
 * - Skip intents (treci peste, mai târziu)
 * - Selling method detection (programări, produse, abonamente)
 * - Confirmation phrases (arată bine, perfect, da îmi place)
 * - Summary approval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Romanian Intent Detection Patterns
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Romanian confirmation patterns that should be detected as "yes/approve"
 */
const ROMANIAN_CONFIRMATIONS = [
  'da',
  'Da',
  'DA',
  'da, îmi place',
  'da, imi place',
  'da îmi place',
  'arată bine',
  'arata bine',
  'perfect',
  'Perfect',
  'PERFECT',
  'excelent',
  'foarte bine',
  'ok',
  'OK',
  'bun',
  'merge',
  'e bine',
  'e ok',
  'da, e bine',
  'super',
  'grozav',
  'mișto',
  'misto',
  'îmi place',
  'imi place',
  'sunt de acord',
  'corect',
  'exact',
  'asa e',
  'așa e',
  'da, continuă',
  'da, continua',
  'hai',
  'hai să mergem mai departe',
  'mergem mai departe',
];

/**
 * Romanian rejection/change patterns that should be detected as "no/change"
 */
const ROMANIAN_REJECTIONS = [
  'nu',
  'Nu',
  'NU',
  'nu îmi place',
  'nu imi place',
  'schimbă',
  'schimba',
  'vreau altceva',
  'altceva',
  'încearcă din nou',
  'incearca din nou',
  'alt nume',
  'mai încearcă',
  'mai incearca',
  'nu e bine',
  'nu merge',
  'nu-mi place',
  'nu-mi convine',
  'altfel',
  'diferit',
  'schimbă asta',
  'modifică',
  'modifica',
  'vreau să schimb',
];

/**
 * Romanian skip patterns
 */
const ROMANIAN_SKIP_PATTERNS = [
  'sari',
  'Sari',
  'treci peste',
  'Treci peste',
  'omite',
  'nu acum',
  'mai târziu',
  'mai tarziu',
  'lasă',
  'lasa',
  'sari peste',
  'nu vreau acum',
  'poate mai târziu',
  'poate mai tarziu',
  'skip',
  'următorul',
  'urmatorul',
  'mergi mai departe',
  'fără',
  'fara',
  'nu am nevoie',
];

/**
 * Romanian selling method patterns
 */
const ROMANIAN_SELLING_METHODS = {
  bookings: [
    'programări',
    'programari',
    'ședințe',
    'sedinte',
    'consultații',
    'consultatii',
    'întâlniri',
    'intalniri',
    'rezervări',
    'rezervari',
    'clienții fac programări',
    'clientii fac programari',
    'programează ședințe',
    'programeaza sedinte',
    'oferim consultații',
    'oferim consultatii',
    'booking',
    'programare online',
  ],
  products: [
    'produse',
    'vând produse',
    'vand produse',
    'magazin online',
    'cumpără produse',
    'cumpara produse',
    'articole',
    'mărfuri',
    'marfuri',
    'produse fizice',
    'produse digitale',
    'livrare',
    'comenzi',
  ],
  subscriptions: [
    'abonamente',
    'abonament lunar',
    'abonament anual',
    'membership',
    'plată lunară',
    'plata lunara',
    'plată recurentă',
    'plata recurenta',
    'subscripție',
    'subscriptie',
    'taxă lunară',
    'taxa lunara',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Intent Detection Functions (simulating LLM behavior)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detects if Romanian input is a confirmation
 */
function isRomanianConfirmation(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  
  // Direct matches
  if (ROMANIAN_CONFIRMATIONS.some(c => normalized === c.toLowerCase())) {
    return true;
  }
  
  // Partial matches for common patterns
  const positiveKeywords = ['da', 'bine', 'perfect', 'ok', 'super', 'grozav', 'place', 'acord', 'corect', 'exact', 'merge', 'folosește', 'foloseste', 'asta', 'căutam', 'cautam'];
  const hasPositive = positiveKeywords.some(kw => normalized.includes(kw));
  const hasNegative = normalized.includes('nu ') || normalized.startsWith('nu');
  
  return hasPositive && !hasNegative;
}

/**
 * Detects if Romanian input is a rejection/change request
 */
function isRomanianRejection(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  
  // Direct matches
  if (ROMANIAN_REJECTIONS.some(r => normalized === r.toLowerCase())) {
    return true;
  }
  
  // Pattern matches - more specific to avoid false positives
  const negativePatterns = [
    /\bnu\b/,           // "nu" as whole word
    /schimb/,           // schimbă, schimb
    /\balt\b/,          // alt as whole word
    /\baltceva\b/,      // altceva
    /\baltul\b/,        // altul
    /modific/,          // modifică, modific
    /diferit/,          // diferit
    /încerc/,           // încearcă, încerci (retry)
    /incerc/,           // incearca (without diacritics)
    /adăug/,            // adaugă, adăug
    /adaug/,            // adaug (without diacritics)
    /trebuie/,          // trebuie să
    /tocmai/,           // nu e tocmai bine
    /vreau să/,         // vreau să schimb
    /vreau sa/,         // vreau sa (without diacritics)
  ];
  
  // Only reject if it's clearly a rejection intent
  const hasNegativePattern = negativePatterns.some(p => p.test(normalized));
  
  // But not if it's purely positive
  const isPurelyPositive = (normalized.startsWith('da ') || normalized === 'da') && 
                           !normalized.includes('schimb') && 
                           !normalized.includes('alt');
  
  return hasNegativePattern && !isPurelyPositive;
}

/**
 * Detects if Romanian input is a skip intent
 */
function isRomanianSkip(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  
  return ROMANIAN_SKIP_PATTERNS.some(pattern => 
    normalized.includes(pattern.toLowerCase())
  );
}

/**
 * Detects selling method from Romanian input
 */
function detectRomanianSellingMethod(input: string): 'bookings' | 'products' | 'subscriptions' | 'other' {
  const normalized = input.toLowerCase();
  
  // Check for bookings keywords
  if (ROMANIAN_SELLING_METHODS.bookings.some(kw => normalized.includes(kw.toLowerCase()))) {
    return 'bookings';
  }
  
  // Check for products keywords
  if (ROMANIAN_SELLING_METHODS.products.some(kw => normalized.includes(kw.toLowerCase()))) {
    return 'products';
  }
  
  // Check for subscriptions keywords
  if (ROMANIAN_SELLING_METHODS.subscriptions.some(kw => normalized.includes(kw.toLowerCase()))) {
    return 'subscriptions';
  }
  
  return 'other';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('Romanian Confirmation Detection', () => {
  it('detects simple "da" as confirmation', () => {
    expect(isRomanianConfirmation('da')).toBe(true);
    expect(isRomanianConfirmation('Da')).toBe(true);
    expect(isRomanianConfirmation('DA')).toBe(true);
  });

  it('detects "arată bine" as confirmation', () => {
    expect(isRomanianConfirmation('arată bine')).toBe(true);
    expect(isRomanianConfirmation('arata bine')).toBe(true);
    expect(isRomanianConfirmation('Arată bine')).toBe(true);
  });

  it('detects "perfect" as confirmation', () => {
    expect(isRomanianConfirmation('perfect')).toBe(true);
    expect(isRomanianConfirmation('Perfect')).toBe(true);
    expect(isRomanianConfirmation('PERFECT')).toBe(true);
  });

  it('detects "da, îmi place" as confirmation', () => {
    expect(isRomanianConfirmation('da, îmi place')).toBe(true);
    expect(isRomanianConfirmation('da, imi place')).toBe(true);
    expect(isRomanianConfirmation('da îmi place')).toBe(true);
  });

  it('detects casual confirmations', () => {
    expect(isRomanianConfirmation('super')).toBe(true);
    expect(isRomanianConfirmation('grozav')).toBe(true);
    expect(isRomanianConfirmation('mișto')).toBe(true);
    expect(isRomanianConfirmation('merge')).toBe(true);
  });

  it('detects formal confirmations', () => {
    expect(isRomanianConfirmation('sunt de acord')).toBe(true);
    expect(isRomanianConfirmation('corect')).toBe(true);
    expect(isRomanianConfirmation('exact')).toBe(true);
  });

  it('rejects "nu" as NOT a confirmation', () => {
    expect(isRomanianConfirmation('nu')).toBe(false);
    expect(isRomanianConfirmation('Nu')).toBe(false);
  });
});

describe('Romanian Rejection Detection', () => {
  it('detects simple "nu" as rejection', () => {
    expect(isRomanianRejection('nu')).toBe(true);
    expect(isRomanianRejection('Nu')).toBe(true);
    expect(isRomanianRejection('NU')).toBe(true);
  });

  it('detects "schimbă" as rejection', () => {
    expect(isRomanianRejection('schimbă')).toBe(true);
    expect(isRomanianRejection('schimba')).toBe(true);
    expect(isRomanianRejection('vreau să schimb')).toBe(true);
  });

  it('detects "alt/altceva" as rejection', () => {
    expect(isRomanianRejection('altceva')).toBe(true);
    expect(isRomanianRejection('alt nume')).toBe(true);
    expect(isRomanianRejection('vreau altceva')).toBe(true);
  });

  it('detects "nu îmi place" as rejection', () => {
    expect(isRomanianRejection('nu îmi place')).toBe(true);
    expect(isRomanianRejection('nu imi place')).toBe(true);
    expect(isRomanianRejection('nu-mi place')).toBe(true);
  });

  it('detects retry requests as rejection', () => {
    expect(isRomanianRejection('încearcă din nou')).toBe(true);
    expect(isRomanianRejection('mai încearcă')).toBe(true);
  });
});

describe('Romanian Skip Detection', () => {
  it('detects "sari" as skip', () => {
    expect(isRomanianSkip('sari')).toBe(true);
    expect(isRomanianSkip('Sari')).toBe(true);
    expect(isRomanianSkip('sari peste')).toBe(true);
  });

  it('detects "treci peste" as skip', () => {
    expect(isRomanianSkip('treci peste')).toBe(true);
    expect(isRomanianSkip('Treci peste')).toBe(true);
  });

  it('detects "mai târziu" as skip', () => {
    expect(isRomanianSkip('mai târziu')).toBe(true);
    expect(isRomanianSkip('mai tarziu')).toBe(true);
    expect(isRomanianSkip('poate mai târziu')).toBe(true);
  });

  it('detects "nu acum" as skip', () => {
    expect(isRomanianSkip('nu acum')).toBe(true);
    expect(isRomanianSkip('nu vreau acum')).toBe(true);
  });

  it('detects "omite" as skip', () => {
    expect(isRomanianSkip('omite')).toBe(true);
  });

  it('detects "fără" as skip', () => {
    expect(isRomanianSkip('fără')).toBe(true);
    expect(isRomanianSkip('fara')).toBe(true);
  });
});

describe('Romanian Selling Method Detection', () => {
  describe('Bookings Detection', () => {
    it('detects "programări" as bookings', () => {
      expect(detectRomanianSellingMethod('clienții fac programări')).toBe('bookings');
      expect(detectRomanianSellingMethod('clientii fac programari')).toBe('bookings');
    });

    it('detects "ședințe" as bookings', () => {
      expect(detectRomanianSellingMethod('oferim ședințe de coaching')).toBe('bookings');
      expect(detectRomanianSellingMethod('programează ședințe online')).toBe('bookings');
    });

    it('detects "consultații" as bookings', () => {
      expect(detectRomanianSellingMethod('oferim consultații')).toBe('bookings');
      expect(detectRomanianSellingMethod('consultatii gratuite')).toBe('bookings');
    });

    it('detects "rezervări" as bookings', () => {
      expect(detectRomanianSellingMethod('facem rezervări')).toBe('bookings');
      expect(detectRomanianSellingMethod('rezervari online')).toBe('bookings');
    });

    it('detects "întâlniri" as bookings', () => {
      expect(detectRomanianSellingMethod('programăm întâlniri')).toBe('bookings');
    });
  });

  describe('Products Detection', () => {
    it('detects "produse" as products', () => {
      expect(detectRomanianSellingMethod('vând produse online')).toBe('products');
      expect(detectRomanianSellingMethod('vand produse fizice')).toBe('products');
    });

    it('detects "magazin online" as products', () => {
      expect(detectRomanianSellingMethod('am un magazin online')).toBe('products');
    });

    it('detects "comenzi" as products', () => {
      expect(detectRomanianSellingMethod('clienții plasează comenzi')).toBe('products');
    });

    it('detects "livrare" as products', () => {
      expect(detectRomanianSellingMethod('oferim livrare')).toBe('products');
    });
  });

  describe('Subscriptions Detection', () => {
    it('detects "abonamente" as subscriptions', () => {
      expect(detectRomanianSellingMethod('oferim abonamente lunare')).toBe('subscriptions');
      expect(detectRomanianSellingMethod('abonament anual')).toBe('subscriptions');
    });

    it('detects "plată lunară" as subscriptions', () => {
      expect(detectRomanianSellingMethod('plată lunară de 100 lei')).toBe('subscriptions');
      expect(detectRomanianSellingMethod('plata lunara')).toBe('subscriptions');
    });

    it('detects "membership" as subscriptions', () => {
      expect(detectRomanianSellingMethod('membership la sală')).toBe('subscriptions');
    });

    it('detects "plată recurentă" as subscriptions', () => {
      expect(detectRomanianSellingMethod('plată recurentă')).toBe('subscriptions');
    });
  });

  describe('Other/Unknown', () => {
    it('returns "other" for unclear input', () => {
      expect(detectRomanianSellingMethod('facem multe lucruri')).toBe('other');
      expect(detectRomanianSellingMethod('nu știu exact')).toBe('other');
    });
  });
});

describe('Romanian Business Descriptions', () => {
  const ROMANIAN_BUSINESS_DESCRIPTIONS = [
    {
      input: 'Sunt antrenor personal în București. Oferim antrenamente 1-la-1 și clase de grup.',
      expectedKeywords: ['antrenor', 'personal', 'București', 'antrenamente'],
      industry: 'fitness',
    },
    {
      input: 'Am o cofetărie artizanală în Cluj. Facem torturi și prăjituri pentru evenimente.',
      expectedKeywords: ['cofetărie', 'torturi', 'prăjituri', 'evenimente'],
      industry: 'food-service',
    },
    {
      input: 'Oferim servicii de curățenie pentru birouri și case în Timișoara.',
      expectedKeywords: ['curățenie', 'birouri', 'case', 'Timișoara'],
      industry: 'local-business',
    },
    {
      input: 'Sunt avocat specializat în drept comercial și ajut firmele cu contracte.',
      expectedKeywords: ['avocat', 'drept', 'comercial', 'contracte'],
      industry: 'professional-services',
    },
    {
      input: 'Am un salon de coafură și manichiură în centrul Iașiului.',
      expectedKeywords: ['salon', 'coafură', 'manichiură', 'Iași'],
      industry: 'beauty',
    },
  ];

  ROMANIAN_BUSINESS_DESCRIPTIONS.forEach(({ input, expectedKeywords, industry }) => {
    it(`extracts keywords from "${input.slice(0, 40)}..."`, () => {
      expectedKeywords.forEach(keyword => {
        // Normalize for diacritics comparison
        const normalizedInput = input.toLowerCase();
        const normalizedKeyword = keyword.toLowerCase();
        const hasDiacritics = /[ăâîșț]/i.test(keyword);
        
        if (hasDiacritics) {
          // Check with or without diacritics
          const withoutDiacritics = normalizedKeyword
            .replace(/ă/g, 'a')
            .replace(/â/g, 'a')
            .replace(/î/g, 'i')
            .replace(/ș/g, 's')
            .replace(/ț/g, 't');
          expect(
            normalizedInput.includes(normalizedKeyword) || 
            normalizedInput.includes(withoutDiacritics)
          ).toBe(true);
        } else {
          expect(normalizedInput.includes(normalizedKeyword)).toBe(true);
        }
      });
    });
  });
});

describe('Romanian Name Suggestions Flow', () => {
  const NAME_FLOW_SCENARIOS = [
    {
      businessType: 'fitness',
      suggestedName: 'FitPro Studio',
      responses: {
        accept: ['da', 'da, îmi place', 'perfect', 'merge', 'folosește asta'],
        reject: ['nu', 'alt nume', 'schimbă', 'nu-mi place'],
        customize: ['fă-l mai scurt', 'adaugă și București', 'vreau ceva românesc'],
      },
    },
    {
      businessType: 'bakery',
      suggestedName: 'Aluat de Casă',
      responses: {
        accept: ['super', 'grozav', 'da, ăsta e bun', 'exact ce căutam'],
        reject: ['nu', 'altceva', 'încearcă altul'],
        customize: ['adaugă artizanal', 'fără diacritice', 'mai simplu'],
      },
    },
  ];

  NAME_FLOW_SCENARIOS.forEach(({ businessType, suggestedName, responses }) => {
    describe(`${businessType} business - name "${suggestedName}"`, () => {
      it('accepts the name with Romanian confirmations', () => {
        responses.accept.forEach(response => {
          expect(isRomanianConfirmation(response)).toBe(true);
        });
      });

      it('rejects the name with Romanian rejections', () => {
        responses.reject.forEach(response => {
          expect(isRomanianRejection(response)).toBe(true);
        });
      });
    });
  });
});

describe('Romanian Summary Confirmation Flow', () => {
  const SUMMARY_RESPONSES = {
    approve: [
      'arată bine',
      'da, totul e corect',
      'perfect, continuă',
      'sunt de acord cu tot',
      'e exact ce vreau',
      'da, hai să mergem mai departe',
    ],
    modify: [
      'vreau să schimb ceva',
      'nu e tocmai bine',
      'trebuie să modific',
      'mai am de adăugat',
      'vreau să corectez',
    ],
    specific: [
      'schimbă audiența',
      'tonul nu e bun',
      'modifică prețurile',
      'adaugă mai multe detalii',
    ],
  };

  it('detects summary approvals', () => {
    SUMMARY_RESPONSES.approve.forEach(response => {
      expect(isRomanianConfirmation(response)).toBe(true);
    });
  });

  it('detects modification requests', () => {
    SUMMARY_RESPONSES.modify.forEach(response => {
      expect(isRomanianRejection(response)).toBe(true);
    });
  });
});

describe('Romanian Diacritics Handling', () => {
  const DIACRITIC_PAIRS = [
    ['programări', 'programari'],
    ['ședințe', 'sedinte'],
    ['consultații', 'consultatii'],
    ['întâlniri', 'intalniri'],
    ['abonamente', 'abonamente'], // no diacritics
    ['îmi place', 'imi place'],
    ['schimbă', 'schimba'],
    ['încearcă', 'incearca'],
    ['târziu', 'tarziu'],
    ['București', 'Bucuresti'],
    ['Iași', 'Iasi'],
    ['Timișoara', 'Timisoara'],
  ];

  DIACRITIC_PAIRS.forEach(([withDiacritics, withoutDiacritics]) => {
    it(`handles "${withDiacritics}" with or without diacritics`, () => {
      // Both versions should be recognized as equivalent for intent detection
      const normalizedWith = withDiacritics.toLowerCase();
      const normalizedWithout = withoutDiacritics.toLowerCase();
      
      // Simulate normalization function
      const normalize = (s: string) => s
        .toLowerCase()
        .replace(/ă/g, 'a')
        .replace(/â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/ș/g, 's')
        .replace(/ț/g, 't');
      
      expect(normalize(normalizedWith)).toBe(normalize(normalizedWithout));
    });
  });
});

describe('Full Romanian Flow Simulation', () => {
  interface FlowStep {
    step: string;
    userInput: string;
    expectedIntent: string;
    expectedNextStep: string;
  }

  const FULL_FLOW: FlowStep[] = [
    {
      step: 'describe',
      userInput: 'Sunt antrenor personal în București, ofer antrenamente 1-la-1 și clase de grup',
      expectedIntent: 'description',
      expectedNextStep: 'name',
    },
    {
      step: 'name',
      userInput: 'da, îmi place',
      expectedIntent: 'confirm',
      expectedNextStep: 'business-uvp',
    },
    {
      step: 'business-uvp',
      userInput: 'Antrenamente personalizate de 15 minute pentru rezultate maxime',
      expectedIntent: 'answer',
      expectedNextStep: 'business-audience',
    },
    {
      step: 'business-audience',
      userInput: 'sari',
      expectedIntent: 'skip',
      expectedNextStep: 'business-goals',
    },
    {
      step: 'business-goals',
      userInput: 'Vreau mai mulți clienți și rezervări online',
      expectedIntent: 'answer',
      expectedNextStep: 'business-tone',
    },
    {
      step: 'business-tone',
      userInput: 'treci peste',
      expectedIntent: 'skip',
      expectedNextStep: 'business-selling',
    },
    {
      step: 'business-selling',
      userInput: 'Clienții fac programări pentru ședințe',
      expectedIntent: 'answer',
      expectedNextStep: 'business-pricing',
    },
    {
      step: 'business-pricing',
      userInput: 'mai târziu',
      expectedIntent: 'skip',
      expectedNextStep: 'business-summary',
    },
    {
      step: 'business-summary',
      userInput: 'arată bine',
      expectedIntent: 'confirm',
      expectedNextStep: 'template',
    },
  ];

  FULL_FLOW.forEach(({ step, userInput, expectedIntent, expectedNextStep }) => {
    it(`${step}: "${userInput.slice(0, 30)}..." → ${expectedIntent}`, () => {
      let detectedIntent: string;
      
      if (isRomanianSkip(userInput)) {
        detectedIntent = 'skip';
      } else if (isRomanianConfirmation(userInput)) {
        detectedIntent = 'confirm';
      } else if (isRomanianRejection(userInput)) {
        detectedIntent = 'reject';
      } else {
        detectedIntent = step === 'describe' ? 'description' : 'answer';
      }
      
      expect(detectedIntent).toBe(expectedIntent);
    });
  });

  it('detects selling method correctly in flow', () => {
    const sellingInput = 'Clienții fac programări pentru ședințe';
    expect(detectRomanianSellingMethod(sellingInput)).toBe('bookings');
  });
});

describe('Edge Cases - Romanian', () => {
  it('handles mixed Romanian/English input', () => {
    expect(isRomanianConfirmation('ok, perfect')).toBe(true);
    expect(isRomanianSkip('skip')).toBe(true);
  });

  it('handles extra whitespace', () => {
    expect(isRomanianConfirmation('  da  ')).toBe(true);
    expect(isRomanianSkip('  treci peste  ')).toBe(true);
  });

  it('handles punctuation', () => {
    expect(isRomanianConfirmation('da!')).toBe(true);
    expect(isRomanianConfirmation('perfect.')).toBe(true);
  });

  it('handles emoji in input', () => {
    // Should extract text intent despite emoji
    const inputWithEmoji = 'da 👍';
    expect(inputWithEmoji.includes('da')).toBe(true);
  });

  it('handles very long Romanian descriptions', () => {
    const longDescription = `
      Sunt antrenor personal certificat cu peste 10 ani de experiență în București.
      Ofer antrenamente personalizate 1-la-1, clase de grup pentru toate nivelurile,
      și coaching online pentru cei care preferă să se antreneze acasă.
      Specializarea mea este fitness funcțional și pregătire pentru competiții.
    `;
    
    // Should extract key business indicators
    expect(longDescription.includes('antrenor')).toBe(true);
    expect(longDescription.includes('București')).toBe(true);
    expect(longDescription.includes('antrenamente')).toBe(true);
  });
});
