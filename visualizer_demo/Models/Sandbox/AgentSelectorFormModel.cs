using System.ComponentModel.DataAnnotations;

namespace visualizer_demo.Models.Sandbox
{
    public class AgentSelectorFormModel
    {
        [Required(ErrorMessage = "Please select at least one agent")]
        public List<int> SelectedAgentIds { get; set; } = new();

        [Required(ErrorMessage = "Please provide a reason")]
        [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
        [Display(Name = "Reason for Selection")]
        public string? Reason { get; set; }

        public string? Notes { get; set; }
    }
}
