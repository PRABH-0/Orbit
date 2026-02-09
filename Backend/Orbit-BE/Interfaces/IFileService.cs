using Orbit_BE.Models.File;
using Orbit_BE.Models.Files;

public interface IFileService
{
    Task<FileResponseDto> UploadAsync(Guid userId, UploadFileRequestDto request);

    Task<IEnumerable<FileResponseDto>> GetFilesByNodeAsync(Guid userId, Guid nodeId);

    Task<FileDownloadResult> DownloadAsync(Guid userId, Guid fileId);

    Task<FileDownloadResult> ViewAsync(Guid fileId);

    Task DeleteAsync(Guid userId, Guid fileId);
}
