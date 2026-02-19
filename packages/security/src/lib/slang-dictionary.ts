/**
 * @fileoverview Slang dictionary for detecting coded language in content.
 * @module @flowstarter/security/slang-dictionary
 */

import { BlockedCategory, SlangEntry } from './types.js';

/**
 * Database of slang terms and code words used to disguise illegal content.
 * This is used to detect content that uses coded language to evade basic filters.
 */
const SLANG_DATABASE: SlangEntry[] = [
  // ==================== DRUGS ====================
  // Cannabis
  { term: '420', category: BlockedCategory.DRUGS, weight: 0.7, meaning: 'Cannabis/marijuana', contextRequired: true },
  { term: 'mary jane', category: BlockedCategory.DRUGS, weight: 0.8, meaning: 'Marijuana', contextRequired: false },
  { term: 'trees', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Marijuana', contextRequired: true },
  { term: 'green', category: BlockedCategory.DRUGS, weight: 0.3, meaning: 'Marijuana', contextRequired: true },
  { term: 'herb', category: BlockedCategory.DRUGS, weight: 0.4, meaning: 'Marijuana', contextRequired: true },
  { term: 'kush', category: BlockedCategory.DRUGS, weight: 0.9, meaning: 'High-grade marijuana', contextRequired: false },
  { term: 'loud', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'Strong marijuana', contextRequired: true },
  { term: 'za', category: BlockedCategory.DRUGS, weight: 0.7, meaning: 'Exotic marijuana', contextRequired: true },
  { term: 'gas', category: BlockedCategory.DRUGS, weight: 0.4, meaning: 'High-quality marijuana', contextRequired: true },
  { term: 'fire', category: BlockedCategory.DRUGS, weight: 0.3, meaning: 'Good quality drugs', contextRequired: true },
  { term: 'bud', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Marijuana', contextRequired: true },
  { term: 'dank', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'High-quality marijuana', contextRequired: true },
  
  // Cocaine
  { term: 'snow', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Cocaine', contextRequired: true },
  { term: 'white girl', category: BlockedCategory.DRUGS, weight: 0.7, meaning: 'Cocaine', contextRequired: true },
  { term: 'blow', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'Cocaine', contextRequired: true },
  { term: 'yayo', category: BlockedCategory.DRUGS, weight: 0.9, meaning: 'Cocaine', contextRequired: false },
  { term: 'nose candy', category: BlockedCategory.DRUGS, weight: 0.95, meaning: 'Cocaine', contextRequired: false },
  { term: 'coke', category: BlockedCategory.DRUGS, weight: 0.4, meaning: 'Cocaine', contextRequired: true },
  { term: 'powder', category: BlockedCategory.DRUGS, weight: 0.4, meaning: 'Cocaine', contextRequired: true },
  { term: 'skiing', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Using cocaine', contextRequired: true },
  
  // Heroin/Opioids
  { term: 'h', category: BlockedCategory.DRUGS, weight: 0.3, meaning: 'Heroin', contextRequired: true },
  { term: 'dope', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'Heroin', contextRequired: true },
  { term: 'smack', category: BlockedCategory.DRUGS, weight: 0.8, meaning: 'Heroin', contextRequired: false },
  { term: 'china white', category: BlockedCategory.DRUGS, weight: 0.95, meaning: 'Fentanyl/Heroin', contextRequired: false },
  { term: 'blues', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'Fentanyl pills', contextRequired: true },
  { term: 'm30', category: BlockedCategory.DRUGS, weight: 0.9, meaning: 'Fentanyl pills (fake oxy)', contextRequired: false },
  { term: 'percs', category: BlockedCategory.DRUGS, weight: 0.8, meaning: 'Percocet/opioids', contextRequired: false },
  { term: 'oxy', category: BlockedCategory.DRUGS, weight: 0.7, meaning: 'Oxycodone', contextRequired: true },
  
  // MDMA/Ecstasy
  { term: 'molly', category: BlockedCategory.DRUGS, weight: 0.85, meaning: 'MDMA', contextRequired: false },
  { term: 'x', category: BlockedCategory.DRUGS, weight: 0.3, meaning: 'Ecstasy', contextRequired: true },
  { term: 'rolls', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'Ecstasy pills', contextRequired: true },
  { term: 'beans', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'MDMA pills', contextRequired: true },
  
  // Methamphetamine
  { term: 'ice', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Methamphetamine', contextRequired: true },
  { term: 'crystal', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Crystal meth', contextRequired: true },
  { term: 'tina', category: BlockedCategory.DRUGS, weight: 0.8, meaning: 'Crystal meth', contextRequired: true },
  { term: 'glass', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Crystal meth', contextRequired: true },
  { term: 'crank', category: BlockedCategory.DRUGS, weight: 0.7, meaning: 'Methamphetamine', contextRequired: true },
  
  // Psychedelics
  { term: 'lucy', category: BlockedCategory.DRUGS, weight: 0.7, meaning: 'LSD', contextRequired: true },
  { term: 'acid', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'LSD', contextRequired: true },
  { term: 'tabs', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'LSD tabs', contextRequired: true },
  { term: 'shrooms', category: BlockedCategory.DRUGS, weight: 0.8, meaning: 'Psilocybin mushrooms', contextRequired: false },
  { term: 'caps', category: BlockedCategory.DRUGS, weight: 0.4, meaning: 'Mushroom caps', contextRequired: true },
  { term: 'dmt', category: BlockedCategory.DRUGS, weight: 0.9, meaning: 'DMT', contextRequired: false },
  
  // General drug terms
  { term: 'party supplies', category: BlockedCategory.DRUGS, weight: 0.8, meaning: 'Various drugs', contextRequired: false },
  { term: 'party favors', category: BlockedCategory.DRUGS, weight: 0.8, meaning: 'Various drugs', contextRequired: false },
  { term: 'plug', category: BlockedCategory.DRUGS, weight: 0.6, meaning: 'Drug dealer', contextRequired: true },
  { term: 'trap', category: BlockedCategory.DRUGS, weight: 0.5, meaning: 'Drug house/dealing location', contextRequired: true },
  { term: 'pack', category: BlockedCategory.DRUGS, weight: 0.4, meaning: 'Drug package', contextRequired: true },
  { term: 'score', category: BlockedCategory.DRUGS, weight: 0.4, meaning: 'Buy drugs', contextRequired: true },
  { term: 'reup', category: BlockedCategory.DRUGS, weight: 0.7, meaning: 'Resupply drugs', contextRequired: true },
  
  // ==================== ADULT/ESCORT ====================
  { term: 'gfe', category: BlockedCategory.ADULT, weight: 0.95, meaning: 'Girlfriend experience (escort)', contextRequired: false },
  { term: 'pse', category: BlockedCategory.ADULT, weight: 0.95, meaning: 'Pornstar experience (escort)', contextRequired: false },
  { term: 'roses', category: BlockedCategory.ADULT, weight: 0.7, meaning: 'Payment amount (escort)', contextRequired: true },
  { term: 'donations', category: BlockedCategory.ADULT, weight: 0.6, meaning: 'Payment (escort)', contextRequired: true },
  { term: 'generous', category: BlockedCategory.ADULT, weight: 0.5, meaning: 'Willing to pay (escort)', contextRequired: true },
  { term: 'companionship', category: BlockedCategory.ADULT, weight: 0.5, meaning: 'Escort services', contextRequired: true },
  { term: 'incall', category: BlockedCategory.ADULT, weight: 0.85, meaning: 'At escort location', contextRequired: false },
  { term: 'outcall', category: BlockedCategory.ADULT, weight: 0.85, meaning: 'At client location', contextRequired: false },
  { term: 'qv', category: BlockedCategory.ADULT, weight: 0.9, meaning: 'Quick visit (15-30 min)', contextRequired: false },
  { term: 'hh', category: BlockedCategory.ADULT, weight: 0.7, meaning: 'Half hour', contextRequired: true },
  { term: 'hr', category: BlockedCategory.ADULT, weight: 0.3, meaning: 'Hour', contextRequired: true },
  { term: 'bbbj', category: BlockedCategory.ADULT, weight: 0.99, meaning: 'Explicit sexual service', contextRequired: false },
  { term: 'greek', category: BlockedCategory.ADULT, weight: 0.8, meaning: 'Explicit sexual service', contextRequired: true },
  { term: 'daty', category: BlockedCategory.ADULT, weight: 0.95, meaning: 'Explicit sexual service', contextRequired: false },
  { term: 'msog', category: BlockedCategory.ADULT, weight: 0.95, meaning: 'Multiple sessions', contextRequired: false },
  { term: 'bare', category: BlockedCategory.ADULT, weight: 0.6, meaning: 'Unprotected', contextRequired: true },
  { term: 'covered', category: BlockedCategory.ADULT, weight: 0.5, meaning: 'Protected', contextRequired: true },
  { term: 'sugar daddy', category: BlockedCategory.ADULT, weight: 0.7, meaning: 'Financial arrangement', contextRequired: false },
  { term: 'sugar baby', category: BlockedCategory.ADULT, weight: 0.7, meaning: 'Financial arrangement', contextRequired: false },
  { term: 'arrangement', category: BlockedCategory.ADULT, weight: 0.5, meaning: 'Paid relationship', contextRequired: true },
  { term: 'provider', category: BlockedCategory.ADULT, weight: 0.6, meaning: 'Escort', contextRequired: true },
  { term: 'hobbyist', category: BlockedCategory.ADULT, weight: 0.7, meaning: 'Escort client', contextRequired: true },
  
  // ==================== GAMBLING ====================
  { term: 'action', category: BlockedCategory.GAMBLING, weight: 0.4, meaning: 'Bet/gambling', contextRequired: true },
  { term: 'bookie', category: BlockedCategory.GAMBLING, weight: 0.9, meaning: 'Illegal bookmaker', contextRequired: false },
  { term: 'parlay', category: BlockedCategory.GAMBLING, weight: 0.6, meaning: 'Combined bets', contextRequired: true },
  { term: 'juice', category: BlockedCategory.GAMBLING, weight: 0.4, meaning: 'Bookmaker fee', contextRequired: true },
  { term: 'vig', category: BlockedCategory.GAMBLING, weight: 0.7, meaning: 'Bookmaker fee', contextRequired: true },
  { term: 'whale', category: BlockedCategory.GAMBLING, weight: 0.5, meaning: 'High-stakes gambler', contextRequired: true },
  { term: 'lock', category: BlockedCategory.GAMBLING, weight: 0.4, meaning: 'Sure bet', contextRequired: true },
  { term: 'tip', category: BlockedCategory.GAMBLING, weight: 0.3, meaning: 'Betting advice', contextRequired: true },
  
  // ==================== WEAPONS ====================
  { term: 'ghost gun', category: BlockedCategory.WEAPONS, weight: 0.95, meaning: 'Untraceable firearm', contextRequired: false },
  { term: 'switch', category: BlockedCategory.WEAPONS, weight: 0.7, meaning: 'Auto-fire conversion', contextRequired: true },
  { term: 'glock switch', category: BlockedCategory.WEAPONS, weight: 0.99, meaning: 'Illegal auto-fire device', contextRequired: false },
  { term: 'draco', category: BlockedCategory.WEAPONS, weight: 0.7, meaning: 'AK-pistol', contextRequired: true },
  { term: 'choppa', category: BlockedCategory.WEAPONS, weight: 0.8, meaning: 'Assault rifle', contextRequired: false },
  { term: 'pole', category: BlockedCategory.WEAPONS, weight: 0.5, meaning: 'Gun', contextRequired: true },
  { term: 'strap', category: BlockedCategory.WEAPONS, weight: 0.6, meaning: 'Gun', contextRequired: true },
  { term: 'heater', category: BlockedCategory.WEAPONS, weight: 0.6, meaning: 'Gun', contextRequired: true },
  { term: 'pipe', category: BlockedCategory.WEAPONS, weight: 0.4, meaning: 'Gun', contextRequired: true },
  { term: 'untraceable', category: BlockedCategory.WEAPONS, weight: 0.7, meaning: 'No serial number', contextRequired: true },
  { term: 'no serial', category: BlockedCategory.WEAPONS, weight: 0.9, meaning: 'Illegal firearm', contextRequired: false },
  
  // ==================== COUNTERFEIT ====================
  { term: 'fake id', category: BlockedCategory.COUNTERFEIT, weight: 0.95, meaning: 'Counterfeit ID', contextRequired: false },
  { term: 'novelty id', category: BlockedCategory.COUNTERFEIT, weight: 0.9, meaning: 'Fake ID', contextRequired: false },
  { term: 'replica', category: BlockedCategory.COUNTERFEIT, weight: 0.5, meaning: 'Counterfeit goods', contextRequired: true },
  { term: 'aaa quality', category: BlockedCategory.COUNTERFEIT, weight: 0.8, meaning: 'High-quality fake', contextRequired: false },
  { term: '1:1', category: BlockedCategory.COUNTERFEIT, weight: 0.7, meaning: 'Exact replica', contextRequired: true },
  { term: 'scannable', category: BlockedCategory.COUNTERFEIT, weight: 0.85, meaning: 'Fake ID feature', contextRequired: true },
  { term: 'prop money', category: BlockedCategory.COUNTERFEIT, weight: 0.8, meaning: 'Fake currency', contextRequired: false },
  { term: 'fullz', category: BlockedCategory.COUNTERFEIT, weight: 0.99, meaning: 'Complete identity package', contextRequired: false },
  
  // ==================== MALWARE/HACKING ====================
  { term: 'rat', category: BlockedCategory.MALWARE, weight: 0.7, meaning: 'Remote access trojan', contextRequired: true },
  { term: 'crypter', category: BlockedCategory.MALWARE, weight: 0.95, meaning: 'Malware obfuscation tool', contextRequired: false },
  { term: 'fud', category: BlockedCategory.MALWARE, weight: 0.85, meaning: 'Fully undetectable malware', contextRequired: true },
  { term: 'botnet', category: BlockedCategory.MALWARE, weight: 0.9, meaning: 'Compromised computer network', contextRequired: false },
  { term: 'keylogger', category: BlockedCategory.MALWARE, weight: 0.85, meaning: 'Keystroke capturing malware', contextRequired: false },
  { term: 'stealer', category: BlockedCategory.MALWARE, weight: 0.8, meaning: 'Credential stealing malware', contextRequired: true },
  { term: 'exploit kit', category: BlockedCategory.MALWARE, weight: 0.95, meaning: 'Vulnerability exploitation toolkit', contextRequired: false },
  { term: '0day', category: BlockedCategory.MALWARE, weight: 0.9, meaning: 'Unknown vulnerability', contextRequired: false },
  { term: 'zero day', category: BlockedCategory.MALWARE, weight: 0.9, meaning: 'Unknown vulnerability', contextRequired: false },
  { term: 'cracked', category: BlockedCategory.MALWARE, weight: 0.5, meaning: 'Pirated software', contextRequired: true },
  
  // ==================== SCAM ====================
  { term: 'cashout', category: BlockedCategory.SCAM, weight: 0.75, meaning: 'Withdraw stolen funds', contextRequired: true },
  { term: 'carding', category: BlockedCategory.SCAM, weight: 0.95, meaning: 'Credit card fraud', contextRequired: false },
  { term: 'method', category: BlockedCategory.SCAM, weight: 0.5, meaning: 'Fraud technique', contextRequired: true },
  { term: 'sauce', category: BlockedCategory.SCAM, weight: 0.5, meaning: 'Fraud method', contextRequired: true },
  { term: 'bins', category: BlockedCategory.SCAM, weight: 0.7, meaning: 'Card number prefixes', contextRequired: true },
  { term: 'dumps', category: BlockedCategory.SCAM, weight: 0.85, meaning: 'Stolen card data', contextRequired: true },
  { term: 'cvv', category: BlockedCategory.SCAM, weight: 0.6, meaning: 'Card security code', contextRequired: true },
  { term: 'logs', category: BlockedCategory.SCAM, weight: 0.5, meaning: 'Stolen credentials', contextRequired: true },
  { term: 'combo list', category: BlockedCategory.SCAM, weight: 0.9, meaning: 'Username/password list', contextRequired: false },
  { term: 'checker', category: BlockedCategory.SCAM, weight: 0.6, meaning: 'Credential validation tool', contextRequired: true },
];

/**
 * Class for looking up and scoring slang/code word usage in text.
 */
export class SlangDictionary {
  private entries: SlangEntry[];
  private termIndex: Map<string, SlangEntry[]>;

  constructor() {
    this.entries = SLANG_DATABASE;
    this.termIndex = new Map();
    
    // Build index for faster lookups
    for (const entry of this.entries) {
      const normalized = entry.term.toLowerCase();
      const existing = this.termIndex.get(normalized) || [];
      existing.push(entry);
      this.termIndex.set(normalized, existing);
    }
  }

  /**
   * Look up all slang terms found in the given text.
   * @param text - The text to search for slang terms
   * @returns Array of matched slang entries with their positions
   */
  lookup(text: string): Array<{ entry: SlangEntry; position: number; matchedText: string }> {
    const results: Array<{ entry: SlangEntry; position: number; matchedText: string }> = [];
    const normalizedText = text.toLowerCase();
    
    for (const entry of this.entries) {
      const term = entry.term.toLowerCase();
      let searchStart = 0;
      
      while (true) {
        const position = normalizedText.indexOf(term, searchStart);
        if (position === -1) break;
        
        // Check word boundaries for multi-word terms or single-word terms
        const beforeChar = position > 0 ? normalizedText[position - 1] : ' ';
        const afterChar = position + term.length < normalizedText.length 
          ? normalizedText[position + term.length] 
          : ' ';
        
        const isWordBoundaryBefore = /[\s\.,;:!?\-_'"()\[\]{}]/.test(beforeChar);
        const isWordBoundaryAfter = /[\s\.,;:!?\-_'"()\[\]{}]/.test(afterChar);
        
        // For short terms (1-2 chars), require strict word boundaries
        const isShortTerm = term.length <= 2;
        
        if ((!isShortTerm || (isWordBoundaryBefore && isWordBoundaryAfter)) &&
            (isShortTerm || isWordBoundaryBefore || isWordBoundaryAfter)) {
          results.push({
            entry,
            position,
            matchedText: text.substring(position, position + term.length),
          });
        }
        
        searchStart = position + 1;
      }
    }
    
    return results;
  }

  /**
   * Get a weighted score for slang terms found in text, optionally filtered by category.
   * @param text - The text to analyze
   * @param category - Optional category to filter by
   * @returns Score from 0 to 1 based on weighted term matches
   */
  getWeightedScore(text: string, category?: BlockedCategory): number {
    const matches = this.lookup(text);
    
    if (matches.length === 0) return 0;
    
    const relevantMatches = category 
      ? matches.filter(m => m.entry.category === category)
      : matches;
    
    if (relevantMatches.length === 0) return 0;
    
    // Calculate weighted score based on:
    // 1. Number of unique terms found
    // 2. Weight of each term
    // 3. Whether context is required but not found
    
    const uniqueTerms = new Set(relevantMatches.map(m => m.entry.term));
    let totalWeight = 0;
    let maxWeight = 0;
    
    for (const term of uniqueTerms) {
      const match = relevantMatches.find(m => m.entry.term === term);
      if (match) {
        const contextPenalty = match.entry.contextRequired ? 0.7 : 1.0;
        const weight = match.entry.weight * contextPenalty;
        totalWeight += weight;
        maxWeight = Math.max(maxWeight, weight);
      }
    }
    
    // Combine: emphasize max weight but factor in total
    const score = (maxWeight * 0.6) + (Math.min(totalWeight / 3, 0.4));
    
    return Math.min(score, 1.0);
  }

  /**
   * Get all entries for a specific category.
   * @param category - The category to filter by
   * @returns Array of slang entries for that category
   */
  getByCategory(category: BlockedCategory): SlangEntry[] {
    return this.entries.filter(e => e.category === category);
  }

  /**
   * Get all unique categories represented in the dictionary.
   * @returns Array of categories
   */
  getCategories(): BlockedCategory[] {
    return [...new Set(this.entries.map(e => e.category))];
  }

  /**
   * Add a custom slang entry to the dictionary.
   * @param entry - The entry to add
   */
  addEntry(entry: SlangEntry): void {
    this.entries.push(entry);
    const normalized = entry.term.toLowerCase();
    const existing = this.termIndex.get(normalized) || [];
    existing.push(entry);
    this.termIndex.set(normalized, existing);
  }
}
