import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  checkSpamAndUnwanted,
  analyzeCompleteness,
  generateFormalPoliceDraft,
} from '../../src/features/citizen/citizenNlpEngine';

describe('Citizen Sentinel Intelligent NLP Engine Tests', () => {
  it('accurately detects Hindi Devanagari text', () => {
    const res = detectLanguage('मेरा फोन चोरी हो गया है कनाट प्लेस में');
    expect(res.code).toBe('hi');
    expect(res.confidence).toBeGreaterThan(0.8);
  });

  it('accurately detects Romanized Hinglish slang text', () => {
    const res = detectLanguage('bhai mera phone chori ho gaya pulsar bike wale ne snatch kiya');
    expect(res.code).toBe('hinglish');
    expect(res.name).toContain('Hinglish');
  });

  it('accurately detects English text', () => {
    const res = detectLanguage('Two unknown suspects on a motorcycle snatched my gold chain near metro gate 2');
    expect(res.code).toBe('en');
    expect(res.name).toBe('English');
  });

  it('flags common greetings and non-actionable chatter as warnings', () => {
    const res1 = checkSpamAndUnwanted('hi');
    expect(res1.isSpamOrUnwanted).toBe(true);
    expect(res1.category).toBe('GREETING');

    const res2 = checkSpamAndUnwanted('namaste police bhai');
    expect(res2.isSpamOrUnwanted).toBe(true);
  });

  it('blocks keyboard mashing and gibberish input', () => {
    const res = checkSpamAndUnwanted('asdfghjklqwerty');
    expect(res.isSpamOrUnwanted).toBe(true);
    expect(res.severity).toBe('BLOCK');
  });

  it('permits factual criminal incident statements', () => {
    const res = checkSpamAndUnwanted('My black backpack containing laptop was stolen from car trunk outside gate 3');
    expect(res.isSpamOrUnwanted).toBe(false);
    expect(res.severity).toBe('SAFE');
  });

  it('analyzes 5W completeness score and generates suggestions', () => {
    const res = analyzeCompleteness('A boy snatched my phone yesterday evening', 'Rajiv Chowk Metro', '2026-11-10T16:00');
    expect(res.hasWhen).toBe(true);
    expect(res.hasWhere).toBe(true);
    expect(res.hasWho).toBe(true);
    expect(res.hasWhat).toBe(true);
    expect(res.completenessScore).toBe(100);
    expect(res.suggestions.length).toBe(0);
  });

  it('identifies missing 5W parameters when description is vague', () => {
    const res = analyzeCompleteness('phone chori', '', '');
    expect(res.completenessScore).toBeLessThan(50);
    expect(res.suggestions.length).toBeGreaterThan(0);
  });

  it('converts informal colloquial text into formal Section 173 BNSS statement', () => {
    const draft = generateFormalPoliceDraft(
      'bhai mera iphone 14 chori ho gaya do ladke bike pe aaye aur pocket maar ke le gaye',
      'Theft',
      'Lajpat Nagar',
      '2026-11-10T15:30:00'
    );
    expect(draft.formalAbstract).toContain('SECTION 173 BNSS 2023');
    expect(draft.formalAbstract).toContain('Lajpat Nagar');
    expect(draft.formalAbstract).toContain('Apple iPhone');
    expect(draft.statutorySections.length).toBeGreaterThan(0);
  });
});
