namespace Orbit_BE.Interfaces
{
    public interface IGoogleDriveService
    {
        Task<List<object>> GetFilesAsync(string accessToken);
        Task<(Stream Stream, string ContentType)> GetFileStreamAsync(string accessToken, string fileId);
    }

}
