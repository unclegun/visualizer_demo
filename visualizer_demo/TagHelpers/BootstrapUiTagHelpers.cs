using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace visualizer_demo.TagHelpers;

[HtmlTargetElement("bs-alert")]
public class BootstrapAlertTagHelper : TagHelper
{
    [HtmlAttributeName("type")]
    public string Type { get; set; } = "info";

    [HtmlAttributeName("title")]
    public string? Title { get; set; }

    [HtmlAttributeName("icon")]
    public string? Icon { get; set; }

    [HtmlAttributeName("dismissible")]
    public bool Dismissible { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var content = await output.GetChildContentAsync();
        var message = content.GetContent();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;

        var classes = new StringBuilder($"alert alert-{Type}");
        if (Dismissible)
        {
            classes.Append(" alert-dismissible fade show");
        }

        output.Attributes.SetAttribute("class", classes.ToString());
        output.Attributes.SetAttribute("role", "alert");

        var iconHtml = string.IsNullOrWhiteSpace(Icon)
            ? string.Empty
            : $"<i class=\"{HtmlEncoder.Default.Encode(Icon)} me-2\"></i>";

        var titleHtml = string.IsNullOrWhiteSpace(Title)
            ? string.Empty
            : $"<strong>{HtmlEncoder.Default.Encode(Title)}</strong> ";

        output.Content.SetHtmlContent($"{iconHtml}{titleHtml}{message}");

        if (Dismissible)
        {
            output.Content.AppendHtml("<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>");
        }
    }
}

[HtmlTargetElement("bs-card")]
public class BootstrapCardTagHelper : TagHelper
{
    [HtmlAttributeName("header")]
    public string? Header { get; set; }

    [HtmlAttributeName("header-icon")]
    public string? HeaderIcon { get; set; }

    [HtmlAttributeName("subheader")]
    public string? Subheader { get; set; }

    [HtmlAttributeName("footer")]
    public string? Footer { get; set; }

    [HtmlAttributeName("card-class")]
    public string? CardClass { get; set; }

    [HtmlAttributeName("body-class")]
    public string? BodyClass { get; set; }

    public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var content = await output.GetChildContentAsync();

        output.TagName = "div";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("class", string.IsNullOrWhiteSpace(CardClass) ? "card" : $"card {CardClass}");

        var html = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(Header) || !string.IsNullOrWhiteSpace(Subheader))
        {
            html.Append("<div class=\"card-header\">");

            if (!string.IsNullOrWhiteSpace(Header))
            {
                if (!string.IsNullOrWhiteSpace(HeaderIcon))
                {
                    html.Append($"<i class=\"{HtmlEncoder.Default.Encode(HeaderIcon)} me-2\"></i>");
                }

                html.Append($"<strong>{HtmlEncoder.Default.Encode(Header)}</strong>");
            }

            if (!string.IsNullOrWhiteSpace(Subheader))
            {
                html.Append($"<div class=\"small text-muted mt-1\">{HtmlEncoder.Default.Encode(Subheader)}</div>");
            }

            html.Append("</div>");
        }

        html.Append($"<div class=\"{(string.IsNullOrWhiteSpace(BodyClass) ? "card-body" : HtmlEncoder.Default.Encode(BodyClass))}\">");
        html.Append(content.GetContent());
        html.Append("</div>");

        if (!string.IsNullOrWhiteSpace(Footer))
        {
            html.Append($"<div class=\"card-footer text-muted\">{HtmlEncoder.Default.Encode(Footer)}</div>");
        }

        output.Content.SetHtmlContent(html.ToString());
    }
}
