# How to Push Your Code to GitHub

Your code is ready to push! GitHub is blocking command-line pushes due to repository protection settings.

## Option 1: Use GitHub Desktop (Easiest)

1. **Download GitHub Desktop** (if not installed): https://desktop.github.com/
2. Open GitHub Desktop
3. Click `File` → `Add Local Repository`
4. Browse to: `I:\Study_Mate-main`
5. Click `Publish repository` or `Push origin`
6. Your code will be uploaded! ✅

## Option 2: Disable Branch Protection Then Push

1. Go to: https://github.com/Rishikesh103/StudyMate/settings
2. Click **Branches** in left sidebar
3. Find "Branch protection rules" section
4. **Delete** any rules for `main` branch
5. Come back and run:
   ```powershell
   cd I:\Study_Mate-main
   git push -u origin main --force
   ```

## Option 3: Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click `Generate new token (classic)`
3. Give it a name: "StudyMate Push"
4. Check `repo` permission
5. Click `Generate token`
6. **Copy the token** (you won't see it again!)
7. Run this command (replace YOUR_TOKEN):
   ```powershell
   git remote set-url origin https://YOUR_TOKEN@github.com/Rishikesh103/StudyMate.git
   git push -u origin main --force
   ```

## What's Already Done

✅ Git repository initialized  
✅ All files committed with message: "Fix: MongoDB connection issues - Added retry logic, fixed URI, removed 27 duplicate indexes"  
✅ Remote set to: https://github.com/Rishikesh103/StudyMate.git  
✅ Branch renamed to `main`  

**All you need to do is push the code using one of the options above!**
