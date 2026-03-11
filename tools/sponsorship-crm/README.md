# BusyBits Sponsorship CRM

CLI tool to manage newsletter sponsor outreach, track conversations, and automate follow-ups.

## Quick Start

```bash
# View all sponsors
node bin/crm.js list

# View pipeline
node bin/crm.js pipeline

# Generate cold email
node bin/crm.js email eight-sleep

# Record contact (auto-schedules follow-up in 7 days)
node bin/crm.js touch eight-sleep

# Check follow-ups due
node bin/crm.js follow-ups

# Move sponsor through pipeline
node bin/crm.js status eight-sleep Contacted

# Export all ready-to-send emails
node bin/crm.js export

# View stats
node bin/crm.js stats
```

## Data Model

Sponsors are stored in `data/sponsors.json` with:
- **id**: URL-friendly identifier
- **name**: Company name
- **category**: Health Tech, Productivity SaaS, etc.
- **tier**: 1-4 priority
- **contacts**: Array of contact people
- **status**: Prospect → Contacted → Negotiating → Closed → Live
- **template**: Email template to use (super-user, competitor)
- **personalization**: Custom hooks and angles

## Email Templates

| Template | Use Case |
|----------|----------|
| `super-user` | For tools you actually use |
| `competitor` | For brands sponsoring similar newsletters |
| `bump-1` | First follow-up (3 days) |
| `bump-2` | Second follow-up with stats (7 days) |

## Files

- `bin/crm.js` - CLI entry point
- `lib/crm.js` - Data operations
- `lib/templates.js` - Email generation
- `data/sponsors.json` - Sponsor database
- `test/test.js` - Test suite

## Running Tests

```bash
node test/test.js
```
