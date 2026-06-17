!macro customInit
  nsExec::ExecToStack 'taskkill /F /IM "Gollino M.E.exe"'
  ClearErrors
!macroend

!macro customUnInstallCheck
  ClearErrors
!macroend
