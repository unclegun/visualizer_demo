using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace visualizer_demo.TagHelpers;

[HtmlTargetElement("form-group", Attributes = "asp-for")]
public class FormGroupTagHelper : TagHelper
{
    private readonly IHtmlGenerator _generator;

    public FormGroupTagHelper(IHtmlGenerator generator)
    {
        _generator = generator;
    }

    [HtmlAttributeName("asp-for")]
    public ModelExpression AspFor { get; set; } = default!;

    [HtmlAttributeName("input-type")]
    public string InputType { get; set; } = "text";

    [HtmlAttributeName("label")]
    public string? Label { get; set; }

    [HtmlAttributeName("placeholder")]
    public string? Placeholder { get; set; }

    [HtmlAttributeName("help-text")]
    public string? HelpText { get; set; }

    [HtmlAttributeName("rows")]
    public int Rows { get; set; } = 3;

    [HtmlAttributeName("group-class")]
    public string GroupClass { get; set; } = "mb-3";

    [ViewContext]
    [HtmlAttributeNotBound]
    public ViewContext ViewContext { get; set; } = default!;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("class", GroupClass);

        var labelTag = _generator.GenerateLabel(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            Label,
            new { @class = "form-label" });

        var inputAttributes = new Dictionary<string, object>
        {
            ["class"] = InputType.Equals("textarea", StringComparison.OrdinalIgnoreCase) ? "form-control" : ResolveInputClass(InputType)
        };

        if (!string.IsNullOrWhiteSpace(Placeholder))
        {
            inputAttributes["placeholder"] = Placeholder;
        }

        var inputTag = GenerateInput(inputAttributes);

        var validationTag = _generator.GenerateValidationMessage(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            message: null,
            tag: null,
            htmlAttributes: new { @class = "text-danger" });

        output.Content.AppendHtml(labelTag);
        output.Content.AppendHtml(inputTag);

        if (!string.IsNullOrWhiteSpace(HelpText))
        {
            output.Content.AppendHtml($"<div class=\"form-text\">{HtmlEncoder.Default.Encode(HelpText)}</div>");
        }

        output.Content.AppendHtml(validationTag);
    }

    private TagBuilder GenerateInput(IDictionary<string, object> inputAttributes)
    {
        if (InputType.Equals("textarea", StringComparison.OrdinalIgnoreCase))
        {
            inputAttributes["rows"] = Rows;
            return _generator.GenerateTextArea(
                ViewContext,
                AspFor.ModelExplorer,
                AspFor.Name,
                rows: Rows,
                columns: 0,
                htmlAttributes: inputAttributes);
        }

            inputAttributes["type"] = InputType;

        return _generator.GenerateTextBox(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            AspFor.Model,
            format: null,
            htmlAttributes: inputAttributes);
    }

    private static string ResolveInputClass(string inputType)
    {
        return inputType.Equals("checkbox", StringComparison.OrdinalIgnoreCase)
            ? "form-check-input"
            : "form-control";
    }
}

[HtmlTargetElement("select-group", Attributes = "asp-for,items")]
public class SelectGroupTagHelper : TagHelper
{
    private readonly IHtmlGenerator _generator;

    public SelectGroupTagHelper(IHtmlGenerator generator)
    {
        _generator = generator;
    }

    [HtmlAttributeName("asp-for")]
    public ModelExpression AspFor { get; set; } = default!;

    [HtmlAttributeName("items")]
    public IEnumerable<SelectListItem> Items { get; set; } = Array.Empty<SelectListItem>();

    [HtmlAttributeName("label")]
    public string? Label { get; set; }

    [HtmlAttributeName("placeholder")]
    public string? Placeholder { get; set; }

    [HtmlAttributeName("group-class")]
    public string GroupClass { get; set; } = "mb-3";

    [ViewContext]
    [HtmlAttributeNotBound]
    public ViewContext ViewContext { get; set; } = default!;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("class", GroupClass);

        var labelTag = _generator.GenerateLabel(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            Label,
            new { @class = "form-label" });

        var selectTag = _generator.GenerateSelect(
            ViewContext,
            AspFor.ModelExplorer,
            optionLabel: Placeholder,
            expression: AspFor.Name,
            selectList: Items,
            allowMultiple: false,
            htmlAttributes: new { @class = "form-select" });

        var validationTag = _generator.GenerateValidationMessage(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            message: null,
            tag: null,
            htmlAttributes: new { @class = "text-danger" });

        output.Content.AppendHtml(labelTag);
        output.Content.AppendHtml(selectTag);
        output.Content.AppendHtml(validationTag);
    }
}

[HtmlTargetElement("checkbox-group", Attributes = "asp-for")]
public class CheckboxGroupTagHelper : TagHelper
{
    private readonly IHtmlGenerator _generator;

    public CheckboxGroupTagHelper(IHtmlGenerator generator)
    {
        _generator = generator;
    }

    [HtmlAttributeName("asp-for")]
    public ModelExpression AspFor { get; set; } = default!;

    [HtmlAttributeName("label")]
    public string? Label { get; set; }

    [HtmlAttributeName("group-class")]
    public string GroupClass { get; set; } = "mb-3 form-check";

    [ViewContext]
    [HtmlAttributeNotBound]
    public ViewContext ViewContext { get; set; } = default!;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("class", GroupClass);

        var checkboxTag = _generator.GenerateCheckBox(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            isChecked: (bool?)AspFor.Model,
            htmlAttributes: new { @class = "form-check-input" });

        var labelTag = _generator.GenerateLabel(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            Label,
            new { @class = "form-check-label" });

