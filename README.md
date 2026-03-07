# Q-Guard 🛡️

> **Safe. Informative. Scalable.**

Q-Guard is a TypeScript library that works as a **gatekeeper** for raw data. Before data reaches your business logic or database, Q-Guard ensures the data is safe, valid, and ready to use.

---

# Github Link

Here my github link: 
https://github.com/ammaar-engineer/Q-Guard
Lets collaborate with me!

## Philosophy

> *"Code should work like Lego."*

Q-Guard is built on one principle: data validation and transformation should be **modular, composable, and transparent**.

- **Modular** — bring your own validators and transformers, plug them in anywhere
- **Composable** — each validator only needs to return `boolean`, each transformer only needs to return data
- **Transparent** — every failure tells you *where* and *why*, not just *that something is wrong*

---

## How It Works

Raw data passes through two layers in sequence:

```
raw data → [ Security Layer ] → [ Transformer Layer ] → clean data
```

### Layer 1: Security Layer
Raw data enters this layer and goes through all configured checks in sequence. If any check fails, the system stops and returns detailed error information. If all checks pass, data proceeds to the next layer.

### Layer 2: Transformer Layer
Data that has passed the security layer is processed here. Each transformer receives the output from the previous transformer, forming a clean and predictable transformation pipeline.

> **Note:** The security layer validates data as-is (*raw*). Make sure the data is in a condition ready for validation before entering Q-Guard.

---

## Installation

```bash
 npm i @quanta-lib/q-guard
```

---

## Quick Start

```typescript
import { qguard_setup, ds } from 'q-guard'

// Setup once, use anywhere
const guard = new Q_GuardEngine(
    // Security layer — must return boolean
    {
        type:    (raw, expect) => typeof raw === expect,
        min:     (raw, expect) => raw.toString().length > expect,
        max:     (raw, expect) => raw.toString().length < expect,
        isEmail: (raw, _) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw),
        noSpace: (raw, _) => !raw.toString().includes(' '),
    },
    // Transformer layer — must return data
    {
        trim:        (_, curr) => curr.toString().trim(),
        toLowerCase: (_, curr) => curr.toString().toLowerCase(),
        toUpperCase: (_, curr) => curr.toString().toUpperCase(),
        replace:     (into, curr) => curr.toString().replaceAll(into[0], into[1]),
        append:      (into, curr) => curr + into,
    }
)

const result = guard.oz(
    { username: 'ammaar', email: 'AMMAAR@GMAIL.COM' },
    [
        // Security schema
        {
            username: { type: ds('string', 'Must be string'), min: ds(3, 'Min 4 chars') },
            email:    { type: ds('string', 'Must be string'), isEmail: ds(null, 'Invalid email') },
        },
        // Transformer schema
        {
            username: { toUpperCase: null, append: '_user' },
            email:    { toLowerCase: null },
        }
    ]
)

console.log(result)
// { isSuccess: true, data: { username: 'AMMAAR_user', email: 'ammaar@gmail.com' } }
```

---

## API

### `new Q_GuardEngine(securityMiddleware, transformerMiddleware)`

Creates a Q-Guard instance with predefined security and transformers.

| Parameter | Type | Description |
|---|---|---|
| `securityMiddleware` | `Record<string, (raw, expect) => boolean>` | Collection of validator functions |
| `transformerMiddleware` | `Record<string, (into, curr) => any>` | Collection of transformer functions |

### `guard.oz(data, [securitySchema, transformerSchema?])`

Runs data through the Q-Guard pipeline.

| Parameter | Type | Description |
|---|---|---|
| `data` | `object` | Raw data to validate |
| `securitySchema` | `object` | Validation rules per field |
| `transformerSchema` | `object` (optional) | Transformation rules per field |

**Return value:**
```typescript
// Success
{ isSuccess: true, data: { ...clean
{ isSuccess: false, issue: [{ loc, onCheck, erData } }

// Failurermsg, layer }] }
```

### `ds(expectedValue, errmsg)`

Helper for defining validation rules.

```typescript
ds('string', 'Must be a string')
ds(8, 'Minimum 8 characters')
ds(null, 'No spaces allowed')
```

---

## Usage Examples

### Register User

```typescript
const result = guard.oz(req.body, [
    {
        username: { type: ds('string', 'Must be string'), min: ds(3, 'Min 4 chars'), noSpace: ds(null, 'No spaces') },
        email:    { type: ds('string', 'Must be string'), isEmail: ds(null, 'Invalid email') },
    },
    {
        username: { trim: null, toLowerCase: null },
        email:    { trim: null, toLowerCase: null },
    }
])

if (!result.isSuccess) {
    return res.status(400).json({ errors: result.issue })
}

await db.users.create(result.data) // data is already clean ✅
```

### Transform Only (without security)

```typescript
const result = guard.oz(
    { title: 'hello world' },
    [
        {}, // empty security = skip
        { title: { trim: null, replace: [' ', '-'], toUpperCase: null } }
    ]
)
// { isSuccess: true, data: { title: 'HELLO-WORLD' } }
```

### Express Middleware

```typescript
const qGuard = (scheme) => (req, res, next) => {
    const check = guard.oz(req.body, scheme)
    if (!check.isSuccess) {
        return res.status(400).json({ success: false, errors: check.issue })
    }
    req.body = check.data
    next()
}

// Usage
app.post('/register', qGuard([securitySchema, transformerSchema]), async (req, res) => {
    await db.users.create(req.body) // req.body is already clean ✅
    res.status(201).json({ success: true })
})
```

---

## Error Response

When validation fails, Q-Guard returns detailed information:

```json
{
  "isSuccess": false,
  "issue": [
    {
      "loc": "username",
      "onCheck": "min",
      "errmsg": "Min 4 chars",
      "layer": "security_check"
    }
  ]
}
```

| Field | Description |
|---|---|
| `loc` | Which field failed |
| `onCheck` | Which check failed |
| `errmsg` | The error message you defined |
| `layer` | Which layer the failure occurred in |

---
