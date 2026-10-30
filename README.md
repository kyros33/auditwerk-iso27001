# Auditwerk ISO 27001 für Cloudflare

Erste technische Umsetzung mit Kunden, Audits, Fragen, Textbausteinen, Jahresauswahl, Dashboard und CSV-Export. Die bisherige Website kann ohne ihren Quellcode nicht pixelgenau kopiert werden.

## Sicherheit – vor der Veröffentlichung
Die API besitzt derzeit keine Authentifizierung. **Nicht mit echten Kundendaten produktiv verwenden.** Vor einem Deployment Cloudflare Access und serverseitige API-Berechtigungsprüfung ergänzen. Besonders der Import darf nur Administratoren offenstehen.

## Installation
1. npm install
2. D1-Datenbank in Cloudflare anlegen.
3. D1-Binding DB mit echter database_id in wrangler.toml aktivieren.
4. Schema ausführen: npx wrangler d1 execute auditwerk-db --remote --file=schema.sql
5. Zugriff absichern, dann npm run deploy.
6. Kunden/Audits anlegen und JSON-Fragenkatalog importieren.

Eine bestehende D1-Datenbank wird nicht automatisch verändert. Vor Schemaänderungen Backup erstellen und Tabellenstruktur prüfen.

## Noch offen
Word-Export, Dateianhänge, Änderungsprotokoll, automatisierte Tests und genauer Designabgleich mit der ursprünglichen Auditwerk-Version.
