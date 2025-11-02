---
# Contributing to Blind App

Thank you for your interest in contributing to the Bloodchain! This document provides guidelines and information for contributors.

---

## Table of Contents
- [Development Environment](#development-environment)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Standards](#documentation-standards)
- [License](#license)
- [Getting Help](#getting-help)

## Development Environment
- Git
- Node.js 20+
- pnpm 10+
- Docker Desktop

### Setup
```bash
# 1. Clone the repository
git clone https://github.com/aryankumarofficial/bloodchain.git
cd bloodchain

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
# (Copy the example file and then fill in your keys)
cp .env.example .env.local

# 4. start the docker desktop
docker desktop start

# 5. buid the container
docker compose up --buid

# 6. Set up and migrate the database
# (This requires Docker Desktop to be running)
npx prisma migrate dev

# 7. Generate the Prisma Client
npx prisma generate

# 8. Start the development server
pnpm dev

# Your app should now be running at http://localhost:3000

# 9. stop the docker services after work donw
docker compose down -v
```

## Code Style Guidelines
- Strict TypeScript typing
- Prefer interfaces for object shapes
- PascalCase for components, camelCase for functions/variables
- Use JSDoc for all functions/components
- Tailwind CSS for styling
- Responsive and accessible design

## Commit Convention
We follow [Conventional Commits](https://conventionalcommits.org/):
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding/updating tests
- chore: Maintenance tasks

## Pull Request Process
- Run `pnpm run lint`
- Add/update JSDoc comments
- Update API docs for new endpoints
- Use PR template for description, testing, and screenshots
- Local build must pass
- All CI checks must pass
- At least one maintainer review required

### Example PR Template
```markdown
## Description
- What does this PR do?

## Testing
- How was this tested?

## Screenshots
- (If applicable)

## Checklist
- [ ] Lint/format pass
- [ ] Tests added/updated
- [ ] Docs updated
```

## Testing Guidelines
- Jest + React Testing Library (planned)
- Aim for 80%+ code coverage
- Test API routes, components, and utility functions
- Manual checklist: authentication, forms, responsive design, dark mode, navigation, error states

## Documentation Standards
- JSDoc for all functions/components
- Update README and API docs for new features
- Keep environment variable docs current

## License
By contributing, you agree your contributions are licensed under the project license.

## Getting Help
- [Open Issues](https://github.com/aryankumarofficial/bloodchain/issues)
- [Discussions](https://github.com/aryankumarofficail/bloodchain/discussions)
- [Roadmap](ROADMAP.md)