# Auditwerk – Cloudflare Migration

## Stand 30.10.2026
Der Code im Branch main ist eine **noch nicht freigegebene Entwicklungsfassung** und wurde nicht live getestet.

Die Tabelle aus D1 Studio wurde als `export.csv` ausgewertet (55 Spaltendefinitionen aus sechs fachlichen Tabellen). Die API in `src/index.js` spricht nun folgende vorhandene Tabellen an:
- `kunden` (id, firmenname, logo_url)
- `audits` (id, kunden_id, bezeichnung, auditdatum, auditor, status)
- `aw_vorlagen` (Fragenkatalog, Textbausteine, Jahreszuordnung)
- `aw_auditpositionen` (Antworten pro Audit)

`auditfragen` und `auditantworten` sind bislang **nicht in die neue Auswertung migriert**. Es wurden keine D1-Schemaänderungen durchgeführt. Die frühere `schema.sql` beschreibt ein alternatives Schema und darf **nicht** auf die vorhandene Datenbank ausgeführt werden.

## Vor produktivem Einsatz zwingend
1. Bestehenden Worker `auditwerk` und die D1-Datenbank sichern.
2. Die echten Tabelleninhalte und Formate von `aw_vorlagen.bausteine`, `aw_vorlagen.auswahljahre`, `aw_auditpositionen.bewertung` prüfen; CSV enthielt nur Spalten, keine Werte.
3. Migrationslogik testen; der aktuelle Import-Endpunkt ist absichtlich gesperrt, um `aw_vorlagen` nicht zu überschreiben.
4. Cloudflare Access einrichten sowie **serverseitige JWT-Verifikation mit Audience-Prüfung** und Berechtigungen ergänzen. Das gegenwärtige Identitäts-Checking ist nicht als abschliessende Sicherheitsfreigabe zu verstehen.
5. In `wrangler.toml` ist der Worker-Name noch `auditwerk-iso27001`; Cloudflare zeigt den vorhandenen Worker `auditwerk`. Erst nach ausdrücklicher Prüfung anpassen.
6. `wrangler.toml` enthält noch keine aktive D1-Bindung. Die existierende D1-ID muss ausdrücklich übernommen werden.
7. Die Oberfläche an der laufenden Auditwerk-Version vergleichen, insbesondere Jahresplanung, Textbausteine und Prüfpunktumfang.
8. Audit- und Datenbank-Backups vor dem Deployment verifizieren.

**Kein produktiver Deploy und keine echten Kundendaten, bevor diese Punkte erfüllt und getestet sind.**
