# Git Push Fix – Remote Has Existing Commits

## Problem
Your local branch is `master`, remote expects `main`, and the remote already has commits.

## Solution (run these commands one by one)

```powershell
# 1. Rename local branch from master to main
git branch -M main

# 2. Pull remote changes first (this is important)
git pull origin main --rebase

# 3. Now push (this should succeed)
git push -u origin main
```

## If the pull shows conflicts

Just open the conflicted files, resolve them manually, then:

```powershell
git add .
git rebase --continue
git push -u origin main
```

## Alternative (only if you're 100% sure you want to overwrite the remote)

```powershell
git push --force origin main
```

**Not recommended** unless you are certain the remote content is not needed.

## After successful push

Go to GitHub → Settings → Pages → Deploy from branch → main / root

Then your site will be live at:
https://alex-yap.github.ecodesamsung.com/stocklevelcheck
