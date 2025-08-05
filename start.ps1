taskkill /f /im ollama.exe
net stop winnat
net start winnat
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden