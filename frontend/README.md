# Memory Leak Crisis

Interaktywna webowa gra / symulacja systemu pod atakiem, stworzona w React + Firebase.  
Gracz obserwuje stan integralności systemu w czasie rzeczywistym, może naprawiać uszkodzenia, restartować system oraz wykonywać ataki z użyciem mechanizmu Proof of Work.

## Demo funkcji

Aplikacja umożliwia:

- monitorowanie poziomu `HEALTH` w czasie rzeczywistym
- ręczne naprawianie systemu
- restart systemu po całkowitej awarii
- pobieranie challenge PoW z backendu
- wysyłanie ataku z użyciem `challenge` i `nonce`
- symulowanie parametrów systemowych, takich jak:
  - RAM
  - ping
  - uptime

## Technologie

- **React**
- **TypeScript**
- **Firebase Realtime Database**
- **Tailwind CSS**
- **Vercel backend API**

## Jak to działa

Frontend cyklicznie:

- pobiera aktualny stan zdrowia systemu z Firebase
- wysyła ping do backendu, aby odświeżyć stan
- aktualizuje losowo parametry RAM i ping dla efektu wizualnego

Backend obsługuje endpointy odpowiedzialne za:

- rozpoczęcie / restart gry
- naprawę systemu
- pobranie challenge PoW
- wykonanie ataku po poprawnym przesłaniu challenge i nonce
- zwracanie stanu health

## Endpointy API

Aplikacja korzysta z następujących endpointów:

- `GET /challenge` – pobiera challenge do Proof of Work
- `POST /start` – restartuje system
- `POST /repair` – naprawia system
- `POST /attack` – wykonuje atak
- `GET /health` – zwraca aktualny stan systemu

Bazowy adres API:

```txt
https://memory-leak-crisis-k1ab.vercel.app
