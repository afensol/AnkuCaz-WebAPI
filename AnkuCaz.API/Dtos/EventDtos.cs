namespace AnkuCaz.API.Dtos
{
    public record CreateEventDto(
        string Title,
        string LocationName,
        string LocationAddress,
        DateTime StartDate,
        DateTime EndDate,
        string Description 
    );

    public record UpdateEventDto(
        int Id,
        string Title,
        string LocationName,
        string LocationAddress,
        DateTime StartDate,
        DateTime EndDate,
        string Description 
    );

    public record EventListDto(
        int Id,
        string Title,
        string LocationName,
        string LocationAddress,
        DateTime StartDate,
        DateTime EndDate,
        string Description 
    );

    public record EventDetailDto(
        int Id,
        string Title,
        string LocationName,
        string LocationAddress,
        DateTime StartDate,
        DateTime EndDate,
        string Description 
    );
}
