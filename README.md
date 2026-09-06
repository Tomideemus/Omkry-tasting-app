# OMKRY Beer Tasting – uusi käyttöliittymä

Tämä versio käyttää jokaiselle oluelle yksilöllistä ID:tä, numeroa, nimeä ja omaa kuvaa.

## Uutta

### Puhelimella tehtävä oluen muokkaus

Ylläpito on tehty erityisesti puhelinta varten:

**Muokkaa → Ota kuva → kirjoita nimi → Tallenna**

- Jokaisella oluelle on oma Muokkaa-painike.
- "Ota kuva" avaa puhelimen kameran (`capture="environment"`).
- Kuvasta näytetään esikatselu heti.
- Kuva pienennetään automaattisesti enintään 1200 × 1200 pikseliin.
- Kuvasuhdetta ei tarvitse itse muuttaa.
- Tölkki/pullo säilyy näkyvissä `contain`-sovituksella.
- Nimeksi tarvitsee syöttää vain oluen nimi.
- Tallenna päivittää oluen saman yksilöllisen ID:n alle.

- Vain oluen nimi – ei panimoa, tyyliä, ABV:tä tai IBU:a.
- Jokaisella oluelle oma pysyvä tunniste, esim. BOX-01 / TAP-01.
- Jokaiselle oluelle voidaan ottaa kuva suoraan puhelimella.
- Admin-sivu pienentää kuvan automaattisesti enintään 1200 × 1200 pikseliin ennen Firebase Storageen tallennusta.
- Käyttöliittymä käyttää kuvalle `contain`-sovitusta, joten tölkki/pullo ei leikkaudu.
- Harmaat ☆ ennen äänestystä.
- Valitut ★ muuttuvat keltaisiksi ja oma piste näkyy selvästi.
- Äänestys säilyy laitekohtaisesti Firebase Authenticationin anonyymin UID:n avulla.
- Laatikko- ja hanaoluet ovat erilliset.
- Live-tulokset ja erilliset voittaja-animaatiot.
- Ylläpidossa voi lisätä ja muokata oluita.
- Ylläpidossa voi poistaa kaikki testitulokset.

## Firebase-asetukset

1. Ota Realtime Database käyttöön.
2. Ota Authentication > Anonymous käyttöön.
3. Ota Authentication > Email/Password käyttöön.
4. Luo yksi ylläpitäjän sähköposti/salasana.
5. Kopioi Firebase Web App -asetukset `firebase-config.js`-tiedostoon.
6. Lisää `database.rules.json` Realtime Databasen Rules-kohtaan.
7. Lisää `storage.rules` Cloud Storagen Rules-kohtaan.
8. Kirjaudu kerran admin-tunnuksella Firebase Authenticationissa ja kopioi sen UID.
9. Lisää Realtime Databaseen:

`users/<ADMIN_UID>/role = admin`

10. Avaa `admin.html`, kirjaudu sisään ja paina "Luo 24 + 4 olutpaikkaa".
11. Muokkaa oluiden nimet ja lisää kuvat.

Firebase Security Rules ovat tärkeitä: älä jätä tietokantaa avoimilla read/write-säännöillä.

## Puhelimella tehtävä oluen muokkaus

Ylläpito on tarkoitettu käytettäväksi puhelimella:

**Muokkaa → Ota kuva → kirjoita nimi → Tallenna**

Valitse kiinteä olutpaikka, paina **Muokkaa**, paina **📷 Ota kuva**, ota kuva kameralla, kirjoita **Oluen nimi** ja paina **✓ Tallenna**.

Kuvan koko pienennetään selaimessa automaattisesti ennen latausta.

Olutnumeroa, kategoriaa tai järjestystä ei tarvitse kirjoittaa.
