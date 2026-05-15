# AI Coach Architecture

The AI coach is the product's central intelligence layer. It should feel conversational, but internally it must behave like a careful app operator.

## Request Flow

1. User sends a message.
2. The coach API authenticates the user.
3. The app loads scoped context:
   - Today's meals
   - Active nutrition goal
   - Hydration progress
   - Supplement schedule
   - Recent body metrics
   - Recent coach memory
   - Recent chat messages
4. The model receives a compact prompt plus typed tools.
5. The model either answers conversationally or calls tools.
6. Tool inputs are validated.
7. Domain functions apply mutations.
8. Every mutation is written to `AiActionLog`.
9. The assistant response streams back to the UI.

## Model Provider

Initial provider: Groq.

The model adapter should live behind `src/lib/ai`, so we can later switch between Groq, OpenAI, Gemini, or a local model without rewriting the coach feature.

## Tool Safety Rules

The model cannot directly access the database.

Allowed pattern:

```text
model -> typed tool -> validation -> ownership check -> domain function -> database
```

Disallowed pattern:

```text
model -> SQL
```

## Ambiguity Rules

The coach may apply a change when the target is obvious:

```text
"I drank 500ml water" -> add hydration log for now
"add 2 scoops whey" -> add supplement/meal item if user has whey configured
```

The coach should ask a clarifying question when the target is ambiguous:

```text
"remove that snack" when there are multiple snacks
"change protein to 30g" without a meal target
```

## Memory Strategy

Short-term memory:

- Recent chat messages
- Today's logs
- Current goals

Long-term memory:

- Dietary preferences
- Allergies and constraints
- Repeated behavior patterns
- Coaching tone preferences

We start with structured Postgres memory rows. Embeddings can be added later when memory search becomes too broad for simple filters.

