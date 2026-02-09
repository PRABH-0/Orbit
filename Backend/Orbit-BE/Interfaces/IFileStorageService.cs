namespace Orbit_BE.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> UploadAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            Guid userId,
            Guid nodeId
        );

        Task<(byte[] FileBytes, string ContentType)> DownloadAsync(string storagePath);
        (FileStream Stream, string ContentType) OpenStream(string storagePath);


        Task DeleteAsync(string storagePath);
    }

}
