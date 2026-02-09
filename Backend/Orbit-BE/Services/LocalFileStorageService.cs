using Orbit_BE.Interfaces;

namespace Orbit_BE.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;

        public LocalFileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        // =========================
        // UPLOAD
        // =========================
        public async Task<string> UploadAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            Guid userId,
            Guid nodeId)
        {
            var rootPath = Path.Combine(
                _env.WebRootPath ?? "wwwroot",
                "orbit-storage",
                userId.ToString(),
                nodeId.ToString()
            );

            if (!Directory.Exists(rootPath))
                Directory.CreateDirectory(rootPath);

            var filePath = Path.Combine(rootPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(stream);
            }

            // Return relative path (DB-friendly, Azure-friendly)
            return Path.Combine(
                "orbit-storage",
                userId.ToString(),
                nodeId.ToString(),
                fileName
            ).Replace("\\", "/");
        }

        // =========================
        // DOWNLOAD
        // =========================
        public async Task<(byte[] FileBytes, string ContentType)> DownloadAsync(string storagePath)
        {
            var fullPath = Path.Combine(
                _env.WebRootPath ?? "wwwroot",
                storagePath
            );

            if (!File.Exists(fullPath))
                throw new FileNotFoundException("File not found");

            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            var contentType = GetContentType(fullPath);

            return (fileBytes, contentType);
        }

        // =========================
        // DELETE
        // =========================
        public Task DeleteAsync(string storagePath)
        {
            var fullPath = Path.Combine(
                _env.WebRootPath ?? "wwwroot",
                storagePath
            );

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.CompletedTask;
        }

        public (FileStream Stream, string ContentType) OpenStream(string storagePath)
        {
            var fullPath = Path.Combine(
                _env.WebRootPath ?? "wwwroot",
                storagePath
            );

            if (!File.Exists(fullPath))
                throw new FileNotFoundException("File not found");

            var contentType = GetContentType(fullPath);

            var stream = new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read
            );

            return (stream, contentType);
        }

        private static string GetContentType(string path)
        {
            var ext = Path.GetExtension(path).ToLowerInvariant();

            return ext switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".pdf" => "application/pdf",
                ".mp3" => "audio/mpeg",
                ".wav" => "audio/wav",
                ".ogg" => "audio/ogg",
                ".mp4" => "video/mp4",
                _ => "application/octet-stream"
            };
        }
    }
}
