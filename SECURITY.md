# SECURITY.md - MealMind AI Security Architecture

This document outlines the multi-layered security measures implemented in **MealMind AI** during the Final Hardening Pass to prevent injection attacks, assure strict input sanitization, and safely manage API traffic without exposing internal error details.

---

## 1. Before vs. After Security Hardening Comparison

The transition from default block-list regex to a robust **Character Allow-List Validation and Input Normalization** framework has greatly minimized the application's attack surface.

| Threat / Risk Vector | BEFORE (Default State) | AFTER (Hardened Pass) | Explanation & Resolution |
| :--- | :--- | :--- | :--- |
| **XSS & Script Injection** | Custom block-list regex (`replace(/[;\"'\(\){}\[\]]/g, '')`) which can be bypassed via alternative unicode characters or script structures. | **Strict Allow-List Filtering** `/^[a-zA-Z0-9\s,\.\-\'()]$/` with a manual character-by-character validation loop. | Every character in the input string is matched against an explicit list of safe culinary characters. Unapproved tokens are stripped. |
| **Malformed Payload Flood** | Unlimited ingredient input length sent to the LLM process, running risk of resource exhaust. | **Payload Size Truncation** inputs are truncated to `2000` characters; limited to max 30 distinct items. | Mitigates buffer exhausts, excessive LLM tokens processing costs, and malformed JSON payloads. |
| **Verbose Exception Leaks** | Raw internal stack traces returned on API error: `res.status(500).json({ error: apiError.message })`. | **Generic Shielded API Errors**: returns a friendly, standard public-safe message. | Restricts internal workspace structures, API paths, and library names from malicious scanners. |
| **Startup Crash on Missing Key** | API Client instantiated at module load-time causing container start-failure if keys are missing. | **Lazy Initialization with Safe Validation** on inaugural API call. | Guarantees standard, graceful container service up-time even during configuration shifts. |

---

## 2. Input Sanitization & Allow-List Strategy

The application adopts an **Allow-List Policy** for string parameters. The rules are implemented inside `/src/utils/validation.ts`:

1. **HTML Element Elimination**: Any `<[^>]*>` tag matches are immediately deleted.
2. **Character Filtering**: Only characters explicitly present in the allow-list are preserved:
   - Letters: `A-Z`, `a-z`
   - Numbers: `0-9`
   - Natural Marks: Space ` `, comma `,`, hyphen `-`, period `.`, single-quote `'`, open-parenthesis `(`, close-parenthesis `)`
   - All other characters (e.g. `<`, `>`, `;`, `"`, `{`, `}`, `[`, `]`, `\`, `/`) are stripped out.
3. **Spacing Normalization**: Multiple consecutive space sequences are replaced by a single space, and the string is trimmed.
4. **Deduplication**: Duplicate items and redundant words inside individual elements (e.g., `"tomato tomato"`) are merged out during sanitization to optimize prompt tokens and prevent repetitive payload injection.

---

## 3. Server-Side Integration & Shielding

To defend the server environment and ensure robust container execution:

- **No Public Variables**: Secrets like `GEMINI_API_KEY` are kept on the server.
- **Generic Service Responses**:
  - Out of bounds validation errors yield clear, user-friendly forms check validations.
  - Server errors (e.g. API connectivity faults, credential misconfigurations) do *not* output raw error details. The client receives a generic public-safe explanation:
    `"We encountered a problem generating your custom meal plan. Please check your inputs and try again downstream."`
  - Stack traces and original error objects are safely printed strictly inside the server container console using `console.error` for secure diagnostics.

---

## 4. API Integrity Verification

Continuous automated security checks are conducted inside our real-time QA sandbox suite (`/src/utils/tests.ts`). The system asserts that malicious HTML/JS insertions are sanitized and that API failure bounds successfully shield internal system details from client queries.
