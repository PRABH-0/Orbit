namespace Orbit_BE.Models.File
{
    public record FileDownloadResult(
    byte[] FileBytes,
    string FileName,
    string ContentType,
    bool FromCache
);

}
