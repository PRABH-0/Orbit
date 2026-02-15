namespace Orbit_BE.Interfaces
{
    public interface IGoogleDriveService
    {
        Task<List<object>> GetFilesAsync(string accessToken);
    }

}
