namespace visualizer_demo.Models.Sandbox
{
    public class Agent
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class Virus : Agent
    {
    }

    public class Toxin : Agent
    {
    }

    public class Bacteria : Agent
    {
    }
}
