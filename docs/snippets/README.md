# Comment Block Snippets Guide

This folder contains reusable Visual Studio snippet files for documenting intentional deviations from template styles and conventions.

## Included Snippets

- `style-deviation-css.snippet`
  - Shortcut: `devcss`
  - Use for CSS/theme/layout deviations.
- `style-deviation-js.snippet`
  - Shortcut: `devjs`
  - Use for JavaScript behavior or interaction deviations.
- `style-deviation-html.snippet`
  - Shortcut: `devhtml`
  - Use for HTML/Razor markup structure deviations.
- `style-deviation-csharp.snippet`
  - Shortcut: `devcs`
  - Use for C# style or convention deviations.

## When To Use These Comment Blocks

Add a deviation comment block when:

1. You intentionally diverge from the shared template design tokens, spacing, component structure, or behavior.
2. The change may not be obvious to future maintainers.
3. The change should be revisited when base template styles/conventions evolve.

Do not add them for routine implementation details that already follow current standards.

## Quick Examples

### CSS (`devcss`)

```css
/*
 * TEMPLATE STYLE DEVIATION
 * Area: .dashboard-card--compact
 * Reason: Product requirement needs denser card spacing for KPI wall.
 * Owner: UI Team
 * Date: 2026-03-10
 * Revisit: When template tokens/layout are updated.
 */
```

### JavaScript (`devjs`)

```javascript
/*
 * TEMPLATE DEVIATION
 * Scope: palette picker keyboard navigation
 * Reason: Needed for project-specific interaction model
 * Tracking: VIS-123
 * Guardrail: Keep API shape and accessibility behavior consistent.
 */
```

### HTML/Razor (`devhtml`)

```html
<!--
  TEMPLATE STRUCTURE DEVIATION
  Section: examples-section
  Reason: Supports content grouping not covered by base template
  Constraint: Preserve semantic headings and keyboard navigation.
-->
```

### C# (`devcs`)

```csharp
// TEMPLATE CONVENTION DEVIATION
// Area: IndexModel
// Reason: Matches external contract requirements
// Follow-up: Re-evaluate when shared conventions are revised.
```

## Importing Snippets Into Visual Studio

These `.snippet` files are for Visual Studio's Code Snippet Manager.

1. Open Visual Studio.
2. Go to `Tools` -> `Code Snippets Manager`.
3. Choose language scope (`C#`, `HTML`, etc.) if prompted.
4. Click `Import...`.
5. Select one or more files from `docs/snippets/`.
6. Confirm import.
7. In editor, type shortcut (`devcss`, `devjs`, `devhtml`, `devcs`) and press `Tab` twice.

## Creating New Snippets

### Option A: Duplicate an Existing Snippet (Recommended)

1. Copy one of the existing `.snippet` files.
2. Rename it, for example: `style-deviation-sql.snippet`.
3. Update XML fields:
   - `<Title>`
   - `<Shortcut>`
   - `<Description>`
   - `<Code Language="...">`
4. Add or update placeholders in `<Declarations>` and `$Placeholder$` usage in `<Code>`.
5. Import via Code Snippets Manager.
6. Test expansion in an editor file for that language.

### Option B: Build From Scratch

Use this skeleton:

```xml
<?xml version="1.0" encoding="utf-8"?>
<CodeSnippets xmlns="http://schemas.microsoft.com/VisualStudio/2005/CodeSnippet">
  <CodeSnippet Format="1.0.0">
    <Header>
      <Title>My Snippet</Title>
      <Shortcut>mysnip</Shortcut>
      <Description>What this snippet inserts</Description>
      <Author>visualizer_demo</Author>
      <SnippetTypes>
        <SnippetType>Expansion</SnippetType>
      </SnippetTypes>
    </Header>
    <Snippet>
      <Declarations>
        <Literal>
          <ID>Reason</ID>
          <Default>Explain deviation reason</Default>
        </Literal>
      </Declarations>
      <Code Language="csharp"><![CDATA[
// TEMPLATE DEVIATION
// Reason: $Reason$
]]></Code>
    </Snippet>
  </CodeSnippet>
</CodeSnippets>
```

## Suggested Team Conventions

1. Always fill `Reason` with specific context, not generic text.
2. Include tracking ID where possible.
3. Keep one deviation block per meaningful divergence (avoid noisy duplicates).
4. Revisit blocks during style-system/template upgrades.

## VS Code Note

VS Code uses JSON user/workspace snippets, not `.snippet` XML directly. If your team primarily uses VS Code, keep these XML files as canonical templates and mirror shortcuts in `.vscode/*.code-snippets` as needed.
