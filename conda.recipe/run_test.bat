"%PREFIX%\Scripts\npm.cmd" install -g npm@latest --no-spin
"%PREFIX%\Scripts\npm.cmd" install . --no-spin --no-progress
"%PREFIX%\Scripts\npm.cmd" run test --no-progress --no-spin
if errorlevel 1 exit 1
