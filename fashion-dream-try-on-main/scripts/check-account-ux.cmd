@echo off
setlocal
cd /d "%~dp0.."

echo.
echo [WEARO] Running account UX regression checks...
echo Project: %CD%
echo.

call npm run test:account-ux
set "RESULT=%ERRORLEVEL%"

echo.
if "%RESULT%"=="0" (
  echo [PASS] Account UX checks completed successfully.
) else (
  echo [FAIL] Account UX checks failed with exit code %RESULT%.
)

exit /b %RESULT%
