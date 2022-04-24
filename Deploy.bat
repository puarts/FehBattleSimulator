@echo off
call %~dp0DeployImpl.bat Main FehBattleSimulator
call %~dp0DeployImpl.bat SummonerDuelsSimulatorMain FehSummonerDuelsSimulator

pause
