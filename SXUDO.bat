@echo off
cd /d "C:\Users\khara\OneDrive\Desktop\SXUDO"
call "C:\Users\khara\OneDrive\Desktop\SXUDO\sxudo-env\Scripts\activate.bat"
uvicorn app.main:app --reload
pause
