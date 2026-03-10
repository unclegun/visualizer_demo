# Tag Helper Library Guide

This repository includes a reusable Bootstrap-focused Tag Helper library designed for production forms and repeatable UI composition.

## Location and Organization

Core helper implementations are consolidated into two main files:

- `visualizer_demo/TagHelpers/BootstrapUiTagHelpers.cs`
- `visualizer_demo/TagHelpers/FormTagHelpers.cs`

This keeps helper behavior centralized and easy to maintain.

## Enable the Tag Helpers

The helpers are enabled globally for both MVC Views and Razor Pages:

- `visualizer_demo/Views/_ViewImports.cshtml`
- `visualizer_demo/Pages/_ViewImports.cshtml`

Directive used:

```cshtml
@addTagHelper *, visualizer_demo
```

## Available Tag Helpers

### 1) `bs-alert`
Bootstrap alert block with optional title, icon, and dismiss behavior.

```cshtml
<bs-alert type="success" title="Saved" dismissible="true">
    Changes were saved successfully.
</bs-alert>
```

Attributes:

- `type`: Bootstrap variant (`success`, `danger`, `warning`, `info`, etc.)
- `title`: Optional bold prefix
- `icon`: Optional icon class (only if your layout includes an icon library)
- `dismissible`: `true` adds close button

### 2) `bs-card`
Reusable card shell with optional header/subheader/footer.

```cshtml
<bs-card header="Profile" subheader="Public details" card-class="shadow-sm">
    <p class="mb-0">Card content here.</p>
</bs-card>
```

Attributes:

- `header`, `subheader`, `footer`
- `header-icon`
- `card-class`
- `body-class`

### 3) `form-group`
Label + input + validation in one reusable component.

```cshtml
<form-group asp-for="Email" input-type="email" placeholder="name@company.com" />
<form-group asp-for="Comments" input-type="textarea" rows="4" placeholder="Add notes..." />
```

Attributes:

- `asp-for` (required)
- `input-type` (`text`, `email`, `number`, `date`, `textarea`, etc.)
- `label` (override display text)
- `placeholder`
- `help-text`
- `rows` (for textarea)
- `group-class`

### 4) `select-group`
Label + `<select>` + validation from `SelectListItem` options.

```cshtml
@using Microsoft.AspNetCore.Mvc.Rendering
@{
    var statuses = new List<SelectListItem>
    {
        new() { Value = "new", Text = "New" },
        new() { Value = "active", Text = "Active" },
        new() { Value = "closed", Text = "Closed" }
    };
}

<select-group asp-for="Status" items="statuses" placeholder="-- Select status --" />
```

Attributes:

- `asp-for` (required)
- `items` (required)
- `label`
- `placeholder`
- `group-class`

### 5) `checkbox-group`
Single boolean checkbox with label + validation.

```cshtml
<checkbox-group asp-for="AcceptTerms" label="I agree to the terms" />
```

Attributes:

- `asp-for` (required)
- `label`
- `group-class`

### 6) `checkbox-list-group`
Accordion section with selectable checkbox list and built-in Select All / Clear All controls.

```cshtml
@using visualizer_demo.TagHelpers
@{
    var options = new List<CheckboxOptionItem>
    {
        new("item_1", "1", "Influenza", "Seasonal virus", false),
        new("item_2", "2", "COVID-19", "SARS-CoV-2", true)
    };
}

<checkbox-list-group
    group-id="viruses"
    title="Viruses"
    collapse-id="virusesCollapse"
    accordion-parent="agentAccordion"
    name="SelectedAgentIds"
    items="options"
    expanded="true" />
```

Attributes:

- `group-id` (required)
- `title` (required)
- `name` (required)
- `items` (required `IEnumerable<CheckboxOptionItem>`)
- `collapse-id` (optional)
- `accordion-parent` (optional, default `agentAccordion`)
- `expanded` (optional)

### 7) `validation-summary-alert`
Bootstrap-styled validation summary block.

```cshtml
<validation-summary-alert title="Please correct the errors below." />
```

Attributes:

- `title`
- `model-only`

## Production-Ready Usage Notes

- Keep model validation in DataAnnotations so helper-generated controls get consistent validation output.
- Use shared `SelectListItem` builders for dropdown options to avoid duplicated lists across views.
- Prefer helper-based forms for consistent spacing, labels, and validation behavior.
- Keep custom CSS minimal and rely on Bootstrap classes in helper output for predictable UI behavior.

## Current Example Implementations

Refactored pages currently using the helper library:

- `visualizer_demo/Views/Sandbox/Index.cshtml`
- `visualizer_demo/Views/Sandbox/Forms.cshtml`
- `visualizer_demo/Views/Sandbox/AgentSelector.cshtml`
- `visualizer_demo/Views/Sandbox/Partials.cshtml`
- `visualizer_demo/Views/Sandbox/Components.cshtml`
- `visualizer_demo/Views/Sandbox/AjaxExample.cshtml`
- `visualizer_demo/Views/Shared/_AlertPartial.cshtml`
- `visualizer_demo/Views/Shared/_ExamplePartial.cshtml`
- `visualizer_demo/Views/Shared/Components/Alert/Default.cshtml`
- `visualizer_demo/Views/Shared/Components/PriorityList/Default.cshtml`
