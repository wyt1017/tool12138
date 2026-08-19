$token = & gh auth token 2>$null
$authHeader = "Bearer $token"
$headers = @{
    Authorization = $authHeader
    Accept = "application/vnd.github.v3+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}
$repo = "wyt1017/tool12138"
$baseSha = "9d01f6bdc30de5bfbe8d1adbab554a64e5a8b49a"
$excludedPrefixes = @("node_modules/", ".git/", "dist/", ".vite-cache/")

function ShouldExclude {
    param($path)
    foreach ($p in $excludedPrefixes) {
        if ($path.StartsWith($p)) { return $true }
    }
    return $false
}

# Get changed/deleted files
$updatedPaths = git diff --name-only $baseSha HEAD
$deletedPaths = git diff --diff-filter=D --name-only $baseSha HEAD

$blobShaMap = @{}

# Upload blobs for all updated files
foreach ($path in $updatedPaths) {
    if (ShouldExclude $path) { continue }
    if ($deletedPaths -contains $path) {
        $blobShaMap[$path] = $null
        continue
    }
    $content = [System.IO.File]::ReadAllText($path)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)
    $body = @{ content = $base64; encoding = "base64" } | ConvertTo-Json -Compress
    $resp = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/git/blobs" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $blobShaMap[$path] = $resp.sha
    Write-Host "Uploaded: $path"
}

# Get base tree via API (no --jq, parse manually)
$treeApiUrl = "https://api.github.com/repos/$repo/git/trees/$baseSha?recursive=1"
$treeRaw = Invoke-RestMethod -Uri $treeApiUrl -Headers $headers
$baseTree = $treeRaw.tree

$updatedSet = @{}
foreach ($p in $updatedPaths) { $updatedSet[$p] = $true }
foreach ($p in $deletedPaths) { $updatedSet[$p] = $true }

# Build tree entries
$treeEntries = @()
foreach ($entry in $baseTree) {
    $p = $entry.path
    if ($updatedSet.ContainsKey($p)) {
        if ($blobShaMap[$p]) {
            $treeEntries += @{ path = $p; mode = $entry.mode; type = $entry.type; sha = $blobShaMap[$p] }
        }
    } else {
        $treeEntries += @{ path = $p; mode = $entry.mode; type = $entry.type; sha = $entry.sha }
    }
}

# Create tree
$treeBody = @{ base_tree = $baseSha; tree = $treeEntries } | ConvertTo-Json -Depth 10 -Compress
$treeResp = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/git/trees" -Method Post -Headers $headers -Body $treeBody -ContentType "application/json"
$treeSha = $treeResp.tree.sha
Write-Host "Tree SHA: $treeSha"

# Create commit
$parentSha = $baseSha
$commitBody = @{
    message = "fix: lint修复、CodeRunner防抖优化、科学计算器阶乘按钮修复"
    tree = $treeSha
    parents = @($parentSha)
} | ConvertTo-Json -Compress
$commitResp = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/git/commits" -Method Post -Headers $headers -Body $commitBody -ContentType "application/json"
$commitSha = $commitResp.sha
Write-Host "Commit SHA: $commitSha"

# Update branch
$refBody = @{ sha = $commitSha; force = $true } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/git/refs/heads/main" -Method Patch -Headers $headers -Body $refBody -ContentType "application/json"
Write-Host "Done! https://github.com/wyt1017/tool12138/commit/$commitSha"
