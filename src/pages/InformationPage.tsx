import { Trans, useTranslation } from 'react-i18next';
import { translate as t } from '../i18n/config';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import styles from './InformationPage.module.css';

type PageKind = 'about' | 'how' | 'help' | 'safety' | 'privacy' | 'imprint';
const titles: Record<PageKind, string> = {
  about: 'Über RentTogether',
  how: 'So funktioniert’s',
  help: 'Hilfe & häufige Fragen',
  safety: 'Sicher leihen & verleihen',
  privacy: 'Datenschutz',
  imprint: 'Impressum',
};
function Section({ title, children }: { title: string; children: ReactNode }) {
  useTranslation();
  return (
    <section>
      <h2>{t(title)}</h2>
      {children}
    </section>
  );
}
function DraftNotice() {
  useTranslation();
  return (
    <p className={styles.notice}>
      <strong>{t('Entwurf – Angaben noch unvollständig.')}</strong>{' '}
      {t(
        'Die Angaben zum Betreiber und zur Datenverarbeitung sind noch nicht vollständig. Diese Seite muss vor einer öffentlichen Nutzung ergänzt und geprüft werden.',
      )}
    </p>
  );
}

export function InformationPage({ kind }: { kind: PageKind }) {
  useTranslation();
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>RentTogether</p>
      <h1>{t(titles[kind])}</h1>
      {kind === 'about' && (
        <>
          <p className={styles.lead}>
            {t('Manche Dinge braucht man nur für einen Moment. Gute Nachbarschaft bleibt.')}
          </p>
          <Section title={t('Unsere Idee')}>
            <p>
              {t(
                'Ein Beamer für einen Filmabend, Werkzeug fürs Wochenende oder Ausrüstung für den nächsten Ausflug: RentTogether bringt Menschen zusammen, die Dinge leihen oder verleihen möchten.',
              )}
            </p>
          </Section>
          <Section title={t('Teilen statt liegen lassen')}>
            <p>
              {t(
                'Entdecke Angebote in deiner Nähe oder stelle eigene Dinge ein. Du entscheidest, welche Anfragen du annimmst, und vereinbarst die Übergabe direkt mit der anderen Person.',
              )}
            </p>
          </Section>
          <Section title={t('Drei Menschen. Eine gemeinsame Idee.')}>
            <p>
              {t(
                'Hinter RentTogether stehen Olga, Yana und Vlad – und die Überzeugung, dass wir nicht alles besitzen müssen, um mehr Möglichkeiten zu haben. Aus dieser gemeinsamen Idee entstand ein Ort, an dem Menschen Dinge privat leihen und verleihen können: von Werkzeug und Technik bis zur Ausrüstung für den nächsten Ausflug.',
              )}
            </p>
            <p>
              {t(
                'Wir möchten zusammenbringen, was oft nur ein paar Straßen voneinander entfernt ist: Dinge, die gerade ungenutzt bleiben, und Menschen, die sie brauchen. Für weniger Anschaffungen, mehr Austausch und eine Nachbarschaft, in der Teilen selbstverständlich wird.',
              )}
            </p>
          </Section>
        </>
      )}
      {kind === 'how' && (
        <>
          <p className={styles.lead}>
            {t('In deiner Nähe finden. Gemeinsam nutzen. Wieder zurückgeben.')}
          </p>
          <Section title={t('Du möchtest etwas leihen?')}>
            <ol>
              <li>{t('Suche im Katalog und filtere nach Stadt, Kategorie oder Preis.')}</li>
              <li>{t('Öffne ein Angebot und wähle das Abhol- und Rückgabedatum.')}</li>
              <li>
                {t(
                  'Melde dich an und sende deine Anfrage. Eine Anfrage ist noch keine Bestätigung.',
                )}
              </li>
              <li>{t('Nach der Zusage vereinbart ihr die Übergabe und Rückgabe miteinander.')}</li>
            </ol>
          </Section>
          <Section title={t('Du möchtest etwas verleihen?')}>
            <ol>
              <li>{t('Erstelle eine Anzeige mit Beschreibung, Fotos, Stadt und Tagespreis.')}</li>
              <li>{t('Veröffentliche die Anzeige und prüfe eingehende Anfragen.')}</li>
              <li>
                {t(
                  'Bestätige passende Termine und dokumentiert gemeinsam den Zustand bei der Übergabe.',
                )}
              </li>
              <li>{t('Nach der Rückgabe schließt du die Buchung ab.')}</li>
            </ol>
          </Section>
          <Section title={t('Wie wird die Mietdauer berechnet?')}>
            <p>
              {t(
                'Der Rückgabetag wird nicht berechnet: Abholung am 6. und Rückgabe am 9. ergeben drei Miettage. Die bei der Anfrage gespeicherte Tagesmiete und Gesamtsumme bleiben erhalten, auch wenn der Anzeigenpreis später geändert wird.',
              )}
            </p>
          </Section>
          <p className={styles.notice}>
            {t(
              'Die aktuelle Projektversion verarbeitet keine Online-Zahlungen. Klärt Zahlung, Übergabe und Rückgabe vorab miteinander.',
            )}
          </p>
        </>
      )}
      {kind === 'help' && (
        <>
          <p className={styles.lead}>
            {t('Die wichtigsten Antworten rund ums Leihen und Verleihen.')}
          </p>
          <details>
            <summary>{t('Brauche ich ein Konto?')}</summary>
            <p>
              {t(
                'Den Katalog kannst du ohne Anmeldung ansehen. Um eine Anfrage zu senden oder eigene Anzeigen zu verwalten, brauchst du ein Konto.',
              )}
            </p>
          </details>
          <details>
            <summary>{t('Wann ist meine Anfrage bestätigt?')}</summary>
            <p>
              {t(
                'Eine neue Anfrage hat den Status „Ausstehend“. Erst wenn der Eigentümer sie annimmt, wird sie „Bestätigt“.',
              )}
            </p>
          </details>
          <details>
            <summary>{t('Kann ich meine Anfrage zurückziehen?')}</summary>
            <p>
              {t(
                'Solange sie noch ausstehend ist, kannst du sie unter deinen Mietanfragen stornieren. Bereits bestätigte Buchungen lassen sich in dieser Version nicht selbst stornieren.',
              )}
            </p>
          </details>
          <details>
            <summary>{t('Was passiert, wenn ich meine Anzeige ausblende?')}</summary>
            <p>
              {t(
                'Die Anzeige verschwindet aus dem öffentlichen Katalog. Bestehende Anfragen und ihre gespeicherten Preise bleiben erhalten. Anzeigen mit Buchungen können nicht endgültig gelöscht werden.',
              )}
            </p>
          </details>
          <details>
            <summary>{t('Wie bezahle ich?')}</summary>
            <p>
              {t(
                'RentTogether bietet in der Projektversion keine Zahlungsabwicklung an. Besprecht die Bedingungen vor einer Übergabe direkt miteinander.',
              )}
            </p>
          </details>
          <details>
            <summary>{t('Ein Foto lässt sich nicht hochladen. Was kann ich tun?')}</summary>
            <p>
              {t(
                'Nutze JPEG, PNG oder WebP mit höchstens 5 MiB pro Foto. Pro Anzeige sind bis zu acht Fotos möglich.',
              )}
            </p>
          </details>
          <Section title={t('Kontakt zum Projektteam')}>
            <p>
              {t(
                'Der öffentliche Support-Kontakt ist noch nicht eingerichtet. Während der betreuten Demonstration wende dich bitte direkt an das anwesende Projektteam.',
              )}
            </p>
          </Section>
        </>
      )}
      {kind === 'safety' && (
        <>
          <p className={styles.lead}>{t('Ein gutes Gefühl beginnt mit klaren Absprachen.')}</p>
          <Section title={t('Vor der Anfrage')}>
            <ul>
              <li>
                {t(
                  'Lies Beschreibung und Fotos sorgfältig und kläre offene Fragen vor der Übergabe.',
                )}
              </li>
              <li>{t('Vereinbart Ort, Zeit, Preis und Rückgabe eindeutig.')}</li>
              <li>
                {t('Gib keine Zugangsdaten, Einmalcodes oder unnötigen Ausweiskopien weiter.')}
              </li>
            </ul>
          </Section>
          <Section title={t('Bei Übergabe und Rückgabe')}>
            <ul>
              <li>{t('Prüft gemeinsam Zustand, Zubehör und Funktionsfähigkeit.')}</li>
              <li>{t('Haltet vorhandene Schäden und Absprachen bei Bedarf schriftlich fest.')}</li>
              <li>{t('Trefft euch möglichst an einem geeigneten, gut erreichbaren Ort.')}</li>
            </ul>
          </Section>
          <Section title={t('Wenn etwas ungewöhnlich wirkt')}>
            <p>
              {t(
                'Lass dich nicht unter Zeitdruck setzen. Öffne keine verdächtigen Zahlungslinks. Brich den Vorgang ab, wenn Angaben widersprüchlich sind oder du dich unsicher fühlst.',
              )}
            </p>
          </Section>
          <p className={styles.notice}>
            {t(
              'RentTogether bietet in der aktuellen Projektversion keine Versicherung, Treuhandzahlung oder garantierten Käuferschutz an.',
            )}
          </p>
        </>
      )}
      {kind === 'imprint' && (
        <>
          <DraftNotice />
          <p className={styles.lead}>{t('Angaben zum Anbieter von RentTogether.')}</p>
          <Section title={t('Anbieter und Kontakt')}>
            <p>
              {t(
                'Die folgenden Angaben sind frei erfundene Beispieldaten für die Gestaltung dieser Seite.',
              )}
            </p>
            <p>
              {t('Verantwortlicher Anbieter:')} <strong>{t('RentTogether Musterteam')}</strong>
              <br />
              {t('Ladungsfähige Anschrift:')}{' '}
              <strong>{t('Beispielweg 12, 12345 Musterstadt, Deutschland')}</strong>
              <br />
              {t('E-Mail für eine unmittelbare Kontaktaufnahme:')}{' '}
              <strong>kontakt@renttogether.example</strong>
            </p>
          </Section>
          <Section title={t('Über die Plattform')}>
            <p>
              {t(
                'RentTogether ist aus einer gemeinsamen Idee von Olga, Yana und Vlad entstanden: eine Plattform für das private Leihen und Verleihen von Dingen. Die Angaben zum rechtlich verantwortlichen Betreiber werden gesondert ergänzt.',
              )}
            </p>
          </Section>
          <Section title={t('Weitere Anbieterangaben')}>
            <p>
              {t(
                'Rechtsform, Vertretungsberechtigte, Registerangaben und Umsatzsteuer-ID sind abhängig vom tatsächlichen Betreiber zu prüfen und gegebenenfalls zu ergänzen.',
              )}
            </p>
          </Section>
          <Section title={t('Stand dieser Seite')}>
            <p>
              {t(
                'Entwurf vom 2. November 2026. Die vollständigen Anbieterangaben müssen vor der Veröffentlichung festgelegt werden.',
              )}
            </p>
          </Section>
        </>
      )}
      {kind === 'privacy' && (
        <>
          <DraftNotice />
          <p className={styles.lead}>
            {t(
              'Hier erläutern wir den derzeitigen technischen Stand der Verarbeitung personenbezogener Daten bei RentTogether.',
            )}
          </p>
          <Section title={t('1. Verantwortlicher und Datenschutzkontakt')}>
            <p>
              {t('Name, Anschrift und Kontaktadresse des Verantwortlichen:')}{' '}
              <strong>{t('Noch zu ergänzen')}</strong>.{' '}
              <Trans
                i18nKey="operatorReference"
                components={{ notice: <Link to="/impressum" /> }}
              />
            </p>
          </Section>
          <Section title={t('2. Welche Daten verarbeitet werden')}>
            <p>
              {t(
                'Bei der Kontonutzung verarbeiten wir die Anmeldekennung sowie Profilangaben wie Name, Stadt, E-Mail und gegebenenfalls Telefonnummer. Hinzu kommen Anzeigen, hochgeladene Fotos, Favoriten und Buchungsdaten mit Terminen, Status und gespeicherten Preisen. Beim Abruf externer Dienste können technische Verbindungsdaten, insbesondere die IP-Adresse, anfallen.',
              )}
            </p>
          </Section>
          <Section title={t('3. Zwecke und Rechtsgrundlagen')}>
            <p>
              {t(
                'Die Daten werden zur Anmeldung, Profilverwaltung, Veröffentlichung von Anzeigen, Speicherung von Favoriten und Bearbeitung von Mietanfragen benötigt. Die jeweils einschlägigen Rechtsgrundlagen nach Art. 6 DSGVO sowie gegebenenfalls berechtigte Interessen sind durch den verantwortlichen Betreiber vor Veröffentlichung festzulegen.',
              )}
            </p>
          </Section>
          <Section title={t('4. Dienstleister und Empfänger')}>
            <p>
              {t(
                'Für die Anmeldung wird Clerk eingesetzt, für hochgeladene Anzeigenfotos Cloudinary. Profil-, Anzeigen- und Buchungsdaten werden in PostgreSQL gespeichert. Die konkreten Vertragspartner, Hosting-Anbieter, Speicherorte und Auftragsverarbeitungsvereinbarungen müssen vor dem öffentlichen Betrieb dokumentiert werden.',
              )}
            </p>
            <p>
              {t(
                'Öffentliche Anzeigen zeigen unter anderem Fotos, Beschreibung, Stadt und öffentliche Angaben zum Eigentümer. Buchungsdaten sind den jeweiligen Beteiligten zugänglich. Lade keine Fotos hoch, auf denen unbeteiligte Personen oder vertrauliche Informationen erkennbar sind.',
              )}
            </p>
          </Section>
          <Section title={t('5. Cookies und lokale Einstellungen')}>
            <p>
              {t(
                'Die Anwendung speichert die gewählte Darstellung lokal im Browser. Die Anmeldung über Clerk kann Cookies und weitere Sitzungsinformationen verwenden. Die konkrete Aufstellung, Speicherdauer und Bewertung der eingesetzten Browser-Speicher sind vor Veröffentlichung zu vervollständigen.',
              )}
            </p>
          </Section>
          <Section title={t('6. Speicherdauer und Löschung')}>
            <p>
              {t(
                'Verbindliche Löschfristen und Aufbewahrungskriterien sind noch festzulegen. Das Ausblenden einer Anzeige löscht weder die Anzeige noch ihre Buchungshistorie. Eine endgültige Löschung über die Anwendung ist nur für Anzeigen ohne Buchungen vorgesehen.',
              )}
            </p>
          </Section>
          <Section title={t('7. Deine Rechte')}>
            <p>
              {t(
                'Nach Maßgabe der DSGVO bestehen insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung und Datenübertragbarkeit sowie ein Widerspruchsrecht. Eine Einwilligung kann mit Wirkung für die Zukunft widerrufen werden, soweit eine Verarbeitung darauf beruht. Außerdem besteht ein Beschwerderecht bei der zuständigen Datenschutzaufsichtsbehörde. Der Kontakt zur Ausübung dieser Rechte und die zuständige Behörde sind noch zu ergänzen.',
              )}
            </p>
          </Section>
          <Section title={t('8. Noch zu vervollständigen')}>
            <p>
              {t(
                'Vor dem öffentlichen Betrieb sind insbesondere Drittlandübermittlungen und ihre Garantien, konkrete Speicherfristen, die Erforderlichkeit der Datenbereitstellung und gegebenenfalls automatisierte Entscheidungen zu prüfen und in dieser Erklärung zu ergänzen. Stand: 2. November 2026.',
              )}
            </p>
          </Section>
        </>
      )}
      <div className={styles.links}>
        <Link to="/catalog">{t('Dinge entdecken →')}</Link>
        <Link to="/">{t('Zur Startseite')}</Link>
      </div>
    </article>
  );
}
