using Microsoft.Extensions.Caching.Memory;
using Orbit_BE.Entities;
using Orbit_BE.Interfaces;
using Orbit_BE.Models.File;
using Orbit_BE.Models.Files;
using Orbit_BE.UnitOfWork;

namespace Orbit_BE.Services
{
    public class FileService : IFileService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _fileStorage;
        private readonly IMemoryCache _cache;

        public FileService(
        IUnitOfWork unitOfWork,
        IMemoryCache cache,
        IFileStorageService fileStorage)
        {
            _unitOfWork = unitOfWork;
            _cache = cache;
            _fileStorage = fileStorage;
        }


        public async Task<FileResponseDto> UploadAsync(Guid userId, UploadFileRequestDto request)
        {
            if (request.File == null || request.File.Length == 0)
                throw new ArgumentException("File is required");

            var node = await _unitOfWork.Nodes
                .FirstOrDefaultAsync(n =>
                    n.Id == request.NodeId &&
                    n.UserId == userId &&
                    n.RecordState == "Active");

            if (node == null)
                throw new UnauthorizedAccessException("Invalid node");

            string storagePath;
            using (var stream = request.File.OpenReadStream())
            {
                storagePath = await _fileStorage.UploadAsync(
                    stream,
                    request.File.FileName,
                    request.File.ContentType,
                    userId,
                    node.Id
                );
            }

            var nodeFile = new NodeFile
            {
                Id = Guid.NewGuid(),
                NodeId = node.Id,
                FileName = request.File.FileName,
                FileType = request.File.ContentType,
                FileSize = request.File.Length,
                StoragePath = storagePath,
                RecordState = "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.NodeFiles.AddAsync(nodeFile);
            await _unitOfWork.SaveChangesAsync();

            return new FileResponseDto
            {
                Id = nodeFile.Id,
                NodeId = node.Id,
                FileName = nodeFile.FileName,
                ContentType = nodeFile.FileType,
                FileSize = nodeFile.FileSize,
                CreatedAt = nodeFile.CreatedAt
            };
        }
        public async Task<IEnumerable<FileResponseDto>> GetFilesByNodeAsync(Guid userId, Guid nodeId)
        {
            var node = await _unitOfWork.Nodes
                .FirstOrDefaultAsync(n =>
                    n.Id == nodeId &&
                    n.UserId == userId &&
                    n.RecordState == "Active");

            if (node == null)
                throw new UnauthorizedAccessException("Invalid node");

            var allFiles = await _unitOfWork.NodeFiles.GetAllAsync();

            var files = allFiles
                .Where(f =>
                    f.NodeId == nodeId &&
                    f.RecordState == "Active");

            return files.Select(f => new FileResponseDto
            {
                Id = f.Id,
                NodeId = f.NodeId,
                FileName = f.FileName,
                ContentType = f.FileType,
                FileSize = f.FileSize,
                CreatedAt = f.CreatedAt
            });
        }

        public async Task<FileDownloadResult> DownloadAsync(Guid userId, Guid fileId)
        {
            var cacheKey = $"file:{fileId}";

            if (_cache.TryGetValue(cacheKey,
                out (byte[] FileBytes, string FileName, string ContentType) cachedFile))
            {
                return new FileDownloadResult(
                    cachedFile.FileBytes,
                    cachedFile.FileName,
                    cachedFile.ContentType,
                    true
                );
            }

            var file = await _unitOfWork.NodeFiles.GetByIdAsync(fileId);
            if (file == null)
                throw new UnauthorizedAccessException();

            var (bytes, contentType) =
                await _fileStorage.DownloadAsync(file.StoragePath);

            var result = (bytes, file.FileName, contentType);

            _cache.Set(cacheKey, result,
                new MemoryCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromMinutes(10),
                    Size = bytes.Length
                });

            return new FileDownloadResult(
                bytes,
                file.FileName,
                contentType,
                false
            );
        }

        public async Task<FileDownloadResult> ViewAsync(Guid fileId)
        {
            var file = await _unitOfWork.NodeFiles.GetByIdAsync(fileId);
            if (file == null)
                throw new FileNotFoundException();

            var (bytes, contentType) =
                await _fileStorage.DownloadAsync(file.StoragePath);

            return new FileDownloadResult(
                bytes,
                file.FileName,
                contentType,
                false
            );
        }

        public async Task DeleteAsync(Guid userId, Guid fileId)
        {
            var cacheKey = $"file:{fileId}";

            var file = await _unitOfWork.NodeFiles.GetByIdAsync(fileId);
            if (file == null)
                throw new UnauthorizedAccessException();

            // delete physical file
            await _fileStorage.DeleteAsync(file.StoragePath);

            // delete DB record
            _unitOfWork.NodeFiles.Delete(file);
            await _unitOfWork.SaveChangesAsync();

            // clear cache
            _cache.Remove(cacheKey);
        }

    }
}
