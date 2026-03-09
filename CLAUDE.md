# CLAUDE.md - Agent Instructions for Memory Search

## Daily Log Search Protocol

When searching for information from prior days or looking for historical context:

### 1. Primary Search: Semantic Vector Search
Always use `memory_search` first to search across all memory files semantically:

```
memory_search:
  query: "<your search query>"
  maxResults: 10
  minScore: 0.7
```

This searches:
- MEMORY.md (curated long-term memory)
- memory/projects/*.md (project files)
- memory/lessons.md (extracted lessons)
- memory/archive/daily-logs/*.md (daily logs - archived)
- Any other .md files in memory/

### 2. Secondary Search: Exact Keyword Search
If semantic search doesn't yield results, use:
- `web_search` for external info
- `exec: grep -r "keyword" /Users/Ziga/.openclaw/workspace/memory/` for exact matches

### 3. Daily Log Locations
Daily logs are stored in two places:
- **Current/Recent**: `memory/YYYY-MM-DD.md` (root of memory folder)
- **Archived**: `memory/archive/daily-logs/YYYY-MM-DD.md` (older logs)

Both locations are automatically indexed by the vector search system.

### 4. When to Search Daily Logs
Search daily logs when:
- User asks "what did we do on [date]?"
- User asks about prior decisions or context
- You need to recall specific experiments or failures
- Looking for status updates on old tasks

### 5. Search Best Practices
- Use natural language queries (not just keywords)
- Include dates in queries when relevant: "what happened on February 15th"
- Search for both topics and project names
- Cross-reference with MEMORY.md for curated context

## Memory System Overview

```
memory/
├── MEMORY.md              # Curated long-term memory (high-level)
├── lessons.md             # Extracted lessons/patterns
├── YYYY-MM-DD.md          # Current daily log (if exists)
├── projects/
│   ├── *.md              # Project-specific files
├── archive/
│   └── daily-logs/
│       └── YYYY-MM-DD.md # Archived daily logs
└── [other .md files]     # All indexed for search
```

**Rule**: When in doubt, search. The vector search system has access to all historical daily logs.
