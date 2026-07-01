# Stundenplan-App für Lehrerwünsche, Setzungen und Ausschlussbedingungen

Django-Prototyp für eine schulische Stundenplanung. Gedacht für iPad/GitHub/Render: Du musst lokal nichts installieren, sondern kannst den Ordner als GitHub-Repository hochladen und danach veröffentlichen.

## Was die App kann

- Lehrkräfte mit Deputat und Tagesmaximum erfassen
- Teams/Klassen/Lerngruppen erfassen
- Zeitraster Montag bis Freitag erfassen
- Unterrichtsformen abbilden:
  - Input
  - Lernatelier
  - Werkstattunterricht
  - Club/Kreativband
  - Assembly/Teamzeit
  - Coaching
  - Sonstiges
- Unterrichtsbedarf pro Team erfassen
- mögliche Lehrkräfte pro Bedarf hinterlegen
- erlaubte Zeitfenster je Bedarf setzen
- Lehrerwünsche erfassen:
  - Wunsch
  - ideal/muss
  - ungünstig
  - nicht verfügbar
- Fixstunden setzen
- Ausschlussbedingungen erfassen, z.B.:
  - Team/Klasse ist in einem Zeitfenster blockiert
  - Unterrichtsform darf nicht in ein Zeitfenster
  - Lehrkraft darf nicht in ein bestimmtes Team
  - Fach nicht nach einer bestimmten Stunde
  - zwei Angebote nicht am selben Tag
  - zwei Angebote nicht zeitgleich
- Planvorschlag berechnen
- Konflikte anzeigen

## iPad-Vorgehen über GitHub und Render

### 1. ZIP entpacken
Die Datei `stundenplan_app.zip` auf dem iPad in der Dateien-App entpacken.

### 2. GitHub-Repository erstellen
Auf github.com ein neues Repository erstellen, z.B. `stundenplan-app`.

### 3. Dateien hochladen
Im Repository auf **Add file → Upload files** gehen und den Inhalt des entpackten Ordners hochladen. Wichtig: `manage.py`, `requirements.txt`, `render.yaml`, `Procfile` müssen direkt im Hauptordner des Repos liegen.

### 4. Bei Render veröffentlichen
Auf render.com einloggen → **New +** → **Blueprint** oder **Web Service** → GitHub-Repository auswählen.

Wenn du Blueprint nutzt, liest Render die Datei `render.yaml` automatisch.

### 5. Admin-Zugang setzen
In Render bei den Environment Variables ergänzen:

```text
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=deine-mail@example.de
DJANGO_SUPERUSER_PASSWORD=ein-sicheres-passwort
DEBUG=false
```

Danach neu deployen. Die App erstellt den Admin automatisch.

### 6. Daten bearbeiten
App öffnen → `/admin/` → mit Admin einloggen.

Empfohlene Reihenfolge:

1. Zeitfenster anlegen
2. Unterrichtsformen prüfen/anlegen
3. Lehrkräfte anlegen
4. Teams/Klassen anlegen
5. Bedarfe anlegen
6. Lehrerwünsche eintragen
7. Fixstunden eintragen
8. Ausschlussbedingungen eintragen
9. Planvorschlag berechnen

## Lokal starten, falls du später am Laptop arbeitest

```bash
pip install -r requirements.txt
python manage.py makemigrations scheduler
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Dann öffnen: `http://127.0.0.1:8000`

## Wichtiger Hinweis

Das ist ein erster Prototyp. Er nutzt einen einfachen Heuristik-Solver, keinen vollständigen mathematischen Optimierer. Er ist gut, um Regeln, Setzungen und Datenstruktur zu testen. Für eine endgültige automatische Stundenplanmaschine könnte später OR-Tools ergänzt werden.
