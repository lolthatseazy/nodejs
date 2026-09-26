while not game:GetService("Players").LocalPlayer do
    task.wait()
end

local ExecutorENV = getgenv()

ExecutorENV.Players = cloneref(game:GetService("Players"))

ExecutorENV.LocalPlayer = Players.LocalPlayer
ExecutorENV.Character = LocalPlayer.Character

task.spawn(function()
    if not ExecutorENV.Character then
        ExecutorENV.Character = LocalPlayer.CharacterAdded:Wait()
    end

    ExecutorENV.Humanoid = ExecutorENV.Character:WaitForChild("Humanoid", 9e9)
    ExecutorENV.HumanoidRootPart = ExecutorENV.Character:WaitForChild("HumanoidRootPart", 9e9)
end)

ExecutorENV.MarketplaceService = cloneref(game:GetService("MarketplaceService"))
ExecutorENV.ReplicatedStorage = cloneref(game:GetService("ReplicatedStorage"))
ExecutorENV.TeleportService = cloneref(game:GetService("TeleportService"))
ExecutorENV.ReplicatedFirst = cloneref(game:GetService("ReplicatedFirst"))
ExecutorENV.ScriptContext = cloneref(game:GetService("ScriptContext"))
ExecutorENV.GuiService = cloneref(game:GetService("GuiService"))
ExecutorENV.StarterGui = cloneref(game:GetService("StarterGui"))
ExecutorENV.CoreGui = cloneref(game:GetService("CoreGui"))

LocalPlayer.CharacterAdded:Connect(function(Character)
    ExecutorENV.Character = Character
    ExecutorENV.Humanoid = Character:WaitForChild("Humanoid")
    ExecutorENV.HumanoidRootPart = Character:WaitForChild("HumanoidRootPart", 9e9)
end)

ExecutorENV.ClearError = function(Kick)
    if Kick then
        LocalPlayer:Kick()
    end

    GuiService:ClearError()
end

ExecutorENV.JoinJobId = function(JobId)
    TeleportService:TeleportToPlaceInstance(game.PlaceId, JobId)
end

ExecutorENV.IsFromPath = function(Func, Path)
    if not Func then
        return
    end
    Path = Path or "ReplicatedFirst.LocalScript"

    return debug.info(Func, "s"):find(Path, 1, true) and true or false
end

ExecutorENV.Rejoin = function()
    TeleportService:TeleportToPlaceInstance(game.PlaceId, game.JobId)
end

ExecutorENV.DeepScan = function(Root, Predicate)
    local Visited = {}

    local function Scan(Value, Path)
        if typeof(Value) == "table" then
            if Visited[Value] then
                return
            end

            Visited[Value] = true

            for Key, Value in pairs(Value) do
                local Result = Scan(Value, Path .. "[" .. tostring(Key) .. "]")

                if Result then
                    return Result
                end
            end
        elseif typeof(Value) == "string" then
            return Predicate(Value, Path)
        end
    end

    local Value = Scan(Root, "")

    table.clear(Visited)

    return Value
end

task.spawn(function()
    local Visited = {}

    local function IsLPHTable(Table)
        for Index = 45, 190 do
            if rawget(Table, Index) ~= string.char(Index) then
                return false
            end
        end

        return true
    end

    local function ScanStringsInternal(Value, Path)
        Path = Path or ""

        if type(Value) == "table" then
            if Visited[Value] then
                return
            end

            Visited[Value] = true

            if not IsLPHTable(Value) then
                for Key, ChildValue in pairs(Value) do
                    ScanStringsInternal(ChildValue, Path .. "[" .. tostring(Key) .. "]")
                end
            end
        elseif type(Value) == "string" then
            print(Value, Path)
        end
    end

    ExecutorENV.ScanStrings = function(...)
        local Value = ScanStringsInternal(...)

        table.clear(Visited)

        return Value
    end
end)

