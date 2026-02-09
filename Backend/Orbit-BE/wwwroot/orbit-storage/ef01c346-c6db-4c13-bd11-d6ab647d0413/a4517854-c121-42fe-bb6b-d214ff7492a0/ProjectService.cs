using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Snera_Core.Common;
using Snera_Core.Entities.ChatEntities;
using Snera_Core.Entities.ProjectEntities;
using Snera_Core.Interface;
using Snera_Core.Models.HelperModels;
using Snera_Core.Models.UserProjectModels;
using Snera_Core.UnitOfWork;
using System.Globalization;

namespace Snera_Core.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ProjectService(IUnitOfWork unitOfWork, IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            return userId;
        }

        public async Task<List<ProjectTaskResponseModel>> GetAllCurrentTasks(Guid projectId)
        {
            var tasks = await _unitOfWork.ProjectCurrentTasks
                .GetQueryable()
                .Include(t => t.User)
                .Where(t => t.Project_Id == projectId)
                .ToListAsync();

            return tasks
                .OrderByDescending(t => t.Created_At)
                .Select(t => new ProjectTaskResponseModel
                {
                    Id = t.Id,
                    Task_Name = t.Task_Name,
                    Task_End_Date = t.Task_End_Date,
                    Is_Completed = t.Is_Completed,
                    Is_Trashed = t.Is_Trashed,
                    User_Id = t.User_Id,
                    User_Name = t.User?.FullName ?? "Unknown",
                    Project_Id = t.Project_Id,
                    Created_At = t.Created_At
                })
                .ToList();
        }

        public async Task<ProjectResponseModel> GetProject(Guid projectId)
        {
            var userId = GetCurrentUserId();
            var member = await _unitOfWork.ProjectTeamMembers
                .FirstOrDefaultAsync(t => t.Project_Id == projectId && t.User_Id == userId);

            bool isEditable = member?.Is_Admin == true;
            bool displayJoinTeamButton = member == null;

            var project = await _unitOfWork.UserProject
                .GetQueryable()
                .Include(p => p.ProjectDescription)
                .Include(p => p.ProjectTeamMembers)
                .Include(p => p.ProjectCurrentTasks)
                .Include(p => p.ProjectTimelines)
                .Include(p => p.ProjectSkills)
                .Include(p => p.ResourseLinks)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return null;

            var devRequests = await _unitOfWork.ProjectDeveloperRequest
                .GetQueryable()
                .Include(r => r.User)
                .Include(r => r.ProjectDeveloperRequestSkill)
                .Where(r => r.Project_Id == projectId)
                .ToListAsync();

            var description = project.ProjectDescription?.OrderByDescending(d => d.Created_At).FirstOrDefault();

            var response = new ProjectResponseModel
            {
                IsEditable = isEditable,
                DisplayJoinTeamButton = displayJoinTeamButton,
                Project = _mapper.Map<ProjectDto>(project),
                ProjectDescription = description == null ? null : _mapper.Map<ProjectDescriptionDto>(description),
                TeamMembers = _mapper.Map<List<TeamMemberDto>>(project.ProjectTeamMembers),
                CurrentTasks = _mapper.Map<List<TaskDto>>(project.ProjectCurrentTasks),
                Timelines = _mapper.Map<List<TimelineDto>>(project.ProjectTimelines),
                DeveloperRequests = _mapper.Map<List<DeveloperRequestDto>>(devRequests),
                ResourceLinks = _mapper.Map<List<ResourceLinkDto>>(project.ResourseLinks),
                SkillsHave = project.ProjectSkills
                    .Where(s => s.Skill_Type == "Have")
                    .Select(s => s.Skill_Name)
                    .ToList(),
                SkillsNeed = project.ProjectSkills
                    .Where(s => s.Skill_Type == "Need")
                    .Select(s => s.Skill_Name)
                    .ToList()
            };

            return response;
        }

        public async Task<CommonResponse> SendDeveloperRequest(JoinTeamRequestModel request)
        {
            var currentUserId = GetCurrentUserId();
            request.User_Id = currentUserId;

            var existing = await _unitOfWork.ProjectTeamMembers
                .FirstOrDefaultAsync(t =>
                    t.Project_Id == request.Project_Id &&
                    t.User_Id == request.User_Id &&
                    t.Record_State == "Active");

            if (existing != null)
            {
                return new CommonResponse(false, "You are already a member of this project.");
            }

            var existingRequest = await _unitOfWork.ProjectDeveloperRequest
                .FirstOrDefaultAsync(r =>
                    r.Project_Id == request.Project_Id &&
                    r.User_Id == request.User_Id &&
                    r.Record_State != "Rejected");

            if (existingRequest != null)
            {
                return new CommonResponse(false, "You have already sent a request for this project.");
            }

            var newRequest = new ProjectDeveloperRequest
            {
                Id = Guid.NewGuid(),
                User_Id = request.User_Id,
                Project_Id = request.Project_Id,
                Project_Interested_Text = request.InterestText,
                Project_Experience_Text = request.ExperienceText,
                Active_Hour = request.ActiveHour,
                Created_At = DateTime.UtcNow,
                Record_State = "Pending"
            };

            await _unitOfWork.ProjectDeveloperRequest.AddAsync(newRequest);
            await _unitOfWork.SaveAllAsync();

            if (request.Skills != null && request.Skills.Any())
            {
                var skillEntities = request.Skills
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Select(rawSkill => new ProjectDeveloperRequestSkill
                    {
                        Id = Guid.NewGuid(),
                        DeveloperRequest_Id = newRequest.Id,
                        Skill_Name = rawSkill.Trim()
                    })
                    .ToList();

                await _unitOfWork.ProjectDeveloperRequestSkill.AddRangeAsync(skillEntities);
                await _unitOfWork.SaveAllAsync();
            }

            return new CommonResponse(true, "Developer request sent successfully.");
        }

        public async Task<string> CreateProject(UserPostModel dto)
        {
            var userId = GetCurrentUserId();
            dto.User_Id = userId;

            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                ConversationType = "Group",
                GroupName = dto.Project_Title,
                Created_Timestamp = DateTime.UtcNow,
                Participants = new List<ConversationParticipant>
                {
                    new ConversationParticipant
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Role = "Admin"
                    }
                }
            };

            var project = new UserProject
            {
                Id = Guid.NewGuid(),
                User_Id = userId,
                Conversation_Id = conversation.Id,
                Created_Timestamp = DateTime.UtcNow,
                Record_State = "Active",
                User_Status = "Offline"
            };

            var description = new ProjectDescription
            {
                Id = Guid.NewGuid(),
                Project_Id = project.Id,
                Team_Name = dto.Team_Name,
                Project_Type = dto.Project_Type,
                Project_Title = dto.Project_Title,
                Description = dto.Project_Description,
                Budget = dto.Budget,
                Project_Timeline = dto.Project_Timeline,
                Project_Visibility = dto.Project_Visibility,
                Project_Status = dto.Project_Status,
                Team_Size = dto.Team_Size,
                Experience_Level = dto.Experience_Level,
                Start_Date = dto.Start_Date,
                End_Date = dto.End_Date,
                Created_At = DateTime.UtcNow,
                Record_State = "Active"
            };

            var adminMember = new ProjectTeamMembers
            {
                Id = Guid.NewGuid(),
                Project_Id = project.Id,
                User_Id = userId,
                Member_Role = "Admin",
                Is_Admin = true,
                Created_At = DateTime.UtcNow,
                Record_State = "Active"
            };

            var projectSkills = new List<ProjectSkill>();

            if (dto.SkillsHave != null)
            {
                projectSkills.AddRange(dto.SkillsHave
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Select(skill => new ProjectSkill
                    {
                        Id = Guid.NewGuid(),
                        Project_Id = project.Id,
                        Skill_Name = skill.Trim(),
                        Skill_Type = "Have"
                    }));
            }

            if (dto.SkillsNeed != null)
            {
                projectSkills.AddRange(dto.SkillsNeed
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Select(skill => new ProjectSkill
                    {
                        Id = Guid.NewGuid(),
                        Project_Id = project.Id,
                        Skill_Name = skill.Trim(),
                        Skill_Type = "Need"
                    }));
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _unitOfWork.Conversation.AddAsync(conversation);
                await _unitOfWork.UserProject.AddAsync(project);
                await _unitOfWork.ProjectDescription.AddAsync(description);
                await _unitOfWork.ProjectTeamMembers.AddAsync(adminMember);

                if (projectSkills.Any())
                    await _unitOfWork.ProjectSkill.AddRangeAsync(projectSkills);

                await _unitOfWork.SaveAllAsync();
                await _unitOfWork.CommitTransactionAsync();

                return "Project created successfully.";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<GetProjectListResponse> GetAllPosts(FilterModel request)
        {
            request.PageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
            request.PageSize = request.PageSize <= 0 ? 10 : request.PageSize;

            if (request.User_Id == null)
            {
                request.User_Id = GetCurrentUserId();
            }

            var descriptions = await _unitOfWork.ProjectDescription
                .FindAsync(d => d.Record_State == "Active");

            descriptions = request.IsDescending
                ? descriptions.OrderByDescending(d => d.Created_At)
                : descriptions.OrderBy(d => d.Created_At);

            int totalCount = descriptions.Count();

            var pagedDescriptions = descriptions
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            if (!pagedDescriptions.Any())
            {
                return new GetProjectListResponse
                {
                    TotalCount = 0,
                    TotalPages = 0,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    Projects = new List<ProjectListItemDto>()
                };
            }

            var projectIds = pagedDescriptions.Select(d => d.Project_Id).ToList();

            var skills = await _unitOfWork.ProjectSkill.FindAsync(s => projectIds.Contains(s.Project_Id));
            var likes = await _unitOfWork.ProjectLike.FindAsync(l => projectIds.Contains(l.Project_Id));
            var comments = await _unitOfWork.ProjectComment.FindAsync(c => projectIds.Contains(c.Project_Id));
            var links = await _unitOfWork.ResourseLinks.FindAsync(r => projectIds.Contains(r.Project_Id));
            var teamMembers = await _unitOfWork.ProjectTeamMembers.FindAsync(t => projectIds.Contains(t.Project_Id));

            var userIds = teamMembers.Select(t => t.User_Id)
                .Concat(comments.Select(c => c.User_Id))
                .Distinct()
                .ToList();

            var users = await _unitOfWork.Users.FindAsync(u => userIds.Contains(u.Id));

            var projects = pagedDescriptions.Select(desc =>
            {
                var projectId = desc.Project_Id;

                var admin = teamMembers
                    .FirstOrDefault(t => t.Project_Id == projectId && t.Is_Admin);

                var adminUser = users.FirstOrDefault(u => u.Id == admin?.User_Id);

                var projectLikes = likes.Where(l => l.Project_Id == projectId);
                var projectComments = comments.Where(c => c.Project_Id == projectId);
                var projectSkills = skills.Where(s => s.Project_Id == projectId);
                var projectLinks = links.Where(l => l.Project_Id == projectId);

                return new ProjectListItemDto
                {
                    Project_Id = projectId,
                    ProjectTitle = desc.Project_Title,
                    ProjectType = desc.Project_Type,
                    Description = desc.Description,
                    Budget = desc.Budget,
                    Timeline = desc.Project_Timeline,
                    TeamSize = desc.Team_Size,
                    ExperienceLevel = desc.Experience_Level,
                    Project_Status = desc.Project_Status,
                    Project_Visibility = desc.Project_Visibility,
                    CreatedAt = desc.Created_At,
                    Team_Name = desc.Team_Name,
                    Start_Date = desc.Start_Date,
                    End_Date = desc.End_Date,
                    User_Id = adminUser?.Id,
                    Author_Name = adminUser?.FullName ?? "Unknown",
                    Avtar_Name = adminUser?.Avtar_Name,
                    SkillsHave = projectSkills
                        .Where(s => s.Skill_Type == "Have")
                        .Select(s => s.Skill_Name)
                        .ToList(),
                    SkillsNeed = projectSkills
                        .Where(s => s.Skill_Type == "Need")
                        .Select(s => s.Skill_Name)
                        .ToList(),
                    LikeCount = projectLikes.Count(),
                    IsLiked = request.User_Id != null &&
                              projectLikes.Any(l => l.User_Id == request.User_Id),
                    CommentCount = projectComments.Count(),
                    Comments = projectComments.Select(c =>
                    {
                        var user = users.FirstOrDefault(u => u.Id == c.User_Id);
                        return new ProjectCommentModel
                        {
                            Comment_Id = c.Id,
                            User_Id = c.User_Id,
                            User_Name = user?.FullName ?? "Unknown",
                            Comment_Text = c.Comment_Text,
                            Created_At = c.Created_At
                        };
                    }).ToList(),
                    ResourceLinks = projectLinks.Select(l => l.Link).ToList()
                };
            }).ToList();

            return new GetProjectListResponse
            {
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize),
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                Projects = projects
            };
        }

        public async Task<string> LikeProjectPost(Guid projectId)
        {
            var userId = GetCurrentUserId();

            var userExists = await _unitOfWork.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return "Invalid user. User does not exist.";

            var projectExists = await _unitOfWork.UserProject.AnyAsync(p => p.Id == projectId);
            if (!projectExists)
                return "Invalid project. Project does not exist.";

            var existing = await _unitOfWork.ProjectLike
                .FirstOrDefaultAsync(l => l.Project_Id == projectId && l.User_Id == userId);

            if (existing == null)
            {
                await _unitOfWork.ProjectLike.AddAsync(new ProjectLike
                {
                    Id = Guid.NewGuid(),
                    Project_Id = projectId,
                    User_Id = userId
                });

                await _unitOfWork.SaveAllAsync();
                return "Liked";
            }
            else
            {
                _unitOfWork.ProjectLike.Delete(existing);
                await _unitOfWork.SaveAllAsync();
                return "Disliked";
            }
        }

        public async Task<string> AddResourceLink(CreateResourceLinkModel dto)
        {
            dto.User_Id = GetCurrentUserId();

            var projectExists = await _unitOfWork.UserProject
                .AnyAsync(p => p.Id == dto.Project_Id);

            if (!projectExists)
                return "Project not found";

            var link = new ResourseLinks
            {
                Id = Guid.NewGuid(),
                User_Id = dto.User_Id,
                Project_Id = dto.Project_Id,
                Link = dto.Link,
                Created_At = DateTime.UtcNow
            };

            await _unitOfWork.ResourseLinks.AddAsync(link);
            await _unitOfWork.SaveAllAsync();

            return "Resource link added successfully";
        }

        public async Task<string> UpdateProjectDescription(UpdateProjectDescriptionModel model)
        {
            var userId = GetCurrentUserId();

            var member = await _unitOfWork.ProjectTeamMembers
                .FirstOrDefaultAsync(t => t.Project_Id == model.ProjectId && t.User_Id == userId && t.Is_Admin == true);

            if (member == null)
                return "Only admin can update project description";

            var desc = await _unitOfWork.ProjectDescription
                .FirstOrDefaultAsync(d => d.Project_Id == model.ProjectId);

            if (desc == null)
                return "Project description not found";

            desc.Team_Name = model.Team_Name;
            desc.Project_Type = model.Project_Type;
            desc.Project_Title = model.Project_Title;
            desc.Description = model.Description;
            desc.Budget = model.Budget;
            desc.Project_Timeline = model.Project_Timeline;
            desc.Project_Visibility = model.Project_Visibility;
            desc.Project_Status = model.Project_Status;
            desc.Team_Size = model.Team_Size;
            desc.Experience_Level = model.Experience_Level;
            desc.Start_Date = model.Start_Date;
            desc.End_Date = model.End_Date;
            desc.Last_Edited_Timestamp = DateTime.UtcNow;

            await _unitOfWork.SaveAllAsync();
            return "Project description updated successfully";
        }

        public async Task<string> AddProjectTimeline(CreateTimelineModel dto)
        {
            dto.User_Id = GetCurrentUserId();

            var projectExists = await _unitOfWork.UserProject
                .AnyAsync(p => p.Id == dto.Project_Id);

            if (!projectExists)
                return "Project not found";

            var timeline = new ProjectTaskTimeline
            {
                Id = Guid.NewGuid(),
                User_Id = dto.User_Id,
                Project_Id = dto.Project_Id,
                TimeLine_Title = dto.TimeLine_Title,
                Date_TimeFrame = dto.Date_TimeFrame,
                Timeline_Description = dto.Timeline_Description,
                Created_At = DateTime.UtcNow,
                Record_State = "Active"
            };

            await _unitOfWork.ProjectTaskTimeline.AddAsync(timeline);
            await _unitOfWork.SaveAllAsync();

            return "Timeline item added successfully";
        }

        public async Task<string> AddCurrentTask(CreateTaskModel dto)
        {
            dto.User_Id = GetCurrentUserId();

            var projectExists = await _unitOfWork.UserProject
                .AnyAsync(p => p.Id == dto.Project_Id);

            if (!projectExists)
                return "Project not found";

            var task = new ProjectCurrentTasks
            {
                Id = Guid.NewGuid(),
                User_Id = dto.User_Id,
                Project_Id = dto.Project_Id,
                Task_Name = dto.Task_Name,
                Task_End_Date = dto.Task_End_Date,
                Is_Completed = false,
                Is_Trashed = false,
                Created_At = DateTime.UtcNow,
                Record_State = "Active"
            };

            await _unitOfWork.ProjectCurrentTasks.AddAsync(task);
            await _unitOfWork.SaveAllAsync();

            return "Task added successfully";
        }

        public async Task<List<TrendingSkillDto>> GetTrendingSkills()
        {
            var projectSkills = await _unitOfWork.ProjectSkill.GetAllAsync();
            var requestSkills = await _unitOfWork.ProjectDeveloperRequestSkill.GetAllAsync();

            var projectSkillDict = projectSkills
                .GroupBy(s => s.Skill_Name.Trim().ToLower())
                .ToDictionary(g => g.Key, g => g.Count());

            var developerSkillDict = requestSkills
                .GroupBy(s => s.Skill_Name.Trim().ToLower())
                .ToDictionary(g => g.Key, g => g.Count());

            var allSkillNames = projectSkillDict.Keys.Union(developerSkillDict.Keys);

            var trendingList = allSkillNames
                .Select(skillName => new TrendingSkillDto
                {
                    SkillName = CultureInfo.CurrentCulture.TextInfo.ToTitleCase(skillName),
                    ProjectCount = projectSkillDict.GetValueOrDefault(skillName, 0),
                    DeveloperCount = developerSkillDict.GetValueOrDefault(skillName, 0),
                    GrowthPercentage = CalculateGrowth(
                        projectSkillDict.GetValueOrDefault(skillName, 0),
                        developerSkillDict.GetValueOrDefault(skillName, 0))
                })
                .Where(x => x.ProjectCount > 0)
                .OrderByDescending(x => x.GrowthPercentage)
                .ThenByDescending(x => x.ProjectCount)
                .Take(6)
                .ToList();

            return trendingList;
        }

        public async Task<GetProjectListResponse> GetUserProjects()
        {
            var userId = GetCurrentUserId();

            var projects = await _unitOfWork.UserProject
                .GetQueryable()
                .Include(p => p.ProjectDescription)
                .Where(p =>
                    p.Record_State == "Active" &&
                    p.User_Id == userId)
                .OrderByDescending(p => p.Created_Timestamp)
                .ToListAsync();

            if (!projects.Any())
            {
                return new GetProjectListResponse
                {
                    TotalCount = 0,
                    TotalPages = 0,
                    PageNumber = 1,
                    PageSize = 0,
                    Projects = new List<ProjectListItemDto>()
                };
            }

            var projectIds = projects.Select(p => p.Id).ToList();

            var skills = await _unitOfWork.ProjectSkill
                .FindAsync(s => projectIds.Contains(s.Project_Id));

            var likes = await _unitOfWork.ProjectLike
                .FindAsync(l => projectIds.Contains(l.Project_Id));

            var comments = await _unitOfWork.ProjectComment
                .FindAsync(c => projectIds.Contains(c.Project_Id));

            var projectList = projects.Select(project =>
            {
                var description = project.ProjectDescription
                    ?.OrderByDescending(d => d.Created_At)
                    .FirstOrDefault();

                return new ProjectListItemDto
                {
                    Project_Id = project.Id,
                    ProjectTitle = description?.Project_Title,
                    ProjectType = description?.Project_Type,
                    Description = description?.Description,
                    Budget = description?.Budget,
                    Timeline = description?.Project_Timeline,
                    TeamSize = description.Team_Size,
                    ExperienceLevel = description?.Experience_Level,
                    Project_Status = description?.Project_Status,
                    Project_Visibility = description?.Project_Visibility,
                    CreatedAt = description?.Created_At ?? project.Created_Timestamp,
                    Team_Name = description?.Team_Name,
                    Start_Date = description?.Start_Date,
                    End_Date = description?.End_Date,
                    SkillsHave = skills
                        .Where(s => s.Project_Id == project.Id && s.Skill_Type == "Have")
                        .Select(s => s.Skill_Name)
                        .ToList(),
                    SkillsNeed = skills
                        .Where(s => s.Project_Id == project.Id && s.Skill_Type == "Need")
                        .Select(s => s.Skill_Name)
                        .ToList(),
                    LikeCount = likes.Count(l => l.Project_Id == project.Id),
                    CommentCount = comments.Count(c => c.Project_Id == project.Id)
                };
            }).ToList();

            return new GetProjectListResponse
            {
                TotalCount = projectList.Count,
                TotalPages = 1,
                PageNumber = 1,
                PageSize = projectList.Count,
                Projects = projectList
            };
        }

        public async Task<List<object>> GetDeveloperRequestsByProjectId(Guid projectId)
        {
            var userId = GetCurrentUserId();

            var isAdmin = await _unitOfWork.ProjectTeamMembers
                .AnyAsync(t => t.Project_Id == projectId && t.User_Id == userId && t.Is_Admin == true);

            if (!isAdmin)
                throw new UnauthorizedAccessException("Only admin can view developer requests");

            var requests = await _unitOfWork.ProjectDeveloperRequest
                .GetQueryable()
                .Include(r => r.User)
                .Include(r => r.ProjectDeveloperRequestSkill)
                .Where(r => r.Project_Id == projectId && r.Record_State == "Pending")
                .ToListAsync();

            if (!requests.Any())
                return new List<object>();

            return requests.Select(r => new
            {
                r.Id,
                r.Project_Id,
                r.User_Id,
                User_Name = r.User?.FullName ?? "Unknown",
                User_Email = r.User?.Email ?? "",
                r.Project_Interested_Text,
                r.Project_Experience_Text,
                r.Active_Hour,
                r.Created_At,
                Skills = r.ProjectDeveloperRequestSkill
                    .Select(s => s.Skill_Name)
                    .ToList()
            }).ToList<object>();
        }

        public async Task<string> HandleDeveloperRequest(Guid developerRequestId, bool isAccepted)
        {
            var adminUserId = GetCurrentUserId();

            var request = await _unitOfWork.ProjectDeveloperRequest
                .FirstOrDefaultAsync(r => r.Id == developerRequestId);

            if (request == null)
                return "Developer request not found";

            var admin = await _unitOfWork.ProjectTeamMembers
                .FirstOrDefaultAsync(t =>
                    t.Project_Id == request.Project_Id &&
                    t.User_Id == adminUserId &&
                    t.Is_Admin == true);

            if (admin == null)
                return "Only admin can accept or reject requests";

            var project = await _unitOfWork.UserProject
                .FirstOrDefaultAsync(p => p.Id == request.Project_Id);

            if (project == null)
                return "Project not found";

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                if (isAccepted)
                {
                    await _unitOfWork.ProjectTeamMembers.AddAsync(new ProjectTeamMembers
                    {
                        Id = Guid.NewGuid(),
                        Project_Id = request.Project_Id,
                        User_Id = request.User_Id,
                        Member_Role = "Developer",
                        Is_Admin = false,
                        Created_At = DateTime.UtcNow,
                        Record_State = "Active"
                    });

                    var alreadyInChat = await _unitOfWork.ConversationParticipant
                        .FirstOrDefaultAsync(cp =>
                            cp.ConversationId == project.Conversation_Id &&
                            cp.UserId == request.User_Id);

                    if (alreadyInChat == null)
                    {
                        await _unitOfWork.ConversationParticipant.AddAsync(
                            new ConversationParticipant
                            {
                                Id = Guid.NewGuid(),
                                ConversationId = project.Conversation_Id,
                                UserId = request.User_Id,
                                Role = "Member"
                            });
                    }

                    request.Record_State = "Accepted";
                }
                else
                {
                    request.Record_State = "Rejected";
                }

                request.Last_Edited_Timestamp = DateTime.UtcNow;

                await _unitOfWork.SaveAllAsync();
                await _unitOfWork.CommitTransactionAsync();

                return isAccepted
                    ? "Developer request accepted and added to group chat"
                    : "Developer request rejected";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return $"Error handling developer request: {ex.Message}";
            }
        }
        public async Task<string> PatchCurrentTask(PatchCurrentTaskModel dto)
        {
            var userId = GetCurrentUserId();

            var task = await _unitOfWork.ProjectCurrentTasks
                .FirstOrDefaultAsync(t =>
                    t.Id == dto.Task_Id &&
                    t.Record_State == "Active");

            if (task == null)
                return "Task not found";

            if (task.User_Id != userId)
                return "You are not allowed to update this task";

            if (dto.Task_Name != null)
                task.Task_Name = dto.Task_Name;

            if (dto.Task_End_Date != null)
                task.Task_End_Date = dto.Task_End_Date;

            if (dto.Is_Completed != null)
                task.Is_Completed = dto.Is_Completed.Value;

            if (dto.Is_Trashed != null)
                task.Is_Trashed = dto.Is_Trashed.Value;

            await _unitOfWork.SaveAllAsync();

            return "Task updated successfully";
        }

        public async Task<string> CommentOnProject(Guid projectId, string comment)
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(comment))
                return "Comment cannot be empty.";

            var userExists = await _unitOfWork.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return "Invalid user. User does not exist.";

            var projectExists = await _unitOfWork.UserProject.AnyAsync(p => p.Id == projectId);
            if (!projectExists)
                return "Invalid project. Project does not exist.";

            await _unitOfWork.ProjectComment.AddAsync(new ProjectComment
            {
                Id = Guid.NewGuid(),
                Project_Id = projectId,
                Project = null,
                User_Id = userId,
                Comment_Text = comment.Trim(),
                Created_At = DateTime.UtcNow
            });

            await _unitOfWork.SaveAllAsync();

            return "Comment added";
        }

        private int CalculateGrowth(int projectCount, int developerCount)
        {
            if (developerCount == 0)
                return Math.Min(projectCount * 5, 100);

            double ratio = (double)projectCount / developerCount;
            double growth = ratio * 100;

            return (int)Math.Min(Math.Round(growth), 100);
        }
    }
}