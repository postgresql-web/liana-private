# Liana CRM

Професійна система управління нерухомістю для ефективної роботи з об'єктами, клієнтами та показами.

## Особливості

- Управління об'єктами нерухомості з фотографіями
- База клієнтів з відстеженням статусу дзвінків
- Планування та управління показами
- Автоматична генерація ID для об'єктів
- Вибір головного фото для кожного об'єкта
- Градієнтний дизайн з плавними переходами теми
- Автоматичне збереження бази даних в Git
- Підтримка локальної мережі

## Встановлення

1. Клонуйте репозиторій:
\`\`\`bash
git clone <your-repo-url>
cd lianaV1
\`\`\`

2. Встановіть залежності:
\`\`\`bash
npm install
\`\`\`

3. Створіть файл `.env` на основі `.env.example`:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Налаштуйте змінні оточення в `.env`:
\`\`\`env
AUTH_SECRET=your-secret-key-change-in-production
PASSWORD_SALT=your-password-salt
DATABASE_DIR=./data
DATABASE_PATH=./data/database.sqlite

# Опціонально: для автоматичного збереження в Git
GIT_REPO_URL=https://github.com/yourusername/yourrepo.git
GIT_TOKEN=your_github_personal_access_token
GIT_BRANCH=main
\`\`\`

5. Запустіть сервер розробки:
\`\`\`bash
npm run dev
\`\`\`

Додаток буде доступний за адресою `http://localhost:3000` та в локальній мережі за адресою `http://192.168.x.x:3000`

## Використання

### Користувачі за замовчуванням

- **admin** / admin123
- **Elena** / 12345
- **Anna** / 09876

### Автоматичне збереження бази даних

Якщо налаштовані змінні `GIT_REPO_URL` та `GIT_TOKEN`, база даних автоматично зберігається в Git після кожної зміни.

Ви також можете вручну запустити синхронізацію:
\`\`\`bash
npm run db:push
\`\`\`

## Технології

- **Next.js 15** - React фреймворк
- **TypeScript** - Типізація
- **SQLite** - База даних
- **Tailwind CSS** - Стилізація
- **shadcn/ui** - UI компоненти
- **bcrypt** - Хешування паролів
- **isomorphic-git** - Git інтеграція

## Структура проекту

\`\`\`
lianaV1/
├── app/                    # Next.js App Router
│   ├── (authenticated)/   # Захищені сторінки
│   ├── api/               # API маршрути
│   └── page.tsx           # Сторінка входу
├── components/            # React компоненти
├── lib/                   # Утиліти та хелпери
│   ├── data-store.ts     # Основна логіка бази даних
│   ├── auth.ts           # Аутентифікація
│   └── db-sync.ts        # Git синхронізація
├── data/                  # База даних SQLite
├── scripts/              # Скрипти
│   └── push-db.js        # Git push скрипт
└── public/               # Статичні файли
\`\`\`

## Розгортання на Render

1. Створіть новий Web Service на Render
2. Підключіть ваш Git репозиторій
3. Налаштуйте змінні оточення
4. Додайте Persistent Disk для `/opt/render/project/data`
5. Встановіть `DATABASE_PATH=/opt/render/project/data/database.sqlite`

## Ліцензія

MIT
