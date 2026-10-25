# Моя вахта — локальный сервер Django и мобильный прототип

«Моя вахта» — проект приложения для вахтовиков: календарь рабочих смен, финансы и выплаты, заметки, друзья, заявки, сообщения и компании.

**Архитектура:** Python 3.12, Django 5.2 LTS, Django REST Framework, PostgreSQL. Исходный HTML/CSS/JavaScript-интерфейс **сохранён** и теперь может обслуживаться Django на ноутбуке. В будущем Android-клиент пишется на Kotlin и обращается к тому же API.

## 🚀 Начать на Windows

Полная инструкция: **[docs/LOCAL_DJANGO_SETUP.md](docs/LOCAL_DJANGO_SETUP.md)**.

Сначала установить Python, Git и PostgreSQL, создать PostgreSQL пользователя/базу, заполнить локальный файл `.env` (не коммитить).

```bat
git clone https://github.com/CrossDoomDev/my_vahta.git
cd my_vahta
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
```

После настройки `.env` и PostgreSQL:

```bat
.venv\Scripts\python.exe backend\manage.py migrate
.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Открыть **http://127.0.0.1:8000/**. Серверный health-check: **http://127.0.0.1:8000/api/v1/health/**. Администрирование: **http://127.0.0.1:8000/admin/**.

## 🔁 Обновление кода с GitHub

После остановки Django (Ctrl+C):

```bat
git pull --ff-only
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe backend\manage.py migrate
.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Миграции сохраняют данные при корректном изменении схемы. Не удалять локальную базу данных ради обновления кода.

## Что реально работает

- Django, PostgreSQL, Django Admin и REST API, модели с миграциями.
- Регистрация/вход с тестовым ID и паролем, серверный UUID профиля, закрытые личные данные.
- API единого периода вахты, продления и суммы внесённых выплат за весь период.
- CRUD личных выплат/заметок, ручная синхронизация вахты/выплат/заметок с проверкой версии.
- API поиска людей, разрешивших поиск, заявок в друзья и их принятия/отклонения, уведомлений, сообщений между подтверждёнными друзьями.
- Старый интерфейс полностью сохранён; «Ещё → Локальный сервер» появляется при запуске через Django. Через него пользователь **сам** выбирает направление синхронизации. Без подтверждения данные на сервер не отправляются.
- GitHub Actions запускает тесты Django на PostgreSQL, проверки миграций и существующие JavaScript-тесты.

## Что ещё не завершено

- Экран друзей/сообщений, каталог организаций, отзывы и расширенные настройки приватности в старом `app.js` пока частично демонстрационные. Серверное API для дружбы и сообщений есть, но пользовательские экраны ещё не перенесены на него.
- Настоящая Android-оболочка, подтверждение телефонного номера, поиск людей среди контактов, push, WebSocket и офлайн-разрешение конфликтов — дальнейшие этапы.
- VPS/боевой запуск, HTTPS, бэкапы и юридическая подготовка к обработке персональных данных настоящих пользователей ещё не проводились.
- Тестовые лица/отзывы из старого прототипа — не реальные подтверждённые пользователи. Их нельзя автоматически импортировать на сервер.

**GitHub Pages** [просмотр UI-прототипа](https://crossdoomdev.github.io/my_vahta/) — без PostgreSQL. Разработку настоящей серверной части тестировать через Django на ноутбуке, а не по GitHub Pages.

## Структура

```text
my_vahta/
├── backend/
│   ├── manage.py
│   ├── config/                 # Django settings, URLs, ASGI, WSGI
│   └── core/                   # Models, migrations, serializers, API, tests
├── backend-client.js           # Опциональный ручной API-адаптер
├── index.html, app.js          # Существующий HTML/JS интерфейс
├── styles.css, friends.css, organizations.css
├── data/, assets/             # Справочник организаций и изображения
├── requirements.txt           # Python-зависимости
├── .env.example               # Безопасный образец локальных настроек
└── docs/                      # Инструкции и архитектура
```

## Документация для Codex

- [Локальный запуск на Windows](docs/LOCAL_DJANGO_SETUP.md)
- [Контракт API v1](docs/API.md)
- [Правила разработки Django и интеграции](docs/CODEX_DJANGO.md)
- [Android-контакты и социальная сеть](docs/CODEX_FRIENDS_ANDROID.md)
- [Архитектура сервера](docs/SERVER_ARCHITECTURE.md)
- [План масштабирования](docs/SCALABILITY_PLAN.md)

Нельзя хранить `.env`, PostgreSQL-пароли, секреты и пользовательские выгрузки в публичном репозитории.
