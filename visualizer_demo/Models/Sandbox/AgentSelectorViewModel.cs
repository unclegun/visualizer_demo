namespace visualizer_demo.Models.Sandbox
{
    public class AgentSelectorViewModel
    {
        public List<Virus> Viruses { get; set; } = new();
        public List<Toxin> Toxins { get; set; } = new();
        public List<Bacteria> Bacteria { get; set; } = new();
        public AgentSelectorFormModel FormModel { get; set; } = new();

        public static AgentSelectorViewModel GetSampleData()
        {
            return new AgentSelectorViewModel
            {
                Viruses = new List<Virus>
                {
                    new Virus { Id = 1, Name = "Influenza", Description = "Seasonal flu virus" },
                    new Virus { Id = 2, Name = "COVID-19", Description = "SARS-CoV-2 coronavirus" },
                    new Virus { Id = 3, Name = "Measles", Description = "Highly contagious viral disease" },
                    new Virus { Id = 4, Name = "Ebola", Description = "Rare but severe viral hemorrhagic fever" },
                    new Virus { Id = 5, Name = "Polio", Description = "Infectious disease affecting the nervous system" }
                },
                Toxins = new List<Toxin>
                {
                    new Toxin { Id = 11, Name = "Ricin", Description = "Protein toxin from castor beans" },
                    new Toxin { Id = 12, Name = "Botulinum", Description = "Neurotoxin produced by Clostridium botulinum" },
                    new Toxin { Id = 13, Name = "Dioxin", Description = "Industrial pollutant and persistent organic pollutant" },
                    new Toxin { Id = 14, Name = "Mycotoxin", Description = "Toxic compound produced by fungi" },
                    new Toxin { Id = 15, Name = "Staphylococcal Enterotoxin", Description = "Toxin affecting the gastrointestinal system" }
                },
                Bacteria = new List<Bacteria>
                {
                    new Bacteria { Id = 21, Name = "E. coli", Description = "Common gram-negative bacterium" },
                    new Bacteria { Id = 22, Name = "Salmonella", Description = "Causes foodborne illness" },
                    new Bacteria { Id = 23, Name = "Streptococcus pyogenes", Description = "Group A streptococcus, causes strep throat" },
                    new Bacteria { Id = 24, Name = "Mycobacterium tuberculosis", Description = "Causative agent of tuberculosis" },
                    new Bacteria { Id = 25, Name = "Vibrio cholerae", Description = "Causes cholera disease" }
                }
            };
        }
    }
}
