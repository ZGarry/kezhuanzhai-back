@echo off
setlocal EnableDelayedExpansion

:: Setup Ctrl+C handler
echo Setting up signal handler...
call :cleanup 2>nul
goto :start

:cleanup
echo Shutting down all services...
:: Close processes from PID file
if exist pid.txt (
  for /f "tokens=*" %%i in (pid.txt) do (
    taskkill /F /PID %%i >nul 2>&1
  )
  :: 添加延迟确保进程已完全终止
  timeout /t 1 /nobreak > nul
  del /f /q pid.txt 2>nul
)
:: Make sure all related processes are closed
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq python*" >nul 2>&1
echo All services stopped!
exit /b

:start
echo Starting services...

:: 确保PID文件不存在
if exist pid.txt del /f /q pid.txt 2>nul
:: 等待一小段时间确保文件系统完全释放文件
timeout /t 1 /nobreak > nul

:: 创建PID文件
(echo.) > pid.txt 2>nul
if not exist pid.txt (
  echo ERROR: Cannot create PID file. Please close any programs using it.
  exit /b 1
)

:: 删除旧的日志文件
if exist python_output.log del /f /q python_output.log

:: 设置Python编码环境变量
set PYTHONIOENCODING=utf-8
:: 使用chcp设置控制台代码页为UTF-8
chcp 65001 > nul

:: Start Python backend with UTF-8 encoding
start /B cmd /c "set PYTHONIOENCODING=utf-8 && python api_server.py > python_output.log 2>&1"
:: Get and save Python process ID
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /nh') do (
    echo %%a >> pid.txt
)

:: Wait 2 seconds to ensure backend is running
timeout /t 2 /nobreak > nul

:: Enter frontend directory and start Next.js
cd CLong
if exist frontend_output.log del /f /q frontend_output.log
start /B cmd /c "npm run dev > frontend_output.log 2>&1"
:: Get and save node process ID
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /nh') do (
    echo %%a >> ..\pid.txt
)
cd ..

echo Services started! Press Ctrl+C to stop all services.
echo.
echo Logs are available at:
echo - Backend: python_output.log
echo - Frontend: CLong/frontend_output.log
echo.
echo Press Ctrl+C to exit...

:wait_loop
:: Detect Ctrl+C
timeout /t 2 >nul
if errorlevel 1 (
    call :cleanup
    exit /b
)
goto wait_loop 