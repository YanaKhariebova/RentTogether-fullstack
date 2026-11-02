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
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function DraftNotice() {
  return (
    <p className={styles.notice}>
      <strong>Entwurf – Angaben noch unvollständig.</strong> Die Angaben zum Betreiber und zur
      Datenverarbeitung sind noch nicht vollständig. Diese Seite muss vor einer öffentlichen Nutzung
      ergänzt und geprüft werden.
    </p>
  );
}

export function InformationPage({ kind }: { kind: PageKind }) {
  return (
    <article className={styles.page}>
      <p className={styles.eyebrow}>RentTogether</p>
      <h1>{titles[kind]}</h1>
      {kind === 'about' && (
        <>
          <p className={styles.lead}>
            Manche Dinge braucht man nur für einen Moment. Gute Nachbarschaft bleibt.
          </p>
          <Section title="Unsere Idee">
            <p>
              Ein Beamer für einen Filmabend, Werkzeug fürs Wochenende oder Ausrüstung für den
              nächsten Ausflug: RentTogether bringt Menschen zusammen, die Dinge leihen oder
              verleihen möchten.
            </p>
          </Section>
          <Section title="Teilen statt liegen lassen">
            <p>
              Entdecke Angebote in deiner Nähe oder stelle eigene Dinge ein. Du entscheidest, welche
              Anfragen du annimmst, und vereinbarst die Übergabe direkt mit der anderen Person.
            </p>
          </Section>
          <Section title="Drei Menschen. Eine gemeinsame Idee.">
            <p>
              Hinter RentTogether stehen Olga, Yana und Vlad – und die Überzeugung, dass wir nicht
              alles besitzen müssen, um mehr Möglichkeiten zu haben. Aus dieser gemeinsamen Idee
              entstand ein Ort, an dem Menschen Dinge privat leihen und verleihen können: von
              Werkzeug und Technik bis zur Ausrüstung für den nächsten Ausflug.
            </p>
            <p>
              Wir möchten zusammenbringen, was oft nur ein paar Straßen voneinander entfernt ist:
              Dinge, die gerade ungenutzt bleiben, und Menschen, die sie brauchen. Für weniger
              Anschaffungen, mehr Austausch und eine Nachbarschaft, in der Teilen selbstverständlich
              wird.
            </p>
          </Section>
        </>
      )}
      {kind === 'how' && (
        <>
          <p className={styles.lead}>
            In deiner Nähe finden. Gemeinsam nutzen. Wieder zurückgeben.
          </p>
          <Section title="Du möchtest etwas leihen?">
            <ol>
              <li>Suche im Katalog und filtere nach Stadt, Kategorie oder Preis.</li>
              <li>Öffne ein Angebot und wähle das Abhol- und Rückgabedatum.</li>
              <li>
                Melde dich an und sende deine Anfrage. Eine Anfrage ist noch keine Bestätigung.
              </li>
              <li>Nach der Zusage vereinbart ihr die Übergabe und Rückgabe miteinander.</li>
            </ol>
          </Section>
          <Section title="Du möchtest etwas verleihen?">
            <ol>
              <li>Erstelle eine Anzeige mit Beschreibung, Fotos, Stadt und Tagespreis.</li>
              <li>Veröffentliche die Anzeige und prüfe eingehende Anfragen.</li>
              <li>
                Bestätige passende Termine und dokumentiert gemeinsam den Zustand bei der Übergabe.
              </li>
              <li>Nach der Rückgabe schließt du die Buchung ab.</li>
            </ol>
          </Section>
          <Section title="Wie wird die Mietdauer berechnet?">
            <p>
              Der Rückgabetag wird nicht berechnet: Abholung am 6. und Rückgabe am 9. ergeben drei
              Miettage. Die bei der Anfrage gespeicherte Tagesmiete und Gesamtsumme bleiben
              erhalten, auch wenn der Anzeigenpreis später geändert wird.
            </p>
          </Section>
          <p className={styles.notice}>
            Die aktuelle Projektversion verarbeitet keine Online-Zahlungen. Klärt Zahlung, Übergabe
            und Rückgabe vorab miteinander.
          </p>
        </>
      )}
      {kind === 'help' && (
        <>
          <p className={styles.lead}>Die wichtigsten Antworten rund ums Leihen und Verleihen.</p>
          <details>
            <summary>Brauche ich ein Konto?</summary>
            <p>
              Den Katalog kannst du ohne Anmeldung ansehen. Um eine Anfrage zu senden oder eigene
              Anzeigen zu verwalten, brauchst du ein Konto.
            </p>
          </details>
          <details>
            <summary>Wann ist meine Anfrage bestätigt?</summary>
            <p>
              Eine neue Anfrage hat den Status „Ausstehend“. Erst wenn der Eigentümer sie annimmt,
              wird sie „Bestätigt“.
            </p>
          </details>
          <details>
            <summary>Kann ich meine Anfrage zurückziehen?</summary>
            <p>
              Solange sie noch ausstehend ist, kannst du sie unter deinen Mietanfragen stornieren.
              Bereits bestätigte Buchungen lassen sich in dieser Version nicht selbst stornieren.
            </p>
          </details>
          <details>
            <summary>Was passiert, wenn ich meine Anzeige ausblende?</summary>
            <p>
              Die Anzeige verschwindet aus dem öffentlichen Katalog. Bestehende Anfragen und ihre
              gespeicherten Preise bleiben erhalten. Anzeigen mit Buchungen können nicht endgültig
              gelöscht werden.
            </p>
          </details>
          <details>
            <summary>Wie bezahle ich?</summary>
            <p>
              RentTogether bietet in der Projektversion keine Zahlungsabwicklung an. Besprecht die
              Bedingungen vor einer Übergabe direkt miteinander.
            </p>
          </details>
          <details>
            <summary>Ein Foto lässt sich nicht hochladen. Was kann ich tun?</summary>
            <p>
              Nutze JPEG, PNG oder WebP mit höchstens 5 MiB pro Foto. Pro Anzeige sind bis zu acht
              Fotos möglich.
            </p>
          </details>
          <Section title="Kontakt zum Projektteam">
            <p>
              Der öffentliche Support-Kontakt ist noch nicht eingerichtet. Während der betreuten
              Demonstration wende dich bitte direkt an das anwesende Projektteam.
            </p>
          </Section>
        </>
      )}
      {kind === 'safety' && (
        <>
          <p className={styles.lead}>Ein gutes Gefühl beginnt mit klaren Absprachen.</p>
          <Section title="Vor der Anfrage">
            <ul>
              <li>
                Lies Beschreibung und Fotos sorgfältig und kläre offene Fragen vor der Übergabe.
              </li>
              <li>Vereinbart Ort, Zeit, Preis und Rückgabe eindeutig.</li>
              <li>Gib keine Zugangsdaten, Einmalcodes oder unnötigen Ausweiskopien weiter.</li>
            </ul>
          </Section>
          <Section title="Bei Übergabe und Rückgabe">
            <ul>
              <li>Prüft gemeinsam Zustand, Zubehör und Funktionsfähigkeit.</li>
              <li>Haltet vorhandene Schäden und Absprachen bei Bedarf schriftlich fest.</li>
              <li>Trefft euch möglichst an einem geeigneten, gut erreichbaren Ort.</li>
            </ul>
          </Section>
          <Section title="Wenn etwas ungewöhnlich wirkt">
            <p>
              Lass dich nicht unter Zeitdruck setzen. Öffne keine verdächtigen Zahlungslinks. Brich
              den Vorgang ab, wenn Angaben widersprüchlich sind oder du dich unsicher fühlst.
            </p>
          </Section>
          <p className={styles.notice}>
            RentTogether bietet in der aktuellen Projektversion keine Versicherung, Treuhandzahlung
            oder garantierten Käuferschutz an.
          </p>
        </>
      )}
      {kind === 'imprint' && (
        <>
          <DraftNotice />
          <p className={styles.lead}>Angaben zum Anbieter von RentTogether.</p>
          <Section title="Anbieter und Kontakt">
            <p>
              Verantwortlicher Anbieter: <strong>Noch zu ergänzen</strong>
              <br />
              Ladungsfähige Anschrift: <strong>Noch zu ergänzen</strong>
              <br />
              E-Mail für eine unmittelbare Kontaktaufnahme: <strong>Noch zu ergänzen</strong>
            </p>
          </Section>
          <Section title="Über die Plattform">
            <p>
              RentTogether ist aus einer gemeinsamen Idee von Olga, Yana und Vlad entstanden: eine
              Plattform für das private Leihen und Verleihen von Dingen. Die Angaben zum rechtlich
              verantwortlichen Betreiber werden gesondert ergänzt.
            </p>
          </Section>
          <Section title="Weitere Anbieterangaben">
            <p>
              Rechtsform, Vertretungsberechtigte, Registerangaben und Umsatzsteuer-ID sind abhängig
              vom tatsächlichen Betreiber zu prüfen und gegebenenfalls zu ergänzen.
            </p>
          </Section>
          <Section title="Stand dieser Seite">
            <p>
              Entwurf vom 2. November 2026. Die vollständigen Anbieterangaben müssen vor der
              Veröffentlichung festgelegt werden.
            </p>
          </Section>
        </>
      )}
      {kind === 'privacy' && (
        <>
          <DraftNotice />
          <p className={styles.lead}>
            Hier erläutern wir den derzeitigen technischen Stand der Verarbeitung personenbezogener
            Daten bei RentTogether.
          </p>
          <Section title="1. Verantwortlicher und Datenschutzkontakt">
            <p>
              Name, Anschrift und Kontaktadresse des Verantwortlichen:{' '}
              <strong>Noch zu ergänzen</strong>. Die Anbieterangaben werden im{' '}
              <Link to="/impressum">Impressum</Link> veröffentlicht.
            </p>
          </Section>
          <Section title="2. Welche Daten verarbeitet werden">
            <p>
              Bei der Kontonutzung verarbeiten wir die Anmeldekennung sowie Profilangaben wie Name,
              Stadt, E-Mail und gegebenenfalls Telefonnummer. Hinzu kommen Anzeigen, hochgeladene
              Fotos, Favoriten und Buchungsdaten mit Terminen, Status und gespeicherten Preisen.
              Beim Abruf externer Dienste können technische Verbindungsdaten, insbesondere die
              IP-Adresse, anfallen.
            </p>
          </Section>
          <Section title="3. Zwecke und Rechtsgrundlagen">
            <p>
              Die Daten werden zur Anmeldung, Profilverwaltung, Veröffentlichung von Anzeigen,
              Speicherung von Favoriten und Bearbeitung von Mietanfragen benötigt. Die jeweils
              einschlägigen Rechtsgrundlagen nach Art. 6 DSGVO sowie gegebenenfalls berechtigte
              Interessen sind durch den verantwortlichen Betreiber vor Veröffentlichung festzulegen.
            </p>
          </Section>
          <Section title="4. Dienstleister und Empfänger">
            <p>
              Für die Anmeldung wird Clerk eingesetzt, für hochgeladene Anzeigenfotos Cloudinary.
              Profil-, Anzeigen- und Buchungsdaten werden in PostgreSQL gespeichert. Die konkreten
              Vertragspartner, Hosting-Anbieter, Speicherorte und
              Auftragsverarbeitungsvereinbarungen müssen vor dem öffentlichen Betrieb dokumentiert
              werden.
            </p>
            <p>
              Öffentliche Anzeigen zeigen unter anderem Fotos, Beschreibung, Stadt und öffentliche
              Angaben zum Eigentümer. Buchungsdaten sind den jeweiligen Beteiligten zugänglich. Lade
              keine Fotos hoch, auf denen unbeteiligte Personen oder vertrauliche Informationen
              erkennbar sind.
            </p>
          </Section>
          <Section title="5. Cookies und lokale Einstellungen">
            <p>
              Die Anwendung speichert die gewählte Darstellung lokal im Browser. Die Anmeldung über
              Clerk kann Cookies und weitere Sitzungsinformationen verwenden. Die konkrete
              Aufstellung, Speicherdauer und Bewertung der eingesetzten Browser-Speicher sind vor
              Veröffentlichung zu vervollständigen.
            </p>
          </Section>
          <Section title="6. Speicherdauer und Löschung">
            <p>
              Verbindliche Löschfristen und Aufbewahrungskriterien sind noch festzulegen. Das
              Ausblenden einer Anzeige löscht weder die Anzeige noch ihre Buchungshistorie. Eine
              endgültige Löschung über die Anwendung ist nur für Anzeigen ohne Buchungen vorgesehen.
            </p>
          </Section>
          <Section title="7. Deine Rechte">
            <p>
              Nach Maßgabe der DSGVO bestehen insbesondere Rechte auf Auskunft, Berichtigung,
              Löschung, Einschränkung und Datenübertragbarkeit sowie ein Widerspruchsrecht. Eine
              Einwilligung kann mit Wirkung für die Zukunft widerrufen werden, soweit eine
              Verarbeitung darauf beruht. Außerdem besteht ein Beschwerderecht bei der zuständigen
              Datenschutzaufsichtsbehörde. Der Kontakt zur Ausübung dieser Rechte und die zuständige
              Behörde sind noch zu ergänzen.
            </p>
          </Section>
          <Section title="8. Noch zu vervollständigen">
            <p>
              Vor dem öffentlichen Betrieb sind insbesondere Drittlandübermittlungen und ihre
              Garantien, konkrete Speicherfristen, die Erforderlichkeit der Datenbereitstellung und
              gegebenenfalls automatisierte Entscheidungen zu prüfen und in dieser Erklärung zu
              ergänzen. Stand: 2. November 2026.
            </p>
          </Section>
        </>
      )}
      <div className={styles.links}>
        <Link to="/catalog">Dinge entdecken →</Link>
        <Link to="/">Zur Startseite</Link>
      </div>
    </article>
  );
}