ExecutorENV.DumpServerPaths = function()
    local Success, ProductInfo = pcall(function()
        return MarketplaceService:GetProductInfo(game.PlaceId)
    end)

    local GameName = (Success and ProductInfo and ProductInfo.Name or "UnknownGame"):gsub("[%c%p%s]", "")
    local FileName = GameName .. "-ServerPaths.txt"

    writefile(FileName, "")

    local AttemptArgs = {
        {
            Desc = "Players",
            Args = {Players}
        },
        {
            Desc = "{}",
            Args = {{}}
        },
        {
            Desc = "1",
            Args = {1}
        },
        {
            Desc = "no args",
            Args = {}
        }
    }

    local function ExtractErrorFields(Error)
        local Fields = {}

        for Field in string.gmatch(Error, "'([^']+)'") do
            Fields[Field] = true
        end

        local List = {}

        for Key in pairs(Fields) do
            table.insert(List, Key)
        end

        return List
    end

    local Tasks = {}

    for _, Remote in ipairs(game:GetDescendants()) do
        if Remote:IsA("RemoteFunction") then
            local Thread = task.spawn(function()
                for _, Attempt in ipairs(AttemptArgs) do
                    local Success, Error = pcall(function()
                        return Remote:InvokeServer(table.unpack(Attempt.Args))
                    end)

                    if not Success and Error and Error:find("Server") then
                        local Fields = ExtractErrorFields(Error)
                        local FieldString = #Fields > 0 and "(" .. table.concat(Fields, ", ") .. ")" or ""

                        local LogEntry = ("[%s]\n%s\n%s\n\n"):format(
                            Remote:GetFullName(),
                            FieldString,
                            Error
                        )

                        appendfile(FileName, LogEntry)
                        warn("Logged:", Remote:GetFullName())
                    end
                end
            end)

            table.insert(Tasks, Thread)
        end
    end

    for _, Thread in ipairs(Tasks) do
        task.wait()

        while coroutine.status(Thread) ~= "dead" do
            task.wait()
        end
    end

    StarterGui:SetCore("SendNotification", {
        Title = "Server Path Dumper",
        Text = "Done",
        Duration = 5
    })
end

if not gethui or not gethui() then
    local SafeUI = cloneref(CoreGui:WaitForChild("RobloxGui", 9e9))

    local GetHUI = newcclosure(function()
        return SafeUI
    end, "gethui")

    ExecutorENV.GetHiddenGui = GetHUI
    ExecutorENV.GetHUI = GetHUI
end

if not getdeletedactors and not get_deleted_actors and getactorstates then
    local GetDeletedActors = function()
        local ActorStates = assert(getactorstates(), "No active actor state")
        
        local DeletedActors = {}

        for _, A in ipairs(ActorStates) do
            local Actors = A:GetActors()
            
            for _,v in pairs(Actors) do
                if not v:IsDescendantOf(game) then
                    table.insert(DeletedActors, v)
                end
            end
        end

        return DeletedActors
    end

    for _,v in ipairs({"getdeletedactors", "get_deleted_actors"}) do 
        ExecutorENV[v] = GetDeletedActors
    end
end

ExecutorENV.CloneAsTable = function(Instance)
    return table.clone(getproperties(Instance))
end

ExecutorENV.BAdonis = function()
    loadstring(game:HttpGet("https://raw.githubusercontent.com/Pixeluted/adoniscries/refs/heads/main/Source.lua"))()
end

ExecutorENV.Check = function(String: String, ReturnFullPath: Boolean?)
    for _, Instance in pairs(game:GetDescendants()) do
        if string.find(Instance:GetFullName():lower(), String:lower()) then
            return ReturnFullPath and Instance:GetFullName() or true
        end
    end

    return false
end

ExecutorENV.Sit = function(Target: Instance)
    if LocalPlayer and Character then
        if Target:IsA("Seat") or Target:IsA("VehicleSeat") then
            if pcall(replicatesignal, Target.RemoteCreateSeatWeld, Humanoid) then
                return
            end
            Target:Sit(ExecutorENV.Humanoid)
        end
    end
end

ExecutorENV.IY = function()
    loadstring(game:HttpGet("https://raw.githubusercontent.com/EdgeIY/infiniteyield/refs/heads/master/source"))()
end
