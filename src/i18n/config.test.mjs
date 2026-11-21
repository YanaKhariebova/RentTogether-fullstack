import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { i18n, isLanguage, resolveLanguage, formatLocale, translate } from './config.ts';
const codes = ['de', 'en', 'ru', 'uk'];
const dictionaries = Object.fromEntries(
  codes.map((code) => [
    code,
    JSON.parse(readFileSync(new URL(`./locales/${code}.json`, import.meta.url), 'utf8')),
  ]),
);
test('every enabled language covers every key and preserves interpolation placeholders', () => {
  const reference = dictionaries.de;
  for (const code of codes) {
    assert.deepEqual(Object.keys(dictionaries[code]).sort(), Object.keys(reference).sort(), code);
    for (const [key, value] of Object.entries(dictionaries[code])) {
      assert.ok(value.trim(), `${code}: ${key}`);
      const tokens = (text) => [...text.matchAll(/\{\{(.*?)\}\}/g)].map((match) => match[1]).sort();
      assert.deepEqual(tokens(value), tokens(reference[key]), `${code}: ${key}`);
    }
  }
});
test('regional browser preferences resolve to supported languages and unsupported ones fall back to German', () => {
  assert.equal(resolveLanguage(['fr-FR', 'uk-UA', 'en']), 'uk');
  assert.equal(resolveLanguage(['en-US']), 'en');
  assert.equal(resolveLanguage(['tr-TR', 'ar']), 'de');
  assert.equal(isLanguage('xx'), false);
  assert.equal(isLanguage('ru'), true);
});
test('Slavic plurals and European currency formatting follow the selected language', async () => {
  try {
    await i18n.changeLanguage('ru');
    assert.equal(translate('dayCount', { count: 1 }), '1 день');
    assert.equal(translate('dayCount', { count: 2 }), '2 дня');
    assert.equal(translate('dayCount', { count: 5 }), '5 дней');
    assert.equal(translate('dayCount', { count: 21 }), '21 день');
    await i18n.changeLanguage('uk');
    assert.equal(translate('dayCount', { count: 2 }), '2 дні');
    await i18n.changeLanguage('en');
    assert.equal(
      new Intl.NumberFormat(formatLocale(), { style: 'currency', currency: 'EUR' }).format(15.5),
      '€15.50',
    );
    await i18n.changeLanguage('de');
    assert.equal(translate('listingCount', { count: 1 }), '1 Anzeige');
    assert.equal(translate('listingCount', { count: 2 }), '2 Anzeigen');
  } finally {
    await i18n.changeLanguage('de');
  }
});
test('interpolation preserves user-authored text and UI feedback can be translated again', async () => {
  try {
    await i18n.changeLanguage('en');
    const name = 'Мой проектор <b>nicht übersetzen</b>';
    assert.equal(translate('{{value0}} bearbeiten', { value0: name }), `Edit ${name}`);
    const feedback = translate('Dein Profil wurde gespeichert.');
    await i18n.changeLanguage('ru');
    assert.equal(translate(feedback), 'Ваш профиль сохранён.');
  } finally {
    await i18n.changeLanguage('de');
  }
});
