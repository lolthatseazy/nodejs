while not game:GetService("Players").LocalPlayer do task.wait() end

getgenv().Players = game:GetService("Players")

getgenv().LocalPlayer = Players.LocalPlayer
getgenv().Character = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()

task.spawn(function()
    getgenv().Humanoid = getgenv().Character:WaitForChild("Humanoid", 9e9)
    getgenv().HumanoidRootPart = getgenv().Character:WaitForChild("HumanoidRootPart", 9e9)
end)

getgenv().ReplicatedStorage = cloneref(game:GetService("ReplicatedStorage"))
getgenv().HumanoidRootPart = getgenv().Character:FindFirstChild("HumanoidRootPart")

LocalPlayer.CharacterAdded:Connect(function(Char)
    getgenv().Character = Char
    getgenv().Humanoid = Char:WaitForChild("Humanoid")
end)

getgenv().JoinJobId = function(JobId)
    game:GetService("TeleportService"):TeleportToPlaceInstance(game.PlaceId, JobId)
end

getgenv().Rejoin = function()
    game:GetService("TeleportService"):TeleportToPlaceInstance(game.PlaceId, game.JobId)
end

getgenv().DeepScan = function(Root, Predicate)
	local Visited = {}

	local function Scan(Value, Path)
		if typeof(Value) == "table" then
			if Visited[Value] then
				return
			end

			Visited[Value] = true

			for K, V in pairs(Value) do
				local Result = Scan(V, Path .. "[" .. tostring(K) .. "]")
				if Result then
					return Result
				end
			end
		elseif typeof(Value) == "string" then
			return Predicate(Value, Path)
		end
	end

	return Scan(Root, "")
end

task.spawn(function()
  local Visited = {}

  local function ScanStrings(x, path)
    if typeof(x) == "table" then
      if Visited[x] then return end
      Visited[x] = true
      for k, v in pairs(x) do
        ScanStrings(v, path .. "[" .. tostring(k) .. "]")
      end
    elseif typeof(x) == "string" then
      warn(x, path)
    end
  end

  getgenv().ScanStrings = ScanStrings
end)

getgenv().DumpServerPaths = function()
    local MarketplaceService = game:GetService("MarketplaceService")
    local Players = game:GetService("Players")
    local StarterGui = game:GetService("StarterGui")
    local Success, ProductInfo = pcall(function()
       return MarketplaceService:GetProductInfo(game.PlaceId)
    end)
    local GameName = (Success and ProductInfo and ProductInfo.Name or "UnknownGame"):gsub("[%c%p%s]", "")
    local FileName = GameName .. "-ServerPaths.txt"
    writefile(FileName, "")

    local AttemptArgs = {
      {Desc = "Players", Args = {Players}},
      {Desc = "{}", Args = {{}}},
      {Desc = "1", Args = {1}},
      {Desc = "no args", Args = {}},
    }

    local function ExtractErrorFields(err)
      local fields = {}
      for field in string.gmatch(err, "'([^']+)'") do
        fields[field] = true
      end
      local list = {}
      for k in pairs(fields) do
        table.insert(list, k)
      end
      return list
    end

    local tasks = {}

    for _, Remote in ipairs(game:GetDescendants()) do
      if Remote:IsA("RemoteFunction") then
        local t = task.spawn(function()
          for _, Attempt in ipairs(AttemptArgs) do
            local Success, Err = pcall(function()
              return Remote:InvokeServer(unpack(Attempt.Args))
            end)
            if not Success and Err and Err:find("Server") then
              local fields = ExtractErrorFields(Err)
              local fieldStr = #fields > 0 and "(" .. table.concat(fields, ", ") .. ")" or ""
              local logEntry = ("[%s]\n%s\n%s\n\n"):format(
                Remote:GetFullName(),
                fieldStr,
                Err
              )
              appendfile(FileName, logEntry)
              warn("Logged:", Remote:GetFullName())
            end
          end
        end)
        table.insert(tasks, t)
      end
    end

    for _, t in ipairs(tasks) do
        task.wait(0)
        while coroutine.status(t) ~= "dead" do
          task.wait()
        end
    end

    StarterGui:SetCore("SendNotification", {
      Title = "Server Path Dumper",
      Text = "Done",
      Duration = 5,
    })
end

getgenv().ReplicatedFirst = cloneref(game:GetService("ReplicatedFirst"))

if not gethui or not gethui() then
    local CoreGui = cloneref(game:GetService("CoreGui"))
    local SafeUI = cloneref(CoreGui:WaitForChild("RobloxGui", 9e9))

    local GetHUI = newcclosure(function()
        return SafeUI
    end, "gethui")

    getgenv().get_hidden_gui = GetHUI
    getgenv().gethui = GetHUI
end

getgenv().BAdonis = function()
	  loadstring(game:HttpGet("https://raw.githubusercontent.com/Pixeluted/adoniscries/refs/heads/main/Source.lua"))()
end

getgenv().Check = function(Str: String, ReturnFullPath: Boolean?)
    for _, Instance in pairs(game:GetDescendants()) do
        if string.find(Instance:GetFullName():lower(), Str:lower()) then
            return ReturnFullPath and Instance:GetFullName() or true
        end
    end
    return false
end

getgenv().Hook = function(Target: Instance, Method: string, Callback: ((...any) -> any)?)
    local original
    original = hookmetamethod(game, "__namecall", function(self, ...)
        local name = getnamecallmethod()
        if rawequal(self, Target) and name == Method then
            warn("hooked", name, ...)
            if Callback then
                return Callback(self, ...)
            else
                return task.wait(9e9)
            end
        end
        return original(self, ...)
    end)
    return original
end

getgenv().Sit = function(Target: Instance)
    if LocalPlayer and Character then
        if typeof(Target) == "Seat" then
            Target:Sit(getgenv().Humanoid)
        end
    end
end

getgenv().saveinstance = function()
    local synsaveinstance = loadstring(game:HttpGet("https://raw.githubusercontent.com/lolthatseazy/Terrain-Saveinstance/main/saveinstance.luau", true))()
    synsaveinstance({})
end