        var validationTag = _generator.GenerateValidationMessage(
            ViewContext,
            AspFor.ModelExplorer,
            AspFor.Name,
            message: null,
            tag: null,
            htmlAttributes: new { @class = "text-danger d-block" });

        output.Content.AppendHtml(checkboxTag);
        output.Content.AppendHtml(labelTag);
        output.Content.AppendHtml(validationTag);
    }
}

[HtmlTargetElement("checkbox-list-group", Attributes = "group-id,title,name,items")]
public class CheckboxListGroupTagHelper : TagHelper
{
    [HtmlAttributeName("group-id")]
    public string GroupId { get; set; } = string.Empty;

    [HtmlAttributeName("title")]
    public string Title { get; set; } = string.Empty;

    [HtmlAttributeName("collapse-id")]
    public string CollapseId { get; set; } = string.Empty;

    [HtmlAttributeName("accordion-parent")]
    public string AccordionParent { get; set; } = "agentAccordion";

    [HtmlAttributeName("name")]
    public string Name { get; set; } = "SelectedAgentIds";

    [HtmlAttributeName("items")]
    public IEnumerable<CheckboxOptionItem> Items { get; set; } = Array.Empty<CheckboxOptionItem>();

    [HtmlAttributeName("expanded")]
    public bool Expanded { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("class", "accordion-item");

        var collapseId = string.IsNullOrWhiteSpace(CollapseId) ? $"{GroupId}Collapse" : CollapseId;
        var collapsedClass = Expanded ? string.Empty : " collapsed";
        var showClass = Expanded ? " show" : string.Empty;

        var builder = new StringBuilder();
        builder.Append("<h2 class=\"accordion-header\">");
        builder.Append($"<button class=\"accordion-button{collapsedClass}\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#{HtmlEncoder.Default.Encode(collapseId)}\">");
        builder.Append(HtmlEncoder.Default.Encode(Title));
        builder.Append("</button>");
        builder.Append("</h2>");

        builder.Append($"<div id=\"{HtmlEncoder.Default.Encode(collapseId)}\" class=\"accordion-collapse collapse{showClass}\" data-bs-parent=\"#{HtmlEncoder.Default.Encode(AccordionParent)}\">");
        builder.Append("<div class=\"accordion-body\">");
        builder.Append("<div class=\"btn-group mb-3\" role=\"group\">");
        builder.Append($"<button type=\"button\" class=\"btn btn-sm btn-success\" onclick=\"selectAllInGroup('{HtmlEncoder.Default.Encode(GroupId)}')\">Select All</button>");
        builder.Append($"<button type=\"button\" class=\"btn btn-sm btn-warning\" onclick=\"clearAllInGroup('{HtmlEncoder.Default.Encode(GroupId)}')\">Clear All</button>");
        builder.Append("</div>");

        builder.Append($"<div class=\"agent-group\" id=\"{HtmlEncoder.Default.Encode(GroupId)}\">");

        var hasItems = false;
        foreach (var item in Items)
        {
            hasItems = true;
            var checkedAttribute = item.Selected ? " checked" : string.Empty;
            builder.Append("<div class=\"form-check\">");
            builder.Append($"<input type=\"checkbox\" class=\"form-check-input agent-checkbox\" name=\"{HtmlEncoder.Default.Encode(Name)}\" value=\"{HtmlEncoder.Default.Encode(item.Value)}\" id=\"{HtmlEncoder.Default.Encode(item.Id)}\"{checkedAttribute} />");
            builder.Append($"<label class=\"form-check-label\" for=\"{HtmlEncoder.Default.Encode(item.Id)}\"><strong>{HtmlEncoder.Default.Encode(item.Label)}</strong> - {HtmlEncoder.Default.Encode(item.Description)}</label>");
            builder.Append("</div>");
        }

        if (!hasItems)
        {
            builder.Append("<p class=\"text-muted\">No options available</p>");
        }

        builder.Append("</div>");
        builder.Append("</div>");
        builder.Append("</div>");

        output.Content.SetHtmlContent(builder.ToString());
    }
}

[HtmlTargetElement("validation-summary-alert")]
public class ValidationSummaryAlertTagHelper : TagHelper
{
    [HtmlAttributeName("title")]
    public string Title { get; set; } = "Please fix the following errors:";

    [HtmlAttributeName("model-only")]
    public bool ModelOnly { get; set; }

    [ViewContext]
    [HtmlAttributeNotBound]
    public ViewContext ViewContext { get; set; } = default!;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        var errors = new List<ModelError>();

        foreach (var kvp in ViewContext.ViewData.ModelState)
        {
            if (ModelOnly && !string.IsNullOrWhiteSpace(kvp.Key))
            {
                continue;
            }

            errors.AddRange(kvp.Value.Errors);
        }

        if (errors.Count == 0)
        {
            output.SuppressOutput();
            return;
        }

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("class", "alert alert-danger");
        output.Attributes.SetAttribute("role", "alert");

        var builder = new StringBuilder();
        builder.Append($"<strong>{HtmlEncoder.Default.Encode(Title)}</strong>");
        builder.Append("<ul class=\"mb-0 mt-2\">");

        foreach (var error in errors)
        {
            if (string.IsNullOrWhiteSpace(error.ErrorMessage))
            {
                continue;
            }

            builder.Append($"<li>{HtmlEncoder.Default.Encode(error.ErrorMessage)}</li>");
        }

        builder.Append("</ul>");
        output.Content.SetHtmlContent(builder.ToString());
    }
}

public record CheckboxOptionItem(string Id, string Value, string Label, string Description, bool Selected = false);
