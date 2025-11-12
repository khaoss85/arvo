# Exercise Embeddings

This directory contains pre-generated embeddings for semantic search in exercise matching.

## File: `exercise-embeddings.json`

- **Size**: ~40MB uncompressed (~12MB gzipped)
- **Exercises**: 1417 unique exercise names from ExerciseDB
- **Model**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Version**: 1.0.0

## How It Works

1. **Generation**: Run `npm run generate:embeddings` to create the embeddings file
2. **Distribution**: The file is served to all users via Next.js public directory
3. **Loading**: App loads embeddings on startup from `/data/exercise-embeddings.json`
4. **Semantic Search**: Used as fallback when exact/fuzzy matching fails

## Regenerating Embeddings

You should regenerate embeddings when:
- ExerciseDB adds new exercises
- Exercise names change
- You want to update to a newer embedding model

```bash
npm run generate:embeddings
```

**Requirements**:
- `OPENAI_API_KEY` environment variable
- OpenAI API access (cost: ~$0.0003 per generation)

## Git Strategy

You have two options:

### Option A: Commit to Repository (Recommended)
**Pros**:
- Zero setup for other developers
- Always available in production
- No CI/CD configuration needed

**Cons**:
- Adds ~12MB to repository (gzipped)
- Large diffs when regenerating

```bash
# Keep the file in git
git add public/data/exercise-embeddings.json
git commit -m "chore: add exercise embeddings"
```

### Option B: Generate in CI/CD
**Pros**:
- Lighter repository
- Always fresh embeddings

**Cons**:
- CI/CD needs `OPENAI_API_KEY`
- Adds build time (~60 seconds)
- Requires configuration

```bash
# Add to .gitignore
echo "public/data/exercise-embeddings.json" >> .gitignore

# Add to CI/CD pipeline (e.g., Vercel)
npm run generate:embeddings && npm run build
```

## Troubleshooting

### "Embeddings file not found"
Run: `npm run generate:embeddings`

### "Version mismatch"
The file was generated with a different version. Regenerate:
```bash
npm run generate:embeddings
```

### "API Key not found"
Set your OpenAI API key:
```bash
# .env.local
OPENAI_API_KEY=your-key-here
```

## Performance

- **First Load**: ~50-100ms (fetch JSON from public directory)
- **Cached**: Instant (stored in memory)
- **Bundle Impact**: +12MB gzipped (lazy loaded, doesn't affect page load)
- **Semantic Search Latency**: ~150ms (includes OpenAI API call for query embedding)

## Cost Analysis

### One-Time Generation
- 1417 exercises × ~10 tokens = 14,170 tokens
- OpenAI text-embedding-3-small: $0.02 per 1M tokens
- **Total**: $0.0003 (less than a penny)

### Per-User Queries
- Query embedding: ~10 tokens = $0.0000002
- Essentially free

### Total Savings vs Per-User Generation
- Without static file: 1000 users × $0.0003 = $0.30
- With static file: $0.0003 (one time) + $0.00 (distribution)
- **Savings**: 99.9% reduction in cost and time
