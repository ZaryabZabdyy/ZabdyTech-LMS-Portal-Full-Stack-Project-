namespace ZabdyTech.Dtos
{
    public class AssignProjectDto
    {
        public int InstructorId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime Deadline { get; set; }
        public string ScopeSpecificationText { get; set; } = string.Empty;
        public string DocumentDownloadUrl { get; set; } = string.Empty;
        public string WireframeUrl { get; set; } = string.Empty;

    }
}
